import React, { ReactNode } from 'react';
import { Link } from '@backstage/core-components';
import {
  IndexableDocument,
  ResultHighlight,
} from '@backstage/plugin-search-common';
import { HighlightedSearchResultText } from '@backstage/plugin-search-react';
import {
  Box,
  Breadcrumbs,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from '@material-ui/core';

const useStyles = makeStyles({
  flexContainer: {
    flexWrap: 'wrap',
  },
  lastUpdated: {
    display: 'block',
    marginTop: '0.2rem',
    marginBottom: '0.8rem',
    fontSize: '0.8rem',
  },
  excerpt: {
    lineHeight: '1.55',
  },
  breadcrumbs: {
    marginTop: '1rem',
  },
  itemText: {
    width: '100%',
    marginBottom: '1rem',
    wordBreak: 'break-all',
  },
});

export type IndexableConfluenceDocument = IndexableDocument & {
  spaceName: string;
  lastModified: string;
  lastModifiedFriendly: string;
  lastModifiedBy: string;
  ancestors: {
    title: string;
    location: string;
  }[];
};

export interface ConfluenceResultItemProps {
  icon?: ReactNode | ((result: any) => ReactNode);
  result?: IndexableDocument;
  highlight?: ResultHighlight;
  rank?: number;
}

export const ConfluenceResultListItem = ({
  icon,
  result,
  highlight,
}: ConfluenceResultItemProps) => {
  const classes = useStyles();
  const document = result as IndexableConfluenceDocument;

  if (!result) {
    return null;
  }

  const title = (
    <Link noTrack to={result.location}>
      {highlight?.fields.title ? (
        <HighlightedSearchResultText
          text={highlight.fields.title}
          preTag={highlight.preTag}
          postTag={highlight.postTag}
        />
      ) : (
        result.title
      )}
    </Link>
  );
  const excerpt = (
    <>
      <span className={classes.lastUpdated}>
        Last Updated: {document.lastModifiedFriendly} by{' '}
        {document.lastModifiedBy}
      </span>
      <>
        {highlight?.fields.text ? (
          <HighlightedSearchResultText
            text={highlight.fields.text}
            preTag={highlight.preTag}
            postTag={highlight.postTag}
          />
        ) : (
          result.text
        )}
      </>

      <Box className={classes.breadcrumbs}>
        <Breadcrumbs
          separator="›"
          maxItems={4}
          itemsBeforeCollapse={1}
          itemsAfterCollapse={2}
          aria-label="breadcrumb"
        >
          {document.ancestors &&
            document.ancestors.map(ancestor => (
              <Link to={ancestor.location}>{ancestor.title}</Link>
            ))}
        </Breadcrumbs>
      </Box>
    </>
  );

  let resultIcon: ConfluenceResultItemProps['icon'] = (
    <img
      width="20"
      height="20"
      src="https://cdn.worldvectorlogo.com/logos/confluence-1.svg"
      alt="confluence logo"
    />
  );
  if (icon) {
    resultIcon = typeof icon === 'function' ? icon(result) : icon;
  }

  return (
    <>
      <ListItemIcon title="Confluence document">{resultIcon}</ListItemIcon>
      <div className={classes.flexContainer}>
        <ListItemText
          primary={title}
          secondary={excerpt}
          className={classes.itemText}
          primaryTypographyProps={{ variant: 'h6' }}
        />
      </div>
    </>
  );
};
