#!/usr/bin/env node
'use strict';
require('../src/operator-client').main('team', ['join','state','propose','run','checkpoint','swap','verify','integrate','submit','blocker']).catch(e => { console.error(e.message); process.exitCode = 1; });
