import React from 'react';
import ReactDOM from 'react-dom';
import qs from 'query-string';

import { LSKey } from 'const';

import { expNameFromUrlParam, lsGet, lsSet } from 'helpers';

import * as serviceWorker from 'serviceWorker';

import configureStore, { history } from 'store';
import { experimentsName, initialState, metaName } from 'store/reducer';

import App from 'App';

import 'index.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import 'App.css';
import 'BoundaryExperiment.css';
import 'marquee.css';

let { name: n, u } = qs.parse(window.location.search);

const handleSetExperimentAndUser = () => {
  let experimentName = expNameFromUrlParam() || n || lsGet(LSKey.NAME);

  if (experimentName) {
    lsSet(LSKey.NAME, experimentName);
  }

  if (u) {
    lsSet(LSKey.USER, u);
  } else {
    u = lsGet(LSKey.USER);
  }
};

handleSetExperimentAndUser();

const stateHydrator = {
  [experimentsName]: {
    ...initialState[experimentsName],
    activeId: null,
    resultsFor: u || null,
  },
  [metaName]: {
    ...initialState[metaName],
    attemptedUrl: window.location.href,
  },
};

const store = configureStore(stateHydrator);

ReactDOM.render(<App history={history} store={store} />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
