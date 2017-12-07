const Middleware = require('wapi-core').BaseMiddleware;
const ua = require('universal-analytics');

class Track extends Middleware {
    async exec(req) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (req.headers['CF-Connecting-IP']) {
            ip = req.headers['CF-Connecting-IP'];
        }
        let visitor = ua(req.config.track, {https: true});
        visitor.pageview({
            uid: req.account.id,
            uip: ip,
            ua: req.headers['User-Agent'],
            dl: req.originalUrl
        }, (err) => {
            console.log(err);
        });
        return {status: 200};
    }
}

module.exports = Track;
