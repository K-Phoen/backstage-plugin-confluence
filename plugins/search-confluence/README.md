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
// packages/app/src/components/search/SearchPage.tsx

import { DocsIcon } from '@backstage/core-components';
import { ConfluenceResultListItem } from '@k-phoen/backstage-plugin-confluence';

// ...
<SearchType.Accordion
  name="Result Type"
  types={[
    // ...
    {
      value: 'confluence',
      name: 'Confluence',
      icon: <DocsIcon />,
    },
  ]}
/>

<SearchResult>
  // ...
  <ConfluenceResultListItem />
</SearchResult>
```

## License

This library is under the [MIT](../../LICENSE) license.
