#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const settingsPath = process.argv[2];
if (!settingsPath) throw new Error('Usage: set-default-agent.cjs <settings.json path>');

let settings = {};
if (fs.existsSync(settingsPath)) {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  if (settings === null || Array.isArray(settings) || typeof settings !== 'object') {
    throw new Error('settings.json must contain a JSON object.');
  }
}

settings.agent = 'misa';
fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
