'use strict';

const BaseMiddleware = require('@weeb_services/wapi-core').BaseMiddleware
const HTTPCodes = require('@weeb_services/wapi-core').Constants.HTTPCodes

/**
 * Simple Authentication Provider
 */
class SimpleAuthProvider extends BaseMiddleware {
    /**
     *
     * @param {Object} options Options for the SimpleAuthProvider
     * @param {string} options.token Admintoken which allows everything
     * that is not whitelisted in the config
     * @param {Array=} options.whitelist - a whitelist of routes that do not require auth
     */
    constructor(options) {
        super();
        options = this.checkOptions(options);
        this.options = options;
    }

    static getId() {
        return 'simple_auth';
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param {Object} options
     * @param {string} options.token - the master auth token
     * @param {Array=} options.whitelist - a whitelist of routes that do not require auth
     * @returns {*} options - the original options
     */
    checkOptions(options) {
        if (!options.token) {
            throw new Error('No master authorization token provided!');
        }
        if (options.whitelist && options.whitelist.length > 0) {
            for (let i = 0; i < options.whitelist; i++) {
                this.whitelist(options.whitelist[i].path, options.whitelist[i].method);
            }
        }
        return options;
    }

    async exec(req) {
        if (!req.headers || !req.headers.authorization) return HTTPCodes.UNAUTHORIZED;
        let authHeader = req.headers.authorization;
        if (authHeader !== this.options.token) return HTTPCodes.UNAUTHORIZED;
        req.account = {id: 'admin', scopes: ['admin']};
        return HTTPCodes.OK;
    }
}

module.exports = SimpleAuthProvider;
