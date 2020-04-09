'use strict';

let mongoose = require('mongoose');
let imageSchema = mongoose.Schema({
    id: String,
    source: String,
    tags: [],
    baseType: String,
    fileType: String,
    mimeType: String,
    nsfw: {type: Boolean, default: false},
    account: String,
    hidden: {type: Boolean, default: false},
    campaignId: String,
});
let imageModel = mongoose.model('Images', imageSchema);
module.exports = imageModel;
