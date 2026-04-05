#!/usr/bin/env node
/**
 * 一键发布脚本
 *
 * 用法:
 *   npm run release              → 自动 patch +1 (0.1.6 → 0.1.7)
 *   npm run release -- minor     → minor +1      (0.1.6 → 0.2.0)
 *   npm run release -- major     → major +1      (0.1.6 → 1.0.0)
 *   npm run release -- 2.0.0     → 指定版本号
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const run = (cmd) => {
  console.log(`\x1b[36m$ ${cmd}\x1b[0m`);
  return execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
};

const runOutput = (cmd) => execSync(cmd, { encoding: 'utf8', cwd: process.cwd() }).trim();

// ── 1. 计算新版本号 ──────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = pkg.version;
const arg = process.argv[2] || 'patch';

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'major': return `${major + 1}.0.0`;
    default:
      if (/^\d+\.\d+\.\d+$/.test(type)) return type;
      console.error(`无效的版本参数: ${type}`);
      console.error('用法: npm run release [patch|minor|major|x.y.z]');
      process.exit(1);
  }
}

const newVersion = bumpVersion(currentVersion, arg);
console.log(`\n📦 版本: ${currentVersion} → ${newVersion}\n`);

// ── 2. 更新 package.json ─────────────────────────────────────────────
pkg.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

// ── 3. 更新 tauri.conf.json ──────────────────────────────────────────
const tauriConfPath = 'src-tauri/tauri.conf.json';
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

// ── 4. 更新 Cargo.toml ──────────────────────────────────────────────
const cargoPath = 'src-tauri/Cargo.toml';
let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^version\s*=\s*".*"$/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoPath, cargo);

console.log('✅ 已同步版本号到 package.json / tauri.conf.json / Cargo.toml\n');

// ── 5. 检查 git 状态，提交并推送 ──────────────────────────────────────
const branch = runOutput('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  console.error(`⚠️  当前分支是 "${branch}"，请切换到 main 分支后再发布。`);
  process.exit(1);
}

run('git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml');
run(`git commit -m "release: v${newVersion}"`);
run('git push origin main');

console.log(`\n🚀 已推送到 main，GitHub Actions 将自动构建并发布 v${newVersion}`);
console.log(`   查看进度: https://github.com/${runOutput('git remote get-url origin').replace(/.*github\.com[:/]/, '').replace(/\.git$/, '')}/actions\n`);
