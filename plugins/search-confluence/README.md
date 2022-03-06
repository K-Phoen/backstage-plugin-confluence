# Confluence search plugin

This plugin integrates Confluence documents to Backstage' search engine.

**Note:** it is used in combination with its [backend counter-part](../search-confluence-backend/).

## How does it look?

Search results:

![Search results](./docs/confluence_search_result.png)

## Installation

Add the plugin to your frontend app:

```bash
cd packages/frontend && yarn add @k-phoen/backstage-plugin-confluence
```

Nicely display Confluence search results:

```typescript
// packages/app/components/search/SearchPage.tsx

import { ConfluenceResultListItem } from '@k-phoen/backstage-plugin-confluence';

// ...

<SearchResult>
  {({ results }) => (
    <List>
      {results.map(result => {
        // result.type is the index type defined by the collator.
        switch (result.type) {
          case 'confluence':
            return (
              <ConfluenceResultListItem
                key={result.document.location}
                result={result.document}
              />
            );
          // ...
        }
      })}
    </List>
  )}
</SearchResult>

```

## License

This library is under the [MIT](../LICENSE) license.