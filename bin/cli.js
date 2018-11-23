#!/usr/bin/env node

require('isomorphic-fetch');
const program = require('../lib/index.js');
program.parse(process.argv);
