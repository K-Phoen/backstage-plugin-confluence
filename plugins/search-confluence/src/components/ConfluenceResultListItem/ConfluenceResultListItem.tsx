import React from 'react';
import { Link } from '@backstage/core-components';
import { IndexableDocument } from '@backstage/search-common';
import {
  Box,
  Breadcrumbs,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from '@material-ui/core';
import TextTruncate from 'react-text-truncate';

const useStyles = makeStyles({
  excerpt: {
    lineHeight: '1.55',
  },
  breadcrumbs: {
    marginTop: '1rem',
  },
  itemText: {
    wordBreak: 'break-all',
  },
});

export type IndexableConfluenceDocument = IndexableDocument & {
  spaceName: string;
  ancestors: {
    title: string;
    location: string;
  }[];
};

type Props = {
  result: IndexableDocument;
  lineClamp?: number;
};

export const ConfluenceResultListItem = ({ result, lineClamp = 5 }: Props) => {
  const classes = useStyles();
  const document = result as IndexableConfluenceDocument;

  const title = <Link to={result.location}>{result.title}</Link>;
  const excerpt = (
    <>
      <TextTruncate
        line={lineClamp}
        truncateText="…"
        text={result.text}
        element="span"
        containerClassName={classes.excerpt}
      />

      <Box className={classes.breadcrumbs}>
        <Breadcrumbs separator="›" maxItems={4} itemsBeforeCollapse={1} itemsAfterCollapse={2} aria-label="breadcrumb">
          {document.ancestors && document.ancestors.map(ancestor => <Link to={ancestor.location}>{ancestor.title}</Link>)}
        </Breadcrumbs>
      </Box>
    </>
  );

  return (
    <>
      <ListItem alignItems="center">
        <ListItemIcon title="Confluence document">
          <img
            width="20"
            height="20"
            src="https://cdn.worldvectorlogo.com/logos/confluence-1.svg"
            alt="confluence logo"
          />
        </ListItemIcon>
        <ListItemText
          primary={title}
          secondary={excerpt}
          className={classes.itemText}
          primaryTypographyProps={{ variant: 'h6' }}
        />
      </ListItem>

      <Divider component="li" />
    </>
  );
};