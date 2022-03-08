export interface Config {
  confluence: {
    /**
     * Confluence base URL
     * @visibility backend
     */
    url: string;

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
