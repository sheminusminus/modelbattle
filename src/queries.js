import { sessionName, experimentsName } from 'store/reducer';

export const querySessionState = (state) => state[sessionName];
export const querySessionUser = session => session.user;
export const querySessionLoading = session => session.isLoading;

export const queryExperimentsState = state => state[experimentsName];
export const queryExperimentsActiveId = experiments => experiments.activeId;
export const queryExperimentsById = experiments => experiments.byId;
export const queryExperimentsIds = experiments => experiments.ids;
export const queryExperimentsIsFetching = experiments => experiments.isFetching;
