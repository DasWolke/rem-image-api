/**
 * Created by Julian on 02.05.2017.
 */
let router = require('express').Router();
let multer = require('multer');
let storage = multer.memoryStorage();
let upload = multer({storage: storage});
const winston = require('winston');
const ImageModel = require('../DB/image.mongo');
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (req.provider.auth.needToken()) {
            if (!req.headers.authorization) {
                return res.status(401).json({
                    status: 401,
                    message: `This route requires authentization via a authorization header with a token`
                });
            }
            let auth = await req.provider.auth.checkToken(req.headers.authorization, '/upload', 'post');
            if (!auth) {
                return res.status(401).json({
                    status: 401,
                    message: `The provided token is not valid or does not have enough permissions for this route`
                });
            }
        }
        if (req.file) {
            //only allow certain image files
            switch (req.file.mimetype) {
                case 'image/jpeg':
                    break;
                case 'image/png':
                    break;
                case 'image/gif':
                    break;
                default:
                    return res.status(400).json({
                        status: 400,
                        message: `The mimetype ${req.file.mimetype} is not supported`
                    });
            }
            let uploadedFile = await req.provider.storage.upload(req.file.buffer, req.file.mimetype);
            console.log(uploadedFile);
        }
        res.status(200).json({status: 200, message: 'uwu'});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
module.exports = router;