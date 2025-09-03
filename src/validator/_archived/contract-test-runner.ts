/**
 * Contract Test Runner - Postman-Style Testing
 * 
 * Inspired by Postman's approach to API testing, this runner:
 * 1. Runs automated tests against contracts
 * 2. Validates data flow through the application
 * 3. Checks type safety at runtime
 * 4. Generates test reports
 */

import * as fs from 'fs';
import * as path from 'path';
import { TableContractValidator } from './table-contract-validator';
import { ContractValidator } from './contract-validator';
import { NineRulesValidator } from './nine-rules-validator';

export interface TestSuite {
  name: string;
  tests: Test[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface Test {
  name: string;
  type: 'contract' | 'integration' | 'validation' | 'performance';
  run: () => Promise<TestResult>;
  skip?: boolean;
  timeout?: number;
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'error';
  duration: number;
  assertions: Assertion[];
  error?: string;
}

export interface Assertion {
  description: string;
  expected: any;
  actual: any;
  passed: boolean;
  message?: string;
}

export class ContractTestRunner {
  private projectPath: string;
  private suites: TestSuite[] = [];
  private results: Map<string, TestResult[]> = new Map();

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.initializeTestSuites();
  }

  private initializeTestSuites() {
    // Suite 1: Table-Contract Alignment
    this.suites.push({
      name: 'Table-Contract Alignment',
      tests: [
        {
          name: 'All tables have contracts',
          type: 'contract',
          run: async () => this.testTablesHaveContracts()
        },
        {
          name: 'Contract fields match table schema',
          type: 'contract',
          run: async () => this.testContractFieldsMatch()
        },
        {
          name: 'Type compatibility',
          type: 'contract',
          run: async () => this.testTypeCompatibility()
        },
        {
          name: 'Naming conventions',
          type: 'validation',
          run: async () => this.testNamingConventions()
        }
      ]
    });

    // Suite 2: Data Flow Validation
    this.suites.push({
      name: 'Data Flow Validation',
      tests: [
        {
          name: 'Tables have complete data flow',
          type: 'integration',
          run: async () => this.testDataFlowCompleteness()
        },
        {
          name: 'Hooks validate data',
          type: 'validation',
          run: async () => this.testHookValidation()
        },
        {
          name: 'API endpoints have contracts',
          type: 'contract',
          run: async () => this.testAPIContracts()
        }
      ]
    });

    // Suite 3: Code Quality
    this.suites.push({
      name: 'Code Quality',
      tests: [
        {
          name: 'No critical violations',
          type: 'validation',
          run: async () => this.testNoCriticalViolations()
        },
        {
          name: 'Error handling present',
          type: 'validation',
          run: async () => this.testErrorHandling()
        },
        {
          name: 'Loading states implemented',
          type: 'validation',
          run: async () => this.testLoadingStates()
        }
      ]
    });
  }

  async runAll(): Promise<{
    summary: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    };
    suites: {
      name: string;
      results: TestResult[];
    }[];
    recommendations: string[];
  }> {
    const startTime = Date.now();
    const allResults: { name: string; results: TestResult[] }[] = [];
    
    for (const suite of this.suites) {
      console.log(`\n🧪 Running suite: ${suite.name}`);
      
      if (suite.setup) {
        await suite.setup();
      }
      
      const suiteResults: TestResult[] = [];
      
      for (const test of suite.tests) {
        if (test.skip) {
          suiteResults.push({
            name: test.name,
            status: 'skip',
            duration: 0,
            assertions: []
          });
          continue;
        }
        
        const testStart = Date.now();
        try {
          const result = await this.runWithTimeout(test.run(), test.timeout || 5000);
          result.duration = Date.now() - testStart;
          suiteResults.push(result);
          
          const statusIcon = result.status === 'pass' ? '✅' : 
                            result.status === 'fail' ? '❌' : 
                            result.status === 'skip' ? '⏭️' : '⚠️';
          console.log(`  ${statusIcon} ${test.name} (${result.duration}ms)`);
          
        } catch (error) {
          suiteResults.push({
            name: test.name,
            status: 'error',
            duration: Date.now() - testStart,
            assertions: [],
            error: error instanceof Error ? error.message : String(error)
          });
          console.log(`  ⚠️ ${test.name} - Error: ${error}`);
        }
      }
      
      if (suite.teardown) {
        await suite.teardown();
      }
      
      this.results.set(suite.name, suiteResults);
      allResults.push({ name: suite.name, results: suiteResults });
    }
    
    const summary = this.calculateSummary(allResults);
    const recommendations = this.generateRecommendations(allResults);
    
    return {
      summary: {
        ...summary,
        duration: Date.now() - startTime
      },
      suites: allResults,
      recommendations
    };
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
  }

  // Test implementations
  private async testTablesHaveContracts(): Promise<TestResult> {
    const validator = new TableContractValidator(this.projectPath);
    const results = await validator.validate();
    
    const assertions: Assertion[] = [];
    
    assertions.push({
      description: 'All tables should have contracts',
      expected: 0,
      actual: results.summary.tablesWithoutContracts,
      passed: results.summary.tablesWithoutContracts === 0,
      message: `${results.summary.tablesWithoutContracts} tables missing contracts`
    });
    
    return {
      name: 'All tables have contracts',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testContractFieldsMatch(): Promise<TestResult> {
    const validator = new TableContractValidator(this.projectPath);
    const results = await validator.validate();
    
    const assertions: Assertion[] = [];
    
    for (const result of results.results) {
      const failures = result.validations.filter(v => v.status === 'fail');
      assertions.push({
        description: `${result.table} fields match contract`,
        expected: 0,
        actual: failures.length,
        passed: failures.length === 0,
        message: failures.map(f => f.message).join(', ')
      });
    }
    
    return {
      name: 'Contract fields match table schema',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testTypeCompatibility(): Promise<TestResult> {
    const validator = new TableContractValidator(this.projectPath);
    const results = await validator.validate();
    
    const assertions: Assertion[] = [];
    
    for (const result of results.results) {
      const typeMismatches = result.validations.filter(v => 
        v.message.includes('Type mismatch')
      );
      
      if (typeMismatches.length > 0) {
        assertions.push({
          description: `${result.table} type compatibility`,
          expected: 'All types compatible',
          actual: `${typeMismatches.length} type mismatches`,
          passed: false,
          message: typeMismatches.map(t => t.message).join(', ')
        });
      }
    }
    
    if (assertions.length === 0) {
      assertions.push({
        description: 'All types are compatible',
        expected: true,
        actual: true,
        passed: true
      });
    }
    
    return {
      name: 'Type compatibility',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testNamingConventions(): Promise<TestResult> {
    const validator = new TableContractValidator(this.projectPath);
    const results = await validator.validate();
    
    const assertions: Assertion[] = [];
    
    for (const result of results.results) {
      const namingIssues = result.validations.filter(v => 
        v.message.includes('naming convention')
      );
      
      assertions.push({
        description: `${result.table} naming conventions`,
        expected: 0,
        actual: namingIssues.length,
        passed: namingIssues.length === 0,
        message: namingIssues.length > 0 ? 
          `${namingIssues.length} naming inconsistencies` : 'Consistent naming'
      });
    }
    
    return {
      name: 'Naming conventions',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testDataFlowCompleteness(): Promise<TestResult> {
    const contractValidator = new ContractValidator(this.projectPath);
    const results = await contractValidator.validate();
    
    const assertions: Assertion[] = [{
      description: 'Data flow validation score',
      expected: 80,
      actual: results.score,
      passed: results.score >= 80,
      message: `Current score: ${results.score}%`
    }];
    
    return {
      name: 'Tables have complete data flow',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testHookValidation(): Promise<TestResult> {
    const validator = new NineRulesValidator(this.projectPath);
    const results = await validator.validateAll();
    
    const rule2 = results.results.find(r => r.ruleNumber === 2);
    const assertions: Assertion[] = [];
    
    if (rule2) {
      assertions.push({
        description: 'Hooks validate data properly',
        expected: 0,
        actual: rule2.issues?.length || 0,
        passed: !rule2.issues || rule2.issues.length === 0,
        message: rule2.issues?.length ? 
          `${rule2.issues.length} hooks missing validation` : 'All hooks validate data'
      });
    }
    
    return {
      name: 'Hooks validate data',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testAPIContracts(): Promise<TestResult> {
    const validator = new ContractValidator(this.projectPath);
    const results = await validator.validate();
    
    const apiViolations = results.violations.filter(v => 
      v.location.includes('/api/')
    );
    
    const assertions: Assertion[] = [{
      description: 'API endpoints follow contracts',
      expected: 0,
      actual: apiViolations.length,
      passed: apiViolations.length === 0,
      message: apiViolations.length > 0 ? 
        `${apiViolations.length} API contract violations` : 'All APIs follow contracts'
    }];
    
    return {
      name: 'API endpoints have contracts',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testNoCriticalViolations(): Promise<TestResult> {
    const validator = new NineRulesValidator(this.projectPath);
    const results = await validator.validateAll();
    
    let criticalCount = 0;
    results.results.forEach(rule => {
      if (rule.issues) {
        criticalCount += rule.issues.filter(i => i.severity === 'critical').length;
      }
    });
    
    const assertions: Assertion[] = [{
      description: 'No critical code quality violations',
      expected: 0,
      actual: criticalCount,
      passed: criticalCount === 0,
      message: criticalCount > 0 ? 
        `${criticalCount} critical violations found` : 'No critical violations'
    }];
    
    return {
      name: 'No critical violations',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testErrorHandling(): Promise<TestResult> {
    const validator = new NineRulesValidator(this.projectPath);
    const results = await validator.validateAll();
    
    const rule3 = results.results.find(r => r.ruleNumber === 3);
    const assertions: Assertion[] = [];
    
    if (rule3) {
      const missingErrorHandling = rule3.issues?.filter(i => 
        i.message.includes('error handling')
      ).length || 0;
      
      assertions.push({
        description: 'Error handling coverage',
        expected: 0,
        actual: missingErrorHandling,
        passed: missingErrorHandling === 0,
        message: missingErrorHandling > 0 ? 
          `${missingErrorHandling} components missing error handling` : 'All components handle errors'
      });
    }
    
    return {
      name: 'Error handling present',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private async testLoadingStates(): Promise<TestResult> {
    const validator = new NineRulesValidator(this.projectPath);
    const results = await validator.validateAll();
    
    const rule5 = results.results.find(r => r.ruleNumber === 5);
    const assertions: Assertion[] = [];
    
    if (rule5) {
      const missingLoading = rule5.issues?.length || 0;
      
      assertions.push({
        description: 'Loading states implemented',
        expected: 0,
        actual: missingLoading,
        passed: missingLoading === 0,
        message: missingLoading > 0 ? 
          `${missingLoading} components missing loading states` : 'All components have loading states'
      });
    }
    
    return {
      name: 'Loading states implemented',
      status: assertions.every(a => a.passed) ? 'pass' : 'fail',
      duration: 0,
      assertions
    };
  }

  private calculateSummary(results: { name: string; results: TestResult[] }[]) {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    results.forEach(suite => {
      suite.results.forEach(test => {
        total++;
        if (test.status === 'pass') passed++;
        else if (test.status === 'fail') failed++;
        else if (test.status === 'skip') skipped++;
      });
    });
    
    return { total, passed, failed, skipped };
  }

  private generateRecommendations(results: { name: string; results: TestResult[] }[]): string[] {
    const recommendations: string[] = [];
    
    results.forEach(suite => {
      const failures = suite.results.filter(r => r.status === 'fail');
      
      if (failures.length > 0) {
        if (suite.name === 'Table-Contract Alignment') {
          recommendations.push('📋 Update contracts to match table schemas');
          recommendations.push('🔄 Align naming conventions between database and API');
        } else if (suite.name === 'Data Flow Validation') {
          recommendations.push('🔗 Implement missing hooks for data fetching');
          recommendations.push('✅ Add validation to all data transformation points');
        } else if (suite.name === 'Code Quality') {
          recommendations.push('🐛 Fix critical violations immediately');
          recommendations.push('⏳ Add loading states to improve UX');
        }
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 Excellent! All tests passing. Keep up the good work!');
    }
    
    return recommendations;
  }
}