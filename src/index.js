import React from 'react';
import ReactDOM from 'react-dom';
import qs from 'query-string';

import * as serviceWorker from 'serviceWorker';

import configureStore, { history } from 'store';
import { experimentsName, initialState } from 'store/reducer';

import App from 'App';

import 'index.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import 'App.css';
import 'BoundaryExperiment.css';

const { n } = qs.parse(window.location.search);

const stateHydrator = {
  experiments: {
    ...initialState[experimentsName],
    activeId: n || null,
  },
};

const store = configureStore(stateHydrator);

ReactDOM.render(<App history={history} store={store} />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
