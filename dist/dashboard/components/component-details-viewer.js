/**
 * Component Details Viewer
 * Displays detailed information about React/Vue components
 */

class ComponentDetailsViewer {
  constructor(containerId) {
    this.element = document.getElementById(containerId);
    if (!this.element) throw new Error(`Container ${containerId} not found`);
    
    this.validationService = window.validationService;
  }

  render(componentName, componentData, validationData) {
    if (!componentName || !componentData) {
      this.renderNotFound(componentName);
      return;
    }

    const violations = this.getViolations(componentName, validationData);
    const healthScore = this.calculateHealthScore(componentData, violations);
    
    this.element.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(componentName, componentData)}
        ${this.renderHealthScore(healthScore, componentData, violations)}
        ${this.renderComponentInfo(componentData)}
        ${this.renderProps(componentData)}
        ${this.renderUsage(componentData)}
        ${this.renderViolations(violations)}
        ${this.renderRecommendations(componentData, violations)}
      </div>
    `;
  }

  renderHeader(name, data) {
    return `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        color: white;
      ">
        <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          🧩 ${name}
          <span style="
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: normal;
          ">Component</span>
        </h1>
        <p style="margin: 0; opacity: 0.9; font-size: 14px;">
          React/Vue component analysis and validation results
        </p>
      </div>
    `;
  }

  renderHealthScore(score, data, violations) {
    const color = this.getHealthColor(score);
    
    return `
      <div style="
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 20px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <div style="text-align: center;">
          <div style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: ${color}20;
            border: 3px solid ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: ${color};
            margin: 0 auto 8px auto;
          ">
            ${score}
          </div>
          <div style="color: ${color}; font-size: 12px; font-weight: 500;">
            ${this.getHealthStatus(score)}
          </div>
        </div>
        
        <div>
          <h3 style="color: #f8fafc; margin: 0 0 12px 0;">Component Health</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
            <div>
              <span style="color: #64748b;">Props Defined:</span>
              <span style="color: ${data.props?.length > 0 ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.props?.length > 0 ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span style="color: #64748b;">Has Tests:</span>
              <span style="color: ${data.hasTests ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.hasTests ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span style="color: #64748b;">Error Boundary:</span>
              <span style="color: ${data.hasErrorBoundary ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.hasErrorBoundary ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span style="color: #64748b;">Accessibility:</span>
              <span style="color: ${data.hasAccessibility ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.hasAccessibility ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderComponentInfo(data) {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Component Information</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">File Path</div>
            <div style="color: #f8fafc; font-family: monospace; font-size: 13px;">
              ${data.filePath || 'Not specified'}
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Framework</div>
            <div style="color: #f8fafc; font-size: 14px;">
              ${data.framework || 'React'}
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Type</div>
            <div style="color: #f8fafc; font-size: 14px;">
              ${data.type || 'Functional'}
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Bundle Size</div>
            <div style="color: #f8fafc; font-size: 14px;">
              ${data.bundleSize || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderProps(data) {
    if (!data.props || data.props.length === 0) {
      return `
        <div style="
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        ">
          <h3 style="color: #f8fafc; margin: 0 0 12px 0;">Props</h3>
          <div style="color: #64748b; font-style: italic;">
            No props defined or detected
          </div>
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
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Props (${data.props.length})</h3>
        
        <div style="display: grid; gap: 12px;">
          ${data.props.map(prop => `
            <div style="
              background: #0f0f0f;
              padding: 16px;
              border-radius: 8px;
              border-left: 3px solid #667eea;
            ">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <span style="color: #f8fafc; font-weight: 500; font-family: monospace;">
                  ${prop.name || prop}
                </span>
                <span style="
                  background: #252525;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  color: #94a3b8;
                  font-family: monospace;
                ">
                  ${prop.type || 'any'}
                </span>
              </div>
              ${prop.description ? `
                <div style="color: #94a3b8; font-size: 13px; line-height: 1.4;">
                  ${prop.description}
                </div>
              ` : ''}
              ${prop.required ? `
                <div style="color: #f59e0b; font-size: 11px; margin-top: 4px;">
                  Required
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderUsage(data) {
    if (!data.usedInPages && !data.usedInComponents) {
      return '';
    }

    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Usage</h3>
        
        ${data.usedInPages?.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h4 style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Used in Pages</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${data.usedInPages.map(page => `
                <span style="
                  background: #0f0f0f;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 12px;
                  color: #3b82f6;
                  cursor: pointer;
                " onclick="selectItem('${page}', 'page')">
                  📄 ${page}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${data.usedInComponents?.length > 0 ? `
          <div>
            <h4 style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Used in Components</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${data.usedInComponents.map(comp => `
                <span style="
                  background: #0f0f0f;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 12px;
                  color: #10b981;
                  cursor: pointer;
                " onclick="selectItem('${comp}', 'component')">
                  🧩 ${comp}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderViolations(violations) {
    if (this.validationService) {
      return this.validationService.renderViolations(violations, 'Component Issues');
    }
    
    return violations.length > 0 ? `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f87171; margin: 0 0 16px 0;">
          ⚠️ Issues Found (${violations.length})
        </h3>
        ${violations.map(v => `
          <div style="margin-bottom: 8px; padding: 8px; background: #ef444410; border-radius: 4px;">
            ${v.message}
          </div>
        `).join('')}
      </div>
    ` : '';
  }

  renderRecommendations(data, violations) {
    const recommendations = [];
    
    if (!data.props || data.props.length === 0) {
      recommendations.push('Define prop types for better type safety');
    }
    
    if (!data.hasTests) {
      recommendations.push('Add unit tests for this component');
    }
    
    if (!data.hasErrorBoundary) {
      recommendations.push('Consider adding error boundary handling');
    }
    
    if (!data.hasAccessibility) {
      recommendations.push('Improve accessibility with ARIA labels and keyboard navigation');
    }
    
    if (violations.length > 0) {
      recommendations.push('Address validation violations for better code quality');
    }

    if (recommendations.length === 0) return '';

    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
      ">
        <h3 style="color: #3b82f6; margin: 0 0 16px 0;">💡 Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px; color: #94a3b8;">
          ${recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  renderNotFound(name) {
    this.element.innerHTML = `
      <div style="
        padding: 60px 20px;
        text-align: center;
        color: #64748b;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🧩</div>
        <h2 style="color: #f8fafc; margin-bottom: 8px;">Component Not Found</h2>
        <p>Component "${name}" could not be found or loaded.</p>
      </div>
    `;
  }

  // Utility methods
  getViolations(componentName, validationData) {
    if (this.validationService) {
      return this.validationService.getViolationsForEntity(componentName, validationData, 'component');
    }
    return [];
  }

  calculateHealthScore(data, violations) {
    let score = 100;
    
    if (!data.props || data.props.length === 0) score -= 20;
    if (!data.hasErrorBoundary) score -= 15;
    if (!data.hasAccessibility) score -= 15;
    if (!data.hasTests) score -= 25;
    if (!data.hasDocumentation) score -= 10;
    if (!data.isMemoized && data.isComplex) score -= 15;
    
    violations.forEach(v => {
      switch (v.severity) {
        case 'critical': score -= 15; break;
        case 'warning': score -= 8; break;
        case 'info': score -= 3; break;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  getHealthColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  getHealthStatus(score) {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Needs Work';
    return 'Critical';
  }
}

// Export for global use
window.ComponentDetailsViewer = ComponentDetailsViewer;