/**
 * Dashboard Component Loader
 * Dynamically loads and renders dashboard components
 * Max 200 lines
 */

class DashboardLoader {
  constructor() {
    this.components = {};
    this.entityData = null;
  }

  async loadEntityData() {
    // This would normally import from entity-data-provider.ts
    // For now, return the enrichment function
    return {
      enrichTableData(tableName, tableData) {
        // Add any missing properties from known schema
        const enriched = { ...tableData };
        
        // Ensure arrays exist
        enriched.properties = enriched.properties || [];
        enriched.relationships = enriched.relationships || [];
        enriched.hooks = enriched.hooks || [];
        enriched.components = enriched.components || [];
        
        return enriched;
      },
      
      parseLocation(location) {
        if (!location) return { file: '', line: null };
        const parts = location.split(':');
        const line = parts[parts.length - 1];
        return { 
          file: parts.slice(0, -1).join(':'),
          line: isNaN(line) ? null : parseInt(line, 10)
        };
      }
    };
  }

  renderHookDetails(hook, validationData) {
    const name = typeof hook === 'string' ? hook : hook.hookName || hook;
    const violations = this.getViolationsForItem(name, 'hook', validationData);
    
    // Extract hook configuration
    const hasErrorHandling = hook.hasErrorHandling || false;
    const hasLoadingState = hook.hasLoadingState || false;
    const hasCacheInvalidation = hook.hasCacheInvalidation || false;
    const operations = hook.operations || ['fetch'];
    
    return `
      <div class="hook-detail">
        <h2>🔗 ${name} <span class="badge">HOOK</span></h2>
        
        <div class="card">
          <h3>Configuration</h3>
          <div class="config-grid">
            <div>
              <span class="label">Operations:</span>
              <span>${operations.join(', ')}</span>
            </div>
            <div>
              <span class="label">Error Handling:</span>
              ${hasErrorHandling ? 
                '<span class="success">✓ Yes</span>' : 
                '<span class="error">✗ No</span>'}
            </div>
            <div>
              <span class="label">Loading State:</span>
              ${hasLoadingState ? 
                '<span class="success">✓ Yes</span>' : 
                '<span class="error">✗ No</span>'}
            </div>
            <div>
              <span class="label">Cache:</span>
              ${hasCacheInvalidation ? 
                '<span class="success">✓ Invalidates</span>' : 
                '<span class="warning">⚠ No strategy</span>'}
            </div>
          </div>
        </div>
        
        ${this.renderViolations(violations, hasErrorHandling, hasLoadingState, hasCacheInvalidation)}
      </div>
    `;
  }

  renderViolations(violations, hasErrorHandling, hasLoadingState, hasCacheInvalidation) {
    const issues = [...violations];
    
    // Add configuration issues
    if (!hasErrorHandling) {
      issues.push({
        severity: 'critical',
        message: 'No error handling - component will crash on failure',
        source: 'configuration'
      });
    }
    
    if (!hasLoadingState) {
      issues.push({
        severity: 'warning',
        message: 'No loading state - UI may freeze during fetch',
        source: 'configuration'
      });
    }
    
    if (!hasCacheInvalidation) {
      issues.push({
        severity: 'info',
        message: 'Consider implementing cache invalidation',
        source: 'configuration'
      });
    }
    
    if (issues.length === 0) {
      return '<div class="success-message">✅ All checks passed</div>';
    }
    
    return `
      <div class="violations-card">
        <h3>⚠️ Issues Found (${issues.length})</h3>
        ${issues.map(issue => `
          <div class="violation-item ${issue.severity}">
            <div class="violation-content">
              <div class="violation-message">${issue.message}</div>
              ${issue.suggestion ? 
                `<div class="violation-suggestion">→ ${issue.suggestion}</div>` : ''}
              ${issue.expected ? `
                <div class="violation-comparison">
                  <span class="expected">Expected: ${issue.expected}</span>
                  <span class="actual">Actual: ${issue.actual || 'undefined'}</span>
                </div>
              ` : ''}
            </div>
            ${issue.line ? 
              `<div class="line-number">Line ${issue.line}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderComponentDetails(name, validationData) {
    const violations = this.getViolationsForItem(name, 'component', validationData);
    const healthScore = this.calculateHealthScore(violations);
    
    return `
      <div class="component-detail">
        <h2>🧩 ${name} <span class="badge">COMPONENT</span></h2>
        
        <div class="health-indicator" style="--health-score: ${healthScore}">
          <div class="health-circle">${healthScore}%</div>
          <div class="health-label">HEALTH</div>
        </div>
        
        ${this.renderViolations(violations)}
      </div>
    `;
  }

  getViolationsForItem(name, type, validationData) {
    const violations = [];
    
    if (validationData?.contracts?.violations) {
      validationData.contracts.violations.forEach(v => {
        if (v.location && v.location.toLowerCase().includes(name.toLowerCase())) {
          const location = this.entityData?.parseLocation(v.location);
          violations.push({
            severity: v.type === 'error' ? 'critical' : 'warning',
            message: v.message,
            expected: v.expected,
            actual: v.actual,
            suggestion: v.suggestion,
            line: location?.line
          });
        }
      });
    }
    
    return violations;
  }

  calculateHealthScore(violations) {
    let score = 100;
    violations.forEach(v => {
      if (v.severity === 'critical') score -= 20;
      else if (v.severity === 'warning') score -= 10;
      else score -= 5;
    });
    return Math.max(0, Math.min(100, score));
  }
}

// Export for use in dashboard
window.DashboardLoader = DashboardLoader;