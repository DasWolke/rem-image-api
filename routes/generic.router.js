/**
 * Created by Julian on 06.05.2017.
 */
const version = require('../package.json').version;
let router = require('express').Router();
router.all('/', ((req, res) => {
    return res.status(200).json({status:200, version, message: 'Welcome to the rem-image-api'})
}));
module.exports = router;