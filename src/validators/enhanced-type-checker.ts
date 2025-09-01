import { Project, SourceFile, InterfaceDeclaration, PropertySignature } from 'ts-morph';
import chalk from 'chalk';
import { SchemaRegistry } from './schema-registry';
import { SchemaLoader } from './schema-loader';
import * as path from 'path';

export interface TypeMismatch {
  field: string;
  expected: string;
  found: string;
}

export interface EnhancedTypeIssue {
  file: string;
  line: number;
  type: 'new-interface' | 'new-type' | 'type-mismatch' | 'missing-field' | 'extra-field';
  message: string;
  interfaceName?: string;
  mismatches?: TypeMismatch[];
}

export class EnhancedTypeChecker {
  private project: Project;
  private registry: SchemaRegistry;
  private issues: EnhancedTypeIssue[] = [];

  constructor(registry: SchemaRegistry) {
    this.project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
    this.registry = registry;
  }

  checkFile(filePath: string): EnhancedTypeIssue[] {
    this.issues = [];
    
    // Skip schema files
    if (filePath.includes('schemas.ts') || filePath.includes('schema.ts')) {
      return this.issues;
    }
    
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const interfaces = sourceFile.getInterfaces();
    
    interfaces.forEach(interfaceDecl => {
      this.checkInterface(interfaceDecl, filePath);
    });
    
    return this.issues;
  }

  private checkInterface(interfaceDecl: InterfaceDeclaration, filePath: string) {
    const interfaceName = interfaceDecl.getName();
    const schemaInfo = this.registry.getSchema(interfaceName);
    
    if (!schemaInfo) {
      // No matching schema - this is a new interface
      this.issues.push({
        file: filePath,
        line: interfaceDecl.getStartLineNumber(),
        type: 'new-interface',
        message: `Interface '${interfaceName}' not found in schemas`,
        interfaceName
      });
      return;
    }
    
    // Compare interface properties with schema fields
    const interfaceProps = new Map<string, string>();
    interfaceDecl.getProperties().forEach(prop => {
      const propName = prop.getName();
      const propType = this.getPropertyType(prop);
      interfaceProps.set(propName, propType);
    });
    
    const mismatches: TypeMismatch[] = [];
    
    // Check for type mismatches
    schemaInfo.fields.forEach((expectedType, fieldName) => {
      const foundType = interfaceProps.get(fieldName);
      
      if (!foundType) {
        mismatches.push({
          field: fieldName,
          expected: expectedType,
          found: 'missing'
        });
      } else if (!this.typesMatch(expectedType, foundType)) {
        mismatches.push({
          field: fieldName,
          expected: expectedType,
          found: foundType
        });
      }
    });
    
    // Check for extra fields
    interfaceProps.forEach((type, fieldName) => {
      if (!schemaInfo.fields.has(fieldName)) {
        mismatches.push({
          field: fieldName,
          expected: 'not in schema',
          found: type
        });
      }
    });
    
    if (mismatches.length > 0) {
      this.issues.push({
        file: filePath,
        line: interfaceDecl.getStartLineNumber(),
        type: 'type-mismatch',
        message: `Interface '${interfaceName}' doesn't match schema`,
        interfaceName,
        mismatches
      });
    }
  }

  private getPropertyType(prop: PropertySignature): string {
    const typeNode = prop.getTypeNode();
    if (!typeNode) return 'any';
    
    const typeText = typeNode.getText();
    
    // Simplify type text for comparison
    if (typeText.includes('[]')) return 'array';
    if (typeText === 'string') return 'string';
    if (typeText === 'number') return 'number';
    if (typeText === 'boolean') return 'boolean';
    if (typeText.includes('{')) return 'object';
    
    return typeText;
  }

  private typesMatch(expected: string, found: string): boolean {
    // Simple matching for now
    if (expected === found) return true;
    if (expected === 'array' && found === 'array') return true;
    if (expected === 'object' && found === 'object') return true;
    if (expected.includes('optional') && found !== 'missing') return true;
    
    return false;
  }

  printIssues(issues: EnhancedTypeIssue[]) {
    if (issues.length === 0) {
      console.log(chalk.green('✅ No issues found!'));
      return;
    }

    console.log(chalk.red(`\n❌ Found ${issues.length} issue(s):\n`));
    
    issues.forEach(issue => {
      console.log(chalk.yellow(`${issue.file}:${issue.line}`));
      console.log(chalk.red(`  ${issue.message}`));
      
      if (issue.mismatches && issue.mismatches.length > 0) {
        issue.mismatches.forEach(mismatch => {
          if (mismatch.found === 'missing') {
            console.log(chalk.gray(`    ${mismatch.field}: missing (expected ${mismatch.expected})`));
          } else if (mismatch.expected === 'not in schema') {
            console.log(chalk.gray(`    ${mismatch.field}: extra field (${mismatch.found})`));
          } else {
            console.log(chalk.gray(`    ${mismatch.field}: ${mismatch.found} (expected ${mismatch.expected})`));
          }
        });
      }
      console.log();
    });
  }
}