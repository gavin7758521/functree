import { describe, expect, it } from 'vitest';
import { BatchFeatureSetSchema, CreateAlignmentSchema, CreateFeatureSchema, CreateFeatureSetSchema, QueryContextSchema, labels } from '../src/index.js';

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

  it('允许跨层级对齐成员', () => {
    const alignment = CreateAlignmentSchema.parse({
      name: '登录链路对齐',
      members: [
        { targetType: 'feature_set', targetId: 'fs_frontend' },
        { targetType: 'feature', targetId: 'feat_api' }
      ]
    });

    expect(alignment.members).toHaveLength(2);
  });

  it('支持较大的上下文查询数量', () => {
    const query = QueryContextSchema.parse({ limit: 100 });

    expect(query.limit).toBe(100);
  });

  it('支持上下文过滤、功能集 stableKey 和批量 dry-run schema', () => {
    const query = QueryContextSchema.parse({
      types: ['feature'],
      featureSetId: 'fs_backend',
      stableKey: 'backend.bots',
      cursor: '20'
    });
    const featureSet = CreateFeatureSetSchema.parse({
      stableKey: 'backend.bots',
      name: '机器人后端',
      version: '1.0',
      type: 'backend',
      dryRun: true
    });
    const batch = BatchFeatureSetSchema.parse({
      projectId: 'proj_backend',
      dryRun: true,
      items: [{ stableKey: 'backend.bots', name: '机器人后端', version: '1.0', type: 'backend' }]
    });

    expect(query.types).toEqual(['feature']);
    expect(featureSet.stableKey).toBe('backend.bots');
    expect(featureSet.dryRun).toBe(true);
    expect(batch.items).toHaveLength(1);
  });
});
