import { eventChannel } from 'redux-saga';
import { all, call, put, select, spawn, take, fork } from 'redux-saga/effects';
import { push } from 'connected-react-router'

import { ExperimentMode, LSKey, RoutePath } from 'const';

import {
  getExperimentMeta,
  setSession,
  listExperiments,
  setActiveExperiment,
  refreshExperimentTags,
  exportBoundaryExperiment,
  streamDbResults,
  tagCountResults,
} from 'types'

import {
  getExperimentMetaForActiveId,
  getExperimentsActiveId,
  getExperimentsIsFetching,
} from 'selectors';

import firebase from 'services/firebase';

import {
  createDownloadFile,
  flatten,
  lsGet,
  lsSet,
} from 'helpers';

import * as api from './api';

let authHandler;

const listenForResults = (experiment) => eventChannel((emitter) => {
  const unlisten = firebase.database().ref(`results/${experiment}`).on('value', (snapshot) => {
    if (snapshot) {
      const val = snapshot.val();
      if (val) {
        emitter(val);
      }
    }
  });

  return unlisten;
});

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

export function* listExperimentsTrigger(action) {
  try {
    const nextId = action.payload?.nextActiveId;

    const isFetching = yield select(getExperimentsIsFetching);

    if (!isFetching) {
      yield put(listExperiments.request());

      const result = yield call(api.getExperiments);
      const userMetaResult = yield call(api.getUserMeta);

      if (result) {
        const experimentIds = Object.keys(result);
        const experiments = experimentIds.reduce((obj, id) => {
          const mainData = result[id];
          const userData = (userMetaResult || {})[id];

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

        yield put(listExperiments.success({ experiments }));

        if (nextId) {
          yield put(setActiveExperiment.trigger(nextId));
        }
      }
    }

    yield put(listExperiments.fulfill());
  } catch(err) {
    console.log(err);
    yield put(listExperiments.failure(err));
  }
}

const refetchExperiment = async (experimentId) => {
  const cache = await caches.open('experimentResults');
  if (!window.experimentResultsFetching) {
    window.experimentResultsFetching = true;
    try {
      const data = await api.exportBoundaryExperiment(experimentId);
      await cache.put(experimentId, new Response(JSON.stringify(data)));
      return data;
    } finally {
      window.experimentResultsFetching = false;
    }
  }
};

const grabExperiment = async (experimentId) => {
  refetchExperiment(experimentId); // no await; kick off in bg
  const cache = await caches.open('experimentResults');
  const res = await cache.match(experimentId);
  if (res != null) {
    const exp = await res.json();
    return exp;
  } else {
    const data = await api.exportBoundaryExperiment(experimentId);
    await cache.put(experimentId, new Response(JSON.stringify(data)));
    return data;
  }
};

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
      }

      if (userMetaResult && userMetaResult.tags) {
        userTags = userMetaResult.tags;
      }

      const experimentResults = yield call(grabExperiment, experimentId);
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
          ...(experimentResults || []),
        ],
      };

      // const tagCounts = (experimentData.shapes).reduce((obj, res) => {
      //   const { tag } = res;
      //
      //   if (obj[tag]) {
      //     return { ...obj, [tag]: obj[tag] += 1 };
      //   }
      //
      //   return { ...obj, [tag]: 1 };
      // }, {});

      yield all([
        put(getExperimentMeta.success(experimentData)),
        // put(tagCountResults.success(tagCounts)),
      ]);
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
    const { payload: id } = action;
    if (id) {
      lsSet(LSKey.NAME, id);
      yield put(setActiveExperiment.success({ id }));
      yield put(streamDbResults.trigger({ experiment: id }));
    }
  } catch(err) {
    yield put(setActiveExperiment.failure(err));
  }
}

export function* exportBoundaryExperimentTrigger(action) {
  try {
    const { payload } = action;
    const response = yield call(api.exportBoundaryExperiment, payload);
    if (response) {
      const resultStr = response.reduce((str, obj) => {
        const lineStr = JSON.stringify(obj);
        return `${str}${lineStr}\n`;
      }, '');
      createDownloadFile(`${payload}.json`, resultStr);
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
        yield spawn(listExperimentsTrigger, action);
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
        yield put(push(RoutePath.AUTH));
        break;

      case setSession.SUCCESS: {
        const expName = lsGet(LSKey.NAME);

        if (expName) {
          yield all([,
            put(listExperiments.trigger({ nextActiveId: expName })),
            put(push(RoutePath.singleExperiment(expName))),
          ]);
        } else {
          yield put(push(RoutePath.CHOOSE_EXPERIMENT));
        }
        break;
      }

      default:
        break;
    }
  }
}

const sleep = (seconds) => new Promise(res => setTimeout(res, Math.floor(1000 * seconds)));

export function* watchResults() {
  let { payload } = yield take(streamDbResults.TRIGGER);

  const { experiment: experimentId } = payload;

  const checkChannel = function* () {
    while (true) {
      const currentId = yield select(getExperimentsActiveId);
      yield call(sleep, 1.5);
      if (experimentId !== currentId && currentId) {
        console.log(currentId, "CHANGED", experimentId);
        window.location.reload(true);
      }
    }
  };

  yield fork(checkChannel);

  const channel = yield call(listenForResults, experimentId);

  while (true) {
    const snapshotValue = yield take(channel);

    yield put(streamDbResults.success(snapshotValue));

    const tagCounts = {};

    Object.keys(snapshotValue || {}).forEach((userId) => {
      const actions = snapshotValue[userId];

      if (actions) {
        Object.keys(actions).forEach((actionId) => {
          const shapes = actions[actionId];

          if (Array.isArray(shapes)) {
            shapes.forEach((shape) => {
              const { tag } = shape;
              if (tagCounts[tag]) { tagCounts[tag] += 1; }
              else { tagCounts[tag] = 1; }
            });
          }
        });
      }
    });

    yield put(tagCountResults.success(tagCounts));
  }
}

export default function* root() {
  yield all([watch(), watchAuth(), watchResults()]);
}
