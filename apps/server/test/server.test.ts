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

  it('支持功能详情、证据、编程上下文和质量报告', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_ai_context', name: 'AI 编程上下文', currentVersion: '1.0', status: 'active' });
    const product = repo.createMap(project.id, { id: 'map_ai_product', stableKey: 'product.chat', name: '聊天产品能力', version: '1.0', axis: 'product', scope: 'capability', kind: 'domain' });
    const backend = repo.createMap(project.id, { id: 'map_ai_backend', stableKey: 'backend.chat', name: '聊天后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' });
    const productFeature = repo.createFeature(product.id, { id: 'feat_product_send', stableKey: 'message.send-text', name: '发送文本消息', version: '1.0', status: 'released' });
    const backendFeature = repo.createFeature(backend.id, {
      id: 'feat_backend_send',
      stableKey: 'message.send-text',
      name: '发送文本消息 API',
      version: '1.0',
      status: 'in_progress',
      kind: 'api',
      details: {
        intent: '让客户端发送文本消息。',
        currentBehavior: '已接收请求并写入事件表。',
        expectedBehavior: '完成权限检查、持久化和同步通知。',
        scope: '包含文本消息，不包含媒体消息。',
        acceptanceCriteria: ['成功发送后 timeline 可见', '无权限用户被拒绝'],
        risks: ['权限规则变化会影响旧房间']
      }
    });
    const entryPoint = repo.createEntryPoint(project.id, {
      id: 'ep_backend_messages',
      mapId: backend.id,
      stableKey: 'backend.messages-api',
      name: '消息 API',
      path: 'src/messages.ts',
      kind: 'http_api_root'
    });
    const reference = repo.createCodeReference(project.id, {
      id: 'ref_backend_send',
      mapId: backend.id,
      featureId: backendFeature.id,
      entryPointId: entryPoint.id,
      stableKey: 'backend.messages.send',
      path: 'src/messages.ts',
      symbol: 'sendMessage',
      kind: 'function',
      roleInFeature: 'core_logic',
      changeGuidance: '修改时同时检查 power level。',
      verificationHint: '运行消息 API 测试。',
      blastRadius: 'backend.chat'
    });
    const evidence = repo.upsertEvidence(project.id, {
      targetType: 'feature',
      targetStableKey: 'message.send-text',
      mapStableKey: 'backend.chat',
      version: '1.0',
      evidenceType: 'code_fact',
      path: 'src/messages.ts',
      symbol: 'sendMessage',
      summary: '代码中存在发送文本消息处理。',
      commitSha: 'abcdef1'
    });
    const alignment = repo.upsertAlignment(project.id, {
      stableKey: 'align.send.product-backend',
      name: '发送消息产品到后端实现',
      relation: 'backend_implements',
      status: 'confirmed',
      members: [
        { targetType: 'feature', targetId: productFeature.id, role: 'source' },
        { targetType: 'feature', targetId: backendFeature.id, role: 'target' },
        { targetType: 'code_reference', targetId: reference.id, role: 'evidence' }
      ]
    });
    const query = repo.queryContext({ projectId: project.id, types: ['feature', 'evidence'], includeDetails: true, stableKey: 'message.send-text', mapStableKey: 'backend.chat' });
    const programming = repo.programmingContext({ projectId: project.id, featureStableKey: 'message.send-text', mapStableKey: 'backend.chat', featureVersion: '1.0', depth: 1 });
    const report = repo.qualityReport({ projectId: project.id });
    const tree = repo.getProjectTree(project.id);
    const treeBackendFeature = tree.maps.find((map) => map.id === backend.id)?.features?.[0];

    expect(evidence.operation).toBe('created');
    expect(alignment.data.relation).toBe('backend_implements');
    expect(query.features[0]).toMatchObject({ id: backendFeature.id, details: expect.objectContaining({ intent: '让客户端发送文本消息。' }) });
    expect(query.evidence[0]).toMatchObject({ evidenceType: 'code_fact', targetId: backendFeature.id });
    expect(treeBackendFeature).toMatchObject({ id: backendFeature.id, details: expect.objectContaining({ expectedBehavior: '完成权限检查、持久化和同步通知。' }) });
    expect(tree.evidence[0]).toMatchObject({ targetId: backendFeature.id, summary: '代码中存在发送文本消息处理。' });
    expect(programming.requiredEntryPoints[0].id).toBe(entryPoint.id);
    expect(programming.keyCodeReferences[0].verificationHint).toBe('运行消息 API 测试。');
    expect(programming.relatedProductCapabilities[0].id).toBe(productFeature.id);
    expect(programming.evidence[0].evidenceType).toBe('code_fact');
    expect(programming.qualityIssues.some((issue) => issue.code === 'IN_PROGRESS_DETAIL_GAP')).toBe(false);
    expect(report.summary.featuresWithoutCodeReferences).toBe(1);
    expect(report.summary.featuresWithoutCodeEvidence).toBe(1);
  });

  it('支持能力状态矩阵和结构化缺口', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_matrix', name: '能力矩阵项目', currentVersion: '1.0', status: 'active' });
    const product = repo.createMap(project.id, { id: 'map_matrix_product', stableKey: 'product.ai-assistant', name: 'AI 助手产品', version: '1.0', axis: 'product', scope: 'capability', kind: 'domain' });
    const web = repo.createMap(project.id, { id: 'map_matrix_web', stableKey: 'web.ai-assistant', name: 'AI 助手前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    const backend = repo.createMap(project.id, { id: 'map_matrix_backend', stableKey: 'backend.airoom-bots', name: 'Bot 后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' });
    const canonical = repo.createFeature(product.id, { id: 'feat_matrix_add_ai', stableKey: 'add-external-ai', name: '添加外部 AI', version: '1.0', status: 'draft' });
    const mockFeature = repo.createFeature(web.id, { id: 'feat_matrix_web_add_ai', stableKey: 'add-external-ai', name: '添加 AI Mock', version: '1.0', status: 'mock_only' });
    const backendFeature = repo.createFeature(backend.id, { id: 'feat_matrix_backend_create_bot', stableKey: 'bots.create', name: '创建 Bot', version: '1.0', status: 'released' });
    const prototypeEvidence = repo.upsertEvidence(project.id, {
      targetType: 'feature',
      targetId: canonical.id,
      evidenceType: 'planned',
      sourceType: 'product_prototype',
      sourcePriority: 40,
      path: 'prototype/ai-add-external.html',
      summary: '产品原型定义添加外部 AI 入口。'
    });
    const backendEvidence = repo.upsertEvidence(project.id, {
      targetType: 'feature',
      targetId: backendFeature.id,
      evidenceType: 'code_fact',
      sourceType: 'api_route',
      sourcePriority: 70,
      path: 'synapse/rest/client/airoom/bots.py',
      symbol: '/_synapse/client/airoom/bots',
      summary: '后端存在 Bot 创建 API。'
    });

    repo.upsertAlignment(project.id, {
      stableKey: 'align.add-ai.web-mock',
      name: '添加 AI 产品入口和前端 Mock',
      relation: 'mock_of',
      members: [
        { targetType: 'feature', targetId: canonical.id, role: 'source' },
        { targetType: 'feature', targetId: mockFeature.id, role: 'target' }
      ]
    });

    const productStatus = repo.upsertCapabilityStatus(project.id, {
      canonicalFeatureId: canonical.id,
      mapId: product.id,
      featureId: canonical.id,
      status: 'prototype',
      summary: '完整产品原型。',
      evidenceIds: [prototypeEvidence.data.id]
    });
    const webStatus = repo.upsertCapabilityStatus(project.id, {
      canonicalFeatureId: canonical.id,
      mapId: web.id,
      featureId: mockFeature.id,
      status: 'mock',
      summary: 'AI 助手页仍是 mock。',
      gaps: ['产品入口未接真实 API']
    });
    const backendStatus = repo.upsertCapabilityStatus(project.id, {
      canonicalFeatureId: canonical.id,
      mapId: backend.id,
      featureId: backendFeature.id,
      status: 'live',
      summary: 'Bot 创建 API 可用。',
      evidenceIds: [backendEvidence.data.id]
    });
    const gap = repo.upsertCapabilityGap(project.id, {
      stableKey: 'gap.add-ai.product-web-backend',
      canonicalFeatureId: canonical.id,
      mapId: web.id,
      featureId: mockFeature.id,
      gapType: 'mock_gap',
      severity: 'high',
      title: '产品添加 AI 入口未接后端 Bot API',
      description: 'web.ai-assistant 是 mock，backend.airoom-bots 已有真实 API。',
      evidenceIds: [prototypeEvidence.data.id, backendEvidence.data.id],
      recommendedAction: '用后端 bots API 替换 AI 助手页 mock，并参考设置页 Bot 管理流程。',
      ownerMapId: web.id
    });
    const matrix = repo.capabilityMatrix({ projectId: project.id, canonicalFeatureId: canonical.id });
    const programming = repo.programmingContext({ projectId: project.id, featureId: canonical.id, include: ['statusMatrix', 'gaps', 'evidence', 'alignments'] });
    const report = repo.qualityReport({ projectId: project.id });

    expect(productStatus.operation).toBe('created');
    expect(webStatus.data.status).toBe('mock');
    expect(backendStatus.data.status).toBe('live');
    expect(gap.data.gapType).toBe('mock_gap');
    expect(matrix.summary.statusCounts).toMatchObject({ prototype: 1, mock: 1, live: 1 });
    expect(matrix.summary.highSeverityGapCount).toBe(1);
    expect(matrix.evidence.map((item) => item.sourceType)).toEqual(expect.arrayContaining(['product_prototype', 'api_route']));
    expect(programming.capabilityMatrix?.statuses).toHaveLength(3);
    expect(programming.capabilityGaps[0]).toMatchObject({ severity: 'high', recommendedAction: '用后端 bots API 替换 AI 助手页 mock，并参考设置页 Bot 管理流程。' });
    expect(report.summary.openCapabilityGaps).toBe(1);
    expect(report.summary.highSeverityCapabilityGaps).toBe(1);
  });
});
