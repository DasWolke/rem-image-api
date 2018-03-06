'use strict'

/**
 * Basic Authentication Provider
 */
class BaseAuthProvider {
  static getId () {
    throw new Error`getId() is not implemented by ${this.constructor.name}`()
  }

  /**
   * Function that checks if all needed option keys are set,
   * throws error otherwise
   * @param options
   */
  checkOptions (options) {
    throw new Error`checkOptions() is not implemented by ${this.constructor.name}`()
  }

  /**
   * Function that checks if the token provided by the client is valid for
   * this route and method
   * @param {String} token The auth token provided by the client
   * @param {String} route Route of the request
   * @param {String} method HTTP Method of the request
   */
  checkToken (token, route, method) {
    throw new Error`checkToken() is not implemented by ${this.constructor.name}`()
  }

  /**
   * Utility function if clients do not use any auth, return true if a auth
   * token is needed
   */
  needToken () {
    throw new Error`checkToken() is not implemented by ${this.constructor.name}`()
  }

  /**
   * Function that resolves the token to a user via the provided authentication service
   * @param token
   * @return {string}
   */
  getUser (token) {
    throw new Error`getUser() is not implemented by ${this.constructor.name}`()
  }
}

module.exports = BaseAuthProvider
