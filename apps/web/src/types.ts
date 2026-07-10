export type Catalog = {
  labels: {
    projectStatus: Record<string, string>;
    featureSetType: Record<string, string>;
    featureSetStatus: Record<string, string>;
    featureStatus: Record<string, string>;
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

export type FeatureSet = {
  id: string;
  projectId: string;
  stableKey: string;
  name: string;
  version: string;
  type: string;
  status: string;
  owner: string;
  description: string;
  features?: Feature[];
};

export type Feature = {
  id: string;
  projectId: string;
  featureSetId: string;
  parentFeatureId: string | null;
  stableKey: string;
  name: string;
  version: string;
  status: string;
  kind: string;
  description: string;
  children?: Feature[];
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
    featureSets: number;
    features: number;
    alignments: number;
  };
};

export type ProjectTree = {
  project: Project;
  featureSets: FeatureSet[];
  alignments: Alignment[];
};
