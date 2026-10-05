'use strict';

function isExpectedWaitTimeout(params, result) {
  if (params.action !== 'agent_wait' || params.timeout_ms === undefined || result.code === 0) return false;
  return /\btimeout\b|\btimed out\b/i.test(`${result.stdout || ''}\n${result.stderr || ''}`);
}

module.exports = { isExpectedWaitTimeout };
