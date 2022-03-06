export interface Config {
  confluence: {
    /**
     * Confluence organization
     * @visibility backend
     */
    org: string;

    /**
     * Spaces to index
     * @visibility backend
     */
    spaces: string[];

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
