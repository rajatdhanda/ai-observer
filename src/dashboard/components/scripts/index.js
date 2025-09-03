/**
 * Scripts Index - Business Logic Layer
 * 
 * This directory contains all business logic scripts that handle data processing,
 * API communication, and application state. Following the separation of concerns
 * principle, these scripts focus purely on logic without UI concerns.
 * 
 * Architecture: Scripts → Components → UI (Postman approach)
 */

/**
 * API CLIENT (api-client.js)
 * ===========================
 * Purpose: Handles all API communication and data fetching
 * Responsibilities:
 * - Fetch data from backend endpoints (/api/*)
 * - Cache responses for performance
 * - Handle API errors and retries
 * - Batch operations for efficiency
 * 
 * Key Methods:
 * - getArchitectureData() - Fetch table/hook/component data
 * - getValidationSummary() - Fetch validation results
 * - getContractViolations() - Fetch contract test results
 * - getNineRulesViolations() - Fetch code quality violations
 * - runValidation() - Trigger validation process
 * 
 * Usage: window.apiClient.getArchitectureData()
 */

/**
 * DATA PROCESSOR (data-processor.js)
 * ==================================
 * Purpose: Transforms raw API data into structured format for UI consumption
 * Responsibilities:
 * - Process raw architecture data into displayable format
 * - Calculate health scores and metrics
 * - Extract relationships between entities
 * - Generate recommendations based on analysis
 * - Prioritize violations by severity and impact
 * 
 * Key Methods:
 * - processArchitectureData() - Structure tables/hooks/components
 * - processValidationData() - Format violation data
 * - calculateHealthScore() - Generate health metrics
 * - extractRelationships() - Map entity connections
 * 
 * Usage: window.dataProcessor.processArchitectureData(rawData)
 */

/**
 * STATE MANAGER (state-manager.js)
 * ================================
 * Purpose: Manages application state and reactive updates
 * Responsibilities:
 * - Centralized state management
 * - Handle navigation and tab switching
 * - Manage UI state (sidebar, panels, etc.)
 * - Event subscription and notifications
 * - Settings persistence
 * 
 * Key Methods:
 * - setState() - Update state and notify listeners
 * - subscribe() - Listen to state changes
 * - switchTab() - Handle tab navigation
 * - loadProjectData() - Load and cache project data
 * 
 * Usage: window.stateManager.setState({currentTab: 'validation'})
 */

// Export information for component registry
const ScriptsInfo = {
  apiClient: {
    file: 'api-client.js',
    purpose: 'API communication and data fetching',
    dependencies: [],
    provides: ['Data fetching', 'Caching', 'Error handling']
  },
  
  dataProcessor: {
    file: 'data-processor.js', 
    purpose: 'Data transformation and analysis',
    dependencies: ['apiClient'],
    provides: ['Health scoring', 'Relationship mapping', 'Recommendations']
  },
  
  stateManager: {
    file: 'state-manager.js',
    purpose: 'Application state management',  
    dependencies: ['apiClient', 'dataProcessor'],
    provides: ['State management', 'Navigation', 'Event system']
  }
};

// Make available globally
window.ScriptsInfo = ScriptsInfo;

console.log('📋 Scripts Documentation Loaded');
console.log('🔧 Available Scripts:', Object.keys(ScriptsInfo));