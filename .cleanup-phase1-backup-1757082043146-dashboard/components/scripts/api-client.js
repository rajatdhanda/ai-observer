/**
 * API Client Script (Business Logic)
 * Handles all API communication and data fetching
 * Provides clean interface for components to consume
 */

class APIClient {
  constructor() {
    this.baseUrl = '';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Generic API fetch with error handling and caching
   */
  async fetchData(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for specific endpoint or all
   */
  clearCache(endpoint = null) {
    if (endpoint) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(endpoint));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Architecture Data APIs
   */
  async getArchitectureData() {
    return this.fetchData('architecture');
  }

  async getEntityData() {
    return this.fetchData('entity-data');
  }

  async getTableData(tableName) {
    return this.fetchData(`tables/${tableName}`);
  }

  async getHookData(hookName) {
    return this.fetchData(`hooks/${hookName}`);
  }

  async getComponentData(componentName) {
    return this.fetchData(`components/${componentName}`);
  }

  async getPageData(pageName) {
    return this.fetchData(`pages/${pageName}`);
  }

  /**
   * Validation APIs
   */
  async getValidationSummary() {
    return this.fetchData('validation-summary');
  }

  async getContractViolations() {
    return this.fetchData('contracts');
  }

  async getNineRulesViolations() {
    return this.fetchData('nine-rules');
  }

  async getValidationReport() {
    return this.fetchData('validation-report');
  }

  /**
   * Health Score APIs
   */
  async getHealthScore() {
    return this.fetchData('health-score');
  }

  async getHealthScoreDetails(entityName, entityType) {
    return this.fetchData(`health-score/${entityType}/${entityName}`);
  }

  /**
   * Project APIs
   */
  async getProjectInfo() {
    return this.fetchData('project-info');
  }

  async switchProject(projectName) {
    const response = await fetch('/api/switch-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: projectName })
    });
    
    if (!response.ok) {
      throw new Error('Failed to switch project');
    }
    
    // Clear cache after project switch
    this.clearCache();
    
    return response.json();
  }

  /**
   * Analysis APIs
   */
  async runValidation() {
    const response = await fetch('/api/validate', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Validation failed');
    }
    
    // Clear relevant cache after validation
    this.clearCache('validation');
    this.clearCache('contracts');
    this.clearCache('nine-rules');
    
    return response.json();
  }

  async runContractTests() {
    const response = await fetch('/api/run-contract-tests', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Contract tests failed');
    }
    
    return response.json();
  }

  async runCodeQualityAnalysis() {
    const response = await fetch('/api/analyze-code-quality', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Code quality analysis failed');
    }
    
    return response.json();
  }

  /**
   * File Monitoring APIs
   */
  async getFileChanges() {
    return this.fetchData('file-changes');
  }

  async watchFiles() {
    // This could be implemented with Server-Sent Events or WebSockets
    // For now, using polling
    return this.getFileChanges();
  }

  /**
   * Export APIs
   */
  async exportReport(format = 'json') {
    const response = await fetch(`/api/export-report?format=${format}`);
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  async saveBaseline() {
    const response = await fetch('/api/save-baseline', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to save baseline');
    }
    
    return response.json();
  }

  /**
   * Risk Analysis APIs
   */
  async getRiskAreas() {
    return this.fetchData('risk-areas');
  }

  async getArchitectureInsights() {
    return this.fetchData('architecture-insights');
  }

  /**
   * Batch operations for efficiency
   */
  async batchFetch(endpoints) {
    const promises = endpoints.map(endpoint => this.fetchData(endpoint));
    const results = await Promise.allSettled(promises);
    
    return endpoints.reduce((acc, endpoint, index) => {
      const result = results[index];
      acc[endpoint] = result.status === 'fulfilled' ? result.value : null;
      return acc;
    }, {});
  }

  /**
   * Real-time updates simulation
   */
  startPolling(callback, interval = 30000) {
    const poll = async () => {
      try {
        const data = await this.getValidationSummary();
        callback(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Initial call
    poll();
    
    // Set up interval
    return setInterval(poll, interval);
  }

  stopPolling(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }

  /**
   * Error recovery
   */
  async retryRequest(endpoint, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.fetchData(endpoint);
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }
}

// Export singleton instance
window.APIClient = APIClient;
window.apiClient = new APIClient();