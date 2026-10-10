#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { buildHerdrCommand } = require('../extensions/misa-herdr-commands.cjs');
const { isExpectedWaitTimeout } = require('../extensions/misa-herdr-wait-result.cjs');
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
assert.deepEqual(buildHerdrCommand({ action: 'agent_start', name: 'everyday_opus', pane_id: 'w1:p3', model: 'anthropic/claude-opus-5-5', thinking: 'medium' }, workspace), ['agent', 'start', 'everyday_opus', '--kind', 'omp', '--pane', 'w1:p3', '--', '--model', 'anthropic/claude-opus-5-5', '--thinking', 'medium']);
assert.deepEqual(buildHerdrCommand({ action: 'agent_start', name: 'figma_analyst', pane_id: 'w1:p5', worker_kind: 'claude', claude_agent: 'design-analyst' }, workspace), ['agent', 'start', 'figma_analyst', '--kind', 'claude', '--pane', 'w1:p5', '--', '--agent', 'design-analyst', '--dangerously-skip-permissions', '--disallowedTools', 'Edit,Write,NotebookEdit,Bash']);
assert.throws(() => buildHerdrCommand({ action: 'pane_split', cwd: '/tmp' }, workspace), /inside the target workspace/);
assert.throws(() => buildHerdrCommand({ action: 'agent_start', name: 'Invalid Name', pane_id: 'w1:p2', model: 'anthropic/x', thinking: 'high' }, workspace), /name must match/);
assert.throws(() => buildHerdrCommand({ action: 'agent_start', name: 'unsafe_claude', pane_id: 'w1:p2', worker_kind: 'claude', claude_agent: 'ui-ux-designer' }, workspace), /allowlisted Figma/);
assert.throws(() => buildHerdrCommand({ action: 'shell', command: 'cat README.md' }, workspace), /Unsupported Herdr action/);
assert.equal(isExpectedWaitTimeout({ action: 'agent_wait', timeout_ms: 300000 }, { code: 1, stderr: 'Timed out after 300000ms.' }), true);
assert.equal(isExpectedWaitTimeout({ action: 'agent_wait', timeout_ms: 300000 }, { code: 1, stderr: 'target was not found' }), false);
assert.equal(isExpectedWaitTimeout({ action: 'agent_wait', timeout_ms: 300000 }, { code: 0, stderr: '' }), false);
process.stdout.write('Misa Herdr command allowlist verified.\n');
