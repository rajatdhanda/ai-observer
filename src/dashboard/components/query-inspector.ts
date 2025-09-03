/**
 * Query Inspector Component
 * Shows detailed query information with data flow pipeline
 */

export interface QueryData {
  tableName: string;
  hookName: string;
  operation: string;
  file: string;
  line: number;
  query: string;
  hasValidation: boolean;
  hasErrorHandling: boolean;
  dataFlow: {
    type: boolean;
    db: boolean;
    hooks: number;
    components?: string[];
  };
}

export class QueryInspector {
  static render(query: QueryData): string {
    return `
      <div style="background: #0a0a0a; height: 100%; display: flex; flex-direction: column;">
        <!-- Header -->
        <div style="
          background: #1a1a1a;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
        ">
          <h3 style="color: #f8fafc; margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
            🔍 Query Inspector - ${query.tableName}
          </h3>
        </div>

        <!-- Content -->
        <div style="flex: 1; overflow-y: auto; padding: 20px;">
          <!-- Data Flow Pipeline -->
          <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #f8fafc; margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              📊 Data Flow Pipeline
            </h4>
            <div style="display: flex; align-items: center; gap: 12px; justify-content: center; padding: 12px;">
              <div style="text-align: center;">
                <div style="
                  width: 80px;
                  height: 80px;
                  background: ${query.dataFlow.type ? '#3b82f6' : '#333'};
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 8px;
                ">
                  <span style="color: white; font-size: 24px;">Type</span>
                </div>
                <div style="color: ${query.dataFlow.type ? '#10b981' : '#ef4444'}; font-size: 20px;">
                  ${query.dataFlow.type ? '✓' : '✗'}
                </div>
              </div>

              <span style="color: #64748b; font-size: 20px;">→</span>

              <div style="text-align: center;">
                <div style="
                  width: 80px;
                  height: 80px;
                  background: ${query.dataFlow.db ? '#ef4444' : '#333'};
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 8px;
                ">
                  <span style="color: white; font-size: 24px;">DB</span>
                </div>
                <div style="color: ${query.dataFlow.db ? '#10b981' : '#ef4444'}; font-size: 20px;">
                  ${query.dataFlow.db ? '✗' : '✓'}
                </div>
              </div>

              <span style="color: #64748b; font-size: 20px;">→</span>

              <div style="text-align: center;">
                <div style="
                  width: 80px;
                  height: 80px;
                  background: ${query.dataFlow.hooks > 0 ? '#10b981' : '#333'};
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 8px;
                  flex-direction: column;
                ">
                  <span style="color: white; font-size: 18px;">Hooks</span>
                  <span style="color: white; font-size: 24px; font-weight: bold;">${query.dataFlow.hooks}</span>
                </div>
                <div style="color: ${query.dataFlow.hooks > 0 ? '#10b981' : '#64748b'}; font-size: 14px;">
                  ${query.dataFlow.hooks > 0 ? '🪝' : '-'}
                </div>
              </div>
            </div>
          </div>

          <!-- Query Details -->
          <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #f8fafc; margin-bottom: 12px; font-size: 14px;">${query.hookName}</h4>
            <div style="
              background: #0a0a0a;
              border: 1px solid #333;
              border-radius: 4px;
              padding: 12px;
              font-family: 'Monaco', 'Courier New', monospace;
            ">
              <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
                ${query.file}:${query.line}
              </div>
              <pre style="color: #e2e8f0; margin: 0; font-size: 12px; white-space: pre-wrap;">${this.formatQuery(query.query)}</pre>
            </div>
          </div>

          <!-- Validation Status -->
          <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 20px;">
              <div style="flex: 1;">
                <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Validation</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${query.hasValidation ? 
                    '<span style="color: #10b981; font-size: 18px;">✓</span><span style="color: #10b981;">Has validation</span>' :
                    '<span style="color: #ef4444; font-size: 18px;">✗</span><span style="color: #ef4444;">No validation</span>'
                  }
                </div>
              </div>
              <div style="flex: 1;">
                <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Error Handling</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${query.hasErrorHandling ? 
                    '<span style="color: #10b981; font-size: 18px;">✓</span><span style="color: #10b981;">Has error handling</span>' :
                    '<span style="color: #f59e0b; font-size: 18px;">⚠</span><span style="color: #f59e0b;">No error handling</span>'
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Components Using This Query -->
          ${query.dataFlow.components && query.dataFlow.components.length > 0 ? `
            <div style="background: #1a1a1a; border-radius: 8px; padding: 16px;">
              <h4 style="color: #f8fafc; margin-bottom: 12px; font-size: 14px;">Components Using This Query</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${query.dataFlow.components.map(comp => `
                  <span style="
                    background: #252525;
                    padding: 6px 12px;
                    border-radius: 4px;
                    color: #94a3b8;
                    font-size: 12px;
                    border: 1px solid #333;
                  ">${comp}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private static formatQuery(query: string): string {
    // Format the query for better readability
    return query
      .replace(/const\s+/g, '<span style="color: #c678dd;">const</span> ')
      .replace(/\{([^}]+)\}/g, (match, content) => 
        `<span style="color: #e06c75;">{${content}}</span>`)
      .replace(/data\.(\w+)/g, '<span style="color: #61afef;">data.$1</span>')
      .replace(/error/g, '<span style="color: #e06c75;">error</span>')
      .replace(/isLoading/g, '<span style="color: #d19a66;">isLoading</span>')
      .replace(/(useFeed|useProducts|useClients)\(/g, '<span style="color: #98c379;">$1</span>(')
      .replace(/\/\/.*/g, '<span style="color: #5c6370;">$&</span>');
  }
}