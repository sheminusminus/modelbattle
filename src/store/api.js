import firebase from 'services/firebase';

const db = firebase.database();

export const getExperiments = async () => {
  const snap = await db.ref('meta').once('value');
  return snap.val();
};
