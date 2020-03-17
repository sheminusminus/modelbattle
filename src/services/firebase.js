import firebase from 'firebase';
import * as firebaseUi from 'firebaseui';

import firebaseConfig from './firebaseConfig';

import { ExperimentMode } from 'const';

import { randomColor, shuffle } from 'helpers';

firebase.initializeApp(firebaseConfig);
firebase.analytics();

window.firebase = firebase;

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

export const getLines = (text) => {
  return text.split('\n').map(x => x.replace(/#.*/g, '').trim()).filter(x => x.length > 0)
};

export const getFile = async (url) => {
  const response = await fetch(url);
  const text = await response.text();
  return text
};

export const getList = async (path) => {
  if (path.endsWith(".txt")) {
    const result = await getFile(path);
    const items = getLines(result);
    return { items };
  } else {
    return await firebase.storage().ref(path).listAll();
  }
};

/**
 * @param {string} expName
 * @return {Promise<*>}
 */
export const listImages = async (expName) => {
  if (!expName) { return { a: [], b: [] }; }

  const experimentSnapshot = await firebase.database().ref('meta').child(expName).once('value');
  const data = experimentSnapshot.val();

  const {
    mode,
    tagline,
    skipText,
  } = data;

  if (mode === ExperimentMode.AB) {
    const {
      a_dir: dirA,
      b_dir: dirB,
    } = data;

    const { items: itemsA } = await getList(dirA);
    const { items: itemsB } = await getList(dirB);

    return { a: [shuffle(itemsA)[0]], b: [shuffle(itemsB)[0]], skipText, tagline };
  } else if (mode === ExperimentMode.BOUNDARY) {
    const { dir } = data;

    const { items } = await getList(dir);

    return { items, skipText, tagline };
  }
};

export const addNewTag = async (experimentId, input) => {
  const { uid } = firebase.auth().currentUser;

  const newTag = {
    id: input,
    color: randomColor(),
    text: input,
  };

  const existingTagSnap = await firebase
    .database()
    .ref('meta')
    .child(experimentId)
    .child('tags')
    .child(input)
    .once('value');

  const existingTag = existingTagSnap.val();

  if (existingTag) {
    return existingTag.id;
  }

  const existingUserTagSnap = await firebase
    .database()
    .ref('user_meta')
    .child(uid)
    .child(experimentId)
    .child('tags')
    .child(input)
    .once('value');

  const existingUserTag = existingUserTagSnap.val();

  if (existingUserTag) {
    return existingUserTag.id;
  }

  await firebase
    .database()
    .ref('user_meta')
    .child(uid)
    .child(experimentId)
    .child('tags')
    .child(input)
    .set(newTag);

  return input;
};

export default firebase;
