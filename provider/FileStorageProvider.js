/**
 * Created by Julian on 04.05.2017.
 *
 **/
const fs = require('fs');
const path = require('path');
const BaseStorageProvider = require('./BaseStorageProvider');

/**
 * File Storage Provider, a storage provider that is using the local filesystem
 */
class FileStorageProvider extends BaseStorageProvider {
    /**
     * @param {Object} options Options for the provider
     * @param {String} options.storagepath Directory where the files should be saved/loaded
     *
     */
    constructor(options) {
        super();
        options = this.checkOptions(options);
        this.options = options;
    }

    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
    checkOptions(options) {
        if (options.storagepath) {
            options.storagepath = path.resolve(options.storagepath);
        } else {
            throw new Error('Missing option path');
        }
        return options;
    }

    /**
     * Checks if a file with this id exists in the storage provided
     * @param {String} id Unique id of the file
     * @return {Promise}
     */
    getFile(id) {
        return new Promise((res, rej) => {
            fs.readdir(this.options.path, (err, stats) => {
                if (err) return rej(err);
                console.log(stats);
            });
        });
    }

    /**
     * Uploads image to the specified provider, has to be overwritten by the
     * developer
     * @param {Blob} image Image to upload
     * @return {Promise}
     */
    upload(image) {
        return new Promise((res, rej) => {

        });
    }
}
module.exports = FileStorageProvider;
