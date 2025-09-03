/**
 * Dashboard type definitions
 */

export interface DashboardResult {
  projectName: string;
  projectPath: string;
  timestamp: Date;
  data?: any;
}

export interface NineRulesValidationResult {
  overallScore: number;
  passedRules: number;
  totalRules: number;
  criticalIssues: number;
  warnings: number;
  results: any[];
}

export interface ContractValidationResult {
  violations: ContractViolation[];
  totalChecked: number;
  passed: number;
  failed: number;
  timestamp: Date;
  score?: number;
}

export interface ContractViolation {
  entity: string;
  location: string;
  type: string;
  message: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
}

export function parseContractErrors(violations: any[]): ContractViolation[] {
  return violations.map(v => ({
    entity: v.entity || 'Unknown',
    location: v.location || '',
    type: v.type || 'error',
    message: v.message || '',
    expected: v.expected,
    actual: v.actual,
    suggestion: v.suggestion
  }));
}

export type ContractGrouping = 'table' | 'severity' | 'file';

// HTML rendering functions (these are now in modular-fixed.html)
export function renderDataFlowWithTabs(data: any): string {
  return `<!DOCTYPE html><html><body>Data flow visualization moved to modular dashboard</body></html>`;
}

export function renderContractView(result: ContractValidationResult, groupBy: string): string {
  return `<!DOCTYPE html><html><body>Contract view moved to modular dashboard</body></html>`;
}