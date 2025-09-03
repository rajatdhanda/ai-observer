/**
 * Shared TypeScript types for AI Observer
 */

export interface ProjectConfig {
  name: string;
  path: string;
  type: 'nextjs' | 'react' | 'node' | 'express' | 'unknown';
  framework?: {
    name: string;
    version: string;
  };
}

export interface TableInfo {
  name: string;
  schemaFile: string;
  score: number;
  properties: PropertyInfo[];
  relationships: RelationshipInfo[];
  hooks: HookUsage[];
  components: string[];
  apiRoutes: string[];
  mutations: string[];
  queries: QueryInfo[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: string[];
}

export interface RelationshipInfo {
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'manyToMany';
  target: string;
  field: string;
  through?: string;
}

export interface HookUsage {
  hookName: string;
  file: string;
  line: number;
  operations: string[];
  hasErrorHandling: boolean;
  hasValidation: boolean;
}

export interface QueryInfo {
  id: string;
  tableName: string;
  operation: 'findMany' | 'findUnique' | 'create' | 'update' | 'delete';
  file: string;
  line: number;
  hookName?: string;
  hasValidation: boolean;
  hasErrorHandling: boolean;
}

export interface ArchitectureItem {
  name: string;
  file: string;
  type: 'table' | 'hook' | 'component' | 'api' | 'page';
  healthScore: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  contractErrors: number;
  contractWarnings: number;
  codeQualityErrors: number;
  codeQualityWarnings: number;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  violations: ValidationViolation[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    topPriority?: string;
  };
}

export interface ValidationViolation {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface DashboardState {
  project: ProjectConfig;
  tables: TableInfo[];
  architecture: {
    hooks: ArchitectureItem[];
    components: ArchitectureItem[];
    apis: ArchitectureItem[];
    pages: ArchitectureItem[];
  };
  validation: ValidationResult;
  lastUpdated: Date;
  isLoading: boolean;
  error?: string;
}

export interface WebSocketMessage {
  type: 'update' | 'error' | 'notification';
  payload: any;
  timestamp: Date;
}

export interface AnalysisReport {
  project: ProjectConfig;
  timestamp: Date;
  duration: number;
  results: {
    tables: TableInfo[];
    validation: ValidationResult;
    architecture: {
      totalFiles: number;
      totalLines: number;
      complexity: number;
    };
    suggestions: string[];
  };
}