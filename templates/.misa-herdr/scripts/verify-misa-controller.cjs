#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const workspace = path.resolve(__dirname, '..', '..');
const read = (relative) => fs.readFileSync(path.join(workspace, relative), 'utf8');
const failures = [];
const expect = (text, pattern, message) => { if (!pattern.test(text)) failures.push(message); };
const expectNot = (text, pattern, message) => { if (pattern.test(text)) failures.push(message); };

const launcher = read('.misa-herdr/bin/misa-controller');
expect(launcher, /controller_agent=misa/, 'launcher must retain Misa only as the default role');
expect(launcher, /exec claude --agent "\$controller_agent"/, 'launcher must start Claude Code with the selected role');
expectNot(launcher, /exec .*omp/, 'launcher must not start Misa as OMP');

const mcpServer = read('.misa-herdr/mcp/misa-herdr-mcp-server.cjs');
expect(mcpServer, /name: 'herdr_control'/, 'MCP server must register Herdr control');
expect(mcpServer, /HERDR_ENV/, 'MCP server must enforce the Herdr-pane boundary');

const mcpConfig = read('.mcp.json');
expect(mcpConfig, /"misa-herdr"/, 'installed workspace must register the Misa Herdr MCP server');

const commands = read('.misa-herdr/extensions/misa-herdr-commands.cjs');
expect(commands, /case 'agent_list'/, 'allowlist must be explicit');
expect(commands, /case 'agent_start'/, 'allowlist must support OMP startup');
expect(commands, /requireOpusEscalation/, 'allowlist must gate Opus starts');
expectNot(commands, /child_process|execSync|spawnSync/, 'allowlist must not shell out directly');

for (const relative of [
  '.claude/agents/misa.md',
  '.misa-herdr/scripts/set-default-agent.cjs',
  '.claude/skills/misa-herdr/SKILL.md',
  '.claude/skills/misa-grounded-evidence/SKILL.md',
  '.claude/skills/misa-cross-agent-review/SKILL.md',
  '.agents/skills/misa-grounded-evidence/SKILL.md',
]) {
  if (!fs.existsSync(path.join(workspace, relative))) failures.push(`missing installed policy: ${relative}`);
}

if (failures.length) {
  process.stderr.write(`${failures.map((failure) => `FAIL: ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('Misa–Herdr installation boundary verified.\n');
