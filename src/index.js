import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import * as serviceWorker from 'serviceWorker';

import configureStore, { history } from 'store';

import App from 'App';

import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import './App.css';

const store = configureStore();

ReactDOM.render(<App history={history} store={store} />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
