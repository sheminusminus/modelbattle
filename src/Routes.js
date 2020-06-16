import React from 'react';
import {
  Switch,
  Route,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { RoutePath } from 'const';

import { getSessionIsLoading } from 'selectors';

import Auth from './Auth';
import Choose from './Choose';
import Easter from './Easter';
import Main from './Main';

const Routes = (props) => {
  const { sessionIsLoading } = props;

  if (sessionIsLoading) {
    return <div />;
  }

  return (
    <Switch>
      <Route
        exact
        path={RoutePath.CHOOSE_EXPERIMENT}
        component={Choose}
      />
      <Route path={RoutePath.singleExperiment()} component={Main} />
      <Route path={RoutePath.EASTER_EGG} component={Easter} />
      <Route path={RoutePath.AUTH} component={Auth} />
    </Switch>
  );
};

const mapStateToProps = createStructuredSelector({
  sessionIsLoading: getSessionIsLoading,
});

export default connect(mapStateToProps)(Routes);
