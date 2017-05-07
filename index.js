/**
 * Created by Julian on 02.05.2017.
 */
global.Promise = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const loader = require('docker-config-loader');
const winston = require('winston');
const cors = require('cors');
let genericRouter = require('./routes/generic.router');
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
if (!config.provider) {
    return winston.error('No providers configured');
}
if (!config.provider.storage) {
    return winston.error('No storage provider configured');
}
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(config.dburl, (err) => {
    if (err) {
        winston.error("Unable to connect to Mongo Server!");
        process.exit(1);
    }
});
let app = express();
//serve local files if set in config
if (config.provider.storage.local && config.provider.storage.local.serveFiles) {
    app.use(config.provider.storage.local.servePath, express.static(config.provider.storage.storagepath));
}
let StorageProvider = require(config.provider.storage.classpath);
let sp = new StorageProvider(config.provider.storage);
let AuthProvider = config.provider.auth.use ? require(config.provider.auth.classpath) : undefined;
let ap = config.provider.auth.use ? new AuthProvider(config.provider.auth) : undefined;
app.use((req, res, next) => {
    req.provider = {};
    req.provider.storage = sp;
    if (ap !== undefined) {
        req.provider.auth = ap;
    } else {
        req.provider.auth = {
            needToken: () => {
                return false;
            },
            getUser: () => {
                return 'anonymous';
            }
        };
    }
    req.config = config;
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(genericRouter, imageRouter);
app.listen(config.port, config.host);
winston.info(`Server started ${config.host}:${config.port}`);