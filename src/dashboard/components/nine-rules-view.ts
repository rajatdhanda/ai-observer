/**
 * Dashboard component for displaying 9-rules validation results
 */

import { ValidationSummary, ValidationResult } from '../../validator/nine-rules-validator';

export function renderNineRulesView(summary: ValidationSummary | null): string {
  if (!summary) {
    return `
      <div style="padding: 20px; color: #64748b;">
        <h2 style="margin-bottom: 20px;">🔍 9 Core Rules Validation</h2>
        <p>No validation data available. Run validation first:</p>
        <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; margin-top: 10px;">
npm run validate
# or
npx ts-node src/cli/validate.ts</pre>
      </div>
    `;
  }

  const grade = summary.overallScore >= 90 ? 'A' :
                summary.overallScore >= 80 ? 'B' :
                summary.overallScore >= 70 ? 'C' :
                summary.overallScore >= 60 ? 'D' : 'F';
  
  const gradeColor = summary.overallScore >= 80 ? '#10b981' :
                     summary.overallScore >= 60 ? '#f59e0b' : '#ef4444';

  return `
    <div style="padding: 20px;">
      <h2 style="margin-bottom: 30px;">🔍 9 Core Rules Validation</h2>
      
      <!-- Overall Score Card -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 24px; margin-bottom: 10px;">Overall Health Score</h3>
            <div style="display: flex; align-items: baseline; gap: 20px;">
              <span style="font-size: 48px; font-weight: bold;">${grade}</span>
              <span style="font-size: 36px;">${summary.overallScore}%</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: flex; gap: 30px;">
              <div>
                <div style="font-size: 24px; font-weight: bold;">✅ ${summary.passedRules}</div>
                <div style="opacity: 0.9;">Passed</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold;">❌ ${summary.criticalIssues}</div>
                <div style="opacity: 0.9;">Critical</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold;">⚠️ ${summary.warnings}</div>
                <div style="opacity: 0.9;">Warnings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-bottom: 20px; color: #e2e8f0;">📊 Key Metrics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${renderMetric('Contract Coverage', summary.metrics.contractCoverage)}
          ${renderMetric('Parse Coverage', summary.metrics.parseCoverage)}
          ${renderMetric('DB Drift Score', summary.metrics.dbDriftScore)}
          ${renderMetric('Cache Hygiene', summary.metrics.cacheHygiene)}
          ${renderMetric('Auth Coverage', summary.metrics.authCoverage)}
        </div>
      </div>

      <!-- Individual Rules -->
      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
        <h3 style="margin-bottom: 20px; color: #e2e8f0;">📋 Rule-by-Rule Analysis</h3>
        <div style="display: grid; gap: 15px;">
          ${summary.results.map(result => renderRuleCard(result)).join('')}
        </div>
      </div>

      <!-- Critical Issues -->
      ${renderCriticalIssues(summary)}

      <!-- Action Items -->
      ${renderActionItems(summary)}
    </div>
  `;
}

function renderMetric(name: string, value: number): string {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  
  return `
    <div style="background: #0f0f0f; padding: 15px; border-radius: 6px; border: 1px solid #333;">
      <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">${name}</div>
      <div style="display: flex; align-items: baseline; gap: 5px;">
        <span style="font-size: 28px; font-weight: bold; color: ${color};">${value}</span>
        <span style="color: #64748b; font-size: 14px;">%</span>
      </div>
      <div style="margin-top: 8px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
        <div style="height: 100%; width: ${value}%; background: ${color};"></div>
      </div>
    </div>
  `;
}

function renderRuleCard(result: ValidationResult): string {
  const icon = result.status === 'pass' ? '✅' :
               result.status === 'warning' ? '⚠️' : '❌';
  
  const statusColor = result.status === 'pass' ? '#10b981' :
                     result.status === 'warning' ? '#f59e0b' : '#ef4444';
  
  const bgColor = result.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' :
                  result.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                  'rgba(239, 68, 68, 0.1)';

  // Calculate bug prevention percentage based on rule
  const bugPercentages: Record<number, string> = {
    1: '30%', 2: '25%', 3: '20%', 4: '15%', 5: '10%',
    6: '5%', 7: '5%', 8: '5%', 9: '5%'
  };

  return `
    <div style="background: ${bgColor}; padding: 15px; border-radius: 8px; border: 1px solid ${statusColor}33;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${icon}</span>
          <div>
            <div style="font-weight: 600; color: #e2e8f0;">
              Rule ${result.ruleNumber}: ${result.rule}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              Prevents ${bugPercentages[result.ruleNumber]} of bugs
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 24px; font-weight: bold; color: ${statusColor};">
            ${result.score}%
          </div>
          <div style="font-size: 12px; color: #64748b;">
            ${result.coverage.passed}/${result.coverage.total} passed
          </div>
        </div>
      </div>
      
      ${result.issues.length > 0 ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;">
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">
            Top Issues:
          </div>
          ${result.issues.slice(0, 3).map(issue => `
            <div style="margin-bottom: 5px; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 4px;">
              <div style="display: flex; gap: 5px; align-items: start;">
                <span style="color: ${issue.severity === 'critical' ? '#ef4444' : '#f59e0b'}; font-size: 10px;">
                  ${issue.severity === 'critical' ? '●' : '○'}
                </span>
                <div style="flex: 1;">
                  <div style="font-size: 11px; color: #e2e8f0;">${issue.message}</div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                    ${issue.file.replace(/.*\/(src|app|pages)/, '$1')}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
          ${result.issues.length > 3 ? `
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
              +${result.issues.length - 3} more issues
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function renderCriticalIssues(summary: ValidationSummary): string {
  const criticalIssues = summary.results.flatMap(r => 
    r.issues.filter(i => i.severity === 'critical')
  ).slice(0, 10);

  if (criticalIssues.length === 0) {
    return '';
  }

  return `
    <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid rgba(239, 68, 68, 0.3);">
      <h3 style="color: #fca5a5; margin-bottom: 15px;">🚨 Critical Issues (Fix Immediately)</h3>
      <div style="display: grid; gap: 10px;">
        ${criticalIssues.map(issue => `
          <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
            <div style="color: #ef4444; font-weight: 500; margin-bottom: 5px;">
              ${issue.message}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 3px;">
              📁 ${issue.file.replace(/.*\/(src|app|pages)/, '$1')}
            </div>
            <div style="font-size: 12px; color: #60a5fa;">
              💡 ${issue.suggestion}
            </div>
            ${issue.codeSnippet ? `
              <pre style="margin-top: 5px; padding: 5px; background: #000; border-radius: 4px; font-size: 11px; color: #64d86b; overflow-x: auto;">
${issue.codeSnippet}</pre>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderActionItems(summary: ValidationSummary): string {
  // Sort rules by score to prioritize fixes
  const priorityRules = [...summary.results]
    .filter(r => r.status !== 'pass')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  if (priorityRules.length === 0) {
    return `
      <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid rgba(16, 185, 129, 0.3);">
        <h3 style="color: #86efac; margin-bottom: 10px;">🎉 Excellent Work!</h3>
        <p style="color: #e2e8f0;">All validation rules are passing. Your codebase follows best practices!</p>
      </div>
    `;
  }

  return `
    <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid rgba(96, 165, 250, 0.3);">
      <h3 style="color: #93c5fd; margin-bottom: 15px;">🎯 Priority Actions</h3>
      <div style="display: grid; gap: 10px;">
        ${priorityRules.map((rule, index) => `
          <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
            <div style="display: flex; gap: 10px; align-items: start;">
              <span style="background: #60a5fa; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">
                ${index + 1}
              </span>
              <div style="flex: 1;">
                <div style="color: #e2e8f0; font-weight: 500; margin-bottom: 5px;">
                  Fix Rule ${rule.ruleNumber}: ${rule.rule}
                </div>
                <div style="font-size: 12px; color: #94a3b8;">
                  Current score: ${rule.score}% | ${rule.issues.length} issues to fix
                </div>
                <div style="font-size: 12px; color: #60a5fa; margin-top: 3px;">
                  Impact: This will prevent ${getBugPercentage(rule.ruleNumber)} of production bugs
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">Quick Commands:</div>
        <pre style="background: #000; padding: 8px; border-radius: 4px; font-size: 11px; color: #64d86b;">
# Run validation
npm run validate

# Generate detailed report
npm run validate:report

# Run with auto-fix (coming soon)
npm run validate:fix</pre>
      </div>
    </div>
  `;
}

function getBugPercentage(ruleNumber: number): string {
  const percentages: Record<number, string> = {
    1: '30%', 2: '25%', 3: '20%', 4: '15%', 5: '10%',
    6: '5%', 7: '5%', 8: '5%', 9: '5%'
  };
  return percentages[ruleNumber] || '5%';
}