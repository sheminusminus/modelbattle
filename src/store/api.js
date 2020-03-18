import firebase, { getBoundaryExperimentExport } from 'services/firebase';

const db = firebase.database();

export const getExperiments = async () => {
  const snap = await db.ref('meta').once('value');
  return snap.val();
};

export const getExperiment = async (experimentId) => {
  const snap = await db.ref('meta').child(experimentId).once('value');
  return snap.val();
};

export const getUserMeta = async () => {
  const user = firebase.auth().currentUser;

  if (user) {
    const { uid } = user;
    const snap = await db
      .ref('user_meta')
      .child(uid)
      .once('value');
    return snap.val();
  }

  return undefined;
};

export const getUserExperimentMeta = async (experimentId) => {
  const user = firebase.auth().currentUser;

  if (user) {
    const { uid } = user;
    const snap = await db
      .ref('user_meta')
      .child(uid)
      .child(experimentId)
      .once('value');
    return snap.val();
  }

  return undefined;
};

export const getUserExperimentResults = async (experimentId) => {
  const user = firebase.auth().currentUser;

  if (user) {
    const { uid } = user;
    const snap = await db
      .ref('results')
      .child(experimentId)
      .child(uid)
      .once('value');
    return snap.val();
  }

  return undefined;
};

export const getUserExperimentResultsForUrl = async (experimentId, url) => {
  const user = firebase.auth().currentUser;

  if (user) {
    const { uid } = user;
    const snap = await db
      .ref('results')
      .child(experimentId)
      .child(uid)
      .orderByChild('0/url')
      .equalTo(url)
      .once('value');
    return snap.val();
  }

  return undefined;
};

export const exportBoundaryExperiment = async (experimentId) => {
  const result = await getBoundaryExperimentExport(experimentId);
  return result ? result.data : result;
};
