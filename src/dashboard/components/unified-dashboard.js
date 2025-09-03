/**
 * Unified Dashboard Component
 * Main dashboard controller that matches the enhanced dashboard's UI structure
 * Handles tab switching, project selection, and overall layout
 */

class UnifiedDashboard {
  constructor() {
    this.currentTab = 'overview';
    this.currentProject = 'test-projects/streax';
    this.projectData = null;
    this.validationData = null;
    
    this.init();
  }

  async init() {
    await this.loadProjectInfo();
    this.render();
    this.loadCurrentTab();
  }

  render() {
    document.body.innerHTML = `
      ${this.renderHeader()}
      ${this.renderModeBar()}
      ${this.renderControlBar()}
      ${this.renderTabs()}
      ${this.renderMainContainer()}
    `;
    
    this.initializeComponents();
    this.attachEventListeners();
  }

  renderHeader() {
    return `
      <div class="header" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
      ">
        <h1 style="margin: 0; font-size: 20px; font-weight: 600;">🔍 AI Observer</h1>
        <div class="project-info" style="display: flex; gap: 20px; align-items: center; font-size: 13px;">
          <span>Project: <strong id="projectName">loading...</strong></span>
          <span>Framework: <strong id="frameworkName">loading...</strong></span>
          <span>Tables: <strong id="tableCount">0</strong></span>
          <select 
            id="projectSelector" 
            onchange="unifiedDashboard.switchProject(this.value)"
            style="
              margin-left: 20px;
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
            "
          >
            <option value="test-projects/streax">Streax</option>
            <option value="test-projects/other">Other Project</option>
          </select>
        </div>
      </div>
    `;
  }

  renderModeBar() {
    return `
      <div class="mode-bar" style="
        padding: 8px 20px;
        background: rgba(0,0,0,0.5);
        border-bottom: 1px solid #252525;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div class="quick-actions" style="display: flex; gap: 10px; align-items: center;">
          <button 
            class="action-btn"
            onclick="unifiedDashboard.runAllValidations()"
            style="
              background: #10b981;
              color: white;
              border: none;
              padding: 6px 12px;
              font-size: 13px;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            🚀 Run All Validations
          </button>
          <button 
            class="action-btn"
            onclick="unifiedDashboard.exportReport()"
            style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 6px 12px;
              font-size: 13px;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            📊 Export Report
          </button>
          <button 
            class="action-btn"
            onclick="unifiedDashboard.runContractTests()"
            style="
              background: #8b5cf6;
              color: white;
              border: none;
              padding: 6px 12px;
              font-size: 13px;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            🧪 Contract Tests
          </button>
          <button 
            class="action-btn"
            onclick="unifiedDashboard.viewChanges()"
            style="
              background: #f59e0b;
              color: white;
              border: none;
              padding: 6px 12px;
              font-size: 13px;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            📝 View Changes
          </button>
        </div>
        <div style="color: #9ca3af; font-size: 12px;">
          <span id="lastRunStatus">Last run: Never</span>
        </div>
      </div>
    `;
  }

  renderControlBar() {
    return `
      <div id="controlBarContainer" style="padding: 0 20px;"></div>
    `;
  }

  renderTabs() {
    const tabs = [
      { id: 'overview', label: '🏠 Overview', active: true },
      { id: 'unified', label: '🎯 Unified', special: true },
      { id: 'code-quality', label: '✅ Code Quality' },
      { id: 'contracts', label: '📋 Contracts' },
      { id: 'business', label: '🧠 Business Logic' },
      { id: 'design', label: '🎨 Design System' },
      { id: 'contract-tests', label: '🧪 Tests' },
      { id: 'export', label: '📤 Export' }
    ];

    return `
      <div class="tabs" style="
        overflow-x: auto;
        white-space: nowrap;
        padding: 0 20px;
        background: #0a0a0a;
        border-bottom: 1px solid #252525;
      ">
        <div class="tab-group" style="display: flex; gap: 4px;">
          ${tabs.map(tab => `
            <div 
              class="tab ${tab.active ? 'active' : ''}"
              data-tab="${tab.id}"
              onclick="unifiedDashboard.switchTab('${tab.id}')"
              style="
                padding: 10px 16px;
                cursor: pointer;
                background: ${tab.special ? '#8b5cf6' : 'transparent'};
                color: ${tab.active ? '#f8fafc' : '#94a3b8'};
                border: none;
                border-bottom: 2px solid ${tab.active ? '#667eea' : 'transparent'};
                transition: all 0.2s;
                border-radius: ${tab.special ? '4px 4px 0 0' : '0'};
              "
            >
              ${tab.label}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderMainContainer() {
    return `
      <div class="main-container" style="
        display: flex;
        height: calc(100vh - 200px);
      ">
        <div id="sidebarContainer" class="sidebar" style="
          width: 300px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          overflow-y: auto;
        "></div>
        
        <div class="content-wrapper" style="flex: 1; display: flex; flex-direction: column;">
          <div id="mainContent" class="content-area" style="
            flex: 1;
            overflow-y: auto;
            padding: 20px;
          "></div>
          
          <div class="query-panel" id="queryPanel" style="
            display: none;
            height: 300px;
            background: #1a1a1a;
            border-top: 1px solid #333;
            padding: 20px;
            overflow-y: auto;
          ">
            <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Query Inspector</h3>
            <div id="queryContent"></div>
          </div>
        </div>
        
        <div id="rightPanel" class="right-panel" style="
          width: 400px;
          background: #1a1a1a;
          border-left: 1px solid #333;
          overflow-y: auto;
          padding: 20px;
          display: none;
        "></div>
      </div>
    `;
  }

  async initializeComponents() {
    // Initialize control bar
    if (window.ControlBar) {
      window.controlBar = new window.ControlBar('controlBarContainer');
      window.controlBar.render();
    }

    // Initialize sidebar navigator
    if (window.SidebarNavigator) {
      window.sidebarNavigatorInstance = new window.SidebarNavigator('sidebarContainer');
    }

    // Initialize overview component
    if (window.OverviewComponent) {
      window.overviewComponent = new window.OverviewComponent('mainContent');
    }
  }

  attachEventListeners() {
    // Tab hover effects
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('mouseenter', () => {
        if (!tab.classList.contains('active')) {
          tab.style.color = '#f8fafc';
        }
      });
      
      tab.addEventListener('mouseleave', () => {
        if (!tab.classList.contains('active')) {
          tab.style.color = '#94a3b8';
        }
      });
    });
  }

  async switchTab(tabId) {
    this.currentTab = tabId;
    
    // Update active tab styling
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.style.color = '#94a3b8';
      t.style.borderBottomColor = 'transparent';
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.style.color = '#f8fafc';
      activeTab.style.borderBottomColor = '#667eea';
    }

    // Show/hide query panel
    const queryPanel = document.getElementById('queryPanel');
    if (queryPanel) {
      queryPanel.style.display = (tabId === 'overview') ? 'block' : 'none';
    }

    // Load appropriate content
    await this.loadCurrentTab();
  }

  async loadCurrentTab() {
    const mainContent = document.getElementById('mainContent');
    
    switch(this.currentTab) {
      case 'overview':
        if (window.overviewComponent) {
          await window.overviewComponent.loadAndRender();
        } else {
          mainContent.innerHTML = '<div>Loading overview...</div>';
        }
        break;
        
      case 'unified':
        await this.loadUnifiedView();
        break;
        
      case 'code-quality':
        await this.loadCodeQuality();
        break;
        
      case 'contracts':
        await this.loadContracts();
        break;
        
      case 'business':
        await this.loadBusiness();
        break;
        
      case 'design':
        await this.loadDesignSystem();
        break;
        
      case 'contract-tests':
        await this.loadContractTests();
        break;
        
      case 'export':
        await this.loadExportView();
        break;
        
      default:
        mainContent.innerHTML = '<div>Tab content not yet implemented</div>';
    }
  }

  async loadProjectInfo() {
    try {
      const response = await fetch('/api/project-info');
      const data = await response.json();
      
      document.getElementById('projectName').textContent = data.name || 'Unknown';
      document.getElementById('frameworkName').textContent = data.framework || 'React';
      document.getElementById('tableCount').textContent = data.tableCount || 0;
      
      this.projectData = data;
    } catch (error) {
      console.error('Error loading project info:', error);
    }
  }

  async switchProject(projectName) {
    this.currentProject = projectName;
    await this.loadProjectInfo();
    await this.loadCurrentTab();
    
    // Reload sidebar
    if (window.sidebarNavigatorInstance) {
      await window.sidebarNavigatorInstance.loadData();
    }
  }

  // Tab loading methods (placeholders for now)
  async loadUnifiedView() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>🎯 Unified Architecture View</h2>
        <p>Comprehensive view of your architecture coming soon...</p>
      </div>
    `;
  }

  async loadCodeQuality() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>✅ Code Quality Analysis</h2>
        <p>Code quality metrics and suggestions coming soon...</p>
      </div>
    `;
  }

  async loadContracts() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>📋 Contract Validation</h2>
        <p>API contract testing and validation coming soon...</p>
      </div>
    `;
  }

  async loadBusiness() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>🧠 Business Logic Analysis</h2>
        <p>Business rule validation and logic flow analysis coming soon...</p>
      </div>
    `;
  }

  async loadDesignSystem() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>🎨 Design System</h2>
        <p>Component library and design consistency analysis coming soon...</p>
      </div>
    `;
  }

  async loadContractTests() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>🧪 Contract Tests</h2>
        <p>Automated API contract testing coming soon...</p>
      </div>
    `;
  }

  async loadExportView() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h2>📤 Export Reports</h2>
        <p>Report generation and export features coming soon...</p>
      </div>
    `;
  }

  // Action methods
  async runAllValidations() {
    const statusEl = document.getElementById('lastRunStatus');
    if (statusEl) statusEl.textContent = 'Running...';
    
    try {
      await fetch('/api/validate');
      await this.loadCurrentTab();
      
      if (statusEl) statusEl.textContent = `Last run: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      console.error('Validation failed:', error);
      if (statusEl) statusEl.textContent = 'Run failed';
    }
  }

  async exportReport() {
    try {
      const response = await fetch('/api/export-report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `architecture-report-${Date.now()}.json`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  async runContractTests() {
    try {
      const response = await fetch('/api/run-contract-tests');
      const results = await response.json();
      console.log('Contract test results:', results);
      
      // Show results in a modal or switch to contract tests tab
      await this.switchTab('contract-tests');
    } catch (error) {
      console.error('Contract tests failed:', error);
    }
  }

  viewChanges() {
    // Show file changes or version control information
    console.log('Viewing changes...');
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.unifiedDashboard = new UnifiedDashboard();
});

// Export for global use
window.UnifiedDashboard = UnifiedDashboard;