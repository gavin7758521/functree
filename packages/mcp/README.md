# @gavin7758521/functree-mcp

Remote MCP adapter for FuncTree.

This package runs a local stdio MCP process for Codex or another MCP client. It does not store data locally. Every tool call is forwarded to a FuncTree HTTP server.

```text
Codex / MCP client
  -> local functree-mcp process
    -> http://<functree-server>:4174
      -> FuncTree Server / SQLite
```

## Install

```bash
npm install -g @gavin7758521/functree-mcp
```

Or run without a global install:

```bash
npx @gavin7758521/functree-mcp --server-url http://<functree-server>:4174
```

## Configuration

Use either CLI flags or environment variables.

| CLI flag | Environment variable | Default |
| --- | --- | --- |
| `--server-url` | `FUNCTREE_SERVER_URL` | `http://127.0.0.1:4174` |
| `--timeout-ms` | `FUNCTREE_TIMEOUT_MS` | `30000` |

## Codex MCP config

```toml
[mcp_servers.functree]
command = "functree-mcp"
env = { FUNCTREE_SERVER_URL = "http://<functree-server>:4174" }

[mcp_servers.functree.tools.functree_create_project]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature_set]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_alignment]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_create_alignment]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature_sets_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_features_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_alignments_batch]
approval_mode = "approve"
```

`functree_query_context` is read-only.

## Tools

- `functree_create_project`: create or update a FuncTree project.
- `functree_upsert_feature_set`: create or update a feature set under a project by `id` or `stableKey`.
- `functree_upsert_feature`: create or update a feature under a feature set by `id` or `stableKey` + `version`.
- `functree_upsert_alignment`: create or update a cross-level alignment relation by `id`, `stableKey`, or member set.
- `functree_create_alignment`: compatibility alias for `functree_upsert_alignment`.
- `functree_upsert_feature_sets_batch`: batch upsert feature sets with `dryRun` and per-item errors.
- `functree_upsert_features_batch`: batch upsert features with `dryRun` and rollback on write failure.
- `functree_upsert_alignments_batch`: batch upsert alignments with member-set de-duplication.
- `functree_query_context`: read project, feature set, feature, and alignment context with filters and cursor pagination.

Write tools return `operation`, `changedFields`, `data`, and `dryRun`. `operation` is `created`, `updated`, `unchanged`, or `dry_run`.

`functree_query_context` supports `types`, `featureSetId`, `stableKey`, `alignmentId`, `parentFeatureId`, `offset`, and `cursor`; use `page.nextCursor` to fetch the next page.

## Packaging note

The npm package publishes only `dist` and this README. Runtime configuration should be supplied through environment variables or CLI flags, not committed into the package.
