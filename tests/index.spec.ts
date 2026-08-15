import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply, Config } from '../src/index.js'

function resolvedConfig(overrides: Partial<Record<string, unknown>> = {}) {
  return { greeting: 'Hello', ...overrides }
}

function exec(signal: AbortSignal) {
  return { signal } as never
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('plugin registration', () => {
  it('registers exactly one tool', () => {
    const registered: unknown[] = []
    const ctx = { tools: { register: (tool: unknown) => { registered.push(tool) } } } as never
    apply(ctx, resolvedConfig())
    expect(registered).toHaveLength(1)
  })

  it('exports a schemastery Config schema with a default', () => {
    expect(Config).toBeDefined()
  })
})

describe('hello tool', () => {
  it('greets with the configured word', async () => {
    const registered: unknown[] = []
    const ctx = { tools: { register: (tool: unknown) => { registered.push(tool) } } } as never
    apply(ctx, resolvedConfig({ greeting: 'Hola' }))
    const tool = registered[0] as { execute(args: { name: string }, exec: never): Promise<{ greeting: string }> }
    const result = await tool.execute({ name: 'Ada' }, exec(new AbortController().signal))
    expect(result.greeting).toBe('Hola, Ada!')
  })

  it('rejects when the caller cancels', async () => {
    const registered: unknown[] = []
    const ctx = { tools: { register: (tool: unknown) => { registered.push(tool) } } } as never
    apply(ctx, resolvedConfig())
    const tool = registered[0] as { execute(args: { name: string }, exec: never): Promise<unknown> }
    const controller = new AbortController()
    controller.abort()
    await expect(tool.execute({ name: 'Ada' }, exec(controller.signal))).rejects.toThrow('cancelled')
  })
})
