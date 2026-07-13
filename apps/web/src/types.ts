export type Catalog = {
  labels: {
    projectStatus: Record<string, string>;
    mapAxis: Record<string, string>;
    mapScope: Record<string, string>;
    mapKind: Record<string, string>;
    mapStatus: Record<string, string>;
    featureStatus: Record<string, string>;
    featureKind: Record<string, string>;
    entryPointKind: Record<string, string>;
    codeReferenceKind: Record<string, string>;
    codeReferenceRoleInFeature: Record<string, string>;
    evidenceType: Record<string, string>;
    evidenceSourceType: Record<string, string>;
    capabilityImplementationStatus: Record<string, string>;
    capabilityGapType: Record<string, string>;
    capabilityGapSeverity: Record<string, string>;
    capabilityGapStatus: Record<string, string>;
    featureFocusMode: Record<string, string>;
    featureFocusStatus: Record<string, string>;
    featureFocusPriority: Record<string, string>;
    featureFocusSourceType: Record<string, string>;
    alignmentRelation: Record<string, string>;
    alignmentStatus: Record<string, string>;
  };
};

export type Project = {
  id: string;
  name: string;
  status: string;
  currentVersion: string;
  description: string;
  updatedAt: string;
};

export type FuncMap = {
  id: string;
  projectId: string;
  stableKey: string;
  name: string;
  version: string;
  axis: string;
  scope: string;
  kind: string;
  status: string;
  owner: string;
  tags: string[];
  description: string;
  features?: Feature[];
};

export type Feature = {
  id: string;
  projectId: string;
  mapId: string;
  parentFeatureId: string | null;
  stableKey: string;
  name: string;
  version: string;
  status: string;
  kind: string;
  tags: string[];
  description: string;
  details?: FeatureDetail;
  children?: Feature[];
};

export type FeatureDetail = {
  intent: string;
  currentBehavior: string;
  expectedBehavior: string;
  scope: string;
  knownGaps: string[];
  openQuestions: string[];
  acceptanceCriteria: string[];
  risks: string[];
  blocker: string;
  replacement: string;
  deprecatedReason: string;
  mockBoundary: string;
  detailsMarkdown: string;
  lastVerifiedAt: string;
  lastVerifiedCommit: string;
  updatedAt: string;
};

export type EntryPoint = {
  id: string;
  projectId: string;
  mapId: string | null;
  stableKey: string;
  name: string;
  path: string;
  kind: string;
  description: string;
  confidence: number;
};

export type CodeReference = {
  id: string;
  projectId: string;
  mapId: string | null;
  featureId: string | null;
  entryPointId: string | null;
  stableKey: string;
  path: string;
  symbol: string;
  kind: string;
  description: string;
  roleInFeature: string;
  changeGuidance: string;
  verificationHint: string;
  blastRadius: string;
  lineStart: number | null;
  lineEnd: number | null;
};

export type Evidence = {
  id: string;
  projectId: string;
  targetType: string;
  targetId: string;
  evidenceType: string;
  sourceType: string;
  sourcePriority: number;
  path: string;
  symbol: string;
  lineStart: number | null;
  lineEnd: number | null;
  summary: string;
  confidence: number;
  commitSha: string;
  verifiedAt: string;
  label?: string;
};

export type CapabilityStatus = {
  id: string;
  projectId: string;
  canonicalFeatureId: string;
  mapId: string;
  featureId: string | null;
  status: string;
  summary: string;
  gaps: string[];
  recommendedAction: string;
  evidenceIds: string[];
  canonicalFeature?: Feature;
  map?: FuncMap;
  feature?: Feature | null;
};

export type CapabilityGap = {
  id: string;
  projectId: string;
  stableKey: string;
  canonicalFeatureId: string;
  mapId: string | null;
  featureId: string | null;
  gapType: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
  title: string;
  description: string;
  evidenceIds: string[];
  recommendedAction: string;
  ownerMapId: string | null;
  canonicalFeature?: Feature;
  map?: FuncMap | null;
  feature?: Feature | null;
  ownerMap?: FuncMap | null;
};

export type Alignment = {
  id: string;
  projectId: string;
  stableKey: string;
  name: string;
  relation: string;
  status: string;
  description: string;
  members: Array<{
    id: string;
    targetType: string;
    targetId: string;
    role: string;
    note: string;
    label?: string;
  }>;
};

export type FeatureFocus = {
  id: string;
  projectId: string;
  stableKey: string;
  featureId: string;
  title: string;
  mode: string;
  status: string;
  priority: string;
  sourceType: string;
  question: string;
  scope: string;
  sourceRefs: string[];
  seedPaths: string[];
  targetMapIds: string[];
  relatedFeatureIds: string[];
  nextSteps: string[];
  findings: string;
  confidence: number;
  feature?: Feature;
  map?: FuncMap;
  targetMaps?: FuncMap[];
  relatedFeatures?: Feature[];
  createdAt: string;
  updatedAt: string;
};

export type FeatureFocusStartResult = {
  success: boolean;
  dryRun: boolean;
  rolledBack: boolean;
  map: {
    operation: string;
    data: FuncMap;
  };
  feature: {
    operation: string;
    data: Feature;
  };
  focus: {
    operation: string;
    data: FeatureFocus;
  };
  dossier: FeatureDossier;
};

export type FeatureSearchCandidate = {
    feature: Feature;
    map: FuncMap;
    score: number;
    reasons: string[];
    openFocuses: FeatureFocus[];
    codeReferenceCount: number;
    matchingCodeReferences: CodeReference[];
    gapCount: number;
    openGaps: CapabilityGap[];
    alignmentCount: number;
    nextAction: string;
};

export type FeatureSearchResult = {
  project: Project;
  query: string;
  path: string;
  candidates: FeatureSearchCandidate[];
  suggestedStart: {
    canonicalMapStableKey: string;
    canonicalFeatureStableKey: string;
    featureName: string;
    reason: string;
  } | null;
  page: {
    limit: number;
    candidateCount: number;
  };
  summary: {
    openFocusCount: number;
    exactStableKeyMatches: number;
    codeReferenceMatches: number;
  };
};

export type PreparedFeatureWork = {
  project: Project;
  readiness: 'ready' | 'ambiguous' | 'needs_start';
  search: FeatureSearchResult | null;
  selectedCandidate: FeatureSearchCandidate | null;
  selectedFocus: FeatureFocus | null;
  dossier: FeatureDossier | null;
  programmingContext: ProgrammingContext | null;
  suggestedStart: FeatureSearchResult['suggestedStart'];
  nextSteps: string[];
  recommendedToolCalls: Array<{
    toolName: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    arguments: Record<string, unknown>;
  }>;
};

export type Overview = {
  projects: Project[];
  totals: {
    projects: number;
    maps: number;
    features: number;
    entryPoints: number;
    codeReferences: number;
    alignments: number;
    featureFocuses: number;
    openFeatureFocuses: number;
    scanRuns: number;
  };
};

export type ProjectTree = {
  project: Project;
  maps: FuncMap[];
  entryPoints: EntryPoint[];
  codeReferences: CodeReference[];
  evidence: Evidence[];
  alignments: Alignment[];
};

export type FeatureDossier = {
  project: Project;
  focus: {
    feature: Feature;
    map: FuncMap;
  };
  canonicalFeature: Feature;
  canonicalMap: FuncMap;
  statusMatrix: {
    statuses: CapabilityStatus[];
    gaps: CapabilityGap[];
    evidence: Evidence[];
    summary: {
      statusCounts: Record<string, number>;
      openGapCount: number;
      highSeverityGapCount: number;
    };
  } | null;
  implementationSlices: CapabilityStatus[];
  gaps: CapabilityGap[];
  evidence: Evidence[];
  codeReferences: CodeReference[];
  entryPoints: EntryPoint[];
  alignments: Alignment[];
  relatedFeatures: Feature[];
  selectedFocus: FeatureFocus | null;
  focuses: FeatureFocus[];
  qualityIssues: Array<{
    severity: 'error' | 'warning' | 'info';
    code: string;
    targetType: string;
    targetId: string;
    message: string;
    hint: string;
  }>;
  summary: {
    isCanonical: boolean;
    statusCounts: Record<string, number>;
    evidenceSourceCounts: Record<string, number>;
    openGapCount: number;
    highSeverityGapCount: number;
    codeReferenceCount: number;
    entryPointCount: number;
    alignmentCount: number;
    relatedFeatureCount: number;
    openFocusCount: number;
  };
};

export type ProgrammingContext = {
  project: Project;
  map: FuncMap;
  feature: Feature;
  details: FeatureDetail | null;
  selectedFocus: FeatureFocus | null;
  focuses: FeatureFocus[];
  seedPathContexts: Array<{
    projectId: string;
    path: string;
    pathMode: string;
    entryPoints: EntryPoint[];
    codeReferences: CodeReference[];
    maps: FuncMap[];
    features: Feature[];
    alignments: Alignment[];
  }>;
  nextActions: Array<{
    priority: 'high' | 'medium' | 'low';
    source: string;
    title: string;
    detail: string;
    targetType: string;
    targetId: string;
  }>;
  requiredEntryPoints: EntryPoint[];
  keyCodeReferences: CodeReference[];
  relatedProductCapabilities: Feature[];
  alignments: Alignment[];
  impactedFeatures: Feature[];
  evidence: Evidence[];
  capabilityMatrix: FeatureDossier['statusMatrix'];
  capabilityGaps: CapabilityGap[];
  risks: string[];
  acceptanceCriteria: string[];
  verification: string[];
  qualityIssues: FeatureDossier['qualityIssues'];
};

export type FeatureReadiness = {
  project: Project;
  map: FuncMap;
  feature: Feature;
  selectedFocus: FeatureFocus | null;
  readiness: 'ready' | 'needs_analysis' | 'needs_evidence' | 'needs_alignment' | 'blocked';
  score: number;
  requiredAxes: string[];
  axisCoverage: Array<{
    axis: string;
    status: 'covered' | 'missing' | 'partial';
    maps: FuncMap[];
    implementationStatuses: CapabilityStatus[];
  }>;
  checks: Array<{
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    severity: 'high' | 'medium' | 'low';
    message: string;
    hint: string;
    targetType?: string;
    targetId?: string;
  }>;
  missingAxes: string[];
  nextSteps: string[];
  recommendedToolCalls: Array<{
    toolName: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    arguments: Record<string, unknown>;
  }>;
  dossier: FeatureDossier;
  qualityReport: {
    projectId: string;
    summary: Record<string, number>;
    issues: FeatureDossier['qualityIssues'];
  };
};
