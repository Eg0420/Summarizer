require('@testing-library/jest-dom');

// Make Web APIs available in Jest
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options) {
      this.url = url;
      this.method = (options && options.method) || 'GET';
      this.body = options && options.body;
      this.headers = new Map();
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options) {
      this.body = body;
      this.status = (options && options.status) || 200;
      this.headers = new Map();
    }
  };
}
