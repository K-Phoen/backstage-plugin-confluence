# Confluence search plugin backend

This plugin integrates Confluence documents to Backstage' search engine.

It is used in combination with its [frontend counter-part](../search-confluence/).

## Installation

Add the plugin to your backend app:

```bash
cd packages/backend && yarn add @k-phoen/backstage-plugin-confluence-backend
```

Configure the plugin in `app-config.yaml`:

```yaml
# app-config.yaml
confluence:
  # Organization name
  # Example: https://{ORG}.atlassian.net/
  org: some-org

  # List of spaces to index
  # See https://confluence.atlassian.com/conf59/spaces-792498593.html
  spaces: [ENG]

  # Authentication credentials towards Confluence API
  auth:
    username: ${CONFLUENCE_USERNAME}
    # While Confluence supports BASIC authentication, using an API token is preferred.
    # See: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
    password: ${CONFLUENCE_PASSWORD}
```

Enable Confluence documents indexing in the search engine:

```typescript
// packages/backend/src/plugins/search.ts
export default async function createPlugin({
  logger,
  permissions,
  discovery,
  config,
  tokenManager,
}: PluginEnvironment) {
  // Initialize a connection to a search engine.
  const searchEngine = await ElasticSearchSearchEngine.fromConfig({
    logger,
    config,
  });
  const indexBuilder = new IndexBuilder({ logger, searchEngine });

  // …

  // Confluence documents indexing
  indexBuilder.addCollator({
    defaultRefreshIntervalSeconds: 1800, // 30 min
    factory: ConfluenceCollatorFactory.fromConfig(config, { logger }),
  });

  // …

  // The scheduler controls when documents are gathered from collators and sent
  // to the search engine for indexing.
  const { scheduler } = await indexBuilder.build();

  // A 3 second delay gives the backend server a chance to initialize before
  // any collators are executed, which may attempt requests against the API.
  setTimeout(() => scheduler.start(), 3000);
  useHotCleanup(module, () => scheduler.stop());

  return await createRouter({
    engine: indexBuilder.getSearchEngine(),
    types: indexBuilder.getDocumentTypes(),
    permissions,
    config,
    logger,
  });
}

```

## License

This library is under the [MIT](../LICENSE) license.