# dsh-plugin-template

[English](#english) · [中文](#中文)

A minimal, **verified** starting point for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins. Fork it, rename it, and ship your own plugin with confidence.

> Topic: [`dsh-plugin`](https://github.com/topics/dsh-plugin) · Tested with `dsh` 0.1.0-rc.6 · Node 24 / pnpm 11

## What's inside

```text
├── package.json          # dsh.bundle manifest + build scripts (prepare = git-install build)
├── cordis.patch.yml      # plugin row: id, package name, config
├── src/index.ts          # plugin entry: name / inject / Config / apply + one `hello` tool
├── tests/index.spec.ts   # registration + tool behavior + cancellation
├── .github/workflows/ci.yml  # build → test → pack → dsh plugin add → dump-config → boot web
└── README.md             # bilingual
```

## Why this exists

See the [RFC in deepseek-ai/deepseek-harness discussions](https://github.com/deepseek-ai/deepseek-harness/discussions/1629): plugin authors were hand-writing bundle manifests with no canonical template, and the npm version-train confusion (`dsh-tools` `latest` → broken `0.0.1-rc.1`) was blocking installs. This template pins the working train (`0.1.0-rc.6`) and ships a CI smoke test so "loads in dsh" is proven, not assumed.

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

## Publishing checklist

- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] CI green (includes a real `dsh plugin add` + `dsh web` boot)
- [ ] README bilingual, includes install + config + example prompts
- [ ] Repo topic: `dsh-plugin`
- [ ] Tag a release (e.g. `v0.1.0`) with the packed tarball
- [ ] Optional: `pnpm publish` to npm

## Health check note

Until an official `dsh plugin check` command exists, this template's CI performs the checks a health check should: manifest structure (`verify` via install), bundle loadability (`dsh web` boot), and dependency version alignment (peers pinned to `0.1.0-rc.6`). See discussion [#1629](https://github.com/deepseek-ai/deepseek-harness/discussions/1629) for the community proposal.

## License

MIT © 2026 zoahdev

---

## 中文

**dsh-plugin-template** 是一个最小、**经过验证**的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件起点：fork 后改名即可发布自己的插件。

> 话题：[`dsh-plugin`](https://github.com/topics/dsh-plugin) · 已在 `dsh` 0.1.0-rc.6 / Node 24 / pnpm 11 实测

## 包含内容

- `package.json`：`dsh.bundle` manifest + 构建脚本（`prepare` 支持 git 安装构建）
- `cordis.patch.yml`：插件行（id、包名、config）
- `src/index.ts`：插件入口 + 一个 `hello` 工具（含取消处理）
- `tests/index.spec.ts`：注册、行为、取消测试
- `.github/workflows/ci.yml`：build → test → pack → `dsh plugin add` → dump-config → 启动 web
- 双语 README

## 为什么存在

见官方仓库 [RFC #1629](https://github.com/deepseek-ai/deepseek-harness/discussions/1629)：插件作者没有官方模板、只能手写 bundle manifest；npm 版本火车混乱（`dsh-tools` latest 指向坏的 `0.0.1-rc.1`）还导致安装失败。本模板固定可用版本线（`0.1.0-rc.6`），并用 CI 真正证明"能在 dsh 里加载"。

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

## 发布清单

- [ ] `pnpm build` 通过
- [ ] `pnpm test` 通过
- [ ] CI 全绿（含真实 `dsh plugin add` + `dsh web` 启动）
- [ ] README 双语，含安装、配置、示例提问
- [ ] 仓库话题 `dsh-plugin`
- [ ] 打 Release（如 `v0.1.0`）并附 tarball
- [ ] 可选：`pnpm publish` 发 npm

## 健康检查说明

在官方 `dsh plugin check` 命令出现前，本模板的 CI 做了健康检查该做的事：manifest 结构（安装即验证）、bundle 可加载（`dsh web` 启动）、依赖版本对齐（peer 固定 `0.1.0-rc.6`）。社区提案见 [#1629](https://github.com/deepseek-ai/deepseek-harness/discussions/1629)。

## 许可证

MIT © 2026 zoahdev
