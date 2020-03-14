import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router'

import history from 'createHistory';

import { setSession } from 'types';

export const sessionName = 'session';
export const experimentsName = 'experiments';

const initialState = {
  [sessionName]: {
    isLoading: true,
    user: null,
  },
  [experimentsName]: {
    byId: {},
    ids: [],
  },
};

const experiments = (state = initialState[experimentsName], action = {}) => {
  const { payload, type } = action;

  switch (type) {
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
