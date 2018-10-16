#!/usr/bin/env node

require = require('esm')(module);
const program = require('../lib/cli.js').default;

program.parse(process.argv);
