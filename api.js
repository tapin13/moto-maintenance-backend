'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const api = require('./libs/apilib');

const app = express();
const port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors('*'));

app.get('/', api.hello);

app.post('/api/register/', api.register);
app.post('/api/login/', api.login);
app.post('/api/maintenances/', api.maintenances);
app.post('/api/record/', api.record);
app.post('/api/maintenance/add/', api.maintenanceAdd);
app.post('/api/vehicles/', api.vehicles);

app.listen(port, () => console.log(`Listening on port ${port}`));

process.on('exit', function(code) {  
    api.dbDisconnect();
    return console.log(`About to exit with code ${code}`);
});

process.on('SIGINT', function() {
    process.exit();
});
