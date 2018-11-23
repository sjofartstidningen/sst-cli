'use strict';

class Configstore {
  constructor(name) {
    this.name = name;
    this.all = {};

    this.set = jest.fn();
    this.get = jest.fn();
    this.clear = jest.fn();
  }
}

module.exports = Configstore;
