import { eventChannel } from 'redux-saga';
import { all, call, put, select, spawn, take } from 'redux-saga/effects';
import { push } from 'connected-react-router'

import { setSession, listExperiments, setActiveExperiment} from 'types'

import { getExperimentsIsFetching } from 'selectors';

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
      yield put(listExperiments.success({ experiments: result }));
    }
  } catch(err) {
    yield put(listExperiments.failure(err));
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
    ]);

    switch (action.type) {
      case listExperiments.TRIGGER:
        yield spawn(listExperimentsTrigger);
        break;

      case setActiveExperiment.TRIGGER:
        yield spawn(setActiveExperimentTrigger, action);
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
