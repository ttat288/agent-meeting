#!/usr/bin/env node
'use strict';
// A live model CLI may await watch as a tool. No model is launched by this client.
require('../src/operator-client').main('pm', ['join','state','wait','message','plan','run','verify','integrate','report','team-invite','approve-plan','events','ack-event','chair','watch']).catch(e => { console.error(e.message); process.exitCode = 1; });
