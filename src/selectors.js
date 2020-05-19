import { createSelector } from 'reselect';

import * as queries from './queries';

export const getSessionIsLoading = createSelector(
  [queries.querySessionState],
  queries.querySessionLoading,
);

export const getSessionUser = createSelector(
  [queries.querySessionState],
  queries.querySessionUser,
);

export const getExperimentsById = createSelector(
  [queries.queryExperimentsState],
  queries.queryExperimentsById,
);

export const getExperimentsIds = createSelector(
  [queries.queryExperimentsState],
  queries.queryExperimentsIds,
);

export const getExperimentsIsFetching = createSelector(
  [queries.queryExperimentsState],
  queries.queryExperimentsIsFetching,
);

export const getExperimentsActiveId = createSelector(
  [queries.queryExperimentsState],
  queries.queryExperimentsActiveId,
);

export const getExperimentMetaForActiveId = createSelector(
  [getExperimentsById, getExperimentsActiveId],
  queries.queryExperimentMetaForActiveId,
);

export const getExperimentTagsForActiveId = createSelector(
  [getExperimentMetaForActiveId],
  queries.queryExperimentTagsForActiveId,
);

export const getExperimentShapesForActiveId = createSelector(
  [getExperimentMetaForActiveId],
  queries.queryExperimentShapesForActiveId,
);

export const getResultsStream = createSelector(
  [queries.queryResultsStream],
  stream => stream,
);

export const getTagCounts = createSelector(
  [queries.queryTagCounts],
  tagCounts => tagCounts,
);
