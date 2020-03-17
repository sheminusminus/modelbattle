import { eventChannel } from 'redux-saga';
import { all, call, put, select, spawn, take } from 'redux-saga/effects';
import { push } from 'connected-react-router'

import { setSession, listExperiments, setActiveExperiment, refreshExperimentTags } from 'types'

import { getExperimentsIsFetching, getExperimentsActiveId } from 'selectors';

import firebase from 'services/firebase';

import * as api from './api';

let authHandler;

const listenForAuth = () => eventChannel((emitter) => {
  authHandler = firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      emitter(setSession.success(user));
    } else {
      emitter(setSession.failure());
    }
  });

  return () => {
    if (authHandler) authHandler();
  };
});

export function* listExperimentsTrigger() {
  try {
    const isFetching = yield select(getExperimentsIsFetching);
    if (!isFetching) {
      yield put(listExperiments.request());

      const result = yield call(api.getExperiments);
      const userMetaResult = yield call(api.getUserMeta);

      let experiments = result;

      if (result && userMetaResult) {
        const experimentIds = Object.keys(result);
        experiments = experimentIds.reduce((obj, id) => {
          const mainData = result[id];
          const userData = userMetaResult[id];

          if (userData && userData.tags) {
            return {
              ...obj,
              [id]: {
                ...mainData,
                tags: {
                  ...userData.tags,
                  ...mainData.tags,
                },
              }
            };
          }

          return {
            ...obj,
            [id]: mainData,
          };
        }, {});
      }

      yield put(listExperiments.success({ experiments }));
    }
  } catch(err) {
    yield put(listExperiments.failure(err));
  }
}

export function* refreshExperimentTagsTrigger() {
  try {
    const experimentId = yield select(getExperimentsActiveId);

    const mainResult = yield call(api.getExperiment, experimentId);
    const userResult = yield call(api.getUserExperimentMeta, experimentId);

    if (userResult && userResult.tags) {
      const experiment = {
        ...mainResult,
        tags: {
          ...userResult.tags,
          ...mainResult.tags || {},
        }
      };
      yield put(refreshExperimentTags.success({
        ...experiment,
        id: experimentId,
      }));
    } else {
      yield put(refreshExperimentTags.success({
        ...mainResult,
        id: experimentId,
      }));
    }
  } catch (err) {

  }
}

export function* setActiveExperimentTrigger(action) {
  try {
    const { payload } = action;
    if (payload) {
      yield put(setActiveExperiment.success({ id: payload }));
    }
  } catch(err) {
    yield put(setActiveExperiment.failure(err));
  }
}

export function* watch() {
  while (true) {
    const action = yield take([
      listExperiments.TRIGGER,
      setActiveExperiment.TRIGGER,
      refreshExperimentTags.TRIGGER,
    ]);

    switch (action.type) {
      case listExperiments.TRIGGER:
        yield spawn(listExperimentsTrigger);
        break;

      case setActiveExperiment.TRIGGER:
        yield spawn(setActiveExperimentTrigger, action);
        break;

      case refreshExperimentTags.TRIGGER:
        yield spawn(refreshExperimentTagsTrigger);
        break;

      default:
        yield null;
    }
  }
}

export function* watchAuth() {
  const channel = yield call(listenForAuth);

  while (true) {
    const action = yield take(channel);
    yield put(action);

    switch(action.type) {
      case setSession.FAILURE:
        yield put(push('/'));
        break;

      case setSession.SUCCESS:
        yield put(push('/exp/choose'));
        break;

      default:
        break;
    }
  }
}

export default function* root() {
  yield all([watch(), watchAuth()]);
}
