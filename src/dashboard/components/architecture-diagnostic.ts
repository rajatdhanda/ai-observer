/**
 * Architecture Diagnostic Component
 * Full diagnostic view for hooks, components, APIs like enhanced dashboard
 * Max 500 lines
 */

export interface DiagnosticData {
  name: string;
  type: 'hook' | 'component' | 'api' | 'page';
  file?: string;
  line?: number;
  issues?: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    rule?: string;
    suggestion?: string;
  }>;
  hookData?: {
    operations?: string[];
    hasErrorHandling?: boolean;
    hasLoadingState?: boolean;
    hasCacheInvalidation?: boolean;
    usedInComponents?: string[];
  };
  componentData?: {
    dependencies?: string[];
    props?: Array<{ name: string; type: string; required?: boolean }>;
    hooks?: string[];
    renders?: string[];
  };
  apiData?: {
    method?: string;
    endpoint?: string;
    authentication?: boolean;
    validation?: boolean;
    responseType?: string;
  };
}

export class ArchitectureDiagnostic {
  private container: HTMLElement;
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  async analyze(name: string, type: string, data: any): Promise<void> {
    // Simulate fetching diagnostic data (in real app, this would call API)
    const diagnosticData = this.generateDiagnosticData(name, type, data);
    
    // Get validation issues
    const issues = await this.getValidationIssues(name, type);
    diagnosticData.issues = issues;
    
    this.render(diagnosticData);
  }
  
  private render(data: DiagnosticData): void {
    const healthScore = this.calculateHealthScore(data);
    
    this.container.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(data)}
        ${this.renderHealthScore(data, healthScore)}
        ${this.renderDiagnosticDetails(data)}
        ${this.renderIssues(data.issues)}
        ${this.renderRecommendations(data)}
      </div>
    `;
  }
  
  private renderHeader(data: DiagnosticData): string {
    const icons = {
      hook: '🔗',
      component: '🧩',
      api: '🌐',
      page: '📄'
    };
    
    return `
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 30px;">
        <div style="font-size: 48px;">${icons[data.type]}</div>
        <div style="flex: 1;">
          <h2 style="margin: 0; color: #f8fafc; font-size: 28px;">${data.name}</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; text-transform: capitalize;">
            ${data.type}
            ${data.file ? `• ${data.file}${data.line ? `:${data.line}` : ''}` : ''}
          </p>
        </div>
        ${this.renderStatusBadge(data)}
      </div>
    `;
  }
  
  private renderStatusBadge(data: DiagnosticData): string {
    const criticalCount = data.issues?.filter(i => i.severity === 'critical').length || 0;
    const warningCount = data.issues?.filter(i => i.severity === 'warning').length || 0;
    
    if (criticalCount > 0) {
      return `
        <div style="
          padding: 8px 16px;
          background: #ef444420;
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #ef4444;
        ">
          <div style="font-size: 20px; font-weight: bold;">${criticalCount}</div>
          <div style="font-size: 11px;">Critical</div>
        </div>
      `;
    } else if (warningCount > 0) {
      return `
        <div style="
          padding: 8px 16px;
          background: #f59e0b20;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          color: #f59e0b;
        ">
          <div style="font-size: 20px; font-weight: bold;">${warningCount}</div>
          <div style="font-size: 11px;">Warnings</div>
        </div>
      `;
    }
    
    return `
      <div style="
        padding: 8px 16px;
        background: #10b98120;
        border: 1px solid #10b981;
        border-radius: 8px;
        color: #10b981;
      ">
        ✓ Healthy
      </div>
    `;
  }
  
  private renderHealthScore(data: DiagnosticData, score: number): string {
    const color = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const totalIssues = data.issues?.length || 0;
    
    return `
      <div style="
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border-radius: 12px;
        border: 1px solid #252525;
      ">
        <div style="text-align: center;">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#252525" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" 
                    stroke="${color}" 
                    stroke-width="8" 
                    stroke-dasharray="${283 * (score / 100)} 283" 
                    stroke-linecap="round" 
                    transform="rotate(-90 50 50)"/>
          </svg>
          <div style="margin-top: -70px; font-size: 24px; font-weight: bold; color: ${color};">
            ${score}%
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
            HEALTH SCORE
          </div>
        </div>
        
        <div style="flex: 1;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            ${this.renderHealthChecks(data)}
          </div>
          ${totalIssues > 0 ? `
            <div style="margin-top: 16px; padding: 12px; background: #0f0f0f; border-radius: 8px;">
              <div style="font-size: 13px; color: #f8fafc; margin-bottom: 8px;">
                Found ${totalIssues} issue${totalIssues > 1 ? 's' : ''}
              </div>
              ${this.renderIssueSummary(data.issues || [])}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  private renderHealthChecks(data: DiagnosticData): string {
    const checks: Array<{ label: string; passed: boolean }> = [];
    
    if (data.type === 'hook' && data.hookData) {
      checks.push(
        { label: 'Error Handling', passed: data.hookData.hasErrorHandling || false },
        { label: 'Loading State', passed: data.hookData.hasLoadingState || false },
        { label: 'Cache Strategy', passed: data.hookData.hasCacheInvalidation || false }
      );
    } else if (data.type === 'component' && data.componentData) {
      checks.push(
        { label: 'Props Typed', passed: (data.componentData.props?.length || 0) > 0 },
        { label: 'Hooks Used', passed: (data.componentData.hooks?.length || 0) > 0 },
        { label: 'Dependencies', passed: (data.componentData.dependencies?.length || 0) > 0 }
      );
    } else if (data.type === 'api' && data.apiData) {
      checks.push(
        { label: 'Authentication', passed: data.apiData.authentication || false },
        { label: 'Validation', passed: data.apiData.validation || false },
        { label: 'Response Type', passed: !!data.apiData.responseType }
      );
    } else {
      checks.push(
        { label: 'File Found', passed: !!data.file },
        { label: 'No Errors', passed: !data.issues?.some(i => i.severity === 'critical') },
        { label: 'Documented', passed: true }
      );
    }
    
    return checks.map(check => `
      <div style="
        padding: 8px;
        background: ${check.passed ? '#10b98110' : '#ef444410'};
        border: 1px solid ${check.passed ? '#10b98140' : '#ef444440'};
        border-radius: 6px;
        text-align: center;
      ">
        <div style="color: ${check.passed ? '#10b981' : '#ef4444'}; font-size: 18px;">
          ${check.passed ? '✓' : '✗'}
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
          ${check.label}
        </div>
      </div>
    `).join('');
  }
  
  private renderDiagnosticDetails(data: DiagnosticData): string {
    if (data.type === 'hook' && data.hookData) {
      return this.renderHookDetails(data.hookData);
    } else if (data.type === 'component' && data.componentData) {
      return this.renderComponentDetails(data.componentData);
    } else if (data.type === 'api' && data.apiData) {
      return this.renderAPIDetails(data.apiData);
    }
    
    return `
      <div style="
        background: #1a1a1a;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid #252525;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">📊 Details</h3>
        <div style="color: #94a3b8;">
          <div>Type: ${data.type}</div>
          <div>Status: Active</div>
          ${data.file ? `<div>Location: ${data.file}</div>` : ''}
        </div>
      </div>
    `;
  }
  
  private renderHookDetails(hookData: any): string {
    return `
      <div style="
        background: #1a1a1a;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid #252525;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔗 Hook Analysis</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4 style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">
              Configuration
            </h4>
            <div style="background: #0f0f0f; padding: 12px; border-radius: 8px;">
              <div style="margin-bottom: 8px;">
                <span style="color: #64748b;">Operations:</span>
                <span style="color: #f8fafc; margin-left: 8px;">
                  ${hookData.operations?.join(', ') || 'fetch'}
                </span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="color: #64748b;">Error Handling:</span>
                <span style="margin-left: 8px;">
                  ${hookData.hasErrorHandling ? 
                    '<span style="color: #10b981;">✓ Yes</span>' : 
                    '<span style="color: #ef4444;">✗ No</span>'}
                </span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="color: #64748b;">Loading State:</span>
                <span style="margin-left: 8px;">
                  ${hookData.hasLoadingState ? 
                    '<span style="color: #10b981;">✓ Yes</span>' : 
                    '<span style="color: #ef4444;">✗ No</span>'}
                </span>
              </div>
              <div>
                <span style="color: #64748b;">Cache:</span>
                <span style="margin-left: 8px;">
                  ${hookData.hasCacheInvalidation ? 
                    '<span style="color: #10b981;">✓ Invalidates</span>' : 
                    '<span style="color: #f59e0b;">⚠ No strategy</span>'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">
              Usage
            </h4>
            <div style="background: #0f0f0f; padding: 12px; border-radius: 8px;">
              ${hookData.usedInComponents?.length > 0 ? `
                <div style="color: #64748b; margin-bottom: 8px;">Used in components:</div>
                ${hookData.usedInComponents.map((comp: string) => `
                  <div style="
                    padding: 4px 8px;
                    background: #252525;
                    border-radius: 4px;
                    margin-bottom: 4px;
                    color: #e2e8f0;
                    font-size: 12px;
                  ">
                    🧩 ${comp}
                  </div>
                `).join('')}
              ` : '<div style="color: #64748b;">Not used in any components</div>'}
            </div>
          </div>
        </div>
        
        ${!hookData.hasErrorHandling || !hookData.hasLoadingState ? `
          <div style="
            margin-top: 16px;
            padding: 12px;
            background: #7f1d1d20;
            border: 1px solid #ef444440;
            border-radius: 8px;
          ">
            <div style="color: #fca5a5; font-size: 13px; margin-bottom: 8px;">
              ⚠️ Error Propagation Risk
            </div>
            ${!hookData.hasErrorHandling ? `
              <div style="color: #f87171; font-size: 12px; margin-bottom: 4px;">
                • No error handling - component will crash on fetch failure
              </div>
            ` : ''}
            ${!hookData.hasLoadingState ? `
              <div style="color: #f87171; font-size: 12px;">
                • No loading state - UI may freeze during data fetch
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private renderComponentDetails(componentData: any): string {
    return `
      <div style="
        background: #1a1a1a;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid #252525;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🧩 Component Analysis</h3>
        
        <div style="display: grid; gap: 16px;">
          ${componentData.props?.length > 0 ? `
            <div>
              <h4 style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">PROPS</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px;">
                ${componentData.props.map((prop: any) => `
                  <div style="
                    background: #0f0f0f;
                    padding: 8px;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <span style="color: #e2e8f0; font-size: 12px;">
                      ${prop.name}${prop.required ? '*' : ''}
                    </span>
                    <span style="
                      background: #252525;
                      padding: 2px 6px;
                      border-radius: 4px;
                      font-size: 10px;
                      color: #64748b;
                    ">${prop.type}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${componentData.hooks?.length > 0 ? `
            <div>
              <h4 style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">HOOKS USED</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${componentData.hooks.map((hook: string) => `
                  <span style="
                    padding: 4px 8px;
                    background: #8b5cf620;
                    color: #8b5cf6;
                    border-radius: 4px;
                    font-size: 12px;
                  ">
                    🔗 ${hook}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${componentData.dependencies?.length > 0 ? `
            <div>
              <h4 style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">DEPENDENCIES</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${componentData.dependencies.map((dep: string) => `
                  <span style="
                    padding: 4px 8px;
                    background: #3b82f620;
                    color: #3b82f6;
                    border-radius: 4px;
                    font-size: 12px;
                  ">
                    📦 ${dep}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  private renderAPIDetails(apiData: any): string {
    return `
      <div style="
        background: #1a1a1a;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid #252525;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🌐 API Analysis</h3>
        
        <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
          <div style="
            font-family: 'Monaco', monospace;
            font-size: 14px;
            color: #3b82f6;
            margin-bottom: 12px;
          ">
            ${apiData.method || 'GET'} ${apiData.endpoint || '/api/unknown'}
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <span style="color: #64748b; font-size: 11px;">Authentication</span>
              <div style="color: ${apiData.authentication ? '#10b981' : '#ef4444'};">
                ${apiData.authentication ? '✓ Required' : '✗ None'}
              </div>
            </div>
            <div>
              <span style="color: #64748b; font-size: 11px;">Validation</span>
              <div style="color: ${apiData.validation ? '#10b981' : '#f59e0b'};">
                ${apiData.validation ? '✓ Enabled' : '⚠ Disabled'}
              </div>
            </div>
            <div>
              <span style="color: #64748b; font-size: 11px;">Response</span>
              <div style="color: #e2e8f0;">
                ${apiData.responseType || 'JSON'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderIssues(issues?: any[]): string {
    if (!issues || issues.length === 0) {
      return `
        <div style="
          background: #10b98120;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #10b98140;
          margin-bottom: 20px;
        ">
          <div style="color: #10b981; font-size: 14px;">
            ✅ No validation issues found
          </div>
        </div>
      `;
    }
    
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔍 Issues Found</h3>
        ${issues.map(issue => this.renderIssue(issue)).join('')}
      </div>
    `;
  }
  
  private renderIssue(issue: any): string {
    const colors = {
      critical: { bg: '#7f1d1d', border: '#ef4444', text: '#fca5a5' },
      warning: { bg: '#7c2d12', border: '#f59e0b', text: '#fcd34d' },
      info: { bg: '#1e3a8a', border: '#3b82f6', text: '#93c5fd' }
    };
    
    const color = colors[issue.severity] || colors.info;
    
    return `
      <div style="
        background: ${color.bg}20;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid ${color.border};
        margin-bottom: 12px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="color: ${color.text}; font-weight: 600;">
            ${issue.rule || 'Validation Issue'}
          </div>
          <span style="
            background: ${color.border};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            text-transform: uppercase;
          ">
            ${issue.severity}
          </span>
        </div>
        <div style="color: #e2e8f0; font-size: 14px; margin-bottom: 8px;">
          ${issue.message}
        </div>
        ${issue.suggestion ? `
          <div style="color: #10b981; font-size: 13px;">
            💡 ${issue.suggestion}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private renderIssueSummary(issues: any[]): string {
    const critical = issues.filter(i => i.severity === 'critical').length;
    const warning = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;
    
    return `
      <div style="display: flex; gap: 16px;">
        ${critical > 0 ? `<span style="color: #ef4444;">${critical} critical</span>` : ''}
        ${warning > 0 ? `<span style="color: #f59e0b;">${warning} warnings</span>` : ''}
        ${info > 0 ? `<span style="color: #3b82f6;">${info} info</span>` : ''}
      </div>
    `;
  }
  
  private renderRecommendations(data: DiagnosticData): string {
    const recommendations = this.getRecommendations(data);
    
    if (recommendations.length === 0) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #252525;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">💡 Recommendations</h3>
        ${recommendations.map(rec => `
          <div style="
            padding: 12px;
            background: #0f0f0f;
            border-radius: 6px;
            margin-bottom: 8px;
            color: #94a3b8;
            font-size: 13px;
          ">
            ${rec}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Helper methods
  private generateDiagnosticData(name: string, type: string, data: any): DiagnosticData {
    const diagnostic: DiagnosticData = { name, type: type as any };
    
    if (type === 'hook') {
      diagnostic.hookData = {
        operations: data.operations || ['fetch'],
        hasErrorHandling: data.hasErrorHandling !== false,
        hasLoadingState: data.hasLoadingState !== false,
        hasCacheInvalidation: data.hasCacheInvalidation || false,
        usedInComponents: data.usedInComponents || []
      };
    } else if (type === 'component') {
      diagnostic.componentData = {
        props: [],
        hooks: data.hooks || [],
        dependencies: data.dependencies || []
      };
    } else if (type === 'api') {
      diagnostic.apiData = {
        method: data.method || 'GET',
        endpoint: data.endpoint || name,
        authentication: data.authentication || false,
        validation: data.validation || false,
        responseType: 'JSON'
      };
    }
    
    diagnostic.file = data.file;
    diagnostic.line = data.line;
    
    return diagnostic;
  }
  
  private async getValidationIssues(name: string, type: string): Promise<any[]> {
    // In real app, this would fetch from API
    // For now, return sample issues based on type
    if (type === 'hook' && !name.includes('use')) {
      return [{
        severity: 'warning',
        rule: 'Hook Naming',
        message: 'Hook name should start with "use"',
        suggestion: `Rename to "use${name.charAt(0).toUpperCase() + name.slice(1)}"`
      }];
    }
    
    return [];
  }
  
  private calculateHealthScore(data: DiagnosticData): number {
    let score = 100;
    
    // Deduct for critical issues
    const critical = data.issues?.filter(i => i.severity === 'critical').length || 0;
    score -= critical * 20;
    
    // Deduct for warnings
    const warnings = data.issues?.filter(i => i.severity === 'warning').length || 0;
    score -= warnings * 10;
    
    // Type-specific deductions
    if (data.type === 'hook' && data.hookData) {
      if (!data.hookData.hasErrorHandling) score -= 15;
      if (!data.hookData.hasLoadingState) score -= 10;
      if (!data.hookData.hasCacheInvalidation) score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private getRecommendations(data: DiagnosticData): string[] {
    const recommendations: string[] = [];
    
    if (data.type === 'hook' && data.hookData) {
      if (!data.hookData.hasErrorHandling) {
        recommendations.push('Add error handling with try-catch or error state');
      }
      if (!data.hookData.hasLoadingState) {
        recommendations.push('Implement loading state for better UX');
      }
      if (!data.hookData.hasCacheInvalidation) {
        recommendations.push('Consider implementing cache invalidation strategy');
      }
      if (data.hookData.usedInComponents?.length === 0) {
        recommendations.push('This hook is not used in any components - consider removing if unused');
      }
    } else if (data.type === 'component' && data.componentData) {
      if (!data.componentData.props || data.componentData.props.length === 0) {
        recommendations.push('Add TypeScript prop types for better type safety');
      }
      if (!data.componentData.hooks || data.componentData.hooks.length === 0) {
        recommendations.push('Consider using hooks for state management');
      }
    } else if (data.type === 'api' && data.apiData) {
      if (!data.apiData.authentication) {
        recommendations.push('Add authentication to protect this endpoint');
      }
      if (!data.apiData.validation) {
        recommendations.push('Implement input validation to prevent errors');
      }
    }
    
    return recommendations;
  }
}