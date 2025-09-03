/**
 * Unified Dashboard - ONE place to see everything
 * No more jumping between tabs!
 */

import { getSeverity, calculateRealHealthScore, getHealthColor, getHealthLabel } from '../../validator/severity-config';

export interface UnifiedIssue {
  file: string;
  line?: number;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  source: 'contract' | 'type' | 'code-quality' | 'business-logic';
  fix?: string;
}

export interface UnifiedReport {
  // What WILL break
  criticalIssues: UnifiedIssue[];
  
  // What SHOULD be fixed
  warnings: UnifiedIssue[];
  
  // Nice to have
  suggestions: UnifiedIssue[];
  
  // Real health score
  healthScore: number;
  
  // Summary
  summary: {
    willBreak: boolean;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    topPriority: string;
  };
}

export async function getUnifiedReport(projectPath: string): Promise<UnifiedReport> {
  // Server-side imports - we need to get data directly, not via fetch
  const { ContractValidator } = require('../../validator/contract-validator');
  const { NineRulesValidator } = require('../../validator/nine-rules-validator');
  const { TableMapper } = require('../../validator/table-mapper');
  const { BusinessLogicAnalyzer } = require('../../analyzer/business-logic-analyzer');
  
  // Run validators directly
  const contractValidator = new ContractValidator(projectPath);
  const nineRulesValidator = new NineRulesValidator(projectPath);
  const tableMapper = new TableMapper(projectPath);
  const businessAnalyzer = new BusinessLogicAnalyzer(projectPath);
  
  const [contracts, codeQuality, tables, business] = await Promise.all([
    contractValidator.validate().catch((err: any) => ({ violations: [] })),
    nineRulesValidator.validateAll().catch((err: any) => ({ results: [] })),
    tableMapper.analyze().catch((err: any) => ({ tables: new Map() })),
    businessAnalyzer.analyze().catch((err: any) => ({ rules: [] }))
  ]) as [any, any, any, any];

  const allIssues: UnifiedIssue[] = [];

  // Process contract violations - THESE ARE CRITICAL!
  if (contracts.violations) {
    contracts.violations.forEach((violation: any) => {
      allIssues.push({
        file: violation.location?.split(':')[0] || 'unknown',
        line: parseInt(violation.location?.split(':')[1]) || 0,
        message: violation.message,
        severity: violation.type === 'error' ? 'CRITICAL' : 'WARNING',
        source: 'contract',
        fix: violation.suggestion
      });
    });
  }

  // Process code quality - Properly categorize
  if (codeQuality.results) {
    codeQuality.results.forEach((rule: any) => {
      if (rule.issues) {
        rule.issues.forEach((issue: any) => {
          // Fix the backwards logic!
          let severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';
          
          // Type issues are CRITICAL
          if (rule.rule.includes('Type') || rule.rule.includes('Database')) {
            severity = 'CRITICAL';
          }
          // Error handling is just a warning
          else if (rule.rule.includes('Error') || rule.rule.includes('Loading')) {
            severity = 'WARNING';
          }
          
          allIssues.push({
            file: issue.file,
            line: issue.line,
            message: issue.message,
            severity,
            source: 'code-quality',
            fix: issue.suggestion
          });
        });
      }
    });
  }

  // Categorize issues properly
  const criticalIssues = allIssues.filter(i => i.severity === 'CRITICAL');
  const warnings = allIssues.filter(i => i.severity === 'WARNING');
  const suggestions = allIssues.filter(i => i.severity === 'INFO');

  // Calculate REAL health score
  const healthScore = calculateRealHealthScore(allIssues);

  // Determine top priority
  let topPriority = 'All good!';
  if (criticalIssues.length > 0) {
    topPriority = `FIX NOW: ${criticalIssues[0].message}`;
  } else if (warnings.length > 0) {
    topPriority = `Consider fixing: ${warnings[0].message}`;
  }

  return {
    criticalIssues,
    warnings,
    suggestions,
    healthScore,
    summary: {
      willBreak: criticalIssues.length > 0,
      criticalCount: criticalIssues.length,
      warningCount: warnings.length,
      infoCount: suggestions.length,
      topPriority
    }
  };
}

export function renderUnifiedDashboard(report: UnifiedReport): string {
  const healthColor = getHealthColor(report.healthScore);
  const healthLabel = getHealthLabel(report.healthScore);

  return `
    <div style="padding: 20px; max-width: 1400px; margin: 0 auto;">
      <!-- Main Status Banner -->
      <div style="background: ${report.summary.willBreak ? '#7f1d1d' : '#1a1a1a'}; 
                  padding: 30px; 
                  border-radius: 12px; 
                  margin-bottom: 30px;
                  border: 2px solid ${report.summary.willBreak ? '#ef4444' : '#333'};">
        
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="color: #f8fafc; margin: 0; font-size: 32px;">
              ${report.summary.willBreak ? '🚨 YOUR CODE WILL BREAK!' : '✅ Code is Stable'}
            </h1>
            <p style="color: ${report.summary.willBreak ? '#fca5a5' : '#94a3b8'}; 
                      margin-top: 10px; 
                      font-size: 18px;">
              ${report.summary.topPriority}
            </p>
          </div>
          
          <div style="text-align: center;">
            <div style="font-size: 48px; 
                        font-weight: bold; 
                        color: ${healthColor};">
              ${report.healthScore}%
            </div>
            <div style="color: #94a3b8; font-size: 14px;">${healthLabel}</div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div style="display: grid; 
                    grid-template-columns: repeat(3, 1fr); 
                    gap: 20px; 
                    margin-top: 30px;">
          
          <div style="background: rgba(239, 68, 68, 0.1); 
                      padding: 15px; 
                      border-radius: 8px; 
                      border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="color: #ef4444; font-size: 24px; font-weight: bold;">
              ${report.summary.criticalCount}
            </div>
            <div style="color: #fca5a5; font-size: 12px;">
              WILL BREAK CODE
            </div>
          </div>

          <div style="background: rgba(245, 158, 11, 0.1); 
                      padding: 15px; 
                      border-radius: 8px; 
                      border: 1px solid rgba(245, 158, 11, 0.3);">
            <div style="color: #f59e0b; font-size: 24px; font-weight: bold;">
              ${report.summary.warningCount}
            </div>
            <div style="color: #fcd34d; font-size: 12px;">
              Should Fix
            </div>
          </div>

          <div style="background: rgba(59, 130, 246, 0.1); 
                      padding: 15px; 
                      border-radius: 8px; 
                      border: 1px solid rgba(59, 130, 246, 0.3);">
            <div style="color: #3b82f6; font-size: 24px; font-weight: bold;">
              ${report.summary.infoCount}
            </div>
            <div style="color: #93bbfe; font-size: 12px;">
              Nice to Have
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Issues (if any) -->
      ${report.criticalIssues.length > 0 ? `
        <div style="background: #1a1a1a; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 20px;
                    border-left: 4px solid #ef4444;">
          <h2 style="color: #ef4444; margin: 0 0 20px 0;">
            🚨 Critical Issues - FIX IMMEDIATELY
          </h2>
          
          ${report.criticalIssues.slice(0, 10).map(issue => `
            <div style="background: #0a0a0a; 
                        padding: 15px; 
                        border-radius: 6px; 
                        margin-bottom: 10px;">
              <div style="display: flex; 
                          align-items: start; 
                          justify-content: space-between;">
                <div style="flex: 1;">
                  <div style="color: #f8fafc; 
                              font-weight: 500; 
                              margin-bottom: 5px;">
                    ${issue.message}
                  </div>
                  <div style="color: #64748b; 
                              font-size: 12px; 
                              font-family: monospace;">
                    ${issue.file}${issue.line ? `:${issue.line}` : ''}
                  </div>
                  ${issue.fix ? `
                    <div style="color: #10b981; 
                                font-size: 13px; 
                                margin-top: 8px;">
                      💡 Fix: ${issue.fix}
                    </div>
                  ` : ''}
                </div>
                <span style="background: #ef4444; 
                             color: white; 
                             padding: 2px 8px; 
                             border-radius: 4px; 
                             font-size: 11px;">
                  ${issue.source.toUpperCase()}
                </span>
              </div>
            </div>
          `).join('')}
          
          ${report.criticalIssues.length > 10 ? `
            <div style="color: #ef4444; 
                        text-align: center; 
                        margin-top: 10px; 
                        font-size: 14px;">
              ... and ${report.criticalIssues.length - 10} more critical issues
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Warnings -->
      ${report.warnings.length > 0 ? `
        <div style="background: #1a1a1a; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 20px;
                    border-left: 4px solid #f59e0b;">
          <h2 style="color: #f59e0b; margin: 0 0 20px 0;">
            ⚠️ Warnings - Should Fix
          </h2>
          
          ${report.warnings.slice(0, 5).map(issue => `
            <div style="background: #0a0a0a; 
                        padding: 12px; 
                        border-radius: 6px; 
                        margin-bottom: 8px;">
              <div style="color: #e2e8f0; font-size: 14px;">
                ${issue.message}
              </div>
              <div style="color: #64748b; 
                          font-size: 11px; 
                          margin-top: 4px;">
                ${issue.file}
              </div>
            </div>
          `).join('')}
          
          ${report.warnings.length > 5 ? `
            <div style="color: #94a3b8; 
                        text-align: center; 
                        margin-top: 10px; 
                        font-size: 13px;">
              + ${report.warnings.length - 5} more warnings
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Action Button -->
      <div style="text-align: center; margin-top: 30px;">
        ${report.summary.willBreak ? `
          <button onclick="fixCriticalIssues()" 
                  style="padding: 15px 30px; 
                         background: #ef4444; 
                         border: none; 
                         border-radius: 8px; 
                         color: white; 
                         font-size: 16px; 
                         font-weight: bold; 
                         cursor: pointer;">
            🔧 Auto-Fix Critical Issues
          </button>
        ` : `
          <button onclick="runFullValidation()" 
                  style="padding: 15px 30px; 
                         background: #10b981; 
                         border: none; 
                         border-radius: 8px; 
                         color: white; 
                         font-size: 16px; 
                         cursor: pointer;">
            ✅ All Good - Run Full Check
          </button>
        `}
      </div>
    </div>
  `;
}