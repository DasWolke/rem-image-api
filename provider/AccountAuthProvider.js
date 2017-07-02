/**
 * Created by Julian on 07.05.2017.
 */
const BaseAuthProvider = require('./BaseAuthProvider');
const axios = require('axios');
/**
 * Account Authentication Provider
 * Uses the account api to resolve the token to a user, the actual auth is done
 * by an api gateway which is in front of all apis.
 */
class AccountAuthProvider extends BaseAuthProvider {
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
        if (!options.apiurl) {
            throw new Error('No api url for the account api provided')
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
        return true;
    }

    /**
     * Utility function if clients do not use any auth, return true if a auth
     * token is needed
     */
    needToken() {
        return true;
    }

    /**
     * Function that resolves the token to a user via the provided authentication service
     * @param token
     * @return {string}
     */
    async getUser(token) {
        token = token.substring(0, token.length / 2);
        let req = await axios.get(`${this.options.apiurl}/token/${token}`);
        if (!req.data.active) {
            throw new Error('passed token is inactive');
        }
        return {id: req.data.id, active: req.data.active};
    }
}
module.exports = AccountAuthProvider;