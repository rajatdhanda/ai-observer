/**
 * Component Details Viewer
 * Shows comprehensive component information with violations and usage
 * Max 400 lines
 */

export interface ComponentData {
  name: string;
  type: 'component' | 'hook' | 'api';
  file?: string;
  usedInPages?: string[];
  usedByComponents?: string[];
  tablesUsed?: string[];
  hooksUsed?: string[];
  violations?: Array<{
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    location?: string;
    line?: number;
    rule?: string;
    suggestion?: string;
  }>;
  hasTypeScript?: boolean;
  hasTests?: boolean;
  hasErrorBoundary?: boolean;
}

export class ComponentDetailsViewer {
  private container: HTMLElement;
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  render(componentName: string, type: string = 'component', validationData?: any): void {
    const data = this.extractComponentData(componentName, type, validationData);
    const healthScore = this.calculateHealthScore(data);
    
    this.container.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(data)}
        ${this.renderHealthScore(healthScore, data)}
        ${this.renderArchitecture(data)}
        ${this.renderViolations(data.violations)}
        ${this.renderUsage(data)}
        ${this.renderDependencies(data)}
        ${this.renderRecommendations(data)}
      </div>
    `;
  }
  
  private extractComponentData(name: string, type: string, validationData?: any): ComponentData {
    const data: ComponentData = {
      name,
      type: type as ComponentData['type'],
      violations: [],
      tablesUsed: [],
      hooksUsed: []
    };
    
    // Extract violations for this component
    if (validationData?.contracts?.violations) {
      validationData.contracts.violations.forEach((v: any) => {
        if (v.location && v.location.toLowerCase().includes(name.toLowerCase())) {
          data.violations?.push({
            type: 'contract',
            message: v.message,
            severity: v.type === 'error' ? 'critical' : 'warning',
            location: v.location,
            line: this.extractLineNumber(v.location),
            suggestion: v.suggestion
          });
        }
      });
    }
    
    // Extract nine rules violations
    if (validationData?.nineRules?.results) {
      validationData.nineRules.results.forEach((result: any) => {
        if (result.issues) {
          result.issues.forEach((issue: any) => {
            if (issue.file && issue.file.toLowerCase().includes(name.toLowerCase())) {
              data.violations?.push({
                type: 'nine-rules',
                rule: result.rule,
                message: issue.message,
                severity: issue.severity || 'warning',
                location: issue.file,
                line: this.extractLineNumber(issue.file),
                suggestion: issue.suggestion
              });
            }
          });
        }
      });
    }
    
    // Sample data based on component name
    if (name.toLowerCase().includes('client')) {
      data.tablesUsed = ['client', 'appointment'];
      data.hooksUsed = ['useClients', 'useSupabase'];
      data.usedInPages = ['(main) > crm'];
    } else if (name.toLowerCase().includes('post')) {
      data.tablesUsed = ['post', 'postengagement'];
      data.hooksUsed = ['usePosts', 'useInfiniteScroll'];
      data.usedInPages = ['(main) > feed'];
    }
    
    // Random features for demo
    data.hasTypeScript = Math.random() > 0.3;
    data.hasTests = Math.random() > 0.5;
    data.hasErrorBoundary = Math.random() > 0.7;
    
    return data;
  }
  
  private extractLineNumber(location: string): number | undefined {
    const match = location.match(/:(\d+)$/);
    return match ? parseInt(match[1], 10) : undefined;
  }
  
  private calculateHealthScore(data: ComponentData): number {
    let score = 100;
    
    // Deduct for violations
    if (data.violations) {
      data.violations.forEach(v => {
        if (v.severity === 'critical') score -= 15;
        else if (v.severity === 'warning') score -= 8;
        else score -= 3;
      });
    }
    
    // Bonus for good practices
    if (data.hasTypeScript) score += 5;
    if (data.hasTests) score += 5;
    if (data.hasErrorBoundary) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private renderHeader(data: ComponentData): string {
    const icon = data.type === 'hook' ? '🔗' : 
                 data.type === 'api' ? '🌐' : '🧩';
    const color = data.type === 'hook' ? '#3b82f6' : 
                  data.type === 'api' ? '#ef4444' : '#f59e0b';
    
    return `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-size: 48px;">${icon}</div>
          <div style="flex: 1;">
            <h2 style="color: #f8fafc; margin: 0; font-size: 28px;">
              ${data.name}
            </h2>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <span style="
                padding: 4px 12px;
                background: ${color}20;
                color: ${color};
                border-radius: 6px;
                font-size: 12px;
                text-transform: uppercase;
              ">${data.type}</span>
              ${data.hasTypeScript ? `
                <span style="
                  padding: 4px 12px;
                  background: #3b82f620;
                  color: #3b82f6;
                  border-radius: 6px;
                  font-size: 12px;
                ">TypeScript</span>
              ` : ''}
              ${data.hasTests ? `
                <span style="
                  padding: 4px 12px;
                  background: #10b98120;
                  color: #10b981;
                  border-radius: 6px;
                  font-size: 12px;
                ">✓ Tests</span>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderHealthScore(score: number, data: ComponentData): string {
    const color = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const status = score >= 80 ? 'Excellent' : score >= 40 ? 'Needs Improvement' : 'Critical Issues';
    
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
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#252525" stroke-width="6"/>
          <circle cx="40" cy="40" r="36" fill="none" 
                  stroke="${color}" 
                  stroke-width="6" 
                  stroke-dasharray="${226 * (score / 100)} 226" 
                  stroke-linecap="round" 
                  transform="rotate(-90 40 40)"/>
          <text x="40" y="40" text-anchor="middle" dominant-baseline="middle">
            <tspan style="font-size: 20px; font-weight: bold; fill: ${color};">${score}%</tspan>
          </text>
        </svg>
        
        <div style="flex: 1;">
          <div style="font-size: 18px; color: #f8fafc; margin-bottom: 8px;">
            ${status}
          </div>
          <div style="display: flex; gap: 16px; color: #94a3b8; font-size: 13px;">
            <span>${data.violations?.length || 0} issues</span>
            <span>•</span>
            <span>${data.tablesUsed?.length || 0} tables</span>
            <span>•</span>
            <span>${data.hooksUsed?.length || 0} hooks</span>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderArchitecture(data: ComponentData): string {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🏗️ Architecture</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="
            background: #0f0f0f;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          ">
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">TYPE</div>
            <div style="color: #f8fafc; font-weight: 600; text-transform: capitalize;">
              ${data.type}
            </div>
          </div>
          
          <div style="
            background: #0f0f0f;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          ">
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">ERROR HANDLING</div>
            <div style="color: ${data.hasErrorBoundary ? '#10b981' : '#f59e0b'};">
              ${data.hasErrorBoundary ? '✓ Yes' : '⚠ No'}
            </div>
          </div>
          
          <div style="
            background: #0f0f0f;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          ">
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">TEST COVERAGE</div>
            <div style="color: ${data.hasTests ? '#10b981' : '#ef4444'};">
              ${data.hasTests ? '✓ Yes' : '✗ No'}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderViolations(violations?: ComponentData['violations']): string {
    if (!violations || violations.length === 0) return '';
    
    return `
      <div style="
        background: #ef444410;
        border: 1px solid #ef444430;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f87171; margin: 0 0 16px 0;">
          ⚠️ Issues Found (${violations.length})
        </h3>
        <div style="display: grid; gap: 12px;">
          ${violations.map(v => `
            <div style="
              background: #0f0f0f;
              border-radius: 8px;
              padding: 12px;
              border-left: 3px solid ${
                v.severity === 'critical' ? '#ef4444' : 
                v.severity === 'warning' ? '#f59e0b' : '#3b82f6'
              };
            ">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="color: #f8fafc; font-size: 14px;">
                    ${v.message}
                  </div>
                  ${v.suggestion ? `
                    <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                      → ${v.suggestion}
                    </div>
                  ` : ''}
                  ${v.rule ? `
                    <div style="margin-top: 8px;">
                      <span style="
                        padding: 2px 6px;
                        background: #667eea20;
                        color: #667eea;
                        border-radius: 4px;
                        font-size: 11px;
                      ">${v.rule}</span>
                    </div>
                  ` : ''}
                </div>
                ${v.line ? `
                  <span style="
                    padding: 4px 8px;
                    background: #667eea20;
                    color: #667eea;
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: monospace;
                  ">Line ${v.line}</span>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  private renderUsage(data: ComponentData): string {
    const hasUsage = data.usedInPages?.length || data.usedByComponents?.length;
    if (!hasUsage) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">📍 Usage</h3>
        ${data.usedInPages?.length ? `
          <div style="margin-bottom: 12px;">
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">USED IN PAGES</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${data.usedInPages.map(p => `
                <span style="
                  padding: 6px 12px;
                  background: #8b5cf620;
                  color: #8b5cf6;
                  border-radius: 6px;
                  font-size: 13px;
                ">${p}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private renderDependencies(data: ComponentData): string {
    const hasDeps = data.tablesUsed?.length || data.hooksUsed?.length;
    if (!hasDeps) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔗 Dependencies</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${data.tablesUsed?.length ? `
            <div>
              <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">TABLES</div>
              <div style="display: grid; gap: 6px;">
                ${data.tablesUsed.map(t => `
                  <div style="
                    padding: 8px;
                    background: #0f0f0f;
                    border-radius: 6px;
                    color: #667eea;
                    font-size: 13px;
                  ">📊 ${t}</div>
                `).join('')}
              </div>
            </div>
          ` : '<div></div>'}
          
          ${data.hooksUsed?.length ? `
            <div>
              <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">HOOKS</div>
              <div style="display: grid; gap: 6px;">
                ${data.hooksUsed.map(h => `
                  <div style="
                    padding: 8px;
                    background: #0f0f0f;
                    border-radius: 6px;
                    color: #3b82f6;
                    font-size: 13px;
                    font-family: monospace;
                  ">${h}</div>
                `).join('')}
              </div>
            </div>
          ` : '<div></div>'}
        </div>
      </div>
    `;
  }
  
  private renderRecommendations(data: ComponentData): string {
    const recommendations = [];
    
    if (!data.hasTypeScript) {
      recommendations.push('Add TypeScript for better type safety');
    }
    if (!data.hasTests) {
      recommendations.push('Add unit tests to ensure reliability');
    }
    if (!data.hasErrorBoundary) {
      recommendations.push('Implement error boundary for graceful error handling');
    }
    if (data.violations && data.violations.length > 3) {
      recommendations.push('Fix contract violations to improve code quality');
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