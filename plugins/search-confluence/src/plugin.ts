import { createPlugin } from '@backstage/core-plugin-api';
import {
  createSearchResultListItemExtension,
  SearchResultListItemExtensionProps,
} from '@backstage/plugin-search-react';
import { ConfluenceResultItemProps } from './components/ConfluenceResultListItem';

export const confluencePlugin = createPlugin({
  id: 'voi-search-confluene',
});

export const ConfluenceResultListItem: (
  props: SearchResultListItemExtensionProps<ConfluenceResultItemProps>,
) => JSX.Element | null = confluencePlugin.provide(
  createSearchResultListItemExtension({
    name: 'ConfluenceResultListItem',
    component: () =>
      import('./components/ConfluenceResultListItem').then(
        m => m.ConfluenceResultListItem,
      ),
    predicate: result => result.type === 'confluence',
  }),
);
