/**
 * Table Mapping Component
 * Shows database tables with contracts and validation
 */

import { HealthScore } from './health-score';
import { SeverityBadge } from './severity-badge';

export interface TableData {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
    }>;
    contracts?: Array<{
      file: string;
      interface: string;
      fields: string[];
    }>;
    validation?: {
      score: number;
      criticalCount: number;
      warningCount: number;
      issues: string[];
    };
  }>;
}

export class TableMappingComponent {
  static async fetchData(): Promise<TableData> {
    // This will be called from server-side, not browser
    // Return empty data - the server will provide the actual data
    return { tables: [] };
  }
  
  static render(data: TableData): string {
    const tablesWithContracts = data.tables.filter(t => t.contracts && t.contracts.length > 0);
    const tablesWithoutContracts = data.tables.filter(t => !t.contracts || t.contracts.length === 0);
    
    return `
      <div style="padding: 20px;">
        <!-- Summary -->
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="color: #f8fafc; margin: 0;">Database Tables</h2>
              <p style="color: #64748b; margin-top: 4px; font-size: 14px;">
                ${data.tables.length} tables found
              </p>
            </div>
            <div style="text-align: right;">
              <div style="color: #10b981; font-size: 24px; font-weight: bold;">
                ${tablesWithContracts.length}
              </div>
              <div style="color: #64748b; font-size: 12px;">
                with contracts
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tables Grid -->
        <div style="display: grid; gap: 12px;">
          ${data.tables.map(table => this.renderTable(table)).join('')}
        </div>
      </div>
    `;
  }
  
  private static renderTable(table: any): string {
    const hasContract = table.contracts && table.contracts.length > 0;
    const score = table.validation?.score || (hasContract ? 100 : 50);
    const criticalCount = table.validation?.criticalCount || 0;
    const warningCount = table.validation?.warningCount || 0;
    
    return `
      <div style="
        background: #1a1a1a;
        padding: 16px;
        border-radius: 8px;
        border-left: 3px solid ${hasContract ? '#10b981' : '#64748b'};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h3 style="color: #f8fafc; margin: 0; font-size: 16px;">
              ${table.name}
            </h3>
            <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
              ${table.columns.length} columns
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 12px;">
            ${hasContract ? `
              <span style="
                background: #10b98120;
                color: #10b981;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
              ">
                ✓ HAS CONTRACT
              </span>
            ` : `
              <span style="
                background: #64748b20;
                color: #64748b;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
              ">
                NO CONTRACT
              </span>
            `}
            
            ${HealthScore.renderCompact(score)}
          </div>
        </div>
        
        ${criticalCount > 0 || warningCount > 0 ? `
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            ${criticalCount > 0 ? `
              <span style="color: #ef4444; font-size: 11px;">
                ${criticalCount} critical
              </span>
            ` : ''}
            ${warningCount > 0 ? `
              <span style="color: #f59e0b; font-size: 11px;">
                ${warningCount} warnings
              </span>
            ` : ''}
          </div>
        ` : ''}
        
        ${hasContract ? `
          <div style="background: #0a0a0a; padding: 8px; border-radius: 4px; margin-top: 8px;">
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">
              Contracts:
            </div>
            ${table.contracts.map((c: any) => `
              <div style="color: #64748b; font-size: 11px; margin-left: 8px;">
                • ${c.interface} (${c.file})
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${table.validation?.issues && table.validation.issues.length > 0 ? `
          <div style="background: #0a0a0a; padding: 8px; border-radius: 4px; margin-top: 8px;">
            <div style="color: #ef4444; font-size: 11px; margin-bottom: 4px;">
              Issues:
            </div>
            ${table.validation.issues.slice(0, 3).map((issue: string) => `
              <div style="color: #fca5a5; font-size: 11px; margin-left: 8px;">
                • ${issue}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
}