const functions = require('firebase-functions');
const { v4 } = require('uuid');

const admin = require('./services/admin');

const bucket = admin.storage().bucket();

module.exports = functions.https.onCall(async (data) => {
  const { images, dirName, imageName, format } = data;

  let index = 0;

  await images.reduce(async (promise, imageData) => {
    await promise;

    const nameSegments = imageName.split('.');
    const ext = nameSegments.pop();
    const fileName = `${nameSegments.join('.')}_${index}.${ext}`;
    const filePath = `${dirName}/${fileName}`;

    const imageBuffer = Buffer.from(imageData, 'base64');

    const file = bucket.file(filePath);

    const uuid = v4();

    const contentType = `image/${format}`;

    const mdObj = {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
          contentType,
        },
      },
      public: true,
      validation: 'md5',
    };

    console.log(contentType, mdObj);
    index += 1;

    try {
      await file.save(imageBuffer, mdObj);
    } catch (err) {
      console.log(err);
    }
  }, Promise.resolve());

  return true;
});
