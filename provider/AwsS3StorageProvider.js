/**
 * Created by Julian on 06.05.2017.
 **/
import BaseStorageProvider from "./BaseStorageProvider";

/**
 * Aws S3 Storage Provider, a storage provider using a aws s3 bucket
 */
export default class AwsS3StorageProvider extends BaseStorageProvider {
    /**
     * @param {Object} options Options for the provider
     */
    constructor(options) {
        super();
        this.checkOptions(options);
        this.options = options;
    }

    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
    checkOptions(options) {

    }

    /**
     * Checks if a file with this id exists in the bucket provided
     * @param {String} id Unique id of the file
     * @return {Promise}
     */
    async getFile(id) {

    }

    /**
     * Uploads image to the specified s3 bucket
     * @param {Blob} image Image to upload
     * @return {Promise}
     */
    async upload(image) {

    }
}
