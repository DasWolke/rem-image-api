/**
 * Created by Julian on 04.05.2017.
 *
 **/
const fs = require('fs');
const path = require('path');
const BaseStorageProvider = require('./BaseStorageProvider');
const shortid = require('shortid');
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
     * Uploads file to the specified provider, has to be overwritten by the
     * developer
     * @param {Blob} file File to upload
     * @param {String} mime Mimetype of the file
     * @return {Promise}
     */
    upload(file, mime) {
        return new Promise((res, rej) => {
            let name = shortid();
            let type = mime.split('/').slice(1)[0];
            let filepath = path.join(this.options.storagepath, `${name}.${type}`);
            let write = fs.createWriteStream(filepath);
            write.once('open', (fd) => {
                fs.write(fd, file, (err) => {
                    if (err) {
                        return rej(err);
                    }
                    write.close();
                    res({name, type, filepath});
                });
            });
        });
    }
}
module.exports = FileStorageProvider;
