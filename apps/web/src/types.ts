export type Catalog = {
  labels: {
    projectStatus: Record<string, string>;
    mapAxis: Record<string, string>;
    mapScope: Record<string, string>;
    mapKind: Record<string, string>;
    mapStatus: Record<string, string>;
    featureStatus: Record<string, string>;
    entryPointKind: Record<string, string>;
    codeReferenceKind: Record<string, string>;
    codeReferenceRoleInFeature: Record<string, string>;
    evidenceType: Record<string, string>;
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

export type Overview = {
  projects: Project[];
  totals: {
    projects: number;
    maps: number;
    features: number;
    entryPoints: number;
    codeReferences: number;
    alignments: number;
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
