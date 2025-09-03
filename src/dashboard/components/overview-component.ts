/**
 * Overview Component
 * Main dashboard view with CORRECT severity logic
 */

import { HealthScore } from './health-score';
import { SeverityBadge } from './severity-badge';

export interface OverviewData {
  tables: any[];
  hooks: any[];
  components: any[];
  apis: any[];
  pages: any[];
  validation: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    topIssues: Array<{
      message: string;
      file: string;
      severity: string;
    }>;
  };
}

export class OverviewComponent {
  static async fetchData(): Promise<OverviewData> {
    // This will be called from server-side, not browser
    // Return empty data - the server will provide the actual data
    return {
      tables: [],
      hooks: [],
      components: [],
      apis: [],
      pages: [],
      validation: {
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        topIssues: []
      }
    };
  }
  
  static render(data: OverviewData): string {
    const overallScore = HealthScore.calculateScore(
      data.validation.criticalCount,
      data.validation.warningCount,
      data.validation.infoCount
    );
    
    const hasBreakingIssues = data.validation.criticalCount > 0;
    
    return `
      <div style="padding: 20px;">
        <!-- Main Status Banner -->
        <div style="
          background: ${hasBreakingIssues ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : '#1a1a1a'};
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 2px solid ${hasBreakingIssues ? '#ef4444' : '#333'};
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h1 style="color: #f8fafc; margin: 0; font-size: 28px;">
                ${hasBreakingIssues ? 
                  '🚨 Critical Issues Found' : 
                  '✅ No Critical Issues'}
              </h1>
              <p style="color: ${hasBreakingIssues ? '#fca5a5' : '#94a3b8'}; margin-top: 8px;">
                ${data.validation.topIssues[0]?.message || 'All systems operational'}
              </p>
            </div>
            
            ${HealthScore.render({
              score: overallScore,
              criticalCount: data.validation.criticalCount,
              warningCount: data.validation.warningCount,
              infoCount: data.validation.infoCount,
              size: 'large'
            })}
          </div>
        </div>
        
        <!-- Issue Summary -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="
            background: #1a1a1a;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #ef4444;
          ">
            <div style="color: #ef4444; font-size: 32px; font-weight: bold;">
              ${data.validation.criticalCount}
            </div>
            <div style="color: #fca5a5; font-size: 12px; margin-top: 4px;">
              CRITICAL - Will Break Code
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
              Type errors, missing imports, null references
            </div>
          </div>
          
          <div style="
            background: #1a1a1a;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
          ">
            <div style="color: #f59e0b; font-size: 32px; font-weight: bold;">
              ${data.validation.warningCount}
            </div>
            <div style="color: #fcd34d; font-size: 12px; margin-top: 4px;">
              WARNINGS - Should Fix
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
              Missing error handling, no loading states
            </div>
          </div>
          
          <div style="
            background: #1a1a1a;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          ">
            <div style="color: #3b82f6; font-size: 32px; font-weight: bold;">
              ${data.validation.infoCount}
            </div>
            <div style="color: #93bbfe; font-size: 12px; margin-top: 4px;">
              INFO - Nice to Have
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
              Optimizations, code style improvements
            </div>
          </div>
        </div>
        
        <!-- Architecture Overview -->
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f8fafc; margin: 0 0 16px 0;">Architecture Health</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            ${this.renderArchitectureCard('Tables', data.tables.length, this.calculateArchitectureHealth(data.tables))}
            ${this.renderArchitectureCard('Hooks', data.hooks.length, this.calculateArchitectureHealth(data.hooks))}
            ${this.renderArchitectureCard('Components', data.components.length, this.calculateArchitectureHealth(data.components))}
            ${this.renderArchitectureCard('API Routes', data.apis.length, this.calculateArchitectureHealth(data.apis))}
            ${this.renderArchitectureCard('Pages', data.pages.length, this.calculateArchitectureHealth(data.pages))}
          </div>
        </div>
        
        <!-- Top Issues -->
        ${data.validation.topIssues.length > 0 ? `
          <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-top: 24px;">
            <h2 style="color: #f8fafc; margin: 0 0 16px 0;">Top Priority Issues</h2>
            
            ${data.validation.topIssues.slice(0, 5).map(issue => `
              <div style="
                background: #0a0a0a;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 8px;
                border-left: 3px solid ${
                  issue.severity === 'critical' ? '#ef4444' :
                  issue.severity === 'warning' ? '#f59e0b' : '#3b82f6'
                };
              ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="color: #f8fafc; font-size: 14px;">
                      ${issue.message}
                    </div>
                    <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
                      ${issue.file}
                    </div>
                  </div>
                  ${SeverityBadge.render({ 
                    severity: issue.severity as any, 
                    compact: true 
                  })}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private static renderArchitectureCard(name: string, count: number, health: number): string {
    const color = HealthScore.getColor(health);
    
    return `
      <div style="
        background: #0a0a0a;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #333;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #94a3b8; font-size: 12px;">${name}</span>
          <span style="color: #f8fafc; font-weight: bold;">${count}</span>
        </div>
        ${HealthScore.renderBar(health, '100%')}
        <div style="color: ${color}; font-size: 11px; margin-top: 4px; text-align: right;">
          ${health}%
        </div>
      </div>
    `;
  }
  
  private static calculateArchitectureHealth(items: any[]): number {
    if (items.length === 0) return 100;
    
    let totalScore = 0;
    let criticalCount = 0;
    let warningCount = 0;
    
    items.forEach(item => {
      if (item.errorCount) criticalCount += item.errorCount;
      if (item.warningCount) warningCount += item.warningCount;
      totalScore += item.healthScore || 100;
    });
    
    // Use proper calculation
    return HealthScore.calculateScore(criticalCount, warningCount);
  }
}