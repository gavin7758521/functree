#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(rootDir, 'packages/mcp/package.json');
const cliPath = path.join(rootDir, 'packages/mcp/src/cli.ts');
const bump = process.argv[2];

if (!bump) {
  fail('Usage: pnpm mcp:version <patch|minor|major|x.y.z>');
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;
const nextVersion = resolveNextVersion(currentVersion, bump);

packageJson.version = nextVersion;
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const cliSource = fs.readFileSync(cliPath, 'utf8');
const nextCliSource = cliSource.replace(/const VERSION = '[^']+';/u, `const VERSION = '${nextVersion}';`);
if (nextCliSource === cliSource) {
  fail('Could not update VERSION constant in packages/mcp/src/cli.ts');
}
fs.writeFileSync(cliPath, nextCliSource);

console.log(`MCP package version bumped: ${currentVersion} -> ${nextVersion}`);
console.log('Run: pnpm install --lockfile-only && pnpm mcp:version:check');

function resolveNextVersion(current, value) {
  const parsed = parseVersion(current);
  if (value === 'patch') return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  if (value === 'minor') return `${parsed.major}.${parsed.minor + 1}.0`;
  if (value === 'major') return `${parsed.major + 1}.0.0`;
  if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(value)) return value;
  fail(`Unsupported version bump: ${value}`);
}

function parseVersion(value) {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)/u);
  if (!match) {
    fail(`Invalid current MCP package version: ${value}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
