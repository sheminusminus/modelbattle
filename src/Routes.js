import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import Auth from './Auth';
import Choose from './Choose';
import Easter from './Easter';
import Main from './Main';

const Routes = (props) => {
  const { handleSetName, name } = props;

  return (
    <Router>
      <Switch>
        <Route
          exact
          path="/exp/choose"
          render={() => (
            <Choose setName={handleSetName} />
          )}
        />
        <Route path="/exp" component={Main} name={name} />
        <Route path="/egg" component={Easter} />
        <Route path="/" component={Auth} name={name} />
      </Switch>
    </Router>
  );
};

export default Routes;
