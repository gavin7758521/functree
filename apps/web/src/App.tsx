import {
  BookOpen,
  Braces,
  ChevronDown,
  ChevronRight,
  Check,
  Code2,
  Compass,
  Copy,
  FileCode2,
  FileSearch,
  GitBranch,
  GitMerge,
  Layers3,
  Link2,
  Map as MapIcon,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  Target,
  TriangleAlert,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Alignment, CapabilityGap, CapabilityStatus, Catalog, CodeReference, EntryPoint, Evidence, Feature, FeatureDetail as FeatureDetailData, FeatureDossier, FeatureFocus, FeatureFocusStartResult, FeatureReadiness, FeatureSearchResult, FuncMap, Overview, PreparedFeatureWork, ProgrammingContext, Project, ProjectTree } from './types.js';

type View = 'dossier' | 'overview' | 'maps' | 'features' | 'entryPoints' | 'references' | 'alignments' | 'mcp';

type ViewMeta = { id: View; label: string; icon: LucideIcon; group: '功能优先' | '项目视角' | '代码视角' | '同步工具' };

const views: ViewMeta[] = [
  { id: 'dossier', label: '功能档案', icon: Target, group: '功能优先' },
  { id: 'features', label: '功能树', icon: Network, group: '功能优先' },
  { id: 'overview', label: '项目总览', icon: Layers3, group: '项目视角' },
  { id: 'maps', label: '功能地图', icon: MapIcon, group: '项目视角' },
  { id: 'alignments', label: '对齐关系', icon: GitMerge, group: '项目视角' },
  { id: 'entryPoints', label: '入口文件', icon: FileCode2, group: '代码视角' },
  { id: 'references', label: '代码引用', icon: Code2, group: '代码视角' },
  { id: 'mcp', label: 'MCP 与同步', icon: Braces, group: '同步工具' }
];

const mcpToolGroups = [
  {
    name: '查询',
    tools: ['functree_query_context', 'functree_search_features', 'functree_prepare_feature_work', 'functree_query_feature_focuses', 'functree_resolve_stable_keys', 'functree_project_summary', 'functree_get_feature_dossier', 'functree_get_feature_readiness', 'functree_get_capability_matrix', 'functree_get_programming_context', 'functree_quality_report', 'functree_query_path_context']
  },
  {
    name: '写入',
    tools: ['functree_create_project', 'functree_start_feature_focus', 'functree_upsert_feature_focus', 'functree_upsert_feature_dossier', 'functree_upsert_map', 'functree_upsert_feature', 'functree_upsert_entry_point', 'functree_upsert_code_reference', 'functree_upsert_evidence', 'functree_upsert_capability_status', 'functree_upsert_capability_gap', 'functree_upsert_alignment']
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

const capabilityImplementationStatuses = ['unknown', 'none', 'not_needed', 'prototype', 'spec', 'approved', 'mock', 'partial', 'live', 'configured', 'deployed', 'deprecated'] as const;
const capabilityGapTypes = [
  'naming_conflict',
  'data_model_conflict',
  'entry_conflict',
  'status_conflict',
  'permission_conflict',
  'persistence_conflict',
  'mock_gap',
  'implementation_gap',
  'integration_gap',
  'behavior_conflict',
  'alias_conflict',
  'coverage_gap',
  'other'
] as const;
const capabilityGapSeverities = ['high', 'medium', 'low'] as const;
const capabilityGapStatuses = ['open', 'accepted', 'resolved', 'ignored'] as const;
const featureFocusModes = ['discover', 'analyze', 'implement', 'verify', 'maintain'] as const;
const featureFocusStatuses = ['open', 'in_progress', 'paused', 'ready_for_implementation', 'implemented', 'closed', 'archived'] as const;
const featureFocusPriorities = ['high', 'medium', 'low'] as const;
const featureFocusSourceTypes = ['user_request', 'product_doc', 'code_scan', 'bug', 'refactor', 'research', 'other'] as const;

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
  const [dossierKeyword, setDossierKeyword] = useState('');
  const [featureDossier, setFeatureDossier] = useState<FeatureDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierRefreshKey, setDossierRefreshKey] = useState(0);
  const [programmingContext, setProgrammingContext] = useState<ProgrammingContext | null>(null);
  const [programmingContextLoading, setProgrammingContextLoading] = useState(false);
  const [featureReadiness, setFeatureReadiness] = useState<FeatureReadiness | null>(null);
  const [featureReadinessLoading, setFeatureReadinessLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh(projectId = selectedProjectId) {
    setMessage('');
    const [catalogData, overviewData] = await Promise.all([fetchJson<Catalog>('/api/catalog'), fetchJson<Overview>('/api/overview')]);
    setCatalog(catalogData);
    setOverview(overviewData);
    const urlProjectId = readProjectIdFromUrl();
    const targetProjectId = projectId || (urlProjectId && overviewData.projects.some((project) => project.id === urlProjectId) ? urlProjectId : '') || overviewData.projects[0]?.id || '';
    setSelectedProjectId(targetProjectId);
    replaceUrlParams({ projectId: targetProjectId || null });
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
    replaceUrlParams({ view: nextView });
  }

  const allFeatures = useMemo(() => tree?.maps.flatMap((map) => flattenFeatures(map.features ?? [])) ?? [], [tree]);

  useEffect(() => {
    if (!tree || !selectedFeatureId) return;
    replaceUrlParams({ featureId: selectedFeatureId });
  }, [selectedFeatureId, tree]);

  useEffect(() => {
    if (!selectedProjectId || !selectedFeatureId) {
      setFeatureDossier(null);
      setProgrammingContext(null);
      setFeatureReadiness(null);
      return;
    }
    let cancelled = false;
    setDossierLoading(true);
    setProgrammingContextLoading(true);
    setFeatureReadinessLoading(true);
    setFeatureReadiness(null);
    postJson<FeatureDossier>(`/api/projects/${selectedProjectId}/feature-dossier`, { featureId: selectedFeatureId, depth: 2 })
      .then((data) => {
        if (!cancelled) setFeatureDossier(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFeatureDossier(null);
          setMessage(error instanceof Error ? error.message : '功能档案加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setDossierLoading(false);
      });
    postJson<ProgrammingContext>(`/api/projects/${selectedProjectId}/programming-context`, {
      featureId: selectedFeatureId,
      depth: 2,
      include: ['entryPoints', 'codeReferences', 'alignments', 'risks', 'acceptanceCriteria', 'evidence', 'details', 'quality', 'statusMatrix', 'gaps', 'focuses']
    })
      .then((data) => {
        if (!cancelled) setProgrammingContext(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProgrammingContext(null);
          setMessage(error instanceof Error ? error.message : 'AI 编程上下文加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setProgrammingContextLoading(false);
      });
    postJson<FeatureReadiness>(`/api/projects/${selectedProjectId}/feature-readiness`, {
      featureId: selectedFeatureId,
      requiredAxes: ['product', 'web', 'backend']
    })
      .then((data) => {
        if (!cancelled) setFeatureReadiness(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFeatureReadiness(null);
          setMessage(error instanceof Error ? error.message : '功能就绪度加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setFeatureReadinessLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dossierRefreshKey, selectedFeatureId, selectedProjectId]);

  function selectMapForFeatureTree(mapId: string) {
    setSelectedMapId(mapId);
    const firstFeature = flattenFeatures(tree?.maps.find((map) => map.id === mapId)?.features ?? [])[0];
    if (firstFeature) setSelectedFeatureId(firstFeature.id);
  }

  function selectFeatureById(featureId: string) {
    setSelectedFeatureId(featureId);
    const feature = allFeatures.find((item) => item.id === featureId);
    if (feature) setSelectedMapId(feature.mapId);
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
      const requestedFeatureId = readFeatureIdFromUrl();
      const requestedFeature = allFeatures.find((feature) => feature.id === requestedFeatureId);
      setSelectedFeatureId(requestedFeature?.id ?? allFeatures[0]?.id ?? '');
      if (requestedFeature) setSelectedMapId(requestedFeature.mapId);
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

        {tree && view === 'dossier' && (
          <FeatureDossierView
            tree={tree}
            labels={labels}
            dossier={featureDossier}
            loading={dossierLoading}
            programmingContext={programmingContext}
            programmingContextLoading={programmingContextLoading}
            featureReadiness={featureReadiness}
            featureReadinessLoading={featureReadinessLoading}
            keyword={dossierKeyword}
            setKeyword={setDossierKeyword}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={selectFeatureById}
            onSelectMap={(mapId) => {
              setSelectedMapId(mapId);
              setView('features');
            }}
            onSelectCodeReference={(referenceId) => {
              setSelectedCodeReferenceId(referenceId);
              setView('references');
            }}
            onSaved={async () => {
              setMessage('功能详情已保存');
              await refresh(selectedProjectId);
              setDossierRefreshKey((value) => value + 1);
            }}
          />
        )}
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
            onSelectFeature={selectFeatureById}
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
  const allFeatures = tree?.maps.flatMap((map) => flattenFeatures(map.features ?? [])) ?? [];
  const selectedFeature = allFeatures.find((feature) => feature.id === selectedFeatureId) ?? allFeatures[0];
  const featureViews = views.filter((item) => item.group === '功能优先');
  const projectViews = views.filter((item) => item.group === '项目视角');
  const codeViews = views.filter((item) => item.group === '代码视角');
  const syncViews = views.filter((item) => item.group === '同步工具');

  return (
    <nav className="workspaceNav" aria-label="工作区">
      <section className="structureRail" aria-label="知识结构">
        <header>
          <Target size={15} />
          <span>功能优先</span>
        </header>
        <div className="structureSteps">
          <HierarchyStep
            active={view === 'dossier'}
            icon={Target}
            level="01"
            title="功能档案"
            primary={selectedFeature?.name ?? '暂无功能'}
            secondary={selectedFeature?.stableKey ?? ''}
            count={viewCount('dossier', tree, overview)}
            onSelect={() => onSelect('dossier')}
          />
          <span className="stepConnector" aria-hidden="true" />
          <HierarchyStep
            active={view === 'features'}
            icon={Network}
            level="02"
            title="功能树"
            primary="按功能扩展"
            secondary="从点入面"
            count={viewCount('features', tree, overview)}
            onSelect={() => onSelect('features')}
          />
          <span className="stepConnector" aria-hidden="true" />
          <HierarchyStep
            active={view === 'maps'}
            icon={MapIcon}
            level="03"
            title="功能地图"
            primary={selectedMap?.name ?? '上下文地图'}
            secondary={selectedMap?.stableKey ?? ''}
            count={viewCount('maps', tree, overview)}
            onSelect={() => onSelect('maps')}
          />
        </div>
        <div className="quickTabs">
          {featureViews.map((item) => (
            <MiniTab key={item.id} item={item} active={view === item.id} count={viewCount(item.id, tree, overview)} onSelect={onSelect} />
          ))}
        </div>
      </section>

      <SecondaryNavGroup title="项目视角" icon={BookOpen} items={projectViews} view={view} onSelect={onSelect} tree={tree} overview={overview} />
      <SecondaryNavGroup title="代码视角" icon={FileSearch} items={codeViews} view={view} onSelect={onSelect} tree={tree} overview={overview} />
      <SecondaryNavGroup title="同步工具" icon={GitBranch} items={syncViews} view={view} onSelect={onSelect} tree={tree} overview={overview} />
    </nav>
  );
}

function MiniTab({ item, active, count, onSelect }: { item: ViewMeta; active: boolean; count: string; onSelect: (view: View) => void }) {
  const Icon = item.icon;
  return (
    <button key={item.id} type="button" className={active ? 'miniTab active' : 'miniTab'} onClick={() => onSelect(item.id)} aria-current={active ? 'page' : undefined}>
      <Icon size={15} />
      <span>{item.label}</span>
      <small>{count}</small>
    </button>
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
  if (view === 'dossier') return String(tree?.maps.reduce((count, map) => count + flattenFeatures(map.features ?? []).length, 0) ?? 0);
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
        <Metric label="焦点" value={overview?.totals.openFeatureFocuses ?? 0} />
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
              ['对齐关系', String(tree.alignments.length)],
              ['当前焦点', String(overview?.totals.openFeatureFocuses ?? 0)]
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

function FeatureDossierView({
  tree,
  labels,
  dossier,
  loading,
  programmingContext,
  programmingContextLoading,
  featureReadiness,
  featureReadinessLoading,
  keyword,
  setKeyword,
  selectedFeatureId,
  onSelectFeature,
  onSelectMap,
  onSelectCodeReference,
  onSaved
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  dossier: FeatureDossier | null;
  loading: boolean;
  programmingContext: ProgrammingContext | null;
  programmingContextLoading: boolean;
  featureReadiness: FeatureReadiness | null;
  featureReadinessLoading: boolean;
  keyword: string;
  setKeyword: (value: string) => void;
  selectedFeatureId: string;
  onSelectFeature: (featureId: string) => void;
  onSelectMap: (mapId: string) => void;
  onSelectCodeReference: (referenceId: string) => void;
  onSaved: () => Promise<void>;
}) {
  const featureRows = tree.maps.flatMap((map) => flattenFeatures(map.features ?? []).map((feature) => ({ feature, map })));
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredRows = normalizedKeyword
    ? featureRows.filter(({ feature, map }) => `${feature.name} ${feature.stableKey} ${feature.description} ${feature.tags.join(' ')} ${map.name} ${map.stableKey}`.toLowerCase().includes(normalizedKeyword))
    : featureRows;
  const focus = dossier?.focus.feature ?? featureRows.find(({ feature }) => feature.id === selectedFeatureId)?.feature;
  const focusMap = dossier?.focus.map ?? featureRows.find(({ feature }) => feature.id === focus?.id)?.map;
  const details = focus?.details;

  return (
    <section className="content featureDossierContent">
      <aside className="dossierFeatureRail">
        <WorkbenchHeader
          icon={Target}
          title="重点功能"
          count={`${featureRows.length} 个`}
          action={
            <label className="search compactSearch">
              <Search size={16} />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索功能" />
            </label>
          }
        />
        <FeatureStartPanel tree={tree} labels={labels} onStarted={onSelectFeature} onSaved={onSaved} />
        <FeatureSearchPanel tree={tree} labels={labels} query={keyword} onSelectFeature={onSelectFeature} onSaved={onSaved} />
        <div className="featurePickList">
          {filteredRows.map(({ feature, map }) => (
            <button key={feature.id} type="button" className={feature.id === focus?.id ? 'featurePick active' : 'featurePick'} onClick={() => onSelectFeature(feature.id)}>
              <span className="mapAxisPill">{labels?.mapAxis[map.axis] ?? map.axis}</span>
              <strong>{feature.name}</strong>
              <small>{feature.stableKey}</small>
              <em>{map.name}</em>
            </button>
          ))}
          {filteredRows.length === 0 ? <EmptyState title="没有匹配功能" /> : null}
        </div>
      </aside>

      <section className="dossierMain">
        <div className="dossierHero">
          <div>
            <div className="eyebrow">
              <Target size={14} />
              <span>{loading ? '正在读取功能档案' : '功能档案'}</span>
            </div>
            <h2>{focus?.name ?? '请选择一个功能'}</h2>
            <p>{focus?.description || details?.intent || '从左侧选择一个功能，FuncTree 会围绕这个点展开产品、前端、后端、证据和缺口。'}</p>
          </div>
          {focus && focusMap ? (
            <button type="button" className="contextButton" onClick={() => onSelectMap(focusMap.id)}>
              <MapIcon size={16} />
              <span>{focusMap.name}</span>
              <small>{focusMap.stableKey}</small>
            </button>
          ) : null}
        </div>

        {focus ? (
          <>
            <div className="dossierSignals">
              <Signal label="实现切片" value={dossier?.implementationSlices.length ?? 0} />
              <Signal label="分析焦点" value={dossier?.summary.openFocusCount ?? dossier?.focuses.length ?? 0} />
              <Signal label="开放缺口" value={dossier?.summary.openGapCount ?? 0} />
              <Signal label="代码引用" value={dossier?.summary.codeReferenceCount ?? 0} />
              <Signal label="证据" value={dossier?.evidence.length ?? 0} />
            </div>

            <FeatureReadinessPanel readiness={featureReadiness} loading={featureReadinessLoading} labels={labels} />

            <DossierActionPlan dossier={dossier} labels={labels} onSelectCodeReference={onSelectCodeReference} />

            <FeatureFocusPanel tree={tree} dossier={dossier} labels={labels} onSelectFeature={onSelectFeature} onSaved={onSaved} />

            <ProgrammingContextPanel context={programmingContext} dossier={dossier} loading={programmingContextLoading} labels={labels} onSelectCodeReference={onSelectCodeReference} />

            <FeatureHandoffPanel dossier={dossier} context={programmingContext} loading={programmingContextLoading} />

            <DossierDefinitionPanel focus={focus} focusMap={focusMap} dossier={dossier} labels={labels} onSaved={onSaved} />

            <section className="panel dossierSection">
              <div className="sectionHeader">
                <h2>该改哪里</h2>
                <span>{dossier?.codeReferences.length ?? 0} 个引用</span>
              </div>
              <div className="referenceCards">
                {(dossier?.codeReferences ?? []).map((reference) => (
                  <button key={reference.id} type="button" className="referenceAction" onClick={() => onSelectCodeReference(reference.id)}>
                    <Code2 size={16} />
                    <span>
                      <strong>{reference.symbol || reference.path}</strong>
                      <small>{reference.path}{lineRange(reference) === '未设置' ? '' : `:${lineRange(reference)}`}</small>
                    </span>
                    <em>{codeReferenceRoleLabel(reference, labels)}</em>
                  </button>
                ))}
                {(dossier?.codeReferences.length ?? 0) === 0 ? <EmptyState title="暂无代码引用" /> : null}
              </div>
            </section>

            <section className="panel dossierSection">
              <div className="sectionHeader">
                <h2>证据</h2>
                <span>{dossier?.evidence.length ?? 0} 条</span>
              </div>
              <div className="evidenceTimeline">
                {(dossier?.evidence ?? []).map((item) => (
                  <article key={item.id} className="evidenceTimelineItem">
                    <strong>{labels?.evidenceSourceType[item.sourceType] ?? item.sourceType}</strong>
                    <span>{labels?.evidenceType[item.evidenceType] ?? item.evidenceType}</span>
                    <p>{item.summary || item.symbol || item.path || item.id}</p>
                    <small>{evidenceMeta(item)}</small>
                  </article>
                ))}
                {(dossier?.evidence.length ?? 0) === 0 ? <EmptyState title="暂无证据" /> : null}
              </div>
            </section>
          </>
        ) : (
          <EmptyState title="暂无功能" />
        )}
      </section>

      <aside className="dossierSide">
        <StatusMatrixPanel tree={tree} dossier={dossier} statuses={dossier?.implementationSlices ?? []} labels={labels} onSaved={onSaved} />
        <GapPanel tree={tree} dossier={dossier} gaps={dossier?.gaps ?? []} labels={labels} onSaved={onSaved} />
        <RelatedPanel dossier={dossier} labels={labels} />
      </aside>
    </section>
  );
}

function FeatureStartPanel({
  tree,
  labels,
  onStarted,
  onSaved
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  onStarted: (featureId: string) => void;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => featureStartFormState(tree));
  const canonicalMaps = tree.maps.filter((map) => map.axis === 'product' || map.axis === 'capability');
  const mapOptions = canonicalMaps.length > 0 ? canonicalMaps : tree.maps;
  const selectedMap = tree.maps.find((map) => map.id === form.mapId);

  useEffect(() => {
    setForm(featureStartFormState(tree));
  }, [tree.project.id]);

  function updateField(field: keyof FeatureStartFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function startFocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.featureName.trim() || !form.featureStableKey.trim()) {
      setError('功能名称和 stableKey 必填。');
      return;
    }
    const map = selectedMap;
    const canonicalMap = map
      ? {
          id: map.id,
          stableKey: map.stableKey,
          name: map.name,
          version: map.version,
          axis: map.axis,
          scope: map.scope,
          kind: map.kind,
          status: map.status,
          description: map.description,
          owner: map.owner,
          tags: map.tags
        }
      : {
          stableKey: form.mapStableKey || 'product.focus',
          name: form.mapName || '产品功能',
          axis: 'product',
          scope: 'capability',
          kind: 'domain'
        };
    setSaving(true);
    setError('');
    try {
      const result = await postJson<FeatureFocusStartResult>(`/api/projects/${tree.project.id}/feature-focuses/start`, {
        canonicalMap,
        canonicalFeature: {
          stableKey: form.featureStableKey,
          name: form.featureName,
          status: 'draft',
          kind: 'capability',
          details: {
            intent: form.question,
            scope: '从这个功能点开始深挖，后续逐步补充产品、前端、后端、SDK、运维、证据和缺口。'
          }
        },
        focus: {
          sourceType: 'user_request',
          question: form.question,
          sourceRefs: linesToList(form.sourceRefs),
          seedPaths: linesToList(form.seedPaths),
          targetMaps: map ? [{ mapId: map.id }] : [],
          nextSteps: linesToList(form.nextSteps)
        }
      });
      onStarted(result.feature.data.id);
      await onSaved();
      onStarted(result.feature.data.id);
      setForm(featureStartFormState(tree));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动功能焦点失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={open ? 'starterPanel open' : 'starterPanel'}>
      <button type="button" className="starterToggle" onClick={() => setOpen((value) => !value)}>
        <Plus size={15} />
        <span>从功能开始</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <form className="starterForm" onSubmit={startFocus}>
          <label>
            功能名称
            <input value={form.featureName} onChange={(event) => updateField('featureName', event.target.value)} placeholder="例如：发送文本消息" required />
          </label>
          <label>
            功能 stableKey
            <input value={form.featureStableKey} onChange={(event) => updateField('featureStableKey', event.target.value)} placeholder="message.send-text" required />
          </label>
          <label>
            Canonical map
            {mapOptions.length > 0 ? (
              <select value={form.mapId} onChange={(event) => updateField('mapId', event.target.value)}>
                {mapOptions.map((map) => (
                  <option key={map.id} value={map.id}>
                    {labels?.mapAxis[map.axis] ?? map.axis} / {map.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="starterInlineFields">
                <input value={form.mapStableKey} onChange={(event) => updateField('mapStableKey', event.target.value)} placeholder="product.chat" />
                <input value={form.mapName} onChange={(event) => updateField('mapName', event.target.value)} placeholder="产品功能" />
              </div>
            )}
          </label>
          <label>
            本次问题
            <textarea value={form.question} onChange={(event) => updateField('question', event.target.value)} rows={2} placeholder="这次要弄清楚什么？" />
          </label>
          <label>
            种子路径
            <textarea value={form.seedPaths} onChange={(event) => updateField('seedPaths', event.target.value)} rows={2} placeholder="每行一个文档或代码路径" />
          </label>
          <label>
            来源引用
            <textarea value={form.sourceRefs} onChange={(event) => updateField('sourceRefs', event.target.value)} rows={2} placeholder="每行一个产品文档、工单或说明来源" />
          </label>
          <label>
            下一步
            <textarea value={form.nextSteps} onChange={(event) => updateField('nextSteps', event.target.value)} rows={2} placeholder="每行一个下一步" />
          </label>
          {error ? <p className="formError">{error}</p> : null}
          <button type="submit" disabled={saving}>
            <Target size={15} />
            <span>{saving ? '启动中' : '启动焦点'}</span>
          </button>
        </form>
      ) : null}
    </section>
  );
}

function DossierDefinitionPanel({
  focus,
  focusMap,
  dossier,
  labels,
  onSaved
}: {
  focus: Feature;
  focusMap: FuncMap | undefined;
  dossier: FeatureDossier | null;
  labels: Catalog['labels'] | undefined;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => featureDetailFormState(focus));
  const details = focus.details;

  useEffect(() => {
    setForm(featureDetailFormState(focus));
    setEditing(false);
  }, [focus.id]);

  function updateField(field: keyof FeatureDetailFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveFeatureDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await postJson(`/api/maps/${focus.mapId}/features`, {
        id: focus.id,
        parentFeatureId: focus.parentFeatureId,
        stableKey: focus.stableKey,
        name: form.name.trim() || focus.name,
        version: focus.version,
        status: form.status || focus.status,
        kind: focus.kind,
        description: form.description,
        tags: focus.tags,
        details: {
          intent: form.intent,
          currentBehavior: form.currentBehavior,
          expectedBehavior: form.expectedBehavior,
          scope: form.scope,
          knownGaps: linesToList(form.knownGaps),
          openQuestions: linesToList(form.openQuestions),
          acceptanceCriteria: linesToList(form.acceptanceCriteria),
          risks: linesToList(form.risks),
          blocker: form.blocker,
          replacement: form.replacement,
          deprecatedReason: form.deprecatedReason,
          mockBoundary: form.mockBoundary,
          detailsMarkdown: form.detailsMarkdown,
          lastVerifiedAt: form.lastVerifiedAt,
          lastVerifiedCommit: form.lastVerifiedCommit.trim() || undefined
        }
      });
      setEditing(false);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '功能详情保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel dossierSection definitionPanel">
      <div className="sectionHeader">
        <h2>功能定义</h2>
        <div className="headerActions">
          <span>{labels?.featureStatus[focus.status] ?? focus.status}</span>
          <button type="button" className="smallIconButton" onClick={() => setEditing((value) => !value)} aria-label={editing ? '关闭编辑' : '编辑功能定义'}>
            {editing ? <X size={15} /> : <Pencil size={15} />}
          </button>
        </div>
      </div>
      <InfoGrid
        items={[
          ['稳定键', focus.stableKey],
          ['所属地图', focusMap?.name ?? focus.mapId],
          ['类型', labels?.featureKind?.[focus.kind] ?? focus.kind],
          ['Canonical', dossier?.summary.isCanonical ? '是' : dossier?.canonicalFeature.name ?? '未解析']
        ]}
      />
      {editing ? (
        <form className="featureDetailEditor" onSubmit={saveFeatureDetails}>
          {error ? <div className="formError">{error}</div> : null}
          <div className="formGrid two">
            <label>
              <span>功能名称</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
            </label>
            <label>
              <span>状态</span>
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                <option value="draft">草稿</option>
                <option value="in_progress">进行中</option>
                <option value="reviewing">评审中</option>
                <option value="blocked">阻塞</option>
                <option value="completed">已完成</option>
                <option value="released">已上线</option>
                <option value="mock_only">仅 Mock</option>
                <option value="deprecated">已废弃</option>
                <option value="archived">已归档</option>
              </select>
            </label>
          </div>
          <label>
            <span>摘要</span>
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={2} />
          </label>
          <div className="formGrid two">
            <label>
              <span>意图</span>
              <textarea value={form.intent} onChange={(event) => updateField('intent', event.target.value)} rows={3} />
            </label>
            <label>
              <span>范围</span>
              <textarea value={form.scope} onChange={(event) => updateField('scope', event.target.value)} rows={3} />
            </label>
          </div>
          <div className="formGrid two">
            <label>
              <span>当前行为</span>
              <textarea value={form.currentBehavior} onChange={(event) => updateField('currentBehavior', event.target.value)} rows={4} />
            </label>
            <label>
              <span>目标行为</span>
              <textarea value={form.expectedBehavior} onChange={(event) => updateField('expectedBehavior', event.target.value)} rows={4} />
            </label>
          </div>
          <div className="formGrid two">
            <label>
              <span>验收条件</span>
              <textarea value={form.acceptanceCriteria} onChange={(event) => updateField('acceptanceCriteria', event.target.value)} rows={4} placeholder="每行一条" />
            </label>
            <label>
              <span>已知缺口</span>
              <textarea value={form.knownGaps} onChange={(event) => updateField('knownGaps', event.target.value)} rows={4} placeholder="每行一条" />
            </label>
          </div>
          <div className="formGrid two">
            <label>
              <span>风险</span>
              <textarea value={form.risks} onChange={(event) => updateField('risks', event.target.value)} rows={3} placeholder="每行一条" />
            </label>
            <label>
              <span>未决问题</span>
              <textarea value={form.openQuestions} onChange={(event) => updateField('openQuestions', event.target.value)} rows={3} placeholder="每行一条" />
            </label>
          </div>
          <div className="formGrid two">
            <label>
              <span>阻塞</span>
              <input value={form.blocker} onChange={(event) => updateField('blocker', event.target.value)} />
            </label>
            <label>
              <span>Mock 边界</span>
              <input value={form.mockBoundary} onChange={(event) => updateField('mockBoundary', event.target.value)} />
            </label>
          </div>
          <div className="formGrid two">
            <label>
              <span>替代能力</span>
              <input value={form.replacement} onChange={(event) => updateField('replacement', event.target.value)} />
            </label>
            <label>
              <span>废弃原因</span>
              <input value={form.deprecatedReason} onChange={(event) => updateField('deprecatedReason', event.target.value)} />
            </label>
          </div>
          <label>
            <span>详情正文</span>
            <textarea value={form.detailsMarkdown} onChange={(event) => updateField('detailsMarkdown', event.target.value)} rows={7} />
          </label>
          <div className="formGrid two">
            <label>
              <span>最后验证时间</span>
              <input value={form.lastVerifiedAt} onChange={(event) => updateField('lastVerifiedAt', event.target.value)} placeholder="例如 2026-07-13" />
            </label>
            <label>
              <span>最后验证 Commit</span>
              <input value={form.lastVerifiedCommit} onChange={(event) => updateField('lastVerifiedCommit', event.target.value)} placeholder="7-64 位十六进制" />
            </label>
          </div>
          <div className="editorActions">
            <button type="button" className="ghostButton" onClick={() => setEditing(false)} disabled={saving}>
              <X size={15} />
              <span>取消</span>
            </button>
            <button type="submit" disabled={saving}>
              <Save size={15} />
              <span>{saving ? '保存中' : '保存详情'}</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="detailStack">
            <DetailText title="意图" value={details?.intent} />
            <DetailText title="当前行为" value={details?.currentBehavior} />
            <DetailText title="目标行为" value={details?.expectedBehavior} />
            <DetailText title="范围" value={details?.scope} />
            <DetailList title="验收条件" values={details?.acceptanceCriteria} />
            <DetailList title="已知缺口" values={details?.knownGaps} />
            <DetailList title="风险" values={details?.risks} />
            <DetailMarkdown value={details?.detailsMarkdown} />
          </div>
          {!hasFeatureDetails(details) ? (
            <div className="emptyDetailBlock">
              <strong>这个功能还缺深度档案</strong>
              <span>建议补充意图、当前行为、目标行为、范围、验收条件和已知缺口。</span>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function DossierActionPlan({
  dossier,
  labels,
  onSelectCodeReference
}: {
  dossier: FeatureDossier | null;
  labels: Catalog['labels'] | undefined;
  onSelectCodeReference: (referenceId: string) => void;
}) {
  const entryPoints = (dossier?.entryPoints ?? []).slice(0, 4);
  const priorityReferences = [...(dossier?.codeReferences ?? [])]
    .sort((left, right) => codeReferencePriority(right) - codeReferencePriority(left))
    .slice(0, 5);
  const pendingSlices = (dossier?.implementationSlices ?? []).filter((slice) => !isResolvedImplementationStatus(slice.status)).slice(0, 4);
  const priorityGaps = (dossier?.gaps ?? [])
    .filter((gap) => gap.status === 'open')
    .sort((left, right) => gapSeverityRank(left.severity) - gapSeverityRank(right.severity))
    .slice(0, 4);

  return (
    <section className="panel dossierSection actionPlanPanel">
      <div className="sectionHeader">
        <h2>修改路线</h2>
        <span>{priorityReferences.length + entryPoints.length + priorityGaps.length} 条线索</span>
      </div>
      <div className="actionPlanGrid">
        <section className="routeBlock">
          <header>
            <FileSearch size={16} />
            <strong>入口</strong>
          </header>
          <div className="routeList">
            {entryPoints.map((entryPoint) => (
              <article key={entryPoint.id} className="routeItem">
                <strong>{entryPoint.name}</strong>
                <small>{labels?.entryPointKind[entryPoint.kind] ?? entryPoint.kind}</small>
                <em>{entryPoint.path}</em>
              </article>
            ))}
            {entryPoints.length === 0 ? <span className="routeEmpty">暂无入口</span> : null}
          </div>
        </section>

        <section className="routeBlock wide">
          <header>
            <Code2 size={16} />
            <strong>实现文件</strong>
          </header>
          <div className="routeList">
            {priorityReferences.map((reference) => (
              <button key={reference.id} type="button" className="routeItem clickable" onClick={() => onSelectCodeReference(reference.id)}>
                <strong>{reference.symbol || reference.path}</strong>
                <small>{codeReferenceRoleLabel(reference, labels)}</small>
                <em>{reference.path}{lineRange(reference) === '未设置' ? '' : `:${lineRange(reference)}`}</em>
                {reference.changeGuidance ? <p>{reference.changeGuidance}</p> : null}
                {reference.verificationHint ? <p>{reference.verificationHint}</p> : null}
                {reference.blastRadius ? <p>{reference.blastRadius}</p> : null}
              </button>
            ))}
            {priorityReferences.length === 0 ? <span className="routeEmpty">暂无实现文件</span> : null}
          </div>
        </section>

        <section className="routeBlock">
          <header>
            <Layers3 size={16} />
            <strong>待收敛</strong>
          </header>
          <div className="routeList">
            {pendingSlices.map((slice) => (
              <article key={slice.id} className="routeItem">
                <strong>{slice.map?.name ?? slice.mapId}</strong>
                <small>{labels?.capabilityImplementationStatus[slice.status] ?? slice.status}</small>
                <em>{slice.summary || slice.recommendedAction || slice.feature?.name || '暂无说明'}</em>
              </article>
            ))}
            {pendingSlices.length === 0 ? <span className="routeEmpty">暂无待收敛实现</span> : null}
          </div>
        </section>

        <section className="routeBlock wide">
          <header>
            <TriangleAlert size={16} />
            <strong>优先缺口</strong>
          </header>
          <div className="routeList">
            {priorityGaps.map((gap) => (
              <article key={gap.id} className={`routeItem gapRoute severity-${gap.severity}`}>
                <strong>{gap.title}</strong>
                <small>{labels?.capabilityGapSeverity[gap.severity] ?? gap.severity} / {labels?.capabilityGapType[gap.gapType] ?? gap.gapType}</small>
                <em>{gap.recommendedAction || gap.description || '暂无建议'}</em>
              </article>
            ))}
            {priorityGaps.length === 0 ? <span className="routeEmpty">暂无开放缺口</span> : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function FeatureSearchPanel({
  tree,
  labels,
  query,
  onSelectFeature,
  onSaved
}: {
  tree: ProjectTree;
  labels: Catalog['labels'] | undefined;
  query: string;
  onSelectFeature: (featureId: string) => void;
  onSaved: () => Promise<void>;
}) {
  const [result, setResult] = useState<FeatureSearchResult | null>(null);
  const [prepared, setPrepared] = useState<PreparedFeatureWork | null>(null);
  const [projectFocuses, setProjectFocuses] = useState<FeatureFocus[]>([]);
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [preparingFocusId, setPreparingFocusId] = useState('');
  const [focusesLoading, setFocusesLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const trimmedQuery = query.trim();

  useEffect(() => {
    void loadProjectFocuses();
  }, [tree.project.id]);

  useEffect(() => {
    setResult(null);
    setPrepared(null);
    setPreparingFocusId('');
    setError('');
  }, [tree.project.id, trimmedQuery]);

  async function loadProjectFocuses() {
    setFocusesLoading(true);
    try {
      const focuses = await fetchJson<FeatureFocus[]>(`/api/projects/${tree.project.id}/feature-focuses?limit=6`);
      setProjectFocuses(focuses.filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status)));
    } catch (err) {
      setProjectFocuses([]);
      setError(err instanceof Error ? err.message : '功能焦点加载失败');
    } finally {
      setFocusesLoading(false);
    }
  }

  async function runSearch() {
    if (!trimmedQuery) return;
    setLoading(true);
    setError('');
    try {
      const pathSearch = looksLikeCodePath(trimmedQuery);
      const searchResult = await postJson<FeatureSearchResult>(`/api/projects/${tree.project.id}/features/search`, pathSearch ? { path: trimmedQuery, pathMode: 'contains', limit: 8 } : { query: trimmedQuery, limit: 8 });
      setResult(searchResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : '功能发现失败');
    } finally {
      setLoading(false);
    }
  }

  async function prepareWork() {
    if (!trimmedQuery) return;
    setPreparing(true);
    setError('');
    try {
      const pathSearch = looksLikeCodePath(trimmedQuery);
      const preparedWork = await postJson<PreparedFeatureWork>(
        `/api/projects/${tree.project.id}/feature-work/prepare`,
        pathSearch ? { path: trimmedQuery, pathMode: 'contains', limit: 8 } : { query: trimmedQuery, limit: 8 }
      );
      setPrepared(preparedWork);
      if (preparedWork.search) setResult(preparedWork.search);
      if (preparedWork.readiness === 'ready' && preparedWork.selectedCandidate) {
        onSelectFeature(preparedWork.selectedCandidate.feature.id);
      }
    } catch (err) {
      setPrepared(null);
      setError(err instanceof Error ? err.message : '准备功能工作失败');
    } finally {
      setPreparing(false);
    }
  }

  async function prepareExistingFocus(focus: FeatureFocus) {
    setPreparingFocusId(focus.id);
    setError('');
    try {
      const preparedWork = await postJson<PreparedFeatureWork>(`/api/projects/${tree.project.id}/feature-work/prepare`, {
        focusId: focus.id,
        depth: 2
      });
      setPrepared(preparedWork);
      if (preparedWork.search) setResult(preparedWork.search);
      if (preparedWork.readiness === 'ready' && preparedWork.selectedCandidate) {
        onSelectFeature(preparedWork.selectedCandidate.feature.id);
      }
    } catch (err) {
      setPrepared(null);
      setError(err instanceof Error ? err.message : '准备功能焦点失败');
    } finally {
      setPreparingFocusId('');
    }
  }

  async function startSuggestedFocus() {
    const suggestion = prepared?.suggestedStart ?? result?.suggestedStart;
    if (!suggestion) return;
    const canonicalMap = tree.maps.find((map) => map.stableKey === suggestion.canonicalMapStableKey);
    setStarting(true);
    setError('');
    try {
      const started = await postJson<FeatureFocusStartResult>(`/api/projects/${tree.project.id}/feature-focuses/start`, {
        canonicalMap: canonicalMap
          ? {
              id: canonicalMap.id,
              stableKey: canonicalMap.stableKey,
              name: canonicalMap.name,
              version: canonicalMap.version,
              axis: canonicalMap.axis,
              scope: canonicalMap.scope,
              kind: canonicalMap.kind,
              status: canonicalMap.status,
              description: canonicalMap.description,
              owner: canonicalMap.owner,
              tags: canonicalMap.tags
            }
          : {
              stableKey: suggestion.canonicalMapStableKey,
              name: '产品功能',
              axis: 'product',
              scope: 'capability',
              kind: 'domain'
            },
        canonicalFeature: {
          stableKey: suggestion.canonicalFeatureStableKey,
          name: suggestion.featureName,
          status: 'draft',
          kind: 'capability',
          details: {
            intent: trimmedQuery || suggestion.featureName,
            scope: '从功能发现结果启动焦点，先确认产品意图，再扩展到前端、后端、SDK、运维和证据。'
          }
        },
        focus: {
          title: `深挖 ${suggestion.featureName}`,
          sourceType: 'user_request',
          question: trimmedQuery || suggestion.featureName,
          targetMaps: canonicalMap ? [{ mapId: canonicalMap.id }] : [],
          nextSteps: ['确认产品意图', '定位前端入口', '定位后端/API/SDK 支撑']
        }
      });
      onSelectFeature(started.feature.data.id);
      await onSaved();
      await loadProjectFocuses();
      onSelectFeature(started.feature.data.id);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动功能焦点失败');
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="featureSearchPanel">
      <div className="featureSearchHeader">
        <div>
          <strong>功能发现</strong>
          <span>{prepared ? featurePrepareStatusLabel(prepared.readiness) : result ? `${result.page.candidateCount} 个候选` : '候选定位'}</span>
        </div>
        <div className="featureSearchActions">
          <button type="button" className="featureSearchButton" onClick={runSearch} disabled={!trimmedQuery || loading || preparing || Boolean(preparingFocusId)}>
            <Search size={15} />
            <span>{loading ? '搜索中' : '搜索'}</span>
          </button>
          <button type="button" className="featureSearchButton primary" onClick={prepareWork} disabled={!trimmedQuery || loading || preparing || Boolean(preparingFocusId)}>
            <Compass size={15} />
            <span>{preparing ? '准备中' : '准备'}</span>
          </button>
        </div>
      </div>
      {error ? <p className="formError">{error}</p> : null}
      {projectFocuses.length > 0 || focusesLoading ? (
        <div className="featureFocusQueue">
          <header>
            <span>当前焦点</span>
            <strong>{focusesLoading ? '加载中' : `${projectFocuses.length} 个`}</strong>
          </header>
          <div>
            {projectFocuses.slice(0, 4).map((focus) => (
              <button key={focus.id} type="button" className="featureFocusQueueItem" onClick={() => prepareExistingFocus(focus)} disabled={Boolean(preparingFocusId) || loading || preparing}>
                <Target size={14} />
                <span>
                  <strong>{focus.title}</strong>
                  <small>{focus.map?.stableKey ?? focus.feature?.stableKey ?? focus.stableKey}</small>
                </span>
                <em>{preparingFocusId === focus.id ? '准备中' : '准备'}</em>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {prepared ? (
        <article className={`featurePrepareCard readiness-${prepared.readiness}`}>
          <header>
            <strong>{featurePrepareStatusLabel(prepared.readiness)}</strong>
            <span>{prepared.selectedFocus?.title ?? prepared.selectedCandidate?.feature.name ?? prepared.suggestedStart?.featureName ?? '等待确认'}</span>
          </header>
          <div>
            {prepared.nextSteps.slice(0, 3).map((step) => (
              <p key={step}>{step}</p>
            ))}
          </div>
        </article>
      ) : null}
      {result ? (
        <div className="featureSearchResults">
          {result.candidates.slice(0, 5).map((candidate) => (
            <article key={candidate.feature.id} className="featureSearchCard">
              <button type="button" className="featureSearchMain" onClick={() => onSelectFeature(candidate.feature.id)}>
                <span className="mapAxisPill">{labels?.mapAxis[candidate.map.axis] ?? candidate.map.axis}</span>
                <strong>{candidate.feature.name}</strong>
                <small>{candidate.map.stableKey}</small>
                <em>{candidate.reasons.slice(0, 3).join(' / ') || candidate.feature.stableKey}</em>
                <p>{candidate.nextAction}</p>
                <code>{Math.round(candidate.score)}</code>
              </button>
              {candidate.openFocuses.length > 0 ? (
                <div className="featureSearchFocuses">
                  {candidate.openFocuses.slice(0, 2).map((focus) => (
                    <button key={focus.id} type="button" className="featureSearchFocusButton" onClick={() => prepareExistingFocus(focus)} disabled={Boolean(preparingFocusId)}>
                      <Compass size={14} />
                      <span>{focus.title}</span>
                      <em>{preparingFocusId === focus.id ? '准备中' : '继续焦点'}</em>
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {result.candidates.length === 0 ? <EmptyState title="没有可信候选" /> : null}
          {(prepared?.suggestedStart ?? result.suggestedStart) ? (
            <button type="button" className="featureSearchSuggestion" onClick={startSuggestedFocus} disabled={starting}>
              <Compass size={15} />
              <strong>{(prepared?.suggestedStart ?? result.suggestedStart)?.featureName}</strong>
              <span>{(prepared?.suggestedStart ?? result.suggestedStart)?.canonicalFeatureStableKey}</span>
              <em>{starting ? '启动中' : '启动焦点'}</em>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FeatureFocusPanel({
  tree,
  dossier,
  labels,
  onSelectFeature,
  onSaved
}: {
  tree: ProjectTree;
  dossier: FeatureDossier | null;
  labels: Catalog['labels'] | undefined;
  onSelectFeature: (featureId: string) => void;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preparingFocusId, setPreparingFocusId] = useState('');
  const [prepared, setPrepared] = useState<PreparedFeatureWork | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => featureFocusFormState(tree, dossier, dossier?.focuses[0]));
  const allFeatures = tree.maps.flatMap((map) => flattenFeatures(map.features ?? []).map((feature) => ({ feature, map })));
  const selectableFeatures = allFeatures.filter(({ feature }) => feature.id !== dossier?.focus.feature.id).slice(0, 80);
  const activeFocuses = (dossier?.focuses ?? []).filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status));

  useEffect(() => {
    setForm(featureFocusFormState(tree, dossier, dossier?.focuses[0]));
    setOpen((dossier?.focuses.length ?? 0) === 0);
    setPrepared(null);
    setPreparingFocusId('');
  }, [dossier?.focus.feature.id, dossier?.focuses.length, tree.project.id]);

  function updateField(field: keyof FeatureFocusFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTargetMap(mapId: string) {
    setForm((current) => ({ ...current, targetMapIds: toggleString(current.targetMapIds, mapId) }));
  }

  function toggleRelatedFeature(featureId: string) {
    setForm((current) => ({ ...current, relatedFeatureIds: toggleString(current.relatedFeatureIds, featureId) }));
  }

  function loadFocus(focus: FeatureFocus) {
    setForm(featureFocusFormState(tree, dossier, focus));
    setOpen(true);
  }

  async function prepareFocus(focus: FeatureFocus) {
    setPreparingFocusId(focus.id);
    setError('');
    try {
      const preparedWork = await postJson<PreparedFeatureWork>(`/api/projects/${tree.project.id}/feature-work/prepare`, {
        focusId: focus.id,
        depth: 2
      });
      setPrepared(preparedWork);
      if (preparedWork.readiness === 'ready' && preparedWork.selectedCandidate) {
        onSelectFeature(preparedWork.selectedCandidate.feature.id);
      }
    } catch (err) {
      setPrepared(null);
      setError(err instanceof Error ? err.message : '准备功能焦点失败');
    } finally {
      setPreparingFocusId('');
    }
  }

  async function saveFocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dossier) return;
    setSaving(true);
    setError('');
    try {
      await postJson(`/api/projects/${tree.project.id}/feature-focuses`, {
        id: form.id || undefined,
        stableKey: form.stableKey || undefined,
        featureId: dossier.focus.feature.id,
        title: form.title,
        mode: form.mode,
        status: form.status,
        priority: form.priority,
        sourceType: form.sourceType,
        question: form.question,
        scope: form.scope,
        sourceRefs: linesToList(form.sourceRefs),
        seedPaths: linesToList(form.seedPaths),
        targetMaps: form.targetMapIds.map((mapId) => ({ mapId })),
        relatedFeatures: form.relatedFeatureIds.map((featureId) => ({ featureId })),
        nextSteps: linesToList(form.nextSteps),
        findings: form.findings,
        confidence: Number(form.confidence || 0.5)
      });
      await onSaved();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '功能焦点保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel dossierSection focusPanel">
      <div className="sectionHeader">
        <h2>功能焦点</h2>
        <button type="button" className="miniIconButton" onClick={() => setOpen((value) => !value)} disabled={!dossier}>
          {open ? <ChevronDown size={15} /> : <Plus size={15} />}
          <span>{open ? '收起' : '新建'}</span>
        </button>
      </div>
      {error ? <p className="formError">{error}</p> : null}

      <div className="focusRibbon">
        {(dossier?.focuses ?? []).slice(0, 4).map((focus) => (
          <article key={focus.id} className={`focusChip status-${focus.status}`}>
            <button type="button" className="focusChipMain" onClick={() => loadFocus(focus)}>
              <span>{labels?.featureFocusStatus[focus.status] ?? focus.status}</span>
              <strong>{focus.title}</strong>
              <small>{labels?.featureFocusMode[focus.mode] ?? focus.mode} / {Math.round(focus.confidence * 100)}%</small>
            </button>
            <button type="button" className="focusPrepareButton" onClick={() => prepareFocus(focus)} disabled={Boolean(preparingFocusId)}>
              <Compass size={14} />
              <span>{preparingFocusId === focus.id ? '准备中' : '准备'}</span>
            </button>
          </article>
        ))}
        {(dossier?.focuses.length ?? 0) === 0 ? (
          <article className="focusEmpty">
            <Target size={17} />
            <span>暂无焦点</span>
          </article>
        ) : null}
      </div>

      {prepared ? (
        <article className={`featurePrepareCard focusPrepareResult readiness-${prepared.readiness}`}>
          <header>
            <strong>{featurePrepareStatusLabel(prepared.readiness)}</strong>
            <span>{prepared.selectedFocus?.title ?? prepared.selectedCandidate?.feature.name ?? prepared.suggestedStart?.featureName ?? '等待确认'}</span>
          </header>
          <div>
            {prepared.nextSteps.slice(0, 4).map((step) => (
              <p key={step}>{step}</p>
            ))}
          </div>
        </article>
      ) : null}

      <div className="focusSnapshot">
        <Metric label="进行中" value={activeFocuses.length} />
        <Metric label="目标地图" value={form.targetMapIds.length} />
        <Metric label="种子路径" value={linesToList(form.seedPaths).length} />
        <Metric label="下一步" value={linesToList(form.nextSteps).length} />
      </div>

      {open ? (
        <form className="focusEditor" onSubmit={saveFocus}>
          <div className="formGrid two">
            <label>
              标题
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
            </label>
            <label>
              stableKey
              <input value={form.stableKey} onChange={(event) => updateField('stableKey', event.target.value)} placeholder="自动生成" />
            </label>
            <label>
              模式
              <select value={form.mode} onChange={(event) => updateField('mode', event.target.value)}>
                {featureFocusModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {labels?.featureFocusMode[mode] ?? mode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              状态
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                {featureFocusStatuses.map((status) => (
                  <option key={status} value={status}>
                    {labels?.featureFocusStatus[status] ?? status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              优先级
              <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                {featureFocusPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {labels?.featureFocusPriority[priority] ?? priority}
                  </option>
                ))}
              </select>
            </label>
            <label>
              来源
              <select value={form.sourceType} onChange={(event) => updateField('sourceType', event.target.value)}>
                {featureFocusSourceTypes.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>
                    {labels?.featureFocusSourceType[sourceType] ?? sourceType}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            问题
            <textarea value={form.question} onChange={(event) => updateField('question', event.target.value)} rows={2} />
          </label>
          <label>
            范围
            <textarea value={form.scope} onChange={(event) => updateField('scope', event.target.value)} rows={2} />
          </label>

          <div className="focusChooserGrid">
            <section>
              <strong>目标地图</strong>
              <div className="choiceGrid">
                {tree.maps.map((map) => (
                  <label key={map.id} className={form.targetMapIds.includes(map.id) ? 'choicePill selected' : 'choicePill'}>
                    <input type="checkbox" checked={form.targetMapIds.includes(map.id)} onChange={() => toggleTargetMap(map.id)} />
                    <span>{labels?.mapAxis[map.axis] ?? map.axis}</span>
                    <strong>{map.name}</strong>
                  </label>
                ))}
              </div>
            </section>
            <section>
              <strong>相关功能</strong>
              <div className="choiceGrid featureChoices">
                {selectableFeatures.map(({ feature, map }) => (
                  <label key={feature.id} className={form.relatedFeatureIds.includes(feature.id) ? 'choicePill selected' : 'choicePill'}>
                    <input type="checkbox" checked={form.relatedFeatureIds.includes(feature.id)} onChange={() => toggleRelatedFeature(feature.id)} />
                    <span>{labels?.mapAxis[map.axis] ?? map.axis}</span>
                    <strong>{feature.name}</strong>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="formGrid two">
            <label>
              来源引用
              <textarea value={form.sourceRefs} onChange={(event) => updateField('sourceRefs', event.target.value)} rows={3} />
            </label>
            <label>
              种子路径
              <textarea value={form.seedPaths} onChange={(event) => updateField('seedPaths', event.target.value)} rows={3} />
            </label>
            <label>
              下一步
              <textarea value={form.nextSteps} onChange={(event) => updateField('nextSteps', event.target.value)} rows={3} />
            </label>
            <label>
              结论
              <textarea value={form.findings} onChange={(event) => updateField('findings', event.target.value)} rows={3} />
            </label>
          </div>
          <label>
            置信度
            <input type="range" min="0" max="1" step="0.05" value={form.confidence} onChange={(event) => updateField('confidence', event.target.value)} />
            <span className="rangeValue">{Math.round(Number(form.confidence || 0) * 100)}%</span>
          </label>
          <div className="formActions">
            <button type="button" onClick={() => setForm(featureFocusFormState(tree, dossier, null))}>
              <RefreshCw size={15} />
              <span>重置</span>
            </button>
            <button type="submit" disabled={saving || !dossier}>
              <Save size={15} />
              <span>{saving ? '保存中' : '保存焦点'}</span>
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function ProgrammingContextPanel({
  context,
  dossier,
  loading,
  labels,
  onSelectCodeReference
}: {
  context: ProgrammingContext | null;
  dossier: FeatureDossier | null;
  loading: boolean;
  labels: Catalog['labels'] | undefined;
  onSelectCodeReference: (referenceId: string) => void;
}) {
  const entryPoints = context?.requiredEntryPoints ?? dossier?.entryPoints ?? [];
  const references = context?.keyCodeReferences ?? dossier?.codeReferences ?? [];
  const impactedFeatures = context?.impactedFeatures ?? dossier?.relatedFeatures ?? [];
  const qualityIssues = context?.qualityIssues ?? dossier?.qualityIssues ?? [];
  const risks = context?.risks ?? dossier?.focus.feature.details?.risks ?? [];
  const acceptanceCriteria = context?.acceptanceCriteria ?? dossier?.focus.feature.details?.acceptanceCriteria ?? [];
  const verification = context?.verification ?? references.map((reference) => reference.verificationHint).filter(Boolean);
  const nextActions = context?.nextActions ?? [];
  const focuses = context?.focuses ?? dossier?.focuses ?? [];

  return (
    <section className="panel dossierSection programmingPanel">
      <div className="sectionHeader">
        <h2>AI 编程上下文</h2>
        <span>{loading ? '读取中' : `${references.length} 个关键引用`}</span>
      </div>
      <div className="programmingGrid">
        <ProgrammingBlock title="焦点行动" icon={Compass} count={nextActions.length || focuses.length} wide>
          {nextActions.slice(0, 6).map((action) => (
            <article key={`${action.source}:${action.targetType}:${action.targetId}:${action.title}`} className={`programmingItem action-${action.priority}`}>
              <strong>{action.title}</strong>
              <small>{action.priority} / {action.source}</small>
              <em>{action.detail}</em>
            </article>
          ))}
          {nextActions.length === 0
            ? focuses.slice(0, 3).map((focus) => (
                <article key={focus.id} className="programmingItem">
                  <strong>{focus.title}</strong>
                  <small>{focus.status}</small>
                  <em>{focus.question || focus.nextSteps.join(' / ') || focus.findings || '暂无下一步'}</em>
                </article>
              ))
            : null}
          {nextActions.length === 0 && focuses.length === 0 ? <span className="routeEmpty">暂无焦点行动</span> : null}
        </ProgrammingBlock>

        <ProgrammingBlock title="必读入口" icon={FileCode2} count={entryPoints.length}>
          {entryPoints.slice(0, 4).map((entryPoint) => (
            <article key={entryPoint.id} className="programmingItem">
              <strong>{entryPoint.name}</strong>
              <small>{labels?.entryPointKind[entryPoint.kind] ?? entryPoint.kind}</small>
              <em>{entryPoint.path}</em>
            </article>
          ))}
          {entryPoints.length === 0 ? <span className="routeEmpty">暂无入口</span> : null}
        </ProgrammingBlock>

        <ProgrammingBlock title="关键文件" icon={Code2} count={references.length} wide>
          {references.slice(0, 6).map((reference) => (
            <button key={reference.id} type="button" className="programmingItem clickable" onClick={() => onSelectCodeReference(reference.id)}>
              <strong>{reference.symbol || reference.path}</strong>
              <small>{codeReferenceRoleLabel(reference, labels)}</small>
              <em>{reference.path}{lineRange(reference) === '未设置' ? '' : `:${lineRange(reference)}`}</em>
              {reference.changeGuidance ? <p>{reference.changeGuidance}</p> : null}
            </button>
          ))}
          {references.length === 0 ? <span className="routeEmpty">暂无关键文件</span> : null}
        </ProgrammingBlock>

        <ProgrammingBlock title="验收/风险" icon={Target} count={acceptanceCriteria.length + risks.length}>
          <ContextList title="验收" values={acceptanceCriteria} />
          <ContextList title="风险" values={risks} />
          {acceptanceCriteria.length === 0 && risks.length === 0 ? <span className="routeEmpty">暂无验收和风险</span> : null}
        </ProgrammingBlock>

        <ProgrammingBlock title="验证线索" icon={FileSearch} count={verification.length}>
          {verification.slice(0, 5).map((item) => (
            <article key={item} className="programmingItem single">
              <strong>{item}</strong>
            </article>
          ))}
          {verification.length === 0 ? <span className="routeEmpty">暂无验证线索</span> : null}
        </ProgrammingBlock>

        <ProgrammingBlock title="影响面" icon={GitMerge} count={impactedFeatures.length}>
          {impactedFeatures.slice(0, 5).map((feature) => (
            <article key={feature.id} className="programmingItem">
              <strong>{feature.name}</strong>
              <small>{labels?.featureStatus[feature.status] ?? feature.status}</small>
              <em>{feature.stableKey}</em>
            </article>
          ))}
          {impactedFeatures.length === 0 ? <span className="routeEmpty">暂无影响功能</span> : null}
        </ProgrammingBlock>

        <ProgrammingBlock title="质量问题" icon={TriangleAlert} count={qualityIssues.length} wide>
          {qualityIssues.slice(0, 5).map((issue) => (
            <article key={`${issue.code}:${issue.targetId}`} className={`programmingItem quality-${issue.severity}`}>
              <strong>{issue.message}</strong>
              <small>{issue.severity} / {issue.code}</small>
              <em>{issue.hint}</em>
            </article>
          ))}
          {qualityIssues.length === 0 ? <span className="routeEmpty">暂无质量问题</span> : null}
        </ProgrammingBlock>
      </div>
    </section>
  );
}

function FeatureHandoffPanel({ dossier, context, loading }: { dossier: FeatureDossier | null; context: ProgrammingContext | null; loading: boolean }) {
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => featureHandoffPrompt(dossier, context), [context, dossier]);
  const shareUrl = dossier ? featureDossierUrl(dossier.project.id, dossier.focus.feature.id) : '';

  async function copyPrompt() {
    if (!prompt) return;
    await copyText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="panel dossierSection handoffPanel">
      <div className="sectionHeader">
        <h2>交给 Codex</h2>
        <button type="button" className="handoffCopyButton" onClick={copyPrompt} disabled={!prompt || loading}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? '已复制' : '复制提示'}</span>
        </button>
      </div>
      <div className="handoffFacts">
        <span>{dossier?.project.id ?? 'projectId'}</span>
        <span>{dossier?.focus.feature.id ?? 'featureId'}</span>
        <span>{dossier?.focus.feature.stableKey ?? 'stableKey'}</span>
      </div>
      {shareUrl ? <code className="handoffUrl">{shareUrl}</code> : null}
      <pre className="handoffPrompt">{prompt || '选择一个功能后生成交付提示。'}</pre>
    </section>
  );
}

function ProgrammingBlock({ title, icon: Icon, count, wide = false, children }: { title: string; icon: LucideIcon; count: number; wide?: boolean; children: ReactNode }) {
  return (
    <section className={wide ? 'programmingBlock wide' : 'programmingBlock'}>
      <header>
        <Icon size={16} />
        <strong>{title}</strong>
        <span>{count}</span>
      </header>
      <div>{children}</div>
    </section>
  );
}

function ContextList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <article className="contextListBlock">
      <strong>{title}</strong>
      <ul>
        {values.slice(0, 5).map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </article>
  );
}

function StatusMatrixPanel({
  tree,
  dossier,
  statuses,
  labels,
  onSaved
}: {
  tree: ProjectTree;
  dossier: FeatureDossier | null;
  statuses: CapabilityStatus[];
  labels: Catalog['labels'] | undefined;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => capabilityStatusFormState(tree, dossier));
  const selectedMap = tree.maps.find((map) => map.id === form.mapId);
  const featureOptions = flattenFeatures(selectedMap?.features ?? []);

  useEffect(() => {
    setForm(capabilityStatusFormState(tree, dossier));
    setError('');
    setOpen(false);
  }, [dossier?.canonicalFeature.id, tree.project.id]);

  function updateField(field: keyof CapabilityStatusFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value, ...(field === 'mapId' ? { featureId: '' } : {}) }));
  }

  async function saveStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dossier || !form.mapId) {
      setError('需要先选择一个功能和实现地图。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await postJson(`/api/projects/${tree.project.id}/capability-statuses`, {
        canonicalFeatureId: dossier.canonicalFeature.id,
        mapId: form.mapId,
        featureId: form.featureId || undefined,
        status: form.status,
        summary: form.summary,
        gaps: linesToList(form.gaps),
        recommendedAction: form.recommendedAction
      });
      setOpen(false);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '实现状态保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>实现状态</h2>
        <span>{statuses.length} 层</span>
      </div>
      <div className="statusMatrixList">
        {statuses.map((status) => (
          <article key={status.id} className={`statusSlice status-${status.status}`}>
            <header>
              <strong>{status.map?.name ?? status.mapId}</strong>
              <span>{labels?.capabilityImplementationStatus[status.status] ?? status.status}</span>
            </header>
            <p>{status.summary || status.feature?.name || status.canonicalFeature?.name || '暂无说明'}</p>
            {status.recommendedAction ? <small>{status.recommendedAction}</small> : null}
          </article>
        ))}
        {statuses.length === 0 ? <EmptyState title="暂无实现状态" /> : null}
      </div>
      <button type="button" className={open ? 'sideEditorToggle active' : 'sideEditorToggle'} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Plus size={15} />
        <span>维护实现状态</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <form className="sideEditorForm" onSubmit={saveStatus}>
          {error ? <div className="formError">{error}</div> : null}
          <label>
            <span>实现地图</span>
            <select value={form.mapId} onChange={(event) => updateField('mapId', event.target.value)} required>
              {tree.maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name} / {map.stableKey}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>具体功能</span>
            <select value={form.featureId} onChange={(event) => updateField('featureId', event.target.value)}>
              <option value="">不绑定具体实现功能</option>
              {featureOptions.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name} / {feature.stableKey}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>实现状态</span>
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              {capabilityImplementationStatuses.map((status) => (
                <option key={status} value={status}>
                  {labels?.capabilityImplementationStatus[status] ?? status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>状态摘要</span>
            <textarea value={form.summary} onChange={(event) => updateField('summary', event.target.value)} rows={3} />
          </label>
          <label>
            <span>当前缺口</span>
            <textarea value={form.gaps} onChange={(event) => updateField('gaps', event.target.value)} rows={3} placeholder="每行一条" />
          </label>
          <label>
            <span>推荐动作</span>
            <textarea value={form.recommendedAction} onChange={(event) => updateField('recommendedAction', event.target.value)} rows={2} />
          </label>
          <div className="editorActions compact">
            <button type="button" className="ghostButton" onClick={() => setOpen(false)} disabled={saving}>
              <X size={15} />
              <span>取消</span>
            </button>
            <button type="submit" disabled={saving || !dossier}>
              <Save size={15} />
              <span>{saving ? '保存中' : '保存状态'}</span>
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function GapPanel({
  tree,
  dossier,
  gaps,
  labels,
  onSaved
}: {
  tree: ProjectTree;
  dossier: FeatureDossier | null;
  gaps: CapabilityGap[];
  labels: Catalog['labels'] | undefined;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => capabilityGapFormState(tree, dossier));
  const selectedMap = form.mapId ? tree.maps.find((map) => map.id === form.mapId) : undefined;
  const featureOptions = flattenFeatures(selectedMap?.features ?? []);

  useEffect(() => {
    setForm(capabilityGapFormState(tree, dossier));
    setError('');
    setOpen(false);
  }, [dossier?.canonicalFeature.id, tree.project.id]);

  function updateField(field: keyof CapabilityGapFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value, ...(field === 'mapId' ? { featureId: '' } : {}) }));
  }

  async function saveGap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dossier) {
      setError('需要先选择一个功能。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await postJson(`/api/projects/${tree.project.id}/capability-gaps`, {
        canonicalFeatureId: dossier.canonicalFeature.id,
        stableKey: form.stableKey.trim() || undefined,
        mapId: form.mapId || undefined,
        featureId: form.featureId || undefined,
        title: form.title,
        gapType: form.gapType,
        severity: form.severity,
        status: form.status,
        description: form.description,
        recommendedAction: form.recommendedAction
      });
      setOpen(false);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '缺口保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>缺口/冲突</h2>
        <span>{gaps.filter((gap) => gap.status === 'open').length} 个未解决</span>
      </div>
      <div className="gapList">
        {gaps.map((gap) => (
          <article key={gap.id} className={`gapItem severity-${gap.severity}`}>
            <header>
              <TriangleAlert size={15} />
              <strong>{gap.title}</strong>
              <span>{labels?.capabilityGapSeverity[gap.severity] ?? gap.severity}</span>
            </header>
            <small>{labels?.capabilityGapType[gap.gapType] ?? gap.gapType} / {labels?.capabilityGapStatus[gap.status] ?? gap.status}</small>
            <p>{gap.description || gap.recommendedAction || '暂无说明'}</p>
          </article>
        ))}
        {gaps.length === 0 ? <EmptyState title="暂无结构化缺口" /> : null}
      </div>
      <button type="button" className={open ? 'sideEditorToggle active' : 'sideEditorToggle'} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Plus size={15} />
        <span>记录缺口/冲突</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <form className="sideEditorForm" onSubmit={saveGap}>
          {error ? <div className="formError">{error}</div> : null}
          <label>
            <span>标题</span>
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
          </label>
          <label>
            <span>稳定键</span>
            <input value={form.stableKey} onChange={(event) => updateField('stableKey', event.target.value)} placeholder="可选，例如 gap.chat.web-mock" />
          </label>
          <label>
            <span>关联地图</span>
            <select value={form.mapId} onChange={(event) => updateField('mapId', event.target.value)}>
              <option value="">不绑定实现地图</option>
              {tree.maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name} / {map.stableKey}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>关联功能</span>
            <select value={form.featureId} onChange={(event) => updateField('featureId', event.target.value)} disabled={!form.mapId}>
              <option value="">不绑定具体功能</option>
              {featureOptions.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name} / {feature.stableKey}
                </option>
              ))}
            </select>
          </label>
          <div className="formGrid three compact">
            <label>
              <span>类型</span>
              <select value={form.gapType} onChange={(event) => updateField('gapType', event.target.value)}>
                {capabilityGapTypes.map((gapType) => (
                  <option key={gapType} value={gapType}>
                    {labels?.capabilityGapType[gapType] ?? gapType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>严重度</span>
              <select value={form.severity} onChange={(event) => updateField('severity', event.target.value)}>
                {capabilityGapSeverities.map((severity) => (
                  <option key={severity} value={severity}>
                    {labels?.capabilityGapSeverity[severity] ?? severity}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>状态</span>
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                {capabilityGapStatuses.map((status) => (
                  <option key={status} value={status}>
                    {labels?.capabilityGapStatus[status] ?? status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>说明</span>
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} />
          </label>
          <label>
            <span>推荐动作</span>
            <textarea value={form.recommendedAction} onChange={(event) => updateField('recommendedAction', event.target.value)} rows={2} />
          </label>
          <div className="editorActions compact">
            <button type="button" className="ghostButton" onClick={() => setOpen(false)} disabled={saving}>
              <X size={15} />
              <span>取消</span>
            </button>
            <button type="submit" disabled={saving || !dossier}>
              <Save size={15} />
              <span>{saving ? '保存中' : '保存缺口'}</span>
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function RelatedPanel({ dossier, labels }: { dossier: FeatureDossier | null; labels: Catalog['labels'] | undefined }) {
  return (
    <section className="panel inspectorPanel">
      <div className="sectionHeader">
        <h2>关联上下文</h2>
        <span>{dossier?.summary.relatedFeatureCount ?? 0}</span>
      </div>
      <div className="compactContextList">
        {dossier?.canonicalFeature && !dossier.summary.isCanonical ? (
          <article>
            <strong>Canonical</strong>
            <span>{dossier.canonicalFeature.name}</span>
            <small>{dossier.canonicalMap.name}</small>
          </article>
        ) : null}
        {(dossier?.entryPoints ?? []).map((entryPoint) => (
          <article key={entryPoint.id}>
            <strong>{labels?.entryPointKind[entryPoint.kind] ?? entryPoint.kind}</strong>
            <span>{entryPoint.name}</span>
            <small>{entryPoint.path}</small>
          </article>
        ))}
        {(dossier?.alignments ?? []).map((alignment) => (
          <article key={alignment.id}>
            <strong>{labels?.alignmentRelation[alignment.relation] ?? alignment.relation}</strong>
            <span>{alignment.name}</span>
            <small>{labels?.alignmentStatus[alignment.status] ?? alignment.status}</small>
          </article>
        ))}
        {(dossier?.qualityIssues ?? []).map((issue) => (
          <article key={`${issue.code}:${issue.targetId}`}>
            <strong>{issue.severity}</strong>
            <span>{issue.message}</span>
            <small>{issue.hint}</small>
          </article>
        ))}
        {!dossier || (dossier.entryPoints.length === 0 && dossier.alignments.length === 0 && dossier.qualityIssues.length === 0 && dossier.summary.isCanonical) ? <EmptyState title="暂无关联上下文" /> : null}
      </div>
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

function FeatureReadinessPanel({
  readiness,
  loading,
  labels
}: {
  readiness: FeatureReadiness | null;
  loading: boolean;
  labels: Catalog['labels'] | undefined;
}) {
  const meta = readinessMeta(readiness?.readiness);
  const checks = readiness?.checks.filter((check) => check.status !== 'pass').slice(0, 5) ?? [];
  const nextSteps = readiness?.nextSteps.slice(0, 4) ?? [];

  return (
    <section className={`readinessPanel readiness-${readiness?.readiness ?? 'loading'}`}>
      <div className="readinessHeader">
        <div className="readinessScore">
          <strong>{readiness ? readiness.score : '...'}</strong>
          <small>score</small>
        </div>
        <div className="readinessSummary">
          <span>{meta.label}</span>
          <h2>单功能就绪度</h2>
          <p>{readiness ? meta.copy : loading ? '正在检查功能深度、证据和跨端覆盖。' : '选择功能后显示就绪度。'}</p>
        </div>
        <span className="readinessBadge">{readiness ? `${readiness.checks.filter((check) => check.status === 'fail').length} fail` : 'pending'}</span>
      </div>

      <div className="readinessAxes">
        {(readiness?.axisCoverage ?? []).map((axis) => (
          <span key={axis.axis} className={`readinessAxis status-${axis.status}`}>
            <strong>{labels?.mapAxis[axis.axis] ?? axis.axis}</strong>
            <small>{axis.status === 'covered' ? 'covered' : axis.status === 'partial' ? 'partial' : 'missing'}</small>
          </span>
        ))}
        {!readiness && loading ? (
          <>
            <span className="readinessAxis skeleton"><strong>product</strong><small>...</small></span>
            <span className="readinessAxis skeleton"><strong>web</strong><small>...</small></span>
            <span className="readinessAxis skeleton"><strong>backend</strong><small>...</small></span>
          </>
        ) : null}
      </div>

      {readiness ? (
        <div className="readinessBody">
          <div className="readinessChecks">
            {checks.length > 0 ? checks.map((check) => (
              <article key={check.id} className={`readinessCheck status-${check.status}`}>
                {check.status === 'fail' ? <TriangleAlert size={15} /> : <Compass size={15} />}
                <span>
                  <strong>{check.label}</strong>
                  <small>{check.message}</small>
                </span>
              </article>
            )) : (
              <article className="readinessCheck status-pass">
                <Check size={15} />
                <span>
                  <strong>检查通过</strong>
                  <small>当前功能档案可以进入更窄的编程上下文。</small>
                </span>
              </article>
            )}
          </div>
          <div className="readinessNextSteps">
            {nextSteps.map((step, index) => (
              <span key={step}>
                <strong>{index + 1}</strong>
                <small>{step}</small>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
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

type FeatureDetailFormState = {
  name: string;
  status: string;
  description: string;
  intent: string;
  currentBehavior: string;
  expectedBehavior: string;
  scope: string;
  knownGaps: string;
  openQuestions: string;
  acceptanceCriteria: string;
  risks: string;
  blocker: string;
  replacement: string;
  deprecatedReason: string;
  mockBoundary: string;
  detailsMarkdown: string;
  lastVerifiedAt: string;
  lastVerifiedCommit: string;
};

type FeatureFocusFormState = {
  id: string;
  stableKey: string;
  title: string;
  mode: string;
  status: string;
  priority: string;
  sourceType: string;
  question: string;
  scope: string;
  sourceRefs: string;
  seedPaths: string;
  targetMapIds: string[];
  relatedFeatureIds: string[];
  nextSteps: string;
  findings: string;
  confidence: string;
};

type FeatureStartFormState = {
  mapId: string;
  mapStableKey: string;
  mapName: string;
  featureName: string;
  featureStableKey: string;
  question: string;
  sourceRefs: string;
  seedPaths: string;
  nextSteps: string;
};

type CapabilityStatusFormState = {
  mapId: string;
  featureId: string;
  status: string;
  summary: string;
  gaps: string;
  recommendedAction: string;
};

type CapabilityGapFormState = {
  stableKey: string;
  mapId: string;
  featureId: string;
  title: string;
  gapType: string;
  severity: string;
  status: string;
  description: string;
  recommendedAction: string;
};

function featureDetailFormState(feature: Feature): FeatureDetailFormState {
  const details = feature.details;
  return {
    name: feature.name,
    status: feature.status,
    description: feature.description,
    intent: details?.intent ?? '',
    currentBehavior: details?.currentBehavior ?? '',
    expectedBehavior: details?.expectedBehavior ?? '',
    scope: details?.scope ?? '',
    knownGaps: listToLines(details?.knownGaps),
    openQuestions: listToLines(details?.openQuestions),
    acceptanceCriteria: listToLines(details?.acceptanceCriteria),
    risks: listToLines(details?.risks),
    blocker: details?.blocker ?? '',
    replacement: details?.replacement ?? '',
    deprecatedReason: details?.deprecatedReason ?? '',
    mockBoundary: details?.mockBoundary ?? '',
    detailsMarkdown: details?.detailsMarkdown ?? '',
    lastVerifiedAt: details?.lastVerifiedAt ?? '',
    lastVerifiedCommit: details?.lastVerifiedCommit ?? ''
  };
}

function featureFocusFormState(tree: ProjectTree, dossier: FeatureDossier | null, focus?: FeatureFocus | null): FeatureFocusFormState {
  const targetMapIds = focus?.targetMapIds.length
    ? focus.targetMapIds
    : uniqueStrings([dossier?.focus.map.id, dossier?.canonicalMap.id, ...((dossier?.implementationSlices ?? []).map((slice) => slice.mapId))].filter(Boolean) as string[]).slice(0, 6);
  return {
    id: focus?.id ?? '',
    stableKey: focus?.stableKey ?? '',
    title: focus?.title ?? (dossier?.focus.feature.name ? `深挖 ${dossier.focus.feature.name}` : '功能深挖'),
    mode: focus?.mode ?? 'analyze',
    status: focus?.status ?? 'open',
    priority: focus?.priority ?? 'medium',
    sourceType: focus?.sourceType ?? 'user_request',
    question: focus?.question ?? '',
    scope: focus?.scope ?? '',
    sourceRefs: listToLines(focus?.sourceRefs),
    seedPaths: listToLines(focus?.seedPaths),
    targetMapIds: targetMapIds.filter((mapId) => tree.maps.some((map) => map.id === mapId)),
    relatedFeatureIds: focus?.relatedFeatureIds ?? [],
    nextSteps: listToLines(focus?.nextSteps),
    findings: focus?.findings ?? '',
    confidence: String(focus?.confidence ?? 0.5)
  };
}

function featureStartFormState(tree: ProjectTree): FeatureStartFormState {
  const defaultMap = tree.maps.find((map) => map.axis === 'product' || map.axis === 'capability') ?? tree.maps[0];
  return {
    mapId: defaultMap?.id ?? '',
    mapStableKey: defaultMap?.stableKey ?? 'product.focus',
    mapName: defaultMap?.name ?? '产品功能',
    featureName: '',
    featureStableKey: '',
    question: '',
    sourceRefs: '',
    seedPaths: '',
    nextSteps: '读取产品说明\n定位前端入口\n定位后端/API/SDK 支撑'
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function toggleString(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function capabilityStatusFormState(tree: ProjectTree, dossier: FeatureDossier | null): CapabilityStatusFormState {
  const mapId = dossier?.focus.map.id ?? tree.maps[0]?.id ?? '';
  return {
    mapId,
    featureId: dossier?.focus.feature.mapId === mapId ? dossier.focus.feature.id : '',
    status: 'unknown',
    summary: '',
    gaps: '',
    recommendedAction: ''
  };
}

function capabilityGapFormState(tree: ProjectTree, dossier: FeatureDossier | null): CapabilityGapFormState {
  const mapId = dossier?.focus.map.id ?? tree.maps[0]?.id ?? '';
  return {
    stableKey: '',
    mapId,
    featureId: dossier?.focus.feature.mapId === mapId ? dossier.focus.feature.id : '',
    title: '',
    gapType: 'implementation_gap',
    severity: 'medium',
    status: 'open',
    description: '',
    recommendedAction: ''
  };
}

function listToLines(values: string[] | undefined): string {
  return values?.join('\n') ?? '';
}

function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
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

function codeReferencePriority(reference: CodeReference): number {
  const roleScore: Record<string, number> = {
    entry: 6,
    core_logic: 6,
    contract: 5,
    permission_check: 5,
    adapter: 4,
    storage: 4,
    rendering: 3,
    configuration: 3,
    test: 2,
    other: 1
  };
  return (
    (roleScore[reference.roleInFeature] ?? 0) +
    (reference.changeGuidance ? 4 : 0) +
    (reference.verificationHint ? 3 : 0) +
    (reference.blastRadius ? 2 : 0) +
    (reference.description ? 1 : 0)
  );
}

function readinessMeta(readiness: FeatureReadiness['readiness'] | undefined): { label: string; copy: string } {
  if (readiness === 'ready') {
    return { label: '可进入实现', copy: '产品意图、证据、跨端覆盖和验收信息已经形成闭环。' };
  }
  if (readiness === 'needs_evidence') {
    return { label: '缺少证据', copy: '先补代码引用、code_fact 证据或局部质量问题，再进入实现。' };
  }
  if (readiness === 'needs_alignment') {
    return { label: '缺少对齐', copy: '先补 product/web/backend 等视角的状态矩阵和对齐关系。' };
  }
  if (readiness === 'blocked') {
    return { label: '阻塞', copy: '先明确 blocker、未决问题和推荐动作。' };
  }
  if (readiness === 'needs_analysis') {
    return { label: '还需分析', copy: '继续补范围、现状/目标行为、验收条件或焦点结论。' };
  }
  return { label: '检查中', copy: '正在读取单功能就绪度。' };
}

function featureHandoffPrompt(dossier: FeatureDossier | null, context: ProgrammingContext | null): string {
  if (!dossier) return '';
  const feature = dossier.focus.feature;
  const map = dossier.focus.map;
  const canonical = dossier.canonicalFeature;
  const references = context?.keyCodeReferences ?? dossier.codeReferences;
  const entryPoints = context?.requiredEntryPoints ?? dossier.entryPoints;
  const gaps = context?.capabilityGaps ?? dossier.gaps;
  const qualityIssues = context?.qualityIssues ?? dossier.qualityIssues;
  const nextActions = context?.nextActions ?? [];
  const activeFocus = dossier.focuses.find((focus) => !['implemented', 'closed', 'archived'].includes(focus.status));
  const dossierInclude = ['focuses', 'details', 'codeReferences', 'entryPoints', 'alignments', 'evidence', 'statusMatrix', 'gaps', 'relatedFeatures', 'quality'];
  const programmingInclude = ['entryPoints', 'codeReferences', 'alignments', 'risks', 'acceptanceCriteria', 'evidence', 'details', 'quality', 'statusMatrix', 'gaps', 'focuses'];

  return [
    `请围绕 FuncTree 中的这个单一功能工作，不要先拉全量项目。`,
    ``,
    `FuncTree 服务: ${featureDossierBaseUrl() || '按 MCP 配置的 FUNCTREE_SERVER_URL'}`,
    `项目: ${dossier.project.name} (${dossier.project.id})`,
    `焦点功能: ${feature.name} (${feature.id})`,
    `焦点 stableKey: ${feature.stableKey}`,
    `焦点 map: ${map.name} (${map.stableKey})`,
    `Canonical 功能: ${canonical.name} (${canonical.stableKey})`,
    `Web 查看: ${featureDossierUrl(dossier.project.id, feature.id)}`,
    ``,
    `先准备单功能工作包：`,
    `1. functree_prepare_feature_work(${JSON.stringify({ projectId: dossier.project.id, featureId: feature.id, depth: 2 })})`,
    `2. 如果 readiness 是 ready，优先使用返回的 dossier、programmingContext 和 nextSteps。`,
    `3. 需要补读或验证时再调用：functree_get_feature_dossier(${JSON.stringify({ projectId: dossier.project.id, featureId: feature.id, depth: 2, include: dossierInclude })})`,
    `4. 检查单功能深挖是否足够：functree_get_feature_readiness(${JSON.stringify({ projectId: dossier.project.id, featureId: feature.id, requiredAxes: ['product', 'web', 'backend'] })})`,
    `5. 需要更窄代码行动时再调用：functree_get_programming_context(${JSON.stringify({ projectId: dossier.project.id, featureId: feature.id, depth: 2, include: programmingInclude })})`,
    activeFocus ? `当前焦点: ${activeFocus.title} / ${activeFocus.status} / ${activeFocus.nextSteps.slice(0, 3).join(', ') || '暂无下一步'}` : `当前焦点: 暂无，请先用 functree_upsert_feature_focus 记录本次问题、范围、种子路径和下一步。`,
    ``,
    `改代码前必须确认：`,
    `- 必读入口 ${entryPoints.length} 个：${entryPoints.slice(0, 4).map((item) => item.path).join(', ') || '暂无'}`,
    `- 关键代码引用 ${references.length} 个：${references.slice(0, 5).map((item) => item.symbol || item.path).join(', ') || '暂无'}`,
    `- 开放缺口 ${gaps.filter((gap) => gap.status === 'open').length} 个`,
    `- 质量问题 ${qualityIssues.length} 个`,
    `- 推荐行动 ${nextActions.length} 个：${nextActions.slice(0, 4).map((item) => item.title).join(', ') || '暂无'}`,
    ``,
    `工作规则：`,
    `- 区分 runtime_code、test、api_route、product_prototype、docs、inference，不要把 mock 或文档规划当成真实能力。`,
    `- 修改前后用 functree_upsert_feature_focus 维护本次焦点的 findings、nextSteps、targetMaps、relatedFeatures 和 confidence。`,
    `- 修改后把新的代码引用、证据、状态、缺口通过 functree_upsert_feature_dossier 或对应 upsert 工具写回。`,
    `- 大批量写入先 dryRun，再正式写入。`,
    `- 完成后重新调用 functree_get_feature_readiness 和 functree_get_programming_context 验证上下文。`
  ].join('\n');
}

function featureDossierBaseUrl(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

function featureDossierUrl(projectId: string, featureId: string): string {
  const baseUrl = featureDossierBaseUrl();
  const path = `/?view=dossier&projectId=${encodeURIComponent(projectId)}&featureId=${encodeURIComponent(featureId)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

async function copyText(value: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // Fall back to a temporary textarea below.
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function isResolvedImplementationStatus(status: string): boolean {
  return ['approved', 'live', 'configured', 'deployed', 'not_needed'].includes(status);
}

function gapSeverityRank(severity: CapabilityGap['severity']): number {
  if (severity === 'high') return 0;
  if (severity === 'medium') return 1;
  return 2;
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

function looksLikeCodePath(value: string): boolean {
  return /[\\/]/u.test(value) || /\.(tsx?|jsx?|vue|svelte|py|go|rs|java|kt|swift|php|rb|cs|sql|md|ya?ml|json)$/iu.test(value);
}

function featurePrepareStatusLabel(readiness: PreparedFeatureWork['readiness']): string {
  if (readiness === 'ready') return '已准备';
  if (readiness === 'ambiguous') return '需确认';
  return '需启动';
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
  return value && viewIds.has(value as View) ? (value as View) : 'dossier';
}

function readProjectIdFromUrl(): string {
  return new URLSearchParams(window.location.search).get('projectId') ?? '';
}

function readFeatureIdFromUrl(): string {
  return new URLSearchParams(window.location.search).get('featureId') ?? '';
}

function replaceUrlParams(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
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
