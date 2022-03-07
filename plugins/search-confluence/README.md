# Confluence search plugin [![](https://img.shields.io/npm/v/@k-phoen/backstage-plugin-confluence.svg)](https://www.npmjs.com/package/@k-phoen/backstage-plugin-confluence)

This plugin integrates Confluence documents to Backstage' search engine.

**Note:** it is used in combination with its [backend counter-part](../search-confluence-backend/).

## How does it look?

Search results:

![Search results](./docs/confluence_search_result.png)

## Installation

Add the plugin to your frontend app:

```bash
cd packages/app && yarn add @k-phoen/backstage-plugin-confluence
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
                key={document.location}
                result={document}
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
