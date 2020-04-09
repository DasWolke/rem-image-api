'use strict';

let mongoose = require('mongoose');
let campaignSchema = mongoose.Schema({
    id: String,
    source: String,
    account: String,
    probability: Number,
    message: String,
});
let campaignModel = mongoose.model('Campaigns', campaignSchema);
module.exports = campaignModel;
