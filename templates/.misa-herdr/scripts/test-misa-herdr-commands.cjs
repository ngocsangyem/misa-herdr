#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { buildHerdrCommand } = require('../extensions/misa-herdr-commands.cjs');
const path = require('node:path');
const workspace = path.resolve(__dirname, '..', '..');

assert.deepEqual(buildHerdrCommand({ action: 'agent_list' }, workspace), ['agent', 'list']);
assert.deepEqual(
  buildHerdrCommand({ action: 'agent_handoff', target: 'worker-1' }, workspace),
  ['agent', 'read', 'worker-1', '--source', 'recent-unwrapped', '--lines', '60'],
);
assert.deepEqual(
  buildHerdrCommand({ action: 'pane_split', cwd: workspace }, workspace),
  ['pane', 'split', '--current', '--direction', 'right', '--cwd', workspace, '--no-focus'],
);
assert.deepEqual(
  buildHerdrCommand({ action: 'agent_start', name: 'reviewer_1', pane_id: 'w1:p2', model: 'anthropic/claude-sonnet-5-5', thinking: 'high' }, workspace),
  ['agent', 'start', 'reviewer_1', '--kind', 'omp', '--pane', 'w1:p2', '--', '--model', 'anthropic/claude-sonnet-5-5', '--thinking', 'high'],
);
assert.deepEqual(
  buildHerdrCommand({
    action: 'agent_start', name: 'deep_rca', pane_id: 'w1:p3', model: 'anthropic/claude-opus-5-5', thinking: 'high',
    escalation_basis: 'worker_evidence', escalation_evidence: 'reports/debugger.md: Sonnet worker exhausted the documented diagnosis path.',
  }, workspace),
  ['agent', 'start', 'deep_rca', '--kind', 'omp', '--pane', 'w1:p3', '--', '--model', 'anthropic/claude-opus-5-5', '--thinking', 'high'],
);
assert.throws(() => buildHerdrCommand({ action: 'pane_split', cwd: '/tmp' }, workspace), /inside the target workspace/);
assert.throws(() => buildHerdrCommand({ action: 'agent_start', name: 'Invalid Name', pane_id: 'w1:p2', model: 'anthropic/x', thinking: 'high' }, workspace), /name must match/);
assert.throws(
  () => buildHerdrCommand({ action: 'agent_start', name: 'ungrounded_opus', pane_id: 'w1:p2', model: 'anthropic/claude-opus-5-5', thinking: 'high' }, workspace),
  /escalation_basis is required/,
);
assert.throws(
  () => buildHerdrCommand({
    action: 'agent_start', name: 'invalid_opus', pane_id: 'w1:p2', model: 'anthropic/claude-opus-5-5', thinking: 'high',
    escalation_basis: 'automatic', escalation_evidence: 'No valid provenance.',
  }, workspace),
  /escalation_basis must be worker_evidence, user_request, or user_approval/,
);
assert.throws(
  () => buildHerdrCommand({
    action: 'agent_start', name: 'blank_opus', pane_id: 'w1:p2', model: 'anthropic/claude-opus-5-5', thinking: 'high',
    escalation_basis: 'user_approval', escalation_evidence: '   ',
  }, workspace),
  /escalation_evidence must not be blank/,
);
assert.throws(() => buildHerdrCommand({ action: 'shell', command: 'cat README.md' }, workspace), /Unsupported Herdr action/);
process.stdout.write('Misa Herdr command allowlist verified.\n');
