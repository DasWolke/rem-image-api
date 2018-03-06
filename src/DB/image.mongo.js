'use strict'

const mongoose = require('mongoose')
const imageSchema = mongoose.Schema({
  id: String,
  source: String,
  tags: [],
  baseType: String,
  fileType: String,
  mimeType: String,
  nsfw: {type: Boolean, default: false},
  account: String,
  hidden: {type: Boolean, default: false}
})
const imageModel = mongoose.model('Images', imageSchema)
module.exports = imageModel
