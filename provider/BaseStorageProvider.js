/**
 * Created by Julian on 04.05.2017.
 *
 * Base Storage Provider, a storage provider implementation should extend this
 * class
 */
class BaseStorageProvider {
    constructor() {

    }

    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
    checkOptions(options) {
        throw new Error `checkOptions() is not implemented by ${this.constructor.name}`;
    }

    /**
     * Checks if a file with this id exists in the storage provided
     * @param {String} id Unique id of the file
     * @return {Promise}
     */
    async getFile(id) {
        throw new Error `getFile() is not implemented by ${this.constructor.name}`;
    }

    /**
     * Uploads image to the specified provider, has to be overwritten by the
     * developer
     * @param {Blob} image Image to upload
     * @return {Promise}
     */
    async upload(image) {
        throw new Error `upload() is not implemented by ${this.constructor.name}`;
    }
}
module.exports = BaseStorageProvider;