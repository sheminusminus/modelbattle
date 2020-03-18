const functions = require('firebase-functions');

const admin = require('./services/admin');

const { hasAuth, makeResponse, valFromQuery } = require('./utils');


const getAllTagsFromUserMeta = (userMetaData, experimentId) => {
  const userMetaForExperiment = userMetaData[experimentId];

  if (userMetaForExperiment) {
    const { tags } = userMetaForExperiment;

    if (tags) {
      return tags;
    }
  }

  return {};
};

module.exports = functions.https.onCall(async (data, context) => {
  const { experimentId } = data;

  if (!hasAuth(context.auth)) {
    throw new functions.https.HttpsError('Authentication is required');
  }

  const allResults = [];

  const metaData = await valFromQuery(
    admin.database().ref('meta').child(experimentId),
  );

  const { tags: experimentTags } = metaData;

  const userMetaDataByUserId = await valFromQuery(
    admin.database().ref('user_meta').orderByChild('default/tags').startAt(true),
  );

  console.log('userMetaDataByUserId', userMetaDataByUserId);
  const tagUserIds = Object.keys(userMetaDataByUserId);

  await tagUserIds.reduce(async (promise, userId) => {
    await promise;

    const userMetaData = userMetaDataByUserId[userId];
    const userTags = getAllTagsFromUserMeta(userMetaData, experimentId);
    const mergedTags = { ...experimentTags, ...userTags };

    const resultsForUser = await valFromQuery(
      admin.database().ref('results').child(experimentId).child(userId)
    );

    const userResultIds = resultsForUser ? Object.keys(resultsForUser) : [];

    const flattenedResults = userResultIds.reduce((arr, resultId) => {
      const shapes = resultsForUser[resultId];

      const formattedShapes = shapes.map((shape) => {
        const tag = mergedTags[shape.tag];
        console.log(shape, tag);
        if (!tag) {
          return null;
        }

        return {
          ...shape,
          color: tag.color,
        };
      }).filter(shape => !!shape);

      return [...arr, ...formattedShapes];
    }, []);

    allResults.push(...flattenedResults);
  }, Promise.resolve());

  const resultsByUserId = await valFromQuery(
    admin.database().ref('results').child(experimentId).orderByValue()
  );

  const userIds = Object.keys(resultsByUserId).filter((userId) => !tagUserIds.includes(userId));

  userIds.forEach((userId) => {
    const userSubmissions = resultsByUserId[userId];
    const submissionIds = Object.keys(userSubmissions);

    submissionIds.forEach((submissionId) => {
      const submission = userSubmissions[submissionId];
      const tag = experimentTags[submission.tag];
      allResults.push({
        ...submission,
        color: tag.color,
      });
    });
  });

  console.log(allResults);
  return makeResponse(allResults);
});
