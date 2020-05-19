import { createRoutine } from 'redux-saga-routines';

export const setSession = createRoutine('SET_SESSION');

export const listExperiments = createRoutine('LIST_EXPERIMENTS');

export const refreshExperimentTags = createRoutine('REFRESH_EXPERIMENT_TAGS');

export const getExperimentMeta = createRoutine('GET_EXPERIMENT_META');

export const changeActiveExperiment = createRoutine('CHANGE_ACTIVE_EXPERIMENT');

export const setActiveExperiment = createRoutine('SET_ACTIVE_EXPERIMENT');

export const exportBoundaryExperiment = createRoutine('EXPORT_BOUNDARY_EXPERIMENT');

export const streamDbResults = createRoutine('STREAM_DB_RESULTS');

export const tagCountResults = createRoutine('TAG_COUNT_RESULTS');

export const initialDataLoaded = createRoutine('INITIAL_DATA_LOADED');
