/**
 * Hook Details Viewer Component (JavaScript version)
 * Shows comprehensive hook information with configuration and violations
 */

class HookDetailsViewer {
  constructor(containerId) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  render(hookName, hookData, validationData) {
    const data = this.extractHookData(hookName, hookData);
    const violations = this.getViolations(hookName, validationData);
    const healthScore = this.calculateHealthScore(data, violations);
    
    this.container.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(data)}
        ${this.renderHealthScore(healthScore, data, violations)}
        ${this.renderConfiguration(data)}
        ${this.renderIssues(data, violations)}
        ${this.renderUsage(data)}
        ${this.renderErrorChain(data)}
        ${this.renderRecommendations(data, violations)}
      </div>
    `;
  }
  
  extractHookData(name, hookData) {
    if (typeof hookData === 'string') {
      return {
        hookName: name,
        operations: ['fetch'],
        hasErrorHandling: false,
        hasLoadingState: false,
        hasCacheInvalidation: false
      };
    }
    
    return {
      hookName: hookData?.hookName || name,
      operations: hookData?.operations || ['fetch'],
      hasErrorHandling: hookData?.hasErrorHandling || false,
      hasLoadingState: hookData?.hasLoadingState || false,
      hasCacheInvalidation: hookData?.hasCacheInvalidation || false,
      usedInComponents: hookData?.usedInComponents || [],
      file: hookData?.file,
      location: hookData?.location
    };
  }
  
  getViolations(hookName, validationData) {
    const violations = [];
    
    // Contract violations
    if (validationData?.contracts?.violations) {
      validationData.contracts.violations.forEach(v => {
        // Check multiple matching strategies for hooks
        const hookNameLower = hookName.toLowerCase();
        const isMatch = 
          v.location?.toLowerCase().includes(hookNameLower) ||
          v.entity?.toLowerCase() === hookNameLower ||
          v.entity?.toLowerCase() === hookNameLower.replace('use', '') ||
          (hookNameLower.startsWith('use') && v.entity?.toLowerCase() === hookNameLower.substring(3).toLowerCase());
        
        if (isMatch) {
          const line = this.extractLineNumber(v.location);
          violations.push({
            type: 'contract',
            severity: v.type === 'error' ? 'critical' : 'warning',
            message: v.message,
            expected: v.expected,
            actual: v.actual,
            suggestion: v.suggestion,
            file: v.location,
            line
          });
        }
      });
    }
    
    // Boundary violations
    if (validationData?.boundaries) {
      validationData.boundaries
        .filter(b => !b.hasValidation && b.location?.toLowerCase().includes(hookName.toLowerCase()))
        .forEach(b => {
          violations.push({
            type: 'boundary',
            severity: b.boundary.includes('webhook') || b.boundary.includes('dbWrite') ? 'critical' : 'warning',
            message: `Missing ${b.boundary.replace(/([A-Z])/g, ' $1').toLowerCase()} validation`,
            suggestion: 'Add .parse() or .safeParse() validation',
            file: b.location,
            line: this.extractLineNumber(b.location)
          });
        });
    }
    
    // Nine rules violations
    if (validationData?.nineRules?.results) {
      validationData.nineRules.results.forEach(rule => {
        if (rule.issues) {
          rule.issues
            .filter(issue => issue.file?.toLowerCase().includes(hookName.toLowerCase()))
            .forEach(issue => {
              violations.push({
                type: 'quality',
                severity: issue.severity === 'critical' ? 'critical' : 'warning',
                message: issue.message,
                suggestion: issue.suggestion || `Rule ${rule.ruleNumber}: ${rule.rule}`,
                file: issue.file,
                line: this.extractLineNumber(issue.file)
              });
            });
        }
      });
    }
    
    return violations;
  }
  
  extractLineNumber(location) {
    const match = location.match(/:(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }
  
  calculateHealthScore(data, violations) {
    let score = 100;
    
    // Configuration penalties
    if (!data.hasErrorHandling) score -= 20;
    if (!data.hasLoadingState) score -= 15;
    if (!data.hasCacheInvalidation) score -= 10;
    
    // Violation penalties
    violations.forEach(v => {
      if (v.severity === 'critical') score -= 15;
      else if (v.severity === 'warning') score -= 8;
    });
    
    // No usage penalty
    if (!data.usedInComponents || data.usedInComponents.length === 0) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  renderHeader(data) {
    return `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #f8fafc; margin: 0; font-size: 28px; display: flex; align-items: center; gap: 12px;">
          🔗 ${data.hookName}
          <span style="
            padding: 4px 12px;
            background: #3b82f620;
            color: #3b82f6;
            border-radius: 6px;
            font-size: 12px;
            font-weight: normal;
            text-transform: uppercase;
          ">HOOK</span>
        </h2>
        ${data.file ? `
          <div style="color: #64748b; font-size: 13px; margin-top: 8px; font-family: monospace;">
            ${data.file}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderHealthScore(score, data, violations) {
    const color = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const status = score >= 80 ? 'Healthy' : score >= 40 ? 'Needs Attention' : 'Critical';
    
    const issueCount = violations.length + 
      (!data.hasErrorHandling ? 1 : 0) + 
      (!data.hasLoadingState ? 1 : 0) + 
      (!data.hasCacheInvalidation ? 1 : 0);
    
    return `
      <div style="
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 24px;
      ">
        <div style="position: relative; width: 100px; height: 100px;">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#252525" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" 
                    stroke="${color}" 
                    stroke-width="8" 
                    stroke-dasharray="${283 * (score / 100)} 283" 
                    stroke-linecap="round" 
                    transform="rotate(-90 50 50)"/>
          </svg>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
          ">
            <div style="font-size: 24px; font-weight: bold; color: ${color};">
              ${score}%
            </div>
            <div style="font-size: 10px; color: #64748b;">HEALTH</div>
          </div>
        </div>
        
        <div style="flex: 1;">
          <div style="font-size: 18px; color: #f8fafc; margin-bottom: 8px;">
            ${status}
          </div>
          <div style="color: #94a3b8; font-size: 14px;">
            ${issueCount} issue${issueCount !== 1 ? 's' : ''} found • 
            ${data.operations?.join(', ') || 'fetch'} operations
          </div>
        </div>
      </div>
    `;
  }
  
  renderConfiguration(data) {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase;">
          Configuration
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 12px;">Operations:</span>
              <div style="color: #f8fafc; margin-top: 4px; font-family: monospace;">
                ${data.operations?.join(', ') || 'fetch'}
              </div>
            </div>
            
            <div>
              <span style="color: #64748b; font-size: 12px;">Cache Strategy:</span>
              <div style="margin-top: 4px;">
                ${data.hasCacheInvalidation ? 
                  '<span style="color: #10b981;">✓ Invalidates</span>' : 
                  '<span style="color: #f59e0b;">⚠ No strategy</span>'}
              </div>
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 12px;">Error Handling:</span>
              <div style="margin-top: 4px;">
                ${data.hasErrorHandling ? 
                  '<span style="color: #10b981;">✓ Yes</span>' : 
                  '<span style="color: #ef4444;">✗ No</span>'}
              </div>
            </div>
            
            <div>
              <span style="color: #64748b; font-size: 12px;">Loading State:</span>
              <div style="margin-top: 4px;">
                ${data.hasLoadingState ? 
                  '<span style="color: #10b981;">✓ Yes</span>' : 
                  '<span style="color: #ef4444;">✗ No</span>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderIssues(data, violations) {
    const issues = [];
    
    // Add configuration issues
    if (!data.hasErrorHandling) {
      issues.push({
        severity: 'critical',
        source: 'configuration',
        message: 'No error handling - component will crash on failure'
      });
    }
    
    if (!data.hasLoadingState) {
      issues.push({
        severity: 'warning',
        source: 'configuration',
        message: 'No loading state - UI may freeze during fetch'
      });
    }
    
    if (!data.hasCacheInvalidation) {
      issues.push({
        severity: 'info',
        source: 'configuration',
        message: 'Consider implementing cache invalidation'
      });
    }
    
    // Add validation violations
    issues.push(...violations);
    
    if (issues.length === 0) {
      return `
        <div style="
          background: #10b98120;
          border: 1px solid #10b98140;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
          color: #10b981;
        ">
          ✅ All checks passed - hook is properly configured
        </div>
      `;
    }
    
    return `
      <div style="
        background: #ef444410;
        border: 1px solid #ef444430;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f87171; margin: 0 0 16px 0;">
          ⚠️ Issues Found (${issues.length})
        </h3>
        <div style="display: grid; gap: 12px;">
          ${issues.map(issue => `
            <div style="
              background: #0f0f0f;
              border-radius: 8px;
              padding: 12px;
              border-left: 3px solid ${
                issue.severity === 'critical' ? '#ef4444' : 
                issue.severity === 'warning' ? '#f59e0b' : '#3b82f6'
              };
            ">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="
                    padding: 2px 6px;
                    background: ${
                      issue.severity === 'critical' ? '#ef444420' : 
                      issue.severity === 'warning' ? '#f59e0b20' : '#3b82f620'
                    };
                    color: ${
                      issue.severity === 'critical' ? '#ef4444' : 
                      issue.severity === 'warning' ? '#f59e0b' : '#3b82f6'
                    };
                    border-radius: 4px;
                    font-size: 10px;
                    text-transform: uppercase;
                    display: inline-block;
                    margin-bottom: 8px;
                  ">
                    ${issue.severity}
                  </div>
                  <div style="color: #f8fafc; font-size: 14px;">
                    ${issue.message}
                  </div>
                  ${issue.suggestion ? `
                    <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                      → ${issue.suggestion}
                    </div>
                  ` : ''}
                  ${issue.expected ? `
                    <div style="margin-top: 8px; font-family: monospace; font-size: 12px;">
                      <span style="color: #10b981;">Expected:</span> ${issue.expected}<br>
                      <span style="color: #ef4444;">Actual:</span> ${issue.actual || 'undefined'}
                    </div>
                  ` : ''}
                </div>
                ${issue.line ? `
                  <span style="
                    padding: 4px 8px;
                    background: #667eea20;
                    color: #667eea;
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: monospace;
                    white-space: nowrap;
                  ">Line ${issue.line}</span>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderUsage(data) {
    if (!data.usedInComponents || data.usedInComponents.length === 0) {
      return `
        <div style="
          background: #f59e0b10;
          border: 1px solid #f59e0b30;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
          color: #f59e0b;
        ">
          ⚠️ Not used in any components
        </div>
      `;
    }
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">
          📍 Usage (${data.usedInComponents.length})
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${data.usedInComponents.map(comp => `
            <span style="
              padding: 6px 12px;
              background: #f59e0b20;
              color: #f59e0b;
              border-radius: 6px;
              font-size: 13px;
            ">${comp}</span>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderErrorChain(data) {
    if (data.hasErrorHandling) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #ef444430;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #ef4444; margin: 0 0 12px 0;">
          🔥 Error Handling Chain
        </h3>
        <div style="color: #fca5a5; font-size: 13px; line-height: 1.6;">
          Hook fails → No error boundary → Component crashes → Page breaks → User sees white screen
        </div>
      </div>
    `;
  }
  
  renderRecommendations(data, violations) {
    const recommendations = [];
    
    if (!data.hasErrorHandling) {
      recommendations.push('Add try-catch blocks and error state management');
    }
    if (!data.hasLoadingState) {
      recommendations.push('Implement loading state to improve UX');
    }
    if (!data.hasCacheInvalidation) {
      recommendations.push('Add cache invalidation strategy for data consistency');
    }
    if (violations.length > 0) {
      recommendations.push('Fix contract violations to ensure type safety');
    }
    
    if (recommendations.length === 0) return '';
    
    return `
      <div style="
        background: #3b82f620;
        border: 1px solid #3b82f640;
        border-radius: 12px;
        padding: 20px;
      ">
        <h3 style="color: #93c5fd; margin: 0 0 12px 0;">
          💡 Recommendations
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #dbeafe;">
          ${recommendations.map(r => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
        </ul>
      </div>
    `;
  }
}

// Export for use in browser
window.HookDetailsViewer = HookDetailsViewer;