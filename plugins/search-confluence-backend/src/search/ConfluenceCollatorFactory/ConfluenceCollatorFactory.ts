import { Config } from '@backstage/config';
import {
  DocumentCollatorFactory,
  IndexableDocument,
} from '@backstage/plugin-search-common';
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import { Readable } from 'stream';
import { Logger } from 'winston';
import {
  ConfluenceDocument,
  ConfluenceDocumentList,
  IndexableAncestorRef,
  IndexableConfluenceDocument,
} from './types';

type ConfluenceCollatorOptions = {
  logger: Logger;

  parallelismLimit: number;

  wikiUrl: string;
  spaces: string[];
  auth: {
    username?: string;
    password?: string;
    pat?: string;
  };
};

export interface UserEntityDocument extends IndexableDocument {
  kind: string;
  login: string;
  email: string;
}

export class ConfluenceCollatorFactory implements DocumentCollatorFactory {
  public readonly type: string = 'confluence';

  private readonly logger: Logger;

  private readonly parallelismLimit: number;
  private readonly wikiUrl: string;
  private readonly spaces: string[];
  private readonly auth: { username?: string; password?: string; pat?: string };

  static fromConfig(
    config: Config,
    options: {
      logger: Logger;
      parallelismLimit?: number;
    },
  ) {
    if (config.getOptionalString('confluence.auth.pat')) {
      return new ConfluenceCollatorFactory({
        logger: options.logger,
        parallelismLimit: options.parallelismLimit || 15,
        wikiUrl: config.getString('confluence.wikiUrl'),
        spaces: config.getStringArray('confluence.spaces'),
        auth: {
          pat: config.getOptionalString('confluence.auth.pat'),
        },
      });
    }
    return new ConfluenceCollatorFactory({
      logger: options.logger,
      parallelismLimit: options.parallelismLimit || 15,
      wikiUrl: config.getString('confluence.wikiUrl'),
      spaces: config.getStringArray('confluence.spaces'),
      auth: {
        username: config.getOptionalString('confluence.auth.username'),
        password: config.getOptionalString('confluence.auth.password'),
      },
    });
  }

  private constructor(options: ConfluenceCollatorOptions) {
    this.logger = options.logger;

    this.parallelismLimit = options.parallelismLimit;
    this.wikiUrl = options.wikiUrl;
    this.spaces = options.spaces;
    this.auth = options.auth;
  }

  async getCollator() {
    return Readable.from(this.execute());
  }

  private async *execute(): AsyncGenerator<IndexableConfluenceDocument> {
    const spacesList = await this.getSpaces();
    const documentsList = await this.getDocumentsFromSpaces(spacesList);

    const limit = pLimit(this.parallelismLimit);
    const documentsInfo = documentsList.map(document =>
      limit(async () => {
        try {
          return this.getDocumentInfo(document);
        } catch (err) {
          this.logger.warn(`error while indexing document "${document}"`, err);
        }

        return [];
      }),
    );

    const safePromises = documentsInfo.map(promise =>
      promise.catch(error => {
        this.logger.warn(error);

        return [];
      }),
    );

    const documents = (await Promise.all(safePromises)).flat();

    for (const document of documents) {
      yield document;
    }
  }

  private async getSpaces(): Promise<string[]> {
    return this.spaces;
  }

  private async getDocumentsFromSpaces(spaces: string[]): Promise<string[]> {
    const documentsList = [];

    for (const space of spaces) {
      documentsList.push(...(await this.getDocumentsFromSpace(space)));
    }

    return documentsList;
  }

  private async getDocumentsFromSpace(space: string): Promise<string[]> {
    const documentsList = [];

    this.logger.info(`exploring space ${space}`);

    let next = true;
    let requestUrl = `${this.wikiUrl}/rest/api/content?limit=1000&status=current&spaceKey=${space}`;
    while (next) {
      const data = await this.get<ConfluenceDocumentList>(requestUrl);
      if (!data.results) {
        break;
      }

      documentsList.push(...data.results.map(result => result._links.self));

      if (data._links.next) {
        requestUrl = `${this.wikiUrl}${data._links.next}`;
      } else {
        next = false;
      }
    }

    return documentsList;
  }

  private async getDocumentInfo(
    documentUrl: string,
  ): Promise<IndexableConfluenceDocument[]> {
    this.logger.debug(`fetching document content ${documentUrl}`);

    const data = await this.get<ConfluenceDocument>(
      `${documentUrl}?expand=body.storage,space,ancestors,version`,
    );
    if (!data.status || data.status !== 'current') {
      return [];
    }

    const ancestors: IndexableAncestorRef[] = [
      {
        title: data.space.name,
        location: `${this.wikiUrl}${data.space._links.webui}`,
      },
    ];

    data.ancestors.forEach(ancestor => {
      ancestors.push({
        title: ancestor.title,
        location: `${this.wikiUrl}${ancestor._links.webui}`,
      });
    });

    return [
      {
        title: data.title,
        text: this.stripHtml(data.body.storage.value),
        location: `${this.wikiUrl}${data._links.webui}`,
        spaceKey: data.space.key,
        spaceName: data.space.name,
        ancestors: ancestors,
        lastModifiedBy: data.version.by.publicName,
        lastModified: data.version.when,
        lastModifiedFriendly: data.version.friendlyWhen,
      },
    ];
  }

  private async get<T = any>(requestUrl: string): Promise<T> {
    let base64Auth = Buffer.from(
      `${this.auth.username}:${this.auth.password}`,
      'utf-8',
    ).toString('base64');

    if (this.auth.pat) {
      base64Auth = this.auth.pat;
    }

    const res = await fetch(requestUrl, {
      method: 'get',
      headers: {
        Authorization: `Basic ${base64Auth}`,
      },
    });

    if (!res.ok) {
      this.logger.warn(
        'non-ok response from confluence',
        requestUrl,
        res.status,
        await res.text(),
      );

      throw new Error(`Request failed with ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }

  private stripHtml(input: string): string {
    return input.replace(/(<([^>]+)>)/gi, '');
  }
}
