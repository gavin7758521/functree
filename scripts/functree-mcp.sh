#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export FUNCTREE_SERVER_URL="${FUNCTREE_SERVER_URL:-http://127.0.0.1:4174}"

exec pnpm --dir "$ROOT_DIR" --filter @gavin7758521/functree-mcp mcp
