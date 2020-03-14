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
