import { eventChannel } from 'redux-saga';
import { all, call, put, select, spawn, take } from 'redux-saga/effects';
import { push } from 'connected-react-router'

import { ExperimentMode } from 'const';

import {
  getExperimentMeta,
  setSession,
  listExperiments,
  setActiveExperiment,
  refreshExperimentTags,
  exportBoundaryExperiment,
} from 'types'

import { getExperimentsIsFetching, getExperimentsActiveId, getExperimentMetaForActiveId } from 'selectors';

import firebase from 'services/firebase';

import { flatten, createDownloadFile } from 'helpers';

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
      // get experiment results
      // const test = yield call(api.getUserExperimentResultsForUrl, 'default', "https://firebasestorage.googleapis.com/v0/b/experiments-573d7.appspot.com/o/a%2Fdragonflies.jpg?alt=media&token=f8c5b0b6-e670-4b2c-a2ff-c3e0c6e6db62");
      // console.log(test);
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

export function* getExperimentMetaTrigger() {
  try {
    yield put(getExperimentMeta.request());

    const experimentId = yield select(getExperimentsActiveId);
    const activeExperiment = yield select(getExperimentMetaForActiveId);

    if (activeExperiment.mode === ExperimentMode.BOUNDARY) {
      const mainResult = yield call(api.getExperiment, experimentId);
      const userResults = yield call(api.getUserExperimentResults, experimentId);
      const userMetaResult = yield call(api.getUserExperimentMeta, experimentId);

      let userTags = {};
      let userShapes = [];

      if (userResults) {
        userShapes = Object.keys(userResults).map((key) => userResults[key]);
        console.log(userShapes);
      }

      if (userMetaResult && userMetaResult.tags) {
        userTags = userMetaResult.tags;
      }

      const experimentData = {
        ...mainResult,
        id: experimentId,
        tags: {
          ...userTags,
          ...mainResult.tags,
        },
        shapes: [
          ...flatten(userShapes),
          ...Object.keys(mainResult.shapes || {}).map((key) => mainResult.shapes[key]),
        ],
      };

      yield put(getExperimentMeta.success(experimentData));
    } else {
      yield put(getExperimentMeta.fulfill());
    }
  } catch (err) {
    console.log(err);
    yield put(getExperimentMeta.failure(err));
  }
}

export function* refreshExperimentTagsTrigger() {
  try {
    const experimentId = yield select(getExperimentsActiveId);
    const activeExperiment = yield select(getExperimentMetaForActiveId);

    const mainResult = yield call(api.getExperiment, experimentId);
    const userResult = yield call(api.getUserExperimentMeta, experimentId);

    if (userResult && userResult.tags) {
      const experiment = {
        ...mainResult,
        ...activeExperiment,
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
      yield put(refreshExperimentTags.fulfill());
    }
  } catch (err) {
    yield put(refreshExperimentTags.failure(err));
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

export function* exportBoundaryExperimentTrigger(action) {
  try {
    const { payload } = action;
    const response = yield call(api.exportBoundaryExperiment, payload);
    if (response && response.result) {
      const resultStr = response.result.reduce((str, obj) => {
        const lineStr = JSON.stringify(obj);
        return `${str}${lineStr}\n`;
      }, '');
      createDownloadFile(`${payload}.jsonl`, resultStr);
    }
    yield put(exportBoundaryExperiment.success());
  } catch(err) {
    yield put(exportBoundaryExperiment.failure(err));
  }
}

export function* watch() {
  while (true) {
    const action = yield take([
      listExperiments.TRIGGER,
      setActiveExperiment.TRIGGER,
      refreshExperimentTags.TRIGGER,
      getExperimentMeta.TRIGGER,
      exportBoundaryExperiment.TRIGGER,
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

      case getExperimentMeta.TRIGGER:
        yield spawn(getExperimentMetaTrigger);
        break;

      case exportBoundaryExperiment.TRIGGER:
        yield spawn(exportBoundaryExperimentTrigger, action);
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
