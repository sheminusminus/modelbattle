import firebase from 'firebase';
import 'firebase/functions';
import * as firebaseUi from 'firebaseui';

import firebaseConfig from './firebaseConfig';

import { ExperimentMode } from 'const';

import { randomColor, shuffle } from 'helpers';

firebase.initializeApp(firebaseConfig);
firebase.analytics();

window.firebase = firebase;

const func = firebase.functions();

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

export const getList = async (path, shouldShuffle) => {
  if (path.split('?')[0].endsWith(".txt")) {
    const result = await getFile(path);
    const urls = shouldShuffle ? shuffle(getLines(result)) : getLines(result);
    const itemData = [];
    for (const url of urls) {
      if (url.toLowerCase().endsWith('.jpg')) {
        itemData.push({ url, contentType: 'image/jpg' })
      } else if (url.toLowerCase().endsWith('.jpeg')) {
        itemData.push({ url, contentType: 'image/jpg' })
      } else if (url.toLowerCase().endsWith('.bmp')) {
        itemData.push({ url, contentType: 'image/bmp' })
      } else if (url.toLowerCase().endsWith('.png')) {
        itemData.push({ url, contentType: 'image/png' })
      } else if (url.toLowerCase().endsWith('.gif')) {
        itemData.push({ url, contentType: 'image/gif' })
      } else if (url.toLowerCase().endsWith('.mp4')) {
        itemData.push({ url, contentType: 'video/mp4' })
      } else if (url.toLowerCase().endsWith('.mpg')) {
        itemData.push({ url, contentType: 'video/mpg' })
      } else if (url.toLowerCase().endsWith('.wmv')) {
        itemData.push({ url, contentType: 'video/wmv' })
      } else if (url.toLowerCase().endsWith('.mpeg')) {
        itemData.push({ url, contentType: 'video/mpeg' })
      } else if (url.toLowerCase().endsWith('.webm')) {
        itemData.push({ url, contentType: 'video/webm' })
      } else if (url.toLowerCase().endsWith('.wav')) {
        itemData.push({ url, contentType: 'audio/wav' })
      } else if (url.toLowerCase().endsWith('.mp3')) {
        itemData.push({ url, contentType: 'audio/mp3' })
      } else if (url.toLowerCase().endsWith('.zip')) {
        // ignore
      } else if (url.toLowerCase().endsWith('.swf')) {
        // ignore
      } else if (url.toLowerCase().endsWith('.rar')) {
        // ignore
      } else {
        console.log(`Ignoring unknown url: ${url}`);
      }
    }
    return itemData;
  } else {
    const { items } = await firebase.storage().ref(path).listAll();
    const itemData = await Promise.all(items.map(async (ref) => {
      const { contentType } = await ref.getMetadata();
      const url = await ref.getDownloadURL();
      return { contentType, url };
    }));
    return itemData
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
      // a_shuffle: shuffleA,
      // b_shuffle: shuffleB,
    } = data;

    const itemsA = await getList(dirA, true);
    const itemsB = await getList(dirB, true);

    return { a: [itemsA[0].url], b: [itemsB[0].url], skipText, tagline };
  } else if (mode === ExperimentMode.BOUNDARY) {
    const { dir, shuffle: shouldShuffle } = data;

    const items = await getList(dir, shouldShuffle);

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

export const getBoundaryExperimentExport = async (experimentId) => {
  const fn = func.httpsCallable('exportBoundaryExperiments');
  return fn({ experimentId });
};

export default firebase;
