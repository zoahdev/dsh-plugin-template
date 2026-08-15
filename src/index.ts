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

export const name = 'dsh-plugin-template'

/** Services required by this plugin. */
export const inject = ['tools']

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
