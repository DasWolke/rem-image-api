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
        return imagePath;
    }
    let fullUrl = req.protocol + '://' + req.get('host');
    if (config.local && config.local.serveFiles) {
        imagePath = `${fullUrl}${config.local.servePath}${config.local.servePath.endsWith('/') ? '' : '/'}${image.id}.${image.fileType}`;
    }
    return imagePath;
}
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (req.provider.auth.needToken()) {
            if (!req.headers.authorization) {
                return res.status(401).json({
                    status: 401,
                    message: `This route requires authentication via a authorization header with a token`
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
        let account = 'master';
        if (req.provider.auth.needToken()) {
            let user = await req.provider.auth.getUser(req.headers.authorization);
            account = user.id;
        }
        let image = new ImageModel({
            id: uploadedFile.name,
            source: req.body.source ? req.body.source : undefined,
            tags,
            baseType: req.body.baseType,
            fileType: uploadedFile.type,
            mimeType: `image/${uploadedFile.type}`,
            nsfw: nsfw,
            account: account
        });
        await image.save();
        //build a full path with url
        let imagePath = buildImagePath(req, req.config.provider.storage, image);
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
router.get('/random', async (req, res) => {
    try {
        let type;
        let nsfw = 'false';
        let query = {};
        if (!req.query.type && !req.query.tags) {
            return res.status(400).json({status: 400, message: 'Missing parameters, add either type or tags'});
        }
        if (req.query.type) {
            query.baseType = req.query.type;
        }
        //if there are tags split them and add them
        if (req.query.tags) {
            let tags = req.query.tags.split(',');
            query.map(t => t.trim());
            query.tags = {$in: tags};
        }
        //switch through the nsfw types
        if (req.query.nsfw) {
            switch (req.query.nsfw) {
                case 'false':
                    nsfw = 'false';
                    query.nsfw = false;
                    break;
                case 'true':
                    nsfw = 'true';
                    break;
                case 'only':
                    nsfw = 'only';
                    query.nsfw = true;
                    break;
                default:
                    break;
            }
        }
        let images = await ImageModel.find(query).distinct('id');
        if (images.length === 0) {
            return res.status(404).json({status: 404, message: 'No image found for your query'});
        }
        let id = images[Math.floor(Math.random() * images.length)];
        let image = await ImageModel.findOne({id});
        if (!image) {
            return res.status(404).json({status: 404, message: 'No image found for your query'});
        }
        //build the full url to the image
        let imagePath = buildImagePath(req, req.config.provider.storage, image);
        //return the image
        return res.status(200).json({
            status: 200,
            id: image.id,
            type: image.baseType,
            baseType: image.baseType,
            nsfw: image.nsfw,
            fileType: image.fileType,
            mimeType: image.mimeType,
            tags: image.tags,
            url: imagePath
        });
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.get('/types', async (req, res) => {
    try {
        let types = await ImageModel.distinct('baseType');
        return res.status(200).json({status: 200, types: types});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.get('/tags', async (req, res) => {
    try {
        let tags = await ImageModel.distinct('tags');
        return res.status(200).json({status: 200, tags: tags});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.get('/info/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({status: 400, message: 'Missing parameters, you need to add an id'});
        }
        let image = await ImageModel.findOne({id: req.params.id});
        if (!image) {
            return res.status(404).json({status: 404, message: 'No image found for your query'});
        }

        let imagePath = buildImagePath(req, req.config.provider.storage, image);
        await req.provider.storage.getFile(`${image.id}.${image.fileType}`);
        //return the image
        return res.status(200).json({
            status: 200,
            id: image.id,
            type: image.baseType,
            baseType: image.baseType,
            nsfw: image.nsfw,
            fileType: image.fileType,
            mimeType: image.mimeType,
            tags: image.tags,
            url: imagePath
        });
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.delete('/info/:id', async (req, res) => {
    try {
        if (req.provider.auth.needToken()) {
            if (!req.headers.authorization) {
                return res.status(401).json({
                    status: 401,
                    message: `This route requires authentication via a authorization header with a valid token`
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
        if (!req.params.id) {
            return res.status(400).json({status: 400, message: 'Missing parameters, you need to add an id'});
        }
        let image = await ImageModel.findOne({id: req.params.id});
        if (!image) {
            return res.status(404).json({status: 404, message: 'No image found for your query'});
        }
        await req.provider.storage.removeFile(image);
        await ImageModel.remove({id: image.id});
        return res.status(200).json({status: 200, message: `Image successfully removed`, image: image});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
module.exports = router;