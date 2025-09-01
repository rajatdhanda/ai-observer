/**
 * Business View Component
 * Shows business-level understanding of the application
 */

export function renderBusinessView(data: any): string {
  if (!data) {
    return '<div style="color: #64748b; text-align: center; padding: 40px;">No business analysis available</div>';
  }

  const { tables, workflows, hooks, features, businessRules, dataRelationships } = data;

  return `
    <div class="business-view">
      <!-- Feature Health Overview -->
      <div class="section">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">📊 Feature Health Status</h2>
        <div class="grid">
          ${(features || []).map((feature: any) => {
            const statusColor = feature.healthStatus === 'working' ? '#10b981' : 
                               feature.healthStatus === 'broken' ? '#ef4444' : '#f59e0b';
            const statusIcon = feature.healthStatus === 'working' ? '✅' : 
                              feature.healthStatus === 'broken' ? '❌' : '⚠️';
            
            return `
              <div class="card" style="border-left: 4px solid ${statusColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h3>${feature.name}</h3>
                  <span style="font-size: 24px;">${statusIcon}</span>
                </div>
                <div style="font-size: 14px; color: #94a3b8;">
                  <div>📦 ${feature.tables.length} tables</div>
                  <div>🔧 ${feature.hooks.length} hooks</div>
                  <div>🌐 ${feature.apis.length} APIs</div>
                </div>
                ${feature.issues.length > 0 ? `
                  <div style="margin-top: 10px; padding: 8px; background: #7f1d1d; border-radius: 4px;">
                    <div style="color: #fca5a5; font-size: 12px; font-weight: bold;">Issues:</div>
                    ${feature.issues.map((issue: string) => `
                      <div style="color: #fca5a5; font-size: 12px;">• ${issue}</div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Database Tables -->
      <div class="section">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">🗄️ Database Tables (${tables?.length || 0})</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
          ${(tables || []).map((table: any) => `
            <div style="background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155;">
              <div style="font-weight: bold; color: #3b82f6; margin-bottom: 5px;">${table.name}</div>
              <div style="font-size: 12px; color: #94a3b8;">
                <div>📝 ${table.fields.length} fields</div>
                <div>🔗 ${table.relationships.length} relationships</div>
                ${table.location ? `<div style="color: #64748b; margin-top: 5px;">📁 ${table.location.split('/').pop()}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Business Workflows -->
      <div class="section">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">🔄 Business Workflows</h2>
        ${(workflows || []).map((workflow: any) => `
          <div class="card" style="margin-bottom: 15px;">
            <h3 style="color: #e2e8f0; margin-bottom: 10px;">${workflow.name}</h3>
            <p style="color: #94a3b8; margin-bottom: 15px;">${workflow.description}</p>
            
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
              ${workflow.steps.map((step: any, idx: number) => `
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="background: #334155; padding: 8px 12px; border-radius: 6px;">
                    <div style="font-size: 12px; color: #64748b;">${step.actor}</div>
                    <div style="font-size: 14px; color: #e2e8f0;">${step.action}</div>
                  </div>
                  ${idx < workflow.steps.length - 1 ? '<span style="color: #64748b;">→</span>' : ''}
                </div>
              `).join('')}
            </div>
            
            <div style="display: flex; gap: 20px; font-size: 14px;">
              <div>
                <span style="color: #64748b;">Triggers:</span> 
                <span style="color: #3b82f6;">${workflow.triggers.join(', ')}</span>
              </div>
              <div>
                <span style="color: #64748b;">Outcomes:</span> 
                <span style="color: #10b981;">${workflow.outcomes.join(', ')}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Hooks Usage -->
      <div class="section">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">🪝 Hooks & State Management</h2>
        <div class="grid">
          ${(hooks || []).map((hook: any) => {
            const typeColor = hook.type === 'data' ? '#3b82f6' : 
                             hook.type === 'state' ? '#10b981' : 
                             hook.type === 'effect' ? '#f59e0b' : '#8b5cf6';
            
            return `
              <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h4 style="color: #e2e8f0;">${hook.name}</h4>
                  <span style="background: ${typeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                    ${hook.type}
                  </span>
                </div>
                <div style="font-size: 14px; color: #94a3b8; margin-bottom: 10px;">${hook.purpose}</div>
                ${hook.dataFlow ? `
                  <div style="font-size: 12px; color: #64748b; padding: 8px; background: #0f172a; border-radius: 4px;">
                    Data flow: ${hook.dataFlow}
                  </div>
                ` : ''}
                ${hook.usedIn.length > 0 ? `
                  <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                    Used in: ${hook.usedIn.slice(0, 3).join(', ')}${hook.usedIn.length > 3 ? '...' : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Business Rules -->
      <div class="section">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">📋 Business Rules (${businessRules?.length || 0})</h2>
        <div style="max-height: 400px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #334155;">
                <th style="padding: 10px; text-align: left;">Rule</th>
                <th style="padding: 10px; text-align: left;">Category</th>
                <th style="padding: 10px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${(businessRules || []).slice(0, 10).map((rule: any) => `
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px;">${rule.name}</td>
                  <td style="padding: 10px;">
                    <span style="background: #334155; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                      ${rule.category}
                    </span>
                  </td>
                  <td style="padding: 10px;">
                    ${rule.enforced ? 
                      '<span style="color: #10b981;">✓ Enforced</span>' : 
                      '<span style="color: #ef4444;">✗ Not enforced</span>'
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Data Relationships Graph -->
      <div class="section">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">🔗 Data Relationships</h2>
        <div style="padding: 20px; background: #0f172a; border-radius: 8px;">
          ${(dataRelationships || []).slice(0, 10).map((rel: any) => `
            <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="background: #1e293b; padding: 4px 8px; border-radius: 4px;">${rel.from}</span>
              <span style="color: #64748b;">→</span>
              <span style="background: #1e293b; padding: 4px 8px; border-radius: 4px;">${rel.to}</span>
              <span style="color: #64748b; font-size: 12px;">(${rel.type})</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}