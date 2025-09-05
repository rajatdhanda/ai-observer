/**
 * Nine Rules View Renderer
 * Handles rendering of the 9 Core Validation Rules tab
 */

(function() {
  'use strict';

  window.loadNineRulesView = async function() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
          <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
          <div>Running 9 Core Validation Rules...</div>
        </div>
      </div>
    `;
    
    try {
      const response = await fetch('/api/map-validation');
      if (!response.ok) throw new Error('Failed to fetch validation data');
      
      const data = await response.json();
      
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            color: white;
          ">
            <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
              🎯 9 Core Validation Rules
            </h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">
              Map-based validation covering 90% of production bugs
            </p>
          </div>
          
          ${renderRulesScore(data)}
          ${renderRulesSummary(data)}
          ${renderContractDetections(data)}
          ${renderCriticalViolations(data)}
          ${renderAllViolations(data)}
        </div>
      `;
    } catch (error) {
      console.error('Error loading 9 rules data:', error);
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; color: #ef4444; margin: 40px 0;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2>Error Loading Validation</h2>
            <p style="color: #64748b;">Failed to load validation data: ${error.message}</p>
          </div>
        </div>
      `;
    }
  };
  
  function renderRulesScore(data) {
    const score = data.score || 0;
    const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const scoreText = score >= 80 ? 'Excellent' : score >= 50 ? 'Needs Work' : 'Critical';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <div style="display: flex; align-items: center; gap: 24px;">
          <div style="
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: ${scoreColor}20;
            border: 3px solid ${scoreColor};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          ">
            <div style="font-size: 32px; font-weight: bold; color: ${scoreColor};">${score}</div>
            <div style="font-size: 11px; color: #64748b;">SCORE</div>
          </div>
          
          <div style="flex: 1;">
            <div style="font-size: 20px; color: ${scoreColor}; margin-bottom: 8px;">${scoreText}</div>
            <div style="color: #94a3b8;">
              ${data.violations?.length || 0} violations found across ${Object.keys(data.summary?.byRule || {}).length} rules
            </div>
            ${data.summary?.bySeverity ? `
              <div style="display: flex; gap: 16px; margin-top: 12px;">
                <span style="color: #ef4444;">⚫ Critical: ${data.summary.bySeverity.critical || 0}</span>
                <span style="color: #f59e0b;">⚫ Warning: ${data.summary.bySeverity.warning || 0}</span>
                <span style="color: #3b82f6;">⚫ Info: ${data.summary.bySeverity.info || 0}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  function renderContractDetections(data) {
    if (!data.contractDetections) return '';
    
    const { summary, detections } = data.contractDetections;
    if (!summary) return '';
    
    const hasDetections = summary.missing > 0 || summary.outdated > 0 || summary.unused > 0 || summary.mismatches > 0;
    if (!hasDetections) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0;">🔍 Contract Detection Analysis</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
          ${summary.missing > 0 ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; border-left: 3px solid #ef4444;">
              <div style="color: #ef4444; font-size: 24px; font-weight: bold;">${summary.missing}</div>
              <div style="color: #94a3b8; font-size: 14px;">Missing Contracts</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Entities without contracts</div>
            </div>
          ` : ''}
          
          ${summary.outdated > 0 ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; border-left: 3px solid #f59e0b;">
              <div style="color: #f59e0b; font-size: 24px; font-weight: bold;">${summary.outdated}</div>
              <div style="color: #94a3b8; font-size: 14px;">Outdated Contracts</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">New fields detected</div>
            </div>
          ` : ''}
          
          ${summary.unused > 0 ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; border-left: 3px solid #3b82f6;">
              <div style="color: #3b82f6; font-size: 24px; font-weight: bold;">${summary.unused}</div>
              <div style="color: #94a3b8; font-size: 14px;">Unused Contracts</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Not used in code</div>
            </div>
          ` : ''}
          
          ${summary.mismatches > 0 ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; border-left: 3px solid #ef4444;">
              <div style="color: #ef4444; font-size: 24px; font-weight: bold;">${summary.mismatches}</div>
              <div style="color: #94a3b8; font-size: 14px;">Naming Mismatches</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">snake_case vs camelCase</div>
            </div>
          ` : ''}
        </div>
        
        ${detections && detections.filter(d => d.type === 'missing').length > 0 ? `
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <h4 style="color: #ef4444; margin: 0 0 12px 0;">Missing Contracts Detected:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${detections.filter(d => d.type === 'missing').slice(0, 10).map(d => `
                <span style="
                  background: #ef444420;
                  color: #f87171;
                  padding: 4px 12px;
                  border-radius: 16px;
                  font-size: 13px;
                  border: 1px solid #ef444440;
                ">
                  ${d.entity}
                </span>
              `).join('')}
            </div>
            <div style="color: #64748b; font-size: 12px; margin-top: 12px;">
              💡 Add these entities to contracts.yaml to define their data structure
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function renderRulesSummary(data) {
    const rules = [
      { name: 'Type-Database Alignment', impact: '30%', description: 'All DB functions must parse with Zod' },
      { name: 'Hook-Database Pattern', impact: '25%', description: 'Components → Hooks → DB only' },
      { name: 'Error Handling', impact: '20%', description: 'Try-catch blocks and error states' },
      { name: 'Loading States', impact: '15%', description: 'Loading indicators in hooks' },
      { name: 'API Type Safety', impact: '10%', description: 'Parse all API inputs/outputs' },
      { name: 'Contract Compliance', impact: '10%', description: 'Entities have defined contracts' },
      { name: 'Registry Usage', impact: '<5%', description: 'No raw route strings' },
      { name: 'Cache Invalidation', impact: '<5%', description: 'Mutations invalidate cache' },
      { name: 'Form Validation', impact: '<5%', description: 'Forms have validation' },
      { name: 'Auth Guards', impact: '<5%', description: 'Protected routes have auth' }
    ];
    
    const violations = data.summary?.byRule || {};
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0;">📋 Rules Coverage</h3>
        
        <div style="display: grid; gap: 12px;">
          ${rules.map((rule, index) => {
            const count = violations[rule.name] || 0;
            const status = count === 0 ? 'pass' : 'fail';
            const color = status === 'pass' ? '#10b981' : '#ef4444';
            
            return `
              <div style="
                background: #0f0f0f;
                padding: 16px;
                border-radius: 8px;
                border-left: 3px solid ${color};
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <div>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: ${color}; font-size: 18px;">
                      ${status === 'pass' ? '✅' : '❌'}
                    </span>
                    <div>
                      <div style="color: #f8fafc; font-weight: 500;">
                        Rule ${index + 1}: ${rule.name}
                      </div>
                      <div style="color: #64748b; font-size: 12px;">
                        ${rule.description} (${rule.impact} of bugs)
                      </div>
                    </div>
                  </div>
                </div>
                <div style="
                  background: ${color}20;
                  color: ${color};
                  padding: 4px 12px;
                  border-radius: 16px;
                  font-size: 14px;
                  font-weight: 500;
                ">
                  ${count} ${count === 1 ? 'violation' : 'violations'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  function renderCriticalViolations(data) {
    const critical = (data.violations || []).filter(v => v.severity === 'critical');
    
    if (critical.length === 0) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #ef4444;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #ef4444; margin: 0 0 20px 0;">
          ⚠️ Critical Violations (${critical.length})
        </h3>
        
        <div style="display: grid; gap: 12px;">
          ${critical.slice(0, 5).map(violation => `
            <div style="
              background: #0f0f0f;
              padding: 16px;
              border-radius: 8px;
              border-left: 3px solid #ef4444;
            ">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <div style="color: #f8fafc; font-weight: 500; margin-bottom: 8px;">
                    ${violation.rule}
                  </div>
                  <div style="color: #94a3b8; font-size: 14px; margin-bottom: 8px;">
                    ${violation.message}
                  </div>
                  <div style="color: #64748b; font-size: 12px;">
                    📁 ${violation.file}
                  </div>
                </div>
              </div>
              ${violation.fix ? `
                <div style="
                  background: #ef444410;
                  color: #f87171;
                  padding: 12px;
                  border-radius: 6px;
                  margin-top: 12px;
                  font-size: 13px;
                ">
                  💡 Fix: ${violation.fix}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        ${critical.length > 5 ? `
          <div style="
            text-align: center;
            margin-top: 16px;
            color: #64748b;
            font-size: 14px;
          ">
            And ${critical.length - 5} more critical violations...
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function renderAllViolations(data) {
    const violations = data.violations || [];
    
    if (violations.length === 0) {
      return `
        <div style="
          background: #10b98120;
          border: 1px solid #10b981;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h3 style="color: #10b981; margin: 0;">No Violations Found!</h3>
          <p style="color: #64748b; margin: 8px 0 0 0;">
            Your code follows all 9 core validation rules perfectly.
          </p>
        </div>
      `;
    }
    
    // Group violations by rule
    const byRule = {};
    violations.forEach(v => {
      if (!byRule[v.rule]) byRule[v.rule] = [];
      byRule[v.rule].push(v);
    });
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0;">
          📝 All Violations (${violations.length})
        </h3>
        
        ${Object.entries(byRule).map(([rule, ruleViolations]) => `
          <details style="margin-bottom: 16px;">
            <summary style="
              cursor: pointer;
              padding: 12px;
              background: #0f0f0f;
              border-radius: 8px;
              color: #f8fafc;
              font-weight: 500;
            ">
              ${rule} (${ruleViolations.length})
            </summary>
            <div style="padding: 12px;">
              ${ruleViolations.map(v => `
                <div style="
                  background: #0a0a0a;
                  padding: 12px;
                  margin: 8px 0;
                  border-radius: 6px;
                  border-left: 3px solid ${v.severity === 'critical' ? '#ef4444' : '#f59e0b'};
                ">
                  <div style="color: #94a3b8; font-size: 14px;">
                    ${v.message}
                  </div>
                  <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
                    ${v.file}
                  </div>
                  ${v.fix ? `
                    <div style="color: #3b82f6; font-size: 12px; margin-top: 8px;">
                      → ${v.fix}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </details>
        `).join('')}
      </div>
    `;
  }

  // Expose functions that might be needed elsewhere
  window.renderRulesScore = renderRulesScore;
  window.renderRulesSummary = renderRulesSummary;
  window.renderContractDetections = renderContractDetections;
  window.renderCriticalViolations = renderCriticalViolations;
  window.renderAllViolations = renderAllViolations;

})();