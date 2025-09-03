/**
 * Page Details Viewer Component
 * Shows comprehensive page information with health scores and violations
 * Max 400 lines
 */

export interface PageData {
  path: string;
  display?: string;
  health?: number;
  components?: string[];
  hooks?: string[];
  violations?: Array<{
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    location?: string;
    line?: number;
    expected?: string;
    actual?: string;
  }>;
}

export class PageDetailsViewer {
  private container: HTMLElement;
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  render(pagePath: string, validationData?: any): void {
    const pageData = this.extractPageData(pagePath, validationData);
    const displayName = this.formatPageName(pagePath);
    const healthScore = this.calculateHealthScore(pageData);
    
    this.container.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderHeader(displayName, pagePath)}
        ${this.renderHealthScore(healthScore, pageData)}
        ${this.renderDataFlow(pageData)}
        ${this.renderViolations(pageData.violations)}
        ${this.renderUsedComponents(pageData.components)}
        ${this.renderUsedHooks(pageData.hooks)}
        ${this.renderRecommendations(pageData)}
      </div>
    `;
  }
  
  private formatPageName(path: string): string {
    // Handle nested paths like "src/app/(main)/feed/page.tsx"
    if (path.includes('(main)')) {
      const parts = path.split('/');
      const mainIdx = parts.findIndex(p => p === '(main)');
      if (mainIdx >= 0 && mainIdx < parts.length - 1) {
        return `(main) > ${parts[mainIdx + 1]}`;
      }
    }
    
    // Extract page name from path
    const parts = path.split('/');
    const pageName = parts[parts.length - 2];
    return pageName === 'app' ? 'Home' : pageName;
  }
  
  private extractPageData(pagePath: string, validationData?: any): PageData {
    const data: PageData = {
      path: pagePath,
      display: this.formatPageName(pagePath),
      components: [],
      hooks: [],
      violations: []
    };
    
    // Extract violations for this page
    if (validationData?.contracts?.violations) {
      validationData.contracts.violations.forEach((v: any) => {
        if (v.location && v.location.includes(pagePath)) {
          data.violations?.push({
            type: 'contract',
            message: v.message,
            severity: v.type === 'error' ? 'critical' : 'warning',
            location: v.location,
            line: this.extractLineNumber(v.location),
            expected: v.expected,
            actual: v.actual
          });
        }
      });
    }
    
    // Sample components and hooks (would come from actual analysis)
    const pageName = this.formatPageName(pagePath);
    if (pageName.includes('feed')) {
      data.components = ['PostCard', 'FeedList', 'CreatePost', 'PostEngagement'];
      data.hooks = ['usePosts', 'useInfiniteScroll', 'usePostEngagement'];
    } else if (pageName.includes('crm')) {
      data.components = ['ClientList', 'ClientCard', 'AppointmentCalendar'];
      data.hooks = ['useClients', 'useAppointments'];
    }
    
    return data;
  }
  
  private extractLineNumber(location: string): number | undefined {
    const match = location.match(/:(\d+)$/);
    return match ? parseInt(match[1], 10) : undefined;
  }
  
  private calculateHealthScore(data: PageData): number {
    let score = 100;
    
    if (data.violations) {
      data.violations.forEach(v => {
        if (v.severity === 'critical') score -= 20;
        else if (v.severity === 'warning') score -= 10;
        else score -= 5;
      });
    }
    
    // Bonus for having components and hooks
    if (data.components && data.components.length > 0) score += 5;
    if (data.hooks && data.hooks.length > 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private renderHeader(displayName: string, path: string): string {
    return `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #f8fafc; margin: 0; font-size: 28px; display: flex; align-items: center; gap: 12px;">
          📄 ${displayName}
          <span style="
            padding: 4px 12px;
            background: #8b5cf620;
            color: #8b5cf6;
            border-radius: 6px;
            font-size: 12px;
            font-weight: normal;
            text-transform: uppercase;
          ">page</span>
        </h2>
        <div style="color: #64748b; font-size: 13px; margin-top: 8px; font-family: monospace;">
          ${path}
        </div>
      </div>
    `;
  }
  
  private renderHealthScore(score: number, data: PageData): string {
    const color = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const status = score >= 80 ? 'Healthy' : score >= 40 ? 'Needs Attention' : 'Critical Issues';
    
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
            ${data.violations?.length || 0} issues found • 
            ${data.components?.length || 0} components • 
            ${data.hooks?.length || 0} hooks
          </div>
        </div>
      </div>
    `;
  }
  
  private renderDataFlow(data: PageData): string {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔄 Page Data Flow</h3>
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #0f0f0f;
          border-radius: 8px;
          overflow-x: auto;
        ">
          <div style="
            padding: 8px 16px;
            background: #8b5cf620;
            color: #8b5cf6;
            border-radius: 6px;
            white-space: nowrap;
          ">Page Route</div>
          
          <span style="color: #64748b;">→</span>
          
          <div style="
            padding: 8px 16px;
            background: ${data.components?.length ? '#f59e0b20' : '#25252580'};
            color: ${data.components?.length ? '#f59e0b' : '#64748b'};
            border-radius: 6px;
            white-space: nowrap;
          ">Components (${data.components?.length || 0})</div>
          
          <span style="color: #64748b;">→</span>
          
          <div style="
            padding: 8px 16px;
            background: ${data.hooks?.length ? '#3b82f620' : '#25252580'};
            color: ${data.hooks?.length ? '#3b82f6' : '#64748b'};
            border-radius: 6px;
            white-space: nowrap;
          ">Hooks (${data.hooks?.length || 0})</div>
          
          <span style="color: #64748b;">→</span>
          
          <div style="
            padding: 8px 16px;
            background: #10b98120;
            color: #10b981;
            border-radius: 6px;
            white-space: nowrap;
          ">Rendered UI</div>
        </div>
      </div>
    `;
  }
  
  private renderViolations(violations?: PageData['violations']): string {
    if (!violations || violations.length === 0) {
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
          ✅ No violations found - Page follows all contracts
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
          ⚠️ Violations (${violations.length})
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
                  <div style="color: #f8fafc; font-size: 14px; margin-bottom: 4px;">
                    ${v.message}
                  </div>
                  ${v.expected ? `
                    <div style="margin-top: 8px; font-family: monospace; font-size: 12px;">
                      <span style="color: #10b981;">Expected:</span> ${v.expected}<br>
                      <span style="color: #ef4444;">Actual:</span> ${v.actual || 'undefined'}
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
  
  private renderUsedComponents(components?: string[]): string {
    if (!components || components.length === 0) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">
          🧩 Components (${components.length})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px;">
          ${components.map(c => `
            <div style="
              padding: 10px;
              background: #0f0f0f;
              border-radius: 6px;
              color: #f59e0b;
              font-size: 13px;
            ">${c}</div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  private renderUsedHooks(hooks?: string[]): string {
    if (!hooks || hooks.length === 0) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">
          🔗 Hooks (${hooks.length})
        </h3>
        <div style="display: grid; gap: 8px;">
          ${hooks.map(h => `
            <div style="
              padding: 10px;
              background: #0f0f0f;
              border-radius: 6px;
              color: #3b82f6;
              font-family: monospace;
              font-size: 13px;
            ">${h}</div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  private renderRecommendations(data: PageData): string {
    const recommendations = [];
    
    if (!data.components || data.components.length === 0) {
      recommendations.push('Consider breaking down this page into reusable components');
    }
    
    if (!data.hooks || data.hooks.length === 0) {
      recommendations.push('Use custom hooks to manage data fetching and state');
    }
    
    if (data.violations && data.violations.length > 5) {
      recommendations.push('Focus on fixing contract violations to improve code quality');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Page is well-structured. Consider adding performance monitoring.');
    }
    
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