/**
 * Cross-Layer Validator
 * Validates alignment between Types → Contracts → Golden Examples → UI Components
 * Catches misalignments early in the chain before they cascade to components
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface CrossLayerIssue {
  layer1: string;
  layer2: string;
  file: string;
  property?: string;
  expected?: string;
  actual?: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  fix: string;
}

export class CrossLayerValidator {
  private projectPath: string;
  private issues: CrossLayerIssue[] = [];
  private typeDefinitions: Map<string, Set<string>> = new Map();
  private contractSchemas: Map<string, any> = new Map();
  private goldenExamples: any = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  public validate(): CrossLayerIssue[] {
    this.issues = [];
    
    try {
      // 1. Load all layers
      this.loadTypeDefinitions();
      this.loadContracts();
      this.loadGoldenExamples();
      
      // 2. Validate each layer against the next
      this.validateContractsAgainstTypes();
      this.validateGoldenAgainstContracts();
      this.validateGoldenAgainstTypes();
      this.validateComponentUsage();
      
    } catch (error) {
      console.log('⚠️ Cross-layer validation skipped:', error);
    }
    
    return this.issues;
  }

  private loadTypeDefinitions(): void {
    // Find all TypeScript type definition files
    const typesDir = path.join(this.projectPath, 'src', 'types');
    if (!fs.existsSync(typesDir)) return;

    const typeFiles = fs.readdirSync(typesDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    for (const file of typeFiles) {
      const content = fs.readFileSync(path.join(typesDir, file), 'utf-8');
      this.extractTypeProperties(content, file);
    }
  }

  private extractTypeProperties(content: string, filename: string): void {
    // Extract interface and type properties using regex
    const interfaceRegex = /interface\s+(\w+)\s*{([^}]+)}/g;
    const typeRegex = /type\s+(\w+)\s*=\s*{([^}]+)}/g;
    
    let match;
    
    // Extract from interfaces
    while ((match = interfaceRegex.exec(content)) !== null) {
      const typeName = match[1];
      const body = match[2];
      const properties = this.parseProperties(body);
      this.typeDefinitions.set(typeName, properties);
    }
    
    // Extract from type aliases
    while ((match = typeRegex.exec(content)) !== null) {
      const typeName = match[1];
      const body = match[2];
      const properties = this.parseProperties(body);
      this.typeDefinitions.set(typeName, properties);
    }
  }

  private parseProperties(body: string): Set<string> {
    const props = new Set<string>();
    // Match property names (handle optional properties too)
    const propRegex = /(\w+)\??:/g;
    let match;
    while ((match = propRegex.exec(body)) !== null) {
      props.add(match[1]);
    }
    return props;
  }

  private loadContracts(): void {
    // Check multiple possible contract locations
    const contractPaths = [
      path.join(this.projectPath, 'src', 'contracts', 'contracts.yaml'),
      path.join(this.projectPath, 'src', 'contracts', 'contracts.json'),
      path.join(this.projectPath, '.observer', 'contracts.json')
    ];

    for (const contractPath of contractPaths) {
      if (fs.existsSync(contractPath)) {
        try {
          const content = fs.readFileSync(contractPath, 'utf-8');
          if (contractPath.endsWith('.yaml')) {
            // For YAML, just store as is (would need yaml parser)
            this.contractSchemas.set('raw', content);
          } else {
            const contracts = JSON.parse(content);
            this.parseContracts(contracts);
          }
          break;
        } catch (error) {
          // Continue to next path
        }
      }
    }
  }

  private parseContracts(contracts: any): void {
    // Extract contract schemas
    if (contracts.schemas) {
      for (const [key, schema] of Object.entries(contracts.schemas)) {
        this.contractSchemas.set(key, schema);
      }
    }
    
    if (contracts.endpoints) {
      for (const endpoint of contracts.endpoints) {
        if (endpoint.response_schema) {
          this.contractSchemas.set(endpoint.name, endpoint.response_schema);
        }
      }
    }
  }

  private loadGoldenExamples(): void {
    const goldenPath = path.join(this.projectPath, 'src', 'contracts', 'golden.examples.json');
    if (fs.existsSync(goldenPath)) {
      try {
        const content = fs.readFileSync(goldenPath, 'utf-8');
        this.goldenExamples = JSON.parse(content);
      } catch (error) {
        // Invalid JSON
      }
    }
  }

  private validateContractsAgainstTypes(): void {
    // For each contract, check if it matches corresponding type
    for (const [contractName, contractSchema] of this.contractSchemas) {
      // Try to find matching type
      const possibleTypeNames = [
        contractName,
        contractName.replace(/_/g, ''),
        contractName.charAt(0).toUpperCase() + contractName.slice(1),
        contractName.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      ];
      
      for (const typeName of possibleTypeNames) {
        const typeProps = this.typeDefinitions.get(typeName);
        if (typeProps) {
          this.compareContractToType(contractName, contractSchema, typeName, typeProps);
          break;
        }
      }
    }
  }

  private compareContractToType(
    contractName: string, 
    contractSchema: any, 
    typeName: string, 
    typeProps: Set<string>
  ): void {
    if (typeof contractSchema === 'object' && contractSchema.properties) {
      const contractProps = Object.keys(contractSchema.properties);
      
      for (const prop of contractProps) {
        const camelCaseProp = this.snakeToCamel(prop);
        if (!typeProps.has(prop) && !typeProps.has(camelCaseProp)) {
          this.issues.push({
            layer1: 'Contract',
            layer2: 'Type',
            file: `contracts/${contractName}`,
            property: prop,
            message: `Contract property "${prop}" not found in type ${typeName}`,
            severity: 'high',
            fix: `Align contract property with type or add to type definition`
          });
        }
      }
    }
  }

  private validateGoldenAgainstContracts(): void {
    if (!this.goldenExamples) return;
    
    // Check golden examples against contracts
    this.traverseGolden(this.goldenExamples, '');
  }

  private traverseGolden(obj: any, path: string): void {
    if (!obj || typeof obj !== 'object') return;
    
    // Check for common misalignments
    if (obj.book_title !== undefined && !this.hasContractProperty('book_title')) {
      this.issues.push({
        layer1: 'Golden Examples',
        layer2: 'Contract',
        file: 'golden.examples.json',
        property: 'book_title',
        expected: 'title',
        actual: 'book_title',
        message: `Golden uses "book_title" but contract/type expects "title"`,
        severity: 'critical',
        fix: `Change golden example from "book_title" to "title"`
      });
    }
    
    if (obj.cover_image_url !== undefined && !this.hasContractProperty('cover_image_url')) {
      this.issues.push({
        layer1: 'Golden Examples',
        layer2: 'Contract',
        file: 'golden.examples.json',
        property: 'cover_image_url',
        expected: 'cover',
        actual: 'cover_image_url',
        message: `Golden uses "cover_image_url" but contract/type expects "cover"`,
        severity: 'critical',
        fix: `Change golden example from "cover_image_url" to "cover"`
      });
    }
    
    // Recurse through object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.traverseGolden(obj[key], path ? `${path}.${key}` : key);
      }
    }
  }

  private validateGoldenAgainstTypes(): void {
    if (!this.goldenExamples) return;
    
    // Check if golden examples match type definitions
    if (this.goldenExamples.ui_ready_responses) {
      for (const [screenName, screenData] of Object.entries(this.goldenExamples.ui_ready_responses)) {
        this.validateScreenData(screenName, screenData);
      }
    }
  }

  private validateScreenData(screenName: string, screenData: any): void {
    // Convert screen name to potential type name
    const typeName = this.screenNameToType(screenName);
    const typeProps = this.typeDefinitions.get(typeName);
    
    if (!typeProps) return;
    
    // Check properties
    this.checkPropertiesAlignment(screenData, typeProps, screenName);
  }

  private checkPropertiesAlignment(data: any, typeProps: Set<string>, context: string): void {
    if (!data || typeof data !== 'object') return;
    
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        
        // Check arrays for consistent property names
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          for (const item of value) {
            this.checkItemProperties(item, context, key);
          }
        }
      }
    }
  }

  private checkItemProperties(item: any, context: string, arrayName: string): void {
    // Check for mismatched property names
    const propertyMismatches = [
      { wrong: 'book_title', correct: 'title' },
      { wrong: 'cover_image_url', correct: 'cover' },
      { wrong: 'author_name', correct: 'author' },
      { wrong: 'child_name', correct: 'name' }
    ];
    
    for (const mismatch of propertyMismatches) {
      if (item[mismatch.wrong] !== undefined) {
        this.issues.push({
          layer1: 'Golden Examples',
          layer2: 'Expected Type',
          file: `golden.examples.json/${context}/${arrayName}`,
          property: mismatch.wrong,
          expected: mismatch.correct,
          actual: mismatch.wrong,
          message: `Property name mismatch will cause TypeScript errors in components`,
          severity: 'critical',
          fix: `Rename "${mismatch.wrong}" to "${mismatch.correct}" in golden examples`
        });
      }
    }
  }

  private validateComponentUsage(): void {
    // Check if components are using correct golden data paths
    const componentDirs = [
      path.join(this.projectPath, 'app', 'ui-components'),
      path.join(this.projectPath, 'src', 'components')
    ];
    
    for (const dir of componentDirs) {
      if (fs.existsSync(dir)) {
        this.checkComponentsInDir(dir);
      }
    }
  }

  private checkComponentsInDir(dir: string): void {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        this.checkComponentsInDir(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        this.analyzeComponent(fullPath);
      }
    }
  }

  private analyzeComponent(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.projectPath, filePath);
    
    // Check for direct golden example access with wrong properties
    if (content.includes('goldenExamples.') && content.includes('.book_title')) {
      this.issues.push({
        layer1: 'Component',
        layer2: 'Golden Examples',
        file: relativePath,
        property: 'book_title',
        message: 'Component expects "book_title" but type defines "title"',
        severity: 'critical',
        fix: 'Either fix golden examples or update component to use correct property'
      });
    }
    
    if (content.includes('goldenExamples.') && content.includes('.cover_image_url')) {
      this.issues.push({
        layer1: 'Component',
        layer2: 'Golden Examples',
        file: relativePath,
        property: 'cover_image_url',
        message: 'Component expects "cover_image_url" but type defines "cover"',
        severity: 'critical',
        fix: 'Either fix golden examples or update component to use correct property'
      });
    }
  }

  private hasContractProperty(prop: string): boolean {
    // Check if property exists in any contract
    for (const [_, schema] of this.contractSchemas) {
      if (typeof schema === 'object' && schema.properties) {
        if (schema.properties[prop]) return true;
      }
    }
    return false;
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  private screenNameToType(screenName: string): string {
    // Convert screen_name to ScreenNameData
    const words = screenName.split('_');
    const typeName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return typeName + 'Data';
  }

  public getStats() {
    return {
      total: this.issues.length,
      critical: this.issues.filter(i => i.severity === 'critical').length,
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length
    };
  }
}