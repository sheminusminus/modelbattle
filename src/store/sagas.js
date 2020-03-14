import { eventChannel } from 'redux-saga';
import { all, call, put, take } from 'redux-saga/effects';

import { setSession } from 'types';

import firebase from 'services/firebase';

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

export function* watch() {
  while (true) {
    const action = yield take([]);

    switch (action.type) {
      default:
        yield null;
    }
  }
}

export function* watchAuth() {
  const channel = yield call(listenForAuth);

  while (true) {
    const action = yield take(channel);
    console.log(`type: ${action.type}, payload: ${action.payload}`);
    yield put(action);
  }
}

export default function* root() {
  yield all([watch(), watchAuth()]);
}
