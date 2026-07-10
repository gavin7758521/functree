import { describe, expect, it } from 'vitest';
import { BatchMapSchema, CreateAlignmentSchema, CreateFeatureSchema, CreateMapSchema, QueryContextSchema, labels } from '../src/index.js';

describe('领域模型', () => {
  it('支持功能版本和中文状态标签', () => {
    const feature = CreateFeatureSchema.parse({
      stableKey: 'login',
      name: '登录',
      version: 'App 2.1',
      status: 'in_progress'
    });

    expect(feature.version).toBe('App 2.1');
    expect(labels.featureStatus[feature.status]).toBe('进行中');
  });

  it('用 Map 一等字段区分产品、前端、后端等视角', () => {
    const map = CreateMapSchema.parse({
      stableKey: 'backend.matrix-chat-core',
      name: 'Matrix 聊天后端核心',
      axis: 'backend',
      scope: 'implementation',
      kind: 'service',
      tags: ['matrix', 'chat']
    });

    expect(map.axis).toBe('backend');
    expect(map.scope).toBe('implementation');
    expect(labels.mapAxis[map.axis]).toBe('后端');
  });

  it('允许跨层级对齐成员', () => {
    const alignment = CreateAlignmentSchema.parse({
      name: '登录链路对齐',
      members: [
        { targetType: 'map', targetId: 'map_frontend' },
        { targetType: 'feature', targetId: 'feat_api' },
        { targetType: 'entry_point', targetId: 'ep_router' }
      ]
    });

    expect(alignment.members).toHaveLength(3);
  });

  it('支持较大的上下文查询数量', () => {
    const query = QueryContextSchema.parse({ limit: 100 });

    expect(query.limit).toBe(100);
  });

  it('支持上下文过滤、Map stableKey 和批量 dry-run schema', () => {
    const query = QueryContextSchema.parse({
      types: ['feature'],
      mapId: 'map_backend',
      stableKey: 'backend.bots',
      entryPointId: 'ep_backend',
      cursor: '20'
    });
    const map = CreateMapSchema.parse({
      stableKey: 'backend.bots',
      name: '机器人后端',
      version: '1.0',
      axis: 'backend',
      scope: 'implementation',
      kind: 'service',
      dryRun: true
    });
    const batch = BatchMapSchema.parse({
      projectId: 'proj_backend',
      dryRun: true,
      items: [{ stableKey: 'backend.bots', name: '机器人后端', version: '1.0', axis: 'backend', scope: 'implementation', kind: 'service' }]
    });

    expect(query.types).toEqual(['feature']);
    expect(map.stableKey).toBe('backend.bots');
    expect(map.dryRun).toBe(true);
    expect(batch.items).toHaveLength(1);
  });
});
