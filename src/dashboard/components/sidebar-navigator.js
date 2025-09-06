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
    this.smartAnalysisData = null;
    this.schemaEntities = null; // Additional schema entities for refactoring
  }
  
  async render(data) {
    this.data = this.processData(data);
    
    // Fetch validation data before rendering
    await this.updateValidationCounts();
    
    // Fetch schema entities ONLY if we're on refactoring tab and don't have tables
    if ((!this.data.tables || Object.keys(this.data.tables).length === 0) && !this.schemaEntities) {
      await this.fetchSchemaEntities();
    }
    
    this.renderSidebar();
    this.attachEventListeners();
  }
  
  async fetchSchemaEntities() {
    try {
      const response = await fetch('/api/schema-intelligence');
      if (response.ok) {
        const data = await response.json();
        this.schemaEntities = data.entities || {};
      }
    } catch (error) {
      console.log('Could not fetch schema entities:', error);
      this.schemaEntities = {};
    }
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
          "
        >
      </div>
      
      ${this.renderSmartAnalysisTotal()}
      ${this.schemaEntities ? this.renderEntitiesSection() : ''}
      ${this.renderTableSection()}
      ${this.renderHookSection()}
      ${this.renderComponentSection()}
      ${this.renderPageSection()}
      ${this.renderValidationStatus()}
    `;
  }
  
  renderSmartAnalysisTotal() {
    const total = this.getSmartAnalysisTotal();
    if (total.blockers === 0 && total.structural === 0 && total.compliance === 0) {
      return ''; // Don't show if no data
    }
    
    return `
      <div id="smartAnalysisTotal" style="
        background: #1a1a1a;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #333;
        margin: 0 16px 16px 16px;
      ">
        <div style="color: #94a3b8; margin-bottom: 4px;">📊 SMART ANALYSIS TOTAL</div>
        <div style="display: flex; gap: 8px; font-size: 12px;">
          <span style="color: #ef4444;">${total.blockers}B</span>
          <span style="color: #f59e0b;">${total.structural}S</span>
          <span style="color: #3b82f6;">${total.compliance}C</span>
          <span style="color: #64748b;">= ${total.blockers + total.structural + total.compliance} total</span>
        </div>
      </div>
    `;
  }
  
  renderEntitiesSection() {
    if (!this.schemaEntities || Object.keys(this.schemaEntities).length === 0) {
      return '';
    }
    
    const entities = Object.entries(this.schemaEntities).sort(([a], [b]) => a.localeCompare(b));
    const count = entities.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">🔷 ENTITIES</h3>
          <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
        </div>
        <div id="entitiesList">
          ${entities.map(([name, data]) => this.renderEntityItem(name, data)).join('')}
        </div>
      </div>
    `;
  }
  
  renderEntityItem(name, data) {
    const fields = data.fields || [];
    const fieldCount = fields.length;
    
    return `
      <div class="table-item entity-item" data-entity="${name}" style="
        padding: 10px 16px;
        cursor: pointer;
        border-bottom: 1px solid #1a1a1a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.15s;
      " 
      onmouseover="this.style.background='#1a1a1a'" 
      onmouseout="this.style.background='transparent'"
      onclick="window.handleEntityClick && window.handleEntityClick('${name}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 18px;">📘</span>
          <div>
            <div style="color: #e2e8f0; font-size: 13px; font-weight: 500;">${name}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${fieldCount} fields</div>
          </div>
        </div>
        <div style="color: #3b82f6; font-size: 11px;">
          TS
        </div>
      </div>
    `;
  }
  
  renderTableSection() {
    const tables = Object.entries(this.data.tables)
      .sort(([nameA, dataA], [nameB, dataB]) => {
        const healthA = this.getEntityHealth(nameA, 'table');
        const healthB = this.getEntityHealth(nameB, 'table');
        
        // Sort by severity priority: Blockers > Structural > Compliance > Total
        if (healthB.blockers !== healthA.blockers) {
          return healthB.blockers - healthA.blockers;
        }
        if (healthB.structural !== healthA.structural) {
          return healthB.structural - healthA.structural;
        }
        if (healthB.compliance !== healthA.compliance) {
          return healthB.compliance - healthA.compliance;
        }
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
    const health = this.getEntityHealth(name, 'table');
    
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
        title="${health.total > 0 ? `${health.blockers}B ${health.structural}S ${health.compliance}C` : 'No issues'}"
      >
        <span style="font-size: 16px;">📊</span>
        <span style="flex: 1; color: #e2e8f0; font-size: 13px;">${name}</span>
        ${health.total > 0 ? 
          `<span style="font-size: 11px; color: #64748b; margin-right: 4px;">${health.blockers}B ${health.structural}S ${health.compliance}C</span>` : 
          ''
        }
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${health.color};"></span>
      </div>
    `;
  }
  
  renderHookSection() {
    const sortedHooks = [...this.data.hooks]
      .sort((hookA, hookB) => {
        const nameA = this.extractHookName(hookA);
        const nameB = this.extractHookName(hookB);
        const healthA = this.getEntityHealth(nameA, 'hook');
        const healthB = this.getEntityHealth(nameB, 'hook');
        
        // Sort by severity priority: Blockers > Structural > Compliance > Total
        if (healthB.blockers !== healthA.blockers) {
          return healthB.blockers - healthA.blockers;
        }
        if (healthB.structural !== healthA.structural) {
          return healthB.structural - healthA.structural;
        }
        if (healthB.compliance !== healthA.compliance) {
          return healthB.compliance - healthA.compliance;
        }
        return (healthB.blockers + healthB.structural + healthB.compliance) - 
               (healthA.blockers + healthA.structural + healthA.compliance);
      });
    const count = sortedHooks.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">🔗 Hooks</h3>
          <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
        </div>
        <div id="hooksList">
          ${count === 0 ? this.renderEmptyState('hooks') : 
            sortedHooks.slice(0, 15).map(hook => 
              this.renderSimpleItem(this.extractHookName(hook), 'hook', '🔗')
            ).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15, 'hooks') : ''}
        </div>
      </div>
    `;
  }
  
  renderComponentSection() {
    const sortedComponents = [...this.data.components]
      .sort((compA, compB) => {
        const healthA = this.getEntityHealth(compA, 'component');
        const healthB = this.getEntityHealth(compB, 'component');
        
        // Sort by severity priority: Blockers > Structural > Compliance > Total
        if (healthB.blockers !== healthA.blockers) {
          return healthB.blockers - healthA.blockers;
        }
        if (healthB.structural !== healthA.structural) {
          return healthB.structural - healthA.structural;
        }
        if (healthB.compliance !== healthA.compliance) {
          return healthB.compliance - healthA.compliance;
        }
        return (healthB.blockers + healthB.structural + healthB.compliance) - 
               (healthA.blockers + healthA.structural + healthA.compliance);
      });
    const count = sortedComponents.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">🧩 Components</h3>
          <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
        </div>
        <div id="componentsList">
          ${count === 0 ? this.renderEmptyState('components') : 
            sortedComponents.slice(0, 15).map(comp => 
              this.renderSimpleItem(comp, 'component', '🧩')
            ).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15, 'components') : ''}
        </div>
      </div>
    `;
  }
  
  renderPageSection() {
    const sortedPages = [...this.data.pages]
      .sort((pageA, pageB) => {
        const nameA = this.formatPageName(pageA);
        const nameB = this.formatPageName(pageB);
        const healthA = this.getEntityHealth(nameA, 'page');
        const healthB = this.getEntityHealth(nameB, 'page');
        
        // Sort by severity priority: Blockers > Structural > Compliance > Total
        if (healthB.blockers !== healthA.blockers) {
          return healthB.blockers - healthA.blockers;
        }
        if (healthB.structural !== healthA.structural) {
          return healthB.structural - healthA.structural;
        }
        if (healthB.compliance !== healthA.compliance) {
          return healthB.compliance - healthA.compliance;
        }
        return (healthB.blockers + healthB.structural + healthB.compliance) - 
               (healthA.blockers + healthA.structural + healthA.compliance);
      });
    const count = sortedPages.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="padding: 12px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">📄 Pages</h3>
          <span style="background: #252525; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #64748b;">${count}</span>
        </div>
        <div id="pagesList">
          ${count === 0 ? this.renderEmptyState('pages') : 
            sortedPages.slice(0, 15).map(page => {
              const displayName = this.formatPageName(page);
              return this.renderSimpleItem(displayName, 'page', '📄', page);
            }).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15, 'pages') : ''}
        </div>
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
      const response = await fetch('/api/map-validation');
      const data = await response.json();
      
      if (data && data.summary && data.summary.bySeverity) {
        const counts = data.summary.bySeverity;
        
        const criticalEl = document.getElementById('criticalCount');
        const warningEl = document.getElementById('warningCount');  
        const infoEl = document.getElementById('infoCount');
        
        if (criticalEl) criticalEl.textContent = counts.critical || 0;
        if (warningEl) warningEl.textContent = counts.warning || 0;
        if (infoEl) infoEl.textContent = counts.info || 0;
      }
      
      // Store validation data for entity health mapping
      this.validationData = data;
      
      // Also fetch Smart Analysis data
      try {
        const smartResponse = await fetch('/api/smart-analysis');
        const smartData = await smartResponse.json();
        this.smartAnalysisData = smartData;
        
        // Re-render only the Smart Analysis Total section if it exists
        const totalElement = document.querySelector('#smartAnalysisTotal');
        if (totalElement) {
          totalElement.outerHTML = this.renderSmartAnalysisTotal();
        }
      } catch (smartError) {
        console.error('Failed to fetch smart analysis data:', smartError);
      }
    } catch (error) {
      console.error('Failed to fetch validation counts:', error);
    }
  }

  // Calculate entity health based on Smart Analysis data
  getEntityHealth(entityName, entityType) {
    if (!this.smartAnalysisData || !this.smartAnalysisData.analysis || !this.smartAnalysisData.analysis.issue_buckets) {
      return { 
        score: 100, 
        color: '#10b981', 
        severity: 'healthy',
        blockers: 0,
        structural: 0,
        compliance: 0
      };
    }

    let blockers = 0;
    let structural = 0;
    let compliance = 0;
    
    // Map entity names to file patterns for matching
    let filePatterns = [];
    switch (entityType) {
      case 'table':
        // For tables, match by table name in file paths or content
        filePatterns = [entityName.toLowerCase()];
        break;
      case 'hook':
        filePatterns = [`src/hooks/${entityName}.ts`, `src/hooks/${entityName}.js`];
        break;
      case 'component':
        filePatterns = [entityName.toLowerCase()];
        break;
      case 'page':
        // Handle page path mapping - convert "admin/children" to proper file patterns
        if (entityName.includes('/')) {
          filePatterns = [`app/${entityName}/page.tsx`];
        } else {
          filePatterns = [`app/${entityName}/page.tsx`, `app/(main)/${entityName}/page.tsx`];
        }
        break;
      default:
        filePatterns = [entityName.toLowerCase()];
    }

    // Count issues from Smart Analysis buckets
    this.smartAnalysisData.analysis.issue_buckets.forEach(bucket => {
      bucket.issues?.forEach(issue => {
        const matchesEntity = filePatterns.some(pattern => 
          issue.file.toLowerCase().includes(pattern.toLowerCase()) || 
          issue.file.toLowerCase().includes(entityName.toLowerCase())
        );
        
        if (matchesEntity) {
          if (bucket.name === 'BLOCKERS') blockers++;
          else if (bucket.name === 'STRUCTURAL') structural++;  
          else if (bucket.name === 'COMPLIANCE') compliance++;
        }
      });
    });

    const totalIssues = blockers + structural + compliance;
    
    // Calculate health score and color based on issue severity
    let score, color, severity;
    if (blockers > 0) {
      score = 0;
      color = '#ef4444';
      severity = 'critical';
    } else if (structural > 0) {
      score = 40;
      color = '#f59e0b'; 
      severity = 'warning';
    } else if (compliance > 0) {
      score = 70;
      color = '#3b82f6';
      severity = 'info';
    } else {
      score = 100;
      color = '#10b981';
      severity = 'healthy';
    }
    
    return {
      score,
      color,
      severity,
      blockers,
      structural,
      compliance,
      total: totalIssues
    };
  }
  
  renderSimpleItem(displayName, type, icon, actualName = null) {
    const itemName = actualName || displayName;
    
    // Get health status based on validation data
    const health = this.getEntityHealth(displayName, type);
    
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
          gap: 10px;
          transition: background 0.2s;
          border-left: 3px solid transparent;
        "
        onmouseover="this.style.background='#252525'"
        onmouseout="this.style.background='transparent'"
        title="${health.total > 0 ? `${health.blockers}B ${health.structural}S ${health.compliance}C` : 'No issues'}"
      >
        <span style="font-size: 14px;">${icon}</span>
        <span style="color: #e2e8f0; font-size: 13px; flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${displayName}</span>
        ${health.total > 0 ? 
          `<span style="font-size: 11px; color: #64748b; margin-right: 4px;">${health.blockers}B ${health.structural}S ${health.compliance}C</span>` : 
          ''
        }
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
    
    // Handle all app/* paths - show everything after app/ as route
    if (parts.includes('app')) {
      const appIdx = parts.findIndex(p => p === 'app');
      let relevantParts = parts.slice(appIdx + 1, -1); // Remove 'app' and 'page.tsx'
      
      // Filter out empty parts and special Next.js patterns
      relevantParts = relevantParts.filter(part => 
        part && !part.startsWith('(') && !part.endsWith(')') && part !== 'ui-components'
      );
      
      if (relevantParts.length > 0) {
        return relevantParts.join('/');
      }
      return 'Home';
    }
    
    // Fallback for other patterns
    const name = parts[parts.length - 2];
    return name === 'app' ? 'Home' : name;
  }
  
  calculateTableHealth(data) {
    let score = 100;
    if (!data.typeDefinition) score -= 20;
    if (!data.hooks || data.hooks.length === 0) score -= 15;
    if (!data.components || data.components.length === 0) score -= 15;
    if (!data.properties || data.properties.length === 0) score -= 10;
    return Math.max(0, score);
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
  
  getSmartAnalysisTotal() {
    if (!this.smartAnalysisData || !this.smartAnalysisData.analysis || !this.smartAnalysisData.analysis.issue_buckets) {
      return { blockers: 0, structural: 0, compliance: 0 };
    }
    
    const buckets = this.smartAnalysisData.analysis.issue_buckets;
    const blockersBucket = buckets.find(b => b.name === 'BLOCKERS') || { count: 0 };
    const structuralBucket = buckets.find(b => b.name === 'STRUCTURAL') || { count: 0 };
    const complianceBucket = buckets.find(b => b.name === 'COMPLIANCE') || { count: 0 };
    
    return {
      blockers: blockersBucket.count,
      structural: structuralBucket.count,
      compliance: complianceBucket.count
    };
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