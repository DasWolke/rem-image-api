/**
 * Created by Julian on 02.05.2017.
 */
const version = require('../package.json').version;
let router = require('express').Router();
router.get('/', ((req, res) => {
    return res.status(200).json({version, message: 'Welcome to the rem-image-api'})
}));

module.exports = router;