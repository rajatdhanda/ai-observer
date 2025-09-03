/**
 * Overview Component
 * Main dashboard view showing architecture overview and health metrics
 * Handles unified view, data flow, and quick actions
 */

class OverviewComponent {
  constructor(containerId) {
    this.element = document.getElementById(containerId);
    if (!this.element) throw new Error(`Container ${containerId} not found`);
    
    this.data = null;
    this.validationService = window.validationService;
    this.severityBadge = window.severityBadge;
  }

  async loadAndRender(showDataFlow = false) {
    try {
      // Load architecture data
      const response = await fetch('/api/architecture');
      this.data = await response.json();
      
      // Load validation data
      const validationResponse = await fetch('/api/validation-summary');
      const validationData = await validationResponse.json();
      
      this.render(showDataFlow, validationData);
      
    } catch (error) {
      console.error('Error loading overview:', error);
      this.renderError('Failed to load overview data');
    }
  }

  render(showDataFlow = false, validationData = null) {
    if (!this.data) {
      this.renderLoading();
      return;
    }

    const tables = this.data.tables || {};
    const hooks = this.data.hooks || {};
    const components = this.data.components || {};
    const pages = this.data.pages || {};
    
    this.element.innerHTML = `
      <div style="padding: 20px;">
        ${this.renderQuickActions()}
        
        ${validationData ? this.severityBadge.renderSeverityOverview(validationData) : ''}
        
        ${this.renderArchitectureOverview(tables, hooks, components, pages)}
        
        ${showDataFlow ? this.renderDataFlow(tables) : ''}
        
        ${this.renderQuickInsights(tables, hooks, components, pages, validationData)}
      </div>
    `;
  }

  renderQuickActions() {
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
          ⚡ Quick Actions
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <button 
            onclick="overviewComponent.runFullAnalysis()"
            style="
              background: #10b981;
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            🔍 Run Full Analysis
          </button>
          
          <button 
            onclick="overviewComponent.showDataFlow()"
            style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            📊 Show Data Flow
          </button>
          
          <button 
            onclick="overviewComponent.exportReport()"
            style="
              background: #6366f1;
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            📋 Export Report
          </button>
          
          <button 
            onclick="overviewComponent.validateAlignment()"
            style="
              background: #8b5cf6;
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            ✅ Validate Alignment
          </button>
        </div>
      </div>
    `;
  }

  renderArchitectureOverview(tables, hooks, components, pages) {
    const tableCount = Object.keys(tables).length;
    const hookCount = Object.keys(hooks).length;
    const componentCount = Object.keys(components).length;
    const pageCount = Object.keys(pages).length;
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
          🏗️ Architecture Overview
        </h3>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
          ${this.renderArchitectureCard('Tables', tableCount, '#10b981', '🗃️', 'tables')}
          ${this.renderArchitectureCard('Hooks', hookCount, '#3b82f6', '🪝', 'hooks')}
          ${this.renderArchitectureCard('Components', componentCount, '#f59e0b', '🧩', 'components')}
          ${this.renderArchitectureCard('Pages', pageCount, '#8b5cf6', '📄', 'pages')}
        </div>
        
        ${this.renderHealthSummary(tables, hooks, components, pages)}
      </div>
    `;
  }

  renderArchitectureCard(title, count, color, icon, type) {
    return `
      <div 
        onclick="overviewComponent.showArchitectureDetails('${type}')"
        style="
          background: ${color}10;
          border: 1px solid ${color}30;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        "
        onmouseover="this.style.background='${color}15'"
        onmouseout="this.style.background='${color}10'"
      >
        <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
        <div style="color: ${color}; font-size: 28px; font-weight: bold; margin-bottom: 4px;">
          ${count}
        </div>
        <div style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${title}
        </div>
      </div>
    `;
  }

  renderHealthSummary(tables, hooks, components, pages) {
    let totalScore = 0;
    let totalItems = 0;
    
    // Calculate average health across all entities
    Object.values(tables).forEach(table => {
      const score = this.calculateTableHealth(table);
      totalScore += score;
      totalItems++;
    });
    
    Object.values(hooks).forEach(hook => {
      const score = this.calculateHookHealth(hook);
      totalScore += score;
      totalItems++;
    });
    
    const averageHealth = totalItems > 0 ? Math.round(totalScore / totalItems) : 0;
    
    return `
      <div style="
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      ">
        <h4 style="color: #f8fafc; margin: 0 0 12px 0;">Overall Architecture Health</h4>
        ${this.severityBadge.renderHealthScore(averageHealth, 60)}
      </div>
    `;
  }

  renderDataFlow(tables) {
    const relationships = this.extractDataFlowRelationships(tables);
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
          📊 Data Flow Analysis
        </h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          ${relationships.map(rel => this.renderDataFlowConnection(rel)).join('')}
        </div>
      </div>
    `;
  }

  renderDataFlowConnection(relationship) {
    return `
      <div style="
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #10b981; font-weight: 500;">${relationship.from}</span>
          <span style="color: #64748b;">→</span>
          <span style="color: #3b82f6; font-weight: 500;">${relationship.to}</span>
        </div>
        <div style="color: #9ca3af; font-size: 12px;">
          ${relationship.type} • ${relationship.strength}
        </div>
      </div>
    `;
  }

  renderQuickInsights(tables, hooks, components, pages, validationData) {
    const insights = this.generateInsights(tables, hooks, components, pages, validationData);
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
          💡 Quick Insights
        </h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
          ${insights.map(insight => this.renderInsightCard(insight)).join('')}
        </div>
      </div>
    `;
  }

  renderInsightCard(insight) {
    const colorMap = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
    
    const color = colorMap[insight.type] || colorMap.info;
    
    return `
      <div style="
        background: ${color}10;
        border: 1px solid ${color}30;
        border-left: 4px solid ${color};
        border-radius: 8px;
        padding: 16px;
      ">
        <div style="color: ${color}; font-weight: 500; margin-bottom: 8px;">
          ${insight.title}
        </div>
        <div style="color: #9ca3af; font-size: 14px; line-height: 1.4;">
          ${insight.description}
        </div>
        ${insight.action ? `
          <button 
            onclick="${insight.action}"
            style="
              background: ${color};
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 12px;
              margin-top: 8px;
              cursor: pointer;
            "
          >
            ${insight.actionText || 'Fix'}
          </button>
        ` : ''}
      </div>
    `;
  }

  // Helper methods
  calculateTableHealth(table) {
    let score = 100;
    if (!table.typeDefinition) score -= 20;
    if (!table.hooks || table.hooks.length === 0) score -= 15;
    if (!table.components || table.components.length === 0) score -= 15;
    if (!table.properties || table.properties.length === 0) score -= 10;
    return Math.max(0, score);
  }

  calculateHookHealth(hook) {
    let score = 100;
    if (!hook.hasErrorHandling) score -= 20;
    if (!hook.hasLoadingState) score -= 15;
    if (!hook.hasCacheInvalidation) score -= 10;
    return Math.max(0, score);
  }

  extractDataFlowRelationships(tables) {
    const relationships = [];
    
    Object.entries(tables).forEach(([tableName, table]) => {
      if (table.relationships) {
        table.relationships.forEach(rel => {
          relationships.push({
            from: tableName,
            to: rel.table,
            type: rel.type || 'Reference',
            strength: rel.required ? 'Strong' : 'Weak'
          });
        });
      }
    });
    
    return relationships;
  }

  generateInsights(tables, hooks, components, pages, validationData) {
    const insights = [];
    
    // Check for orphaned tables
    const orphanedTables = Object.entries(tables).filter(([name, table]) => 
      (!table.hooks || table.hooks.length === 0) && 
      (!table.components || table.components.length === 0)
    );
    
    if (orphanedTables.length > 0) {
      insights.push({
        type: 'warning',
        title: `${orphanedTables.length} Unused Tables`,
        description: 'Tables without hooks or components may be unused',
        action: 'overviewComponent.showUnusedTables()',
        actionText: 'Review'
      });
    }
    
    // Check for hooks without error handling
    const unsafeHooks = Object.entries(hooks).filter(([name, hook]) => 
      !hook.hasErrorHandling
    );
    
    if (unsafeHooks.length > 0) {
      insights.push({
        type: 'error',
        title: `${unsafeHooks.length} Unsafe Hooks`,
        description: 'Hooks without error handling can crash the app',
        action: 'overviewComponent.showUnsafeHooks()',
        actionText: 'Fix'
      });
    }
    
    // Check validation issues
    if (validationData) {
      const { criticalCount, warningCount } = this.severityBadge.countBySeverity(validationData);
      
      if (criticalCount > 0) {
        insights.push({
          type: 'error',
          title: `${criticalCount} Critical Issues`,
          description: 'Critical issues will break your code in production',
          action: 'overviewComponent.showCriticalIssues()',
          actionText: 'Fix Now'
        });
      }
    }
    
    // Positive insights
    const healthyTables = Object.entries(tables).filter(([name, table]) => 
      this.calculateTableHealth(table) >= 80
    );
    
    if (healthyTables.length > 0) {
      insights.push({
        type: 'success',
        title: `${healthyTables.length} Healthy Tables`,
        description: 'These tables have good architecture and validation coverage',
      });
    }
    
    return insights;
  }

  // Action methods
  async runFullAnalysis() {
    if (window.controlBar) {
      window.controlBar.triggerRun();
    } else {
      await fetch('/api/validate');
      this.loadAndRender();
    }
  }

  showDataFlow() {
    this.render(true);
  }

  async exportReport() {
    try {
      const response = await fetch('/api/export-report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'architecture-report.json';
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  async validateAlignment() {
    try {
      await fetch('/api/validate-alignment');
      this.loadAndRender();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }

  showArchitectureDetails(type) {
    // Navigate to specific architecture section
    if (window.sidebarNavigatorInstance) {
      const firstItem = document.querySelector(`[data-type="${type}"]`);
      if (firstItem) firstItem.click();
    }
  }

  // Error and loading states
  renderLoading() {
    this.element.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
        color: #9ca3af;
      ">
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 16px;">⟳</div>
          <div>Loading overview...</div>
        </div>
      </div>
    `;
  }

  renderError(message) {
    this.element.innerHTML = `
      <div style="
        background: #ef444410;
        border: 1px solid #ef444430;
        border-radius: 8px;
        padding: 20px;
        color: #ef4444;
        text-align: center;
      ">
        <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
        <div>${message}</div>
        <button 
          onclick="overviewComponent.loadAndRender()"
          style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-top: 12px;
            cursor: pointer;
          "
        >
          Retry
        </button>
      </div>
    `;
  }
}

// Export for global use
window.OverviewComponent = OverviewComponent;