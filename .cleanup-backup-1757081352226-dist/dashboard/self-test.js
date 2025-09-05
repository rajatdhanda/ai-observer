/**
 * Self-Testing System for Dashboard Components
 * Automatically validates that all components are working correctly
 */

class DashboardSelfTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.isRunning = false;
  }

  async runAllTests() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.results = { passed: 0, failed: 0, tests: [] };
    
    console.log('🧪 Starting Dashboard Self-Test...');
    
    // Component loading tests
    await this.testComponentsLoaded();
    
    // Navigation tests  
    await this.testNavigationButtons();
    
    // Interaction tests
    await this.testExpandableLists();
    
    // Data flow tests
    await this.testDataFlow();
    
    // API tests
    await this.testAPIConnections();
    
    this.isRunning = false;
    this.reportResults();
    
    return this.results;
  }

  async testComponentsLoaded() {
    this.addTest('Components Loaded', 'Testing if all required components are available...');
    
    const requiredComponents = [
      'SidebarNavigator',
      'TableDetailsViewer', 
      'HookDetailsViewer',
      'ValidationService',
      'ControlBar',
      'SeverityBadge',
      'APIClient',
      'DataProcessor'
    ];
    
    const missing = [];
    
    requiredComponents.forEach(component => {
      if (!window[component]) {
        missing.push(component);
      }
    });
    
    if (missing.length === 0) {
      this.passTest('Components Loaded', 'All required components are loaded');
    } else {
      this.failTest('Components Loaded', `Missing components: ${missing.join(', ')}`);
    }
  }

  async testNavigationButtons() {
    this.addTest('Navigation Buttons', 'Testing tab switching functionality...');
    
    try {
      // Test switchTab function exists
      if (!window.switchTab) {
        throw new Error('switchTab function not found');
      }
      
      // Test tab elements exist
      const tabs = document.querySelectorAll('.tab');
      if (tabs.length === 0) {
        throw new Error('No tab elements found');
      }
      
      // Test clicking a tab
      const architectureTab = Array.from(tabs).find(tab => 
        tab.textContent.includes('Architecture')
      );
      
      if (!architectureTab) {
        throw new Error('Architecture tab not found');
      }
      
      // Simulate click
      architectureTab.click();
      
      // Check if content changed
      const mainContent = document.getElementById('mainContent');
      if (mainContent && mainContent.innerHTML.includes('Architecture Overview')) {
        this.passTest('Navigation Buttons', 'Tab switching works correctly');
      } else {
        throw new Error('Tab content did not update');
      }
      
    } catch (error) {
      this.failTest('Navigation Buttons', error.message);
    }
  }

  async testExpandableLists() {
    this.addTest('Expandable Lists', 'Testing expandable list functionality...');
    
    try {
      // Check if expandSection function exists
      if (!window.expandSection) {
        throw new Error('expandSection function not found');
      }
      
      // Look for expandable elements
      const expandableElements = document.querySelectorAll('[onclick*="expandSection"]');
      
      if (expandableElements.length === 0) {
        this.passTest('Expandable Lists', 'No expandable lists found (OK if none exist)');
        return;
      }
      
      // Test clicking an expandable element
      const firstExpandable = expandableElements[0];
      const section = firstExpandable.getAttribute('data-section');
      
      if (!section) {
        throw new Error('Expandable element missing data-section attribute');
      }
      
      // Simulate click
      firstExpandable.click();
      
      this.passTest('Expandable Lists', 'Expandable lists are clickable');
      
    } catch (error) {
      this.failTest('Expandable Lists', error.message);
    }
  }

  async testDataFlow() {
    this.addTest('Data Flow', 'Testing data flow from scripts to components...');
    
    try {
      // Test API client
      if (!window.apiClient) {
        throw new Error('APIClient not available');
      }
      
      // Test data processor
      if (!window.dataProcessor) {
        throw new Error('DataProcessor not available');
      }
      
      // Test entity data provider
      if (!window.entityDataProvider) {
        throw new Error('EntityDataProvider not available');
      }
      
      this.passTest('Data Flow', 'Data flow components are available');
      
    } catch (error) {
      this.failTest('Data Flow', error.message);
    }
  }

  async testAPIConnections() {
    this.addTest('API Connections', 'Testing API endpoint connectivity...');
    
    try {
      // Test a simple API call
      const response = await fetch('/api/project-info');
      
      if (response.ok) {
        const data = await response.json();
        this.passTest('API Connections', `API responding correctly. Project: ${data.name || 'Unknown'}`);
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      this.failTest('API Connections', error.message);
    }
  }

  addTest(name, description) {
    this.results.tests.push({
      name,
      description,
      status: 'running',
      message: description,
      timestamp: new Date()
    });
    
    console.log(`🔄 ${name}: ${description}`);
  }

  passTest(name, message) {
    const test = this.results.tests.find(t => t.name === name);
    if (test) {
      test.status = 'passed';
      test.message = message;
      this.results.passed++;
      console.log(`✅ ${name}: ${message}`);
    }
  }

  failTest(name, message) {
    const test = this.results.tests.find(t => t.name === name);
    if (test) {
      test.status = 'failed';
      test.message = message;
      this.results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }

  reportResults() {
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    console.log('\n📊 Dashboard Self-Test Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n🔧 Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(test => console.log(`   • ${test.name}: ${test.message}`));
    }
    
    return {
      success: this.results.failed === 0,
      successRate,
      ...this.results
    };
  }

  // Method to run continuous testing
  startContinuousTest(intervalMs = 60000) {
    return setInterval(() => {
      this.runAllTests();
    }, intervalMs);
  }

  stopContinuousTest(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

// Export for global use
window.DashboardSelfTest = DashboardSelfTest;
window.dashboardSelfTest = new DashboardSelfTest();

// Auto-run test after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    window.dashboardSelfTest.runAllTests();
  }, 2000); // Wait 2 seconds for everything to load
});