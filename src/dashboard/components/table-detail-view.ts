/**
 * Table Detail View Component
 * Renders complete table information with properties, relationships, data flow, and usage statistics
 */

export interface TableData {
  name: string;
  schemaFile: string;
  score: number;
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
    defaultValue?: any;
  }>;
  relationships: Array<{
    type: string;
    target: string;
    field: string;
  }>;
  hooks: Array<{
    hookName: string;
    operations: string[];
  }>;
  components: string[];
  apiRoutes: string[];
  mutations: string[];
  validationIssues?: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
}

export class TableDetailView {
  static render(table: TableData): string {
    const healthColor = table.score >= 80 ? '#10b981' : table.score >= 60 ? '#f59e0b' : '#ef4444';
    const validationErrors = table.validationIssues?.filter(i => i.type === 'error').length || 0;
    const validationWarnings = table.validationIssues?.filter(i => i.type === 'warning').length || 0;

    return `
      <div style="padding: 20px;">
        <!-- Table Header -->
        <div style="margin-bottom: 24px;">
          <h2 style="color: #f8fafc; font-size: 28px; margin-bottom: 8px;">${table.name}</h2>
          <div style="color: #64748b; font-size: 14px;">${table.schemaFile}</div>
        </div>

        <!-- Health Score Card -->
        <div style="
          background: #1a1a1a;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #333;
          display: flex;
          align-items: center;
          gap: 32px;
        ">
          <div style="
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: conic-gradient(${healthColor} ${table.score * 3.6}deg, #333 0deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 100px;
              height: 100px;
              border-radius: 50%;
              background: #0a0a0a;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            ">
              <div style="font-size: 32px; font-weight: bold; color: ${healthColor};">
                ${table.score}%
              </div>
              <div style="font-size: 12px; color: #64748b;">Health Score</div>
            </div>
          </div>

          <div style="flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            <div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Type</div>
              <div style="color: ${validationErrors === 0 ? '#10b981' : '#ef4444'}; font-size: 18px; font-weight: 600;">
                ${validationErrors === 0 ? '✓' : '✗'} Type Safety
              </div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Validation</div>
              <div style="color: ${validationWarnings === 0 ? '#10b981' : '#f59e0b'}; font-size: 18px; font-weight: 600;">
                ${validationWarnings === 0 ? '✓' : '⚠'} Warnings: ${validationWarnings}
              </div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Hooks</div>
              <div style="color: #3b82f6; font-size: 18px; font-weight: 600;">
                ${table.hooks?.length || 0} Active
              </div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">UI</div>
              <div style="color: #3b82f6; font-size: 18px; font-weight: 600;">
                ${table.components?.length || 0} Components
              </div>
            </div>
          </div>
        </div>

        <!-- Properties Section -->
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
          <h3 style="color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            📋 Properties (${table.properties?.length || 0})
          </h3>
          <div style="display: grid; gap: 8px;">
            ${(table.properties || []).map(prop => `
              <div style="
                background: #0a0a0a;
                padding: 12px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border: 1px solid #252525;
              ">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #f8fafc; font-weight: 500;">${prop.name}</span>
                  ${prop.required ? '<span style="color: #ef4444; font-size: 12px;">*</span>' : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="
                    background: #252525;
                    padding: 4px 8px;
                    border-radius: 4px;
                    color: #94a3b8;
                    font-size: 12px;
                    font-family: monospace;
                  ">${prop.type}</span>
                  ${prop.unique ? '<span style="color: #f59e0b; font-size: 11px;">UNIQUE</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Relationships Section -->
        ${table.relationships && table.relationships.length > 0 ? `
          <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
            <h3 style="color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              🔗 Relationships (${table.relationships.length})
            </h3>
            <div style="display: grid; gap: 8px;">
              ${table.relationships.map(rel => `
                <div style="
                  background: #0a0a0a;
                  padding: 12px;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  border: 1px solid #252525;
                ">
                  <span style="color: #f8fafc;">${table.name}</span>
                  <span style="color: #64748b;">→</span>
                  <span style="color: #3b82f6; font-weight: 500;">${rel.type}</span>
                  <span style="color: #64748b;">→</span>
                  <span style="color: #f8fafc;">${rel.target}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Data Flow Section -->
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
          <h3 style="color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            🔄 Data Flow
          </h3>
          <div style="
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: #0a0a0a;
            border-radius: 8px;
          ">
            <div style="
              background: #3b82f6;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 500;
            ">Type</div>
            <span style="color: #64748b;">→</span>
            <div style="
              background: #ef4444;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 500;
            ">Database</div>
            <span style="color: #64748b;">→</span>
            <div style="
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 500;
            ">Hooks</div>
            <span style="color: #64748b;">→</span>
            <div style="
              background: #8b5cf6;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 500;
            ">Components</div>
            <span style="color: #64748b;">→</span>
            <div style="
              background: #f59e0b;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 500;
            ">API</div>
          </div>
        </div>

        <!-- Usage Statistics -->
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #333;">
          <h3 style="color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            📊 Usage Statistics
          </h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #3b82f6; font-size: 28px; font-weight: bold;">${table.hooks?.length || 0}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">HOOKS</div>
            </div>
            <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #8b5cf6; font-size: 28px; font-weight: bold;">${table.components?.length || 0}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">COMPONENTS</div>
            </div>
            <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #f59e0b; font-size: 28px; font-weight: bold;">${table.apiRoutes?.length || 0}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">API ROUTES</div>
            </div>
            <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #ef4444; font-size: 28px; font-weight: bold;">${table.mutations?.length || 0}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">MUTATIONS</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}