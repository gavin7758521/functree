#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(rootDir, 'packages/mcp/package.json');
const cliPath = path.join(rootDir, 'packages/mcp/src/cli.ts');

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const cliSource = fs.readFileSync(cliPath, 'utf8');
const cliVersion = cliSource.match(/const VERSION = '([^']+)';/u)?.[1];

if (!isSemver(packageJson.version)) {
  fail(`Invalid MCP package semver: ${packageJson.version}`);
}

if (!cliVersion) {
  fail('Could not find VERSION constant in packages/mcp/src/cli.ts');
}

if (cliVersion !== packageJson.version) {
  fail(`MCP version mismatch: package.json=${packageJson.version}, cli.ts=${cliVersion}`);
}

console.log(`MCP package version OK: ${packageJson.version}`);

function isSemver(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(value);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
