const fbApiKey = process.env.REACT_APP_FB_API;
const fbAuth = process.env.REACT_APP_FB_AUTH;
const fbDb = process.env.REACT_APP_FB_DB;
const fbProj = process.env.REACT_APP_FB_PROJ;
const fbBucket = process.env.REACT_APP_FB_BUCKET;
const fbMsg = process.env.REACT_APP_FB_MSG;
const fbApp = process.env.REACT_APP_FB_APP;
const fbMeasure = process.env.REACT_APP_FB_MEASURE;

export default {
  apiKey: fbApiKey,
  authDomain: fbAuth,
  databaseURL: fbDb,
  projectId: fbProj,
  storageBucket: fbBucket,
  messagingSenderId: fbMsg,
  appId: fbApp,
  measurementId: fbMeasure,
};
