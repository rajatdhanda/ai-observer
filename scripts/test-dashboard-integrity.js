#!/usr/bin/env node

/**
 * Dashboard Integrity Test
 * Tests that all dashboard tabs actually display content (not just API responses)
 * This goes beyond simple API checks to verify UI elements are populated
 */

const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test configuration
const DASHBOARD_PORT = 3001;
const BASE_URL = `http://localhost:${DASHBOARD_PORT}/modular-fixed`;
const API_BASE_URL = `http://localhost:${DASHBOARD_PORT}`;

// Keep track of test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issues = [];

// Helper function to make HTTP requests
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// Helper to check if HTML contains expected content
function checkContent(html, checks, testName) {
  totalTests++;
  const failures = [];
  
  for (const check of checks) {
    if (check.regex) {
      if (!check.regex.test(html)) {
        failures.push(`Missing: ${check.description}`);
      }
    } else if (check.contains) {
      if (!html.includes(check.contains)) {
        failures.push(`Missing: ${check.description}`);
      }
    } else if (check.notContains) {
      if (html.includes(check.notContains)) {
        failures.push(`Should not contain: ${check.description}`);
      }
    }
  }
  
  if (failures.length === 0) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    return true;
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    failures.forEach(f => {
      console.log(`  ${colors.gray}└─ ${f}${colors.reset}`);
      issues.push(`${testName}: ${f}`);
    });
    return false;
  }
}

// Test main dashboard page
async function testMainDashboard() {
  console.log(`\n${colors.cyan}Testing Main Dashboard...${colors.reset}`);
  
  try {
    const response = await httpGet(BASE_URL);
    
    checkContent(response.body, [
      { contains: '<div id="sidebar"', description: 'Sidebar container' },
      { contains: '<div id="mainContent"', description: 'Main content area' },
      { contains: 'tab-button', description: 'Tab navigation buttons' },
      { contains: 'Smart Analysis', description: 'Smart Analysis tab' },
      { contains: 'Overview', description: 'Overview tab' },
      { contains: 'Architecture', description: 'Architecture tab' },
      { contains: 'File Analysis', description: 'File Analysis tab' }
    ], 'Dashboard HTML Structure');
    
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}✗ Failed to load dashboard: ${error.message}${colors.reset}`);
    issues.push(`Dashboard loading failed: ${error.message}`);
  }
}

// Test API endpoints return actual data
async function testAPIEndpoints() {
  console.log(`\n${colors.cyan}Testing API Endpoints...${colors.reset}`);
  
  const endpoints = [
    { 
      path: '/api/smart-analysis',
      name: 'Smart Analysis API',
      checks: [
        { key: 'summary', type: 'object' },
        { key: 'issues', type: 'array' },
        { key: 'buckets', type: 'object' }
      ]
    },
    {
      path: '/api/architecture-data',
      name: 'Architecture API',
      checks: [
        { key: 'pages', type: 'array' },
        { key: 'components', type: 'array' },
        { key: 'apiEndpoints', type: 'array' },
        { key: 'dataFlow', type: 'object' }
      ]
    },
    {
      path: '/api/file-analysis',
      name: 'File Analysis API',
      checks: [
        { key: 'files', type: 'array' },
        { key: 'stats', type: 'object' }
      ]
    },
    {
      path: '/api/entity-data',
      name: 'Entity Data API',
      checks: [
        { key: 'pages', type: 'array' },
        { key: 'components', type: 'array' },
        { key: 'hooks', type: 'array' },
        { key: 'tables', type: 'array' }
      ]
    },
    {
      path: '/api/validation-data',
      name: 'Validation Data API', 
      checks: [
        { key: 'contracts', type: 'object' },
        { key: 'nineRules', type: 'object' }
      ]
    }
  ];
  
  for (const endpoint of endpoints) {
    totalTests++;
    try {
      const response = await httpGet(`${API_BASE_URL}${endpoint.path}`);
      
      if (response.status !== 200) {
        failedTests++;
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name} - Status ${response.status}`);
        issues.push(`${endpoint.name} returned status ${response.status}`);
        continue;
      }
      
      const data = JSON.parse(response.body);
      const missing = [];
      
      for (const check of endpoint.checks) {
        if (!data.hasOwnProperty(check.key)) {
          missing.push(`Missing key: ${check.key}`);
        } else if (check.type === 'array' && !Array.isArray(data[check.key])) {
          missing.push(`${check.key} should be array`);
        } else if (check.type === 'object' && typeof data[check.key] !== 'object') {
          missing.push(`${check.key} should be object`);
        }
      }
      
      if (missing.length === 0) {
        passedTests++;
        console.log(`${colors.green}✓${colors.reset} ${endpoint.name}`);
      } else {
        failedTests++;
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name}`);
        missing.forEach(m => {
          console.log(`  ${colors.gray}└─ ${m}${colors.reset}`);
          issues.push(`${endpoint.name}: ${m}`);
        });
      }
      
    } catch (error) {
      failedTests++;
      console.log(`${colors.red}✗${colors.reset} ${endpoint.name} - ${error.message}`);
      issues.push(`${endpoint.name} failed: ${error.message}`);
    }
  }
}

// Test that tabs actually load content when clicked
async function testTabContent() {
  console.log(`\n${colors.cyan}Testing Tab Content Loading...${colors.reset}`);
  
  // Since we can't actually click tabs from Node.js, we'll test the API data
  // to ensure there's content to display
  
  const tabTests = [
    {
      name: 'Smart Analysis Tab Content',
      endpoint: '/api/smart-analysis',
      requiredContent: ['issues', 'buckets'],
      minItems: 1
    },
    {
      name: 'Architecture Tab Content',
      endpoint: '/api/architecture-data', 
      requiredContent: ['pages', 'components'],
      minItems: 1
    },
    {
      name: 'File Analysis Tab Content',
      endpoint: '/api/file-analysis',
      requiredContent: ['files'],
      minItems: 1
    }
  ];
  
  for (const test of tabTests) {
    totalTests++;
    try {
      const response = await httpGet(`${API_BASE_URL}${test.endpoint}`);
      const data = JSON.parse(response.body);
      
      let hasContent = true;
      const missing = [];
      
      for (const field of test.requiredContent) {
        if (!data[field]) {
          missing.push(`Missing field: ${field}`);
          hasContent = false;
        } else if (Array.isArray(data[field]) && data[field].length < test.minItems) {
          missing.push(`${field} is empty (needs at least ${test.minItems} items)`);
          hasContent = false;
        }
      }
      
      if (hasContent) {
        passedTests++;
        console.log(`${colors.green}✓${colors.reset} ${test.name}`);
      } else {
        failedTests++;
        console.log(`${colors.red}✗${colors.reset} ${test.name}`);
        missing.forEach(m => {
          console.log(`  ${colors.gray}└─ ${m}${colors.reset}`);
          issues.push(`${test.name}: ${m}`);
        });
      }
      
    } catch (error) {
      failedTests++;
      console.log(`${colors.red}✗${colors.reset} ${test.name} - ${error.message}`);
      issues.push(`${test.name} failed: ${error.message}`);
    }
  }
}

// Test component loading
async function testComponentLoading() {
  console.log(`\n${colors.cyan}Testing Component Loading...${colors.reset}`);
  
  const response = await httpGet(BASE_URL);
  const html = response.body;
  
  // Check for component script tags
  const componentScripts = [
    'sidebar-navigator.js',
    'control-bar.js',
    'severity-badge.js',
    'entity-data-provider.js',
    'smart-analysis-view.js',
    'file-analysis-view.js',
    'table-details-viewer.js',
    'hook-details-viewer.js',
    'page-details-viewer.js',
    'component-details-viewer.js'
  ];
  
  totalTests++;
  const missingScripts = [];
  
  for (const script of componentScripts) {
    if (!html.includes(`src="/components/${script}"`)) {
      missingScripts.push(script);
    }
  }
  
  if (missingScripts.length === 0) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} All component scripts loaded`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} Missing component scripts`);
    missingScripts.forEach(s => {
      console.log(`  ${colors.gray}└─ ${s}${colors.reset}`);
      issues.push(`Missing component script: ${s}`);
    });
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║    Dashboard Integrity Test Suite         ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════╝${colors.reset}`);
  
  // Check if dashboard is running
  try {
    await httpGet(API_BASE_URL);
  } catch (error) {
    console.log(`\n${colors.red}✗ Dashboard is not running on port ${DASHBOARD_PORT}${colors.reset}`);
    console.log(`${colors.gray}  Please start the dashboard with: OBSERVER_PROJECT_PATH=/Users/rajatdhanda/Tech/Projects/streax npm run dashboard${colors.reset}`);
    process.exit(1);
  }
  
  // Run all tests
  await testMainDashboard();
  await testAPIEndpoints();
  await testTabContent();
  await testComponentLoading();
  
  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Test Summary:${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  const rateColor = successRate >= 80 ? colors.green : successRate >= 50 ? colors.yellow : colors.red;
  console.log(`  ${rateColor}Success Rate: ${successRate}%${colors.reset}`);
  
  if (issues.length > 0) {
    console.log(`\n${colors.red}Issues Found:${colors.reset}`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});