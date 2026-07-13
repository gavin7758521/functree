import {
  BookOpen,
  Braces,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  FileCode2,
  FileSearch,
  GitBranch,
  GitMerge,
  Layers3,
  Link2,
  Map as MapIcon,
  Network,
  Plus,
  RefreshCw,
  Search,
  Server
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Alignment, Catalog, CodeReference, EntryPoint, Evidence, Feature, FeatureDetail as FeatureDetailData, FuncMap, Overview, Project, ProjectTree } from './types.js';

type View = 'overview' | 'maps' | 'features' | 'entryPoints' | 'references' | 'alignments' | 'mcp';

type ViewMeta = { id: View; label: string; icon: LucideIcon; group: '知识结构' | '代码视角' | '同步工具' };

const views: ViewMeta[] = [
  { id: 'overview', label: '项目总览', icon: Layers3, group: '知识结构' },
  { id: 'maps', label: '功能地图', icon: MapIcon, group: '知识结构' },
  { id: 'features', label: '功能树', icon: Network, group: '知识结构' },
  { id: 'alignments', label: '对齐关系', icon: GitMerge, group: '知识结构' },
  { id: 'entryPoints', label: '入口文件', icon: FileCode2, group: '代码视角' },
  { id: 'references', label: '代码引用', icon: Code2, group: '代码视角' },
  { id: 'mcp', label: 'MCP 与同步', icon: Braces, group: '同步工具' }
];

const mcpToolGroups = [
  {
    name: '查询',
    tools: ['functree_query_context', 'functree_resolve_stable_keys', 'functree_project_summary', 'functree_get_capability_matrix', 'functree_get_programming_context', 'functree_quality_report', 'functree_query_path_context']
  },
  {
    name: '写入',
    tools: ['functree_create_project', 'functree_upsert_map', 'functree_upsert_feature', 'functree_upsert_entry_point', 'functree_upsert_code_reference', 'functree_upsert_evidence', 'functree_upsert_capability_status', 'functree_upsert_capability_gap', 'functree_upsert_alignment']
  },
  {
    name: '批量',
    tools: ['functree_upsert_maps_batch', 'functree_upsert_features_batch', 'functree_upsert_entry_points_batch', 'functree_upsert_code_references_batch', 'functree_upsert_evidence_batch', 'functree_upsert_capability_statuses_batch', 'functree_upsert_capability_gaps_batch', 'functree_upsert_alignments_batch']
  },
  {
    name: '扫描',
    tools: ['functree_begin_scan', 'functree_finish_scan']
  }
];

const viewIds = new Set<View>(views.map((view) => view.id));

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tree, setTree] = useState<ProjectTree | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMapId, setSelectedMapId] = useState('');
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [selectedEntryPointId, setSelectedEntryPointId] = useState('');
  const [selectedCodeReferenceId, setSelectedCodeReferenceId] = useState('');
  const [selectedAlignmentId, setSelectedAlignmentId] = useState('');
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<Set<string>>(() => new Set());
  const [view, setViewState] = useState<View>(() => readViewFromUrl());
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

  useEffect(() => {
    const syncView = () => setViewState(readViewFromUrl());
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, []);

  function setView(nextView: View) {
    setViewState(nextView);
    const url = new URL(window.location.href);
    url.searchParams.set('view', nextView);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  const allFeatures = useMemo(() => tree?.maps.flatMap((map) => flattenFeatures(map.features ?? [])) ?? [], [tree]);

  function selectMapForFeatureTree(mapId: string) {
    setSelectedMapId(mapId);
    const firstFeature = flattenFeatures(tree?.maps.find((map) => map.id === mapId)?.features ?? [])[0];
    if (firstFeature) setSelectedFeatureId(firstFeature.id);
  }

  useEffect(() => {
    if (!tree) {
      setSelectedMapId('');
      setSelectedFeatureId('');
      setSelectedEntryPointId('');
      setSelectedCodeReferenceId('');
      setSelectedAlignmentId('');
      return;
    }

    if (!tree.maps.some((map) => map.id === selectedMapId)) {
      setSelectedMapId(tree.maps[0]?.id ?? '');
    }
    if (!allFeatures.some((feature) => feature.id === selectedFeatureId)) {
      setSelectedFeatureId(allFeatures[0]?.id ?? '');
    }
    if (!tree.entryPoints.some((entryPoint) => entryPoint.id === selectedEntryPointId)) {
      setSelectedEntryPointId(tree.entryPoints[0]?.id ?? '');
    }
    if (!tree.codeReferences.some((reference) => reference.id === selectedCodeReferenceId)) {
      setSelectedCodeReferenceId(tree.codeReferences[0]?.id ?? '');
    }
    if (!tree.alignments.some((alignment) => alignment.id === selectedAlignmentId)) {
      setSelectedAlignmentId(tree.alignments[0]?.id ?? '');
    }
  }, [allFeatures, selectedAlignmentId, selectedCodeReferenceId, selectedEntryPointId, selectedFeatureId, selectedMapId, tree]);

  const labels = catalog?.labels;
  const currentView = views.find((item) => item.id === view) ?? views[0];

  return (
    <main className="layout">
      <aside className="sidebar">
        <div className="brand">
          <strong>FuncTree</strong>
          <span>{overview?.totals.projects ?? 0} 个项目</span>
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
              aria-current={project.id === selectedProjectId ? 'page' : undefined}
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
            <div className="eyebrow">
              <Compass size={14} />
              <span>{currentView.group}</span>
            </div>
            <h1>{tree?.project.name ?? '项目工作台'}</h1>
            <p>{tree ? tree.project.description || `${tree.project.id} / ${tree.project.currentVersion}` : '暂无项目'}</p>
          </div>
          <button className="iconButton" type="button" onClick={() => void refresh()} aria-label="刷新">
            <RefreshCw size={18} />
          </button>
        </header>

        <WorkspaceNav view={view} onSelect={setView} tree={tree} overview={overview} selectedMapId={selectedMapId} selectedFeatureId={selectedFeatureId} />

        {message ? <div className="message">{message}</div> : null}

        {!tree && view !== 'mcp' ? (
          <EmptyState title="还没有项目" action={<ProjectCreator onCreated={(project) => refresh(project.id)} compact />} />
        ) : null}

        {tree && view === 'overview' && <OverviewView overview={overview} tree={tree} labels={labels} onSelectView={setView} />}
        {tree && view === 'maps' && (
          <MapView
            tree={tree}
            labels={labels}
            selectedMapId={selectedMapId}
            onSelect={setSelectedMapId}
            onCreated={async () => {
              setMessage('功能地图已保存');
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
            selectedFeatureId={selectedFeatureId}
            selectedMapId={selectedMapId}
            expandedFeatureIds={expandedFeatureIds}
            onSelectFeature={setSelectedFeatureId}
            onSelectMap={selectMapForFeatureTree}
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
        {tree && view === 'entryPoints' && (
          <EntryPointView
            tree={tree}
            labels={labels}
            selectedEntryPointId={selectedEntryPointId}
            onSelect={setSelectedEntryPointId}
            onCreated={async () => {
              setMessage('入口文件已保存');
              await refresh(selectedProjectId);
            }}
          />
        )}
        {tree && view === 'references' && (
          <CodeReferenceView
            tree={tree}
            labels={labels}
            selectedCodeReferenceId={selectedCodeReferenceId}
            onSelect={setSelectedCodeReferenceId}
            onCreated={async () => {
              setMessage('代码引用已保存');
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

function WorkspaceNav({
  view,
  onSelect,
  tree,
  overview,
  selectedMapId,
  selectedFeatureId
}: {
  view: View;
  onSelect: (view: View) => void;
  tree: ProjectTree | null;
  overview: Overview | null;
  selectedMapId: string;
  selectedFeatureId: string;
}) {
  const selectedMap = tree?.maps.find((map) => map.id === selectedMapId) ?? tree?.maps[0];
  const selectedMapFeatures = selectedMap ? flattenFeatures(selectedMap.features ?? []) : [];
  const selectedFeature = selectedMapFeatures.find((feature) => feature.id === selectedFeatureId) ?? selectedMapFeatures[0];
  const codeViews = views.filter((item) => item.group === '代码视角');
  const syncViews = views.filter((item) => item.group === '同步工具');

  return (
    <nav className="workspaceNav" aria-label="工作区">
      <section className="structureRail" aria-label="知识结构">
        <header>
          <BookOpen size={15} />
          <span>知识结构</span>
        </header>
        <div className="structureSteps">
          <HierarchyStep
            active={view === 'overview'}
            icon={Layers3}
            level="01"
            title="项目"
            primary={tree?.project.name ?? '暂无项目'}
            secondary={tree?.project.currentVersion ?? ''}
            count={viewCount('overview', tree, overview)}
            onSelect={() => onSelect('overview')}
          />
          <span className="stepConnector" aria-hidden="true" />
          <HierarchyStep
            active={view === 'maps'}
            icon={MapIcon}
            level="02"
            title="功能地图"
            primary={selectedMap?.name ?? '暂无地图'}
            secondary={selectedMap?.stableKey ?? ''}
            count={viewCount('maps', tree, overview)}
            onSelect={() => onSelect('maps')}
          />
          <span className="stepConnector" aria-hidden="true" />
          <HierarchyStep
            active={view === 'features'}
            icon={Network}
            level="03"
            title="功能树"
            primary={selectedFeature?.name ?? '暂无功能'}
            secondary={selectedFeature?.stableKey ?? ''}
            count={String(selectedMapFeatures.length)}
            onSelect={() => onSelect('features')}
          />
        </div>
        <button type="button" className={view === 'alignments' ? 'relationStep active' : 'relationStep'} onClick={() => onSelect('alignments')} aria-current={view === 'alignments' ? 'page' : undefined}>
          <GitMerge size={17} />
          <span>
            <strong>对齐关系</strong>
            <small>跨地图对应</small>
          </span>
          <em>{viewCount('alignments', tree, overview)}</em>
        </button>
      </section>

      <SecondaryNavGroup title="代码视角" icon={FileSearch} items={codeViews} view={view} onSelect={onSelect} tree={tree} overview={overview} />
      <SecondaryNavGroup title="同步工具" icon={GitBranch} items={syncViews} view={view} onSelect={onSelect} tree={tree} overview={overview} />
    </nav>
  );
}

function HierarchyStep({
  active,
  icon: Icon,
  level,
  title,
  primary,
  secondary,
  count,
  onSelect
}: {
  active: boolean;
  icon: LucideIcon;
  level: string;
  title: string;
  primary: string;
  secondary: string;
  count: string;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={active ? 'hierarchyStep active' : 'hierarchyStep'} onClick={onSelect} aria-current={active ? 'page' : undefined}>
      <span className="stepIndex">{level}</span>
      <span className="stepIcon">
        <Icon size={16} />
      </span>
      <span className="stepCopy">
        <strong>{title}</strong>
        <small>{primary}</small>
        {secondary ? <em>{secondary}</em> : null}
      </span>
      <span className="stepCount">{count}</span>
    </button>
  );
}

function SecondaryNavGroup({
  title,
  icon: Icon,
  items,
  view,
  onSelect,
  tree,
  overview
}: {
  title: ViewMeta['group'];
  icon: LucideIcon;
  items: ViewMeta[];
  view: View;
  onSelect: (view: View) => void;
  tree: ProjectTree | null;
  overview: Overview | null;
}) {
  return (
    <section className="navGroup compact">
      <header>
        <Icon size={15} />
        <span>{title}</span>
      </header>
      <div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={view === item.id ? 'tab active' : 'tab'} onClick={() => onSelect(item.id)} aria-current={view === item.id ? 'page' : undefined}>
              <Icon size={17} />
              <span>{item.label}</span>
              <small>{viewCount(item.id, tree, overview)}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function viewCount(view: View, tree: ProjectTree | null, overview: Overview | null): string {
  if (view === 'overview') return String(overview?.totals.projects ?? 0);
  if (!tree) return '0';
  if (view === 'maps') return String(tree.maps.length);
  if (view === 'features') return String(tree.maps.reduce((count, map) => count + flattenFeatures(map.features ?? []).length, 0));
  if (view === 'entryPoints') return String(tree.entryPoints.length);
  if (view === 'references') return String(tree.codeReferences.length);
  if (view === 'alignments') return String(tree.alignments.length);
  return String(mcpToolGroups.reduce((count, group) => count + group.tools.length, 0));
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
  const featureCount = tree.maps.reduce((count, map) => count + flattenFeatures(map.features ?? []).length, 0);
  return (
    <section className="content">
      <div className="metrics">
        <Metric label="项目" value={overview?.totals.projects ?? 0} />
        <Metric label="地图" value={overview?.totals.maps ?? 0} />
        <Metric label="功能" value={overview?.totals.features ?? 0} />
        <Metric label="入口" value={overview?.totals.entryPoints ?? 0} />
        <Metric label="引用" value={overview?.totals.codeReferences ?? 0} />
        <Metric label="对齐" value={overview?.totals.alignments ?? 0} />
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
              ['功能地图', String(tree.maps.length)],
              ['功能', String(featureCount)],
              ['对齐关系', String(tree.alignments.length)]
            ]}
          />
        </section>
        <section className="panel">
          <div className="sectionHeader">
            <h2>入口</h2>
          </div>
          <div className="actionList">
            <button type="button" onClick={() => onSelectView('maps')}>
              <MapIcon size={16} />
              <span>功能地图</span>
              <small>{tree.maps.length}</small>
            </button>
            <button type="button" onClick={() => onSelectView('entryPoints')}>
              <FileCode2 size={16} />
              <span>入口文件</span>
              <small>{tree.entryPoints.length}</small>
            </button>
            <button type="button" onClick={() => onSelectView('references')}>
              <Code2 size={16} />
              <span>代码引用</span>
              <small>{tree.codeReferences.length}</small>
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
          <h2>功能地图概览</h2>
        </div>
        <MapRows maps={tree.maps} labels={labels} />
      </section>
    </section>
  );
}

function MapView({
  tree,
  labels,
  selectedMapId,
  onSelect,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedMapId: string;
  onSelect: (mapId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selected = tree.maps.find((map) => map.id === selectedMapId) ?? tree.maps[0];
  return (
    <section className="content workbench">
      <div className="workMain">
        <WorkbenchHeader icon={MapIcon} title="功能地图" count={`${tree.maps.length} 个`} />
        <div className="workSurface">
          <MapRows maps={tree.maps} labels={labels} selectedId={selected?.id} onSelect={onSelect} />
        </div>
      </div>
      <aside className="workSide">
        <MapDetail tree={tree} map={selected} labels={labels} />
        <CreatorSlot label="新建功能地图">
          <MapCreator projectId={tree.project.id} onCreated={onCreated} />
        </CreatorSlot>
      </aside>
    </section>
  );
}

function FeatureTreeView({
  tree,
  labels,
  keyword,
  setKeyword,
  selectedFeatureId,
  selectedMapId,
  expandedFeatureIds,
  onSelectFeature,
  onSelectMap,
  onToggle,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  keyword: string;
  setKeyword: (value: string) => void;
  selectedFeatureId: string;
  selectedMapId: string;
  expandedFeatureIds: Set<string>;
  onSelectFeature: (featureId: string) => void;
  onSelectMap: (mapId: string) => void;
  onToggle: (featureId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selectedMap = tree.maps.find((map) => map.id === selectedMapId) ?? tree.maps[0];
  const selectedMapFeatures = selectedMap ? flattenFeatures(selectedMap.features ?? []) : [];
  const selected = selectedMapFeatures.find((feature) => feature.id === selectedFeatureId) ?? selectedMapFeatures[0];
  const filteredFeatures = keyword.trim()
    ? selectedMapFeatures.filter((feature) => {
        const value = keyword.trim().toLowerCase();
        return `${feature.name} ${feature.stableKey} ${feature.description} ${feature.tags?.join(' ')}`.toLowerCase().includes(value);
      })
    : selectedMapFeatures;
  const featureCount = tree.maps.reduce((count, map) => count + flattenFeatures(map.features ?? []).length, 0);
  const alignments = selected ? tree.alignments.filter((alignment) => alignment.members.some((member) => member.targetType === 'feature' && member.targetId === selected.id)) : [];
  const codeReferences = selected ? tree.codeReferences.filter((reference) => reference.featureId === selected.id) : [];
  const codeReferenceIds = new Set(codeReferences.map((reference) => reference.id));
  const evidence = selected
    ? (tree.evidence ?? []).filter((item) => (item.targetType === 'feature' && item.targetId === selected.id) || (item.targetType === 'code_reference' && codeReferenceIds.has(item.targetId)))
    : [];
  return (
    <section className="content workbench">
      <div className="workMain">
        <WorkbenchHeader
          icon={Network}
          title="功能树"
          count={`${featureCount} 个`}
          action={
            <label className="search">
              <Search size={16} />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索功能、稳定键、说明" />
            </label>
          }
        />
        <div className="workSurface featureWorkspace">
          <div className="drilldownLayout">
            <aside className="mapDrilldown" aria-label="功能地图">
              {tree.maps.map((map) => {
                const count = flattenFeatures(map.features ?? []).length;
                return (
                  <button key={map.id} type="button" className={map.id === selectedMap?.id ? 'active' : ''} onClick={() => onSelectMap(map.id)}>
                    <MapIcon size={16} />
                    <span>
                      <strong>{map.name}</strong>
                      <small>{map.stableKey}</small>
                    </span>
                    <em>{count}</em>
                  </button>
                );
              })}
              {tree.maps.length === 0 ? <EmptyState title="暂无功能地图" /> : null}
            </aside>
            <section className="featureTreePanel">
              {selectedMap ? (
                <>
                  <div className="featureTreeHeader">
                    <span>{labels?.mapAxis[selectedMap.axis] ?? selectedMap.axis}</span>
                    <strong>{selectedMap.name}</strong>
                    <small>{selectedMap.stableKey}</small>
                  </div>
                  {keyword ? (
                    <div className="listPanel">
                      {filteredFeatures.map((feature) => (
                        <FeatureResultRow key={feature.id} feature={feature} labels={labels} selected={feature.id === selected?.id} onSelect={onSelectFeature} />
                      ))}
                      {filteredFeatures.length === 0 ? <EmptyState title="没有匹配功能" /> : null}
                    </div>
                  ) : (
                    <div className="featureForest">
                      {(selectedMap.features ?? []).map((feature) => (
                        <FeatureNode
                          key={feature.id}
                          feature={feature}
                          labels={labels}
                          selectedFeatureId={selected?.id ?? selectedFeatureId}
                          expandedFeatureIds={expandedFeatureIds}
                          onSelect={onSelectFeature}
                          onToggle={onToggle}
                        />
                      ))}
                      {(selectedMap.features ?? []).length === 0 ? <p className="emptyInline">暂无功能</p> : null}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState title="暂无功能地图" />
              )}
            </section>
          </div>
        </div>
      </div>
      <aside className="workSide">
        <FeatureDetail tree={tree} feature={selected} labels={labels} alignments={alignments} codeReferences={codeReferences} evidence={evidence} />
        <CreatorSlot label="新建功能">
          <FeatureCreator tree={tree} selectedMapId={selectedMapId} onCreated={onCreated} />
        </CreatorSlot>
      </aside>
    </section>
  );
}

function EntryPointView({
  tree,
  labels,
  selectedEntryPointId,
  onSelect,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedEntryPointId: string;
  onSelect: (entryPointId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selected = tree.entryPoints.find((entryPoint) => entryPoint.id === selectedEntryPointId) ?? tree.entryPoints[0];
  return (
    <section className="content workbench">
      <div className="workMain">
        <WorkbenchHeader icon={FileCode2} title="入口文件" count={`${tree.entryPoints.length} 个`} />
        <div className="workSurface">
          <EntryPointRows entryPoints={tree.entryPoints} tree={tree} labels={labels} selectedId={selected?.id} onSelect={onSelect} />
        </div>
      </div>
      <aside className="workSide">
        <EntryPointDetail entryPoint={selected} tree={tree} labels={labels} />
        <CreatorSlot label="新建入口文件">
          <EntryPointCreator tree={tree} onCreated={onCreated} />
        </CreatorSlot>
      </aside>
    </section>
  );
}

function CodeReferenceView({
  tree,
  labels,
  selectedCodeReferenceId,
  onSelect,
  onCreated
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedCodeReferenceId: string;
  onSelect: (codeReferenceId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const selected = tree.codeReferences.find((reference) => reference.id === selectedCodeReferenceId) ?? tree.codeReferences[0];
  return (
    <section className="content workbench">
      <div className="workMain">
        <WorkbenchHeader icon={Code2} title="代码引用" count={`${tree.codeReferences.length} 个`} />
        <div className="workSurface">
          <CodeReferenceRows references={tree.codeReferences} tree={tree} labels={labels} selectedId={selected?.id} onSelect={onSelect} />
        </div>
      </div>
      <aside className="workSide">
        <CodeReferenceDetail reference={selected} tree={tree} labels={labels} />
        <CreatorSlot label="新建代码引用">
          <CodeReferenceCreator tree={tree} onCreated={onCreated} />
        </CreatorSlot>
      </aside>
    </section>
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
        <WorkbenchHeader icon={GitMerge} title="对齐关系" count={`${tree.alignments.length} 条`} />
        <div className="workSurface alignmentSurface">
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
      </div>
      <aside className="workSide">
        <AlignmentDetail alignment={selected} labels={labels} />
        <CreatorSlot label="建立对齐关系">
          <AlignmentCreator tree={tree} onCreated={onCreated} />
        </CreatorSlot>
      </aside>
    </section>
  );
}

function McpView() {
  return (
    <section className="content">
      <div className="sectionHeader">
        <h2>MCP 工具入口</h2>
      </div>
      <div className="mcpGrid">
        {mcpToolGroups.map((group) => (
          <section className="mcpGroup" key={group.name}>
            <h3>{group.name}</h3>
            {group.tools.map((tool) => (
              <article key={tool}>
                <Server size={18} />
                <strong>{tool}</strong>
              </article>
            ))}
          </section>
        ))}
      </div>
      <pre>{`# 中央服务端
pnpm start

# 其它服务器上的 MCP 适配器
npm install -g @gavin7758521/functree-mcp
FUNCTREE_SERVER_URL=http://192.168.124.82:4174 functree-mcp

# 调试 HTTP 工具
POST /api/mcp/call
{
  "name": "functree_query_context",
  "arguments": { "projectId": "proj_your_app", "types": ["map", "entry_point"], "keyword": "backend.bots", "limit": 100 }
}`}</pre>
    </section>
  );
}

function WorkbenchHeader({ icon: Icon, title, count, action }: { icon: LucideIcon; title: string; count: string; action?: ReactNode }) {
  return (
    <div className="workHeader">
      <div>
        <span className="workIcon">
          <Icon size={18} />
        </span>
        <h2>{title}</h2>
        <small>{count}</small>
      </div>
      {action}
    </div>
  );
}

function CreatorSlot({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={open ? 'creatorSlot open' : 'creatorSlot'}>
      <button type="button" className="creatorToggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Plus size={16} />
        <span>{label}</span>
        <ChevronDown size={15} />
      </button>
      {open ? <div className="creatorBody">{children}</div> : null}
    </div>
  );
}

function MapRows({
  maps,
  labels,
  selectedId,
  onSelect
}: {
  maps: FuncMap[];
  labels: Catalog['labels'] | undefined;
  selectedId?: string;
  onSelect?: (mapId: string) => void;
}) {
  return (
    <div className="table mapTable">
      {maps.map((map) => {
        const content = (
          <>
            <strong>{map.name}</strong>
            <span>{labels?.mapAxis[map.axis] ?? map.axis}</span>
            <span>{labels?.mapScope[map.scope] ?? map.scope}</span>
            <em>{labels?.mapStatus[map.status] ?? map.status}</em>
            <small>{map.stableKey}</small>
          </>
        );
        return onSelect ? (
          <button type="button" className={map.id === selectedId ? 'row active' : 'row'} key={map.id} onClick={() => onSelect(map.id)}>
            {content}
          </button>
        ) : (
          <div className="row" key={map.id}>
            {content}
          </div>
        );
      })}
      {maps.length === 0 ? <EmptyState title="暂无功能地图" /> : null}
    </div>
  );
}

function EntryPointRows({
  entryPoints,
  tree,
  labels,
  selectedId,
  onSelect
}: {
  entryPoints: EntryPoint[];
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedId?: string;
  onSelect: (entryPointId: string) => void;
}) {
  return (
    <div className="table entryTable">
      {entryPoints.map((entryPoint) => (
        <button type="button" className={entryPoint.id === selectedId ? 'row active' : 'row'} key={entryPoint.id} onClick={() => onSelect(entryPoint.id)}>
          <strong>{entryPoint.name}</strong>
          <span>{labels?.entryPointKind[entryPoint.kind] ?? entryPoint.kind}</span>
          <span>{mapName(tree, entryPoint.mapId)}</span>
          <small>{entryPoint.path}</small>
          <code>{entryPoint.stableKey}</code>
        </button>
      ))}
      {entryPoints.length === 0 ? <EmptyState title="暂无入口文件" /> : null}
    </div>
  );
}

function CodeReferenceRows({
  references,
  tree,
  labels,
  selectedId,
  onSelect
}: {
  references: CodeReference[];
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  selectedId?: string;
  onSelect: (codeReferenceId: string) => void;
}) {
  return (
    <div className="table referenceTable">
      {references.map((reference) => (
        <button type="button" className={reference.id === selectedId ? 'row active' : 'row'} key={reference.id} onClick={() => onSelect(reference.id)}>
          <strong>{reference.symbol || reference.path}</strong>
          <span>{labels?.codeReferenceKind[reference.kind] ?? reference.kind}</span>
          <span>{mapName(tree, reference.mapId)}</span>
          <small>{reference.path}</small>
          <code>{reference.stableKey || reference.id}</code>
        </button>
      ))}
      {references.length === 0 ? <EmptyState title="暂无代码引用" /> : null}
    </div>
  );
}

function MapDetail({ tree, map, labels }: { tree: ProjectTree; map: FuncMap | undefined; labels: Catalog['labels'] | undefined }) {
  if (!map) return <EmptyState title="未选择功能地图" />;
  const featureCount = flattenFeatures(map.features ?? []).length;
  const entryCount = tree.entryPoints.filter((entryPoint) => entryPoint.mapId === map.id).length;
  const referenceCount = tree.codeReferences.filter((reference) => reference.mapId === map.id).length;
  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>{map.name}</h2>
        <span>{labels?.mapAxis[map.axis] ?? map.axis}</span>
      </div>
      <Description value={map.description} empty="暂无功能地图说明" />
      <InfoGrid
        items={[
          ['ID', map.id],
          ['稳定键', map.stableKey],
          ['版本', map.version],
          ['范围', labels?.mapScope[map.scope] ?? map.scope],
          ['类型', labels?.mapKind[map.kind] ?? map.kind],
          ['状态', labels?.mapStatus[map.status] ?? map.status],
          ['负责人', map.owner || '未设置'],
          ['功能', String(featureCount)],
          ['入口', String(entryCount)],
          ['引用', String(referenceCount)]
        ]}
      />
      <TagList values={map.tags} />
    </section>
  );
}

function FeatureDetail({
  tree,
  feature,
  labels,
  alignments,
  codeReferences,
  evidence
}: {
  tree: ProjectTree;
  feature: Feature | undefined;
  labels: Catalog['labels'] | undefined;
  alignments: Alignment[];
  codeReferences: CodeReference[];
  evidence: Evidence[];
}) {
  if (!feature) return <EmptyState title="未选择功能" />;
  const details = feature.details;
  const hasDetails = hasFeatureDetails(details);
  const detailCount = details ? featureDetailFieldCount(details) : 0;
  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>{feature.name}</h2>
        <span>{labels?.featureStatus[feature.status] ?? feature.status}</span>
      </div>
      <Description value={feature.description} empty="暂无功能说明" />
      <div className="featureSignalStrip">
        <Signal label="详情" value={detailCount} />
        <Signal label="引用" value={codeReferences.length} />
        <Signal label="证据" value={evidence.length} />
        <Signal label="对齐" value={alignments.length} />
      </div>
      <InfoGrid
        items={[
          ['ID', feature.id],
          ['功能地图', mapName(tree, feature.mapId)],
          ['稳定键', feature.stableKey],
          ['版本', feature.version],
          ['类型', feature.kind],
          ['父功能', feature.parentFeatureId ?? '无'],
          ['子功能', String(feature.children?.length ?? 0)]
        ]}
      />
      <TagList values={feature.tags} />
      {hasDetails ? (
        <div className="detailStack">
          <DetailText title="意图" value={details?.intent} />
          <DetailText title="当前行为" value={details?.currentBehavior} />
          <DetailText title="目标行为" value={details?.expectedBehavior} />
          <DetailText title="范围" value={details?.scope} />
          <DetailList title="已知缺口" values={details?.knownGaps} />
          <DetailList title="未决问题" values={details?.openQuestions} />
          <DetailList title="验收条件" values={details?.acceptanceCriteria} />
          <DetailList title="风险" values={details?.risks} />
          <DetailText title="阻塞" value={details?.blocker} />
          <DetailText title="替代能力" value={details?.replacement} />
          <DetailText title="废弃原因" value={details?.deprecatedReason} />
          <DetailText title="Mock 边界" value={details?.mockBoundary} />
          <DetailText title="最后验证" value={verificationText(details)} />
          <DetailMarkdown value={details?.detailsMarkdown} />
        </div>
      ) : (
        <div className="emptyDetailBlock">
          <strong>暂无深度详情</strong>
          <span>{feature.status === 'released' || feature.status === 'completed' ? '已上线功能可保持轻量事实索引。' : '当前状态适合补充意图、范围、缺口、验收和风险。'}</span>
        </div>
      )}
      <div className="detailBlock">
        <h3>代码引用</h3>
        <div className="referenceCards">
          {codeReferences.map((reference) => (
            <article key={reference.id} className="referenceCard">
              <header>
                <strong>{reference.symbol || reference.path}</strong>
                <span>{codeReferenceRoleLabel(reference, labels)}</span>
              </header>
              <small>{reference.path}{lineRange(reference) === '未设置' ? '' : `:${lineRange(reference)}`}</small>
              <DetailText title="修改提示" value={reference.changeGuidance} compact />
              <DetailText title="验证提示" value={reference.verificationHint} compact />
              <DetailText title="影响范围" value={reference.blastRadius} compact />
            </article>
          ))}
          {codeReferences.length === 0 ? <small>暂无</small> : null}
        </div>
      </div>
      <div className="detailBlock">
        <h3>证据</h3>
        <div className="evidenceList">
          {evidence.map((item) => (
            <article key={item.id} className="evidenceItem">
              <strong>{labels?.evidenceType[item.evidenceType] ?? item.evidenceType}</strong>
              <span>{item.summary || item.symbol || item.path || item.id}</span>
              <small>{evidenceMeta(item)}</small>
            </article>
          ))}
          {evidence.length === 0 ? <small>暂无</small> : null}
        </div>
      </div>
      <div className="detailBlock">
        <h3>相关对齐</h3>
        {alignments.map((alignment) => (
          <span key={alignment.id}>{alignment.name} / {labels?.alignmentRelation[alignment.relation] ?? alignment.relation}</span>
        ))}
        {alignments.length === 0 ? <small>暂无</small> : null}
      </div>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

function DetailText({ title, value, compact = false }: { title: string; value: string | undefined; compact?: boolean }) {
  if (!value) return null;
  return (
    <section className={compact ? 'detailText compact' : 'detailText'}>
      <h3>{title}</h3>
      <p>{value}</p>
    </section>
  );
}

function DetailList({ title, values }: { title: string; values: string[] | undefined }) {
  if (!values?.length) return null;
  return (
    <section className="detailText">
      <h3>{title}</h3>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}

function DetailMarkdown({ value }: { value: string | undefined }) {
  if (!value) return null;
  return (
    <section className="detailText markdownDetail">
      <h3>详情正文</h3>
      <p>{value}</p>
    </section>
  );
}

function EntryPointDetail({ entryPoint, tree, labels }: { entryPoint: EntryPoint | undefined; tree: ProjectTree; labels: Catalog['labels'] | undefined }) {
  if (!entryPoint) return <EmptyState title="未选择入口文件" />;
  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>{entryPoint.name}</h2>
        <span>{labels?.entryPointKind[entryPoint.kind] ?? entryPoint.kind}</span>
      </div>
      <Description value={entryPoint.description} empty="暂无入口说明" />
      <InfoGrid
        items={[
          ['ID', entryPoint.id],
          ['功能地图', mapName(tree, entryPoint.mapId)],
          ['稳定键', entryPoint.stableKey],
          ['路径', entryPoint.path],
          ['置信度', entryPoint.confidence.toFixed(2)]
        ]}
      />
    </section>
  );
}

function CodeReferenceDetail({ reference, tree, labels }: { reference: CodeReference | undefined; tree: ProjectTree; labels: Catalog['labels'] | undefined }) {
  if (!reference) return <EmptyState title="未选择代码引用" />;
  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>{reference.symbol || reference.path}</h2>
        <span>{labels?.codeReferenceKind[reference.kind] ?? reference.kind}</span>
      </div>
      <Description value={reference.description} empty="暂无引用说明" />
      <InfoGrid
        items={[
          ['ID', reference.id],
          ['功能地图', mapName(tree, reference.mapId)],
          ['功能', featureName(tree, reference.featureId)],
          ['入口文件', entryPointName(tree, reference.entryPointId)],
          ['稳定键', reference.stableKey || '未设置'],
          ['路径', reference.path],
          ['符号', reference.symbol || '无'],
          ['角色', codeReferenceRoleLabel(reference, labels)],
          ['行号', lineRange(reference)]
        ]}
      />
      <div className="detailStack compactStack">
        <DetailText title="修改提示" value={reference.changeGuidance} />
        <DetailText title="验证提示" value={reference.verificationHint} />
        <DetailText title="影响范围" value={reference.blastRadius} />
      </div>
    </section>
  );
}

function AlignmentDetail({ alignment, labels }: { alignment: Alignment | undefined; labels: Catalog['labels'] | undefined }) {
  if (!alignment) return <EmptyState title="未选择对齐关系" />;
  return (
    <section className="panel inspectorPanel">
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

function MapCreator({ projectId, onCreated }: { projectId: string; onCreated: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [axis, setAxis] = useState('web');
  const [scope, setScope] = useState('implementation');
  const [kind, setKind] = useState('app');
  const [version, setVersion] = useState('当前');
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!projectId || !stableKey.trim()) return;
        await postJson(`/api/projects/${projectId}/maps`, { name, stableKey, axis, scope, kind, version, status: 'normal' });
        setName('');
        setStableKey('');
        await onCreated();
      }}
    >
      <h3>新建功能地图</h3>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称，例如 Web 聊天界面" required />
      <input value={stableKey} onChange={(event) => setStableKey(event.target.value)} placeholder="稳定键，例如 web.chat-ui" required />
      <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="版本" required />
      <div className="formGrid">
        <select value={axis} onChange={(event) => setAxis(event.target.value)}>
          <option value="product">产品</option>
          <option value="web">前端</option>
          <option value="backend">后端</option>
          <option value="sdk">SDK</option>
          <option value="ops">运维</option>
          <option value="data">数据</option>
          <option value="test">测试</option>
          <option value="docs">文档</option>
        </select>
        <select value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="capability">能力</option>
          <option value="implementation">实现</option>
          <option value="contract">契约</option>
          <option value="operation">运维</option>
          <option value="validation">验证</option>
          <option value="documentation">文档</option>
        </select>
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="domain">领域</option>
          <option value="app">应用</option>
          <option value="service">服务</option>
          <option value="package">包</option>
          <option value="module">模块</option>
          <option value="api">API</option>
          <option value="database">数据库</option>
          <option value="deployment">部署</option>
          <option value="test_suite">测试集</option>
        </select>
      </div>
      <button type="submit">
        <Plus size={16} />
        <span>保存地图</span>
      </button>
    </form>
  );
}

function FeatureCreator({ tree, selectedMapId, onCreated }: { tree: ProjectTree; selectedMapId: string; onCreated: () => Promise<void> }) {
  const [mapId, setMapId] = useState('');
  const [parentFeatureId, setParentFeatureId] = useState('');
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [version, setVersion] = useState('当前');
  const targetMapId = mapId || selectedMapId || tree.maps[0]?.id || '';
  const parentOptions = flattenFeatures(tree.maps.find((map) => map.id === targetMapId)?.features ?? []);
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!targetMapId) return;
        await postJson(`/api/maps/${targetMapId}/features`, {
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
      <select value={targetMapId} onChange={(event) => setMapId(event.target.value)} disabled={tree.maps.length === 0}>
        {tree.maps.map((map) => (
          <option key={map.id} value={map.id}>
            {map.name} / {map.stableKey}
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
      <input value={stableKey} onChange={(event) => setStableKey(event.target.value)} placeholder="稳定键，例如 send-message" required />
      <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="功能版本" required />
      <button type="submit" disabled={!targetMapId}>
        <Plus size={16} />
        <span>保存功能</span>
      </button>
    </form>
  );
}

function EntryPointCreator({ tree, onCreated }: { tree: ProjectTree; onCreated: () => Promise<void> }) {
  const [mapId, setMapId] = useState('');
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [path, setPath] = useState('');
  const [kind, setKind] = useState('app_root');
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        await postJson(`/api/projects/${tree.project.id}/entry-points`, {
          mapId: mapId || undefined,
          name,
          stableKey,
          path,
          kind,
          confidence: 1
        });
        setName('');
        setStableKey('');
        setPath('');
        await onCreated();
      }}
    >
      <h3>新建入口文件</h3>
      <select value={mapId} onChange={(event) => setMapId(event.target.value)}>
        <option value="">不绑定地图</option>
        {tree.maps.map((map) => (
          <option key={map.id} value={map.id}>
            {map.name} / {map.stableKey}
          </option>
        ))}
      </select>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称，例如 App 入口" required />
      <input value={stableKey} onChange={(event) => setStableKey(event.target.value)} placeholder="稳定键，例如 web.app-root" required />
      <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="路径，例如 src/main.tsx" required />
      <select value={kind} onChange={(event) => setKind(event.target.value)}>
        <option value="app_root">应用入口</option>
        <option value="router">路由入口</option>
        <option value="server_bootstrap">服务启动</option>
        <option value="http_api_root">HTTP API 入口</option>
        <option value="cli">CLI</option>
        <option value="config">配置</option>
        <option value="schema">Schema</option>
        <option value="deployment">部署</option>
        <option value="test">测试</option>
      </select>
      <button type="submit">
        <Plus size={16} />
        <span>保存入口</span>
      </button>
    </form>
  );
}

function CodeReferenceCreator({ tree, onCreated }: { tree: ProjectTree; onCreated: () => Promise<void> }) {
  const [mapId, setMapId] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [entryPointId, setEntryPointId] = useState('');
  const [path, setPath] = useState('');
  const [symbol, setSymbol] = useState('');
  const [kind, setKind] = useState('function');
  const selectedMapId = mapId || tree.maps[0]?.id || '';
  const featureOptions = selectedMapId ? flattenFeatures(tree.maps.find((map) => map.id === selectedMapId)?.features ?? []) : [];
  const entryOptions = selectedMapId ? tree.entryPoints.filter((entryPoint) => !entryPoint.mapId || entryPoint.mapId === selectedMapId) : tree.entryPoints;
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        await postJson(`/api/projects/${tree.project.id}/code-references`, {
          mapId: selectedMapId || undefined,
          featureId: featureId || undefined,
          entryPointId: entryPointId || undefined,
          path,
          symbol: symbol || undefined,
          kind
        });
        setFeatureId('');
        setEntryPointId('');
        setPath('');
        setSymbol('');
        await onCreated();
      }}
    >
      <h3>新建代码引用</h3>
      <select value={selectedMapId} onChange={(event) => setMapId(event.target.value)} disabled={tree.maps.length === 0}>
        {tree.maps.map((map) => (
          <option key={map.id} value={map.id}>
            {map.name} / {map.stableKey}
          </option>
        ))}
      </select>
      <select value={featureId} onChange={(event) => setFeatureId(event.target.value)}>
        <option value="">不绑定功能</option>
        {featureOptions.map((feature) => (
          <option key={feature.id} value={feature.id}>
            {feature.name} / {feature.stableKey}
          </option>
        ))}
      </select>
      <select value={entryPointId} onChange={(event) => setEntryPointId(event.target.value)}>
        <option value="">不绑定入口</option>
        {entryOptions.map((entryPoint) => (
          <option key={entryPoint.id} value={entryPoint.id}>
            {entryPoint.name} / {entryPoint.path}
          </option>
        ))}
      </select>
      <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="路径，例如 src/App.tsx" required />
      <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="符号，例如 Composer" />
      <select value={kind} onChange={(event) => setKind(event.target.value)}>
        <option value="file">文件</option>
        <option value="function">函数</option>
        <option value="component">组件</option>
        <option value="api">API</option>
        <option value="route">路由</option>
        <option value="table">表</option>
        <option value="migration">迁移</option>
        <option value="config">配置</option>
        <option value="test">测试</option>
      </select>
      <button type="submit" disabled={!selectedMapId}>
        <Plus size={16} />
        <span>保存引用</span>
      </button>
    </form>
  );
}

function AlignmentCreator({ tree, onCreated }: { tree: ProjectTree; onCreated: () => Promise<void> }) {
  const alignables = buildAlignables(tree);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const a = first || alignables[0]?.value || '';
  const b = second || alignables[1]?.value || '';
  return (
    <form
      className="editorPanel"
      onSubmit={async (event) => {
        event.preventDefault();
        const firstItem = alignables.find((item) => item.value === a);
        const secondItem = alignables.find((item) => item.value === b);
        if (!firstItem || !secondItem || firstItem.value === secondItem.value) return;
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
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <select value={b} onChange={(event) => setSecond(event.target.value)}>
        {alignables.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={alignables.length < 2 || a === b}>
        <Link2 size={16} />
        <span>保存对齐</span>
      </button>
    </form>
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
        {hasChildren ? (
          <button className="treeToggle" type="button" onClick={() => onToggle(feature.id)} aria-label={expanded ? '收起' : '展开'}>
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <span className="treeSpacer" />
        )}
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

function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <section className="emptyState">
      <strong>{title}</strong>
      {action}
    </section>
  );
}

function TagList({ values }: { values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="tagList">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}

function hasFeatureDetails(details: FeatureDetailData | undefined): details is FeatureDetailData {
  return featureDetailFieldCount(details) > 0;
}

function featureDetailFieldCount(details: FeatureDetailData | undefined): number {
  if (!details) return 0;
  return [
    details.intent,
    details.currentBehavior,
    details.expectedBehavior,
    details.scope,
    details.blocker,
    details.replacement,
    details.deprecatedReason,
    details.mockBoundary,
    details.detailsMarkdown,
    details.lastVerifiedAt,
    details.lastVerifiedCommit,
    ...details.knownGaps,
    ...details.openQuestions,
    ...details.acceptanceCriteria,
    ...details.risks
  ].filter(Boolean).length;
}

function verificationText(details: FeatureDetailData | undefined): string {
  if (!details?.lastVerifiedAt && !details?.lastVerifiedCommit) return '';
  return [details.lastVerifiedAt, details.lastVerifiedCommit].filter(Boolean).join(' / ');
}

function evidenceMeta(item: Evidence): string {
  const location = item.path ? `${item.path}${item.lineStart ? `:${item.lineStart}${item.lineEnd ? `-${item.lineEnd}` : ''}` : ''}` : '';
  const commit = item.commitSha ? `commit ${item.commitSha}` : '';
  const confidence = Number.isFinite(item.confidence) ? `置信度 ${item.confidence.toFixed(2)}` : '';
  return [location, commit, confidence].filter(Boolean).join(' / ') || item.targetType;
}

function codeReferenceRoleLabel(reference: CodeReference, labels: Catalog['labels'] | undefined): string {
  if (reference.roleInFeature) return labels?.codeReferenceRoleInFeature[reference.roleInFeature] ?? reference.roleInFeature;
  return labels?.codeReferenceKind[reference.kind] ?? reference.kind;
}

function flattenFeatures(features: Feature[]): Feature[] {
  return features.flatMap((feature) => [feature, ...flattenFeatures(feature.children ?? [])]);
}

function mapName(tree: ProjectTree, mapId: string | null): string {
  if (!mapId) return '未绑定';
  return tree.maps.find((map) => map.id === mapId)?.name ?? mapId;
}

function featureName(tree: ProjectTree, featureId: string | null): string {
  if (!featureId) return '未绑定';
  return tree.maps.flatMap((map) => flattenFeatures(map.features ?? [])).find((feature) => feature.id === featureId)?.name ?? featureId;
}

function entryPointName(tree: ProjectTree, entryPointId: string | null): string {
  if (!entryPointId) return '未绑定';
  return tree.entryPoints.find((entryPoint) => entryPoint.id === entryPointId)?.name ?? entryPointId;
}

function lineRange(reference: CodeReference): string {
  if (!reference.lineStart) return '未设置';
  return reference.lineEnd ? `${reference.lineStart}-${reference.lineEnd}` : String(reference.lineStart);
}

function targetTypeLabel(type: string): string {
  if (type === 'project') return '项目';
  if (type === 'map') return '功能地图';
  if (type === 'feature') return '功能';
  if (type === 'entry_point') return '入口文件';
  if (type === 'code_reference') return '代码引用';
  return type;
}

function buildAlignables(tree: ProjectTree) {
  return [
    { id: tree.project.id, value: `project:${tree.project.id}`, label: `项目：${tree.project.name}`, type: 'project' },
    ...tree.maps.map((map) => ({ id: map.id, value: `map:${map.id}`, label: `地图：${map.name}`, type: 'map' })),
    ...tree.maps.flatMap((map) => flattenFeatures(map.features ?? []).map((feature) => ({ id: feature.id, value: `feature:${feature.id}`, label: `功能：${feature.name}`, type: 'feature' }))),
    ...tree.entryPoints.map((entryPoint) => ({ id: entryPoint.id, value: `entry_point:${entryPoint.id}`, label: `入口：${entryPoint.name}`, type: 'entry_point' })),
    ...tree.codeReferences.map((reference) => ({ id: reference.id, value: `code_reference:${reference.id}`, label: `引用：${reference.symbol || reference.path}`, type: 'code_reference' }))
  ];
}

function readViewFromUrl(): View {
  const value = new URLSearchParams(window.location.search).get('view');
  return value && viewIds.has(value as View) ? (value as View) : 'overview';
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
