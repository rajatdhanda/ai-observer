/**
 * Unified Component
 * Shows all validation results with CORRECT severity
 */

import { HealthScore } from './health-score';
import { SeverityBadge } from './severity-badge';

export interface UnifiedData {
  codeQuality: any[];
  contracts: any[];
  businessLogic: any[];
  tests: any[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    topPriority: string;
  };
}

export class UnifiedComponent {
  static async fetchData(): Promise<UnifiedData> {
    // This will be called from server-side, not browser
    // Return empty data - the server will provide the actual data
    return {
      codeQuality: [],
      contracts: [],
      businessLogic: [],
      tests: [],
      summary: {
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        topPriority: 'Loading...'
      }
    };
  }
  
  static render(data: UnifiedData): string {
    const hasBreaking = data.summary.criticalCount > 0;
    const overallScore = HealthScore.calculateScore(
      data.summary.criticalCount,
      data.summary.warningCount,
      data.summary.infoCount
    );
    
    return `
      <div style="padding: 20px;">
        <!-- Main Alert Banner with CORRECT severity -->
        <div style="
          background: ${hasBreaking ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : '#1a1a1a'};
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 2px solid ${hasBreaking ? '#ef4444' : '#333'};
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h1 style="color: #f8fafc; margin: 0; font-size: 28px;">
                ${hasBreaking ? '🚨 Critical Issues Detected' : '✅ All Checks Passed'}
              </h1>
              <p style="color: ${hasBreaking ? '#fca5a5' : '#94a3b8'}; margin-top: 8px;">
                ${data.summary.topPriority}
              </p>
            </div>
            
            ${HealthScore.render({
              score: overallScore,
              criticalCount: data.summary.criticalCount,
              warningCount: data.summary.warningCount,
              infoCount: data.summary.infoCount,
              size: 'large'
            })}
          </div>
        </div>
        
        <!-- Validation Categories -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          ${this.renderCategory('Code Quality', data.codeQuality, '#6366f1')}
          ${this.renderCategory('Contracts', data.contracts, '#8b5cf6')}
          ${this.renderCategory('Business Logic', data.businessLogic, '#ec4899')}
          ${this.renderCategory('Tests', data.tests, '#10b981')}
        </div>
      </div>
    `;
  }
  
  private static renderCategory(name: string, issues: any[], color: string): string {
    // Handle undefined or null issues array
    const safeIssues = issues || [];
    
    const criticalCount = safeIssues.filter(i => 
      i.severity === 'critical' || i.severity === 'error'
    ).length;
    const warningCount = safeIssues.filter(i => i.severity === 'warning').length;
    const infoCount = safeIssues.filter(i => i.severity === 'info').length;
    
    const score = HealthScore.calculateScore(criticalCount, warningCount, infoCount);
    
    return `
      <div style="
        background: #1a1a1a;
        padding: 16px;
        border-radius: 8px;
        border-top: 3px solid ${color};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="color: #f8fafc; margin: 0; font-size: 16px;">${name}</h3>
          ${HealthScore.renderCompact(score)}
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          ${criticalCount > 0 ? `
            <span style="color: #ef4444; font-size: 12px;">
              ${criticalCount} critical
            </span>
          ` : ''}
          ${warningCount > 0 ? `
            <span style="color: #f59e0b; font-size: 12px;">
              ${warningCount} warnings
            </span>
          ` : ''}
          ${infoCount > 0 ? `
            <span style="color: #3b82f6; font-size: 12px;">
              ${infoCount} info
            </span>
          ` : ''}
        </div>
        
        ${safeIssues.slice(0, 3).map(issue => `
          <div style="
            background: #0a0a0a;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 6px;
            border-left: 2px solid ${
              issue.severity === 'critical' || issue.severity === 'error' ? '#ef4444' :
              issue.severity === 'warning' ? '#f59e0b' : '#3b82f6'
            };
          ">
            <div style="color: #e2e8f0; font-size: 12px;">
              ${issue.message || issue.issue || 'Unknown issue'}
            </div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">
              ${issue.file || issue.location || ''}
            </div>
          </div>
        `).join('')}
        
        ${safeIssues.length > 3 ? `
          <div style="color: #64748b; font-size: 11px; margin-top: 8px; text-align: center;">
            +${safeIssues.length - 3} more issues
          </div>
        ` : ''}
      </div>
    `;
  }
}