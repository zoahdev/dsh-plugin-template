#!/usr/bin/env node
/**
 * Packaged integration + real runtime invocation smoke test.
 *
 * Installs the ACTUAL pnpm-packed tarball into a fresh project, loads the
 * installed plugin bundle, registers the hello tool through the real
 * `apply()` / `ctx.tools.register` path, executes the real handler with a
 * real AbortSignal, renders the result through the real renderer, and
 * asserts every step. A missing module, an API mismatch, or a handler
 * failure fails this script.
 */

import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tgz = path.resolve(process.argv[2] ?? path.join(root, 'dsh-plugin-template-0.1.0.tgz'))

if (!existsSync(tgz)) {
  console.error(`[integration] missing tarball: ${tgz}`)
  process.exit(1)
}

function runPnpm(args, cwd) {
  if (process.platform === 'win32') {
    return spawnSync(`pnpm ${args.join(' ')}`, { cwd, stdio: 'inherit', shell: true })
  }
  return spawnSync('pnpm', args, { cwd, stdio: 'inherit' })
}

async function scenario(name, dshToolsVersion, expectGuard) {
  const dir = mkdtempSync(path.join(tmpdir(), `dsh-template-${name}-`))
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'dsh-template-integration-host',
        private: true,
        version: '1.0.0',
        dependencies: {
          '@deepseek-ai/cordis': '^4.0.1',
          '@deepseek-ai/dsh-tools': dshToolsVersion,
          '@deepseek-ai/schemastery': '^3.18.1',
          'dsh-plugin-template': `file:${tgz.replaceAll('\\', '/')}`,
        },
      },
      null,
      2,
    ),
  )

  console.log(`[integration:${name}] installing packed tarball into fresh project (dsh-tools ${dshToolsVersion})...`)
  const install = runPnpm(['install'], dir)
  if (install.status !== 0) {
    console.error(`[integration:${name}] pnpm install failed`)
    process.exit(1)
  }

  const pluginIndex = path.join(dir, 'node_modules', 'dsh-plugin-template', 'lib', 'index.js')
  if (!existsSync(pluginIndex)) {
    throw new Error('packed plugin entry lib/index.js missing after install')
  }

  console.log(`[integration:${name}] loading packed plugin bundle...`)
  const plugin = await import(pathToFileURL(pluginIndex).href)

  if (plugin.name !== 'dsh-plugin-template') {
    throw new Error(`unexpected plugin name: ${plugin.name}`)
  }

  const registered = []
  const ctx = {
    tools: {
      register: (definition) => {
        registered.push(definition)
        return () => {}
      },
    },
  }

  if (expectGuard) {
    let threw = false
    try {
      plugin.apply(ctx, { greeting: 'Hello' })
    } catch (error) {
      threw = true
      if (!String(error instanceof Error ? error.message : error).includes('tested with ^0.1.0-rc.6')) {
        throw new Error(`guard threw an unexpected error: ${String(error)}`)
      }
    }
    if (!threw) {
      throw new Error('runtime guard did not reject the incompatible dsh-tools version')
    }
    console.log(`PASS [${name}] runtime guard rejected incompatible @deepseek-ai/dsh-tools ${dshToolsVersion}`)
    rmSync(dir, { recursive: true, force: true })
    return
  }

  console.log(`[integration:${name}] calling apply(ctx, config) through the real registration path...`)
  plugin.apply(ctx, { greeting: 'Hello' })

  const tool = registered.find((definition) => definition.name === 'hello')
  if (tool === undefined) {
    throw new Error('hello tool was not registered via apply/ctx.tools.register')
  }

  if (tool.parameters?.properties?.name === undefined) {
    throw new Error('hello tool schema missing the name parameter')
  }

  console.log(`[integration:${name}] executing the real hello handler...`)
  const result = await tool.execute({ name: 'Ada' }, { signal: new AbortController().signal })
  if (result?.greeting !== 'Hello, Ada!') {
    throw new Error(`unexpected canonical result: ${JSON.stringify(result)}`)
  }

  console.log(`[integration:${name}] rendering through the real output.render...`)
  const blocks = tool.output.render({ name: 'Ada' }, result)
  const text = blocks.map((block) => block.text ?? '').join('\n')
  if (!text.includes('Hello, Ada!')) {
    throw new Error(`render output missing greeting: ${JSON.stringify(text)}`)
  }

  console.log(`PASS [${name}] packed artifact loaded, hello registered, handler executed, render asserted`)
  console.log(`PASS [${name}] result:`, JSON.stringify(result))
  rmSync(dir, { recursive: true, force: true })
}

await scenario('happy', '0.1.0-rc.6', false)
await scenario('guard', '0.1.0-rc.3', true)
