import { sessionName, experimentsName, resultsStreamName } from 'store/reducer';

export const querySessionState = (state) => state[sessionName];
export const querySessionUser = session => session.user;
export const querySessionLoading = session => session.isLoading;

export const queryExperimentsState = state => state[experimentsName];
export const queryExperimentsActiveId = experiments => experiments.activeId;
export const queryExperimentsById = experiments => experiments.byId;
export const queryExperimentsIds = experiments => experiments.ids;
export const queryExperimentsIsFetching = experiments => experiments.isFetching;
export const queryExperimentMetaForActiveId = (experiments, id) => experiments[id];
export const queryExperimentTagsForActiveId = (experiment) => experiment.tags;
export const queryExperimentShapesForActiveId = (experiment) => experiment.shapes;

export const queryResultsStream = state => state[resultsStreamName];
