/**
 * State Manager Script (Business Logic)
 * Manages application state, events, and data synchronization
 * Provides reactive state management for components
 */

class StateManager {
  constructor() {
    this.state = {
      // Application state
      currentTab: 'overview',
      currentProject: 'test-projects/streax',
      selectedEntity: null,
      selectedEntityType: null,
      
      // Data state
      architectureData: null,
      validationData: null,
      projectInfo: null,
      
      // UI state
      sidebarExpanded: true,
      rightPanelVisible: false,
      queryPanelVisible: false,
      autoRefreshEnabled: false,
      
      // Loading states
      isLoading: false,
      isValidating: false,
      loadingMessage: '',
      
      // Settings
      settings: {
        theme: 'dark',
        refreshInterval: 30000,
        showLineNumbers: true,
        groupBySeverity: true,
        maxViolationsPerEntity: 50
      }
    };
    
    this.listeners = new Map();
    this.history = [];
    this.maxHistorySize = 10;
    
    this.init();
  }

  /**
   * Initialize state manager
   */
  init() {
    // Load settings from localStorage
    this.loadSettings();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Initialize with default data
    this.loadInitialData();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    const listeners = this.listeners.get(key);
    listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update state and notify listeners
   */
  setState(updates, options = {}) {
    // Save current state to history
    if (options.saveHistory !== false) {
      this.saveToHistory();
    }
    
    const prevState = { ...this.state };
    
    // Apply updates
    if (typeof updates === 'function') {
      this.state = { ...this.state, ...updates(this.state) };
    } else {
      this.state = { ...this.state, ...updates };
    }
    
    // Notify listeners
    Object.keys(updates).forEach(key => {
      this.notifyListeners(key, this.state[key], prevState[key]);
    });
    
    // Global state change notification
    this.notifyListeners('*', this.state, prevState);
    
    // Save settings if they changed
    if (updates.settings) {
      this.saveSettings();
    }
  }

  /**
   * Get current state value
   */
  getState(key = null) {
    return key ? this.state[key] : this.state;
  }

  /**
   * Notify listeners of state changes
   */
  notifyListeners(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    }
  }

  /**
   * Navigation actions
   */
  switchTab(tab) {
    this.setState({ 
      currentTab: tab,
      selectedEntity: null,
      selectedEntityType: null,
      queryPanelVisible: tab === 'overview'
    });
  }

  selectEntity(name, type) {
    this.setState({
      selectedEntity: name,
      selectedEntityType: type,
      queryPanelVisible: type === 'table'
    });
  }

  switchProject(projectName) {
    this.setState({
      currentProject: projectName,
      architectureData: null,
      validationData: null,
      selectedEntity: null,
      selectedEntityType: null
    });
    
    // Reload data for new project
    this.loadProjectData();
  }

  /**
   * Data actions
   */
  async loadProjectData() {
    this.setState({ isLoading: true, loadingMessage: 'Loading project data...' });
    
    try {
      const [architectureData, validationData, projectInfo] = await Promise.all([
        window.apiClient.getArchitectureData(),
        window.apiClient.getValidationSummary(),
        window.apiClient.getProjectInfo()
      ]);
      
      // Process data through data processor
      const processedArchitecture = window.dataProcessor.processArchitectureData(architectureData);
      const processedValidation = window.dataProcessor.processValidationData(validationData);
      
      this.setState({
        architectureData: processedArchitecture,
        validationData: processedValidation,
        projectInfo,
        isLoading: false,
        loadingMessage: ''
      });
      
    } catch (error) {
      console.error('Failed to load project data:', error);
      this.setState({
        isLoading: false,
        loadingMessage: '',
        error: error.message
      });
    }
  }

  async runValidation() {
    this.setState({ isValidating: true, loadingMessage: 'Running validation...' });
    
    try {
      await window.apiClient.runValidation();
      
      // Reload validation data
      const validationData = await window.apiClient.getValidationSummary();
      const processedValidation = window.dataProcessor.processValidationData(validationData);
      
      this.setState({
        validationData: processedValidation,
        isValidating: false,
        loadingMessage: ''
      });
      
    } catch (error) {
      console.error('Validation failed:', error);
      this.setState({
        isValidating: false,
        loadingMessage: '',
        error: error.message
      });
    }
  }

  /**
   * UI actions
   */
  toggleSidebar() {
    this.setState({
      sidebarExpanded: !this.state.sidebarExpanded
    });
  }

  toggleRightPanel() {
    this.setState({
      rightPanelVisible: !this.state.rightPanelVisible
    });
  }

  toggleQueryPanel() {
    this.setState({
      queryPanelVisible: !this.state.queryPanelVisible
    });
  }

  toggleAutoRefresh() {
    const enabled = !this.state.autoRefreshEnabled;
    this.setState({ autoRefreshEnabled: enabled });
    
    if (enabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  /**
   * Settings management
   */
  updateSettings(newSettings) {
    this.setState({
      settings: { ...this.state.settings, ...newSettings }
    });
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('aiObserverSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('aiObserverSettings', JSON.stringify(this.state.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * History management
   */
  saveToHistory() {
    this.history.push({ ...this.state });
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  goBack() {
    if (this.history.length > 0) {
      const previousState = this.history.pop();
      this.state = previousState;
      this.notifyListeners('*', this.state, null);
    }
  }

  /**
   * Auto-refresh functionality
   */
  startAutoRefresh() {
    const interval = this.state.settings.refreshInterval;
    
    this.autoRefreshInterval = setInterval(() => {
      if (!this.state.isLoading && !this.state.isValidating) {
        this.loadProjectData();
      }
    }, interval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  /**
   * Event handlers
   */
  setupEventHandlers() {
    // Handle browser navigation
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        this.setState(event.state, { saveHistory: false });
      }
    });
    
    // Handle visibility changes (pause refresh when tab is not visible)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state.autoRefreshEnabled) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event);
    });
  }

  handleKeyboardShortcuts(event) {
    // Don't handle shortcuts if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Tab switching with numbers
    if (event.altKey && event.key >= '1' && event.key <= '8') {
      event.preventDefault();
      const tabs = ['overview', 'unified', 'code-quality', 'contracts', 'business', 'design', 'contract-tests', 'export'];
      const tabIndex = parseInt(event.key) - 1;
      if (tabs[tabIndex]) {
        this.switchTab(tabs[tabIndex]);
      }
    }
    
    // Refresh with Ctrl/Cmd + R
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      this.runValidation();
    }
    
    // Toggle sidebar with Ctrl/Cmd + B
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      this.toggleSidebar();
    }
    
    // Go back with Escape
    if (event.key === 'Escape') {
      if (this.state.selectedEntity) {
        this.selectEntity(null, null);
      }
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    await this.loadProjectData();
  }

  /**
   * Computed properties (derived state)
   */
  getFilteredViolations() {
    const { validationData, settings } = this.state;
    if (!validationData) return [];
    
    let violations = validationData.priorities || [];
    
    if (settings.maxViolationsPerEntity) {
      violations = violations.slice(0, settings.maxViolationsPerEntity);
    }
    
    return violations;
  }

  getArchitectureMetrics() {
    const { architectureData } = this.state;
    return architectureData?.metrics || null;
  }

  getCurrentEntityData() {
    const { selectedEntity, selectedEntityType, architectureData } = this.state;
    
    if (!selectedEntity || !selectedEntityType || !architectureData) {
      return null;
    }
    
    const entityGroup = architectureData[`${selectedEntityType}s`] || architectureData[selectedEntityType];
    return entityGroup?.[selectedEntity] || null;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAutoRefresh();
    this.listeners.clear();
    this.history = [];
  }
}

// Export singleton instance
window.StateManager = StateManager;
window.stateManager = new StateManager();