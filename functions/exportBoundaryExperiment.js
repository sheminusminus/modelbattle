const functions = require('firebase-functions');

const admin = require('./services/admin');

const { hasAuth, makeResponse, valFromQuery } = require('./utils');


const getAllTagsFromUserMeta = (userMetaData, experimentId) => {
  if (userMetaData) {
    const userMetaForExperiment = userMetaData[experimentId];

    if (userMetaForExperiment) {
      const { tags } = userMetaForExperiment;

      if (tags) {
        return tags;
      }
    }
  }

  return {};
};

module.exports = functions.https.onCall(async (data, context) => {
  const { experimentId } = data;

  try {

    if (!hasAuth(context.auth)) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication is required');
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
    const tagUserIds = Object.keys(userMetaDataByUserId || {});

    await tagUserIds.reduce(async (promise, userId) => {
      await promise;

      const userMetaData = userMetaDataByUserId[userId];
      const userTags = getAllTagsFromUserMeta(userMetaData, experimentId);
      const mergedTags = { ...(experimentTags || {}), ...(userTags || {}) };

      const resultsForUser = await valFromQuery(
        admin.database().ref('results').child(experimentId).child(userId)
      );

      const userResultIds = resultsForUser ? Object.keys(resultsForUser) : [];

      const flattenedResults = userResultIds.reduce((arr, resultId) => {
        const shapes = resultsForUser[resultId];

        const formattedShapes = shapes.map((shape) => {
          const tag = mergedTags[shape.tag];

          console.log('shape:', shape, 'tag:', tag);

          if (!tag) {
            return null;
          }

          return {
            ...shape,
            color: tag.color,
          };
        }).filter(shape => Boolean(shape));

        return [...arr, ...formattedShapes];
      }, []);

      allResults.push(...flattenedResults);
    }, Promise.resolve());

    const resultsByUserId = await valFromQuery(
      admin.database().ref('results').child(experimentId).orderByValue()
    );

    const userIds = Object.keys(resultsByUserId || {}).filter((userId) => !tagUserIds.includes(userId));

    userIds.forEach((userId) => {
      const userSubmissions = resultsByUserId[userId];
      const submissionIds = Object.keys(userSubmissions || {});

      submissionIds.forEach((submissionId) => {
        if (userSubmissions && submissionId) {
          const submission = userSubmissions[submissionId];

          if (submission && experimentTags) {
            const tag = experimentTags[submission.tag];

            if (tag) {
              allResults.push({
                ...submission,
                color: tag.color,
              });
            }
          }
        }
      });
    });

    const allResultsWithBoxData = allResults.map((res) => {
      const { width, height } = res.size;
      const xVals = res.points.map(pt => pt.x);
      const yVals = res.points.map(pt => pt.x);

      const lowestX = Math.min(...xVals);
      const highestX = Math.max(...xVals);
      const lowestY = Math.min(...yVals);
      const highestY = Math.max(...yVals);

      const xPts = highestX - lowestX;
      const yPts = highestY - lowestY;

      const midX = (highestX - (xPts / 2)) / width;
      const midY = (highestY - (yPts / 2)) / height;

      const xDim = xPts / width;
      const yDim = yPts / height;

      return {
        ...res,
        box_center_x: midX,
        box_center_Y: midY,
        box_width: xDim,
        box_height: yDim,
      };
    });

    return makeResponse(allResultsWithBoxData);
  } catch (err) {
    console.log(`error exporting boundary data for experiment: ${experimentId}`);
    console.log(err);
    throw err;
  }
});
