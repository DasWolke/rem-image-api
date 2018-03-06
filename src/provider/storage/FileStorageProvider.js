/* eslint-disable valid-jsdoc */
'use strict'

const {promisifyAll} = require('tsubaki')
const fs = promisifyAll(require('fs'))
const path = require('path')
const BaseStorageProvider = require('./BaseStorageProvider')
const shortid = require('shortid')
/**
 * File Storage Provider, a storage provider that is using the local filesystem
 */
class FileStorageProvider extends BaseStorageProvider {
  /**
     * @param {Object} options Options for the provider
     * @param {String} options.storagepath Directory where the files should be saved/loaded
     *
     */
  constructor (options) {
    super()
    options = this.checkOptions(options)
    this.options = options
  }

  static getId () {
    return 'file_storage'
  }

  /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
  checkOptions (options) {
    if (options.storagepath) {
      options.storagepath = path.resolve(options.storagepath)
    } else {
      throw new Error('No file storage path configured')
    }
    return options
  }

  /**
     * Checks if a file with this id exists in the storage provided
     * @param {string} url Url of the file
     * @param {string} filename Filename of the file
     * @return {Promise}
     */
  async getFile (url, filename) {
    const stats = await fs.readdirAsync(this.options.storagepath)
    const FileData = stats.filter(f => f === filename)
    if (!FileData) {
      throw new Error(`File ${filename} does not exist`)
    }
    return FileData
  }

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
      const filepath = path.join(this.options.storagepath, `${name}.${type}`)
      const write = fs.createWriteStream(filepath)
      write.once('error', (e) => reject(e))
      write.once('open', (fd) => {
        fs.write(fd, file, (err) => {
          if (err) {
            return reject(err)
          }
          write.close()
          resolve({name, type, filepath})
        })
      })
    })
  }

  /**
     * Removes a file at the given path
     * @param {Object} file File object
     * @param {String} file.id Id of the file
     * @param {String} file.fileType Filetype of the file
     * @return {Promise}
     */
  async removeFile (file) {
    await this.getFile(`${file.id}.${file.fileType}`)
    const filepath = path.join(this.options.storagepath, `${file.id}.${file.fileType}`)
    await fs.unlinkAsync(filepath)
    return file
  }
}

module.exports = FileStorageProvider
