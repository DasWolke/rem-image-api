const Url = require('url')
const axios = require('axios')
const HttpError = require('@weeb_services/wapi-core').Errors.HttpError
const errorMessages = require('../utils/error.messages')

class ImageController {
  static async uploadImage (req) {
    let uploadedFile
    if (req.file) {
      // only allow certain image files
      try {
        ImageController.checkImageType(req.file.mimetype)
      } catch (e) {
        throw new HttpError(errorMessages.UNSUPPORTED_MIMETYPE(req.file.mimetype), 400)
      }
      // upload the file
      uploadedFile = await req.storageProvider.upload(req.file.buffer, req.file.mimetype)
    } else if (req.body.url) {
      let url
      let head
      try {
        // make a head request to the provided url
        url = Url.parse(req.body.url)
        head = await axios.head(url.href)
        ImageController.checkImageType(head.headers['content-type'])
      } catch (e) {
        if (!head || !head.headers) {
          throw new HttpError(errorMessages.UNSUPPORTED_URL(req.body.url), 400)
        }
        throw new HttpError(errorMessages.UNSUPPORTED_MIMETYPE(head.headers['content-type']), 400)
      }
      try {
        const request = await axios.get(url.href, {responseType: 'arraybuffer'})
        uploadedFile = await req.storageProvider.upload(request.data, request.headers['content-type'])
      } catch (e) {
        throw new HttpError(errorMessages.UNSUPPORTED_URL(req.body.url), 400)
      }
    }
    return uploadedFile
  }

  static checkImageType (type) {
    switch (type) {
      case 'image/jpg':
      case 'image/jpeg':
        break
      case 'image/png':
        break
      case 'image/gif':
        break
      default:
        throw new Error(errorMessages.UNSUPPORTED_MIMETYPE(type))
    }
  }
}

module.exports = ImageController
