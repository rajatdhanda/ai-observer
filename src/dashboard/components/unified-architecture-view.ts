/**
 * Unified Architecture Component - Combines existing working validation components
 * Reuses logic from contract-view.ts and enhanced-nine-rules-view.ts
 */

import { groupViolations } from './contract-view.js';
import { groupNineRulesIssues } from './enhanced-nine-rules-view.js';

export interface ArchitectureItem {
  name: string;
  file: string;
  type: 'hook' | 'component' | 'api' | 'page';
  healthScore: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  contractErrors: number;
  contractWarnings: number;
  codeQualityErrors: number;
  codeQualityWarnings: number;
}

/**
 * Gets comprehensive architecture data by combining file discovery with validation results
 * Uses the same logic as the working dashboard tabs
 */
export async function getArchitectureData(type: 'hook' | 'component' | 'api' | 'page'): Promise<ArchitectureItem[]> {
  try {
    // Use same endpoints as working tabs
    const [nineRulesRes, contractsRes, filesRes] = await Promise.all([
      fetch('/api/nine-rules'),
      fetch('/api/contracts'),
      fetch(`/api/discover-files?type=${type}`)
    ]);

    const [nineRulesData, contractsData, filesData] = await Promise.all([
      nineRulesRes.json(),
      contractsRes.json(),
      filesRes.json()
    ]);

    // Process each discovered file
    const items: ArchitectureItem[] = filesData.files.map((filePath: string) => {
      const item = createArchitectureItem(filePath, type);
      
      // Count contract violations for this file - separate errors and warnings
      const fileContractViolations = contractsData.violations?.filter((violation: any) => 
        violation.location?.includes(filePath)
      ) || [];
      const contractErrors = fileContractViolations.filter((v: any) => v.type === 'error').length;
      const contractWarnings = fileContractViolations.filter((v: any) => v.type === 'warning').length;

      // Count nine-rules issues for this file - separate critical and warnings
      const fileCQIssues = getCodeQualityIssuesForFile(nineRulesData, filePath);
      const codeQualityErrors = fileCQIssues.filter((i: any) => i.severity === 'critical').length;
      const codeQualityWarnings = fileCQIssues.filter((i: any) => i.severity === 'warning').length;

      const totalErrors = contractErrors + codeQualityErrors;
      const totalWarnings = contractWarnings + codeQualityWarnings;
      const totalIssues = totalErrors + totalWarnings;
      
      return {
        ...item,
        errorCount: totalErrors,
        warningCount: totalWarnings,
        contractErrors,
        contractWarnings,
        codeQualityErrors,
        codeQualityWarnings,
        issueCount: totalIssues,
        healthScore: calculateHealthScore(totalErrors, totalWarnings)
      };
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Error getting architecture data:', error);
    return [];
  }
}

function createArchitectureItem(filePath: string, type: string): ArchitectureItem {
  let name: string;
  
  switch (type) {
    case 'hook':
      name = filePath.match(/use[A-Z]\w+/)?.[0] || 
             filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Unknown Hook';
      break;
    case 'component':
      name = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Unknown Component';
      break;
    case 'api':
      name = filePath.replace(/.*\/api/, '/api');
      break;
    case 'page':
      const pagePath = filePath.replace(/.*\/app/, '').replace(/\/page\.(ts|tsx|js|jsx)$/, '') || '/';
      name = pagePath === '/' ? 'Home' : pagePath.split('/').filter(Boolean).join(' > ');
      break;
    default:
      name = 'Unknown';
  }

  return {
    name,
    file: filePath,
    type: type as any,
    healthScore: 100,
    issueCount: 0,
    errorCount: 0,
    warningCount: 0,
    contractErrors: 0,
    contractWarnings: 0,
    codeQualityErrors: 0,
    codeQualityWarnings: 0
  };
}

function countNineRulesIssuesForFile(nineRulesData: any, filePath: string): number {
  if (!nineRulesData?.results) return 0;
  
  return nineRulesData.results.reduce((count: number, rule: any) => {
    const fileIssues = rule.issues?.filter((issue: any) => issue.file === filePath).length || 0;
    return count + fileIssues;
  }, 0);
}

function calculateHealthScore(errors: number, warnings: number): number {
  if (errors === 0 && warnings === 0) return 100;
  
  // Objective scoring:
  // - Critical errors: 20 points each (max 80 points deduction)
  // - Warnings: 5 points each (max 20 points deduction)
  const errorDeduction = Math.min(errors * 20, 80);
  const warningDeduction = Math.min(warnings * 5, 20);
  
  return Math.max(0, 100 - errorDeduction - warningDeduction);
}

/**
 * Generate unified diagnostic HTML using existing component patterns
 */
export async function generateUnifiedDiagnostic(itemName: string, itemType: string, filePath: string): Promise<string> {
  try {
    const [nineRulesRes, contractsRes] = await Promise.all([
      fetch('/api/nine-rules'),
      fetch('/api/contracts')
    ]);

    const [nineRulesData, contractsData] = await Promise.all([
      nineRulesRes.json(),
      contractsRes.json()
    ]);

    // Filter issues for this specific file using same logic as tabs
    const contractViolations = contractsData.violations?.filter((v: any) => 
      v.location?.includes(filePath)
    ) || [];

    const codeQualityIssues = getCodeQualityIssuesForFile(nineRulesData, filePath);
    
    const contractErrors = contractViolations.filter((v: any) => v.type === 'error').length;
    const contractWarnings = contractViolations.filter((v: any) => v.type === 'warning').length;
    const codeQualityErrors = codeQualityIssues.filter((i: any) => i.severity === 'critical').length;
    const codeQualityWarnings = codeQualityIssues.filter((i: any) => i.severity === 'warning').length;
    
    const totalErrors = contractErrors + codeQualityErrors;
    const totalWarnings = contractWarnings + codeQualityWarnings;
    const totalIssues = totalErrors + totalWarnings;
    const healthScore = calculateHealthScore(totalErrors, totalWarnings);

    return renderUnifiedDiagnostic(itemName, itemType, healthScore, contractViolations, codeQualityIssues);
    
  } catch (error) {
    console.error('Error generating diagnostic:', error);
    return `<div style="padding: 20px; color: #ef4444;">Error loading diagnostic data</div>`;
  }
}

function getCodeQualityIssuesForFile(nineRulesData: any, filePath: string): any[] {
  if (!nineRulesData?.results) return [];
  
  const issues: any[] = [];
  nineRulesData.results.forEach((rule: any) => {
    rule.issues?.forEach((issue: any) => {
      if (issue.file === filePath) {
        issues.push({
          rule: rule.rule,
          ruleNumber: rule.ruleNumber,
          ...issue
        });
      }
    });
  });
  
  return issues;
}

function renderUnifiedDiagnostic(
  itemName: string, 
  itemType: string, 
  healthScore: number,
  contractViolations: any[],
  codeQualityIssues: any[]
): string {
  const totalIssues = contractViolations.length + codeQualityIssues.length;
  const healthClass = healthScore >= 80 ? 'health-good' : healthScore >= 40 ? 'health-warning' : 'health-error';
  const critical = codeQualityIssues.filter(i => i.severity === 'critical').length;
  const warnings = codeQualityIssues.filter(i => i.severity === 'warning').length;

  return `
    <div style="padding: 20px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 30px;">
        <div style="font-size: 24px;">${getItemIcon(itemType)}</div>
        <div>
          <h2 style="margin: 0; color: #f8fafc;">${itemName}</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; text-transform: capitalize;">${itemType}</p>
        </div>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
          <span style="color: #94a3b8;">Health Score:</span>
          <span class="health-indicator ${healthClass}" style="margin-right: 8px;"></span>
          <span style="color: #f8fafc; font-weight: bold;">${healthScore}%</span>
        </div>
      </div>

      ${totalIssues === 0 ? 
        '<div style="text-align: center; padding: 40px; color: #10b981; font-size: 18px;">✅ No issues found</div>' :
        `
        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;">
          <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; border-left: 4px solid ${codeQualityIssues.length > 0 ? (critical > 0 ? '#ef4444' : '#f59e0b') : '#10b981'};">
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">Code Quality</div>
            <div style="color: #f8fafc; font-size: 20px; font-weight: bold;">${codeQualityIssues.length}</div>
            <div style="color: #94a3b8; font-size: 11px;">${critical} critical, ${warnings} warnings</div>
          </div>
          <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; border-left: 4px solid ${contractViolations.length > 0 ? '#f59e0b' : '#10b981'};">
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">Contracts</div>
            <div style="color: #f8fafc; font-size: 20px; font-weight: bold;">${contractViolations.length}</div>
            <div style="color: #94a3b8; font-size: 11px;">Type safety violations</div>
          </div>
        </div>

        ${renderCodeQualitySection(codeQualityIssues)}
        ${renderContractSection(contractViolations)}
        `
      }
    </div>
  `;
}

function renderCodeQualitySection(issues: any[]): string {
  if (issues.length === 0) return '';
  
  return `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #f8fafc; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        <span>🔍</span> Code Quality Issues
      </h3>
      ${issues.map(issue => `
        <div style="background: #1a1a1a; padding: 16px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid ${issue.severity === 'critical' ? '#ef4444' : '#f59e0b'};">
          <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 8px;">
            <div>
              <span style="color: #64748b; font-size: 12px;">Rule ${issue.ruleNumber}:</span>
              <span style="color: #f8fafc; font-weight: bold; margin-left: 8px;">${issue.rule}</span>
            </div>
            <span style="background: ${issue.severity === 'critical' ? '#ef4444' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">
              ${issue.severity}
            </span>
          </div>
          <div style="color: #e2e8f0; margin-bottom: 8px; font-size: 14px;">${issue.message}</div>
          ${issue.line ? `<div style="color: #64748b; font-size: 12px; font-family: monospace; margin-bottom: 8px;">Line ${issue.line}</div>` : ''}
          ${issue.codeSnippet ? `<div style="background: #0a0a0a; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #94a3b8; margin-bottom: 8px; border-left: 3px solid #334155;">${issue.codeSnippet}</div>` : ''}
          ${issue.suggestion ? `<div style="color: #10b981; font-size: 13px; margin-top: 8px;">💡 ${issue.suggestion}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderContractSection(violations: any[]): string {
  if (violations.length === 0) return '';
  
  return `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #f8fafc; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        <span>📋</span> Contract Violations
      </h3>
      ${violations.map(violation => `
        <div style="background: #1a1a1a; padding: 16px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #f8fafc; font-weight: bold;">${violation.entity || 'Contract'}</span>
            <span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">CONTRACT</span>
          </div>
          <div style="color: #e2e8f0; margin-bottom: 8px; font-size: 14px;">${violation.message}</div>
          ${violation.location ? `<div style="color: #64748b; font-size: 12px; font-family: monospace; margin-bottom: 8px;">${violation.location}</div>` : ''}
          ${violation.expected ? `<div style="background: #0a0a0a; padding: 8px; border-radius: 4px; margin-bottom: 4px;"><span style="color: #64748b; font-size: 11px;">Expected:</span> <span style="color: #10b981; font-family: monospace;">${violation.expected}</span></div>` : ''}
          ${violation.actual ? `<div style="background: #0a0a0a; padding: 8px; border-radius: 4px;"><span style="color: #64748b; font-size: 11px;">Actual:</span> <span style="color: #ef4444; font-family: monospace;">${violation.actual}</span></div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function getItemIcon(itemType: string): string {
  const icons = {
    hook: '🔗',
    component: '🧩', 
    api: '🌐',
    page: '📄',
    table: '📊'
  };
  return icons[itemType as keyof typeof icons] || '📁';
}