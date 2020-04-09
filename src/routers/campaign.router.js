const BaseRouter = require('@weeb_services/wapi-core').BaseRouter;
const HTTPCodes = require('@weeb_services/wapi-core').Constants.HTTPCodes;
const pkg = require('../../package.json');
const CampaignModel = require('../DB/campaign.mongo');

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
        });
        this.put('/campagins/:id', async (req) => {
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
