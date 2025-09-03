/**
 * Table Details Viewer Component (JavaScript version)
 * Displays complete table information with health score, properties, relationships
 */

class TableDetailsViewer {
  constructor(containerId) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  render(tableName, data, validationData) {
    const healthScore = data.score || this.calculateHealthScore(data);
    const properties = this.extractProperties(data);
    const relationships = data.relationships || [];
    const issues = this.collectAllIssues(tableName, validationData);
    
    this.container.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(tableName, data)}
        ${this.renderHealthScore(healthScore, data)}
        ${issues.length > 0 ? this.renderIssues(issues) : ''}
        ${this.renderStatsGrid(data)}
        ${this.renderDataFlowPipeline(data)}
        ${this.renderProperties(properties)}
        ${this.renderRelationships(tableName, relationships)}
        ${this.renderHooks(data.hooks)}
        ${this.renderComponents(data.components)}
        ${this.renderApiEndpoints(data.apiEndpoints)}
      </div>
    `;
  }
  
  renderHeader(tableName, data) {
    return `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #f8fafc; margin: 0; font-size: 28px; display: flex; align-items: center; gap: 12px;">
          📊 ${tableName}
          <span style="
            padding: 4px 12px;
            background: #667eea20;
            color: #667eea;
            border-radius: 6px;
            font-size: 12px;
            font-weight: normal;
            text-transform: uppercase;
          ">table</span>
        </h2>
        ${data.typeDefinition?.file ? `
          <div style="color: #64748b; font-size: 13px; margin-top: 8px;">
            📁 ${data.typeDefinition.file}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderHealthScore(score, data) {
    const scoreColor = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    
    const checks = {
      type: !!data.typeDefinition,
      validation: !!data.typeDefinition?.hasZodSchema,
      hooks: (data.hooks?.length || 0) > 0,
      ui: (data.components?.length || 0) > 0,
      api: (data.apiEndpoints?.length || 0) > 0
    };
    
    return `
      <div style="
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 20px;
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border-radius: 12px;
        margin-bottom: 24px;
        border: 1px solid #252525;
      ">
        <div style="position: relative;">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#252525" stroke-width="10"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="10" stroke-dasharray="${this.calculateDashArray(score, 54)}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition: stroke-dasharray 0.5s ease;"/>
            <circle cx="60" cy="60" r="44" fill="${scoreColor}10"/>
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${scoreColor};">${score}%</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Health</div>
          </div>
        </div>
        
        <div style="flex: 1;">
          <div style="font-size: 18px; color: #f8fafc; margin-bottom: 12px; font-weight: 600;">Health Score Analysis</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${this.renderCheckItem('Type Definition', checks.type)}
            ${this.renderCheckItem('Zod Validation', checks.validation)}
            ${this.renderCheckItem('React Hooks', checks.hooks)}
            ${this.renderCheckItem('UI Components', checks.ui)}
            ${this.renderCheckItem('API Endpoints', checks.api)}
          </div>
          <div style="margin-top: 12px; font-size: 12px; color: #64748b;">${this.getHealthMessage(score)}</div>
        </div>
      </div>
    `;
  }
  
  renderStatsGrid(data) {
    const stats = [
      { label: 'Hooks', value: data.hooks?.length || 0, color: '#3b82f6', icon: '🔗' },
      { label: 'Components', value: data.components?.length || 0, color: '#8b5cf6', icon: '🧩' },
      { label: 'API Routes', value: data.apiEndpoints?.length || 0, color: '#f59e0b', icon: '🌐' },
      { label: 'Mutations', value: data.mutations?.length || 0, color: '#10b981', icon: '✏️' }
    ];
    
    return `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
        ${stats.map(stat => `
          <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #252525; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='${stat.color}40';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#252525';">
            <div style="font-size: 28px; margin-bottom: 8px;">${stat.icon}</div>
            <div style="font-size: 32px; font-weight: bold; color: ${stat.color}; margin-bottom: 4px;">${stat.value}</div>
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">${stat.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  renderDataFlowPipeline(data) {
    const steps = [
      { name: 'Type', active: !!data.typeDefinition, color: '#10b981', icon: '📝' },
      { name: 'Database', active: (data.databaseQueries?.length || 0) > 0, color: '#3b82f6', icon: '🗄️' },
      { name: 'Hooks', active: (data.hooks?.length || 0) > 0, color: '#8b5cf6', icon: '🔗' },
      { name: 'Components', active: (data.components?.length || 0) > 0, color: '#f59e0b', icon: '🧩' },
      { name: 'API', active: (data.apiEndpoints?.length || 0) > 0, color: '#ef4444', icon: '🌐' }
    ];
    
    return `
      <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px;">🔄 Data Flow Pipeline</h3>
        <div style="display: flex; align-items: center; gap: 12px; overflow-x: auto;">
          ${steps.map((step, idx) => `
            ${idx > 0 ? '<span style="color: #64748b; font-size: 20px;">→</span>' : ''}
            <div style="padding: 12px 20px; background: ${step.active ? step.color + '20' : '#25252580'}; color: ${step.active ? step.color : '#64748b'}; border-radius: 8px; border: 2px solid ${step.active ? step.color + '40' : '#333'}; white-space: nowrap; display: flex; align-items: center; gap: 8px; font-weight: ${step.active ? '600' : '400'}; transition: all 0.3s;">
              <span style="font-size: 18px;">${step.icon}</span>
              ${step.name}
              ${step.active ? '✓' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderProperties(properties) {
    if (!properties || properties.length === 0) {
      return `
        <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
          <h3 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 16px;">📝 Properties (0)</h3>
          <div style="color: #64748b; text-align: center; padding: 20px;">No properties defined</div>
        </div>
      `;
    }
    
    return `
      <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px;">📝 Properties (${properties.length})</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
          ${properties.slice(0, 20).map(prop => `
            <div style="background: #0f0f0f; padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #252525;">
              <span style="color: #e2e8f0; font-size: 14px;">
                ${prop.name}
                ${prop.required ? '<span style="color: #ef4444;">*</span>' : ''}
              </span>
              <span style="background: #252525; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'Monaco', monospace; color: #94a3b8;">${prop.type}</span>
            </div>
          `).join('')}
        </div>
        ${properties.length > 20 ? `
          <div style="text-align: center; margin-top: 12px; color: #64748b; font-size: 12px;">
            And ${properties.length - 20} more properties...
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderRelationships(tableName, relationships) {
    if (!relationships || relationships.length === 0) {
      return '';
    }
    
    return `
      <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px;">🔗 Relationships (${relationships.length})</h3>
        ${relationships.map(rel => `
          <div style="padding: 12px; background: #0f0f0f; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; border: 1px solid #252525;">
            <span style="color: #e2e8f0;">${tableName}</span>
            <span style="color: #667eea;">→</span>
            <span style="padding: 2px 8px; background: #667eea20; color: #667eea; border-radius: 4px; font-size: 12px;">${rel.type}</span>
            <span style="color: #e2e8f0; font-weight: 600;">${rel.target || rel.entity}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  renderHooks(hooks) {
    if (!hooks || hooks.length === 0) return '';
    
    return `
      <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px;">🔗 Hooks (${hooks.length})</h3>
        <div style="display: grid; gap: 8px;">
          ${hooks.map(hook => `
            <div style="padding: 12px; background: #0f0f0f; border-radius: 8px; border: 1px solid #252525; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #e2e8f0; font-family: 'Monaco', monospace; font-size: 13px;">
                ${typeof hook === 'string' ? hook : hook.hookName || 'Unknown'}
              </span>
              ${typeof hook === 'object' && hook.operations ? `
                <span style="color: #64748b; font-size: 11px;">${hook.operations.join(', ')}</span>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderComponents(components) {
    if (!components || components.length === 0) return '';
    
    return `
      <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px;">🧩 Components (${components.length})</h3>
        <div style="display: grid; gap: 8px;">
          ${components.map(comp => {
            const name = typeof comp === 'string' ? comp : 
                        comp.name || comp.componentName || 'Unknown';
            return `
              <div style="padding: 12px; background: #0f0f0f; border-radius: 8px; border: 1px solid #252525; color: #e2e8f0;">
                ${name}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  renderApiEndpoints(endpoints) {
    if (!endpoints || endpoints.length === 0) return '';
    
    return `
      <div style="background: #1a1a1a; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #252525;">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; font-size: 16px;">🌐 API Endpoints (${endpoints.length})</h3>
        <div style="display: grid; gap: 8px;">
          ${endpoints.map(endpoint => {
            const path = typeof endpoint === 'string' ? endpoint : 
                        endpoint.endpoint || endpoint.path || 'Unknown';
            return `
              <div style="padding: 12px; background: #0f0f0f; border-radius: 8px; border: 1px solid #252525; color: #e2e8f0; font-family: 'Monaco', monospace; font-size: 13px;">
                ${path}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  // Helper methods
  extractProperties(data) {
    return data.properties || data.typeDefinition?.properties || [];
  }
  
  calculateHealthScore(data) {
    let score = 100;
    if (!data.typeDefinition) score -= 20;
    if (!data.typeDefinition?.hasZodSchema) score -= 20;
    if (!data.hooks || data.hooks.length === 0) score -= 20;
    if (!data.components || data.components.length === 0) score -= 20;
    if (!data.apiEndpoints || data.apiEndpoints.length === 0) score -= 20;
    return Math.max(0, score);
  }
  
  calculateDashArray(score, radius) {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (score / 100);
    return `${offset} ${circumference}`;
  }
  
  renderCheckItem(label, passed) {
    return `
      <span style="font-size: 13px; padding: 6px 12px; border-radius: 6px; background: ${passed ? '#10b98120' : '#ef444420'}; color: ${passed ? '#10b981' : '#ef4444'}; border: 1px solid ${passed ? '#10b98140' : '#ef444440'}; display: inline-flex; align-items: center; gap: 4px;">
        ${passed ? '✓' : '✗'} ${label}
      </span>
    `;
  }
  
  getHealthMessage(score) {
    if (score >= 80) return "✨ Excellent! This table is well-integrated.";
    if (score >= 60) return "👍 Good, but could use more integration.";
    if (score >= 40) return "⚠️ Needs attention - missing key integrations.";
    return "🔴 Critical - requires immediate attention.";
  }
  
  collectAllIssues(tableName, validationData) {
    const issues = [];
    
    // Collect contract violations
    // Match both exact and case-insensitive, also check if location includes table name
    if (validationData?.contractViolations) {
      validationData.contractViolations
        .filter(v => {
          // Check if entity matches (case-insensitive)
          if (v.entity?.toLowerCase() === tableName.toLowerCase()) return true;
          // Also check if the location contains the table name
          if (v.location?.toLowerCase().includes(tableName.toLowerCase())) return true;
          // Check for common variations (e.g., "professionals" for "professional")
          if (v.entity?.toLowerCase() === tableName.toLowerCase() + 's') return true;
          if (v.entity?.toLowerCase() + 's' === tableName.toLowerCase()) return true;
          return false;
        })
        .forEach(v => {
          issues.push({
            type: 'naming',
            severity: v.type === 'error' ? 'error' : 'warning',
            message: `${v.actual} → ${v.expected}`,
            detail: v.message,
            location: v.location,
            fix: v.suggestion
          });
        });
    }
    
    // Collect boundary issues
    if (validationData?.boundaries) {
      validationData.boundaries
        .filter(b => !b.hasValidation && b.location?.toLowerCase().includes(tableName.toLowerCase()))
        .forEach(b => {
          issues.push({
            type: 'validation',
            severity: b.boundary.includes('webhook') || b.boundary.includes('dbWrite') ? 'error' : 'warning',
            message: `Missing ${b.boundary.replace(/([A-Z])/g, ' $1').toLowerCase()} validation`,
            detail: b.issue,
            location: b.location,
            fix: 'Add .parse() or .safeParse() validation'
          });
        });
    }
    
    // Collect nine rules violations
    if (validationData?.nineRules?.results) {
      validationData.nineRules.results
        .filter(r => r.issues?.some(i => i.file?.toLowerCase().includes(tableName.toLowerCase())))
        .forEach(rule => {
          rule.issues
            .filter(i => i.file?.toLowerCase().includes(tableName.toLowerCase()))
            .forEach(issue => {
              issues.push({
                type: 'quality',
                severity: issue.severity === 'critical' ? 'error' : 'warning',
                message: issue.message,
                detail: `Rule ${rule.ruleNumber}: ${rule.rule}`,
                location: issue.file,
                fix: issue.suggestion || ''
              });
            });
        });
    }
    
    return issues;
  }
  
  renderIssues(issues) {
    // Group issues by type
    const grouped = {};
    issues.forEach(issue => {
      if (!grouped[issue.type]) grouped[issue.type] = [];
      grouped[issue.type].push(issue);
    });
    
    const typeLabels = {
      naming: '📝 Field Naming',
      validation: '🔒 Data Validation', 
      quality: '✨ Code Quality'
    };
    
    const severityColors = {
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
          ⚡ Issues Found
          <span style="
            background: #ef444420;
            color: #ef4444;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
          ">${issues.length}</span>
        </h3>
        
        ${Object.entries(grouped).map(([type, typeIssues]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #94a3b8; font-size: 13px; margin-bottom: 8px; font-weight: 600;">
              ${typeLabels[type] || type}
            </div>
            <div style="display: grid; gap: 8px;">
              ${typeIssues.map(issue => `
                <div style="
                  background: #0f0f0f;
                  padding: 12px;
                  border-radius: 8px;
                  border-left: 3px solid ${severityColors[issue.severity]};
                ">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <div style="color: #f8fafc; font-size: 14px; margin-bottom: 4px;">
                        ${issue.message}
                      </div>
                      ${issue.location ? `
                        <div style="color: #64748b; font-size: 11px; font-family: monospace;">
                          ${issue.location.split('/').pop()}
                        </div>
                      ` : ''}
                    </div>
                    ${issue.fix ? `
                      <div style="
                        color: #3b82f6;
                        font-size: 11px;
                        padding: 4px 8px;
                        background: #3b82f610;
                        border-radius: 4px;
                        white-space: nowrap;
                      ">
                        💡 ${issue.fix.length > 30 ? issue.fix.substring(0, 30) + '...' : issue.fix}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Export for use in browser
window.TableDetailsViewer = TableDetailsViewer;