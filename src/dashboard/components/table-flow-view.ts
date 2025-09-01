/**
 * Table Flow View Component
 * Shows how each table flows through the application
 */

import { TableMapping, TableUsage } from '../../validator/table-mapper';

export function renderTableFlowView(data: TableMapping | null): string {
  if (!data || !data.tables || Object.keys(data.tables).length === 0) {
    return `
      <div style="color: #64748b; text-align: center; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🗄️</div>
        <div style="font-size: 20px; margin-bottom: 10px;">No table mapping available</div>
        <div>Click "Map Table Usage" to analyze how your tables flow through the app</div>
      </div>
    `;
  }

  const tables = Object.entries(data.tables);
  
  return `
    <div class="table-flow-view">
      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: #14532d; padding: 20px; border-radius: 12px; border: 1px solid #10b981;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.summary.fullyMapped}</div>
          <div style="color: #86efac;">Fully Mapped</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">Complete data flow</div>
        </div>
        <div style="background: #78350f; padding: 20px; border-radius: 12px; border: 1px solid #f59e0b;">
          <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${data.summary.partiallyMapped}</div>
          <div style="color: #fcd34d;">Partially Mapped</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">Missing some connections</div>
        </div>
        <div style="background: #7f1d1d; padding: 20px; border-radius: 12px; border: 1px solid #ef4444;">
          <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${data.summary.unmapped}</div>
          <div style="color: #fca5a5;">Unmapped</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">No usage found</div>
        </div>
        <div style="background: #1e3a8a; padding: 20px; border-radius: 12px; border: 1px solid #3b82f6;">
          <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${data.summary.totalTables}</div>
          <div style="color: #93c5fd;">Total Tables</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">Discovered in types</div>
        </div>
      </div>

      <!-- Table selector -->
      <div style="margin-bottom: 20px;">
        <label style="color: #94a3b8; display: block; margin-bottom: 5px;">Select a table to view its flow:</label>
        <select id="tableSelector" onchange="showTableFlow(this.value)" style="background: #1e293b; color: #e2e8f0; padding: 10px; border-radius: 8px; border: 1px solid #334155; width: 100%; max-width: 400px;">
          <option value="">-- Choose a table --</option>
          ${tables.map(([name, table]) => `
            <option value="${name}">
              ${name} (${table.score}% complete)
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Table Flow Details -->
      <div id="tableFlowDetails">
        ${tables.length > 0 ? renderTableDetails(tables[0][0], tables[0][1]) : ''}
      </div>

      <!-- Critical Issues -->
      ${data.issues.filter(i => i.type === 'critical').length > 0 ? `
        <div class="section" style="background: #7f1d1d; border: 2px solid #ef4444; margin-top: 20px;">
          <h3 style="color: #fca5a5; margin-bottom: 15px;">
            🚨 Critical Issues (${data.issues.filter(i => i.type === 'critical').length})
          </h3>
          <div style="max-height: 300px; overflow-y: auto;">
            ${data.issues.filter(i => i.type === 'critical').map(issue => `
              <div style="background: #991b1b; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                <div style="color: #fca5a5; font-weight: bold;">
                  Table: ${issue.table}
                </div>
                <div style="color: #e2e8f0; margin: 5px 0;">${issue.issue}</div>
                <div style="color: #10b981; font-size: 12px;">💡 ${issue.suggestion}</div>
                ${issue.file ? `<div style="color: #64748b; font-size: 11px; margin-top: 5px;">📁 ${issue.file}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <script>
        window.tableData = ${JSON.stringify(data.tables)};
        
        function showTableFlow(tableName) {
          if (!tableName) return;
          const table = window.tableData[tableName];
          if (!table) return;
          
          document.getElementById('tableFlowDetails').innerHTML = \`${tables.map(([name, table]) => 
            `\${tableName === '${name}' ? \`${renderTableDetails(name, table).replace(/`/g, '\\`')}\` : ''}`
          ).join('')}\`;
        }
      </script>
    </div>
  `;
}

function renderTableDetails(name: string, table: TableUsage): string {
  const scoreColor = table.score >= 80 ? '#10b981' : 
                    table.score >= 40 ? '#f59e0b' : '#ef4444';

  return `
    <div class="section" style="border: 2px solid #334155;">
      <!-- Table Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #334155;">
        <h2 style="color: #3b82f6; font-size: 24px; text-transform: capitalize;">
          🗄️ ${name}
        </h2>
        <div style="text-align: right;">
          <div style="font-size: 36px; font-weight: bold; color: ${scoreColor};">
            ${table.score}%
          </div>
          <div style="color: #94a3b8; font-size: 12px;">Health Score</div>
        </div>
      </div>

      <!-- Data Flow Chain -->
      <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #3b82f6; margin-bottom: 10px;">📊 Data Flow Chain</h4>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          ${table.dataFlow.chain.map((step, idx) => `
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px; border: 1px solid #10b981;">
                <div style="color: #86efac; font-size: 14px;">✓ ${step}</div>
              </div>
              ${idx < table.dataFlow.chain.length - 1 ? '<span style="color: #64748b;">→</span>' : ''}
            </div>
          `).join('')}
        </div>
        ${table.dataFlow.missingLinks.length > 0 ? `
          <div style="margin-top: 15px; padding: 10px; background: #7f1d1d; border-radius: 4px;">
            <div style="color: #fca5a5; font-weight: bold; margin-bottom: 5px;">Missing Links:</div>
            ${table.dataFlow.missingLinks.map(link => `
              <div style="color: #fca5a5; font-size: 12px;">• ${link}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Type Definition -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">📝 Type Definition</h4>
          ${table.typeDefinition ? `
            <div style="font-family: monospace; font-size: 12px;">
              <div style="color: #e2e8f0;">📁 ${table.typeDefinition.file}:${table.typeDefinition.line}</div>
              <div style="color: ${table.typeDefinition.hasZodSchema ? '#10b981' : '#f59e0b'}; margin-top: 5px;">
                ${table.typeDefinition.hasZodSchema ? '✅' : '⚠️'} Zod Schema: ${table.typeDefinition.hasZodSchema ? table.typeDefinition.schemaName : 'Missing'}
              </div>
            </div>
          ` : `
            <div style="color: #ef4444;">❌ No type definition found</div>
          `}
        </div>

        <!-- Database Queries -->
        <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">🔍 Database Queries (${table.databaseQueries.length})</h4>
          ${table.databaseQueries.length > 0 ? `
            ${table.databaseQueries.map(query => `
              <div style="margin-bottom: 10px; padding: 8px; background: #0f172a; border-radius: 4px;">
                <div style="color: #e2e8f0; font-size: 12px; font-family: monospace;">
                  📁 ${query.file.split('/').pop()}
                </div>
                <div style="color: #64748b; font-size: 11px; margin-top: 3px;">
                  Operations: ${query.operations.join(', ') || 'none'}
                </div>
                <div style="color: ${query.hasValidation ? '#10b981' : '#ef4444'}; font-size: 11px;">
                  ${query.hasValidation ? '✅' : '❌'} Validation
                </div>
              </div>
            `).join('')}
          ` : `
            <div style="color: #ef4444;">❌ No database queries found</div>
          `}
        </div>
      </div>

      <!-- Hooks and Components -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
        <!-- Hooks -->
        <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">🪝 Hooks (${table.hooks.length})</h4>
          ${table.hooks.length > 0 ? `
            ${table.hooks.map(hook => `
              <div style="margin-bottom: 10px; padding: 8px; background: #0f172a; border-radius: 4px;">
                <div style="color: #e2e8f0; font-weight: bold; font-size: 13px;">
                  ${hook.hookName}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                  <span style="color: ${hook.hasErrorHandling ? '#10b981' : '#ef4444'}; font-size: 11px;">
                    ${hook.hasErrorHandling ? '✅' : '❌'} Error
                  </span>
                  <span style="color: ${hook.hasLoadingState ? '#10b981' : '#ef4444'}; font-size: 11px;">
                    ${hook.hasLoadingState ? '✅' : '❌'} Loading
                  </span>
                </div>
              </div>
            `).join('')}
          ` : `
            <div style="color: #ef4444;">❌ No hooks found</div>
          `}
        </div>

        <!-- Components -->
        <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">🎨 Components (${table.components.length})</h4>
          ${table.components.length > 0 ? `
            ${table.components.map(comp => `
              <div style="margin-bottom: 10px; padding: 8px; background: ${comp.directDBAccess ? '#7f1d1d' : '#0f172a'}; border-radius: 4px;">
                <div style="color: #e2e8f0; font-weight: bold; font-size: 13px;">
                  ${comp.componentName}
                </div>
                <div style="color: #64748b; font-size: 11px; margin-top: 3px;">
                  Usage: ${comp.usage}
                </div>
                ${comp.directDBAccess ? `
                  <div style="color: #ef4444; font-size: 11px; margin-top: 3px;">
                    ⚠️ Direct DB Access!
                  </div>
                ` : ''}
              </div>
            `).join('')}
          ` : `
            <div style="color: #ef4444;">❌ No components found</div>
          `}
        </div>
      </div>

      <!-- API and Mutations -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
        <!-- API Endpoints -->
        <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">🌐 API Endpoints (${table.apiEndpoints.length})</h4>
          ${table.apiEndpoints.length > 0 ? `
            ${table.apiEndpoints.map(api => `
              <div style="margin-bottom: 10px; padding: 8px; background: #0f172a; border-radius: 4px;">
                <div style="color: #e2e8f0; font-family: monospace; font-size: 12px;">
                  ${api.route}
                </div>
                <div style="color: #64748b; font-size: 11px; margin-top: 3px;">
                  Methods: ${api.methods.join(', ')}
                </div>
                <div style="color: ${api.hasValidation ? '#10b981' : '#ef4444'}; font-size: 11px;">
                  ${api.hasValidation ? '✅' : '❌'} Validation
                </div>
              </div>
            `).join('')}
          ` : `
            <div style="color: #64748b;">No API endpoints</div>
          `}
        </div>

        <!-- Mutations -->
        <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">🔄 Mutations (${table.mutations.length})</h4>
          ${table.mutations.length > 0 ? `
            ${table.mutations.map(mutation => `
              <div style="margin-bottom: 10px; padding: 8px; background: #0f172a; border-radius: 4px;">
                <div style="color: #e2e8f0; font-weight: bold; font-size: 13px;">
                  ${mutation.mutationName}
                </div>
                <div style="color: ${mutation.hasCacheInvalidation ? '#10b981' : '#ef4444'}; font-size: 11px; margin-top: 3px;">
                  ${mutation.hasCacheInvalidation ? '✅' : '❌'} Cache Invalidation
                </div>
              </div>
            `).join('')}
          ` : `
            <div style="color: #64748b;">No mutations</div>
          `}
        </div>
      </div>
    </div>
  `;
}