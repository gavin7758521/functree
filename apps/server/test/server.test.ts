import { describe, expect, it } from 'vitest';
import { openMemoryDatabase } from '../src/database.js';
import { createHttpServer } from '../src/http.js';
import { FuncTreeRepository } from '../src/repository.js';

describe('FuncTree 服务端', () => {
  it('创建项目、Map、功能、入口文件、代码引用和跨层级对齐关系', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_test', name: '测试项目', currentVersion: '1.0', status: 'active' });
    const map = repo.createMap(project.id, {
      id: 'map_web',
      stableKey: 'web.chat-ui',
      name: 'Web 聊天界面',
      version: '1.0',
      axis: 'web',
      scope: 'implementation',
      kind: 'app',
      status: 'normal'
    });
    const feature = repo.createFeature(map.id, {
      id: 'feat_login',
      stableKey: 'login',
      name: '登录',
      version: '1.0',
      status: 'in_progress'
    });
    const entryPoint = repo.createEntryPoint(project.id, {
      id: 'ep_app',
      mapId: map.id,
      stableKey: 'web.app-root',
      name: 'App 入口',
      path: 'src/App.tsx',
      kind: 'app_root'
    });
    const reference = repo.createCodeReference(project.id, {
      id: 'ref_login_view',
      mapId: map.id,
      featureId: feature.id,
      entryPointId: entryPoint.id,
      path: 'src/App.tsx',
      symbol: 'LoginView',
      kind: 'component'
    });
    const alignment = repo.createAlignment(project.id, {
      name: '项目到代码链路对齐',
      members: [
        { targetType: 'project', targetId: project.id },
        { targetType: 'map', targetId: map.id },
        { targetType: 'feature', targetId: feature.id },
        { targetType: 'entry_point', targetId: entryPoint.id },
        { targetType: 'code_reference', targetId: reference.id }
      ]
    });

    expect(alignment.members.map((member) => member.targetType)).toEqual(['code_reference', 'entry_point', 'feature', 'map', 'project']);
  });

  it('HTTP API 返回中文平台总览', async () => {
    const app = createHttpServer(openMemoryDatabase());
    await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'content-type': 'application/json' },
      body: { id: 'proj_http', name: 'HTTP 项目', currentVersion: '1.0', status: 'active' }
    });
    const response = await app.inject({ method: 'GET', url: '/api/overview' });

    expect(response.statusCode).toBe(200);
    expect(response.json().projects[0].name).toBe('HTTP 项目');
  });

  it('HTTP MCP 调试入口可以查询上下文', async () => {
    const app = createHttpServer(openMemoryDatabase());
    await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'content-type': 'application/json' },
      body: { id: 'proj_mcp', name: 'MCP 项目', currentVersion: '1.0', status: 'active' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/projects/proj_mcp/maps',
      headers: { 'content-type': 'application/json' },
      body: { id: 'map_mcp_web', stableKey: 'web.chat-ui', name: '前端聊天界面', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/maps/map_mcp_web/features',
      headers: { 'content-type': 'application/json' },
      body: { id: 'feat_mcp_login', stableKey: 'login', name: '登录', version: '1.0', status: 'draft' }
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_query_context',
        arguments: { projectId: 'proj_mcp', keyword: 'login', limit: 100 }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().features.length).toBeGreaterThan(0);
  });

  it('上下文查询支持包含符号的稳定键', async () => {
    const app = createHttpServer(openMemoryDatabase());
    await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'content-type': 'application/json' },
      body: { id: 'proj_symbol', name: '符号项目', currentVersion: '1.0', status: 'active' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/projects/proj_symbol/maps',
      headers: { 'content-type': 'application/json' },
      body: { id: 'map_symbol_backend', stableKey: 'backend.bots', name: '机器人后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/maps/map_symbol_backend/features',
      headers: { 'content-type': 'application/json' },
      body: { id: 'feat_symbol_countdown', stableKey: 'login.sms-countdown', name: '验证码倒计时', version: '1.0', status: 'draft' }
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_query_context',
        arguments: { projectId: 'proj_symbol', keyword: 'login.sms-countdown' }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().features[0].id).toBe('feat_symbol_countdown');
  });

  it('上下文查询支持类型过滤、stableKey 片段和游标分页', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    repo.createProject({ id: 'proj_page', name: '分页项目', currentVersion: '1.0', status: 'active' });
    const map = repo.createMap('proj_page', {
      id: 'map_page_backend',
      stableKey: 'backend.bots',
      name: '机器人后端',
      version: '1.0',
      axis: 'backend',
      scope: 'implementation',
      kind: 'service',
      status: 'normal'
    });
    repo.createFeature(map.id, { id: 'feat_page_list', stableKey: 'backend.bots.list', name: '机器人列表', version: '1.0', status: 'draft' });
    repo.createFeature(map.id, { id: 'feat_page_detail', stableKey: 'backend.bots-detail', name: '机器人详情', version: '1.0', status: 'draft' });

    const firstPage = repo.queryContext({
      projectId: 'proj_page',
      types: ['feature'],
      keyword: 'backend.bots',
      mapId: map.id,
      limit: 1
    });
    const secondPage = repo.queryContext({
      projectId: 'proj_page',
      types: ['feature'],
      keyword: 'backend.bots',
      mapId: map.id,
      limit: 1,
      cursor: firstPage.page.nextCursor ?? undefined
    });

    expect(firstPage.projects).toHaveLength(0);
    expect(firstPage.maps).toHaveLength(0);
    expect(firstPage.features).toHaveLength(1);
    expect(firstPage.page.totals.feature).toBe(2);
    expect(firstPage.page.nextCursor).toBe('1');
    expect(secondPage.features).toHaveLength(1);
    expect(secondPage.features[0].id).not.toBe(firstPage.features[0].id);
    expect(firstPage.summary.mapCount).toBe(1);
  });

  it('Map stableKey upsert 返回操作状态和变更字段', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    repo.createProject({ id: 'proj_map_upsert', name: 'Map Upsert', currentVersion: '1.0', status: 'active' });

    const created = repo.upsertMap('proj_map_upsert', {
      stableKey: 'web.frontend',
      name: 'Web 前端',
      version: '1.0',
      axis: 'web',
      scope: 'implementation',
      kind: 'app'
    });
    const updated = repo.upsertMap('proj_map_upsert', {
      stableKey: 'web.frontend',
      name: 'Web 前端',
      version: '1.0',
      axis: 'web',
      scope: 'implementation',
      kind: 'app',
      owner: 'frontend-team'
    });
    const unchanged = repo.upsertMap('proj_map_upsert', {
      stableKey: 'web.frontend',
      name: 'Web 前端',
      version: '1.0',
      axis: 'web',
      scope: 'implementation',
      kind: 'app',
      owner: 'frontend-team'
    });

    expect(created.operation).toBe('created');
    expect(updated.operation).toBe('updated');
    expect(updated.changedFields).toContain('owner');
    expect(unchanged.operation).toBe('unchanged');
    expect(repo.listMaps('proj_map_upsert')).toHaveLength(1);
  });

  it('对齐关系按成员集合 upsert，避免重复创建', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_alignment_upsert', name: '对齐 Upsert', currentVersion: '1.0', status: 'active' });
    const front = repo.createMap(project.id, { id: 'map_align_front', stableKey: 'web.frontend', name: '前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    const back = repo.createMap(project.id, { id: 'map_align_back', stableKey: 'backend.api', name: '后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' });

    const first = repo.upsertAlignment(project.id, {
      name: '前后端登录对齐',
      members: [
        { targetType: 'map', targetId: front.id, role: 'source' },
        { targetType: 'map', targetId: back.id, role: 'target' }
      ]
    });
    const second = repo.upsertAlignment(project.id, {
      name: '前后端登录对齐',
      members: [
        { targetType: 'map', targetId: back.id, role: 'target' },
        { targetType: 'map', targetId: front.id, role: 'source' }
      ]
    });

    expect(first.operation).toBe('created');
    expect(second.operation).toBe('unchanged');
    expect(second.data.id).toBe(first.data.id);
    expect(repo.listAlignments(project.id)).toHaveLength(1);
  });

  it('批量写入支持 dry-run，并在失败时回滚已写入项', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    repo.createProject({ id: 'proj_batch', name: '批量项目', currentVersion: '1.0', status: 'active' });
    const map = repo.createMap('proj_batch', { id: 'map_batch', stableKey: 'backend.batch', name: '批量后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' });

    const preview = repo.upsertFeaturesBatch({
      mapId: map.id,
      dryRun: true,
      items: [{ stableKey: 'backend.batch.create', name: '创建任务', version: '1.0', status: 'draft' }]
    });
    const failed = repo.upsertFeaturesBatch({
      mapId: map.id,
      dryRun: false,
      items: [
        { stableKey: 'backend.batch.create', name: '创建任务', version: '1.0', status: 'draft' },
        { stableKey: 'backend.batch.child', name: '子任务', version: '1.0', status: 'draft', parentFeatureId: 'feat_missing' }
      ]
    });

    expect(preview.results[0].operation).toBe('dry_run');
    expect(preview.results[0].previewId).toMatch(/^preview_feat_/u);
    expect(preview.results[0].data.id).toMatch(/^preview_feat_/u);
    expect(repo.listFeatures('proj_batch')).toHaveLength(0);
    expect(failed.success).toBe(false);
    expect(failed.rolledBack).toBe(true);
    expect(failed.errors[0].index).toBe(1);
    expect(repo.listFeatures('proj_batch')).toHaveLength(0);
  });

  it('入口文件和代码引用支持批量 dry-run 与路径查询', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    repo.createProject({ id: 'proj_refs', name: '引用项目', currentVersion: '1.0', status: 'active' });
    const map = repo.createMap('proj_refs', { id: 'map_refs', stableKey: 'web.refs', name: '引用前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });

    const entryPreview = repo.upsertEntryPointsBatch({
      projectId: 'proj_refs',
      dryRun: true,
      items: [{ mapId: map.id, stableKey: 'web.refs.root', name: '入口', path: 'src/main.tsx', kind: 'app_root' }]
    });
    const entry = repo.createEntryPoint('proj_refs', { id: 'ep_refs', mapId: map.id, stableKey: 'web.refs.root', name: '入口', path: 'src/main.tsx', kind: 'app_root' });
    const referencePreview = repo.upsertCodeReferencesBatch({
      projectId: 'proj_refs',
      dryRun: true,
      items: [{ mapId: map.id, entryPointId: entry.id, path: 'src/main.tsx', symbol: 'bootstrap', kind: 'function' }]
    });
    const reference = repo.createCodeReference('proj_refs', { mapId: map.id, entryPointId: entry.id, path: 'src/main.tsx', symbol: 'bootstrap', kind: 'function' });
    const context = repo.queryContext({ projectId: 'proj_refs', types: ['entry_point', 'code_reference'], path: 'main.tsx' });

    expect(entryPreview.results[0].operation).toBe('dry_run');
    expect(referencePreview.results[0].operation).toBe('dry_run');
    expect(reference.id).toBeTruthy();
    expect(context.entryPoints[0].id).toBe(entry.id);
    expect(context.codeReferences[0].path).toBe('src/main.tsx');
  });

  it('HTTP 错误响应包含 code、message、hint 和 requestId', async () => {
    const app = createHttpServer(openMemoryDatabase());
    const response = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_query_context',
        arguments: { limit: 201 }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('VALIDATION_ERROR');
    expect(response.json().message).toBeTruthy();
    expect(response.json().hint).toBeTruthy();
    expect(response.json().requestId).toBeTruthy();
  });

  it('支持跨 Map 批量功能写入、stableKey 解析和稳定键成员对齐', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_stable_refs', name: '稳定键项目', currentVersion: '1.0', status: 'active' });
    repo.createMap(project.id, { id: 'map_web_refs', stableKey: 'web.chat-ui', name: 'Web 聊天', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    repo.createMap(project.id, { id: 'map_backend_refs', stableKey: 'backend.chat-core', name: '聊天后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' });

    const batch = repo.upsertFeaturesBatch({
      projectId: project.id,
      dryRun: false,
      items: [
        { mapStableKey: 'web.chat-ui', stableKey: 'composer.send', name: '发送输入框', version: '1.0', kind: 'component' },
        { mapStableKey: 'backend.chat-core', stableKey: 'message.send', name: '发送消息 API', version: '1.0', kind: 'api' }
      ]
    });
    const entryPoint = repo.createEntryPoint(project.id, {
      mapStableKey: 'web.chat-ui',
      stableKey: 'web.room-view',
      name: '房间视图入口',
      path: 'src/RoomView.tsx',
      kind: 'router'
    });
    const reference = repo.createCodeReference(project.id, {
      mapStableKey: 'web.chat-ui',
      featureStableKey: 'composer.send',
      featureVersion: '1.0',
      entryPointStableKey: entryPoint.stableKey,
      stableKey: 'web.room-view.composer',
      path: 'src/RoomView.tsx',
      symbol: 'Composer',
      kind: 'component'
    });
    const resolved = repo.resolveStableKeys({
      projectId: project.id,
      items: [
        { type: 'map', stableKey: 'web.chat-ui' },
        { type: 'feature', stableKey: 'composer.send', mapStableKey: 'web.chat-ui', version: '1.0' },
        { type: 'entry_point', stableKey: 'web.room-view' },
        { type: 'code_reference', stableKey: 'web.room-view.composer' }
      ]
    });
    const alignment = repo.upsertAlignment(project.id, {
      stableKey: 'align.send-message.web-backend',
      name: '发送消息前后端对齐',
      members: [
        { targetType: 'feature', stableKey: 'composer.send', mapStableKey: 'web.chat-ui', version: '1.0', role: 'source' },
        { targetType: 'feature', stableKey: 'message.send', mapStableKey: 'backend.chat-core', version: '1.0', role: 'target' },
        { targetType: 'code_reference', stableKey: reference.stableKey, role: 'evidence' }
      ]
    });
    const lite = repo.queryContext({ projectId: project.id, types: ['feature'], view: 'lite', limit: 10 });
    const alignments = repo.queryContext({ projectId: project.id, types: ['alignment'], includeMembers: false });

    expect(batch.success).toBe(true);
    expect(batch.results).toHaveLength(2);
    expect(resolved.results.every((item) => item.found)).toBe(true);
    expect(alignment.operation).toBe('created');
    expect(alignment.data.members).toHaveLength(3);
    expect(lite.features[0]).toEqual(expect.objectContaining({ type: 'feature', stableKey: expect.any(String), mapId: expect.any(String) }));
    expect((lite.features[0] as Record<string, unknown>).metadata).toBeUndefined();
    expect(alignments.alignments[0].members).toHaveLength(0);
  });

  it('记录扫描 commit，并支持项目摘要与路径上下文查询', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_scan', name: '扫描项目', currentVersion: '1.0', status: 'active' });
    repo.createMap(project.id, { id: 'map_scan_web', stableKey: 'web.scan', name: '扫描前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    const scan = repo.beginScan({
      projectId: project.id,
      repoKey: 'github:gavin7758521/functree',
      branch: 'main',
      commitSha: 'abcdef1',
      baseCommitSha: 'abcde00',
      worktreeDirty: false
    });
    const entryPoint = repo.createEntryPoint(project.id, {
      mapStableKey: 'web.scan',
      stableKey: 'web.scan.root',
      name: '扫描入口',
      path: 'src/main.tsx',
      kind: 'app_root',
      scanRunId: scan.id
    });
    const reference = repo.createCodeReference(project.id, {
      mapStableKey: 'web.scan',
      entryPointStableKey: entryPoint.stableKey,
      stableKey: 'web.scan.bootstrap',
      path: 'src/main.tsx',
      symbol: 'bootstrap',
      kind: 'function',
      scanRunId: scan.id
    });
    const finished = repo.finishScan({ scanRunId: scan.id, status: 'completed', summary: { entryPoints: 1, codeReferences: 1 } });
    const summary = repo.projectSummary({ projectId: project.id });
    const pathContext = repo.queryPathContext({ projectId: project.id, path: 'src/main.tsx', pathMode: 'exact' });

    expect(finished.status).toBe('completed');
    expect(summary.latestScanRun?.commitSha).toBe('abcdef1');
    expect(summary.scanRunCount).toBe(1);
    expect(pathContext.entryPoints[0].id).toBe(entryPoint.id);
    expect(pathContext.codeReferences[0].id).toBe(reference.id);
    expect(pathContext.maps[0].stableKey).toBe('web.scan');
    expect(reference.lastSeenCommitSha).toBe('abcdef1');
  });
});
