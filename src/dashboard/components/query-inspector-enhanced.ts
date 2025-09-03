/**
 * Enhanced Query Inspector Component
 * Displays queries with error analysis and response preview
 * Max 450 lines
 */

export interface QueryData {
  title: string;
  type: 'database' | 'hook' | 'mutation' | 'api';
  query: string;
  file?: string;
  line?: number;
  hasValidation?: boolean;
  hasErrorHandling?: boolean;
  hasLoadingState?: boolean;
  hasCacheInvalidation?: boolean;
  operations?: string[];
  usedInComponents?: string[];
  errorChain?: ErrorChain;
  responsePreview?: any;
}

export interface ErrorChain {
  hook: string;
  hasErrorState: boolean;
  hasLoadingState: boolean;
  hasCacheInvalidation: boolean;
  components: string[];
  propagation: ErrorPropagation[];
}

export interface ErrorPropagation {
  level: string;
  issue: string;
  impact: string;
  fix: string;
}

export class QueryInspectorEnhanced {
  private container: HTMLElement;
  private queries: QueryData[] = [];
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  loadQueries(tableName: string, tableData: any): void {
    this.queries = [];
    
    // Extract database queries
    if (tableData.databaseQueries?.length > 0) {
      tableData.databaseQueries.forEach((dbQuery: any) => {
        this.queries.push({
          title: `${dbQuery.type || 'SELECT'} ${tableName}`,
          type: 'database',
          query: dbQuery.query || this.generateSampleQuery(tableName, dbQuery.type),
          file: dbQuery.file,
          line: dbQuery.line,
          hasValidation: dbQuery.hasValidation,
          hasErrorHandling: dbQuery.hasErrorHandling,
          responsePreview: this.generateResponsePreview(tableName)
        });
      });
    }
    
    // Extract hooks with error chain analysis
    if (tableData.hooks?.length > 0) {
      tableData.hooks.forEach((hook: any) => {
        const errorChain = this.analyzeErrorChain(hook);
        this.queries.push({
          title: hook.hookName || hook,
          type: 'hook',
          query: this.generateHookQuery(hook),
          file: hook.file,
          hasErrorHandling: hook.hasErrorHandling,
          hasLoadingState: hook.hasLoadingState,
          usedInComponents: hook.usedInComponents || [],
          errorChain
        });
      });
    }
    
    // Extract mutations
    if (tableData.mutations?.length > 0) {
      tableData.mutations.forEach((mutation: any) => {
        this.queries.push({
          title: mutation.mutationName || `Create ${tableName}`,
          type: 'mutation',
          query: this.generateMutationQuery(tableName, mutation),
          file: mutation.file,
          hasCacheInvalidation: mutation.hasCacheInvalidation
        });
      });
    }
    
    // Extract API endpoints
    if (tableData.apiEndpoints?.length > 0) {
      tableData.apiEndpoints.forEach((api: any) => {
        this.queries.push({
          title: api.endpoint || api,
          type: 'api',
          query: this.generateAPIQuery(api),
          file: api.file
        });
      });
    }
    
    this.render();
  }
  
  private render(): void {
    if (this.queries.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
          <div>No queries found for this table</div>
        </div>
      `;
      return;
    }
    
    this.container.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="color: #f8fafc; margin: 0;">🔍 Query Inspector</h3>
          <span style="color: #64748b; font-size: 12px;">${this.queries.length} queries</span>
        </div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 20px;">
          ${this.renderFilterButtons()}
        </div>
        
        <div class="queries-list">
          ${this.queries.map(q => this.renderQuery(q)).join('')}
        </div>
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  private renderFilterButtons(): string {
    const types = [...new Set(this.queries.map(q => q.type))];
    return types.map(type => `
      <button class="filter-btn" data-type="${type}" style="
        padding: 6px 12px;
        background: #252525;
        color: #94a3b8;
        border: 1px solid #333;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      ">
        ${this.getTypeIcon(type)} ${type}
      </button>
    `).join('');
  }
  
  private renderQuery(query: QueryData): string {
    const statusColor = this.getStatusColor(query);
    
    return `
      <div class="query-box" style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        border-left: 3px solid ${statusColor};
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <span style="font-size: 14px; font-weight: 600; color: #f8fafc;">
              ${query.title}
            </span>
            ${this.renderTypeBadge(query.type)}
          </div>
          ${this.renderStatusIndicators(query)}
        </div>
        
        <div style="
          background: #0a0a0a;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Monaco', monospace;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 12px;
          overflow-x: auto;
        ">
          <pre style="margin: 0;">${this.highlightQuery(query.query)}</pre>
        </div>
        
        ${query.responsePreview ? this.renderResponsePreview(query.responsePreview) : ''}
        ${query.errorChain ? this.renderErrorChain(query.errorChain) : ''}
        
        <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: #64748b;">
          ${query.file ? `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>📁</span>
              <span>${query.file.split('/').pop()}</span>
              ${query.line ? `<span>:${query.line}</span>` : ''}
            </div>
          ` : ''}
          ${query.usedInComponents?.length ? `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>🧩</span>
              <span>${query.usedInComponents.join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  private renderStatusIndicators(query: QueryData): string {
    const indicators = [];
    
    if (query.hasErrorHandling === false) {
      indicators.push('<span style="color: #ef4444;" title="No error handling">⚠️</span>');
    } else if (query.hasErrorHandling) {
      indicators.push('<span style="color: #10b981;" title="Has error handling">✅</span>');
    }
    
    if (query.hasLoadingState) {
      indicators.push('<span style="color: #10b981;" title="Has loading state">⏳</span>');
    }
    
    if (query.hasCacheInvalidation) {
      indicators.push('<span style="color: #3b82f6;" title="Cache invalidation">🔄</span>');
    }
    
    return `<div style="display: flex; gap: 4px;">${indicators.join('')}</div>`;
  }
  
  private renderResponsePreview(preview: any): string {
    return `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Response Preview:</div>
        <div style="
          background: #0a0a0a;
          padding: 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
          color: #10b981;
          max-height: 100px;
          overflow-y: auto;
        ">
          <pre style="margin: 0;">${JSON.stringify(preview, null, 2)}</pre>
        </div>
      </div>
    `;
  }
  
  private renderErrorChain(chain: ErrorChain): string {
    if (!chain.propagation?.length) return '';
    
    return `
      <div style="
        background: #7f1d1d20;
        border: 1px solid #ef444440;
        border-radius: 6px;
        padding: 12px;
        margin-top: 12px;
      ">
        <div style="font-size: 12px; color: #fca5a5; margin-bottom: 8px; font-weight: 600;">
          ⚠️ Error Propagation Chain
        </div>
        ${chain.propagation.map(prop => `
          <div style="margin-bottom: 8px; padding-left: 16px; border-left: 2px solid #ef444440;">
            <div style="font-size: 11px; color: #fca5a5;">${prop.issue}</div>
            <div style="font-size: 10px; color: #f87171; margin-top: 2px;">
              Impact: ${prop.impact}
            </div>
            <div style="font-size: 10px; color: #10b981; margin-top: 2px;">
              Fix: ${prop.fix}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  private renderTypeBadge(type: string): string {
    const colors = {
      database: '#3b82f6',
      hook: '#8b5cf6',
      mutation: '#f59e0b',
      api: '#10b981'
    };
    
    return `
      <span style="
        margin-left: 8px;
        padding: 2px 8px;
        background: ${colors[type as keyof typeof colors]}20;
        color: ${colors[type as keyof typeof colors]};
        border-radius: 4px;
        font-size: 10px;
        text-transform: uppercase;
        font-weight: 600;
      ">
        ${type}
      </span>
    `;
  }
  
  private analyzeErrorChain(hook: any): ErrorChain {
    const chain: ErrorChain = {
      hook: hook.hookName || 'Unknown',
      hasErrorState: hook.hasErrorHandling || false,
      hasLoadingState: hook.hasLoadingState || false,
      hasCacheInvalidation: hook.operations?.includes('invalidate') || false,
      components: hook.usedInComponents || [],
      propagation: []
    };
    
    if (!chain.hasErrorState) {
      chain.propagation.push({
        level: 'hook',
        issue: 'No error handling in hook',
        impact: 'Component will crash on error',
        fix: 'Add try-catch or error state'
      });
    }
    
    if (!chain.hasLoadingState) {
      chain.propagation.push({
        level: 'hook',
        issue: 'No loading state',
        impact: 'UI freezes during fetch',
        fix: 'Add isLoading state'
      });
    }
    
    return chain;
  }
  
  private generateSampleQuery(tableName: string, type?: string): string {
    if (type === 'INSERT') {
      return `INSERT INTO ${tableName}s (name, created_at) VALUES ($1, $2)`;
    }
    return `SELECT * FROM ${tableName}s WHERE id = $1`;
  }
  
  private generateHookQuery(hook: any): string {
    const name = hook.hookName || 'useQuery';
    return `const { data, error, isLoading } = ${name}();\n\n// Operations: ${hook.operations?.join(', ') || 'fetch'}`;
  }
  
  private generateMutationQuery(tableName: string, mutation: any): string {
    return `const { data, error } = await supabase
  .from('${tableName}s')
  .insert(values)
  .select();`;
  }
  
  private generateAPIQuery(api: any): string {
    const endpoint = api.endpoint || '/api/unknown';
    return `// ${api.method || 'GET'} ${endpoint}\nconst response = await fetch('${endpoint}');`;
  }
  
  private generateResponsePreview(tableName: string): any {
    return {
      id: "uuid-example",
      name: `Sample ${tableName}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  private highlightQuery(query: string): string {
    // Simple syntax highlighting
    return query
      .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|const|let|var|async|await)\b/g, 
               '<span style="color: #3b82f6;">$1</span>')
      .replace(/('.*?'|".*?")/g, '<span style="color: #10b981;">$1</span>');
  }
  
  private getStatusColor(query: QueryData): string {
    if (query.hasErrorHandling === false) return '#ef4444';
    if (query.hasErrorHandling && query.hasLoadingState) return '#10b981';
    return '#f59e0b';
  }
  
  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      database: '🗄️',
      hook: '🔗',
      mutation: '✏️',
      api: '🌐'
    };
    return icons[type] || '📋';
  }
  
  private attachEventListeners(): void {
    // Filter buttons functionality can be added here
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = (e.target as HTMLElement).dataset.type;
        console.log('Filter by type:', type);
      });
    });
  }
}