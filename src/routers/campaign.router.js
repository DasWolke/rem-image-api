const BaseRouter = require('@weeb_services/wapi-core').BaseRouter;
const HTTPCodes = require('@weeb_services/wapi-core').Constants.HTTPCodes;
const pkg = require('../../package.json');
const CampaignModel = require('../DB/campaign.mongo');
const shortid = require('shortid');

class CampaignRouter extends BaseRouter {
    constructor() {
        super();
        this.get('/campaigns', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.upload_campaign) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:upload_campaign`,
                };
            }
            let campaigns = await CampaignModel.find();
            return { status: HTTPCodes.OK, campaigns };
        });
        this.get('/campaigns/:id', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.upload_campaign) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:upload_campaign`,
                };
            }
            let campaign = await CampaignModel.findOne({ id: req.query.id });
            if (!campaign) {
                return { status: HTTPCodes.NOT_FOUND, message: `No campaign found with id ${req.query.id}` };
            }
            return { status: HTTPCodes.OK, campaign };
        });
        this.post('/campaigns', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.upload_campaign) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:upload_campaign`,
                };
            }
            if (!req.body) {
                return { status: HTTPCodes.BAD_REQUEST, message: 'No body was passed' };
            }
            const campaignId = shortid.generate();
            if (!req.body.source || req.body.source === '') {
                return { status: HTTPCodes.BAD_REQUEST, message: 'Missing campaign URL' };
            }
            if (!req.body.probability || isNaN(req.body.probability)) {
                return { status: HTTPCodes.BAD_REQUEST, message: 'Probability is not a number or was not sent' };
            } else if (req.body.probability > 100 || req.body.probability < 1) {
                return { status: HTTPCodes.BAD_REQUEST, message: 'Probability has to lay between 1 and 100' };
            }
            if (!req.body.message || req.body.message === '') {
                return { status: HTTPCodes.BAD_REQUEST, message: 'Missing campaign message' };
            }
            let campaign = new CampaignModel({
                id: campaignId,
                source: req.body.source,
                account: req.account.id,
                probability: req.body.probability,
                message: req.body.message,
                active: req.body.active ? req.body.active : false,
            });
            await campaign.save();
            return {
                status: HTTPCodes.OK, campaign: {
                    id: campaignId,
                    source: req.body.source,
                    account: req.account.id,
                    probability: req.body.probability,
                    message: req.body.message,
                    active: req.body.active ? req.body.active : false,
                },
            };
        });
        this.put('/campagins/:id', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.upload_campaign) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:upload_campaign`,
                };
            }
            if (!req.body) {
                return { status: HTTPCodes.BAD_REQUEST, message: 'No body was passed' };
            }
            let campaign = await CampaignModel.findOne({ id: req.query.id });
            if (!campaign) {
                return { status: HTTPCodes.NOT_FOUND, message: `No campaign found with id ${req.query.id}` };
            }
            if (req.body.campaignId) {
                delete req.body.campaignId;
            }
            campaign = Object.assign(campaign, req.body);
            await campaign.save();
            return { status: HTTPCodes.OK, campaign };
        });
        this.delete('/campaigns/:id', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.upload_campaign) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:upload_campaign`,
                };
            }
            let campaign = await CampaignModel.findOne({ id: req.query.id });
            if (!campaign) {
                return { status: HTTPCodes.NOT_FOUND, message: `No campaign found with id ${req.query.id}` };
            }
            await CampaignModel.delete({ id: req.query.id });
            return { status: HTTPCodes.OK, campaign, message: 'Campaign removed' };
        });
    }
}

module.exports = CampaignRouter;
