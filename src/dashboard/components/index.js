/**
 * Component Registry & Index
 * ==========================
 * Organized component management following Postman's design patterns
 * Central place to register and manage all dashboard components
 * 
 * ARCHITECTURE OVERVIEW:
 * ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
 * │   Scripts       │───▶│   Components    │───▶│   Dashboard     │
 * │ (Business Logic)│    │ (Presentation)  │    │   (UI Layer)    │
 * └─────────────────┘    └─────────────────┘    └─────────────────┘
 * 
 * SCRIPTS: Handle data fetching, processing, state management
 * COMPONENTS: Handle UI rendering, user interactions, display logic  
 * DASHBOARD: Orchestrates everything together (modular-fixed.html)
 * 
 * CURRENT HANDLERS:
 * - Contracts: ContractValidator (/api/contracts endpoint)
 * - 9 Quality Rules: NineRulesValidator (/api/nine-rules endpoint)
 * - Architecture Data: ProjectAnalyzer (/api/architecture endpoint)
 * - Health Scoring: Built into ValidationService + SeverityBadge
 */

// Component registry for easy reference and loading
const ComponentRegistry = {
  // Core Scripts (Business Logic)
  scripts: {
    apiClient: '../scripts/api-client.js',
    dataProcessor: '../scripts/data-processor.js',
    stateManager: '../scripts/state-manager.js'
  },
  
  // Core Services (Business Logic)
  services: {
    entityData: 'entity-data-provider.js',
    validation: 'validation-service.js'
  },
  
  // UI Components (Presentation Logic)  
  viewers: {
    table: 'table-details-viewer.js',
    hook: 'hook-details-viewer.js',
    component: 'component-details-viewer.js',
    page: 'page-details-viewer.js'
  },
  
  // Navigation Components
  navigation: {
    sidebar: 'sidebar-navigator.js',
    controlBar: 'control-bar.js'
  },
  
  // Utility Components
  utilities: {
    healthScore: 'health-score-viewer.js',
    queryInspector: 'query-inspector-enhanced.js',
    severityBadge: 'severity-badge.js'
  },
  
  // Main Components
  main: {
    overview: 'overview-component.js'
  },
  
  // Architecture Components
  architecture: {
    diagnostic: 'architecture-diagnostic.js',
    explorer: 'architecture-explorer.js',
    unifiedView: 'unified-architecture-view.js'
  }
};

// Component loading utilities
const ComponentLoader = {
  /**
   * Load a component by category and name
   */
  async loadComponent(category, name) {
    const filename = ComponentRegistry[category]?.[name];
    if (!filename) {
      throw new Error(`Component ${category}.${name} not found in registry`);
    }
    
    return this.loadScript(filename);
  },
  
  /**
   * Load a script file
   */
  async loadScript(filename) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/components/${filename}`;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load ${filename}`));
      document.head.appendChild(script);
    });
  },
  
  /**
   * Load multiple components
   */
  async loadComponents(components) {
    const promises = components.map(({ category, name }) => 
      this.loadComponent(category, name)
    );
    
    return Promise.all(promises);
  },
  
  /**
   * Get component info
   */
  getComponentInfo(category, name) {
    return {
      category,
      name,
      filename: ComponentRegistry[category]?.[name],
      path: `/components/${ComponentRegistry[category]?.[name]}`
    };
  },
  
  /**
   * List all components
   */
  listAllComponents() {
    const components = [];
    Object.entries(ComponentRegistry).forEach(([category, items]) => {
      Object.entries(items).forEach(([name, filename]) => {
        components.push({
          category,
          name,
          filename,
          path: `/components/${filename}`
        });
      });
    });
    return components;
  }
};

// Dashboard configuration following Postman's approach
const DashboardConfig = {
  // Feature flags
  features: {
    realTimeValidation: true,
    lineNumbers: true,
    healthScoring: true,
    violationGrouping: true,
    advancedFiltering: true
  },
  
  // UI settings
  ui: {
    theme: 'dark',
    sidebarWidth: 300,
    rightPanelWidth: 400,
    animationDuration: 200
  },
  
  // Validation settings
  validation: {
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    maxViolationsPerEntity: 50,
    showLineNumbers: true,
    groupBySeverity: true
  },
  
  // Performance settings
  performance: {
    maxTableRows: 1000,
    virtualScrolling: true,
    lazyLoadComponents: false,
    cacheResults: true
  }
};

// Health scoring configuration
const HealthScoringConfig = {
  // Penalty weights
  penalties: {
    noErrorHandling: 20,
    noLoadingState: 15,
    noCacheInvalidation: 10,
    noTypeDefinition: 20,
    noValidation: 15,
    noUsage: 10,
    noProperties: 10,
    criticalViolation: 15,
    warningViolation: 8,
    infoViolation: 3
  },
  
  // Thresholds
  thresholds: {
    healthy: 80,
    needsAttention: 40,
    critical: 0
  },
  
  // Colors
  colors: {
    healthy: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444'
  }
};

// Export everything for global use
window.ComponentRegistry = ComponentRegistry;
window.ComponentLoader = ComponentLoader;
window.DashboardConfig = DashboardConfig;
window.HealthScoringConfig = HealthScoringConfig;

// Auto-initialize message
console.log('🚀 AI Observer Dashboard Components Initialized');
console.log('📦 Available components:', ComponentLoader.listAllComponents().length);
console.log('🎯 Registry:', ComponentRegistry);