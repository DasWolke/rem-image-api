'use strict'

const mongoose = require('mongoose')
const tagSchema = mongoose.Schema({
  id: String,
  name: String,
  hidden: Boolean,
  account: String
})
const tagModel = mongoose.model('Tags', tagSchema)
module.exports = tagModel
