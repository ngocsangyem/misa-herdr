#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');
const { buildHerdrCommand, formatHerdrOutput } = require('../extensions/misa-herdr-commands.cjs');

const workspace = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..', '..');
const schema = { type: 'object', additionalProperties: false, required: ['action'], properties: {
  action: { type: 'string', enum: ['agent_list', 'agent_get', 'agent_handoff', 'agent_start', 'agent_wait', 'agent_prompt', 'pane_split'] },
  target: { type: 'string' }, name: { type: 'string' }, pane_id: { type: 'string' }, message: { type: 'string' }, wait: { type: 'boolean' }, until: { type: 'string' }, timeout_ms: { type: 'integer' }, cwd: { type: 'string' }, direction: { type: 'string' }, model: { type: 'string' }, thinking: { type: 'string' }, escalation_basis: { type: 'string', enum: ['worker_evidence', 'user_request', 'user_approval'] }, escalation_evidence: { type: 'string' },
} };

function send(message) { process.stdout.write(`${JSON.stringify(message)}\n`); }
function result(text, isError = false) { return { content: [{ type: 'text', text }], ...(isError ? { isError: true } : {}) }; }
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('herdr', args, { cwd: workspace, env: process.env, shell: false });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(formatHerdrOutput({ stdout, stderr }))));
  });
}
async function handle(request) {
  if (request.method === 'initialize') return { protocolVersion: request.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'misa-herdr-mcp-server', version: '1.0.0' } };
  if (request.method === 'tools/list') return { tools: [{ name: 'herdr_control', title: 'Herdr Control', description: 'Coordinate OMP workers through a fixed Herdr allowlist. Only available when Claude Code Misa runs in a Herdr-managed pane.', inputSchema: schema, annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false } }] };
  if (request.method === 'tools/call') {
    if (request.params?.name !== 'herdr_control') throw new Error('Unknown tool.');
    if (process.env.HERDR_ENV !== '1') return result('Refused: this controller is available only from a Herdr-managed Misa pane.', true);
    try { return result(formatHerdrOutput(await run(buildHerdrCommand(request.params.arguments || {}, workspace)))); }
    catch (error) { return result(`Herdr control failed: ${error instanceof Error ? error.message : String(error)}`, true); }
  }
  if (request.id === undefined) return undefined;
  throw new Error(`Unsupported MCP method: ${request.method}`);
}

readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', async (line) => {
  let request;
  try { request = JSON.parse(line); const response = await handle(request); if (request.id !== undefined && response !== undefined) send({ jsonrpc: '2.0', id: request.id, result: response }); }
  catch (error) { if (request?.id !== undefined) send({ jsonrpc: '2.0', id: request.id, error: { code: -32603, message: error instanceof Error ? error.message : String(error) } }); }
});
