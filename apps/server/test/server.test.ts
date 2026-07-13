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

  it('支持以功能为第一入口搜索候选功能', async () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_feature_search', name: '功能搜索项目', currentVersion: '1.0', status: 'active' });
    const product = repo.createMap(project.id, { id: 'map_feature_search_product', stableKey: 'product.ai-assistant', name: 'AI 助手产品', version: '1.0', axis: 'product', scope: 'capability', kind: 'domain' });
    const web = repo.createMap(project.id, { id: 'map_feature_search_web', stableKey: 'web.ai-assistant', name: 'AI 助手前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    const productFeature = repo.createFeature(product.id, {
      id: 'feat_feature_search_add_ai',
      stableKey: 'add-external-ai',
      name: '添加外部 AI',
      version: '1.0',
      status: 'draft',
      description: '用户从产品入口添加外部 AI。',
      details: {
        intent: '把产品原型中的添加 AI 能力接到真实后端。',
        expectedBehavior: '用户填写外部 AI 信息后创建 Bot。'
      }
    });
    const webFeature = repo.createFeature(web.id, {
      id: 'feat_feature_search_mock_add_ai',
      stableKey: 'mock-add-external-ai',
      name: '添加 AI mock 页面',
      version: '1.0',
      status: 'mock_only',
      description: '前端 AI 助手页的 mock 添加入口。'
    });
    repo.createCodeReference(project.id, {
      id: 'ref_feature_search_ai_page',
      mapId: web.id,
      featureId: webFeature.id,
      stableKey: 'web.ai-assistant.add-page',
      path: 'src/features/ai/useAiAssistant.ts',
      symbol: 'useAiAssistant',
      kind: 'function',
      description: 'AI 助手 mock 状态和添加入口。'
    });
    const focus = repo.upsertFeatureFocus(project.id, {
      featureId: productFeature.id,
      title: '深挖添加外部 AI',
      priority: 'high',
      nextSteps: ['对齐 mock 页面和真实 Bot API']
    }).data;
    repo.upsertCapabilityGap(project.id, {
      canonicalFeatureId: productFeature.id,
      mapId: web.id,
      featureId: webFeature.id,
      gapType: 'mock_gap',
      severity: 'high',
      title: '添加 AI 产品入口仍是 mock',
      recommendedAction: '用真实 Bot API 替换 mock 数据。'
    });

    const byRequirement = repo.searchFeatures({ projectId: project.id, query: '添加外部 AI', limit: 5 });
    const byPath = repo.searchFeatures({ projectId: project.id, path: 'src/features/ai/useAiAssistant.ts', pathMode: 'exact', limit: 5 });
    const noMatch = repo.searchFeatures({ projectId: project.id, query: '全新的白板协作', limit: 5 });
    const prepared = repo.prepareFeatureWork({ projectId: project.id, query: '添加外部 AI' });
    const preparedFocus = repo.prepareFeatureWork({ projectId: project.id, focusId: focus.id });
    const preparedFocusByStableKey = repo.prepareFeatureWork({ projectId: project.id, focusStableKey: focus.stableKey });
    const preparedDirect = repo.prepareFeatureWork({ projectId: project.id, featureId: webFeature.id });
    const preparedMissing = repo.prepareFeatureWork({ projectId: project.id, query: '全新的白板协作' });

    expect(byRequirement.candidates[0].feature.id).toBe(productFeature.id);
    expect(byRequirement.candidates[0].reasons).toEqual(expect.arrayContaining(['功能名称精确匹配', '已有进行中的功能焦点', '存在开放缺口']));
    expect(byRequirement.candidates[0].openFocuses[0].title).toBe('深挖添加外部 AI');
    expect(byRequirement.candidates[0].openGaps[0].title).toBe('添加 AI 产品入口仍是 mock');
    expect(byRequirement.candidates[0].nextAction).toContain('继续焦点');
    expect(byPath.candidates[0].feature.id).toBe(webFeature.id);
    expect(byPath.candidates[0].matchingCodeReferences[0].path).toBe('src/features/ai/useAiAssistant.ts');
    expect(noMatch.candidates).toHaveLength(0);
    expect(noMatch.suggestedStart?.canonicalMapStableKey).toBe('product.ai-assistant');
    expect(prepared.readiness).toBe('ready');
    expect(prepared.selectedCandidate?.feature.id).toBe(productFeature.id);
    expect(prepared.dossier?.focus.feature.id).toBe(productFeature.id);
    expect(prepared.programmingContext?.feature.id).toBe(productFeature.id);
    expect(prepared.nextSteps).toEqual(expect.arrayContaining([expect.stringContaining('继续功能焦点'), expect.stringContaining('开放缺口')]));
    expect(prepared.recommendedToolCalls.map((call) => call.toolName)).toEqual(
      expect.arrayContaining(['functree_get_feature_dossier', 'functree_get_feature_readiness', 'functree_get_programming_context', 'functree_upsert_feature_focus'])
    );
    expect(prepared.recommendedToolCalls.find((call) => call.toolName === 'functree_get_feature_readiness')?.arguments).toEqual(
      expect.objectContaining({ projectId: project.id, featureId: productFeature.id, requiredAxes: ['product', 'web', 'backend'] })
    );
    expect(preparedFocus.selectedFocus?.id).toBe(focus.id);
    expect(preparedFocus.selectedCandidate?.feature.id).toBe(productFeature.id);
    expect(preparedFocus.dossier?.selectedFocus?.id).toBe(focus.id);
    expect(preparedFocus.programmingContext?.selectedFocus?.id).toBe(focus.id);
    expect(preparedFocus.nextSteps[0]).toContain('对齐 mock 页面和真实 Bot API');
    expect(preparedFocus.recommendedToolCalls.find((call) => call.toolName === 'functree_get_feature_readiness')?.arguments).toEqual(
      expect.objectContaining({ projectId: project.id, focusId: focus.id, requiredAxes: ['product', 'web', 'backend'] })
    );
    expect(preparedFocus.recommendedToolCalls.find((call) => call.toolName === 'functree_upsert_feature_focus')?.arguments).toEqual(
      expect.objectContaining({ id: focus.id, featureId: productFeature.id })
    );
    expect(preparedFocusByStableKey.selectedFocus?.id).toBe(focus.id);
    expect(preparedDirect.readiness).toBe('ready');
    expect(preparedDirect.selectedCandidate?.feature.id).toBe(webFeature.id);
    expect(preparedMissing.readiness).toBe('needs_start');
    expect(preparedMissing.dossier).toBeNull();
    expect(preparedMissing.suggestedStart?.canonicalFeatureStableKey).toBe('全新的白板协作');
    expect(preparedMissing.recommendedToolCalls[0]).toEqual(
      expect.objectContaining({
        toolName: 'functree_start_feature_focus',
        arguments: expect.objectContaining({
          projectId: project.id,
          canonicalFeature: expect.objectContaining({ stableKey: '全新的白板协作' })
        })
      })
    );

    const app = createHttpServer(openMemoryDatabase());
    await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'content-type': 'application/json' },
      body: { id: 'proj_feature_search_http', name: 'HTTP 功能搜索', currentVersion: '1.0', status: 'active' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/projects/proj_feature_search_http/maps',
      headers: { 'content-type': 'application/json' },
      body: { id: 'map_feature_search_http_product', stableKey: 'product.chat', name: '聊天产品', version: '1.0', axis: 'product', scope: 'capability', kind: 'domain' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/maps/map_feature_search_http_product/features',
      headers: { 'content-type': 'application/json' },
      body: { id: 'feat_feature_search_http_send', stableKey: 'message.send-text', name: '发送文本消息', version: '1.0', status: 'draft' }
    });
    const focusResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_upsert_feature_focus',
        arguments: {
          projectId: 'proj_feature_search_http',
          featureId: 'feat_feature_search_http_send',
          title: '深挖发送文本消息',
          nextSteps: ['确认发送入口和后端 API']
        }
      }
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_search_features',
        arguments: { projectId: 'proj_feature_search_http', query: '发送文本', limit: 5 }
      }
    });
    const prepareResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_prepare_feature_work',
        arguments: { projectId: 'proj_feature_search_http', query: '发送文本', limit: 5 }
      }
    });
    const prepareFocusResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_prepare_feature_work',
        arguments: { projectId: 'proj_feature_search_http', focusId: focusResponse.json().data.id }
      }
    });
    const focusListResponse = await app.inject({
      method: 'GET',
      url: '/api/projects/proj_feature_search_http/feature-focuses?limit=1'
    });
    const prepareHttpResponse = await app.inject({
      method: 'POST',
      url: '/api/projects/proj_feature_search_http/feature-work/prepare',
      headers: { 'content-type': 'application/json' },
      body: { query: '发送文本', limit: 5 }
    });

    expect(response.statusCode).toBe(200);
    expect(focusResponse.statusCode).toBe(200);
    expect(response.json().candidates[0].feature.stableKey).toBe('message.send-text');
    expect(prepareResponse.statusCode).toBe(200);
    expect(prepareResponse.json().readiness).toBe('ready');
    expect(prepareResponse.json().dossier.focus.feature.stableKey).toBe('message.send-text');
    expect(prepareResponse.json().recommendedToolCalls.map((call: { toolName: string }) => call.toolName)).toEqual(
      expect.arrayContaining(['functree_get_feature_dossier', 'functree_get_feature_readiness'])
    );
    expect(prepareFocusResponse.statusCode).toBe(200);
    expect(prepareFocusResponse.json().selectedFocus.id).toBe(focusResponse.json().data.id);
    expect(prepareFocusResponse.json().nextSteps[0]).toContain('确认发送入口和后端 API');
    expect(prepareFocusResponse.json().recommendedToolCalls.find((call: { toolName: string }) => call.toolName === 'functree_get_feature_readiness').arguments.focusId).toBe(focusResponse.json().data.id);
    expect(prepareFocusResponse.json().recommendedToolCalls.find((call: { toolName: string }) => call.toolName === 'functree_upsert_feature_focus').arguments.id).toBe(focusResponse.json().data.id);
    expect(focusListResponse.statusCode).toBe(200);
    expect(focusListResponse.json()[0].id).toBe(focusResponse.json().data.id);
    expect(prepareHttpResponse.statusCode).toBe(200);
    expect(prepareHttpResponse.json().programmingContext.feature.stableKey).toBe('message.send-text');
    expect(prepareHttpResponse.json().recommendedToolCalls[0].toolName).toBe('functree_get_feature_dossier');
    expect(prepareHttpResponse.json().recommendedToolCalls[1].toolName).toBe('functree_get_feature_readiness');
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
    const map = repo.createMap(project.id, { id: 'map_scan_web', stableKey: 'web.scan', name: '扫描前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    const feature = repo.createFeature(map.id, { id: 'feat_scan_bootstrap', stableKey: 'bootstrap', name: '启动流程', version: '1.0', status: 'in_progress' });
    const focus = repo.upsertFeatureFocus(project.id, {
      featureId: feature.id,
      title: '确认启动扫描入口',
      status: 'in_progress',
      nextSteps: ['核对入口文件和引用']
    }).data;
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
    expect(summary.featureFocusCount).toBe(1);
    expect(summary.openFeatureFocusCount).toBe(1);
    expect(summary.latestFeatureFocus?.id).toBe(focus.id);
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
    repo.upsertCapabilityStatus(project.id, {
      canonicalFeatureId: productFeature.id,
      mapId: product.id,
      featureId: productFeature.id,
      status: 'approved',
      summary: '产品侧已确认发送文本消息能力。'
    });
    repo.upsertCapabilityStatus(project.id, {
      canonicalFeatureId: productFeature.id,
      mapId: backend.id,
      featureId: backendFeature.id,
      status: 'live',
      summary: '后端已有发送文本消息 API。'
    });
    const focus = repo.upsertFeatureFocus(project.id, {
      featureId: backendFeature.id,
      title: '实现发送文本消息',
      status: 'in_progress',
      priority: 'high',
      sourceType: 'user_request',
      question: '改发送消息能力前应该先读哪里？',
      seedPaths: ['src/messages.ts'],
      nextSteps: ['确认发送消息验收项']
    }).data;
    const query = repo.queryContext({ projectId: project.id, types: ['feature', 'evidence'], includeDetails: true, stableKey: 'message.send-text', mapStableKey: 'backend.chat' });
    const programming = repo.programmingContext({ projectId: project.id, featureStableKey: 'message.send-text', mapStableKey: 'backend.chat', featureVersion: '1.0', depth: 1 });
    const report = repo.qualityReport({ projectId: project.id });
    const focusReport = repo.qualityReport({ projectId: project.id, focusStableKey: focus.stableKey });
    const readiness = repo.featureReadiness({ projectId: project.id, focusStableKey: focus.stableKey, requiredAxes: ['product', 'backend'] });
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
    expect(programming.focuses[0].title).toBe('实现发送文本消息');
    expect(programming.seedPathContexts[0]).toMatchObject({
      path: 'src/messages.ts',
      entryPoints: [expect.objectContaining({ id: entryPoint.id })],
      codeReferences: [expect.objectContaining({ id: reference.id })],
      alignments: [expect.objectContaining({ id: alignment.data.id })]
    });
    expect(programming.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'seed_path', priority: 'high', title: '读取 src/messages.ts' }),
        expect.objectContaining({ source: 'focus', priority: 'high', title: '确认发送消息验收项' }),
        expect.objectContaining({ source: 'verification', targetId: backendFeature.id })
      ])
    );
    expect(programming.evidence[0].evidenceType).toBe('code_fact');
    expect(programming.qualityIssues.some((issue) => issue.code === 'IN_PROGRESS_DETAIL_GAP')).toBe(false);
    expect(report.summary.featuresWithoutCodeReferences).toBe(1);
    expect(report.summary.featuresWithoutCodeEvidence).toBe(1);
    expect(focusReport.summary.featuresWithoutCodeReferences).toBe(0);
    expect(focusReport.summary.featuresWithoutCodeEvidence).toBe(0);
    expect(focusReport.issues.every((issue) => issue.targetId === backendFeature.id)).toBe(true);
    expect(readiness.readiness).toBe('ready');
    expect(readiness.score).toBe(100);
    expect(readiness.axisCoverage.map((item) => item.axis)).toEqual(['product', 'backend']);
    expect(readiness.checks.every((check) => check.status === 'pass')).toBe(true);
    expect(readiness.recommendedToolCalls.map((call) => call.toolName)).toEqual(
      expect.arrayContaining(['functree_get_feature_dossier', 'functree_get_programming_context', 'functree_upsert_feature_dossier', 'functree_upsert_feature_focus'])
    );
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
    const webEntry = repo.createEntryPoint(project.id, {
      id: 'ep_matrix_ai_page',
      mapId: web.id,
      stableKey: 'web.ai-assistant.page',
      name: 'AI 助手页',
      path: 'src/pages/AiAssistant.tsx',
      kind: 'app_root'
    });
    const webReference = repo.createCodeReference(project.id, {
      id: 'ref_matrix_ai_mock',
      mapId: web.id,
      featureId: mockFeature.id,
      entryPointId: webEntry.id,
      path: 'src/hooks/useAiAssistant.ts',
      symbol: 'useAiAssistant',
      kind: 'function',
      roleInFeature: 'adapter',
      changeGuidance: '替换 mock 数据源时保留页面状态契约。',
      verificationHint: '打开 AI 助手页并验证真实 Bot 列表。'
    });
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
    const dossier = repo.featureDossier({ projectId: project.id, featureId: mockFeature.id });
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
    expect(dossier.focus.feature.id).toBe(mockFeature.id);
    expect(dossier.canonicalFeature.id).toBe(canonical.id);
    expect(dossier.summary.isCanonical).toBe(false);
    expect(dossier.implementationSlices).toHaveLength(3);
    expect(dossier.gaps[0].id).toBe(gap.data.id);
    expect(dossier.codeReferences[0].id).toBe(webReference.id);
    expect(dossier.entryPoints[0].id).toBe(webEntry.id);
    expect(report.summary.openCapabilityGaps).toBe(1);
    expect(report.summary.highSeverityCapabilityGaps).toBe(1);
  });

  it('支持功能档案聚合写入和 dry-run 回滚', () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_dossier_write', name: '功能档案写入项目', currentVersion: '1.0', status: 'active' });
    const input = {
      projectId: project.id,
      canonicalMap: {
        stableKey: 'product.ai-assistant',
        name: 'AI 助手产品'
      },
      canonicalFeature: {
        stableKey: 'add-external-ai',
        name: '添加外部 AI',
        status: 'draft' as const,
        details: {
          intent: '让用户从产品入口添加外部 AI。',
          expectedBehavior: '提交后创建真实 Bot，并在 AI 助手列表可见。',
          acceptanceCriteria: ['能调用真实后端 API', '失败时显示错误态']
        }
      },
      canonicalEvidence: [
        {
          target: 'canonical_feature' as const,
          evidenceType: 'planned' as const,
          sourceType: 'product_prototype' as const,
          sourcePriority: 40,
          path: 'prototype/ai-add-external.html',
          summary: '产品原型定义添加外部 AI。'
        }
      ],
      implementationSlices: [
        {
          map: {
            stableKey: 'web.ai-assistant',
            name: 'AI 助手前端',
            axis: 'web' as const,
            kind: 'app' as const
          },
          feature: {
            stableKey: 'add-external-ai',
            name: '添加 AI Mock',
            status: 'mock_only' as const
          },
          status: 'mock' as const,
          summary: '前端仍使用 mock 数据。',
          gaps: ['尚未接后端 Bot API'],
          evidence: [
            {
              evidenceType: 'mock_only' as const,
              sourceType: 'runtime_code' as const,
              path: 'src/hooks/useAiAssistant.ts',
              symbol: 'useAiAssistant',
              summary: '当前 hook 返回 mock AI 列表。'
            }
          ],
          entryPoints: [
            {
              stableKey: 'web.ai-assistant.page',
              name: 'AI 助手页',
              path: 'src/pages/AiAssistant.tsx',
              kind: 'app_root' as const
            }
          ],
          codeReferences: [
            {
              entryPointStableKey: 'web.ai-assistant.page',
              path: 'src/hooks/useAiAssistant.ts',
              symbol: 'useAiAssistant',
              kind: 'function' as const,
              roleInFeature: 'adapter' as const,
              changeGuidance: '替换 mock 数据源时保留页面状态契约。',
              verificationHint: '打开 AI 助手页并验证真实 Bot 列表。'
            }
          ],
          alignmentRelation: 'mock_of' as const
        }
      ],
      gaps: [
        {
          stableKey: 'gap.add-ai.web-mock',
          mapStableKey: 'web.ai-assistant',
          featureStableKey: 'add-external-ai',
          title: '添加 AI 前端入口未接真实后端',
          gapType: 'mock_gap' as const,
          severity: 'high' as const,
          description: '产品目标是创建真实 Bot，但前端仍是 mock。',
          recommendedAction: '接入 Bot 创建 API。',
          evidence: [
            {
              evidenceType: 'mock_only' as const,
              sourceType: 'runtime_code' as const,
              path: 'src/hooks/useAiAssistant.ts',
              symbol: 'useAiAssistant',
              summary: '缺口来自前端 hook 仍返回 mock 数据。'
            }
          ]
        }
      ]
    };

    const preview = repo.upsertFeatureDossier({ ...input, dryRun: true });
    expect(preview.dryRun).toBe(true);
    expect(preview.rolledBack).toBe(true);
    expect(preview.operations.features[0].operation).toBe('dry_run');
    expect(repo.listMaps(project.id)).toHaveLength(0);

    const committed = repo.upsertFeatureDossier(input);
    const webFeature = repo.resolveStableKeys({
      projectId: project.id,
      items: [{ type: 'feature', stableKey: 'add-external-ai', mapStableKey: 'web.ai-assistant' }]
    }).results[0];
    const dossier = repo.featureDossier({ projectId: project.id, featureId: webFeature.id ?? '' });

    expect(committed.dryRun).toBe(false);
    expect(committed.operations.maps).toHaveLength(2);
    expect(committed.operations.statuses[0].data.status).toBe('mock');
    expect(committed.operations.gaps[0].data.severity).toBe('high');
    expect(committed.operations.gaps.at(-1)?.data.evidenceIds).toHaveLength(1);
    expect(committed.operations.evidence.some((item) => item.data.targetType === 'capability_gap')).toBe(true);
    expect(dossier.summary.isCanonical).toBe(false);
    expect(dossier.canonicalFeature.stableKey).toBe('add-external-ai');
    expect(dossier.codeReferences[0].symbol).toBe('useAiAssistant');
    expect(dossier.gaps[0].stableKey).toBe('gap.add-ai.web-mock');
    expect(dossier.evidence.some((item) => item.targetType === 'capability_gap')).toBe(true);
  });

  it('支持以单个功能为中心记录和查询功能焦点', async () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_focus', name: '功能焦点项目', currentVersion: '1.0', status: 'active' });
    const product = repo.createMap(project.id, { id: 'map_focus_product', stableKey: 'product.chat', name: '聊天产品', version: '1.0', axis: 'product', scope: 'capability', kind: 'domain' });
    const web = repo.createMap(project.id, { id: 'map_focus_web', stableKey: 'web.chat-ui', name: '聊天前端', version: '1.0', axis: 'web', scope: 'implementation', kind: 'app' });
    const backend = repo.createMap(project.id, { id: 'map_focus_backend', stableKey: 'backend.chat-core', name: '聊天后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' });
    const send = repo.createFeature(product.id, { id: 'feat_focus_send', stableKey: 'message.send-text', name: '发送文本消息', version: '1.0', status: 'draft' });
    const composer = repo.createFeature(web.id, { id: 'feat_focus_composer', stableKey: 'composer.send', name: '发送输入框', version: '1.0', status: 'in_progress' });

    const preview = repo.upsertFeatureFocus(project.id, {
      featureStableKey: send.stableKey,
      mapStableKey: product.stableKey,
      title: '深挖发送文本消息',
      mode: 'analyze',
      sourceType: 'product_doc',
      seedPaths: ['docs/chat.md'],
      targetMaps: [{ mapStableKey: web.stableKey }, { mapStableKey: backend.stableKey }],
      relatedFeatures: [{ featureStableKey: composer.stableKey, mapStableKey: web.stableKey }],
      nextSteps: ['确认 Composer 到后端 API 的链路'],
      dryRun: true
    });
    expect(preview.operation).toBe('dry_run');
    expect(repo.listFeatureFocuses({ projectId: project.id, featureId: send.id })).toHaveLength(0);

    const created = repo.upsertFeatureFocus(project.id, {
      featureStableKey: send.stableKey,
      mapStableKey: product.stableKey,
      title: '深挖发送文本消息',
      mode: 'analyze',
      sourceType: 'product_doc',
      question: '这个功能从产品到前后端到底该读哪里？',
      scope: '只分析文本消息，不包含媒体消息。',
      seedPaths: ['docs/chat.md'],
      targetMaps: [{ mapStableKey: web.stableKey }, { mapStableKey: backend.stableKey }],
      relatedFeatures: [{ featureStableKey: composer.stableKey, mapStableKey: web.stableKey }],
      nextSteps: ['确认 Composer 到后端 API 的链路'],
      findings: '产品功能已确定，前端和后端待补证据。',
      confidence: 0.7
    });
    const updated = repo.upsertFeatureFocus(project.id, {
      stableKey: created.data.stableKey,
      featureId: send.id,
      title: '深挖发送文本消息',
      mode: 'analyze',
      status: 'in_progress',
      priority: 'high',
      sourceType: 'product_doc',
      seedPaths: ['docs/chat.md', 'src/Composer.tsx'],
      targetMaps: [{ mapStableKey: web.stableKey }, { mapStableKey: backend.stableKey }],
      relatedFeatures: [{ featureId: composer.id }],
      nextSteps: ['补齐后端 API 证据']
    });
    const focuses = repo.listFeatureFocuses({ projectId: project.id, featureStableKey: send.stableKey, mapStableKey: product.stableKey });
    const dossier = repo.featureDossier({ projectId: project.id, featureId: send.id });
    const dossierByFocus = repo.featureDossier({ projectId: project.id, focusStableKey: created.data.stableKey });
    const programmingByFocus = repo.programmingContext({ projectId: project.id, focusId: created.data.id });
    const focusContext = repo.queryContext({ projectId: project.id, types: ['feature_focus'], keyword: '发送文本', view: 'lite', limit: 5 });
    const focusedByWorkflow = repo.listFeatureFocuses({
      projectId: project.id,
      focusStableKey: created.data.stableKey,
      keyword: '发送文本',
      mode: 'analyze',
      priority: 'high',
      sourceType: 'product_doc',
      mapStableKey: product.stableKey
    });
    const resolvedFocus = repo.resolveStableKeys({
      projectId: project.id,
      items: [
        { type: 'feature_focus', stableKey: created.data.stableKey },
        { type: 'feature_focus', id: created.data.id }
      ]
    });

    expect(created.operation).toBe('created');
    expect(created.data.targetMaps?.map((map) => map.stableKey)).toEqual(['web.chat-ui', 'backend.chat-core']);
    expect(created.data.relatedFeatures?.[0].id).toBe(composer.id);
    expect(updated.operation).toBe('updated');
    expect(updated.data.status).toBe('in_progress');
    expect(updated.changedFields).toEqual(expect.arrayContaining(['status', 'priority', 'seedPaths']));
    expect(focuses).toHaveLength(1);
    expect(focuses[0].feature?.id).toBe(send.id);
    expect(dossier.focuses[0].id).toBe(created.data.id);
    expect(dossier.summary.openFocusCount).toBe(1);
    expect(dossierByFocus.focus.feature.id).toBe(send.id);
    expect(dossierByFocus.selectedFocus?.id).toBe(created.data.id);
    expect(programmingByFocus.feature.id).toBe(send.id);
    expect(programmingByFocus.selectedFocus?.id).toBe(created.data.id);
    expect(programmingByFocus.focuses[0].id).toBe(created.data.id);
    expect(focusContext.page.totals.feature_focus).toBe(1);
    expect(focusContext.featureFocuses[0]).toEqual(
      expect.objectContaining({
        id: created.data.id,
        stableKey: created.data.stableKey,
        name: '深挖发送文本消息',
        type: 'feature_focus',
        projectId: project.id
      })
    );
    expect(focusedByWorkflow).toHaveLength(1);
    expect(focusedByWorkflow[0].id).toBe(created.data.id);
    expect(resolvedFocus.results).toEqual([
      expect.objectContaining({ type: 'feature_focus', found: true, id: created.data.id }),
      expect.objectContaining({ type: 'feature_focus', found: true, id: created.data.id })
    ]);

    const app = createHttpServer(openMemoryDatabase());
    await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'content-type': 'application/json' },
      body: { id: 'proj_focus_http', name: 'HTTP 功能焦点', currentVersion: '1.0', status: 'active' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/projects/proj_focus_http/maps',
      headers: { 'content-type': 'application/json' },
      body: { id: 'map_focus_http_product', stableKey: 'product.chat', name: '聊天产品', version: '1.0', axis: 'product', scope: 'capability', kind: 'domain' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/maps/map_focus_http_product/features',
      headers: { 'content-type': 'application/json' },
      body: { id: 'feat_focus_http_send', stableKey: 'message.send-text', name: '发送文本消息', version: '1.0', status: 'draft' }
    });
    const mcpResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_upsert_feature_focus',
        arguments: {
          projectId: 'proj_focus_http',
          featureStableKey: 'message.send-text',
          mapStableKey: 'product.chat',
          title: '从产品文档深挖发送消息',
          seedPaths: ['docs/product/chat.md']
        }
      }
    });
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/projects/proj_focus_http/feature-focuses?featureId=feat_focus_http_send'
    });
    const contextResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_query_context',
        arguments: { projectId: 'proj_focus_http', types: ['feature_focus'], view: 'lite', limit: 5 }
      }
    });
    const resolveResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_resolve_stable_keys',
        arguments: {
          projectId: 'proj_focus_http',
          items: [{ type: 'feature_focus', stableKey: mcpResponse.json().data.stableKey }]
        }
      }
    });
    const dossierResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_get_feature_dossier',
        arguments: { projectId: 'proj_focus_http', focusStableKey: mcpResponse.json().data.stableKey }
      }
    });
    const programmingResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_get_programming_context',
        arguments: { projectId: 'proj_focus_http', focusId: mcpResponse.json().data.id }
      }
    });
    const focusQueryResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_query_feature_focuses',
        arguments: {
          projectId: 'proj_focus_http',
          focusStableKey: mcpResponse.json().data.stableKey,
          keyword: '产品文档',
          mode: 'analyze',
          priority: 'medium',
          sourceType: 'user_request',
          mapStableKey: 'product.chat',
          limit: 5
        }
      }
    });
    const qualityResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_quality_report',
        arguments: {
          projectId: 'proj_focus_http',
          focusStableKey: mcpResponse.json().data.stableKey
        }
      }
    });
    const readinessResponse = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_get_feature_readiness',
        arguments: {
          projectId: 'proj_focus_http',
          focusStableKey: mcpResponse.json().data.stableKey,
          requiredAxes: ['product', 'backend']
        }
      }
    });

    expect(mcpResponse.statusCode).toBe(200);
    expect(mcpResponse.json().operation).toBe('created');
    expect(listResponse.json()[0].title).toBe('从产品文档深挖发送消息');
    expect(contextResponse.statusCode).toBe(200);
    expect(contextResponse.json().featureFocuses[0]).toEqual(
      expect.objectContaining({
        stableKey: mcpResponse.json().data.stableKey,
        name: '从产品文档深挖发送消息',
        type: 'feature_focus'
      })
    );
    expect(resolveResponse.statusCode).toBe(200);
    expect(resolveResponse.json().results[0]).toEqual(expect.objectContaining({ type: 'feature_focus', found: true, id: mcpResponse.json().data.id }));
    expect(focusQueryResponse.statusCode).toBe(200);
    expect(focusQueryResponse.json()[0]).toEqual(expect.objectContaining({ id: mcpResponse.json().data.id, title: '从产品文档深挖发送消息' }));
    expect(qualityResponse.statusCode).toBe(200);
    expect(qualityResponse.json().issues.every((issue: { targetId: string }) => issue.targetId === 'feat_focus_http_send')).toBe(true);
    expect(readinessResponse.statusCode).toBe(200);
    expect(readinessResponse.json()).toEqual(
      expect.objectContaining({
        readiness: 'needs_evidence',
        missingAxes: expect.arrayContaining(['backend'])
      })
    );
    expect(readinessResponse.json().checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'code.references', status: 'fail' }),
        expect.objectContaining({ id: 'evidence.code_fact', status: 'fail' })
      ])
    );
    expect(dossierResponse.statusCode).toBe(200);
    expect(dossierResponse.json().focus.feature.id).toBe('feat_focus_http_send');
    expect(dossierResponse.json().selectedFocus.id).toBe(mcpResponse.json().data.id);
    expect(programmingResponse.statusCode).toBe(200);
    expect(programmingResponse.json().feature.id).toBe('feat_focus_http_send');
    expect(programmingResponse.json().selectedFocus.id).toBe(mcpResponse.json().data.id);
  });

  it('支持从产品需求直接启动一个尚不存在的功能焦点', async () => {
    const repo = new FuncTreeRepository(openMemoryDatabase());
    const project = repo.createProject({ id: 'proj_focus_start', name: '焦点启动项目', currentVersion: '1.0', status: 'active' });

    const preview = repo.startFeatureFocus({
      projectId: project.id,
      canonicalMap: {
        stableKey: 'product.ai-assistant',
        name: 'AI 助手产品'
      },
      canonicalFeature: {
        stableKey: 'add-external-ai',
        name: '添加外部 AI',
        status: 'draft',
        details: {
          intent: '让用户从产品入口添加外部 AI。',
          scope: '只启动功能焦点，后续再补前后端证据。'
        }
      },
      focus: {
        sourceType: 'product_doc',
        question: '产品入口、前端 mock 和后端 Bot API 如何对齐？',
        seedPaths: ['docs/ai-assistant.md'],
        nextSteps: ['读取产品原型', '定位真实 Bot API']
      },
      dryRun: true
    });
    expect(preview.dryRun).toBe(true);
    expect(preview.rolledBack).toBe(true);
    expect(preview.map.operation).toBe('dry_run');
    expect(repo.listMaps(project.id)).toHaveLength(0);

    const started = repo.startFeatureFocus({
      projectId: project.id,
      canonicalMap: {
        stableKey: 'product.ai-assistant',
        name: 'AI 助手产品'
      },
      canonicalFeature: {
        stableKey: 'add-external-ai',
        name: '添加外部 AI',
        status: 'draft',
        details: {
          intent: '让用户从产品入口添加外部 AI。',
          scope: '只启动功能焦点，后续再补前后端证据。'
        }
      },
      focus: {
        sourceType: 'product_doc',
        question: '产品入口、前端 mock 和后端 Bot API 如何对齐？',
        seedPaths: ['docs/ai-assistant.md'],
        nextSteps: ['读取产品原型', '定位真实 Bot API']
      }
    });
    const repeated = repo.startFeatureFocus({
      projectId: project.id,
      canonicalMap: {
        stableKey: 'product.ai-assistant',
        name: 'AI 助手产品'
      },
      canonicalFeature: {
        stableKey: 'add-external-ai',
        name: '添加外部 AI',
        status: 'draft'
      },
      focus: {
        title: started.focus.data.title,
        status: 'in_progress',
        sourceType: 'product_doc'
      }
    });
    const focuses = repo.listFeatureFocuses({ projectId: project.id, featureId: started.feature.data.id });
    const dossier = repo.featureDossier({ projectId: project.id, featureId: started.feature.data.id });

    expect(started.map.operation).toBe('created');
    expect(started.feature.operation).toBe('created');
    expect(started.focus.operation).toBe('created');
    expect(started.focus.data.title).toBe('深挖 添加外部 AI');
    expect(started.dossier.focuses[0].id).toBe(started.focus.data.id);
    expect(repeated.map.operation).toBe('unchanged');
    expect(repeated.feature.operation).toBe('unchanged');
    expect(repeated.focus.operation).toBe('updated');
    expect(focuses).toHaveLength(1);
    expect(dossier.canonicalFeature.stableKey).toBe('add-external-ai');

    const app = createHttpServer(openMemoryDatabase());
    await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'content-type': 'application/json' },
      body: { id: 'proj_focus_start_http', name: 'HTTP 焦点启动', currentVersion: '1.0', status: 'active' }
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/mcp/call',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'functree_start_feature_focus',
        arguments: {
          projectId: 'proj_focus_start_http',
          canonicalMap: { stableKey: 'product.chat', name: '聊天产品' },
          canonicalFeature: { stableKey: 'message.send-text', name: '发送文本消息' },
          focus: { question: '从产品文档启动发送文本消息分析。' }
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().feature.data.stableKey).toBe('message.send-text');
    expect(response.json().focus.data.question).toBe('从产品文档启动发送文本消息分析。');
  });
});
