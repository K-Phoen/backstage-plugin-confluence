import { IndexableDocument } from '@backstage/plugin-search-common';

export type ConfluenceDocumentMetadata = {
  title: string;
  status: string;

  _links: {
    self: string;
    webui: string;
  };
};

export type ConfluenceDocumentList = {
  results: ConfluenceDocumentMetadata[];
  _links: {
    next: string;
  };
};

export type ConfluenceDocumentAncestorRef = {
  title: string;

  _links: {
    webui: string;
  };
};

export type ConfluenceDocument = ConfluenceDocumentMetadata & {
  body: {
    storage: {
      value: string;
    };
  };
  version: {
    by: {
      publicName: string;
    };
    when: string;
    friendlyWhen: string;
  };
  space: {
    key: string;
    name: string;
    _links: {
      webui: string;
    };
  };
  ancestors: ConfluenceDocumentMetadata[];
};

export type IndexableAncestorRef = {
  title: string;
  location: string;
};

export type IndexableConfluenceDocument = IndexableDocument & {
  spaceKey: string;
  spaceName: string;
  ancestors: IndexableAncestorRef[];
  lastModified: string;
  lastModifiedFriendly: string;
  lastModifiedBy: string;
};
