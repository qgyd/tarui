# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## 打包与发布（GitHub Actions）

本项目已配置 GitHub Actions 自动打包与发布：

- 工作流文件：`.github/workflows/publish.yml`
- 触发方式：
  - 推送到 `main` 分支会自动运行
  - 在 GitHub → Actions → `publish` 可手动点击 `Run workflow` 运行

### 1) 只打包（不发 Release）

适合日常验证构建是否正常，不需要在本地打包。

1. 将代码推送到 `main`（或手动运行工作流）
2. 打开 GitHub → Actions → 选择对应的 `publish` 运行记录
3. 在页面底部 `Artifacts` 下载构建产物（各平台会分别产出）

产物通常位于 Tauri 的 bundle 目录（Actions 已自动上传）：

- `src-tauri/target/**/release/bundle/**`

### 2) 自动发版（创建 Tag + Release 并上传安装包）

工作流会读取 `package.json` 的 `version`，如果发现对应的 git tag `v<version>` 不存在，就会自动创建 Release 并把各平台安装包上传到 Release Assets。

发版步骤：

1. 修改 `package.json` 的 `version`（例如 `0.1.2` → `0.1.3`）
2. 提交并推送到 `main`
3. 等待 Actions 运行完成
4. 打开 GitHub → Releases 查看新版本（tag 形如 `v0.1.3`）

### 3) Release 签名（可选，但启用自动更新时通常需要）

工作流中启用了 `includeUpdaterJson`。如果你要使用 Tauri Updater（自动更新），一般需要配置签名密钥。

在仓库 Settings → Secrets and variables → Actions → New repository secret 添加：

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

本地生成签名密钥（只做一次即可，私钥不要提交到仓库）：

```bash
npm run tauri:signer:gen
```

然后把生成的私钥内容与密码写入上述 Secrets。

## 本地打包（可选）

如果你仍然想在本地打包：

```bash
npm install
npm run tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
