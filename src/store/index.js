import createSagaMiddleware from 'redux-saga';
import { applyMiddleware, createStore, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router'

import history from 'createHistory';

import rootReducer from 'store/reducer';
import rootSaga from 'store/sagas';

const storeAccessor = {
  getState: undefined,
  dispatch: undefined,
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const configureStore = (hydrator = {}) => {
  const sagaMiddleware = createSagaMiddleware();

  const middlewares = [sagaMiddleware, routerMiddleware(history)];

  const store = createStore(
    rootReducer,
    hydrator,
    composeEnhancers(applyMiddleware(...middlewares)));

  storeAccessor.dispatch = store.dispatch;
  storeAccessor.getState = () => {
    const state = store.getState();
    Object.freeze(state);
    return state;
  };

  sagaMiddleware.run(rootSaga);

  return store;
};


export { history, storeAccessor };
export default configureStore;
