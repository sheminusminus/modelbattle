import React from 'react';
import {
  Switch,
  Route,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

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
  sessionIsLoading: getSessionIsLoading,
});

export default connect(mapStateToProps)(Routes);
