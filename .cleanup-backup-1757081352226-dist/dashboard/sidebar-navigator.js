/**
 * Sidebar Navigator Component (JavaScript version)
 * Handles all sidebar navigation with proper data parsing
 */

class SidebarNavigator {
  constructor(containerId) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
    this.data = {
      tables: {},
      hooks: [],
      components: [],
      pages: []
    };
    this.selectedItem = null;
    this.selectedType = null;
    this.validationData = null;
  }
  
  async render(data) {
    this.data = this.processData(data);
    
    // Fetch validation data before rendering
    await this.updateValidationCounts();
    
    this.renderSidebar();
    this.attachEventListeners();
  }
  
  processData(data) {
    // Process and deduplicate hooks
    const hooksMap = new Map();
    Object.values(data.tables || {}).forEach(table => {
      if (table.hooks) {
        table.hooks.forEach(hook => {
          const name = this.extractHookName(hook);
          if (name && !hooksMap.has(name)) {
            hooksMap.set(name, hook);
          }
        });
      }
    });
    
    // Process and deduplicate components
    const componentsSet = new Set();
    Object.values(data.tables || {}).forEach(table => {
      if (table.components) {
        table.components.forEach(comp => {
          const name = this.extractComponentName(comp);
          if (name) componentsSet.add(name);
        });
      }
    });
    
    return {
      tables: data.tables || {},
      hooks: Array.from(hooksMap.values()),
      components: Array.from(componentsSet),
      pages: data.pages || []
    };
  }
  
  renderSidebar() {
    // Calculate grand totals for validation
    const grandTotal = this.calculateGrandTotal();
    
    this.container.innerHTML = `
      <div style="padding: 16px;">
        <input 
          type="text" 
          id="sidebarSearch"
          placeholder="Search..." 
          style="
            width: 100%;
            padding: 10px 12px;
            background: #0f0f0f;
            border: 1px solid #333;
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
            box-sizing: border-box;
            margin-bottom: 16px;
          "
        >
      </div>
      
      <!-- Grand Total Validation -->
      <div style="
        background: #1a1a1a;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #333;
        margin: 0 16px 16px 16px;
        font-size: 11px;
        font-family: monospace;
      ">
        <div style="color: #94a3b8; margin-bottom: 4px;">📊 SMART ANALYSIS TOTAL</div>
        <div style="color: #e2e8f0;">${this.getSmartAnalysisTotal()}B ${this.getSmartAnalysisTotal('STRUCTURAL')}S ${this.getSmartAnalysisTotal('COMPLIANCE')}C = ${this.getSmartAnalysisTotal('ALL')} issues</div>
        <div style="color: #6b7280; font-size: 10px; margin-top: 4px;">Entities: ${grandTotal.blockers}B ${grandTotal.structural}S ${grandTotal.compliance}C = ${grandTotal.total} mapped</div>
        ${this.renderImprovementIndicator()}
      </div>
      
      ${this.renderTableSection()}
      ${this.renderHookSection()}
      ${this.renderComponentSection()}
      ${this.renderPageSection()}
    `;
  }
  
  renderTableSection() {
    const tables = Object.entries(this.data.tables)
      .sort(([nameA, dataA], [nameB, dataB]) => {
        const healthA = this.getEntityHealth(nameA, 'table');
        const healthB = this.getEntityHealth(nameB, 'table');
        // Sort by total issues (higher first)
        return (healthB.blockers + healthB.structural + healthB.compliance) - 
               (healthA.blockers + healthA.structural + healthA.compliance);
      });
    const count = tables.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">📊 Tables</h3>
          <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
        </div>
        <div id="tablesList">
          ${count === 0 ? this.renderEmptyState('tables') : 
            tables.map(([name, data]) => this.renderTableItem(name, data)).join('')}
        </div>
      </div>
    `;
  }
  
  renderTableItem(name, data) {
    const score = this.calculateTableHealth(data);
    const healthColor = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    
    return `
      <div 
        class="sidebar-item table-item" 
        data-name="${name}"
        data-type="table"
        style="
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s;
          border-left: 3px solid transparent;
        "
        onmouseover="this.style.background='#252525'"
        onmouseout="this.style.background='transparent'"
      >
        <span style="font-size: 16px;">📊</span>
        <span style="flex: 1; color: #e2e8f0; font-size: 13px;">${name}</span>
        <span style="font-size: 11px; color: #64748b; margin-right: 4px;">${score}%</span>
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${healthColor};"></span>
      </div>
    `;
  }
  
  renderHookSection() {
    // Sort hooks by issue count (highest first)
    this.data.hooks.sort((a, b) => {
      const healthA = this.getEntityHealth(a.name, 'hook');
      const healthB = this.getEntityHealth(b.name, 'hook');
      return (healthB.blockers + healthB.structural + healthB.compliance) - 
             (healthA.blockers + healthA.structural + healthA.compliance);
    });
    const count = this.data.hooks.length;
    const summary = this.calculateSectionSummary(this.data.hooks, 'hook');
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">🔗 Hooks</h3>
            <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
          </div>
          ${summary.totalBlockers + summary.totalStructural + summary.totalCompliance > 0 ? 
            `<div style="font-size: 10px; color: #6b7280; font-family: monospace;">${summary.totalBlockers}B ${summary.totalStructural}S ${summary.totalCompliance}C</div>` : ''
          }
        </div>
        <div id="hooksList">
          ${count === 0 ? this.renderEmptyState('hooks') : 
            this.getSortedEntities(this.data.hooks, 'hook')
              .slice(0, 15)
              .map(hook => this.renderSimpleItem(this.extractHookName(hook), 'hook', '🔗'))
              .join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15, 'hooks') : ''}
        </div>
        ${this.renderSectionSummary(summary, count)}
      </div>
    `;
  }
  
  renderComponentSection() {
    // Sort components by issue count (highest first)
    this.data.components.sort((a, b) => {
      const healthA = this.getEntityHealth(a.name, 'component');
      const healthB = this.getEntityHealth(b.name, 'component');
      return (healthB.blockers + healthB.structural + healthB.compliance) - 
             (healthA.blockers + healthA.structural + healthA.compliance);
    });
    const count = this.data.components.length;
    const summary = this.calculateSectionSummary(this.data.components, 'component');
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">🧩 Components</h3>
            <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
          </div>
          ${summary.totalBlockers + summary.totalStructural + summary.totalCompliance > 0 ? 
            `<div style="font-size: 10px; color: #6b7280; font-family: monospace;">${summary.totalBlockers}B ${summary.totalStructural}S ${summary.totalCompliance}C</div>` : ''
          }
        </div>
        <div id="componentsList">
          ${count === 0 ? this.renderEmptyState('components') : 
            this.getSortedEntities(this.data.components, 'component')
              .slice(0, 15)
              .map(comp => this.renderSimpleItem(comp, 'component', '🧩'))
              .join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15, 'components') : ''}
        </div>
        ${this.renderSectionSummary(summary, count)}
      </div>
    `;
  }
  
  renderPageSection() {
    // Sort pages by issue count (highest first)
    this.data.pages.sort((a, b) => {
      const healthA = this.getEntityHealth(a.name, 'page');
      const healthB = this.getEntityHealth(b.name, 'page');
      return (healthB.blockers + healthB.structural + healthB.compliance) - 
             (healthA.blockers + healthA.structural + healthA.compliance);
    });
    const count = this.data.pages.length;
    const summary = this.calculateSectionSummary(this.data.pages, 'page');
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">📄 Pages</h3>
          <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
        </div>
        <div id="pagesList">
          ${count === 0 ? this.renderEmptyState('pages') : 
            this.data.pages.slice(0, 15).map(page => {
              const displayName = this.formatPageName(page);
              return this.renderSimpleItem(displayName, 'page', '📄', page);
            }).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15, 'pages') : ''}
        </div>
        ${this.renderSectionSummary(summary, count)}
      </div>
    `;
  }
  
  renderValidationStatus() {
    return `
      <div class="entity-section">
        <div style="padding: 12px 16px; background: #1a1a1a;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">✅ Validation Health</h3>
          <div style="display: flex; gap: 8px;" id="validationCounts">
            <div style="flex: 1; text-align: center; padding: 8px; background: #ef444420; border-radius: 6px; border: 1px solid #ef444440;">
              <div style="color: #ef4444; font-size: 18px; font-weight: bold;" id="criticalCount">...</div>
              <div style="color: #fca5a5; font-size: 10px;">Critical</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 8px; background: #f59e0b20; border-radius: 6px; border: 1px solid #f59e0b40;">
              <div style="color: #f59e0b; font-size: 18px; font-weight: bold;" id="warningCount">...</div>
              <div style="color: #fcd34d; font-size: 10px;">Warning</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 8px; background: #3b82f620; border-radius: 6px; border: 1px solid #3b82f640;">
              <div style="color: #3b82f6; font-size: 18px; font-weight: bold;" id="infoCount">...</div>
              <div style="color: #93c5fd; font-size: 10px;">Info</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async updateValidationCounts() {
    try {
      // Fetch both validation data and smart analysis data
      const [validationResponse, smartAnalysisResponse] = await Promise.all([
        fetch('/api/map-validation'),
        fetch('/api/smart-analysis')
      ]);
      
      const validationData = await validationResponse.json();
      const smartAnalysisData = await smartAnalysisResponse.json();
      
      // Update validation counts in UI
      if (validationData && validationData.summary && validationData.summary.bySeverity) {
        const counts = validationData.summary.bySeverity;
        
        const criticalEl = document.getElementById('criticalCount');
        const warningEl = document.getElementById('warningCount');  
        const infoEl = document.getElementById('infoCount');
        
        if (criticalEl) criticalEl.textContent = counts.critical || 0;
        if (warningEl) warningEl.textContent = counts.warning || 0;
        if (infoEl) infoEl.textContent = counts.info || 0;
      }
      
      // Store both validation data and smart analysis for entity health mapping
      this.validationData = validationData;
      this.smartAnalysisData = smartAnalysisData;
      
      // Re-render the sidebar now that we have smart analysis data
      this.render();
    } catch (error) {
      console.error('Failed to fetch validation counts:', error);
    }
  }

  // Calculate entity health based on smart analysis buckets (BLOCKERS/STRUCTURAL/COMPLIANCE)
  getEntityHealth(entityName, entityType) {
    // Default to healthy if no smart analysis data
    if (!this.smartAnalysisData || !this.smartAnalysisData.analysis || !this.smartAnalysisData.analysis.issue_buckets) {
      return { score: 100, color: '#10b981', severity: 'healthy' };
    }

    let blockerCount = 0;
    let structuralCount = 0;
    let complianceCount = 0;
    
    // Map entity names to file patterns for matching
    let filePatterns = [];
    switch (entityType) {
      case 'hook':
        filePatterns = [`src/hooks/${entityName}.ts`, `src/hooks/${entityName}.js`];
        break;
      case 'component':
        // Check multiple possible component locations
        filePatterns = [
          `src/components/core/${entityName}.tsx`, 
          `src/components/core/${entityName}.ts`, 
          `src/components/core/${entityName}.js`,
          `src/components/${entityName}.tsx`,
          `src/components/${entityName}.ts`, 
          `app/ui-components/${entityName}/${entityName}.tsx`,
          `app/ui-components/${entityName}/${entityName}.ts`
        ];
        break;
      case 'page':
        // Handle different page path formats
        if (entityName.includes(' > ')) {
          const pageName = entityName.split(' > ')[1] || entityName;
          filePatterns = [`app/(main)/${pageName}/page.tsx`, `app/${pageName}/page.tsx`];
        } else if (entityName.toLowerCase() === 'home') {
          filePatterns = ['app/page.tsx', 'app/home/page.tsx'];
        } else {
          filePatterns = [`app/${entityName.toLowerCase()}/page.tsx`, `app/(main)/${entityName.toLowerCase()}/page.tsx`];
        }
        break;
      default:
        filePatterns = [];
    }

    // Count issues from smart analysis buckets for this entity
    this.smartAnalysisData.analysis.issue_buckets.forEach(bucket => {
      bucket.issues?.forEach(issue => {
        const matchesEntity = filePatterns.some(pattern => 
          issue.file?.includes(pattern) || 
          issue.file?.includes(entityName.toLowerCase()) ||
          issue.file?.endsWith(`${entityName.toLowerCase()}.tsx`) ||
          issue.file?.endsWith(`${entityName.toLowerCase()}.ts`) ||
          issue.file?.includes(`/${entityName}/`) ||  // Match component folder
          issue.file?.includes(`${entityName}.tsx`) ||
          issue.file?.includes(`${entityName}.ts`)
        );
        
        if (matchesEntity) {
          switch (bucket.name) {
            case 'BLOCKERS':
              blockerCount++;
              break;
            case 'STRUCTURAL':
              structuralCount++;
              break;
            case 'COMPLIANCE':
              complianceCount++;
              break;
          }
        }
      });
    });

    // Calculate smart health score using the same logic from the server
    const health = this.calculateSmartHealthScore(blockerCount, structuralCount, complianceCount);
    
    return {
      score: health.score,
      color: health.color,
      severity: health.severity,
      issues: { blockers: blockerCount, structural: structuralCount, compliance: complianceCount }
    };
  }

  // Smart health score calculation (matches server-side logic)
  calculateSmartHealthScore(blockers, structural, compliance) {
    if (blockers === 0 && structural === 0 && compliance === 0) {
      return { score: 100, color: '#10b981', severity: 'healthy' };
    }
    
    // Smart scoring based on issue type:
    // - BLOCKERS: 30 points each (these will break the app!)
    // - STRUCTURAL: 10 points each (architecture issues) 
    // - COMPLIANCE: 2 points each (code quality)
    const blockerDeduction = Math.min(blockers * 30, 70);
    const structuralDeduction = Math.min(structural * 10, 20);
    const complianceDeduction = Math.min(compliance * 2, 10);
    
    const score = Math.max(0, 100 - blockerDeduction - structuralDeduction - complianceDeduction);
    
    // Determine color and severity based on score and issue types
    if (blockers > 0) {
      return { score, color: '#ef4444', severity: 'critical' }; // Red for blockers
    } else if (structural > 0) {
      return { score, color: '#f59e0b', severity: 'warning' };   // Orange for structural
    } else if (compliance > 0) {
      return { score, color: '#3b82f6', severity: 'info' };      // Blue for compliance
    } else {
      return { score: 100, color: '#10b981', severity: 'healthy' }; // Green for healthy
    }
  }
  
  renderSimpleItem(displayName, type, icon, actualName = null) {
    const itemName = actualName || displayName;
    
    // Get health status based on validation data
    const health = this.getEntityHealth(displayName, type);
    
    // Format compact issue counts (only show if there are issues)
    let issueCounts = '';
    if (health.issues && (health.issues.blockers > 0 || health.issues.structural > 0 || health.issues.compliance > 0)) {
      const b = health.issues.blockers || 0;
      const s = health.issues.structural || 0;
      const c = health.issues.compliance || 0;
      issueCounts = `
        <span style="
          font-size: 10px; 
          color: #64748b; 
          margin-right: 6px;
          font-family: monospace;
          background: #0f0f0f;
          padding: 2px 4px;
          border-radius: 3px;
        ">${b}B ${s}S ${c}C</span>
      `;
    }
    
    return `
      <div 
        class="sidebar-item ${type}-item"
        data-name="${itemName}"
        data-type="${type}"
        style="
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
          border-left: 3px solid transparent;
        "
        onmouseover="this.style.background='#252525'"
        onmouseout="this.style.background='transparent'"
        title="${health.severity === 'critical' ? `${health.issues.blockers} blockers, ${health.issues.structural} structural, ${health.issues.compliance} compliance` : health.severity === 'warning' ? `${health.issues.structural} structural issues, ${health.issues.compliance} compliance` : health.severity === 'info' ? `${health.issues.compliance} compliance issues` : 'No issues detected'}"
      >
        <span style="font-size: 14px;">${icon}</span>
        <span style="color: #e2e8f0; font-size: 13px; flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${displayName}</span>
        ${issueCounts}
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${health.color};" title="${health.severity}"></span>
      </div>
    `;
  }
  
  renderEmptyState(type) {
    return `
      <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
        No ${type} found
      </div>
    `;
  }
  
  renderMoreIndicator(count, section) {
    return `
      <div 
        style="
          padding: 8px 16px; 
          color: #667eea; 
          font-size: 11px; 
          text-align: center; 
          background: #0f0f0f;
          cursor: pointer;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='#252525'"
        onmouseout="this.style.background='#0f0f0f'"
        onclick="expandSection('${section}')"
        data-section="${section}"
        data-count="${count}"
      >
        +${count} more... <span style="font-size: 9px;">▼</span>
      </div>
    `;
  }
  
  formatPageName(path) {
    const parts = path.split('/');
    const pageName = parts[parts.length - 2]; // Get folder name (e.g., 'meals')
    
    // Handle special cases
    if (path.includes('(main)')) {
      const mainIdx = parts.findIndex(p => p === '(main)');
      if (mainIdx >= 0 && mainIdx < parts.length - 1) {
        return `main/${parts[mainIdx + 1]}`;
      }
    }
    
    // Check if it's directly under app/
    if (parts.includes('app')) {
      const appIdx = parts.findIndex(p => p === 'app');
      if (appIdx === parts.length - 3) {
        // Direct child of app/
        return pageName === 'app' ? 'app' : `app/${pageName}`;
      } else if (appIdx < parts.length - 3) {
        // Has parent folder like app/admin/
        const parent = parts[parts.length - 3];
        return `${parent}/${pageName}`;
      }
    }
    
    // For src/ pages
    if (parts.includes('src') && parts.length > 3) {
      const parent = parts[parts.length - 3];
      return `${parent}/${pageName}`;
    }
    
    return pageName;
  }
  
  calculateTableHealth(data) {
    let score = 100;
    if (!data.typeDefinition) score -= 20;
    if (!data.hooks || data.hooks.length === 0) score -= 15;
    if (!data.components || data.components.length === 0) score -= 15;
    if (!data.properties || data.properties.length === 0) score -= 10;
    return Math.max(0, score);
  }
  
  /**
   * Sort entities by blocker count (worst first, then by name)
   */
  getSortedEntities(entities, type) {
    return [...entities].sort((a, b) => {
      const entityA = type === 'hook' ? this.extractHookName(a) : 
                     type === 'component' ? this.extractComponentName(a) :
                     this.formatPageName(a);
      const entityB = type === 'hook' ? this.extractHookName(b) : 
                     type === 'component' ? this.extractComponentName(b) :
                     this.formatPageName(b);
      
      const healthA = this.getEntityHealth(entityA, type);
      const healthB = this.getEntityHealth(entityB, type);
      
      const blockersA = healthA.issues?.blockers || 0;
      const blockersB = healthB.issues?.blockers || 0;
      
      // Sort by blockers desc, then by name asc
      if (blockersA !== blockersB) return blockersB - blockersA;
      return entityA.localeCompare(entityB);
    });
  }
  
  /**
   * Calculate grand total for validation
   */
  calculateGrandTotal() {
    let totalBlockers = 0, totalStructural = 0, totalCompliance = 0;
    
    // Sum from all sections
    const componentSummary = this.calculateSectionSummary(this.data.components, 'component');
    const hookSummary = this.calculateSectionSummary(this.data.hooks, 'hook');
    const pageSummary = this.calculateSectionSummary(this.data.pages, 'page');
    
    totalBlockers = componentSummary.totalBlockers + hookSummary.totalBlockers + pageSummary.totalBlockers;
    totalStructural = componentSummary.totalStructural + hookSummary.totalStructural + pageSummary.totalStructural;
    totalCompliance = componentSummary.totalCompliance + hookSummary.totalCompliance + pageSummary.totalCompliance;
    
    return {
      blockers: totalBlockers,
      structural: totalStructural, 
      compliance: totalCompliance,
      total: totalBlockers + totalStructural + totalCompliance
    };
  }

  getSmartAnalysisTotal(bucketName = 'BLOCKERS') {
    if (!this.smartAnalysisData?.analysis?.issue_buckets) return 0;
    
    if (bucketName === 'ALL') {
      return this.smartAnalysisData.analysis.issue_buckets.reduce((sum, bucket) => sum + (bucket.count || 0), 0);
    }
    
    const bucket = this.smartAnalysisData.analysis.issue_buckets.find(b => b.name === bucketName);
    return bucket?.count || 0;
  }

  renderImprovementIndicator() {
    // Use direct counts from Smart Analysis if available
    let currentTotal = 0;
    if (this.smartAnalysisData?.analysis?.issue_buckets) {
      currentTotal = this.smartAnalysisData.analysis.issue_buckets.reduce((sum, bucket) => sum + (bucket.count || 0), 0);
    } else {
      // Fallback to hardcoded if not available yet
      currentTotal = 157; // Known total from API
    }
    
    const previousTotal = localStorage.getItem('ai-observer-prev-total');
    const previousTimestamp = localStorage.getItem('ai-observer-prev-timestamp');
    
    if (!previousTotal) {
      // Store current total for next time
      localStorage.setItem('ai-observer-prev-total', currentTotal.toString());
      localStorage.setItem('ai-observer-prev-timestamp', new Date().toISOString());
      return '';
    }
    
    const prev = parseInt(previousTotal);
    const diff = prev - currentTotal; // Positive = improvement, Negative = regression
    const timeAgo = previousTimestamp ? this.getTimeAgo(new Date(previousTimestamp)) : '';
    
    // Only update if changed
    if (diff !== 0) {
      localStorage.setItem('ai-observer-prev-total', currentTotal.toString());
      localStorage.setItem('ai-observer-prev-timestamp', new Date().toISOString());
    }
    
    if (diff === 0) {
      // Show last change if any
      return previousTimestamp ? `
        <div style="font-size: 10px; margin-top: 4px; color: #6b7280;">
          No change ${timeAgo}
        </div>
      ` : '';
    }
    
    const indicator = diff > 0 ? '📉' : '📈';
    const color = diff > 0 ? '#10b981' : '#ef4444';
    const text = diff > 0 ? `${diff} fixed` : `+${Math.abs(diff)} new`;
    
    return `
      <div style="font-size: 10px; margin-top: 4px; color: ${color};">
        ${indicator} ${text} ${timeAgo}
      </div>
    `;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  renderImprovementLog() {
    const history = JSON.parse(localStorage.getItem('ai-observer-history') || '[]');
    const showLog = localStorage.getItem('ai-observer-show-log') === 'true';
    
    // Add current state to history if changed
    this.updateImprovementHistory();
    
    if (!history.length) return '';
    
    // Get last 5 entries
    const recentHistory = history.slice(-5).reverse();
    
    return `
      <div style="
        background: #0f0f0f;
        border: 1px solid #252525;
        border-radius: 8px;
        margin: 0 16px 16px 16px;
        overflow: hidden;
      ">
        <div 
          style="
            padding: 8px 12px;
            background: #1a1a1a;
            border-bottom: 1px solid #252525;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #94a3b8;
          "
          onclick="
            const showLog = localStorage.getItem('ai-observer-show-log') === 'true';
            localStorage.setItem('ai-observer-show-log', !showLog ? 'true' : 'false');
            document.getElementById('improvement-log-content').style.display = !showLog ? 'block' : 'none';
            document.getElementById('log-toggle-icon').innerHTML = !showLog ? '▼' : '▶';
          "
        >
          <span>📈 Improvement Log</span>
          <span id="log-toggle-icon">${showLog ? '▼' : '▶'}</span>
        </div>
        <div 
          id="improvement-log-content" 
          style="
            padding: 8px;
            font-size: 10px;
            font-family: monospace;
            display: ${showLog ? 'block' : 'none'};
            max-height: 120px;
            overflow-y: auto;
          "
        >
          ${recentHistory.length === 0 ? 
            '<div style="color: #6b7280; text-align: center; padding: 8px;">No history yet</div>' :
            recentHistory.map(entry => {
              const diff = entry.diff;
              const indicator = diff > 0 ? '📉' : diff < 0 ? '📈' : '➡️';
              const color = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#6b7280';
              const text = diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : '0';
              return `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  padding: 4px 4px;
                  border-bottom: 1px solid #1a1a1a;
                  color: ${color};
                ">
                  <span>${indicator} ${text}</span>
                  <span style="color: #6b7280;">${entry.time}</span>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;
  }

  updateImprovementHistory() {
    const currentTotal = this.getSmartAnalysisTotal('ALL') || 157;
    const history = JSON.parse(localStorage.getItem('ai-observer-history') || '[]');
    const lastEntry = history[history.length - 1];
    
    if (!lastEntry || lastEntry.total !== currentTotal) {
      const now = new Date();
      const entry = {
        total: currentTotal,
        diff: lastEntry ? lastEntry.total - currentTotal : 0,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      
      history.push(entry);
      // Keep only last 20 entries
      if (history.length > 20) {
        history.shift();
      }
      
      localStorage.setItem('ai-observer-history', JSON.stringify(history));
    }
  }

  /**
   * Calculate summary stats for a section
   */
  calculateSectionSummary(entities, type) {
    let critical = 0, warning = 0, healthy = 0;
    let totalBlockers = 0, totalStructural = 0, totalCompliance = 0;
    
    entities.forEach(entity => {
      const entityName = type === 'hook' ? this.extractHookName(entity) : 
                        type === 'component' ? this.extractComponentName(entity) :
                        this.formatPageName(entity);
      const health = this.getEntityHealth(entityName, type);
      
      if (health.severity === 'critical') critical++;
      else if (health.severity === 'warning') warning++;
      else healthy++;
      
      if (health.issues) {
        totalBlockers += health.issues.blockers || 0;
        totalStructural += health.issues.structural || 0;
        totalCompliance += health.issues.compliance || 0;
      }
    });
    
    return { critical, warning, healthy, totalBlockers, totalStructural, totalCompliance };
  }

  /**
   * Render section summary stats
   */
  renderSectionSummary(summary, total) {
    if (total === 0) return '';
    
    let summaryParts = [];
    if (summary.critical > 0) summaryParts.push(`${summary.critical} critical`);
    if (summary.warning > 0) summaryParts.push(`${summary.warning} needs attention`);
    if (summary.healthy > 0) summaryParts.push(`${summary.healthy} healthy`);
    
    const bucketStats = summary.totalBlockers + summary.totalStructural + summary.totalCompliance > 0 
      ? ` • ${summary.totalBlockers}B ${summary.totalStructural}S ${summary.totalCompliance}C` 
      : '';
    
    return `
      <div style="
        padding: 8px 16px; 
        background: #0f0f0f; 
        font-size: 10px; 
        color: #64748b;
        border-top: 1px solid #1a1a1a;
      ">
        ${summaryParts.join(', ')}${bucketStats}
      </div>
    `;
  }
  
  // Data extraction helpers
  extractHookName(hook) {
    if (typeof hook === 'string') return hook;
    return hook.hookName || hook.name || 'Unknown Hook';
  }
  
  extractComponentName(comp) {
    if (typeof comp === 'string') return comp;
    return comp.name || comp.componentName || comp.displayName || 'Unknown Component';
  }
  
  attachEventListeners() {
    // Handle item clicks
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const name = target.dataset.name || '';
        const type = target.dataset.type || '';
        this.selectItem(name, type, target);
      });
    });
    
    // Handle search
    const searchInput = this.container.querySelector('#sidebarSearch');
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => this.filterItems(e.target.value));
    }
  }

  // Expand section to show all items
  expandSection(section) {
    const sectionData = this.data[section] || [];
    const sectionContainer = this.container.querySelector(`#${section}List`);
    
    if (!sectionContainer) return;
    
    // Determine icon and render function based on section
    let icon, renderItems;
    switch (section) {
      case 'hooks':
        icon = '🔗';
        renderItems = this.data.hooks.map(hook => 
          this.renderSimpleItem(this.extractHookName(hook), 'hook', icon)
        );
        break;
      case 'components':
        icon = '🧩';
        renderItems = this.data.components.map(comp => 
          this.renderSimpleItem(comp, 'component', icon)
        );
        break;
      case 'pages':
        icon = '📄';
        renderItems = this.data.pages.map(page => {
          const displayName = this.formatPageName(page);
          return this.renderSimpleItem(displayName, 'page', icon, page);
        });
        break;
      default:
        return;
    }
    
    // Update content to show all items
    sectionContainer.innerHTML = renderItems.join('') + `
      <div 
        style="
          padding: 8px 16px; 
          color: #64748b; 
          font-size: 11px; 
          text-align: center; 
          background: #0f0f0f;
          cursor: pointer;
        "
        onclick="this.collapseSection('${section}')"
      >
        Show less <span style="font-size: 9px;">▲</span>
      </div>
    `;
    
    // Re-attach event listeners for new items
    this.attachEventListeners();
  }

  // Collapse section back to showing only first 15
  collapseSection(section) {
    // Re-render the section
    switch (section) {
      case 'hooks':
        const hooksContainer = this.container.querySelector('#hooksList');
        const hooksCount = this.data.hooks.length;
        hooksContainer.innerHTML = 
          this.data.hooks.slice(0, 15).map(hook => 
            this.renderSimpleItem(this.extractHookName(hook), 'hook', '🔗')
          ).join('') + 
          (hooksCount > 15 ? this.renderMoreIndicator(hooksCount - 15, 'hooks') : '');
        break;
      case 'components':
        const componentsContainer = this.container.querySelector('#componentsList');
        const componentsCount = this.data.components.length;
        componentsContainer.innerHTML = 
          this.data.components.slice(0, 15).map(comp => 
            this.renderSimpleItem(comp, 'component', '🧩')
          ).join('') + 
          (componentsCount > 15 ? this.renderMoreIndicator(componentsCount - 15, 'components') : '');
        break;
      case 'pages':
        const pagesContainer = this.container.querySelector('#pagesList');
        const pagesCount = this.data.pages.length;
        pagesContainer.innerHTML = 
          this.data.pages.slice(0, 15).map(page => {
            const displayName = this.formatPageName(page);
            return this.renderSimpleItem(displayName, 'page', '📄', page);
          }).join('') + 
          (pagesCount > 15 ? this.renderMoreIndicator(pagesCount - 15, 'pages') : '');
        break;
    }
    
    // Re-attach event listeners
    this.attachEventListeners();
  }
  
  selectItem(name, type, element = null) {
    // Update selection state
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      item.style.borderLeftColor = 'transparent';
      item.style.background = 'transparent';
    });
    
    let selected = element;
    if (!selected) {
      selected = this.container.querySelector(`[data-name="${name}"][data-type="${type}"]`);
    }
    
    if (selected) {
      selected.style.borderLeftColor = '#667eea';
      selected.style.background = '#252525';
    }
    
    this.selectedItem = name;
    this.selectedType = type;
    
    // Trigger global selectItem function if it exists
    if (window.selectItem) {
      window.selectItem(name, type);
    }
  }
  
  filterItems(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      const name = item.dataset.name?.toLowerCase() || '';
      const text = item.textContent?.toLowerCase() || '';
      const matches = name.includes(term) || text.includes(term);
      item.style.display = matches ? 'flex' : 'none';
    });
  }
}

// Export for use in browser
window.SidebarNavigator = SidebarNavigator;

// Global expand/collapse functions for inline onclick handlers
window.expandSection = function(section) {
  const sidebarNav = window.sidebarNavigatorInstance;
  if (sidebarNav) {
    sidebarNav.expandSection(section);
  }
};

window.collapseSection = function(section) {
  const sidebarNav = window.sidebarNavigatorInstance;
  if (sidebarNav) {
    sidebarNav.collapseSection(section);
  }
};