/**
 * Jest Polyfills
 * Web API polyfills that need to be loaded before Next.js initializes
 */

// Set up ReadableStream, Blob, and File FIRST before requiring undici (which depends on them)
const { ReadableStream, TransformStream } = require('web-streams-polyfill');
const { Blob } = require('blob-polyfill');
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.Blob = Blob;

// File polyfill - File extends Blob
class File extends Blob {
  constructor(fileBits, fileName, options = {}) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options.lastModified || Date.now();
  }
}
global.File = File;

// DOMException polyfill
if (typeof DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'DOMException';
      this.code = 0;
    }
  };
}

// Now we can safely require undici
const { Request, Response, Headers, fetch } = require('undici');

// Add other Web API polyfills
global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;

