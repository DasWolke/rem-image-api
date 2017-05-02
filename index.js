/**
 * Created by Julian on 02.05.2017.
 */
const express = require('express');
const bodyParser = require('body-parser');
const loader = require('docker-config-loader');
const winston = require('winston');
const cors = require('cors');
let imageRouter = require('./routes/image.router.js');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    'timestamp': true,
    'colorize': true
});
let config;
try {
    config = loader({secretName: 'secret_name', localPath: './config/main.json'});
} catch (e) {
    winston.error(e);
    winston.error('Failed to require config!');
    process.exit(1);
}
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());
app.use(imageRouter);
app.listen(config.port, config.host);