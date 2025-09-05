/**
 * Page Details Viewer  
 * Displays detailed information about pages/routes
 */

class PageDetailsViewer {
  constructor(containerId) {
    this.element = document.getElementById(containerId);
    if (!this.element) throw new Error(`Container ${containerId} not found`);
    
    this.validationService = window.validationService;
  }

  render(pagePath, pageData, validationData) {
    if (!pagePath || !pageData) {
      this.renderNotFound(pagePath);
      return;
    }

    const violations = this.getViolations(pagePath, validationData);
    const healthScore = this.calculateHealthScore(pageData, violations);
    
    this.element.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(pagePath, pageData)}
        ${this.renderHealthScore(healthScore, pageData, violations)}
        ${this.renderPageInfo(pageData)}
        ${this.renderRouting(pageData)}
        ${this.renderComponents(pageData)}
        ${this.renderViolations(violations)}
        ${this.renderRecommendations(pageData, violations)}
      </div>
    `;
  }

  renderHeader(path, data) {
    const displayName = this.formatPageName(path);
    
    return `
      <div style="
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        color: white;
      ">
        <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          📄 ${displayName}
          <span style="
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: normal;
          ">Page</span>
        </h1>
        <p style="margin: 0; opacity: 0.9; font-size: 14px; font-family: monospace;">
          ${path}
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
          <h3 style="color: #f8fafc; margin: 0 0 12px 0;">Page Health</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
            <div>
              <span style="color: #64748b;">SEO Optimized:</span>
              <span style="color: ${data.hasSEO ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.hasSEO ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span style="color: #64748b;">Error Handling:</span>
              <span style="color: ${data.hasErrorHandling ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.hasErrorHandling ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span style="color: #64748b;">Loading States:</span>
              <span style="color: ${data.hasLoadingState ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.hasLoadingState ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span style="color: #64748b;">Performance:</span>
              <span style="color: ${data.isOptimized ? '#10b981' : '#ef4444'}; margin-left: 8px;">
                ${data.isOptimized ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPageInfo(data) {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Page Information</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Page Type</div>
            <div style="color: #f8fafc; font-size: 14px;">
              ${data.pageType || 'Standard'}
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Layout</div>
            <div style="color: #f8fafc; font-size: 14px;">
              ${data.layout || 'Default'}
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Auth Required</div>
            <div style="color: #f8fafc; font-size: 14px;">
              ${data.requiresAuth ? 'Yes' : 'No'}
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

  renderRouting(data) {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Routing</h3>
        
        <div style="display: grid; gap: 16px;">
          ${data.route ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">Route Pattern</div>
              <div style="color: #f8fafc; font-family: monospace; font-size: 14px;">
                ${data.route}
              </div>
            </div>
          ` : ''}
          
          ${data.params?.length > 0 ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">Route Parameters</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.params.map(param => `
                  <span style="
                    background: #252525;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #3b82f6;
                    font-family: monospace;
                  ">
                    ${param}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${data.middlewares?.length > 0 ? `
            <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">Middlewares</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.middlewares.map(middleware => `
                  <span style="
                    background: #252525;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #10b981;
                  ">
                    ${middleware}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderComponents(data) {
    if (!data.components || data.components.length === 0) {
      return `
        <div style="
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        ">
          <h3 style="color: #f8fafc; margin: 0 0 12px 0;">Components</h3>
          <div style="color: #64748b; font-style: italic;">
            No components detected
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
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Components (${data.components.length})</h3>
        
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${data.components.map(comp => `
            <span style="
              background: #0f0f0f;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 13px;
              color: #10b981;
              cursor: pointer;
              border: 1px solid #252525;
              transition: all 0.2s;
            " 
            onclick="selectItem('${comp}', 'component')"
            onmouseover="this.style.background='#252525'"
            onmouseout="this.style.background='#0f0f0f'"
            >
              🧩 ${comp}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }


  renderViolations(violations) {
    if (this.validationService) {
      return this.validationService.renderViolations(violations, 'Page Issues');
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
    
    if (!data.hasSEO) {
      recommendations.push('Add proper meta tags and SEO optimization');
    }
    
    if (!data.hasErrorHandling) {
      recommendations.push('Implement error boundaries and error handling');
    }
    
    if (!data.hasLoadingState) {
      recommendations.push('Add loading states for better user experience');
    }
    
    if (!data.hasAccessibility) {
      recommendations.push('Improve accessibility with ARIA labels and semantic HTML');
    }
    
    if (!data.isOptimized) {
      recommendations.push('Optimize page performance (lazy loading, code splitting)');
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

  renderNotFound(path) {
    this.element.innerHTML = `
      <div style="
        padding: 60px 20px;
        text-align: center;
        color: #64748b;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
        <h2 style="color: #f8fafc; margin-bottom: 8px;">Page Not Found</h2>
        <p>Page "${path}" could not be found or loaded.</p>
      </div>
    `;
  }

  // Utility methods
  formatPageName(path) {
    if (path.includes('(main)')) {
      const parts = path.split('/');
      const mainIdx = parts.findIndex(p => p === '(main)');
      if (mainIdx >= 0 && mainIdx < parts.length - 1) {
        return `(main) > ${parts[mainIdx + 1]}`;
      }
    }
    const parts = path.split('/');
    const pageName = parts[parts.length - 2];
    return pageName === 'app' ? 'Home' : pageName || 'Page';
  }

  getViolations(pagePath, validationData) {
    if (this.validationService) {
      return this.validationService.getViolationsForEntity(pagePath, validationData, 'page');
    }
    return [];
  }

  calculateHealthScore(data, violations) {
    let score = 100;
    
    if (!data.hasSEO) score -= 20;
    if (!data.hasLoadingState) score -= 15;
    if (!data.hasErrorHandling) score -= 25;
    if (!data.hasAccessibility) score -= 20;
    if (!data.isOptimized) score -= 20;
    
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
    return '#Critical';
  }
}

// Export for global use
window.PageDetailsViewer = PageDetailsViewer;