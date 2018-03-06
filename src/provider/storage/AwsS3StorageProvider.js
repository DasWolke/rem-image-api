'use strict'

const BaseStorageProvider = require('./BaseStorageProvider')
const AWS = require('aws-sdk')
const shortid = require('shortid')
const axios = require('axios')
/**
 * Aws S3 Storage Provider, a storage provider using a aws s3 bucket
 */
class AwsS3StorageProvider extends BaseStorageProvider {
  /**
     * @param {Object} options Options for the provider
     */
  constructor (options) {
    super()
    this.checkOptions(options)
    this.options = options
    AWS.config = new AWS.Config({
      accessKeyId: options.awsAccessKeyId,
      secretAccessKey: options.awsSecretAccessKey,
      region: options.awsRegion
    })
    this.s3 = new AWS.S3()
  }

  static getId () {
    return 'aws_s3_storage'
  }

  // eslint-disable-next-line valid-jsdoc
  /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
  checkOptions (options) {
    if (!options.awsS3Bucket) {
      throw new Error('No S3 Bucket configured')
    }
    if (!options.awsAccessKeyId) {
      throw new Error('No access key id configured')
    }
    if (!options.awsSecretAccessKey) {
      throw new Error('No secret key configured')
    }
    if (!options.awsRegion) {
      throw new Error('No region configured')
    }
    if (!options.cdnurl) {
      throw new Error('No cdn url configured')
    }
  }

  // eslint-disable-next-line valid-jsdoc
  /**
     * Checks if a file with this id exists in the bucket provided
     * @param {string} url Full Url of the file
     * @returns {Promise}
     */
  getFile (url) {
    return axios.head(url)
  }

  // eslint-disable-next-line valid-jsdoc
  /**
     * Uploads file to the specified provider, has to be overwritten by the
     * developer
     * @param {Blob} file File to upload
     * @param {String} mime Mimetype of the file
     * @return {Promise}
     */
  upload (file, mime) {
    return new Promise((resolve, reject) => {
      const name = shortid()
      const type = mime.split('/')
        .slice(1)[0]
      this.s3.putObject({
        Bucket: this.options.awsS3Bucket,
        Key: `${this.options.storagepath !== '' ? this.options.storagepath.endsWith('/') ? this.options.storagepath : `${this.options.storagepath}/` : ''}${name}.${type}`,
        Body: file,
        ContentType: mime
      }, (err) => {
        if (err) {
          return reject(err)
        }
        return resolve({
          name,
          type,
          filepath: `${this.options.cdnurl.endsWith('/') ? this.options.cdnurl : `${this.options.cdnurl}/`}${this.options.storagepath !== '' ? this.options.storagepath.endsWith('/') ? this.options.storagepath : `${this.options.storagepath}/` : ''}${name}.${type}`
        })
      })
    })
  }

  // eslint-disable-next-line valid-jsdoc
  /**
     * Removes a file at the given path
     * @param {Object} file File object
     * @param {String} file.id Id of the file
     * @param {String} file.fileType Filetype of the file
     * @return {Promise}
     */
  removeFile (file) {
    return new Promise((resolve, reject) => {
      this.getFile(`${file.id}.${file.fileType}`)
        .then(() => {
          this.s3.deleteObject({
            Bucket: this.options.awsS3Bucket,
            Key: `${this.options.storagepath !== '' ? this.options.storagepath.endsWith('/') ? this.options.storagepath : `${this.options.storagepath}/` : ''}${file.id}.${file.fileType}`
          }, (err) => {
            if (err) {
              return reject(err)
            }
            return resolve(file)
          })
        })
        .catch(resolve)
    })
  }
}

module.exports = AwsS3StorageProvider
