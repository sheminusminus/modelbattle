import React from 'react';
import {
  Switch,
  Route,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { getLoadingDesc, getSessionIsLoading, getCacheIsLoading, getLoadingMessage } from 'selectors';

import { PreLoader } from 'components';

import Auth from './Auth';
import Choose from './Choose';
import Easter from './Easter';
import Main from './Main';

const Routes = (props) => {
  const { cacheIsLoading, loadingDesc, loadingMessage, sessionIsLoading } = props;

  if (sessionIsLoading || cacheIsLoading) {
    return <PreLoader description={loadingDesc} message={loadingMessage} />;
  }

  return (
    <Switch>
      <Route
        exact
        path="/exp/choose"
        component={Choose}
      />
      <Route path="/exp" component={Main} />
      <Route path="/egg" component={Easter} />
      <Route path="/" component={Auth} />
    </Switch>
  );
};

const mapStateToProps = createStructuredSelector({
  cacheIsLoading: getCacheIsLoading,
  loadingDesc: getLoadingDesc,
  loadingMessage: getLoadingMessage,
  sessionIsLoading: getSessionIsLoading,
});

export default connect(mapStateToProps)(Routes);
