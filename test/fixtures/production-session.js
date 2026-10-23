'use strict';
// Replace discovery only. The production driver, runtime parser, bwrap and
// supervisor execute unchanged, against a deterministic local executable.
require('../../src/connect').findCli = () => require('path').join(__dirname,'cli-result-fixture.js');
require('../../src/session-child');
