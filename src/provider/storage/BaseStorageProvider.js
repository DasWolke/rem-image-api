'use strict';

/**
 * Base Storage Provider, a storage provider implementation should extend this
 * class
 */
class BaseStorageProvider {
    static getId() {
        throw new Error `getId() is not implemented by ${this.constructor.name}`;
    }

    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
    // eslint-disable-next-line no-unused-vars
    checkOptions(options) {
        throw new Error `checkOptions() is not implemented by ${this.constructor.name}`;
    }

    /**
     * Checks if a file with this id exists in the storage provided
     * @param {string} url url of the file to fetch
     * @param {string} filename Filename of the file
     * @returns {Promise}
     */
    // eslint-disable-next-line no-unused-vars
    async getFile(url, filename) {
        throw new Error`getFile() is not implemented by ${this.constructor.name}`;
    }

    /**
     * Uploads file to the specified provider, has to be overwritten by the
     * developer
     * @param {Blob} file File to upload
     * @param {String} mime Mimetype of the file to upload
     * @returns {Promise}
     */
    // eslint-disable-next-line no-unused-vars
    async upload(file, mime) {
        throw new Error `upload() is not implemented by ${this.constructor.name}`;
    }

    /**
     * Removes a file at the given path
     * @param {Object} file File object
     * @param {String} file.id Id of the file
     * @param {String} file.fileType Filetype of the file
     * @returns {Promise}
     */
    // eslint-disable-next-line no-unused-vars
    async removeFile(file) {
        throw new Error `removeFile() is not implemented by ${this.constructor.name}`;
    }
}
module.exports = BaseStorageProvider;
