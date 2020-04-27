const functions = require('firebase-functions');

const admin = require('./services/admin');


module.exports = functions.https.onCall(async (data, context) => {
  const { images, dirName, imageName } = data;
  await images.reduce(async (promise, imageData) => {
    await promise;


  }, Promise.resolve());
  return true;
});
