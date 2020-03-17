import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router'

import history from 'createHistory';

import { camelcaseObjectKeys } from 'helpers';

import { setSession, listExperiments, setActiveExperiment, changeActiveExperiment, refreshExperimentTags } from 'types';

export const sessionName = 'session';
export const experimentsName = 'experiments';

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
              [id]: payload,
            };
          }

          return obj;
        }, {}),
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

export default combineReducers({
  experiments,
  router: connectRouter(history),
  session,
});
