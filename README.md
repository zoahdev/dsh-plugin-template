# dsh-plugin-template

[![CI](https://github.com/zoahdev/dsh-plugin-template/actions/workflows/ci.yml/badge.svg)](https://github.com/zoahdev/dsh-plugin-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](#english) · [中文](#中文)

A minimal, **verified** community starting point for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins. Fork it, rename it, and ship your own plugin with a CI that proves the plugin is actually callable — not just loadable.

> Community template — **not** an official DeepSeek template, not a security audit, not a production-readiness certificate.
> Tested with: `dsh` 0.1.0-rc.6 · Node 24 · pnpm 11

## What's inside

```text
├── package.json              # dsh.bundle manifest + build scripts (prepare = git-install build)
├── cordis.patch.yml          # plugin row: id, package name, config
├── src/
│   ├── index.ts              # plugin entry: name / inject / Config / apply + one `hello` tool
│   └── version.ts            # dependency-free caret-range matcher used by the runtime guard
├── tests/
│   ├── index.spec.ts         # registration, behavior, cancellation (unit)
│   └── version.spec.ts       # prerelease range behavior matrix (unit)
├── scripts/
│   ├── integration-test.mjs  # installs the PACKED tarball, registers hello via apply(),
│   │                         # executes the real handler, asserts the result
│   └── dsh-smoke.sh          # fresh DSH profile install + config check + web boot (bounded retry)
├── .github/workflows/ci.yml  # build → unit tests → pack → integration → DSH boot
└── README.md                 # bilingual
```

## Dependency strategy (read this)

- **Tested with**: `@deepseek-ai/dsh-tools` **0.1.0-rc.6** and `@deepseek-ai/cordis` **^4.0.1**.
- `peerDependencies` declares `"@deepseek-ai/dsh-tools": "^0.1.0-rc.6"`. This is a **caret range, not a pin**:
  - It currently matches `0.1.0-rc.6`, later RCs of `0.1.x` (`rc.7`, `rc.10`, ...), and `0.1.0` stable once published.
  - It does **not** match `0.1.0-rc.5`/older RCs, nor the `0.0.1-rc.*` train.
- `devDependencies` uses the same range; the committed `pnpm-lock.yaml` pins the exact tested version (`0.1.0-rc.6`) for development and CI.
- **Empirically verified with pnpm 11**: if the host already contains an older RC (e.g. `0.1.0-rc.3`), pnpm's default config links that older version into the plugin's peer slot with only a generic warning — **no error, no auto-upgrade**. npm fails loudly with `ERESOLVE` instead. Neither tool auto-upgrades the host.

Because silent linking is the dangerous case, the plugin itself **refuses to load** when the resolved `@deepseek-ai/dsh-tools` does not satisfy `^0.1.0-rc.6` (runtime guard in `apply()`, backed by `src/version.ts`). A silent mismatch becomes a clear, actionable error.

## Use it

```sh
git clone https://github.com/zoahdev/dsh-plugin-template.git my-plugin
cd my-plugin
pnpm install
pnpm test
pnpm pack
dsh plugin --profile web add ./dsh-plugin-template-0.1.0.tgz
dsh web --port 4099
```

Then ask your agent: "Use the hello tool to greet Ada."

## Rename checklist

- `package.json`: `name`, `description`, `keywords`
- `cordis.patch.yml`: plugin `id` and `name`
- `src/index.ts`: `export const name`, tool `name`/`description`
- `README.md`: title, links, author
- Add the `dsh-plugin` topic to your GitHub repo

## Check it with dsh-plugin-doctor

After renaming, run the community health checker locally (clone once, reuse everywhere):

```sh
git clone https://github.com/zoahdev/dsh-plugin-doctor.git
cd dsh-plugin-doctor && pnpm install && pnpm build
node lib/bin.js --full <your-plugin-directory>
```

It verifies the manifest, patch validity, entry points, build, pack, and a fresh-DSH-profile install — the same checks this template's CI runs. See [zoahdev/dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor).

Or use the turnkey GitHub Action (no clone, no build):

```yaml
- uses: zoahdev/dsh-plugin-doctor-action@v1
  with:
    path: .
```

This template's CI already runs it in the `doctor` job.

## CI

`.github/workflows/ci.yml` runs, in order (job `test-and-load` on ubuntu):

1. clean checkout
2. `pnpm install --frozen-lockfile`
3. `pnpm typecheck`
4. `pnpm run build`
5. `pnpm test` (unit)
6. `pnpm pack`
7. **packaged integration + real tool invocation** — `scripts/integration-test.mjs` installs the actual tarball into a fresh project, loads the installed bundle, registers `hello` through the real `apply()` / `ctx.tools.register` path, executes the real handler, and asserts `Hello, Ada!`
8. job `dsh-smoke` on **windows-latest**: `scripts/dsh-smoke.sh` installs the tarball into a brand-new `DSH_HOME`, verifies the plugin row in `--dump-config`, boots `dsh web` with a 30s bounded retry, and cleans up the background process

> Upstream note: `dsh web` (0.1.0-rc.6 npm CLI) currently fails to boot on GitHub Actions ubuntu-latest because the `@deepseek-ai/dsh-subprocess-local` native `pty.node` linux-x64 prebuild is missing from the published package. That is why the boot smoke runs on Windows (where the prebuild ships). Tracked upstream in [discussion #1686](https://github.com/deepseek-ai/deepseek-harness/discussions/1686) — this is an upstream packaging issue, not a template issue.

## Publishing checklist

- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] `pnpm test` passes
- [ ] `pnpm pack` produces a tarball
- [ ] **packaged plugin loads in a fresh profile** (integration + smoke scripts pass)
- [ ] **`hello` runtime invocation passes with an asserted result** (integration script)
- [ ] README bilingual, with install, config, examples, and troubleshooting
- [ ] Repo topic: `dsh-plugin`
- [ ] Tag a release (e.g. `v0.1.0`) with the packed tarball
- [ ] Optional: `pnpm publish` to npm

## Health check note

This template's CI verifies, in scope:

- manifest / package validity (structure, `prepare`, entry, files)
- dependency compatibility (runtime peer-version guard)
- bundle loadability (fresh profile install + `--dump-config`)
- DSH boot (web serves HTTP 200)
- **actual tool callability** (the real `hello` handler executes and its result is asserted)

It does **not** claim: production readiness, security auditing, or official DeepSeek endorsement. This is a community template. Until an official `dsh plugin check` exists (see [RFC #1629](https://github.com/deepseek-ai/deepseek-harness/discussions/1629)), this CI is the closest repeatable equivalent.

## Troubleshooting

### npm: `ERESOLVE` peer dependency conflict

The host already has an older RC that does not satisfy `^0.1.0-rc.6`.

1. Upgrade the host to the tested version or newer:

   ```sh
   pnpm dlx @deepseek-ai/dsh --version   # must print 0.1.0-rc.6 or later
   ```

2. Reinstall the plugin so it links against the upgraded host:

   ```sh
   pnpm dlx @deepseek-ai/dsh plugin --profile web add <this-plugin>
   ```

3. Do **not** reach for `--legacy-peer-deps` to silence the error — the plugin's runtime guard will refuse to load if an incompatible version is linked anyway.

### pnpm: install succeeds but the plugin later fails to load

pnpm's default config can silently link an older RC into the plugin's peer slot (verified: `0.1.0-rc.3` linked against `^0.1.0-rc.6`, only a generic warning). The plugin then refuses to load with:

```text
dsh-plugin-template: resolved @deepseek-ai/dsh-tools 0.1.0-rc.3, but this template is tested with ^0.1.0-rc.6. ...
```

1. Upgrade the host to `0.1.0-rc.6` or later and reinstall (same two commands as above).
2. Optional hardening: enable `strict-peer-dependencies=true` in your project/profile `.npmrc` so pnpm fails loudly instead of silently linking an incompatible peer.

### You verified a newer RC and want to move the template forward

Bump `TESTED_PEER_RANGE` in `src/index.ts`, update `package.json` (peer + dev), regenerate `pnpm-lock.yaml` (`pnpm install`), and update the "Tested with" line in this README — all four together.

## License

MIT © 2026 zoahdev

---

## 中文

**dsh-plugin-template** 是一个最小、**经过验证**的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 社区插件起点：fork 后改名即可发布，CI 不只证明"能加载"，而是证明"工具真的能被调用"。

> 社区模板——**不是** DeepSeek 官方模板，**不**代表安全审计或生产就绪认证。
> 已验证版本：`dsh` 0.1.0-rc.6 · Node 24 · pnpm 11

## 包含内容

```text
├── package.json              # dsh.bundle manifest + 构建脚本（prepare 支持 git 安装）
├── cordis.patch.yml          # 插件行：id、包名、config
├── src/
│   ├── index.ts              # 插件入口 + 一个 hello 工具 + 运行时版本守卫
│   └── version.ts            # 无依赖的 caret 范围匹配器（守卫使用）
├── tests/
│   ├── index.spec.ts         # 注册、行为、取消（单元测试）
│   └── version.spec.ts       # prerelease 范围行为矩阵（单元测试）
├── scripts/
│   ├── integration-test.mjs  # 安装打包产物 → apply() 注册 hello → 执行真实 handler → 断言
│   └── dsh-smoke.sh          # 全新 DSH profile 安装 + 配置校验 + web 启动（限时重试）
├── .github/workflows/ci.yml  # build → 单元测试 → pack → 集成 → DSH 启动
└── README.md                 # 双语
```

## 依赖策略（请读这一段）

- **已验证**：`@deepseek-ai/dsh-tools` **0.1.0-rc.6**、`@deepseek-ai/cordis` **^4.0.1**。
- `peerDependencies` 声明 `"@deepseek-ai/dsh-tools": "^0.1.0-rc.6"`。这是 **caret 范围，不是 pin**：
  - 目前匹配 `0.1.0-rc.6`、后续 `0.1.x` 的 RC（`rc.7`、`rc.10`…），以及未来发布的 `0.1.0` 稳定版。
  - **不匹配** `0.1.0-rc.5` 及更早 RC，也不匹配 `0.0.1-rc.*` 版本线。
- `devDependencies` 使用同一范围；提交的 `pnpm-lock.yaml` 把开发与 CI 固定到已验证的确切版本（`0.1.0-rc.6`）。
- **pnpm 11 实测**：宿主已存在旧 RC（如 `0.1.0-rc.3`）时，pnpm 默认配置会把旧版本链进插件的 peer 槽，只给一条泛泛的警告——**不报错、不自动升级**。npm 则会以 `ERESOLVE` 响亮失败。两个工具都不会帮你"优雅升级"宿主。

因为静默链接才是真正的坑：插件在 `apply()` 里加了**运行时版本守卫**（`src/version.ts` 支撑），解析到的 `@deepseek-ai/dsh-tools` 不满足 `^0.1.0-rc.6` 就直接拒绝加载——把静默不兼容变成清晰、可操作的报错。

## 使用

```sh
git clone https://github.com/zoahdev/dsh-plugin-template.git my-plugin
cd my-plugin
pnpm install
pnpm test
pnpm pack
dsh plugin --profile web add ./dsh-plugin-template-0.1.0.tgz
dsh web --port 4099
```

然后让 agent："Use the hello tool to greet Ada."

## 改名清单

- `package.json`：`name` / `description` / `keywords`
- `cordis.patch.yml`：插件 `id` 与 `name`
- `src/index.ts`：`export const name`、工具名与描述
- `README.md`：标题、链接、作者
- GitHub 仓库加 `dsh-plugin` 话题

## 用 dsh-plugin-doctor 体检

改完名后，用社区健康检查器本地验证（克隆一次，随处复用）：

```sh
git clone https://github.com/zoahdev/dsh-plugin-doctor.git
cd dsh-plugin-doctor && pnpm install && pnpm build
node lib/bin.js --full <你的插件目录>
```

它验证 manifest、patch 合法性、入口、build、pack 和全新 DSH profile 安装——和本模板 CI 跑的是同一套检查。见 [zoahdev/dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor)。

## CI

`.github/workflows/ci.yml` 依序执行：

1. clean checkout
2. `pnpm install --frozen-lockfile`
3. `pnpm typecheck`
4. `pnpm run build`
5. `pnpm test`（单元）
6. `pnpm pack`
7. **打包产物集成 + 真实工具调用**——`scripts/integration-test.mjs` 把实际 tarball 装进全新项目，加载已安装产物，通过真实的 `apply()` / `ctx.tools.register` 注册 `hello`，执行真实 handler，断言 `Hello, Ada!`
8. `dsh-smoke` job（**windows-latest**）：`scripts/dsh-smoke.sh` 在全新 `DSH_HOME` 安装 tarball，校验 `--dump-config` 里的插件行，30 秒限时重试启动 `dsh web`，并清理后台进程

> 上游说明：`dsh web`（0.1.0-rc.6 npm CLI）在 GitHub Actions ubuntu-latest 上无法启动，因为发布包里缺少 `@deepseek-ai/dsh-subprocess-local` 的 `pty.node` linux-x64 预编译模块。所以启动冒烟放在 Windows（预编译随包提供）上跑。这是上游打包问题，不是模板问题。

## 发布清单

- [ ] `pnpm typecheck` 与 `pnpm build` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm pack` 产出 tarball
- [ ] **打包产物能在全新 profile 加载**（集成 + 冒烟脚本通过）
- [ ] **`hello` 运行时调用通过并有明确断言**（集成脚本）
- [ ] README 双语：安装、配置、示例、故障排查
- [ ] 仓库话题 `dsh-plugin`
- [ ] 打 Release（如 `v0.1.0`）并附 tarball
- [ ] 可选：`pnpm publish` 发 npm

## 健康检查说明

本模板 CI 验证的范围：

- manifest / 包结构有效性（`prepare`、入口、files）
- 依赖兼容性（运行时 peer 版本守卫）
- bundle 可加载（全新 profile 安装 + `--dump-config`）
- DSH 可启动（web 返回 HTTP 200）
- **工具真实可调用**（真实 `hello` handler 执行并断言结果）

**不**声称：生产就绪、安全审计、官方背书。这是社区模板。在官方 `dsh plugin check` 出现之前（见 [RFC #1629](https://github.com/deepseek-ai/deepseek-harness/discussions/1629)），这套 CI 是可重复执行的最接近等价物。

## 故障排查

### npm：`ERESOLVE` peer 依赖冲突

宿主已有不满足 `^0.1.0-rc.6` 的旧 RC。

1. 把宿主升到已验证版本或更新：

   ```sh
   pnpm dlx @deepseek-ai/dsh --version   # 必须打印 0.1.0-rc.6 或更新
   ```

2. 重新安装插件，让它链接到升级后的宿主：

   ```sh
   pnpm dlx @deepseek-ai/dsh plugin --profile web add <本插件>
   ```

3. **不要**用 `--legacy-peer-deps` 压掉错误——就算压掉，运行时守卫也会在版本不对时拒绝加载。

### pnpm：安装成功但插件加载失败

pnpm 默认配置可能把旧 RC 静默链进插件的 peer 槽（已实测：`0.1.0-rc.3` 被链给 `^0.1.0-rc.6`，只有泛泛警告）。随后插件拒绝加载，报错形如：

```text
dsh-plugin-template: resolved @deepseek-ai/dsh-tools 0.1.0-rc.3, but this template is tested with ^0.1.0-rc.6. ...
```

1. 把宿主升到 `0.1.0-rc.6` 或更新，然后重装（同上两条命令）。
2. 可选加固：在项目/profile 的 `.npmrc` 里加 `strict-peer-dependencies=true`，让 pnpm 响亮失败，而不是静默链接不兼容版本。

### 你验证了更新的 RC，想把模板推进

同步改四处：`src/index.ts` 的 `TESTED_PEER_RANGE`、`package.json`（peer + dev）、`pnpm-lock.yaml`（重新 `pnpm install`）、README 的"已验证版本"行。

## 许可证

MIT © 2026 zoahdev
