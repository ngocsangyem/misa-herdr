import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from '@sinclair/typebox';

const { buildHerdrCommand, formatHerdrOutput } = require('./misa-herdr-commands.cjs');

const HERDR_BIN = 'herdr';
const HERDR_ENV_KEY = ['HERDR', 'ENV'].join('_');

export default function registerMisaHerdr(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'herdr_control',
    label: 'Herdr Control',
    description: [
      'Coordinate a workspace worker through a fixed, safe subset of Herdr.',
      'Use it only inside a Herdr-managed Misa pane.',
      'It can list/get/wait for agents, receive a compact handoff, send a focused prompt,',
      'create a no-focus worker pane, or start a bounded OMP worker in that available shell.',
      'It cannot run shell commands, read files,',
      'edit files, browse, start arbitrary processes, or close panes.',
    ].join(' '),
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal('agent_list'), Type.Literal('agent_get'), Type.Literal('agent_handoff'),
        Type.Literal('agent_start'), Type.Literal('agent_wait'), Type.Literal('agent_prompt'),
        Type.Literal('pane_split'),
      ]),
      target: Type.Optional(Type.String()),
      name: Type.Optional(Type.String()),
      pane_id: Type.Optional(Type.String()),
      message: Type.Optional(Type.String()),
      wait: Type.Optional(Type.Boolean()),
      until: Type.Optional(Type.String()),
      timeout_ms: Type.Optional(Type.Integer()),
      cwd: Type.Optional(Type.String()),
      direction: Type.Optional(Type.String()),
      model: Type.Optional(Type.String()),
      thinking: Type.Optional(Type.String()),
      escalation_basis: Type.Optional(Type.Union([
        Type.Literal('worker_evidence'), Type.Literal('user_request'), Type.Literal('user_approval'),
      ])),
      escalation_evidence: Type.Optional(Type.String()),
    }),
    async execute(_toolCallId, params, signal) {
      if (process.env[HERDR_ENV_KEY] !== '1') {
        return {
          content: [{ type: 'text', text: 'Refused: this controller is available only from a Herdr-managed Misa pane.' }],
          details: { refused: true },
        };
      }

      try {
        const args = buildHerdrCommand(params, process.cwd());
        const result = await pi.exec(HERDR_BIN, args, { signal });
        return {
          content: [{ type: 'text', text: formatHerdrOutput(result) }],
          details: { action: params.action },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Herdr control failed: ${message}` }],
          details: { action: params.action, failed: true },
        };
      }
    },
  });
  pi.on('session_start', async () => {
    pi.setActiveTools(['herdr_control']);
  });
}
