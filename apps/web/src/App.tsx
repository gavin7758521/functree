import {
  Boxes,
  Braces,
  ChevronDown,
  ChevronRight,
  GitMerge,
  Layers3,
  Network,
  Plus,
  RefreshCw,
  Search,
  Server
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Alignment, Catalog, Feature, FeatureSet, Overview, Project, ProjectTree } from './types.js';

type View = 'overview' | 'sets' | 'features' | 'alignments' | 'mcp';

const views: Array<{ id: View; label: string; icon: typeof Layers3 }> = [
  { id: 'overview', label: '项目总览', icon: Layers3 },
  { id: 'sets', label: '功能集', icon: Boxes },
  { id: 'features', label: '功能树', icon: Network },
  { id: 'alignments', label: '对齐关系', icon: GitMerge },
  { id: 'mcp', label: 'MCP 工具', icon: Braces }
];

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tree, setTree] = useState<ProjectTree | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFeatureSetId, setSelectedFeatureSetId] = useState('');
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [selectedAlignmentId, setSelectedAlignmentId] = useState('');
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<Set<string>>(() => new Set());
  const [view, setView] = useState<View>('overview');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');

  async function refresh(projectId = selectedProjectId) {
    setMessage('');
    const [catalogData, overviewData] = await Promise.all([fetchJson<Catalog>('/api/catalog'), fetchJson<Overview>('/api/overview')]);
    setCatalog(catalogData);
    setOverview(overviewData);
    const targetProjectId = projectId || overviewData.projects[0]?.id || '';
    setSelectedProjectId(targetProjectId);
    if (targetProjectId) {
      setTree(await fetchJson<ProjectTree>(`/api/projects/${targetProjectId}/tree`));
    } else {
      setTree(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const allFeatures = useMemo(() => tree?.featureSets.flatMap((set) => flattenFeatures(set.features ?? [])) ?? [], [tree]);
  const filteredFeatures = useMemo(() => {
    if (!keyword.trim()) return allFeatures;
    const value = keyword.trim().toLowerCase();
    return allFeatures.filter((feature) => `${feature.name} ${feature.stableKey} ${feature.description}`.toLowerCase().includes(value));
  }, [allFeatures, keyword]);

  useEffect(() => {
    if (!tree) {
      setSelectedFeatureSetId('');
      setSelectedFeatureId('');
      setSelectedAlignmentId('');
      return;
    }

    if (!tree.featureSets.some((set) => set.id === selectedFeatureSetId)) {
      setSelectedFeatureSetId(tree.featureSets[0]?.id ?? '');
    }
    if (!allFeatures.some((feature) => feature.id === selectedFeatureId)) {
      setSelectedFeatureId(allFeatures[0]?.id ?? '');
    }
    if (!tree.alignments.some((alignment) => alignment.id === selectedAlignmentId)) {
      setSelectedAlignmentId(tree.alignments[0]?.id ?? '');
    }
  }, [allFeatures, selectedAlignmentId, selectedFeatureId, selectedFeatureSetId, tree]);

  const labels = catalog?.labels;

  return (
    <main className="layout">
      <aside className="sidebar">
        <div className="brand">
          <strong>FuncTree</strong>
          <span>功能知识库</span>
        </div>
        <ProjectCreator
          onCreated={async (project) => {
            setSelectedProjectId(project.id);
            await refresh(project.id);
          }}
        />
        <nav className="projectList" aria-label="项目">
          {(overview?.projects ?? []).map((project) => (
            <button
              key={project.id}
              type="button"
              className={project.id === selectedProjectId ? 'project active' : 'project'}
              onClick={() => void refresh(project.id)}
            >
              <span>{project.name}</span>
              <small>{project.currentVersion}</small>
            </button>
          ))}
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <h1>{tree?.project.name ?? '项目工作台'}</h1>
            <p>{tree?.project.description || '项目、功能集、功能和对齐关系统一管理。'}</p>
          </div>
          <button className="iconButton" type="button" onClick={() => void refresh()} aria-label="刷新">
            <RefreshCw size={18} />
          </button>
        </header>

        <nav className="tabs" aria-label="页面">
          {views.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" className={view === item.id ? 'tab active' : 'tab'} onClick={() => setView(item.id)}>
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {message ? <div className="message">{message}</div> : null}

        {!tree && view !== 'mcp' ? (
          <EmptyState title="还没有项目" action={<ProjectCreator onCreated={(project) => refresh(project.id)} compact />} />
        ) : null}

        {tree && view === 'overview' && <OverviewView overview={overview} tree={tree} labels={labels} onSelectView={setView} />}
        {tree && view === 'sets' && (
          <FeatureSetView
            tree={tree}
            labels={labels}
            selectedFeatureSetId={selectedFeatureSetId}
            onSelect={setSelectedFeatureSetId}
            onCreated={async () => {
              setMessage('功能集已保存');
              await refresh(selectedProjectId);
            }}
          />
        )}
        {tree && view === 'features' && (
          <FeatureTreeView
            tree={tree}
            labels={labels}
            keyword={keyword}
            setKeyword={setKeyword}
            filteredFeatures={filteredFeatures}
            selectedFeatureId={selectedFeatureId}
            expandedFeatureIds={expandedFeatureIds}
            onSelect={setSelectedFeatureId}
            onToggle={(featureId) => {
              setExpandedFeatureIds((current) => {
                const next = new Set(current);
                if (next.has(featureId)) next.delete(featureId);
                else next.add(featureId);
                return next;
              });
            }}
            onCreated={async () => {
              setMessage('功能已保存');
              await refresh(selectedProjectId);
            }}
          />
        )}
        {tree && view === 'alignments' && (
          <AlignmentView
            tree={tree}
            labels={labels}
            selectedAlignmentId={selectedAlignmentId}
            onSelect={setSelectedAlignmentId}
            onCreated={async () => {
              setMessage('对齐关系已保存');
              await refresh(selectedProjectId);
            }}
          />
        )}
        {view === 'mcp' && <McpView />}
      </section>
    </main>
  );
}

function OverviewView({
  overview,
  tree,
  labels,
  onSelectView
}: {
  overview: Overview | null;
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  onSelectView: (view: View) => void;
}) {
  return (
    <section className="content">
      <div className="metrics">
        <Metric label="项目" value={overview?.totals.projects ?? 0} />
        <Metric label="功能集" value={overview?.totals.featureSets ?? 0} />
        <Metric label="功能" value={overview?.totals.features ?? 0} />
        <Metric label="对齐关系" value={overview?.totals.alignments ?? 0} />
      </div>
      <div className="overviewGrid">
        <section className="panel">
          <div className="sectionHeader">
            <h2>项目</h2>
            <span>{labels?.projectStatus[tree.project.status] ?? tree.project.status}</span>
          </div>
          <Description value={tree.project.description} empty="暂无项目说明" />
          <InfoGrid
            items={[
              ['项目 ID', tree.project.id],
              ['当前版本', tree.project.currentVersion],
              ['功能集', String(tree.featureSets.length)],
              ['对齐关系', String(tree.alignments.length)]
            ]}
          />
        </section>
        <section className="panel">
          <div className="sectionHeader">
            <h2>入口</h2>
          </div>
          <div className="actionList">
            <button type="button" onClick={() => onSelectView('sets')}>
              <Boxes size={16} />
              <span>功能集</span>
              <small>{tree.featureSets.length}</small>
            </button>
            <button type="button" onClick={() => onSelectView('features')}>
              <Network size={16} />
              <span>功能树</span>
              <small>{tree.featureSets.reduce((count, set) => count + flattenFeatures(set.features ?? []).length, 0)}</small>
            </button>
            <button type="button" onClick={() => onSelectView('alignments')}>
              <GitMerge size={16} />
              <span>对齐关系</span>
              <small>{tree.alignments.length}</small>
            </button>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="sectionHeader">
          <h2>功能集概览</h2>
        </div>
        <FeatureSetRows featureSets={tree.featureSets} labels={labels} />
      </section>
    </section>
  );
}

function FeatureSetView({
  tree,
  labels,
  selectedFeatureSetId,
  onSelect,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedFeatureSetId: string;
  onSelect: (featureSetId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selected = tree.featureSets.find((set) => set.id === selectedFeatureSetId) ?? tree.featureSets[0];
  return (
    <section className="content workbench">
      <div className="workMain">
        <div className="sectionHeader">
          <h2>功能集</h2>
          <span>{tree.featureSets.length} 个</span>
        </div>
        <FeatureSetRows featureSets={tree.featureSets} labels={labels} selectedId={selected?.id} onSelect={onSelect} />
      </div>
      <aside className="workSide">
        <FeatureSetDetail featureSet={selected} labels={labels} />
        <FeatureSetCreator projectId={tree.project.id} onCreated={onCreated} />
      </aside>
    </section>
  );
}

function FeatureTreeView({
  tree,
  labels,
  keyword,
  setKeyword,
  filteredFeatures,
  selectedFeatureId,
  expandedFeatureIds,
  onSelect,
  onToggle,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  keyword: string;
  setKeyword: (value: string) => void;
  filteredFeatures: Feature[];
  selectedFeatureId: string;
  expandedFeatureIds: Set<string>;
  onSelect: (featureId: string) => void;
  onToggle: (featureId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selected = tree.featureSets.flatMap((set) => flattenFeatures(set.features ?? [])).find((feature) => feature.id === selectedFeatureId);
  const alignments = selected ? tree.alignments.filter((alignment) => alignment.members.some((member) => member.targetType === 'feature' && member.targetId === selected.id)) : [];
  return (
    <section className="content workbench">
      <div className="workMain">
        <div className="sectionHeader">
          <h2>功能树</h2>
          <label className="search">
            <Search size={16} />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索功能、稳定键、说明" />
          </label>
        </div>
        {keyword ? (
          <div className="listPanel">
            {filteredFeatures.map((feature) => (
              <FeatureResultRow key={feature.id} feature={feature} labels={labels} selected={feature.id === selectedFeatureId} onSelect={onSelect} />
            ))}
            {filteredFeatures.length === 0 ? <EmptyState title="没有匹配功能" /> : null}
          </div>
        ) : (
          <div className="featureSets">
            {tree.featureSets.map((set) => (
              <section className="featureSetBlock" key={set.id}>
                <h3>
                  {set.name}
                  <span>{set.version}</span>
                </h3>
                {(set.features ?? []).map((feature) => (
                  <FeatureNode
                    key={feature.id}
                    feature={feature}
                    labels={labels}
                    selectedFeatureId={selectedFeatureId}
                    expandedFeatureIds={expandedFeatureIds}
                    onSelect={onSelect}
                    onToggle={onToggle}
                  />
                ))}
                {(set.features ?? []).length === 0 ? <p className="emptyInline">暂无功能</p> : null}
              </section>
            ))}
          </div>
        )}
      </div>
      <aside className="workSide">
        <FeatureDetail feature={selected} labels={labels} alignments={alignments} />
        <FeatureCreator tree={tree} onCreated={onCreated} />
      </aside>
    </section>
  );
}

function FeatureNode({
  feature,
  labels,
  selectedFeatureId,
  expandedFeatureIds,
  onSelect,
  onToggle
}: {
  feature: Feature;
  labels: Catalog['labels'] | undefined;
  selectedFeatureId: string;
  expandedFeatureIds: Set<string>;
  onSelect: (featureId: string) => void;
  onToggle: (featureId: string) => void;
}) {
  const hasChildren = Boolean(feature.children?.length);
  const expanded = expandedFeatureIds.has(feature.id);
  return (
    <div className="featureNode">
      <div className="featureNodeRow">
        <button className="treeToggle" type="button" onClick={() => hasChildren && onToggle(feature.id)} aria-label={expanded ? '收起' : '展开'} disabled={!hasChildren}>
          {hasChildren ? expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} /> : <span />}
        </button>
        <FeatureLine feature={feature} labels={labels} selected={feature.id === selectedFeatureId} onSelect={onSelect} />
      </div>
      {expanded
        ? (feature.children ?? []).map((child) => (
            <div className="child" key={child.id}>
              <FeatureNode
                feature={child}
                labels={labels}
                selectedFeatureId={selectedFeatureId}
                expandedFeatureIds={expandedFeatureIds}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            </div>
          ))
        : null}
    </div>
  );
}

function FeatureLine({
  feature,
  labels,
  selected = false,
  onSelect
}: {
  feature: Feature;
  labels: Catalog['labels'] | undefined;
  selected?: boolean;
  onSelect: (featureId: string) => void;
}) {
  return (
    <button type="button" className={selected ? 'featureLine active' : 'featureLine'} onClick={() => onSelect(feature.id)}>
      <strong>{feature.name}</strong>
      <span>{feature.version}</span>
      <em>{labels?.featureStatus[feature.status] ?? feature.status}</em>
      <small>{feature.stableKey}</small>
      <code>{feature.id}</code>
    </button>
  );
}

function FeatureResultRow({
  feature,
  labels,
  selected,
  onSelect
}: {
  feature: Feature;
  labels: Catalog['labels'] | undefined;
  selected: boolean;
  onSelect: (featureId: string) => void;
}) {
  return (
    <button type="button" className={selected ? 'resultRow active' : 'resultRow'} onClick={() => onSelect(feature.id)}>
      <strong>{feature.name}</strong>
      <span>{feature.stableKey}</span>
      <em>{labels?.featureStatus[feature.status] ?? feature.status}</em>
      <code>{feature.id}</code>
    </button>
  );
}

function AlignmentView({
  tree,
  labels,
  selectedAlignmentId,
  onSelect,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedAlignmentId: string;
  onSelect: (alignmentId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selected = tree.alignments.find((alignment) => alignment.id === selectedAlignmentId) ?? tree.alignments[0];
  return (
    <section className="content workbench">
      <div className="workMain">
        <div className="sectionHeader">
          <h2>对齐关系</h2>
          <span>{tree.alignments.length} 条</span>
        </div>
        <div className="alignmentList">
          {tree.alignments.map((alignment) => (
            <button key={alignment.id} type="button" className={alignment.id === selected?.id ? 'alignment active' : 'alignment'} onClick={() => onSelect(alignment.id)}>
              <header>
                <strong>{alignment.name}</strong>
                <span>{labels?.alignmentRelation[alignment.relation] ?? alignment.relation}</span>
                <em>{labels?.alignmentStatus[alignment.status] ?? alignment.status}</em>
              </header>
              <Description value={alignment.description} empty="暂无说明" />
              <div className="members">
                {alignment.members.map((member) => (
                  <span key={member.id}>
                    {targetTypeLabel(member.targetType)}：{member.label ?? member.targetId}
                  </span>
                ))}
              </div>
            </button>
          ))}
          {tree.alignments.length === 0 ? <EmptyState title="暂无对齐关系" /> : null}
        </div>
      </div>
      <aside className="workSide">
        <AlignmentDetail alignment={selected} labels={labels} />
        <AlignmentCreator tree={tree} onCreated={onCreated} />
      </aside>
    </section>
  );
}

function McpView() {
  return (
    <section className="content">
      <div className="sectionHeader">
        <h2>MCP 工具入口</h2>
        <span>AI 工具通过服务端写入和查询功能知识库</span>
      </div>
      <div className="mcpGrid">
        {[
          'functree_create_project',
          'functree_upsert_feature_set',
          'functree_upsert_feature',
          'functree_upsert_alignment',
          'functree_create_alignment',
          'functree_upsert_feature_sets_batch',
          'functree_upsert_features_batch',
          'functree_upsert_alignments_batch',
          'functree_query_context'
        ].map((tool) => (
          <article key={tool}>
            <Server size={18} />
            <strong>{tool}</strong>
          </article>
        ))}
      </div>
      <pre>{`# 中央服务端\npnpm start\n\n# 其它服务器上的 MCP 适配器\nnpm install -g @gavin7758521/functree-mcp\nFUNCTREE_SERVER_URL=http://192.168.124.82:4174 functree-mcp\n\n# 调试 HTTP 工具\nPOST /api/mcp/call\n{\n  "name": "functree_query_context",\n  "arguments": { "projectId": "proj_your_app", "keyword": "登录", "limit": 100 }\n}`}</pre>
    </section>
  );
}

function FeatureSetRows({
  featureSets,
  labels,
  selectedId,
  onSelect
}: {
  featureSets: FeatureSet[];
  labels: Catalog['labels'] | undefined;
  selectedId?: string;
  onSelect?: (featureSetId: string) => void;
}) {
  return (
    <div className="table">
      {featureSets.map((set) => {
        const content = (
          <>
            <strong>{set.name}</strong>
            <span>{labels?.featureSetType[set.type] ?? set.type}</span>
            <span>{set.version}</span>
            <em>{labels?.featureSetStatus[set.status] ?? set.status}</em>
            <small>{set.id}</small>
          </>
        );
        return onSelect ? (
          <button type="button" className={set.id === selectedId ? 'row active' : 'row'} key={set.id} onClick={() => onSelect(set.id)}>
            {content}
          </button>
        ) : (
          <div className="row" key={set.id}>
            {content}
          </div>
        );
      })}
      {featureSets.length === 0 ? <EmptyState title="暂无功能集" /> : null}
    </div>
  );
}

function FeatureSetDetail({ featureSet, labels }: { featureSet: FeatureSet | undefined; labels: Catalog['labels'] | undefined }) {
  if (!featureSet) return <EmptyState title="未选择功能集" />;
  const featureCount = flattenFeatures(featureSet.features ?? []).length;
  return (
    <section className="panel">
      <div className="sectionHeader">
        <h2>{featureSet.name}</h2>
        <span>{labels?.featureSetType[featureSet.type] ?? featureSet.type}</span>
      </div>
      <Description value={featureSet.description} empty="暂无功能集说明" />
      <InfoGrid
        items={[
          ['ID', featureSet.id],
          ['稳定键', featureSet.stableKey || '未设置'],
          ['版本', featureSet.version],
          ['状态', labels?.featureSetStatus[featureSet.status] ?? featureSet.status],
          ['负责人', featureSet.owner || '未设置'],
          ['功能数量', String(featureCount)]
        ]}
      />
    </section>
  );
}

function FeatureDetail({
  feature,
  labels,
  alignments
}: {
  feature: Feature | undefined;
  labels: Catalog['labels'] | undefined;
  alignments: Alignment[];
}) {
  if (!feature) return <EmptyState title="未选择功能" />;
  return (
    <section className="panel">
      <div className="sectionHeader">
        <h2>{feature.name}</h2>
        <span>{labels?.featureStatus[feature.status] ?? feature.status}</span>
      </div>
      <Description value={feature.description} empty="暂无功能说明" />
      <InfoGrid
        items={[
          ['ID', feature.id],
          ['稳定键', feature.stableKey],
          ['版本', feature.version],
          ['类型', feature.kind],
          ['父功能', feature.parentFeatureId ?? '无'],
          ['子功能', String(feature.children?.length ?? 0)]
        ]}
      />
      <div className="detailBlock">
        <h3>相关对齐</h3>
        {alignments.map((alignment) => (
          <span key={alignment.id}>{alignment.name}</span>
        ))}
        {alignments.length === 0 ? <small>暂无</small> : null}
      </div>
    </section>
  );
}

function AlignmentDetail({ alignment, labels }: { alignment: Alignment | undefined; labels: Catalog['labels'] | undefined }) {
  if (!alignment) return <EmptyState title="未选择对齐关系" />;
  return (
    <section className="panel">
      <div className="sectionHeader">
        <h2>{alignment.name}</h2>
        <span>{labels?.alignmentStatus[alignment.status] ?? alignment.status}</span>
      </div>
      <Description value={alignment.description} empty="暂无对齐说明" />
      <InfoGrid
        items={[
          ['ID', alignment.id],
          ['稳定键', alignment.stableKey || '未设置'],
          ['关系', labels?.alignmentRelation[alignment.relation] ?? alignment.relation],
          ['成员数量', String(alignment.members.length)]
        ]}
      />
      <div className="detailBlock">
        <h3>成员</h3>
        {alignment.members.map((member) => (
          <span key={member.id}>
            {targetTypeLabel(member.targetType)} / {member.role} / {member.label ?? member.targetId}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProjectCreator({ onCreated, compact = false }: { onCreated: (project: Project) => Promise<void>; compact?: boolean }) {
  const [name, setName] = useState('');
  return (
    <form
      className={compact ? 'quickForm compact' : 'quickForm'}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        const project = await postJson<Project>('/api/projects', { name, currentVersion: '当前', status: 'active' });
        setName('');
        await onCreated(project);
      }}
    >
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="新建项目" />
      <button type="submit" aria-label="新建项目">
        <Plus size={16} />
      </button>
    </form>
  );
}

function FeatureSetCreator({ projectId, onCreated }: { projectId: string; onCreated: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [type, setType] = useState('frontend');
  const [version, setVersion] = useState('当前');
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!projectId) return;
        await postJson(`/api/projects/${projectId}/feature-sets`, { name, stableKey: stableKey || undefined, type, version, status: 'normal' });
        setName('');
        setStableKey('');
        await onCreated();
      }}
    >
      <h3>新建功能集</h3>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称，例如 App 前端" required />
      <input value={stableKey} onChange={(event) => setStableKey(event.target.value)} placeholder="稳定键，例如 web.frontend" />
      <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="版本" required />
      <select value={type} onChange={(event) => setType(event.target.value)}>
        <option value="frontend">前端</option>
        <option value="backend">后端</option>
        <option value="product">产品</option>
        <option value="uiux">UI/UX</option>
        <option value="requirement">需求</option>
        <option value="test">测试</option>
      </select>
      <button type="submit">保存功能集</button>
    </form>
  );
}

function FeatureCreator({ tree, onCreated }: { tree: ProjectTree; onCreated: () => Promise<void> }) {
  const [featureSetId, setFeatureSetId] = useState('');
  const [parentFeatureId, setParentFeatureId] = useState('');
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [version, setVersion] = useState('当前');
  const featureSet = featureSetId || tree.featureSets[0]?.id || '';
  const parentOptions = flattenFeatures(tree.featureSets.find((set) => set.id === featureSet)?.features ?? []);
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!featureSet) return;
        await postJson(`/api/feature-sets/${featureSet}/features`, {
          name,
          stableKey,
          version,
          parentFeatureId: parentFeatureId || null,
          status: 'draft',
          kind: 'capability'
        });
        setName('');
        setStableKey('');
        setParentFeatureId('');
        await onCreated();
      }}
    >
      <h3>新建功能</h3>
      <select value={featureSet} onChange={(event) => setFeatureSetId(event.target.value)}>
        {tree.featureSets.map((set) => (
          <option key={set.id} value={set.id}>
            {set.name} / {set.version}
          </option>
        ))}
      </select>
      <select value={parentFeatureId} onChange={(event) => setParentFeatureId(event.target.value)}>
        <option value="">无父功能</option>
        {parentOptions.map((feature) => (
          <option key={feature.id} value={feature.id}>
            {feature.name} / {feature.stableKey}
          </option>
        ))}
      </select>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="功能名称" required />
      <input value={stableKey} onChange={(event) => setStableKey(event.target.value)} placeholder="稳定键，例如 login" required />
      <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="功能版本" required />
      <button type="submit">保存功能</button>
    </form>
  );
}

function AlignmentCreator({ tree, onCreated }: { tree: ProjectTree; onCreated: () => Promise<void> }) {
  const alignables = [
    { id: tree.project.id, label: `项目：${tree.project.name}`, type: 'project' },
    ...tree.featureSets.map((set) => ({ id: set.id, label: `功能集：${set.name} / ${set.version}`, type: 'feature_set' })),
    ...tree.featureSets.flatMap((set) => flattenFeatures(set.features ?? []).map((feature) => ({ id: feature.id, label: `功能：${feature.name} / ${feature.version}`, type: 'feature' })))
  ];
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const a = first || alignables[0]?.id || '';
  const b = second || alignables[1]?.id || '';
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        const firstItem = alignables.find((item) => item.id === a);
        const secondItem = alignables.find((item) => item.id === b);
        if (!firstItem || !secondItem || firstItem.id === secondItem.id) return;
        await postJson(`/api/projects/${tree.project.id}/alignments`, {
          name: `${firstItem.label} 对齐 ${secondItem.label}`,
          relation: 'corresponds_to',
          status: 'proposed',
          members: [
            { targetType: firstItem.type, targetId: firstItem.id, role: 'source' },
            { targetType: secondItem.type, targetId: secondItem.id, role: 'target' }
          ]
        });
        await onCreated();
      }}
    >
      <h3>建立对齐</h3>
      <select value={a} onChange={(event) => setFirst(event.target.value)}>
        {alignables.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <select value={b} onChange={(event) => setSecond(event.target.value)}>
        {alignables.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <button type="submit">保存对齐关系</button>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="infoGrid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Description({ value, empty }: { value: string; empty: string }) {
  return <p className={value ? 'description' : 'description muted'}>{value || empty}</p>;
}

function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <section className="emptyState">
      <strong>{title}</strong>
      {action}
    </section>
  );
}

function flattenFeatures(features: Feature[]): Feature[] {
  return features.flatMap((feature) => [feature, ...flattenFeatures(feature.children ?? [])]);
}

function targetTypeLabel(type: string): string {
  if (type === 'project') return '项目';
  if (type === 'feature_set') return '功能集';
  return '功能';
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
}

async function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
}
