/**
 * Created by Julian on 07.05.2017.
 */
const BaseAuthProvider = require('./BaseAuthProvider');
/**
 * Simple Authentication Provider
 */
class SimpleAuthProvider extends BaseAuthProvider{
    /**
     *
     * @param {Object} options Options for the SimpleAuthProvider
     * @param {String} options.token Admintoken which allows everything,
     * by default users are only able to call GET endpoints
     * (like random image/tag list),everything else requires auth
     */
    constructor(options) {
        super();
        options = this.checkOptions(options);
        this.options = options;
    }

    /**
     * Function that checks if all needed option keys are set,
     * throws error otherwise
     * @param options
     */
    checkOptions(options) {
        if (!options.token) {
            throw new Error('No token provided!')
        }
        return options;
    }

    /**
     * Function that checks if the token provided by the client is valid for
     * this route and method
     * @param {String} token The auth token provided by the client
     * @param {String} route Route of the request
     * @param {String} method HTTP Method of the request
     */
    checkToken(token, route, method) {
        return token === this.options.token;
    }

    /**
     * Utility function if clients do not use any auth, return true if a auth
     * token is needed
     */
    needToken() {
        return true;
    }
}
module.exports = SimpleAuthProvider;