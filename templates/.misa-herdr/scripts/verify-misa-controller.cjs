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
expect(launcher, /--extension .*misa-herdr\.ts/, 'launcher must load the constrained extension');
expect(launcher, /--no-tools/, 'launcher must expose no built-in tools');
expectNot(launcher, /--tools bash/, 'launcher must not expose Bash');

const extension = read('.misa-herdr/extensions/misa-herdr.ts');
expect(extension, /name: 'herdr_control'/, 'extension must register Herdr control');
expect(extension, /HERDR_ENV_KEY/, 'extension must enforce the Herdr-pane boundary');
expect(extension, /setActiveTools\(\['herdr_control'\]\)/, 'extension must activate only Herdr control');

const commands = read('.misa-herdr/extensions/misa-herdr-commands.cjs');
expect(commands, /case 'agent_list'/, 'allowlist must be explicit');
expect(commands, /case 'agent_start'/, 'allowlist must support OMP startup');
expect(commands, /requireOpusEscalation/, 'allowlist must gate Opus starts');
expectNot(commands, /child_process|execSync|spawnSync/, 'allowlist must not shell out directly');

for (const relative of [
  '.claude/agents/misa.md',
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
