import firebase from 'firebase';
import * as firebaseUi from 'firebaseui';
import qs from 'query-string';

import firebaseConfig from './firebaseConfig';

import { shuffle } from './util';

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
 * @param {Function} options.setChecked
 * @return {function(...[*]=)}
 */
export const makeAuthHandler = (options) => async (user) => {
  const { expName, history, setChecked } = options;

  setChecked(true);

  if (user) {
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
  }
};

/**
 * @param {string} searchQuery
 * @return {Promise<{a: [*], b: [*]}|{a: [], b: []}>}
 */
export const listImages = async (searchQuery) => {
  const queries = qs.parse(searchQuery);

  /**
   * @type {?string}
   */
  const expName = queries.n || queries['?n'];

  if (!expName) { return { a: [], b: [] }; }

  const experimentSnapshot = await firebase.database().ref('meta').child(expName).once('value');
  const data = experimentSnapshot.val();

  const {
    a_dir: dirA,
    b_dir: dirB,
    tagline,
  } = data;

  const { items: itemsA } = await firebase.storage().ref(dirA).listAll();
  const { items: itemsB } = await firebase.storage().ref(dirB).listAll();

  return { a: [shuffle(itemsA)[0]], b: [shuffle(itemsB)[0]], tagline };
};

export default firebase;
