/**
 * Analysis Types - Extracted for better maintainability
 * Used by smart issue analyzer and reporting systems
 */

export interface Issue {
  file: string;
  line: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  category?: string;
  feature?: string;
  impacts?: string[];
  suggestion?: string;
  rule?: string;
}

export interface IssueBucket {
  name: 'BLOCKERS' | 'STRUCTURAL' | 'COMPLIANCE';
  title: string;
  description: string;
  color: string;
  priority: number;
  issues: Issue[];
  count: number;
}

export interface IssueGroup {
  group: number;
  title: string;
  why: string;
  fixes: Array<{
    file: string;
    issue: string;
    fix: string;
  }>;
}