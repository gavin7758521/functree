import {
  Boxes,
  Braces,
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
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredFeatures = useMemo(() => {
    const all = tree?.featureSets.flatMap((set) => flattenFeatures(set.features ?? [])) ?? [];
    if (!keyword.trim()) return all;
    return all.filter((feature) => `${feature.name} ${feature.stableKey} ${feature.description}`.includes(keyword.trim()));
  }, [tree, keyword]);

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

        {view === 'overview' && <OverviewView overview={overview} tree={tree} labels={labels} />}
        {view === 'sets' && selectedProjectId && (
          <FeatureSetView
            tree={tree}
            labels={labels}
            onCreated={async () => {
              setMessage('功能集已保存');
              await refresh(selectedProjectId);
            }}
          />
        )}
        {view === 'features' && selectedProjectId && (
          <FeatureTreeView
            tree={tree}
            labels={labels}
            keyword={keyword}
            setKeyword={setKeyword}
            filteredFeatures={filteredFeatures}
            onCreated={async () => {
              setMessage('功能已保存');
              await refresh(selectedProjectId);
            }}
          />
        )}
        {view === 'alignments' && selectedProjectId && (
          <AlignmentView
            tree={tree}
            labels={labels}
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

function OverviewView({ overview, tree, labels }: { overview: Overview | null; tree: ProjectTree | null; labels: Catalog['labels'] | undefined }) {
  return (
    <section className="content">
      <div className="metrics">
        <Metric label="项目" value={overview?.totals.projects ?? 0} />
        <Metric label="功能集" value={overview?.totals.featureSets ?? 0} />
        <Metric label="功能" value={overview?.totals.features ?? 0} />
        <Metric label="对齐关系" value={overview?.totals.alignments ?? 0} />
      </div>
      <div className="sectionHeader">
        <h2>当前项目结构</h2>
        <span>{tree?.project.status ? labels?.projectStatus[tree.project.status] : ''}</span>
      </div>
      <div className="setGrid">
        {(tree?.featureSets ?? []).map((set) => (
          <article className="setItem" key={set.id}>
            <div>
              <strong>{set.name}</strong>
              <small>{labels?.featureSetType[set.type] ?? set.type}</small>
            </div>
            <span>{set.version}</span>
            <em>{labels?.featureSetStatus[set.status] ?? set.status}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeatureSetView({ tree, labels, onCreated }: { tree: ProjectTree | null; labels: Catalog['labels'] | undefined; onCreated: () => Promise<void> }) {
  return (
    <section className="content split">
      <div>
        <div className="sectionHeader">
          <h2>功能集</h2>
          <span>支持多版本共存</span>
        </div>
        <div className="table">
          {(tree?.featureSets ?? []).map((set) => (
            <div className="row" key={set.id}>
              <strong>{set.name}</strong>
              <span>{labels?.featureSetType[set.type] ?? set.type}</span>
              <span>{set.version}</span>
              <span>{labels?.featureSetStatus[set.status] ?? set.status}</span>
              <small>{set.id}</small>
            </div>
          ))}
        </div>
      </div>
      <FeatureSetCreator projectId={tree?.project.id ?? ''} onCreated={onCreated} />
    </section>
  );
}

function FeatureTreeView({
  tree,
  labels,
  keyword,
  setKeyword,
  filteredFeatures,
  onCreated
}: {
  tree: ProjectTree | null;
  labels: Catalog['labels'] | undefined;
  keyword: string;
  setKeyword: (value: string) => void;
  filteredFeatures: Feature[];
  onCreated: () => Promise<void>;
}) {
  return (
    <section className="content split">
      <div>
        <div className="sectionHeader">
          <h2>功能树</h2>
          <label className="search">
            <Search size={16} />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索功能、稳定键、说明" />
          </label>
        </div>
        {keyword ? (
          <div className="table">
            {filteredFeatures.map((feature) => (
              <FeatureLine key={feature.id} feature={feature} labels={labels} compact />
            ))}
          </div>
        ) : (
          <div className="featureSets">
            {(tree?.featureSets ?? []).map((set) => (
              <section className="featureSetBlock" key={set.id}>
                <h3>
                  {set.name}
                  <span>{set.version}</span>
                </h3>
                {(set.features ?? []).map((feature) => (
                  <FeatureNode key={feature.id} feature={feature} labels={labels} />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
      <FeatureCreator tree={tree} onCreated={onCreated} />
    </section>
  );
}

function FeatureNode({ feature, labels }: { feature: Feature; labels: Catalog['labels'] | undefined }) {
  return (
    <div className="featureNode">
      <FeatureLine feature={feature} labels={labels} />
      {(feature.children ?? []).map((child) => (
        <div className="child" key={child.id}>
          <FeatureNode feature={child} labels={labels} />
        </div>
      ))}
    </div>
  );
}

function FeatureLine({ feature, labels, compact = false }: { feature: Feature; labels: Catalog['labels'] | undefined; compact?: boolean }) {
  return (
    <div className={compact ? 'featureLine compact' : 'featureLine'}>
      <ChevronRight size={15} />
      <strong>{feature.name}</strong>
      <span>{feature.version}</span>
      <em>{labels?.featureStatus[feature.status] ?? feature.status}</em>
      <small>{feature.id}</small>
    </div>
  );
}

function AlignmentView({ tree, labels, onCreated }: { tree: ProjectTree | null; labels: Catalog['labels'] | undefined; onCreated: () => Promise<void> }) {
  return (
    <section className="content split">
      <div>
        <div className="sectionHeader">
          <h2>对齐关系</h2>
          <span>项目、功能集、功能可跨层级对齐</span>
        </div>
        <div className="alignmentList">
          {(tree?.alignments ?? []).map((alignment) => (
            <article className="alignment" key={alignment.id}>
              <header>
                <strong>{alignment.name}</strong>
                <span>{labels?.alignmentRelation[alignment.relation] ?? alignment.relation}</span>
                <em>{labels?.alignmentStatus[alignment.status] ?? alignment.status}</em>
              </header>
              <p>{alignment.description}</p>
              <div className="members">
                {alignment.members.map((member) => (
                  <span key={member.id}>
                    {targetTypeLabel(member.targetType)}：{member.label ?? member.targetId}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
      <AlignmentCreator tree={tree} onCreated={onCreated} />
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
          'functree_create_alignment',
          'functree_query_context'
        ].map((tool) => (
          <article key={tool}>
            <Server size={18} />
            <strong>{tool}</strong>
          </article>
        ))}
      </div>
      <pre>{`# 中央服务端\npnpm start\n\n# 其它服务器上的 MCP 适配器\nnpm install -g @gavin7758521/functree-mcp\nFUNCTREE_SERVER_URL=http://192.168.124.82:4174 functree-mcp\n\n# 调试 HTTP 工具\nPOST /api/mcp/call\n{\n  "name": "functree_query_context",\n  "arguments": { "projectId": "proj_demo", "keyword": "登录" }\n}`}</pre>
    </section>
  );
}

function ProjectCreator({ onCreated }: { onCreated: (project: Project) => Promise<void> }) {
  const [name, setName] = useState('');
  return (
    <form
      className="quickForm"
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
  const [type, setType] = useState('frontend');
  const [version, setVersion] = useState('当前');
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        await postJson(`/api/projects/${projectId}/feature-sets`, { name, type, version, status: 'normal' });
        setName('');
        await onCreated();
      }}
    >
      <h3>新建功能集</h3>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称，例如 App 前端" required />
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

function FeatureCreator({ tree, onCreated }: { tree: ProjectTree | null; onCreated: () => Promise<void> }) {
  const [featureSetId, setFeatureSetId] = useState('');
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [version, setVersion] = useState('当前');
  const featureSet = featureSetId || tree?.featureSets[0]?.id || '';
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        await postJson(`/api/feature-sets/${featureSet}/features`, { name, stableKey, version, status: 'draft', kind: 'capability' });
        setName('');
        setStableKey('');
        await onCreated();
      }}
    >
      <h3>新建功能</h3>
      <select value={featureSet} onChange={(event) => setFeatureSetId(event.target.value)}>
        {(tree?.featureSets ?? []).map((set) => (
          <option key={set.id} value={set.id}>
            {set.name} / {set.version}
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

function AlignmentCreator({ tree, onCreated }: { tree: ProjectTree | null; onCreated: () => Promise<void> }) {
  const alignables = [
    ...(tree ? [{ id: tree.project.id, label: `项目：${tree.project.name}`, type: 'project' }] : []),
    ...(tree?.featureSets ?? []).map((set) => ({ id: set.id, label: `功能集：${set.name} / ${set.version}`, type: 'feature_set' })),
    ...(tree?.featureSets.flatMap((set) => flattenFeatures(set.features ?? []).map((feature) => ({ id: feature.id, label: `功能：${feature.name} / ${feature.version}`, type: 'feature' }))) ?? [])
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
        if (!tree || !firstItem || !secondItem || firstItem.id === secondItem.id) return;
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
