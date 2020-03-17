import firebase from 'firebase';
import * as firebaseUi from 'firebaseui';
import qs from 'query-string';

import firebaseConfig from './firebaseConfig';

import { ExperimentMode } from 'const';

import { shuffle } from 'helpers';

firebase.initializeApp(firebaseConfig);
firebase.analytics();

export const firebaseUiConfig = {
  signInFlow: 'popup',
  callbacks: {
    signInSuccess: () => {
      if (window.location.href.includes('choose')) {
        window.location.replace('/exp/choose');
      } else {
        const name = localStorage.getItem('name');

        if (name) {
          window.location.replace(`/exp?n=${name}`);
        } else {
          window.location.replace('/exp/choose');
        }
      }
    },
  },
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebaseUi.auth.AnonymousAuthProvider.PROVIDER_ID,
  ],
};

/**
 * @param {Object} options
 * @param {Object} options.history
 * @param {?string} [options.expName]
 * @param {Function} [options.setChecked]
 * @return {function(...[*]=)}
 */
export const makeAuthHandler = (options) => async (user) => {
  const { expName, history, setChecked } = options;

  if (setChecked) {
    setChecked(true);
  }

  if (user) {
    console.log('user found');
    const { displayName, email, photoURL, uid, providerId, isAnonymous } = user;

    let userData;

    if (isAnonymous) {
      userData = { anon: isAnonymous, displayName: uid, uid };
    } else {
      userData = {
        displayName: displayName || uid,
        email,
        photoUrl: photoURL,
        providerId,
        uid,
      };
    }

    await firebase.database().ref('users').child(uid).set(userData);

    if (expName) {
      history.push(`/exp?n=${expName}`);
    }
  } else {
    console.log('NO user found');
  }
};

/**
 * @param {string} searchQuery
 * @return {Promise<*>}
 */
export const listImages = async (searchQuery) => {
  const queries = qs.parse(searchQuery);

  /**
   * @type {?string}
   */
  const expName = queries.n || queries['?n'];

  if (!expName) { return { a: [], b: [] }; }

  const experimentSnapshot = await firebase.database().ref('_meta').child(expName).once('value');
  const data = experimentSnapshot.val();

  const {
    mode,
    tagline,
    skip_text: skipText,
  } = data;

  if (mode === ExperimentMode.AB) {
    const {
      a_dir: dirA,
      b_dir: dirB,
    } = data;

    const { items: itemsA } = await firebase.storage().ref(dirA).listAll();
    const { items: itemsB } = await firebase.storage().ref(dirB).listAll();

    return { a: [shuffle(itemsA)[0]], b: [shuffle(itemsB)[0]], skipText, tagline };
  } else if (mode === ExperimentMode.BOUNDARY) {
    const { dir } = data;

    const { items } = await firebase.storage().ref(dir).listAll();

    return { items, skipText, tagline };
  }
};

export default firebase;
