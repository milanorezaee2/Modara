#!/usr/bin/env node
/**
 * Does the live site serve exactly the build in dist/?
 *
 *   BASE_PATH=/ npm run build
 *   node scripts/check-deploy.mjs https://your-site.netlify.app
 *
 * Vite fingerprints every bundle (index-<hash>.js), so comparing that hash with
 * the one the live HTML points at is a byte-exact answer to "did my change go
 * live?" — no guessing from screenshots or browser cache.
 */
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const target = (process.argv[2] || process.env.SITE_URL || '').trim().replace(/\/+$/, '');
if (!target) {
  console.error('\n  usage: node scripts/check-deploy.mjs https://your-site.netlify.app\n');
  process.exit(1);
}

const FINGERPRINT = /\/assets\/(?:index|main)-([\w-]+?)\.(?:js|css)/g;
const STAMP = Date.now();

function fingerprints(html) {
  const found = new Map();
  for (const match of html.matchAll(FINGERPRINT)) found.set(match[0].split('/').pop(), match[1]);
  return found;
}

function short(text, max = 58) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function pad(text, size) {
  return String(text).padEnd(size);
}

async function head(file) {
  try {
    return await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  } catch {
    return null;
  }
}

const local = await head('dist/index.html');
if (!local) {
  console.error('\n  dist/index.html is missing — run `BASE_PATH=/ npm run build` first.\n');
  process.exit(1);
}

const localFiles = fingerprints(local);
if (!localFiles.size) {
  console.error('\n  dist/index.html points at no fingerprinted bundle — rebuild and try again.\n');
  process.exit(1);
}

let commit = { sha: '—', subject: '—' };
try {
  commit = {
    sha: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
    subject: execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim(),
  };
} catch {
  /* not a git checkout: fine */
}

const pageUrl = `${target}/?v=${STAMP}`;
let liveHtml;
try {
  const response = await fetch(pageUrl, { headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  liveHtml = await response.text();
} catch (error) {
  console.error(`\n  could not read ${pageUrl}\n  ${error.message ?? error}\n`);
  process.exit(1);
}

const liveFiles = fingerprints(liveHtml);
const rows = [...localFiles.entries()].map(([file, hash]) => ({
  file,
  local: hash,
  live: liveFiles.get(file) ?? 'missing',
}));
let ok = rows.every((row) => row.local === row.live);

const endpoints = [
  ['page', '/', 'text/html'],
  ['bundle', `/assets/${[...localFiles.keys()].find((file) => file.endsWith('.js')) ?? ''}`, 'javascript'],
  ['cover', '/images/og-cover.jpg', 'image/'],
  ['icon', '/favicon.svg', 'svg'],
  ['direct route', '/shop', 'text/html'],
];
const results = [];
for (const [label, pathname, expect] of endpoints) {
  try {
    const response = await fetch(`${target}${pathname}?v=${STAMP}`, {
      headers: { 'cache-control': 'no-cache' },
    });
    const type = response.headers.get('content-type') ?? '';
    const good = response.ok && type.includes(expect);
    if (!good) ok = false;
    results.push({ label, pathname, status: String(response.status), type, good });
  } catch (error) {
    ok = false;
    results.push({ label, pathname, status: 'error', type: error.message ?? String(error), good: false });
  }
}

console.log(`\n  target  ${target}`);
console.log(`  commit  ${commit.sha}  ${short(commit.subject)}`);

const fileWidth = Math.max(6, ...rows.map((row) => row.file.length));
const hashWidth = Math.max(5, ...rows.map((row) => row.local.length));

console.log('\n  fingerprint        this build      live site');
console.log(`  ${'─'.repeat(fileWidth + hashWidth + 22)}`);
for (const row of rows) {
  const mark = row.local === row.live ? '✓' : '✗';
  console.log(
    `  ${mark} ${pad(row.file, fileWidth)}  ${pad(row.local, hashWidth)}  ${pad(row.live, hashWidth)}`,
  );
}

const labelWidth = Math.max(6, ...results.map((row) => row.label.length));
const pathWidth = Math.max(8, ...results.map((row) => row.pathname.length));

console.log('\n  endpoint       path               status  content-type');
console.log(`  ${'─'.repeat(labelWidth + pathWidth + 24)}`);
for (const row of results) {
  console.log(
    `  ${row.good ? '✓' : '✗'} ${pad(row.label, labelWidth)}  ${pad(row.pathname, pathWidth)}  ` +
      `${pad(row.status, 6)}  ${short(row.type, 34)}`,
  );
}

if (ok) {
  console.log('\n  ✓ the live site is serving exactly this build\n');
} else {
  console.log('\n  ✗ the live site is NOT serving this build.');
  console.log('    merge/push to main (or run a Netlify deploy), wait for the build, then run this again.\n');
}
process.exit(ok ? 0 : 1);
