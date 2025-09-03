/**
 * Data Processor Script (Business Logic)
 * Handles data transformation, analysis, and business rule processing
 * Provides clean, processed data for components to display
 */

class DataProcessor {
  constructor() {
    this.apiClient = window.apiClient;
  }

  /**
   * Process raw architecture data into structured format
   */
  processArchitectureData(rawData) {
    if (!rawData) return null;

    return {
      tables: this.processTables(rawData.tables || {}),
      hooks: this.processHooks(rawData.hooks || {}),
      components: this.processComponents(rawData.components || {}),
      pages: this.processPages(rawData.pages || {}),
      relationships: this.extractRelationships(rawData),
      metrics: this.calculateArchitectureMetrics(rawData)
    };
  }

  /**
   * Process table data with enrichment
   */
  processTables(tables) {
    const processed = {};
    
    Object.entries(tables).forEach(([name, table]) => {
      processed[name] = {
        ...table,
        name,
        displayName: this.formatDisplayName(name, 'table'),
        health: this.calculateTableHealth(table),
        properties: this.extractTableProperties(table),
        relationships: this.extractTableRelationships(table),
        usage: this.calculateTableUsage(table),
        violations: [],
        recommendations: this.generateTableRecommendations(table)
      };
    });
    
    return processed;
  }

  /**
   * Process hook data with analysis
   */
  processHooks(hooks) {
    const processed = {};
    
    Object.entries(hooks).forEach(([name, hook]) => {
      processed[name] = {
        ...hook,
        name,
        displayName: this.formatDisplayName(name, 'hook'),
        health: this.calculateHookHealth(hook),
        dependencies: this.extractHookDependencies(hook),
        consumers: this.findHookConsumers(hook, name),
        patterns: this.identifyHookPatterns(hook),
        violations: [],
        recommendations: this.generateHookRecommendations(hook)
      };
    });
    
    return processed;
  }

  /**
   * Process component data
   */
  processComponents(components) {
    const processed = {};
    
    Object.entries(components).forEach(([name, component]) => {
      processed[name] = {
        ...component,
        name,
        displayName: this.formatDisplayName(name, 'component'),
        health: this.calculateComponentHealth(component),
        props: this.extractComponentProps(component),
        dependencies: this.extractComponentDependencies(component),
        violations: [],
        recommendations: this.generateComponentRecommendations(component)
      };
    });
    
    return processed;
  }

  /**
   * Process page data
   */
  processPages(pages) {
    const processed = {};
    
    Object.entries(pages).forEach(([path, page]) => {
      processed[path] = {
        ...page,
        path,
        displayName: this.formatDisplayName(path, 'page'),
        health: this.calculatePageHealth(page),
        route: this.extractRouteInfo(path),
        components: this.extractPageComponents(page),
        violations: [],
        recommendations: this.generatePageRecommendations(page)
      };
    });
    
    return processed;
  }

  /**
   * Process validation data
   */
  processValidationData(rawValidation) {
    if (!rawValidation) return null;

    const processed = {
      summary: this.createValidationSummary(rawValidation),
      contracts: this.processContractViolations(rawValidation.contracts),
      nineRules: this.processNineRulesViolations(rawValidation.nineRules),
      healthScore: this.calculateOverallHealth(rawValidation),
      trends: this.calculateValidationTrends(rawValidation),
      priorities: this.prioritizeViolations(rawValidation)
    };

    return processed;
  }

  /**
   * Calculate various health scores
   */
  calculateTableHealth(table) {
    let score = 100;
    
    // Check for type definition
    if (!table.typeDefinition) score -= 25;
    else if (!table.typeDefinition.hasZodSchema) score -= 10;
    
    // Check for hooks
    if (!table.hooks || table.hooks.length === 0) score -= 20;
    
    // Check for components
    if (!table.components || table.components.length === 0) score -= 20;
    
    // Check for properties
    if (!table.properties || table.properties.length === 0) score -= 15;
    
    // Check for relationships
    if (!table.relationships || table.relationships.length === 0) score -= 10;
    
    // Check for API endpoints
    if (!table.apiEndpoints || table.apiEndpoints.length === 0) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateHookHealth(hook) {
    let score = 100;
    
    // Check for error handling
    if (!hook.hasErrorHandling) score -= 30;
    
    // Check for loading state
    if (!hook.hasLoadingState) score -= 20;
    
    // Check for cache invalidation
    if (!hook.hasCacheInvalidation) score -= 15;
    
    // Check for type safety
    if (!hook.hasTypeDefinition) score -= 20;
    
    // Check for usage
    if (!hook.usedInComponents || hook.usedInComponents.length === 0) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateComponentHealth(component) {
    let score = 100;
    
    // Check for proper props definition
    if (!component.props || component.props.length === 0) score -= 20;
    
    // Check for error boundaries
    if (!component.hasErrorBoundary) score -= 15;
    
    // Check for accessibility
    if (!component.hasAccessibilitySupport) score -= 15;
    
    // Check for testing
    if (!component.hasTests) score -= 25;
    
    // Check for documentation
    if (!component.hasDocumentation) score -= 10;
    
    // Check for performance optimizations
    if (!component.isMemoized && component.isComplex) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  calculatePageHealth(page) {
    let score = 100;
    
    // Check for SEO optimization
    if (!page.hasSEO) score -= 20;
    
    // Check for loading states
    if (!page.hasLoadingState) score -= 15;
    
    // Check for error handling
    if (!page.hasErrorHandling) score -= 25;
    
    // Check for accessibility
    if (!page.hasAccessibility) score -= 20;
    
    // Check for performance
    if (!page.isOptimized) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract relationships between entities
   */
  extractRelationships(data) {
    const relationships = [];
    
    // Table to hook relationships
    Object.entries(data.tables || {}).forEach(([tableName, table]) => {
      if (table.hooks) {
        table.hooks.forEach(hook => {
          relationships.push({
            from: tableName,
            to: this.extractEntityName(hook),
            type: 'table-to-hook',
            strength: 'strong'
          });
        });
      }
    });
    
    // Hook to component relationships
    Object.entries(data.hooks || {}).forEach(([hookName, hook]) => {
      if (hook.usedInComponents) {
        hook.usedInComponents.forEach(comp => {
          relationships.push({
            from: hookName,
            to: this.extractEntityName(comp),
            type: 'hook-to-component',
            strength: 'strong'
          });
        });
      }
    });
    
    return relationships;
  }

  /**
   * Calculate architecture metrics
   */
  calculateArchitectureMetrics(data) {
    const tables = Object.keys(data.tables || {}).length;
    const hooks = Object.keys(data.hooks || {}).length;
    const components = Object.keys(data.components || {}).length;
    const pages = Object.keys(data.pages || {}).length;
    
    return {
      totalEntities: tables + hooks + components + pages,
      tableCount: tables,
      hookCount: hooks,
      componentCount: components,
      pageCount: pages,
      hookToTableRatio: tables > 0 ? hooks / tables : 0,
      componentToHookRatio: hooks > 0 ? components / hooks : 0,
      complexity: this.calculateComplexityScore(data),
      cohesion: this.calculateCohesionScore(data),
      coupling: this.calculateCouplingScore(data)
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  generateTableRecommendations(table) {
    const recommendations = [];
    
    if (!table.typeDefinition) {
      recommendations.push({
        type: 'critical',
        title: 'Add Type Definition',
        description: 'Create a TypeScript interface or Zod schema for type safety',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    if (!table.hooks || table.hooks.length === 0) {
      recommendations.push({
        type: 'warning',
        title: 'Create Data Hooks',
        description: 'Add custom hooks for data fetching and state management',
        impact: 'medium',
        effort: 'high'
      });
    }
    
    if (!table.apiEndpoints || table.apiEndpoints.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Add API Endpoints',
        description: 'Create REST or GraphQL endpoints for this table',
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    return recommendations;
  }

  generateHookRecommendations(hook) {
    const recommendations = [];
    
    if (!hook.hasErrorHandling) {
      recommendations.push({
        type: 'critical',
        title: 'Add Error Handling',
        description: 'Implement proper error catching and user feedback',
        impact: 'high',
        effort: 'low'
      });
    }
    
    if (!hook.hasLoadingState) {
      recommendations.push({
        type: 'warning',
        title: 'Add Loading State',
        description: 'Show loading indicators during async operations',
        impact: 'medium',
        effort: 'low'
      });
    }
    
    if (!hook.hasCacheInvalidation) {
      recommendations.push({
        type: 'info',
        title: 'Implement Cache Invalidation',
        description: 'Add proper cache management for data consistency',
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Utility methods
   */
  formatDisplayName(name, type) {
    switch (type) {
      case 'table':
        return name.charAt(0).toUpperCase() + name.slice(1);
      case 'hook':
        return name.startsWith('use') ? name : `use${name.charAt(0).toUpperCase() + name.slice(1)}`;
      case 'component':
        return name.charAt(0).toUpperCase() + name.slice(1);
      case 'page':
        if (name.includes('(main)')) {
          const parts = name.split('/');
          const mainIdx = parts.findIndex(p => p === '(main)');
          if (mainIdx >= 0 && mainIdx < parts.length - 1) {
            return `(main) > ${parts[mainIdx + 1]}`;
          }
        }
        const parts = name.split('/');
        const pageName = parts[parts.length - 2];
        return pageName === 'app' ? 'Home' : pageName;
      default:
        return name;
    }
  }

  extractEntityName(entity) {
    if (typeof entity === 'string') return entity;
    if (entity?.name) return entity.name;
    if (entity?.path) return entity.path;
    return 'unknown';
  }

  calculateComplexityScore(data) {
    // Simple complexity calculation based on entity relationships
    const totalEntities = Object.keys(data.tables || {}).length +
                          Object.keys(data.hooks || {}).length +
                          Object.keys(data.components || {}).length +
                          Object.keys(data.pages || {}).length;
    
    const relationships = this.extractRelationships(data);
    
    // Normalize to 0-100 scale
    return Math.min(100, (relationships.length / totalEntities) * 50);
  }

  calculateCohesionScore(data) {
    // Higher cohesion = entities are well-grouped and focused
    // This is a simplified calculation
    return 75; // Placeholder
  }

  calculateCouplingScore(data) {
    // Lower coupling = entities are more independent
    // This is a simplified calculation
    return 60; // Placeholder
  }

  /**
   * Trend analysis
   */
  calculateValidationTrends(validationData) {
    // This would typically compare with historical data
    // For now, return placeholder trends
    return {
      healthTrend: 'improving',
      violationsTrend: 'decreasing',
      coverageTrend: 'stable'
    };
  }

  /**
   * Priority scoring for violations
   */
  prioritizeViolations(validationData) {
    const allViolations = [];
    
    // Collect all violations
    if (validationData.contracts?.violations) {
      validationData.contracts.violations.forEach(v => {
        allViolations.push({
          ...v,
          source: 'contract',
          priority: this.calculateViolationPriority(v)
        });
      });
    }
    
    if (validationData.nineRules?.violations) {
      validationData.nineRules.violations.forEach(v => {
        allViolations.push({
          ...v,
          source: 'nineRules',
          priority: this.calculateViolationPriority(v)
        });
      });
    }
    
    // Sort by priority
    return allViolations.sort((a, b) => b.priority - a.priority);
  }

  calculateViolationPriority(violation) {
    let priority = 0;
    
    // Severity weight
    switch (violation.severity?.toLowerCase() || violation.type) {
      case 'error':
      case 'critical':
        priority += 100;
        break;
      case 'warning':
        priority += 50;
        break;
      case 'info':
        priority += 10;
        break;
    }
    
    // Impact weight (based on location)
    if (violation.location) {
      if (violation.location.includes('hook')) priority += 20;
      if (violation.location.includes('component')) priority += 15;
      if (violation.location.includes('page')) priority += 10;
    }
    
    return priority;
  }
}

// Export singleton instance
window.DataProcessor = DataProcessor;
window.dataProcessor = new DataProcessor();