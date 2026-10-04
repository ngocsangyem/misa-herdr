'use strict';

const path = require('node:path');
const fs = require('node:fs');

const MAX_MESSAGE_LENGTH = 8_000;
const MAX_TIMEOUT_MS = 300_000;
const TARGET_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;
const AGENT_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;
const MODEL_PATTERN = /^[a-z0-9][a-z0-9._-]*\/[A-Za-z0-9._:-]{1,160}$/;
const THINKING_TIERS = new Set(['low', 'medium', 'high', 'xhigh']);
const WAIT_STATES = new Set(['idle', 'done', 'blocked']);
const OPUS_55_MODEL = 'anthropic/claude-opus-5-5';
const OPUS_ESCALATION_BASES = new Set(['worker_evidence', 'user_request', 'user_approval']);

function requiredString(value, name) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${name} is required.`);
  return value;
}

function requiredNonBlankString(value, name) {
  const result = requiredString(value, name).trim();
  if (result.length === 0) throw new Error(`${name} must not be blank.`);
  return result;
}

function target(value, name = 'target') {
  const result = requiredString(value, name);
  if (!TARGET_PATTERN.test(result)) throw new Error(`${name} contains unsupported characters.`);
  return result;
}

function agentName(value) {
  const result = requiredString(value, 'name');
  if (!AGENT_NAME_PATTERN.test(result)) {
    throw new Error('name must match [a-z][a-z0-9_-]{0,31}.');
  }
  return result;
}

function timeout(value) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1_000 || value > MAX_TIMEOUT_MS) {
    throw new Error(`timeout_ms must be an integer between 1000 and ${MAX_TIMEOUT_MS}.`);
  }
  return value;
}

function workspacePath(value, workspace) {
  const root = fs.realpathSync(path.resolve(workspace));
  const resolved = fs.realpathSync(path.resolve(requiredString(value, 'cwd')));
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('cwd must be inside the target workspace.');
  }
  return resolved;
}

function optionalTimeout(args, value) {
  const valueMs = timeout(value);
  if (valueMs !== undefined) args.push('--timeout', String(valueMs));
}

function requireOpusEscalation(input, model) {
  if (model !== OPUS_55_MODEL) return;

  const basis = requiredString(input.escalation_basis, 'escalation_basis');
  if (!OPUS_ESCALATION_BASES.has(basis)) {
    throw new Error('escalation_basis must be worker_evidence, user_request, or user_approval for Opus 5.5.');
  }
  requiredNonBlankString(input.escalation_evidence, 'escalation_evidence');
}

function buildHerdrCommand(input, workspace) {
  const action = requiredString(input.action, 'action');
  switch (action) {
    case 'agent_list': return ['agent', 'list'];
    case 'agent_get': return ['agent', 'get', target(input.target)];
    case 'agent_handoff':
      return ['agent', 'read', target(input.target), '--source', 'recent-unwrapped', '--lines', '60'];
    case 'agent_start': {
      const model = requiredString(input.model, 'model');
      if (!MODEL_PATTERN.test(model)) throw new Error('model must be a provider/model identifier.');
      requireOpusEscalation(input, model);
      const thinking = requiredString(input.thinking, 'thinking');
      if (!THINKING_TIERS.has(thinking)) throw new Error('thinking must be low, medium, high, or xhigh.');
      return [
        'agent', 'start', agentName(input.name), '--kind', 'omp', '--pane', target(input.pane_id, 'pane_id'),
        '--', '--model', model, '--thinking', thinking,
      ];
    }
    case 'agent_wait': {
      const args = ['agent', 'wait', target(input.target)];
      if (input.until !== undefined) {
        if (!WAIT_STATES.has(input.until)) throw new Error('until must be idle, done, or blocked.');
        args.push('--until', input.until);
      }
      optionalTimeout(args, input.timeout_ms);
      return args;
    }
    case 'agent_prompt': {
      const message = requiredString(input.message, 'message');
      if (message.length > MAX_MESSAGE_LENGTH) throw new Error(`message must not exceed ${MAX_MESSAGE_LENGTH} characters.`);
      const args = ['agent', 'prompt', target(input.target), message];
      if (input.wait === true) args.push('--wait');
      optionalTimeout(args, input.timeout_ms);
      return args;
    }
    case 'pane_split': {
      const direction = input.direction ?? 'right';
      if (direction !== 'right' && direction !== 'down') throw new Error('direction must be right or down.');
      return [
        'pane', 'split', '--current', '--direction', direction,
        '--cwd', workspacePath(input.cwd, workspace), '--no-focus',
      ];
    }
    default: throw new Error('Unsupported Herdr action.');
  }
}

function formatHerdrOutput(result) {
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  const limit = 12_000;
  if (output.length <= limit) return output || 'Herdr completed without output.';
  return `${output.slice(0, limit)}\n\n[Output truncated at ${limit} characters.]`;
}

module.exports = { buildHerdrCommand, formatHerdrOutput };
