/**
 * Viewers Index - Presentation Layer
 * 
 * This directory contains detail viewers that display entity information.
 * These components focus on presenting processed data in user-friendly formats.
 * They consume data from scripts and render UI without handling business logic.
 */

/**
 * TABLE DETAILS VIEWER (table-details-viewer.js)
 * ==============================================
 * Purpose: Display detailed table information and analysis
 * Shows: Properties, relationships, hooks, components, health score
 * Data Source: EntityDataProvider + ValidationService
 * 
 * Key Features:
 * - Type definition analysis
 * - Hook and component relationships  
 * - Health scoring with recommendations
 * - Validation violations display
 * - API endpoint mapping
 */

/**
 * HOOK DETAILS VIEWER (hook-details-viewer.js)
 * ============================================
 * Purpose: Display React/Vue hook information and quality analysis
 * Shows: Configuration, usage, violations, health metrics
 * Data Source: Hook data + ValidationService
 * 
 * Key Features:
 * - Error handling analysis
 * - Loading state detection
 * - Cache invalidation patterns
 * - Component usage tracking
 * - Performance recommendations
 */

/**
 * COMPONENT DETAILS VIEWER (component-details-viewer.js)
 * ======================================================
 * Purpose: Display React/Vue component analysis
 * Shows: Props, usage, violations, testing status
 * Data Source: Component data + ValidationService
 * 
 * Key Features:
 * - Props type analysis
 * - Testing coverage status
 * - Error boundary detection
 * - Performance optimization analysis
 * - Usage across pages/components
 */

/**
 * PAGE DETAILS VIEWER (page-details-viewer.js)
 * ============================================
 * Purpose: Display page/route information and analysis
 * Shows: Route info, components used, performance metrics
 * Data Source: Page data + ValidationService
 * 
 * Key Features:
 * - Routing configuration
 * - Component dependency mapping
 * - Performance optimization status
 * - Error handling analysis
 * - Loading state management
 */

// Export viewer information
const ViewersInfo = {
  table: {
    file: '../table-details-viewer.js',
    class: 'TableDetailsViewer',
    purpose: 'Display table information and relationships',
    shows: ['Properties', 'Relationships', 'Hooks', 'Components', 'Health Score']
  },
  
  hook: {
    file: '../hook-details-viewer.js', 
    class: 'HookDetailsViewer',
    purpose: 'Display hook configuration and usage',
    shows: ['Error Handling', 'Loading States', 'Cache Strategy', 'Usage']
  },
  
  component: {
    file: '../component-details-viewer.js',
    class: 'ComponentDetailsViewer', 
    purpose: 'Display component props and testing status',
    shows: ['Props', 'Testing', 'Error Boundaries', 'Performance']
  },
  
  page: {
    file: '../page-details-viewer.js',
    class: 'PageDetailsViewer',
    purpose: 'Display page routing and component usage',
    shows: ['Routes', 'Components', 'Performance', 'Error Handling']
  }
};

// Make available globally
window.ViewersInfo = ViewersInfo;

console.log('👁️ Viewers Documentation Loaded');
console.log('📺 Available Viewers:', Object.keys(ViewersInfo));