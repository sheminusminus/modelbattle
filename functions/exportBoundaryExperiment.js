const functions = require('firebase-functions');

const { hasAuth, makeResponse, valFromQuery, memoize } = require('./utils');

const admin = require('./services/admin');
const db = admin.database();


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

const getExperiments = async () => {
  const snap = await db.ref('meta').once('value');
  return snap.val();
};

const getExperimentData = memoize(async (experimentId) => {
  const allResults = [];

  /*
  if (!hasAuth(context.auth)) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required');
  }
  */

  const metaData = await valFromQuery(
    db.ref('meta').child(experimentId),
  );

  const { tags: experimentTags } = metaData;

  const userMetaDataByUserId = await valFromQuery(
    db.ref('user_meta').orderByChild(`${experimentId}/tags`).startAt(true),
  );

  //console.log('userMetaDataByUserId', userMetaDataByUserId);
  const tagUserIds = Object.keys(userMetaDataByUserId || {});

  await tagUserIds.reduce(async (promise, userId) => {
    await promise;

    const userMetaData = userMetaDataByUserId[userId];
    const userTags = getAllTagsFromUserMeta(userMetaData, experimentId);
    const mergedTags = { ...(experimentTags || {}), ...(userTags || {}) };

    const resultsForUser = await valFromQuery(
      db.ref('results').child(experimentId).child(userId)
    );

    const userResultIds = resultsForUser ? Object.keys(resultsForUser) : [];

    const flattenedResults = userResultIds.reduce((arr, resultId) => {
      const shapes = resultsForUser[resultId];

      const formattedShapes = shapes.map((shape) => {
        const tag = mergedTags[shape.tag];

        //console.log('shape:', shape, 'tag:', tag);

        if (!tag) {
          return null;
        }

        return {
          ...shape,
          user: userId,
          experimentId,
          color: tag.color,
        };
      }).filter(shape => Boolean(shape));

      return [...arr, ...formattedShapes];
    }, []);

    allResults.push(...flattenedResults);
  }, Promise.resolve());

  const resultsByUserId = await valFromQuery(
    db.ref('results').child(experimentId).orderByValue()
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
              user: userId,
              color: tag.color,
            });
          }
        }
      }
    });
  });

  return allResults;
}, { maxAge: 60000 });

const getExperimentsData = async (experimentIds) => {
  if (typeof experimentIds === 'string') {
    experimentIds = experimentIds.split(',');
  }
  experimentIds = experimentIds.filter(x => x.trim().length > 0).map(x => x.trim());
  if (experimentIds.length <= 0) {
    const result = await getExperiments();
    experimentIds = Object.keys(result);
  }

  const allResults = [];
  for (const results of await Promise.all(experimentIds.map(getExperimentData))) {
    allResults.push(...results);
  }

  const allResultsWithBoxData = allResults.map((res) => {
    const { width, height } = res.size;
    const xVals = res.points.map(pt => pt.x);
    const yVals = res.points.map(pt => pt.y);

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
      box_center_y: midY,
      box_width: xDim,
      box_height: yDim,
    };
  });

  return makeResponse(allResultsWithBoxData);
};

module.exports = functions.https.onRequest(async (req, res) => {
  const data = req.body && req.body.data ? req.body.data : req.query;
  const experiments = ((data.experimentId !== null && data.experimentId !== undefined) ? data.experimentId : data.id) || "";

  res.setHeader('Content-Type', 'application/json');
  try {
    const results = await getExperimentsData(experiments);
    res.send(results);
  } catch (err) {
    res.status(500).send({ error: err })
  }
});
