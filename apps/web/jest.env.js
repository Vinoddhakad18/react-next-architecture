/**
 * Custom Jest Environment with Web API polyfills
 */
const JsdomEnvironment = require('jest-environment-jsdom');
const { Request, Response, Headers, fetch } = require('undici');

class CustomTestEnvironment extends JsdomEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    
    // Add Web API polyfills to global scope
    this.global.Request = Request;
    this.global.Response = Response;
    this.global.Headers = Headers;
    this.global.fetch = fetch;
  }
}

module.exports = CustomTestEnvironment;



