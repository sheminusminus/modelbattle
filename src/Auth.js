import React from 'react';
import { StyledFirebaseAuth }  from 'react-firebaseui';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Redirect } from 'react-router-dom';

import firebase, { firebaseUiConfig } from 'services/firebase';

import * as selectors from 'selectors';

const Auth = ({ user }) => {
  if (user) {
    return <Redirect to="/exp" />;
  }

  return (
    <StyledFirebaseAuth
      uiConfig={firebaseUiConfig}
      firebaseAuth={firebase.auth()}
    />
  );
};

const mapStateToProps = createStructuredSelector({
  isLoading: selectors.getSessionIsLoading,
  user: selectors.getSessionUser,
});

export default connect(mapStateToProps)(Auth);
