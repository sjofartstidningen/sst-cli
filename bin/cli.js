#!/usr/bin/env node

require('isomorphic-fetch');
require = require('esm')(module);
const program = require('../lib/index.js').default;

program.parse(process.argv);
