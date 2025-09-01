/**
 * Validation View Component
 * Shows 80-20 validation results with actionable insights
 */

import { ValidationResult } from '../../validator';

export function renderValidationView(data: ValidationResult | null): string {
  if (!data) {
    return `
      <div style="color: #64748b; text-align: center; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
        <div style="font-size: 20px; margin-bottom: 10px;">No validation results yet</div>
        <div>Click "Run Validation" to check your project for common issues</div>
      </div>
    `;
  }

  const scoreColor = data.score >= 80 ? '#10b981' : 
                    data.score >= 60 ? '#f59e0b' : '#ef4444';

  return `
    <div class="validation-view">
      <!-- Score Overview -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 24px; margin-bottom: 10px;">Project Health Score</h2>
            <div style="color: #94a3b8;">Based on 80-20 validation rules</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${data.score}%</div>
            <div style="color: #94a3b8;">${data.passed.length} passed / ${data.critical.length + data.warnings.length} issues</div>
          </div>
        </div>
      </div>

      <!-- Structure Check -->
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #3b82f6; margin-bottom: 15px;">📁 Project Structure</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
          ${renderStructureCheck('Types', data.summary.hasTypes)}
          ${renderStructureCheck('DB Layer', data.summary.hasDB)}
          ${renderStructureCheck('Hooks', data.summary.hasHooks)}
          ${renderStructureCheck('Components', data.summary.hasComponents)}
          ${renderStructureCheck('Registries', data.summary.hasRegistries)}
        </div>
      </div>

      <!-- Critical Issues -->
      ${data.critical.length > 0 ? `
        <div class="section" style="background: #7f1d1d; border: 2px solid #ef4444; margin-bottom: 20px;">
          <h3 style="color: #fca5a5; margin-bottom: 15px;">
            🚨 Critical Issues (${data.critical.length})
          </h3>
          <div style="max-height: 400px; overflow-y: auto;">
            ${data.critical.map(issue => `
              <div style="background: #991b1b; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div style="color: #fca5a5; font-weight: bold; margin-bottom: 5px;">
                      ${getIssueIcon(issue.type)} ${formatIssueType(issue.type)}
                    </div>
                    <div style="color: #e2e8f0; margin-bottom: 5px;">${issue.message}</div>
                    <div style="color: #94a3b8; font-size: 12px;">📁 ${issue.file}</div>
                  </div>
                </div>
                <div style="margin-top: 10px; padding: 10px; background: #0f172a; border-radius: 4px;">
                  <div style="color: #10b981; font-size: 12px; margin-bottom: 5px;">💡 Fix:</div>
                  <div style="color: #e2e8f0; font-size: 14px; font-family: monospace;">${issue.suggestion}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Warnings -->
      ${data.warnings.length > 0 ? `
        <div class="section" style="background: #78350f; border: 1px solid #f59e0b; margin-bottom: 20px;">
          <h3 style="color: #fcd34d; margin-bottom: 15px;">
            ⚠️ Warnings (${data.warnings.length})
          </h3>
          <div style="max-height: 300px; overflow-y: auto;">
            ${data.warnings.map(warning => `
              <div style="background: #451a03; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
                <div style="color: #fcd34d; font-weight: bold; margin-bottom: 5px;">
                  ${getIssueIcon(warning.type)} ${formatIssueType(warning.type)}
                </div>
                <div style="color: #e2e8f0; font-size: 14px;">${warning.message}</div>
                <div style="color: #94a3b8; font-size: 12px; margin-top: 5px;">
                  📁 ${warning.file} | 💡 ${warning.suggestion}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Complete Chains -->
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #3b82f6; margin-bottom: 15px;">🔗 Data Flow Chains</h3>
        <div style="display: grid; gap: 15px;">
          ${(data.summary.chainsComplete || []).map(chain => `
            <div style="background: ${chain.complete ? '#14532d' : '#7f1d1d'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${chain.complete ? '#10b981' : '#ef4444'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: bold; color: #e2e8f0; text-transform: capitalize;">
                  ${chain.entity}
                </div>
                <div style="font-size: 20px;">
                  ${chain.complete ? '✅' : '❌'}
                </div>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${renderChainStep('Type', chain.steps.type)}
                ${renderChainStep('DB', chain.steps.db)}
                ${renderChainStep('Hook', chain.steps.hook)}
                ${renderChainStep('Component', chain.steps.component)}
                ${renderChainStep('Page', chain.steps.page)}
                ${chain.steps.api !== undefined ? renderChainStep('API', chain.steps.api) : ''}
              </div>
              ${chain.issues.length > 0 ? `
                <div style="margin-top: 10px; padding: 8px; background: #0f172a; border-radius: 4px;">
                  ${chain.issues.map(issue => `
                    <div style="color: #fca5a5; font-size: 12px;">• ${issue}</div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Passed Checks -->
      ${data.passed.length > 0 ? `
        <div class="section">
          <h3 style="color: #10b981; margin-bottom: 15px;">
            ✅ Passed Checks (${data.passed.length})
          </h3>
          <div style="max-height: 200px; overflow-y: auto;">
            ${data.passed.map(check => `
              <div style="padding: 8px; background: #14532d; border-radius: 4px; margin-bottom: 5px;">
                <span style="color: #86efac;">${check.message}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Quick Fix Guide -->
      <div class="section" style="background: #1e3a8a; border: 1px solid #3b82f6;">
        <h3 style="color: #93c5fd; margin-bottom: 15px;">🔧 Quick Fix Priority</h3>
        <ol style="color: #e2e8f0; line-height: 1.8;">
          <li>Fix all <strong style="color: #fca5a5;">Critical Issues</strong> first (runtime errors)</li>
          <li>Add <strong style="color: #fcd34d;">Zod validation</strong> at all boundaries (DB/API)</li>
          <li>Ensure <strong style="color: #86efac;">Component → Hook → DB</strong> pattern</li>
          <li>Add <strong style="color: #93c5fd;">error handling</strong> in all hooks</li>
          <li>Implement <strong style="color: #c084fc;">cache invalidation</strong> in mutations</li>
        </ol>
      </div>
    </div>
  `;
}

function renderStructureCheck(name: string, exists: boolean): string {
  return `
    <div style="background: ${exists ? '#14532d' : '#7f1d1d'}; padding: 10px; border-radius: 6px; text-align: center;">
      <div style="font-size: 20px; margin-bottom: 5px;">${exists ? '✅' : '❌'}</div>
      <div style="color: ${exists ? '#86efac' : '#fca5a5'}; font-size: 12px;">${name}</div>
    </div>
  `;
}

function renderChainStep(name: string, complete: boolean): string {
  return `
    <div style="display: flex; align-items: center; gap: 5px; padding: 4px 8px; background: ${complete ? '#065f46' : '#7f1d1d'}; border-radius: 4px;">
      <span style="color: ${complete ? '#86efac' : '#fca5a5'}; font-size: 12px;">${name}</span>
      <span>${complete ? '✓' : '✗'}</span>
    </div>
  `;
}

function getIssueIcon(type: string): string {
  const icons: Record<string, string> = {
    'type-db-mismatch': '🔄',
    'direct-db-call': '⚡',
    'missing-error-handling': '🚫',
    'missing-loading-state': '⏳',
    'untyped-api': '📡',
    'missing-registry': '📋',
    'no-cache-invalidation': '🔄',
    'missing-validation': '✔️',
    'no-auth-guard': '🔐',
    'broken-chain': '🔗'
  };
  return icons[type] || '⚠️';
}

function formatIssueType(type: string): string {
  return type.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}