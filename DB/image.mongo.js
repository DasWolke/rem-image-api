/**
 * Created by Julian on 04.05.2017.
 */
let mongoose = require('mongoose');
let imageSchema = mongoose.Schema({
    id: String,
    source: String,
    tags: [],
    baseType: String,
    fileType: String,
    mimeType: String,
    nsfw: {type: Boolean, default: false},
    account: String
});
let imageModel = mongoose.model('Image', imageSchema);
module.exports = imageModel;