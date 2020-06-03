const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const createExportAbExperiment = require('./exportAbExperiment');
const createExportBoundaryExperiments = require('./exportBoundaryExperiment');


const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: true }));


module.exports.exportAbExperiment = createExportAbExperiment(app);
module.exports.exportBoundaryExperiments = createExportBoundaryExperiments(app);
