#!/usr/bin/env node

require = require('esm')(module);
const program = require('../lib/index.js').default;

program.parse(process.argv);
