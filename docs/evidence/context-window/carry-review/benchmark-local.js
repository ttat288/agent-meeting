'use strict';
// Proposal experiment only: no runtime import, CLI/model, network or transcript.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const { performance } = require('perf_hooks');
const sourcePath = path.resolve(__dirname, '../../pm-team/journey.json');
const raw = fs.readFileSync(sourcePath, 'utf8'), source = JSON.parse(raw);
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const pass = rows => Array.isArray(rows) && rows.length > 0 && rows.every(r => r.exitCode === 0 && !r.timeout && !r.cancelled && !r.error);
function project(journey) {
  // This export is evidence, not the full live work store. Missing facts stay null.
  return { taskId: journey.task.id, runId: journey.run.id, slot: journey.run.slot, generation: journey.run.generation,
    goalRevision: journey.report.goalRevision, status: journey.run.status, acceptance: journey.task.acceptance, scope: journey.checkpoint.scope,
    changes: journey.run.changes, testsPassed: pass(journey.run.evidence), integratedTestsPassed: pass(journey.run.integrationEvidence),
    evidenceRefs: ['run:' + journey.run.id + '/evidence', 'run:' + journey.run.id + '/integrationEvidence'],
    decisionRecord: journey.checkpoint.decisions ?? null, unknownsRecord: journey.checkpoint.unknowns ?? null,
    baseRevision: journey.checkpoint.baseRevision ?? null, requirementRevision: journey.checkpoint.requirementRevision ?? null };
}
function assemble(facts) {
  const missing = ['decisionRecord','unknownsRecord','baseRevision','requirementRevision'].filter(k => facts[k] === null);
  const accepted = facts.status === 'integrated' && facts.testsPassed && facts.integratedTestsPassed;
  return { schema: 'agent-meeting/carry-proposal@1', facts,
    completed: accepted,
    nextAction: accepted ? 'Stop this task; obtain a separately authorized next task' : 'Inspect current evidence; completion not accepted',
    missingFields: missing, readyForAutonomousContinuation: false,
    limits: ['Record projection only; semantic decision coverage not established', 'Missing facts are not inferred from a done label', 'Evidence references in this experiment are identifiers, not a new implemented retrieval API'] };
}
const start = performance.now(), facts = project(source), capsule = assemble(facts), checks = [];
assert.equal(capsule.completed,true);checks.push('integrated status requires both workspace and source test evidence');
assert.match(capsule.nextAction,/Stop/);checks.push('pre-integration checkpoint next step is not replayed after integration');
assert(capsule.missingFields.includes('decisionRecord'));assert.equal(capsule.readyForAutonomousContinuation,false);checks.push('missing decisions/base/revisions are visible; no automatic readiness claim');
const claimed = structuredClone(facts);claimed.status='reported';assert.equal(assemble(claimed).completed,false);checks.push('reported output does not become verified or integrated');
const missing = structuredClone(facts);missing.integratedTestsPassed=false;assert.equal(assemble(missing).completed,false);checks.push('integrated label without passing source evidence is rejected');
const serialized = JSON.stringify(capsule), known = JSON.stringify(facts);
const report = { schema:'agent-meeting/carry-local-experiment@1', at:new Date().toISOString(), fixture:true,
  input:{path:'docs/evidence/pm-team/journey.json',sha256:hash(raw),provenance:'Existing subprocess fixture evidence export, not a model transcript or complete live store'},
  checks:{passed:checks.length,failed:0,items:checks},
  metrics:{assemblerElapsedMs:performance.now()-start,assemblerModelCalls:0,rawExportBytes:Buffer.byteLength(raw),knownCanonicalProjectionBytes:Buffer.byteLength(known),capsuleBytes:Buffer.byteLength(serialized),capsuleOverheadVsKnownProjectionBytes:Buffer.byteLength(serialized)-Buffer.byteLength(known),requiredMetadataFieldsMissing:capsule.missingFields.length,
    successorInputTokens:null,totalModelUsage:null,billedCostUsd:null,contextPredictionError:null,contextOverflowRate:null,semanticRetention:null},
  verdict:'Deterministic assembly can avoid an extra summarization call for recorded facts; this exported fixture cannot establish semantic completeness or model savings. Capsule framing adds bytes versus reading the same known facts directly.',
  capsule,
  limitations:['This is an experiment, not product context carry implementation','Raw export comparison is a transport bound, not a strong direct-CLI baseline','No fabricated telemetry, tokenizer, model usage, context bound or 8-hour claim','A zero-call assembler does not make successor context ingestion free'] };
process.stdout.write(JSON.stringify(report,null,2)+'\n');
