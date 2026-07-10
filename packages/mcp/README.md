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

[mcp_servers.functree.tools.functree_upsert_map]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_entry_point]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_code_reference]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_alignment]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_maps_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_features_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_entry_points_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_code_references_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_alignments_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_begin_scan]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_finish_scan]
approval_mode = "approve"
```

`functree_query_context`, `functree_resolve_stable_keys`, `functree_project_summary`, and `functree_query_path_context` are read-only.

## Tools

- `functree_create_project`: create or update a FuncTree project.
- `functree_upsert_map`: create or update a project map by `id` or `stableKey`.
- `functree_upsert_feature`: create or update a feature under a map by `id` or `stableKey` + `version`; accepts `mapId` or `projectId + mapStableKey`.
- `functree_upsert_entry_point`: create or update an analysis entry point; accepts `mapStableKey` and `scanRunId`.
- `functree_upsert_code_reference`: create or update a code reference by `id`, `stableKey`, or path signature; accepts `mapStableKey`, `featureStableKey`, `entryPointStableKey`, and `scanRunId`.
- `functree_upsert_alignment`: create or update a cross-layer alignment relation by `id`, `stableKey`, or member set. Members can use `targetId` or stable keys.
- `functree_upsert_maps_batch`: batch upsert maps with `dryRun` and per-item errors.
- `functree_upsert_features_batch`: batch upsert features across one or more maps with `dryRun` and rollback on write failure.
- `functree_upsert_entry_points_batch`: batch upsert entry points.
- `functree_upsert_code_references_batch`: batch upsert code references.
- `functree_upsert_alignments_batch`: batch upsert alignments with member-set de-duplication.
- `functree_query_context`: read project, map, feature, entry point, code reference, and alignment context with filters, `view: "lite"`, summary-only mode, and cursor pagination.
- `functree_resolve_stable_keys`: resolve stable keys to concrete IDs in bulk.
- `functree_project_summary`: read project counts, latest scan, conflicts, and orphan reference counts.
- `functree_query_path_context`: read existing entry points/code references and related objects for a path.
- `functree_begin_scan`: record the start of a Git commit scan.
- `functree_finish_scan`: finish a scan and store its summary.

Write tools return `operation`, `changedFields`, `data`, `dryRun`, and sometimes `previewId`. `operation` is `created`, `updated`, `unchanged`, or `dry_run`. Dry-run-created IDs are prefixed with `preview_` and must not be reused as real IDs.

`functree_query_context` supports `types`, `view`, `includeSummaryOnly`, `includeMembers`, `includeMetadata`, `mapId`, `mapStableKey`, `stableKey`, `alignmentId`, `parentFeatureId`, `entryPointId`, `codeReferenceId`, `path`, `pathMode`, `offset`, and `cursor`; use `page.nextCursor` to fetch the next page.

## Packaging note

The npm package publishes only `dist` and this README. Runtime configuration should be supplied through environment variables or CLI flags, not committed into the package.
