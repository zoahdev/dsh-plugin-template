/**
 * dsh-plugin-template — a minimal, verified DeepSeek Harness plugin.
 *
 * Demonstrates the complete bundle shape: manifest, patch layer, config schema,
 * one model-facing tool with cancellation, tests, and CI. Fork it and rename.
 * @module dsh-plugin-template
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { createRequire } from 'node:module'
import { satisfiesCaret } from './version.js'

export const name = 'dsh-plugin-template'

/** Services required by this plugin. */
export const inject = ['tools']

/** Peer range this template is tested against and guards at runtime. */
export const TESTED_PEER_RANGE = '^0.1.0-rc.6'

const require = createRequire(import.meta.url)

/** Resolve the dsh-tools version the plugin is actually linked against. */
export function resolvedDshToolsVersion(): string {
  try {
    const pkg = require('@deepseek-ai/dsh-tools/package.json') as { version?: string }
    return pkg.version ?? 'unknown'
  } catch {
    return 'unresolved'
  }
}

/**
 * Turn a silent peer mismatch into a loud, actionable load error.
 *
 * pnpm (default config) and some npm setups can link an older RC into the
 * plugin's peer slot without failing the install (see README Troubleshooting).
 * The plugin refuses to load in that case instead of failing at runtime later.
 */
export function assertPeerCompatible(): void {
  const version = resolvedDshToolsVersion()
  if (!satisfiesCaret(version, TESTED_PEER_RANGE)) {
    throw new Error(
      `dsh-plugin-template: resolved @deepseek-ai/dsh-tools ${version}, but this template is tested with `
      + `${TESTED_PEER_RANGE}. Upgrade DeepSeek Harness to 0.1.0-rc.6 or later, then reinstall this plugin. `
      + 'See the Troubleshooting section in the README.',
    )
  }
}

/** Plugin configuration supplied through cordis.yml. */
export interface Config {
  /** Word used to greet. Defaults to "Hello". */
  greeting: string
}

/** Schemastery schema with defaults. */
export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
})

/**
 * Minimal cancellable delay used to demonstrate `exec.signal` handling.
 * Replace with real work in your plugin.
 * @param signal - caller cancellation signal.
 * @param ms - milliseconds to wait.
 */
function delay(signal: AbortSignal, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('dsh-plugin-template: cancelled'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('dsh-plugin-template: cancelled'))
    }, { once: true })
  })
}

/**
 * Register the example tool on the tool registry.
 * @param ctx - registrant context carrying the tool registry.
 * @param config - validated plugin configuration.
 */
export function apply(ctx: Context, config: Config): void {
  assertPeerCompatible()
  ctx.tools.register(defineTool({
    name: 'hello',
    description:
      'Greet someone by name. Demonstrates the minimal shape of a dsh tool: '
      + 'schema-validated arguments, canonical JSON output, render, presentCall, '
      + 'and cancellation via exec.signal.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          greeting: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.greeting }],
    },
    async execute(args, exec) {
      await delay(exec.signal, 10)
      return { greeting: `${config.greeting}, ${args.name}!` }
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `Greet ${args.name}`,
      kind: 'other',
      rawInput: args,
    }),
  }))
}
