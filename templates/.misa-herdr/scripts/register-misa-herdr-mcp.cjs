#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const target = process.argv[2];
if (!target) throw new Error('Usage: register-misa-herdr-mcp.cjs TARGET_WORKSPACE');
const file = path.join(target, '.mcp.json');
const config = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('.mcp.json must contain a JSON object.');
config.mcpServers = config.mcpServers && typeof config.mcpServers === 'object' && !Array.isArray(config.mcpServers) ? config.mcpServers : {};
config.mcpServers['misa-herdr'] = { command: 'node', args: ['${CLAUDE_PROJECT_DIR:-.}/.misa-herdr/mcp/misa-herdr-mcp-server.cjs'] };
fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
