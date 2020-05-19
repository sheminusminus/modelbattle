import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router'

import history from 'createHistory';

import { camelcaseObjectKeys } from 'helpers';

import {
  setSession,
  listExperiments,
  setActiveExperiment,
  changeActiveExperiment,
  refreshExperimentTags,
  getExperimentMeta,
  streamDbResults,
  tagCountResults,
  initialDataLoaded,
} from 'types';

export const sessionName = 'session';
export const experimentsName = 'experiments';
export const resultsStreamName = 'resultsStream';
export const tagCountsName = 'tagCounts';
export const uiName = 'ui';

export const initialState = {
  [sessionName]: {
    isLoading: true,
    user: null,
  },
  [experimentsName]: {
    activeId: null,
    byId: {},
    ids: [],
    isFetching: false,
  },
  [resultsStreamName]: [],
  [tagCountsName]: {},
  [uiName]: {
    isLoading: true,
    description: '',
    message: '',
  },
};

const experiments = (state = initialState[experimentsName], action = {}) => {
  const { payload, type } = action;

  switch (type) {
    case listExperiments.REQUEST:
      return {
        ...state,
        isFetching: true,
      };

    case listExperiments.SUCCESS:
      return {
        ...state,
        byId: Object.keys(payload.experiments).reduce((obj, id) => ({
          ...obj,
          [id]: {
            ...camelcaseObjectKeys(payload.experiments[id]),
            id,
          },
        }), {}),
        ids: Object.keys(payload.experiments),
        isFetching: false,
      };

    case listExperiments.FULFILL:
    case listExperiments.FAILURE:
      return {
        ...state,
        isFetching: false,
      };

    case setActiveExperiment.SUCCESS:
      return {
        ...state,
        activeId: payload.id,
      };

    case changeActiveExperiment.TRIGGER:
      return {
        ...state,
        activeId: null,
      };

    case refreshExperimentTags.SUCCESS:
      return {
        ...state,
        byId: Object.keys(state.byId).reduce((obj, id) => {
          if (id === payload.id) {
            return {
              ...obj,
              [id]: camelcaseObjectKeys(payload),
            };
          }

          return {
            ...obj,
            [id]: state.byId[id],
          };
        }, {}),
      };

    case refreshExperimentTags.FULFILL:
      return {
        ...state,
        isFetching: false,
      };

    case getExperimentMeta.REQUEST:
      return {
        ...state,
        isFetching: true,
      };

    case getExperimentMeta.SUCCESS:
      return {
        ...state,
        byId: Object.keys(state.byId).reduce((obj, id) => {
          if (id === payload.id) {
            return {
              ...obj,
              [id]: camelcaseObjectKeys(payload),
            };
          }

          return {
            ...obj,
            [id]: state.byId[id],
          };
        }, {}),
        isFetching: false,
      };

    case getExperimentMeta.FULFILL:
    case getExperimentMeta.FAILURE:
      return {
        ...state,
        isFetching: false,
      };

    default:
      return state;
  }
};

const session = (state = initialState[sessionName], action = {}) => {
  const { payload, type } = action;

  switch (type) {
    case setSession.FAILURE:
      return {
        ...initialState[sessionName],
        isLoading: false,
      };

    case setSession.SUCCESS:
      return {
        ...initialState[sessionName],
        isLoading: false,
        user: {
          anon: payload.isAnonymous,
          displayName: payload.displayName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          photoUrl: payload.photoUrl,
          providerId: payload.providerId,
          providerData: payload.providerData,
          uid: payload.uid,
        },
      };

    default:
      return state;
  }
};

const resultsStream = (state = initialState[resultsStreamName], action = {}) => {
  switch (action.type) {
    case streamDbResults.SUCCESS:
      return [
        ...state,
        ...Object.keys(action.payload).reduce((accum, userId) => {
          const actions = action.payload[userId];

          if (actions) {
            Object.keys(actions).forEach((actionId) => {
              const shapes = actions[actionId];

              if (Array.isArray(shapes)) {
                return accum.push(...shapes);
              }
            });
          }

          return accum;
        }, []),
      ];

    default:
      return state;
  }
};

const tagCounts = (state = initialState[tagCountsName], action = {}) => {
  switch (action.type) {
    case tagCountResults.SUCCESS:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};

const ui = (state = initialState[uiName], action = {}) => {
  switch (action.type) {
    case initialDataLoaded.TRIGGER:
      return {
        ...state,
        description: action.payload.description,
        message: action.payload.message,
      };

    case initialDataLoaded.SUCCESS:
      return {
        ...state,
        isLoading: false,
      };

    default:
      return state;
  }
};


export default combineReducers({
  experiments,
  ui,
  resultsStream,
  router: connectRouter(history),
  session,
  tagCounts,
});
