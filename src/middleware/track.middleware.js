const Middleware = require('wapi-core').BaseMiddleware;
const ua = require('universal-analytics');

class Track extends Middleware {
    async exec(req) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        let fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        if (req.headers['CF-Connecting-IP']) {
            ip = req.headers['CF-Connecting-IP'];
        }
        let ipList = ip.split(',');
        if (ipList.length > 0) {
            ip = ipList[0];
        }
        let visitor = ua(req.config.track, {https: true});
        visitor.pageview({
            uid: req.account.id,
            uip: ip,
            ua: req.headers['user-agent'],
            dl: fullUrl
        }, (err) => {
            if (err) {
                console.log(err);
            }
        });
        return {status: 200};
    }
}

module.exports = Track;
