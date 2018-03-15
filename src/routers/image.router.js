/**
 * Created by Julian on 02.05.2017.
 */

const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({storage: storage})
const logger = require('@weeb_services/wapi-core').Logger
const ImageModel = require('../DB/image.mongo')
const BaseRouter = require('@weeb_services/wapi-core').BaseRouter
const HTTPCodes = require('@weeb_services/wapi-core').Constants.HTTPCodes
const pkg = require('../../package.json')
const ImageController = require('../controllers/image.controller')
const utils = require('../utils/utils')
const HttpError = require('@weeb_services/wapi-core').Errors.HttpError
const {checkPermissions, buildMissingScopeMessage} = require('@weeb_services/wapi-core').Utils

class ImageRouter extends BaseRouter {
  constructor () {
    super()
    this.router()
      .post('/upload', upload.single('file'), async (req, res) => {
        try {
          if (!checkPermissions(req.account, ['upload_image', 'upload_image_private'])) {
            return res.status(HTTPCodes.FORBIDDEN)
              .json({
                status: HTTPCodes.FORBIDDEN,
                message: buildMissingScopeMessage(pkg.name, req.config.env, ['upload_image', 'upload_image_private'])
              })
          }
          // if a user tried to upload a non private image and does not have the needed scope
          if (!utils.isTrue(req.body.hidden)) {
            if (!checkPermissions(req.account, ['upload_image'])) {
              return res.status(HTTPCodes.FORBIDDEN)
                .json({
                  status: HTTPCodes.FORBIDDEN,
                  message: buildMissingScopeMessage(pkg.name, req.config.env, ['upload_image'])
                })
            }
          }
          // stop the request if no actual file/data is present
          if (!req.body.url && !req.file) {
            return res.status(400)
              .json({status: 400, message: 'You have to either pass a file or a url'})
          }
          if (!req.body.baseType) {
            return res.status(400)
              .json({status: 400, message: 'You have to pass the basetype of the file'})
          }
          const uploadedFile = await ImageController.uploadImage(req)
          const hidden = utils.isTrue(req.body.hidden)
          const nsfw = utils.isTrue(req.body.nsfw)
          let tags = []
          if (req.body.tags) {
            tags = req.body.tags.split(',')
              .map(t => {
                t = t.trim()
                return {name: t, hidden, user: req.account.id}
              })
          }
          const image = new ImageModel({
            id: uploadedFile.name,
            source: req.body.source ? req.body.source : undefined,
            tags,
            baseType: req.body.baseType,
            fileType: uploadedFile.type,
            mimeType: `image/${uploadedFile.type}`,
            nsfw,
            hidden,
            account: req.account.id
          })
          await image.save()
          // build a full path with url
          const imagePath = this.buildImagePath(req, req.config.provider.storage, image)
          // send the success request to the client
          return res.status(HTTPCodes.OK)
            .json({
              status: HTTPCodes.OK,
              file: {
                id: image.id,
                fileType: image.fileType,
                source: image.source,
                baseType: image.baseType,
                tags: image.tags,
                url: imagePath,
                hidden,
                nsfw,
                account: req.account.id
              },
              message: 'Upload succeeded'
            })
        } catch (e) {
          if (e instanceof HttpError) {
            return res.status(e.status)
              .json({status: e.status, message: e.message})
          }
          logger.error(e)
          return res.status(HTTPCodes.INTERNAL_SERVER_ERROR)
            .json({status: HTTPCodes.INTERNAL_SERVER_ERROR, message: 'Internal error'})
        }
      })
    this.get('/types', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_data) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_data`
          }
        }
        let query = {}
        if (req.query.hidden) {
          switch (req.query.hidden) {
            case 'false':
              query.hidden = false
              break
            case 'true':
              query.hidden = true
              query.account = req.account.id
              break
            default:
              break
          }
        } else {
          query = {$or: [{hidden: false}, {account: req.account.id, hidden: true}]}
        }
        // switch through the nsfw types
        if (req.query.nsfw) {
          switch (req.query.nsfw) {
            case 'false':
              query.nsfw = false
              break
            case 'true':
              break
            case 'only':
              query.nsfw = true
              break
            default:
              query.nsfw = false
              break
          }
        } else {
          query.nsfw = false
        }
        const types = await ImageModel.distinct('baseType', query)
        const preview = []
        if (req.query.preview) {
          for (const type of types) {
            query.baseType = type
            const image = await ImageModel.findOne(query, {id: 1, baseType: 1, fileType: 1})
              .lean()
              .exec()
            if (image) {
              image.url = this.buildImagePath(req, req.config.provider.storage, image)
              preview.push({
                url: image.url,
                id: image.id,
                fileType: image.fileType,
                baseType: type,
                type
              })
            }
          }
        }
        return {status: 200, types: types, preview}
      } catch (e) {
        logger.error(e)
        return {status: HTTPCodes.INTERNAL_SERVER_ERROR, message: 'Internal error'}
      }
    })

    this.get('/tags', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_data) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_data`
          }
        }
        let query = {}
        if (req.query.hidden) {
          switch (req.query.hidden) {
            case 'false':
              query.hidden = false
              break
            case 'true':
              query.hidden = true
              query.user = req.account.id
              break
            default:
              break
          }
        } else {
          query = {$or: [{'tags.hidden': false}, {'tags.user': req.account.id, 'tags.hidden': true}]}
        }
        // switch through the nsfw types
        if (req.query.nsfw) {
          switch (req.query.nsfw) {
            case 'false':
              query.nsfw = false
              break
            case 'true':
              break
            case 'only':
              query.nsfw = true
              break
            default:
              query.nsfw = false
              break
          }
        } else {
          query.nsfw = false
        }
        const tags = await ImageModel.distinct('tags.name', query)
        return {status: HTTPCodes.OK, tags}
      } catch (e) {
        logger.error(e)
        return {status: HTTPCodes.INTERNAL_SERVER_ERROR, message: 'Internal error'}
      }
    })

    this.get('/random', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_data) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_data`
          }
        }
        const query = {}
        if (!req.query.type && !req.query.tags) {
          return {status: 400, message: 'Missing parameters, add either type or tags'}
        }
        if (req.query.type) {
          query.baseType = req.query.type
        }
        // if there are tags split them and add them
        if (req.query.tags) {
          let tags = req.query.tags.split(',')
          tags = tags.map(t => {
            t = t.trim()
            return t
          })
          query.tags = {
            $elemMatch: {
              $or: [{name: {$in: tags}, hidden: false}, {
                name: {$in: tags},
                hidden: true,
                user: req.account.id
              }]
            }
          }
        }
        // switch through the nsfw types
        if (req.query.nsfw) {
          switch (req.query.nsfw) {
            case 'false':
              query.nsfw = false
              break
            case 'true':
              break
            case 'only':
              query.nsfw = true
              break
            default:
              query.nsfw = false
              break
          }
        } else {
          query.nsfw = false
        }
        if (req.query.hidden) {
          switch (req.query.hidden) {
            case 'false':
              query.hidden = false
              break
            case 'true':
              query.hidden = true
              query.account = req.account.id
              break
            default:
              query.$or = [{hidden: false}, {hidden: true, account: req.account.id}]
              break
          }
        } else {
          query.$or = [{hidden: false}, {hidden: true, account: req.account.id}]
        }
        if (req.query.filetype) {
          switch (req.query.filetype) {
            case 'jpg':
            case 'jpeg':
              query.fileType = {$in: ['jpeg', 'jpg']}
              break
            case 'png':
              query.fileType = 'png'
              break
            case 'gif':
              query.fileType = 'gif'
              break
            default:
              break
          }
        }
        const images = await ImageModel.find(query)
          .distinct('id')
        if (images.length === 0) {
          return {status: 404, message: 'No image found for your query'}
        }
        const id = images[Math.floor(Math.random() * images.length)]
        const image = await ImageModel.findOne({id})
          .lean()
          .exec()
        if (!image) {
          return {status: 404, message: 'No image found for your query'}
        }
        if (image.tags && image.tags.length > 0) {
          image.tags = this.filterHiddenTags(image, req.account)
        }
        // build the full url to the image
        const imagePath = this.buildImagePath(req, req.config.provider.storage, image)
        // return the image
        return {
          status: 200,
          id: image.id,
          type: image.baseType,
          baseType: image.baseType,
          nsfw: image.nsfw,
          fileType: image.fileType,
          mimeType: image.mimeType,
          account: image.account,
          hidden: image.hidden,
          tags: image.tags,
          url: imagePath
        }
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
    this.get('/info', async () => ({status: 400, message: 'Missing parameters, you need to add an id'}))
    this.get('/info/:id', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_data) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_data`
          }
        }
        const image = await ImageModel.findOne({id: req.params.id})
        if (!image) {
          return {status: 404, message: 'No image found for your query'}
        }
        if (image.hidden && image.account !== req.account.id) {
          return {status: HTTPCodes.FORBIDDEN, message: 'This image is private'}
        }
        if (image.tags && image.tags.length > 0) {
          image.tags = this.filterHiddenTags(image, req.account)
        }
        const imagePath = this.buildImagePath(req, req.config.provider.storage, image)
        try {
          await req.storageProvider.getFile(imagePath, `${image.id}.${image.fileType}`)
        } catch (e) {
          return {status: 404, message: 'Image exists in Database but not in Filestorage'}
        }

        // return the image
        return {
          status: 200,
          id: image.id,
          type: image.baseType,
          baseType: image.baseType,
          nsfw: image.nsfw,
          fileType: image.fileType,
          mimeType: image.mimeType,
          tags: image.tags,
          url: imagePath,
          hidden: image.hidden,
          account: image.account
        }
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
    this.post('/info/:id/tags', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_tags) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_tags`
          }
        }
        const image = await ImageModel.findOne({id: req.params.id})
        if (!image) {
          return {status: 404, message: 'No image found for your query'}
        }
        if (!req.body.tags) {
          return {status: 400, message: 'No tags were supplied'}
        }
        if (image.hidden && image.account !== req.account.id) {
          return {status: HTTPCodes.FORBIDDEN, message: 'This image is private'}
        }
        let tags
        try {
          tags = this.filterTags(req.body.tags, image.tags, req.account.id)
        } catch (e) {
          return {status: 400, message: e.message}
        }
        if (tags.addedTags.length === 0) {
          return {status: 400, message: 'Tags existed already or had no content'}
        }
        for (const tag of tags.addedTags) {
          image.tags.push(tag)
        }
        await image.save()
        return {status: 200, image, tags}
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
    this.delete('/info/:id/tags', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_tags_delete) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_tags_delete`
          }
        }
        if (!req.body.tags) {
          return {status: 400, message: 'No tags were supplied'}
        }
        const image = await ImageModel.findOne({id: req.params.id})
        if (image.hidden && image.account !== req.account.id) {
          return {status: HTTPCodes.FORBIDDEN, message: 'This image is private'}
        }
        const tags = []
        for (const tag of req.body.tags) {
          const tagContent = this.getTagContent(tag)
          if (!tagContent) {
            continue
          }
          tags.push(tagContent.toLocaleLowerCase())
        }
        // only return tags that should not be removed;
        image.tags = image.tags.filter((t) => tags.indexOf(t.name.toLocaleLowerCase()) <= -1)
        await image.save()
        return {status: 200, image}
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
    this.delete('/info/:id', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_delete && !req.account.perms.image_delete_private) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope(s) ${pkg.name}-${req.config.env}:image_delete or ${pkg.name}-${req.config.env}:image_delete_private`
          }
        }
        if (!req.params.id) {
          return {status: 400, message: 'Missing parameters, you need to add an id'}
        }
        const image = await ImageModel.findOne({id: req.params.id})
        if (!image) {
          return {status: 404, message: 'No image found for your query'}
        }
        if (!image.hidden || (image.hidden && image.account !== req.account.id)) {
          if (!req.account.perms.all && !req.account.perms.image_delete) {
            return {
              status: HTTPCodes.FORBIDDEN,
              message: `missing scope ${pkg.name}-${req.config.env}:image_delete`
            }
          }
        }
        await req.storageProvider.removeFile(image)
        await ImageModel.remove({id: image.id})
        return {status: 200, message: `Image successfully removed`, image: image}
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
    this.get('/list/', async (req) => {
      try {
        if (!req.account.perms.all && !req.account.perms.image_list_all) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope(s) ${pkg.name}-${req.config.env}:image_list_all`
          }
        }
        let page = 0
        const query = {}
        if (req.query.page) {
          try {
            req.query.page = parseInt(req.query.page)
          } catch (e) {
            logger.warn(e)
          }
          if (!isNaN(req.query.page)) {
            page = req.query.page - 1
          } else {
            page = 0
          }
        }
        if (page < 0) {
          page = 0
        }
        if (req.query.type) {
          query.baseType = req.query.type
        }
        if (req.query.nsfw) {
          switch (req.query.nsfw) {
            case 'false':
              query.nsfw = false
              break
            case 'true':
              break
            case 'only':
              query.nsfw = true
              break
            default:
              break
          }
        }
        if (req.query.hidden) {
          switch (req.query.hidden) {
            case 'false':
              query.hidden = false
              break
            case 'true':
              query.hidden = true
              break
            default:
              break
          }
        }
        if (req.query.filetype) {
          switch (req.query.filetype) {
            case 'jpg':
            case 'jpeg':
              query.fileType = {$in: ['jpeg', 'jpg']}
              break
            case 'png':
              query.fileType = 'png'
              break
            case 'gif':
              query.fileType = 'gif'
              break
            default:
              break
          }
        }
        const totalImages = await ImageModel.count(query)
        let images = await ImageModel.find(query)
          .skip(page * 25)
          .limit(25)
          .lean()
          .exec()
        images = images.map(img => {
          img.url = this.buildImagePath(req, req.config.provider.storage, img)
          return img
        })
        return {images, total: totalImages, page: page + 1}
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
    this.get('/list/:id', async (req) => {
      try {
        if (req.account && !req.account.perms.all && !req.account.perms.image_list_all && !req.account.perms.image_list) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope(s) ${pkg.name}-${req.config.env}:image_list or ${pkg.name}-${req.config.env}:image_list_all`
          }
        }
        if (req.params.id !== req.account.id && !req.account.perms.all && !req.account.perms.image_list_all) {
          return {
            status: HTTPCodes.FORBIDDEN,
            message: `missing scope ${pkg.name}-${req.config.env}:image_list_all`
          }
        }
        let page = 0
        const query = {account: req.params.id}
        if (req.query.page) {
          try {
            req.query.page = parseInt(req.query.page)
          } catch (e) {
            logger.warn(e)
          }
          if (!isNaN(req.query.page)) {
            page = req.query.page - 1
          } else {
            page = 0
          }
        }
        if (page < 0) {
          page = 0
        }
        if (req.query.type) {
          query.baseType = req.query.type
        }
        if (req.query.nsfw) {
          switch (req.query.nsfw) {
            case 'false':
              query.nsfw = false
              break
            case 'true':
              break
            case 'only':
              query.nsfw = true
              break
            default:
              break
          }
        }
        if (req.query.hidden) {
          switch (req.query.hidden) {
            case 'false':
              query.hidden = false
              break
            case 'true':
              query.hidden = true
              break
            default:
              break
          }
        }
        if (req.query.filetype) {
          switch (req.query.filetype) {
            case 'jpg':
            case 'jpeg':
              query.fileType = {$in: ['jpeg', 'jpg']}
              break
            case 'png':
              query.fileType = 'png'
              break
            case 'gif':
              query.fileType = 'gif'
              break
            default:
              break
          }
        }
        const totalImages = await ImageModel.count(query)
        let images = await ImageModel.find(query)
          .skip(page * 25)
          .limit(25)
          .lean()
          .exec()
        images = images.map(img => {
          img.url = this.buildImagePath(req, req.config.provider.storage, img)
          return img
        })
        return {images, total: totalImages, page: page + 1}
      } catch (e) {
        logger.error(e)
        return {status: 500, message: 'Internal error'}
      }
    })
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * Builds the actual path from the file
   * @param {Object} req the actual request
   * @param {Object} config the loaded config
   * @param {Object} image Image object
   * @return {string} imagePath Path to the image
   */
  buildImagePath (req, config, image) {
    let imagePath
    if (config.cdnurl && (!config.local || !config.local.serveFiles)) {
      imagePath = `${config.cdnurl}${config.cdnurl.endsWith('/') ? '' : '/'}${config.storagepath !== '' ? config.storagepath.endsWith('/') ? config.storagepath : `${config.storagepath}/` : ''}${image.id}.${image.fileType}`
      return imagePath
    }
    const fullUrl = `${req.protocol}://${req.get('host')}`
    if (config.local && config.local.serveFiles) {
      imagePath = `${fullUrl}${config.local.servePath}${config.local.servePath.endsWith('/') ? '' : '/'}${image.id}.${image.fileType}`
    }
    return imagePath
  }

  filterTags (submittedTags, imageTags, accountId) {
    const addedTags = []
    const skippedTags = []
    for (const tag of submittedTags) {
      const tagContent = this.getTagContent(tag)
      if (!tagContent) {
        skippedTags.push('Tag without content')
      }
      if (this.checkTagExist(tag, imageTags)) {
        skippedTags.push(tag)
        continue
      }
      let sanitizedTag = {user: accountId}
      if (typeof tag === 'string') {
        sanitizedTag = {hidden: false, user: accountId, name: tagContent}
      }
      if (!tag.name && typeof tag !== 'string') {
        throw new Error('Expected tags to contain array of strings or array of tag objects')
      }
      sanitizedTag.name = tagContent
      if (!tag.hidden) {
        sanitizedTag.hidden = false
      }
      addedTags.push(sanitizedTag)
    }
    return {addedTags, skippedTags}
  }

  /**
   * Utility method that checks if a tag already exists within an image
   * @param {string|Object} tag - User submitted tag, may either be an object or a method
   * @param {Array} imageTags - Array of tag objects
   * @returns {boolean} returns true if the tag exists and false if not
   */
  checkTagExist (tag, imageTags) {
    const tagContent = this.getTagContent(tag)
    for (const imageTag of imageTags) {
      if (imageTag.name.toLocaleLowerCase() === tagContent.toLocaleLowerCase()) {
        return true
      }
    }
    return false
  }

  /**
   * Utility method that returns the content of a tag with whitespace removed
   * @param {Object|string} tag - User submitted tag, may either be an object or a method
   * @returns {string|null} content of the tag or null if the tag had no content
   */
  getTagContent (tag) {
    if (typeof tag !== 'string') {
      if (!tag.name) {
        return null
      } else {
        return tag.name.trim()
      }
    } else {
      return tag.trim()
    }
  }

  /**
   * Filters out tags to only show the tags a user may see
   * @param {Object} image - The Image that should be filtered
   * @param {Object} account - The account that made the request
   * @returns {Object} - Image with filtered tags
   */
  filterHiddenTags (image, account) {
    return image.tags.filter(t => {
      if (t.hidden && t.user === account.id) {
        return true
      }
      return !t.hidden
    })
  }
}

module.exports = ImageRouter
