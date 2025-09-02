/**
 * Validator Test Suite
 * Tests all validators to ensure they're reporting accurate results
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationTest {
  name: string;
  file: string;
  expectedErrors: string[];
  expectedWarnings: string[];
  actualErrors?: string[];
  actualWarnings?: string[];
  passed?: boolean;
}

export class ValidatorTester {
  private projectPath: string;
  private testResults: ValidationTest[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async runAllTests() {
    console.log('\n🧪 Running Validator Test Suite\n');
    console.log('=' .repeat(60));
    
    // Test Contract Validator
    await this.testContractValidator();
    
    // Test Code Quality (Nine Rules) Validator
    await this.testCodeQualityValidator();
    
    // Test Table Validator
    await this.testTableValidator();
    
    // Generate report
    this.generateReport();
  }

  private async testContractValidator() {
    console.log('\n📋 Testing Contract Validator\n');
    
    // Test case 1: useProfessionals hook
    const useProfessionalsTest: ValidationTest = {
      name: 'useProfessionals Hook',
      file: 'src/hooks/useProfessionals.ts',
      expectedErrors: [],  // Should have NO contract errors after fix
      expectedWarnings: []
    };
    
    // Fetch actual violations
    const response = await fetch('http://localhost:3001/api/contracts');
    const data = await response.json() as any;
    
    const useProfViolations = data.violations?.filter((v: any) => 
      v.location.includes('useProfessionals')
    );
    
    useProfessionalsTest.actualErrors = useProfViolations?.filter((v: any) => v.type === 'error').map((v: any) => v.message) || [];
    useProfessionalsTest.actualWarnings = useProfViolations?.filter((v: any) => v.type === 'warning').map((v: any) => v.message) || [];
    useProfessionalsTest.passed = 
      useProfessionalsTest.actualErrors!.length === useProfessionalsTest.expectedErrors.length &&
      useProfessionalsTest.actualWarnings!.length === useProfessionalsTest.expectedWarnings.length;
    
    this.testResults.push(useProfessionalsTest);
    
    // Test case 2: Check for false positives
    const falsePositiveTest: ValidationTest = {
      name: 'No False Positives (substring matching)',
      file: 'Various files',
      expectedErrors: [],  // validateProfessional should NOT trigger 'date' error
      expectedWarnings: []
    };
    
    // Check if "date" appears as false positive in validateProfessional
    const dateViolations = data.violations?.filter((v: any) => 
      v.actual === 'date' && 
      (v.location.includes('validateProfessional') || v.location.includes('validatedProfessionals'))
    );
    
    falsePositiveTest.actualErrors = dateViolations?.map((v: any) => `False positive: ${v.location}`) || [];
    falsePositiveTest.actualWarnings = [];
    falsePositiveTest.passed = !dateViolations || dateViolations.length === 0;
    
    this.testResults.push(falsePositiveTest);
  }

  private async testCodeQualityValidator() {
    console.log('\n🔍 Testing Code Quality Validator\n');
    
    // Test case 1: Check specific rules
    const response = await fetch('http://localhost:3001/api/nine-rules');
    const data = await response.json() as any;
    
    // Test Rule 2: Hook-Database Pattern
    const hookDbTest: ValidationTest = {
      name: 'Rule 2: Hook-Database Pattern',
      file: 'src/hooks/*',
      expectedErrors: [],  // We'll validate against actual code
      expectedWarnings: []
    };
    
    const rule2 = data.results.find((r: any) => r.ruleNumber === 2);
    if (rule2) {
      // Check if hooks have proper error handling
      const hooksWithoutError = rule2.issues?.filter((i: any) => 
        i.message.includes('error handling')
      ) || [];
      
      hookDbTest.actualErrors = hooksWithoutError.filter((i: any) => i.severity === 'critical').map((i: any) => i.file);
      hookDbTest.actualWarnings = hooksWithoutError.filter((i: any) => i.severity === 'warning').map((i: any) => i.file);
      
      // Verify by checking actual file content
      for (const issue of hooksWithoutError) {
        const filePath = path.join(this.projectPath, issue.file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const hasErrorHandling = /error|Error|catch|\.catch\(|onError/i.test(content);
          if (hasErrorHandling) {
            console.log(`  ⚠️  False positive: ${issue.file} actually has error handling`);
          }
        }
      }
    }
    
    this.testResults.push(hookDbTest);
    
    // Test Rule 5: Loading States
    const loadingStateTest: ValidationTest = {
      name: 'Rule 5: Loading States',
      file: 'src/hooks/*',
      expectedErrors: [],
      expectedWarnings: []
    };
    
    const rule5 = data.results.find((r: any) => r.ruleNumber === 5);
    if (rule5) {
      loadingStateTest.actualErrors = rule5.issues?.filter((i: any) => i.severity === 'critical').map((i: any) => i.file) || [];
      loadingStateTest.actualWarnings = rule5.issues?.filter((i: any) => i.severity === 'warning').map((i: any) => i.file) || [];
    }
    
    this.testResults.push(loadingStateTest);
  }

  private async testTableValidator() {
    console.log('\n📊 Testing Table Validator\n');
    
    const response = await fetch('http://localhost:3001/api/table-mapping');
    const data = await response.json() as any;
    
    // Test each table's score calculation
    for (const [tableName, table] of Object.entries(data.tables || {})) {
      const tableData = table as any;
      
      const tableTest: ValidationTest = {
        name: `Table: ${tableName}`,
        file: `Table mapping for ${tableName}`,
        expectedErrors: [],
        expectedWarnings: []
      };
      
      // Validate score calculation
      let calculatedScore = 0;
      let maxScore = 0;
      
      // Type definition (20 points)
      maxScore += 20;
      if (tableData.typeDefinition) {
        calculatedScore += 10;
        if (tableData.typeDefinition.hasZodSchema) calculatedScore += 10;
      }
      
      // Database queries (20 points)
      maxScore += 20;
      if (tableData.databaseQueries?.length > 0) {
        calculatedScore += 10;
        if (tableData.databaseQueries.some((q: any) => q.hasValidation)) calculatedScore += 10;
      }
      
      // Hooks (20 points)
      maxScore += 20;
      if (tableData.hooks?.length > 0) {
        calculatedScore += 10;
        if (tableData.hooks.some((h: any) => h.hasErrorHandling && h.hasLoadingState)) calculatedScore += 10;
      }
      
      // Components (20 points)
      maxScore += 20;
      if (tableData.components?.length > 0) {
        calculatedScore += 10;
        if (!tableData.components.some((c: any) => c.directDBAccess)) calculatedScore += 10;
      }
      
      // API validation (10 points)
      if (tableData.apiEndpoints?.length > 0) {
        maxScore += 10;
        if (tableData.apiEndpoints.some((e: any) => e.hasValidation)) calculatedScore += 10;
      }
      
      // Cache invalidation (10 points)
      if (tableData.mutations?.length > 0) {
        maxScore += 10;
        if (tableData.mutations.some((m: any) => m.hasCacheInvalidation)) calculatedScore += 10;
      }
      
      const expectedScore = maxScore > 0 ? Math.round((calculatedScore / maxScore) * 100) : 0;
      
      if (Math.abs(tableData.score - expectedScore) > 1) {
        tableTest.actualErrors = [`Score mismatch: reported ${tableData.score}, calculated ${expectedScore}`];
      } else {
        tableTest.actualErrors = [];
      }
      
      tableTest.actualWarnings = tableData.dataFlow?.missingLinks || [];
      tableTest.passed = tableTest.actualErrors.length === 0;
      
      this.testResults.push(tableTest);
    }
  }

  private generateReport() {
    console.log('\n📊 Validation Test Report\n');
    console.log('=' .repeat(60));
    
    let totalTests = this.testResults.length;
    let passedTests = this.testResults.filter(t => t.passed).length;
    let failedTests = totalTests - passedTests;
    
    console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    
    if (failedTests > 0) {
      console.log('\n🔴 Failed Tests:\n');
      this.testResults.filter(t => !t.passed).forEach(test => {
        console.log(`  ${test.name}`);
        if (test.actualErrors && test.actualErrors.length > 0) {
          console.log(`    Errors: ${test.actualErrors.join(', ')}`);
        }
        if (test.actualWarnings && test.actualWarnings.length > 0) {
          console.log(`    Warnings: ${test.actualWarnings.join(', ')}`);
        }
      });
    }
    
    // Save detailed report
    const reportPath = path.join(this.projectPath, 'validation-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new ValidatorTester(process.cwd());
  tester.runAllTests().catch(console.error);
}