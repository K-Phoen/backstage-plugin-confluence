export interface Config {
  confluence: {
    /**
     * Confluence base URL for wiki API
     * Typically: https://{org-name}.atlassian.net/wiki
     * @visibility backend
     */
    wikiUrl: string;

    /**
     * Spaces to index
     * @visibility backend
     */
    spaces: string[];

    /**
     * CQL (Confluence query language) query of pages to index
     * Will be combined with `spaces` configuration parameter.
     * @visibility backend
     */
    query: string;

    /**
     * @visibility backend
     */
    auth: {
      /**
       * @visibility backend
       */
      username: string;

      /**
       * @visibility secret
       */
      password: string;
    };
  };
}
