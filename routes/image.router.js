/**
 * Created by Julian on 02.05.2017.
 */
const Url = require('url');
let router = require('express').Router();
let multer = require('multer');
let storage = multer.memoryStorage();
let upload = multer({storage: storage});
const winston = require('winston');
const ImageModel = require('../DB/image.mongo');
const axios = require('axios');
/**
 * Builds the actual path from the file
 * @param {Object} req the actual request
 * @param {Object} config the loaded config
 * @param {Object} image Image object
 * @return {String} imagePath Path to the image
 */
function buildImagePath(req, config, image) {
    let imagePath;
    if (config.cdnurl) {
        imagePath = `${config.cdnurl}${config.cdnurl.endsWith('/') ? '' : '/'}${image.id}.${image.fileType}`;
    }
    let fullUrl = req.protocol + '://' + req.get('host');
    if (config.provider.storage.local && config.provider.storage.local.serveFiles) {
        imagePath = `${fullUrl}${config.provider.storage.local.servePath}${config.provider.storage.local.servePath.endsWith('/') ? '' : '/'}${image.id}.${image.fileType}`;
    }
    return imagePath;
}
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
        console.log(req.body);
        //stop the request if no actual file/data is present
        if (!req.body.url && !req.file) {
            return res.status(400).json({status: 400, message: 'You have to either pass a file or a url'});
        }
        req.body.baseType = req.body.baseType ? req.body.baseType : (req.body.basetype ? req.body.basetype : '' );
        if (!req.body.baseType) {
            return res.status(400).json({status: 400, message: 'You have to pass the basetype of the file'});
        }
        let uploadedFile;
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
            //upload the file
            uploadedFile = await req.provider.storage.upload(req.file.buffer, req.file.mimetype);
        } else if (req.body.url) {
            try {
                let url = Url.parse(req.body.url);
                try {
                    let head = await axios.head(url.href);
                    //check the file
                    switch (head.headers['content-type']) {
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
                } catch (e) {
                    winston.error(e);
                    return res.status(400).json({
                        status: 400,
                        message: `The url ${req.body.url} is not supported.`
                    });
                }
                let request = await axios.get(url.href, {responseType: 'arraybuffer'});
                uploadedFile = await req.provider.storage.upload(request.data, request.headers['content-type']);
            } catch (e) {
                return res.status(400).json({
                    status: 400,
                    message: `The url ${req.body.url} is not supported.`
                });
            }
        }
        let tags = [];
        if (req.body.tags) {
            tags = req.body.tags.split(',').map(t => {
                t = t.trim();
                return t;
            });
        }
        let nsfw = false;
        if (req.body.nsfw) {
            //support booleans for nsfw
            //when nsfw is not true it will get set to false automatically :D
            nsfw = req.body.nsfw === 'true';
        }
        let account = await req.provider.auth.getUser();
        let image = new ImageModel({
            id: uploadedFile.name,
            source: req.body.source ? req.body.source : undefined,
            tags,
            baseType: req.body.baseType,
            fileType: uploadedFile.type,
            mimeType: `image/${uploadedFile.type}`,
            account: account
        });
        await image.save();
        //build a full path with url
        let imagePath = buildImagePath(req, req.config, image);
        //send the success request to the client
        return res.status(200).json({
            status: 200,
            file: {
                id: image.id, fileType: image.fileType,
                source: image.source,
                baseType: image.baseType,
                tags: image.tags,
                path: imagePath
            },
            message: 'Upload succeeded'
        });
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
module.exports = router;