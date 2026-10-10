'use strict';

function requiredString(value, name) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${name} is required.`);
  return value;
}

function createMisaOwnership() {
  const panes = new Set();
  const agents = new Map();
  const settledPanes = new Set();
  function requireOwnedPane(paneId) {
    const id = requiredString(paneId, 'pane_id');
    if (!panes.has(id)) throw new Error('pane_id is not a Misa-owned pane from this controller session.');
    return id;
  }
  function requireOwnedAgent(name) {
    const paneId = agents.get(requiredString(name, 'target'));
    if (!paneId) throw new Error('target is not a Misa-owned agent from this controller session.');
    return paneId;
  }
  return {
    registerPane(paneId) { panes.add(requiredString(paneId, 'pane_id')); },
    registerAgent(name, paneId) { requireOwnedPane(paneId); agents.set(requiredString(name, 'name'), paneId); settledPanes.delete(paneId); },
    requireOwnedPane,
    requireOwnedAgent,
    markSettled(name, state) { if (state !== 'idle' && state !== 'done') throw new Error('only an idle or done Misa-owned agent may make its pane closable.'); settledPanes.add(requireOwnedAgent(name)); },
    requireClosablePane(paneId) { const id = requireOwnedPane(paneId); if (!settledPanes.has(id)) throw new Error('pane_id may close only after its Misa-owned agent is confirmed idle or done.'); return id; },
    releasePane(paneId) { const id = requireOwnedPane(paneId); panes.delete(id); settledPanes.delete(id); for (const [name, agentPaneId] of agents) if (agentPaneId === id) agents.delete(name); },
  };
}

function paneIdFromHerdrResult(result) {
  const paneId = JSON.parse(result.stdout.trim())?.result?.pane?.pane_id;
  if (typeof paneId !== 'string' || !paneId) throw new Error('Herdr pane split succeeded but returned no pane_id.');
  return paneId;
}

module.exports = { createMisaOwnership, paneIdFromHerdrResult };
