import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { LSKey, QueryParamKey, RoutePath } from 'const';

import { getQueryParam, isOldExpUrl, lsGet } from 'helpers';

import { getSessionIsLoading } from 'selectors';

import Auth from './Auth';
import Choose from './Choose';
import Easter from './Easter';
import Main from './Main';

const Routes = (props) => {
  const { sessionIsLoading } = props;

  React.useEffect(() => {
    if (isOldExpUrl()) {
      console.log('old url, redirecting');
      const expName = getQueryParam(QueryParamKey.NAME) || lsGet(LSKey.NAME);
      window.location.assign(RoutePath.singleExperimentTags(expName));
    }
  }, []);

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
      <Route path={RoutePath.singleExperimentTagsImage()} component={Main} />
      <Route path={RoutePath.singleExperimentTags()} component={Main} />
      <Route path={RoutePath.EASTER_EGG} component={Easter} />
      <Route path={RoutePath.AUTH} component={Auth} />
    </Switch>
  );
};

const mapStateToProps = createStructuredSelector({
  sessionIsLoading: getSessionIsLoading,
});

export default connect(mapStateToProps)(Routes);
