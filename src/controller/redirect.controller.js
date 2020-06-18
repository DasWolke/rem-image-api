class RedirectController {
    async createRedirect(image, campaign, storageProvider) {
        const storageOptions = storageProvider._getOptions();
        const s3 = storageProvider._getS3();
        let data = await this._fetchRulesObject(s3, storageOptions);
        data = this._addRule(data, image, campaign, storageOptions);
        console.log(image);
        console.log(campaign);
        console.log(data);
        await this._updateRulesObject(s3, storageOptions, data);
    }

    async deleteRedirect() {

    }

    async _fetchRulesObject(s3, storageOptions) {
        let data = await s3.getObject({ Bucket: storageOptions.awsS3Bucket, Key: storageOptions.awsRuleFile })
            .promise();
        return JSON.parse(data.Body);
    }

    _addRule(data, image, campaign, storageOptions) {
        const rule = this._generateRule(image, campaign, storageOptions);
        data.wildcards.push(rule);
        return data;
    }

    _generateRule(image, campaign, storageOptions) {
        return {
            original: `/${storageOptions.storagepath}/${image.id}-${campaign.id}-x.${image.fileType}`,
            redirect: campaign.source,
            statusCode: 302,
            startTime: '',
            endTime: '',
        };
    }

    async _updateRulesObject(s3, storageOptions, rules) {
        return s3.putObject({ Bucket: storageOptions.awsS3Bucket, Key: storageOptions.awsRuleFile, Body: JSON.stringify(rules) })
            .promise();
    }
}

module.exports = RedirectController;
