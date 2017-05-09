/**
 * Created by Julian on 04.05.2017.
 *
 **/
const {promisifyAll} = require('tsubaki');
const fs = promisifyAll(require('fs'));
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
            throw new Error('No file storage path configured');
        }
        return options;
    }

    /**
     * Checks if a file with this id exists in the storage provided
     * @param {String} filename Filename of the file
     * @return {Promise}
     */
    async getFile(filename) {
        let stats = await fs.readdirAsync(this.options.storagepath);
        let FileData = stats.filter(f => {
            return f === filename;
        });
        if (!FileData) {
            throw new Error(`File ${filename} does not exist`);
        }
        return FileData;
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

    /**
     * Removes a file at the given path
     * @param {Object} file File object
     * @param {String} file.id Id of the file
     * @param {String} file.fileType Filetype of the file
     * @return {Promise}
     */
    async removeFile(file) {
        await this.getFile(`${file.id}.${file.fileType}`);
        let filepath = path.join(this.options.storagepath, `${file.id}.${file.fileType}`);
        await fs.unlinkAsync(filepath);
        return file;
    }
}
module.exports = FileStorageProvider;
