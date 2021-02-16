const functions = require('firebase-functions');

const admin = require('./services/admin');

const { makeResponse, valFromQuery } = require('./utils');


const getExperimentData = async (experimentId) => {
  try {
    const metaData = await valFromQuery(
      admin.database().ref('meta').child(experimentId),
    );

    const resultsByUserId = await valFromQuery(
      admin.database().ref('results').child(experimentId),
    );

    const userIds = Object.keys(resultsByUserId || {});

    const flattenedResults = userIds.reduce((arr, userId) => {
      const userResults = resultsByUserId[userId];

      const resultIds = Object.keys(userResults || {});

      const formattedUserResults = resultIds.map((resultId) => {
        const result = { ...userResults[resultId] };
        result.user = userId;
        result.id = resultId;
        return result;
      });

      return [...arr, ...formattedUserResults];
    }, []);

    return makeResponse(flattenedResults, metaData);
  } catch (err) {
    console.log(`error exporting a/b data for experiment: ${experimentId}`);
    console.log(err);
    return err;
  }
};

const handleExperimentData = async (id, req, res) => {
  try {
    const results = await getExperimentData(id);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).send({ error: { message: err.message } })
  }
};

module.exports = (app) => {
  app.all('/:id', async (req, res) => {
    const { id } = req.params;
    return handleExperimentData(id, req, res);
  });

  return functions.https.onRequest(app);
};
