import React from 'react';
import { StyledFirebaseAuth }  from 'react-firebaseui';
import { Redirect } from 'react-router-dom';

import firebase, { firebaseUiConfig, makeAuthHandler } from './firebase';

const Auth = ({ history, name }) => {
  const [checked, setChecked] = React.useState(false);

  /**
   *
   * @type {React.MutableRefObject<firebase.Unsubscribe>}
   */
  const handle = React.useRef();

  React.useEffect(() => {
    const authHandler = makeAuthHandler({
      expName: name,
      history,
      setChecked,
    });

    handle.current = firebase.auth().onAuthStateChanged(authHandler);

    return () => {
      handle.current();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checked && firebase.auth().currentUser) {
    if (name) {
      return <Redirect to={`/exp?n=${name}`} />;
    } else {
      return <Redirect to={`/exp`} />;
    }
  }

  return (
    <StyledFirebaseAuth
      uiConfig={firebaseUiConfig}
      firebaseAuth={firebase.auth()}
    />
  );
};

export default Auth;
