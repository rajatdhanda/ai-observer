/**
 * Architecture Explorer Component
 * Displays complete project architecture with health scores
 */

export interface ArchitectureItem {
  name: string;
  file: string;
  type: 'table' | 'hook' | 'component' | 'api' | 'page';
  healthScore: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  contractErrors: number;
  contractWarnings: number;
  codeQualityErrors: number;
  codeQualityWarnings: number;
}

export class ArchitectureExplorer {
  static async fetchData(projectPath: string): Promise<{
    tables: ArchitectureItem[];
    hooks: ArchitectureItem[];
    components: ArchitectureItem[];
    apis: ArchitectureItem[];
    pages: ArchitectureItem[];
    summary: {
      totalItems: number;
      healthyItems: number;
      criticalItems: number;
      warningItems: number;
      averageHealth: number;
    };
  }> {
    try {
      // Fetch all architecture data in parallel
      const [tables, hooks, components, apis, pages] = await Promise.all([
        fetch('/api/architecture-data?type=table').then(r => r.json()),
        fetch('/api/architecture-data?type=hook').then(r => r.json()),
        fetch('/api/architecture-data?type=component').then(r => r.json()),
        fetch('/api/architecture-data?type=api').then(r => r.json()),
        fetch('/api/architecture-data?type=page').then(r => r.json())
      ]) as [ArchitectureItem[], ArchitectureItem[], ArchitectureItem[], ArchitectureItem[], ArchitectureItem[]];

      // Calculate summary
      const allItems = [...tables, ...hooks, ...components, ...apis, ...pages];
      const summary = {
        totalItems: allItems.length,
        healthyItems: allItems.filter(i => i.healthScore >= 80).length,
        criticalItems: allItems.filter(i => i.errorCount > 0).length,
        warningItems: allItems.filter(i => i.warningCount > 0 && i.errorCount === 0).length,
        averageHealth: allItems.length > 0 
          ? Math.round(allItems.reduce((sum, i) => sum + i.healthScore, 0) / allItems.length)
          : 100
      };

      return { tables, hooks, components, apis, pages, summary };
    } catch (error) {
      console.error('Failed to fetch architecture data:', error);
      return {
        tables: [],
        hooks: [],
        components: [],
        apis: [],
        pages: [],
        summary: {
          totalItems: 0,
          healthyItems: 0,
          criticalItems: 0,
          warningItems: 0,
          averageHealth: 0
        }
      };
    }
  }

  static render(data: any): string {
    const { tables, hooks, components, apis, pages, summary } = data;

    return `
      <div style="padding: 20px;">
        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          ${this.renderSummaryCard('Total Items', summary.totalItems, '#6366f1')}
          ${this.renderSummaryCard('Healthy', summary.healthyItems, '#10b981')}
          ${this.renderSummaryCard('Critical', summary.criticalItems, '#ef4444')}
          ${this.renderSummaryCard('Warnings', summary.warningItems, '#f59e0b')}
          ${this.renderSummaryCard('Avg Health', summary.averageHealth + '%', this.getHealthColor(summary.averageHealth))}
        </div>

        <!-- Architecture Sections -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          ${this.renderSection('📊 Database Tables', tables, 'table')}
          ${this.renderSection('🪝 React Hooks', hooks, 'hook')}
          ${this.renderSection('🧩 Components', components, 'component')}
          ${this.renderSection('🔌 API Routes', apis, 'api')}
          ${this.renderSection('📄 Pages', pages, 'page')}
        </div>
      </div>
    `;
  }

  private static renderSummaryCard(label: string, value: string | number, color: string): string {
    return `
      <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; border: 1px solid #333;">
        <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
          ${label}
        </div>
        <div style="color: ${color}; font-size: 24px; font-weight: bold;">
          ${value}
        </div>
      </div>
    `;
  }

  private static renderSection(title: string, items: ArchitectureItem[], type: string): string {
    if (items.length === 0) {
      return `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
          <h3 style="color: #f8fafc; margin-bottom: 16px;">${title}</h3>
          <div style="color: #64748b; text-align: center; padding: 20px;">
            No ${type}s found in the project
          </div>
        </div>
      `;
    }

    // Sort items by health score (worst first)
    const sortedItems = [...items].sort((a, b) => a.healthScore - b.healthScore);

    return `
      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="color: #f8fafc;">${title}</h3>
          <span style="color: #64748b; font-size: 14px;">${items.length} items</span>
        </div>
        
        <div style="display: grid; gap: 8px;">
          ${sortedItems.slice(0, 10).map(item => this.renderItem(item)).join('')}
          ${items.length > 10 ? `
            <div style="color: #64748b; text-align: center; padding: 8px; font-size: 14px;">
              + ${items.length - 10} more items
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private static renderItem(item: ArchitectureItem): string {
    const healthColor = this.getHealthColor(item.healthScore);
    const hasIssues = item.errorCount > 0 || item.warningCount > 0;

    return `
      <div style="
        background: #0a0a0a; 
        padding: 12px; 
        border-radius: 6px; 
        border: 1px solid ${hasIssues ? '#333' : '#1a1a1a'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
      " 
      onmouseover="this.style.background='#1a1a1a'"
      onmouseout="this.style.background='#0a0a0a'"
      onclick="showItemDetails('${item.name}', '${item.type}')">
        
        <div style="flex: 1;">
          <div style="color: #f8fafc; font-weight: 500; margin-bottom: 4px;">
            ${item.name}
          </div>
          <div style="color: #64748b; font-size: 12px;">
            ${this.getRelativePath(item.file)}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.errorCount > 0 ? `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #ef4444; font-size: 12px;">⚠</span>
              <span style="color: #ef4444; font-size: 14px; font-weight: 500;">${item.errorCount}</span>
            </div>
          ` : ''}
          
          ${item.warningCount > 0 ? `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #f59e0b; font-size: 12px;">⚡</span>
              <span style="color: #f59e0b; font-size: 14px; font-weight: 500;">${item.warningCount}</span>
            </div>
          ` : ''}

          <div style="
            width: 60px;
            height: 28px;
            background: linear-gradient(90deg, 
              ${healthColor} 0%, 
              ${healthColor} ${item.healthScore}%, 
              #333 ${item.healthScore}%, 
              #333 100%
            );
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="color: white; font-size: 11px; font-weight: bold;">
              ${item.healthScore}%
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private static getHealthColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  private static getRelativePath(fullPath: string): string {
    const parts = fullPath.split('/');
    const srcIndex = parts.indexOf('src');
    if (srcIndex !== -1) {
      return parts.slice(srcIndex).join('/');
    }
    return parts.slice(-3).join('/');
  }
}