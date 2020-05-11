'use strict';

const BaseStorageProvider = require('./BaseStorageProvider');
let AWS = require('aws-sdk');
let shortid = require('shortid');
let axios = require('axios');
/**
 * Aws S3 Storage Provider, a storage provider using a aws s3 bucket
 */
class AwsS3StorageProvider extends BaseStorageProvider {
    /**
     * @param {Object} options Options for the provider
     */
    constructor(options) {
        super();
        this.checkOptions(options);
        this.options = options;
        AWS.config = new AWS.Config({
            accessKeyId: options.awsAccessKeyId,
            secretAccessKey: options.awsSecretAccessKey,
            region: options.awsRegion,
        });
        this.s3 = new AWS.S3({ endpoint: options.awsEndpoint });
    }

    static getId() {
        return 'aws_s3_storage';
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param {Object} options
     */
    checkOptions(options) {
        if (!options.awsS3Bucket) {
            throw new Error('No S3 Bucket configured');
        }
        if (!options.awsAccessKeyId) {
            throw new Error('No access key id configured');
        }
        if (!options.awsSecretAccessKey) {
            throw new Error('No secret key configured');
        }
        if (!options.awsRegion) {
            throw new Error('No region configured');
        }
        if (!options.cdnurl) {
            throw new Error('No cdn url configured');
        }
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Checks if a file with this id exists in the bucket provided
     * @param {string} url Full Url of the file
     * @returns {Promise}
     */
    getFile(url) {
        return axios.head(url);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Uploads file to the specified provider, has to be overwritten by the
     * developer
     * @param {Blob} file File to upload
     * @param {string} mime Mimetype of the file
     * @param {string} name_append Append a string to the name of the file
     * @returns {Promise}
     */
    upload(file, mime, name_append) {
        return new Promise((res, rej) => {
            let name = shortid();
            name += name_append;
            let type = mime.split('/')
                .slice(1)[0];
            let fqn = `${name}${name_append}.${type}`;
            this.s3.putObject({
                Bucket: this.options.awsS3Bucket,
                Key: `${this.options.storagepath !== '' ? this.options.storagepath.endsWith('/') ? this.options.storagepath : `${this.options.storagepath}/` : ''}${fqn}`,
                Body: file,
                ContentType: mime,
            }, (err) => {
                if (err) {
                    return rej(err);
                }
                return res({
                    name,
                    type,
                    fqn,
                    filepath: `${this.options.cdnurl.endsWith('/') ? this.options.cdnurl : `${this.options.cdnurl}/`}${this.options.storagepath !== '' ? this.options.storagepath.endsWith('/') ? this.options.storagepath : `${this.options.storagepath}/` : ''}${fqn}`,
                });
            });
        });
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Removes a file at the given path
     * @param {Object} file File object
     * @param {string} file.id Id of the file
     * @param {string} file.fileType Filetype of the file
     * @returns {Promise}
     */
    removeFile(file) {
        return new Promise((res, rej) => {
            this.getFile(`${file.id}.${file.fileType}`)
                .then(() => {
                    this.s3.deleteObject({
                        Bucket: this.options.awsS3Bucket,
                        Key: `${this.options.storagepath !== '' ? this.options.storagepath.endsWith('/') ? this.options.storagepath : `${this.options.storagepath}/` : ''}${file.id}.${file.fileType}`,
                    }, (err) => {
                        if (err) {
                            return rej(err);
                        }
                        return res(file);
                    });
                })
                .catch(res);
        });
    }
}

module.exports = AwsS3StorageProvider;
