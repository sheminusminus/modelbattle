import React from 'react';
import { StyledFirebaseAuth }  from 'react-firebaseui';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Redirect } from 'react-router-dom';

import { RoutePath } from 'const';

import firebase, { firebaseUiConfig } from 'services/firebase';

import * as selectors from 'selectors';

const Auth = ({ attemptedUrl, user }) => {
  if (user) {
    console.log('attemptedUrl', attemptedUrl);
    if (attemptedUrl) {
      const url = new URL(attemptedUrl);
      const { pathname, search } = url;
      return <Redirect to={`${pathname}${search}`} />;
    }

    return <Redirect to={RoutePath.CHOOSE_EXPERIMENT} />;
  }

  return (
    <StyledFirebaseAuth
      uiConfig={firebaseUiConfig}
      firebaseAuth={firebase.auth()}
    />
  );
};

const mapStateToProps = createStructuredSelector({
  attemptedUrl: selectors.getMetaAttemptedUrl,
  isLoading: selectors.getSessionIsLoading,
  user: selectors.getSessionUser,
});

export default connect(mapStateToProps)(Auth);
