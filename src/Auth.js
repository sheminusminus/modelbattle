import React from 'react';
import { StyledFirebaseAuth }  from 'react-firebaseui';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import firebase, { firebaseUiConfig } from 'services/firebase';

import * as selectors from 'selectors';

const Auth = () => (
  <StyledFirebaseAuth
    uiConfig={firebaseUiConfig}
    firebaseAuth={firebase.auth()}
  />
);

const mapStateToProps = createStructuredSelector({
  isLoading: selectors.getSessionIsLoading,
  user: selectors.getSessionUser,
});

export default connect(mapStateToProps)(Auth);
