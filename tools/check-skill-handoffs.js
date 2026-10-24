'use strict';
// Three authored examples with a negative control. This is not a model A/B.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto'), csv = require('../test/fixtures/csv-retry');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const cavemanDir = path.resolve(process.argv[2] || '.local-tools/caveman-eval');
const caveman = fs.readFileSync(path.join(cavemanDir, 'SKILL.md'), 'utf8');
const source = JSON.parse(fs.readFileSync(path.join(cavemanDir, 'source.json'), 'utf8'));
assert.equal(hash(caveman), source.sources['plugins/caveman/skills/caveman/SKILL.md'].sha256);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-handoff-styles-'));
try {
  const facts = {
    taskId: 'T-COMM-CSV', objective: csv.goal, scope: 'Only csv-cell.js.',
    condition: 'Retry only if task revision 2 and source hash still match.', negation: 'Do not change independent tests.',
    result: 'Independent verification failed; not accepted.', error: 'escapes embedded double quotes',
    evidence: 'run-1/test/csv-cell.test.js', unknowns: 'Actual model identity and billing remain unknown.',
    next: 'Use the retained test diagnostic, then explicitly Run, Verify and Integrate.',
  };
  const fields = Object.values(facts);
  const conciseRule = 'For task handoffs keep task ID, objective/scope, conditions/negations, result, evidence, unknowns and next step when relevant. Keep code, commands, paths, errors and user text verbatim. Concision must not remove necessary meaning or compress documents/warnings.';
  const samples = [
    { name: 'current-style', instruction: 'Return changed files and evidence; completion requires independent verification.',
      text: `I have finished checking the first attempted repair for task ${facts.taskId}. The objective remains: ${facts.objective}\nThe assigned scope is: ${facts.scope}\nPlease keep the following condition in mind before retrying: ${facts.condition}\n${facts.negation}\nThe result of the check is: ${facts.result}\nThe failing assertion is exactly: ${facts.error}\nYou can find the retained evidence at ${facts.evidence}.\nThe remaining uncertainty is: ${facts.unknowns}\nThe next action is: ${facts.next}` },
    { name: 'concise-structured', instruction: conciseRule,
      text: Object.entries(facts).map(([key, value]) => `${key}: ${value}`).join('\n') },
    { name: 'caveman-source-informed', instruction: caveman,
      text: `${facts.taskId}: ${facts.result}\n${facts.error}\n${facts.objective}\n${facts.scope}\n${facts.condition}\n${facts.negation}\nEvidence: ${facts.evidence}\n${facts.unknowns}\n${facts.next}` },
  ];
  const assess = text => ({ missingFields: Object.keys(facts).filter(key => !text.includes(facts[key])),
    alteredLiteralPayload: !text.includes(facts.error) || !text.includes(facts.evidence),
    negationsIntact: text.includes(facts.condition) && text.includes(facts.negation) && text.includes(facts.result) });
  const negative = assess(samples[1].text.replace('Do not change independent tests.', 'Change independent tests.'));
  assert(negative.missingFields.includes('negation')); assert.equal(negative.negationsIntact, false);
  const cases = samples.map(sample => {
    const assessment = assess(sample.text); assert.deepEqual(assessment.missingFields, []); assert(assessment.negationsIntact);
    const dir = path.join(root, sample.name); csv.seed(dir);
    csv.patch(dir); const failed = csv.execute(dir, ['--test', 'test/csv-cell.test.js'], false); assert.equal(failed.exitCode, 1);
    csv.patch(dir, sample.text); const recovered = csv.execute(dir, ['--test', 'test/csv-cell.test.js'], false); assert.equal(recovered.exitCode, 0);
    return { name: sample.name, text: sample.text, instructionSha256: hash(sample.instruction), instructionBytes: Buffer.byteLength(sample.instruction),
      inputBytes: Buffer.byteLength(JSON.stringify(facts)), outputBytes: Buffer.byteLength(sample.text),
      knownPayloadBytes: Buffer.byteLength(JSON.stringify(facts)) + Buffer.byteLength(sample.instruction) + Buffer.byteLength(sample.text),
      assessment, simulatedClarificationTurns: 0, manualDiagnosticTransfersAfterHandoff: 0,
      failureExitCode: failed.exitCode, recoveryExitCode: recovered.exitCode, outputSha256: hash(fs.readFileSync(path.join(dir, 'csv-cell.js'))), recoveryEvidence: recovered };
  });
  assert(cases.every(c => c.outputSha256 === cases[0].outputSha256));
  console.log(JSON.stringify({ schema: 'agent-meeting/handoff-style-fixture@1', recordedAt: new Date().toISOString(), fixture: true,
    authorship: 'PM-authored examples and deterministic downstream patch selection. No independent model runs, no inference that the styles caused the outcomes.',
    facts, caveman: { ...source, license: 'Apache-2.0', installation: 'Text-only evaluation under ignored .local-tools; no hooks/proxy/global skill installation',
      reviewedLimits: ['Voice instructions only; no reasoning or tool-permission guarantees.', 'Preserves negations and literal payloads; plain prose exceptions include security warnings and persisted external artifacts.', 'Session persistence is unsuitable as an implicit product default.'] },
    cases, negativeControl: negative, modelTokens: null, billedCostUsd: null, humanTimeMs: null,
    decision: 'Keep the short structured task handoff rule; do not install Caveman as a product default. Net token/billing or quality gain has not been demonstrated.',
    limits: ['Single task and authored samples. Zero simulated clarification turns is not measured human/model behavior.', 'Counts UTF-8 payload bytes only; hidden prompts, schema/transport, reasoning, retries and orchestration excluded here. Journey evidence reports wrapper costs separately.', 'No live Gemini comparison: auth/client blocked before inference. No semantic efficacy or billing conclusion.'] }, null, 2));
} finally { fs.rmSync(root, { recursive: true, force: true }); }
