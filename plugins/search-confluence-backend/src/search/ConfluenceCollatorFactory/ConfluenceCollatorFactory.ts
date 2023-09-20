import { Config } from '@backstage/config';
import { DocumentCollatorFactory, IndexableDocument } from '@backstage/plugin-search-common';
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { ConfluenceDocument, ConfluenceDocumentList, IndexableAncestorRef, IndexableConfluenceDocument } from './types';

type ConfluenceCollatorOptionsItem = {
  wikiUrl: string;
  spaces: string[];
  auth: {
      username: string;
      password: string;
  };
}
type ConfluenceCollatorOptions = {
    logger: Logger;
    parallelismLimit: number;
    sites: ConfluenceCollatorOptionsItem[];
}

export interface UserEntityDocument extends IndexableDocument {
    kind: string;
    login: string;
    email: string;

}

export class ConfluenceCollatorFactory implements DocumentCollatorFactory {
    public readonly type: string = 'confluence';

    private logger: Logger;

    private parallelismLimit: number;
    private sites: ConfluenceCollatorOptionsItem[];

    static fromConfig(
        config: Config,
        options: {
            logger: Logger,
            parallelismLimit?: number,
        },
    ) {
        const sites: any[] = config.getConfigArray('confluence.sites').map(c => ({
            wikiUrl: c.getString('wikiUrl'),
            spaces: c.getStringArray('spaces'),
            auth: {
                username: c.getString('auth.username'),
                password: c.getString('auth.password'),
            },
        }));
        return new ConfluenceCollatorFactory({
            logger: options.logger,
            sites: sites,
            parallelismLimit: options.parallelismLimit || 15,
        });
    }

    private constructor(options: ConfluenceCollatorOptions) {
        this.logger = options.logger;
        this.sites = options.sites;
        this.parallelismLimit = options.parallelismLimit;
    }

    async getCollator() {
        return Readable.from(this.execute());
    }

    private async *execute(): AsyncGenerator<IndexableConfluenceDocument> {
        for(const site of this.sites){
            const spacesList = await this.getSpaces(site);
            const documentsList = await this.getDocumentsFromSpaces(site, spacesList);

            const limit = pLimit(this.parallelismLimit);
            const documentsInfo = documentsList.map(document => limit(async () => {
                try {
                    return this.getDocumentInfo(site, document);
                } catch (err) {
                    this.logger.warn(`error while indexing document "${document}"`, err);
                }

                return [];
            }));

            const safePromises = documentsInfo.map(promise => promise.catch(error => {
                this.logger.warn(error);

                return [];
            }));

            const documents = (await Promise.all(safePromises)).flat();

            for (const document of documents) {
                yield document;
            }
        }
    }

    private async getSpaces(site: ConfluenceCollatorOptionsItem): Promise<string[]> {
        return site.spaces;
    }

    /*
    private async getSpaces(): Promise<string[]> {
        const data = await this.get(
            `${this.wikiUrl}/rest/api/space?&limit=1000&type=global&status=current`,
        );

        if (!data.results) {
            return [];
        }

        const spacesList = [];
        for (const result of data.results) {
            spacesList.push(result.key);
        }

        return spacesList;
    }
    */

    private async getDocumentsFromSpaces(site: ConfluenceCollatorOptionsItem, spaces: string[]): Promise<string[]> {
        const documentsList = [];

        for (const space of spaces) {
            documentsList.push(...(await this.getDocumentsFromSpace(site, space)));
        }

        return documentsList;
    }

    private async getDocumentsFromSpace(site: ConfluenceCollatorOptionsItem, space: string): Promise<string[]> {
        const documentsList = [];

        this.logger.info(`exploring space ${space}`);

        let next = true;
        let requestUrl = `${site.wikiUrl}/rest/api/content?limit=1000&status=current&spaceKey=${space}`;
        while (next) {
            const data = await this.get<ConfluenceDocumentList>(site, requestUrl);
            if (!data.results) {
                break;
            }

            documentsList.push(...data.results.map(result => result._links.self));

            if (data._links.next) {
                requestUrl = `${site.wikiUrl}${data._links.next}`;
            } else {
                next = false;
            }
        }

        return documentsList;
    }

    private async getDocumentInfo(site: ConfluenceCollatorOptionsItem, documentUrl: string): Promise<IndexableConfluenceDocument[]> {
        this.logger.debug(`fetching document content ${documentUrl}`);

        const data = await this.get<ConfluenceDocument>(site, `${documentUrl}?expand=body.storage,space,ancestors,version`);
        if (!data.status || data.status !== 'current') {
            return [];
        }

        const ancestors: IndexableAncestorRef[] = [
            {
                title: data.space.name,
                location: `${site.wikiUrl}${data.space._links.webui}`,
            },
        ];

        data.ancestors.forEach(ancestor => {
            ancestors.push({
                title: ancestor.title,
                location: `${site.wikiUrl}${ancestor._links.webui}`,
            });
        });

        return [{
            title: data.title,
            text: this.stripHtml(data.body.storage.value),
            location: `${site.wikiUrl}${data._links.webui}`,
            spaceKey: data.space.key,
            spaceName: data.space.name,
            ancestors: ancestors,
            lastModifiedBy: data.version.by.publicName,
            lastModified: data.version.when,
            lastModifiedFriendly: data.version.friendlyWhen
        }];
    }

    private async get<T = any>(site: ConfluenceCollatorOptionsItem, requestUrl: string): Promise<T> {
        const base64Auth = Buffer.from(`${site.auth.username}:${site.auth.password}`, 'utf-8').toString('base64');
        const res = await fetch(requestUrl, {
            method: 'get',
            headers: {
                Authorization: `Basic ${base64Auth}`,
            },
        });

        if (!res.ok) {
            this.logger.warn('non-ok response from confluence', requestUrl, res.status, await res.text());

            throw new Error(`Request failed with ${res.status} ${res.statusText}`);
        }

        return await res.json();
    }

    private stripHtml(input: string): string {
        return input.replace(/(<([^>]+)>)/gi, "");
    }
}
