'use strict'

const mongoose = require('mongoose')
const typeSchema = mongoose.Schema({
  id: String,
  name: String
})
const typeModel = mongoose.model('Types', typeSchema)
module.exports = typeModel
