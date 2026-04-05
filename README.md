# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## 打包与发布（GitHub Actions）

本项目已配置 GitHub Actions 自动打包与发布：

- 工作流文件：`.github/workflows/publish.yml`
- 触发方式：推送到 `main` 分支自动运行，或在 GitHub → Actions → `publish` 手动点击 `Run workflow`

### 工作流逻辑

工作流分三个阶段：

| 阶段 | 内容 | 耗时 |
|------|------|------|
| `check` | 读取版本号，检查 tag 是否已存在 | ~10 秒 |
| `build` | 各平台并行编译（版本变更时才执行） | 10～20 分钟 |
| `release` | 汇总产物，生成 `latest.json`，创建 GitHub Release | ~1 分钟 |

版本号未变更时，`check` 检测到 tag 已存在，后续所有步骤直接跳过，整个 CI 几秒结束。

各平台打包格式：

| 平台 | 打包格式 |
|------|----------|
| macOS arm64 | `.dmg` + `.app.tar.gz`（用于自动更新） |
| macOS x86_64 | `.dmg` + `.app.tar.gz`（用于自动更新） |
| Linux | `.AppImage` + `.deb` |
| Windows | `.exe`（NSIS）+ `.msi` |

### 发版步骤

1. 修改 `package.json` 的 `version`（例如 `0.1.2` → `0.1.3`）
2. 提交并推送到 `main`
3. 等待 Actions 运行完成（约 10～20 分钟）
4. 打开 GitHub → Releases 查看新版本（tag 形如 `v0.1.3`）

> 日常推送代码（不改版本号）不会触发任何编译，无需担心 CI 资源消耗。

### 自动更新签名（启用 Tauri Updater 时必须配置）

Tauri 自动更新功能需要签名密钥才能验证安装包完整性，CI 打包时会自动为更新包生成 `latest.json`。

**第一步：生成签名密钥（只做一次）**

```bash
npm run tauri:signer:gen
```

私钥不要提交到仓库，妥善保存。

**第二步：在仓库 Secrets 中添加以下两项**

路径：仓库 Settings → Secrets and variables → Actions → New repository secret

- `TAURI_SIGNING_PRIVATE_KEY` — 生成的私钥内容
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — 私钥对应的密码

## 本地打包（可选）

如果你仍然想在本地打包：

```bash
npm install
npm run tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
