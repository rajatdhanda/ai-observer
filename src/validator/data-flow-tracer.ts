/**
 * Generic Data Flow Tracer
 * Tracks how data flows from database -> hooks -> components
 * Works with ANY database schema/types in the standard folder structure
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface DataFlowNode {
  id: string;
  type: 'type' | 'table' | 'hook' | 'component' | 'api' | 'form';
  name: string;
  file: string;
  line?: number;
  
  // What this node works with
  dataType?: string;        // The TypeScript type name
  tableName?: string;        // The database table name
  fields?: string[];         // Field names this node uses
  
  // Connections
  sources: string[];         // IDs of nodes that provide data to this
  consumers: string[];       // IDs of nodes that consume data from this
  
  // Validation results
  issues?: FlowIssue[];
}

export interface FlowIssue {
  severity: 'error' | 'warning';
  type: 'type-mismatch' | 'field-mismatch' | 'table-mismatch' | 'missing-validation';
  message: string;
  expected?: string;
  actual?: string;
  suggestion: string;
}

export interface DataFlowGraph {
  nodes: Map<string, DataFlowNode>;
  edges: Array<{
    from: string;
    to: string;
    dataType?: string;
    isValid: boolean;
  }>;
  issues: FlowIssue[];
}

export class DataFlowTracer {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private projectPath: string;
  private graph: DataFlowGraph;
  
  constructor(projectPath: string) {
    this.projectPath = projectPath;
    
    // Initialize TypeScript program
    const configPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');
    if (configPath) {
      const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
      const { options, fileNames } = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        projectPath
      );
      this.program = ts.createProgram(fileNames, options);
      this.checker = this.program.getTypeChecker();
    } else {
      this.program = ts.createProgram([], {});
      this.checker = this.program.getTypeChecker();
    }
    
    this.graph = {
      nodes: new Map(),
      edges: [],
      issues: []
    };
  }

  /**
   * Main analysis function - traces complete data flow
   */
  async analyze(): Promise<DataFlowGraph> {
    console.log('🔍 Tracing data flow through application...');
    
    // Step 1: Discover all types/interfaces (these define the shape of data)
    await this.discoverTypes();
    
    // Step 2: Find database operations (source of data)
    await this.discoverDatabaseOperations();
    
    // Step 3: Find hooks (data fetching layer)
    await this.discoverHooks();
    
    // Step 4: Find components (data consumption layer)
    await this.discoverComponents();
    
    // Step 5: Find API endpoints
    await this.discoverAPIEndpoints();
    
    // Step 6: Connect the graph - trace how data flows
    await this.connectDataFlow();
    
    // Step 7: Validate the flow - find mismatches
    await this.validateDataFlow();
    
    return this.graph;
  }

  /**
   * Step 1: Discover all type definitions
   */
  private async discoverTypes() {
    const typeFiles = this.findFiles(['src/types', 'types', 'app/types'], ['.ts', '.tsx']);
    
    for (const file of typeFiles) {
      const sourceFile = this.program.getSourceFile(file);
      if (!sourceFile) continue;
      
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
          const typeName = node.name?.getText();
          if (!typeName) return;
          
          // Extract fields from the type
          const fields = this.extractFieldsFromType(node);
          
          const typeNode: DataFlowNode = {
            id: `type:${typeName}`,
            type: 'type',
            name: typeName,
            file,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            dataType: typeName,
            fields,
            sources: [],
            consumers: []
          };
          
          this.graph.nodes.set(typeNode.id, typeNode);
        }
      });
    }
  }

  /**
   * Step 2: Find all database operations
   */
  private async discoverDatabaseOperations() {
    const dbFiles = this.findFiles(
      ['src/lib/db', 'lib/db', 'src/db', 'db', 'src/supabase', 'src/services'],
      ['.ts', '.tsx']
    );
    
    for (const file of dbFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = this.program.getSourceFile(file);
      if (!sourceFile) continue;
      
      // Find table references (generic patterns)
      const tablePatterns = [
        /from\(['"`](\w+)['"`]\)/g,           // Supabase: from('users')
        /db\.(\w+)\./g,                        // Prisma: db.users.
        /model\s+(\w+)\s*{/g,                  // Prisma schema
        /collection\(['"`](\w+)['"`]\)/g,      // Firebase
        /Table\.(\w+)/g,                       // Custom ORM
      ];
      
      for (const pattern of tablePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const tableName = match[1];
          
          // Try to find what type this query returns
          const returnType = this.inferReturnType(content, match.index);
          
          const dbNode: DataFlowNode = {
            id: `db:${tableName}:${file}:${match.index}`,
            type: 'table',
            name: `${tableName} query`,
            file,
            tableName,
            dataType: returnType || this.inferTypeFromTableName(tableName),
            fields: this.extractFieldsFromQuery(content, match.index),
            sources: [],
            consumers: []
          };
          
          this.graph.nodes.set(dbNode.id, dbNode);
        }
      }
    }
  }

  /**
   * Step 3: Discover hooks and their data dependencies
   */
  private async discoverHooks() {
    const hookFiles = this.findFiles(
      ['src/hooks', 'hooks', 'app/hooks', 'src/lib/hooks'],
      ['.ts', '.tsx']
    );
    
    // Also find hooks by name pattern
    const allFiles = this.findFiles(['src', 'app'], ['.ts', '.tsx']);
    const useFiles = allFiles.filter(f => path.basename(f).startsWith('use'));
    hookFiles.push(...useFiles);
    
    for (const file of hookFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = this.program.getSourceFile(file);
      if (!sourceFile) continue;
      
      // Find hook definitions
      const hookPattern = /export\s+(?:const|function)\s+(use\w+)/g;
      let match;
      
      while ((match = hookPattern.exec(content)) !== null) {
        const hookName = match[1];
        
        // Find what table/data this hook works with
        const tableName = this.findTableReference(content);
        const returnType = this.findHookReturnType(content, hookName);
        const fields = this.extractFieldsUsed(content);
        
        const hookNode: DataFlowNode = {
          id: `hook:${hookName}`,
          type: 'hook',
          name: hookName,
          file,
          tableName,
          dataType: returnType,
          fields,
          sources: [],
          consumers: []
        };
        
        // Connect to database nodes
        if (tableName) {
          const dbNodes = Array.from(this.graph.nodes.values())
            .filter(n => n.type === 'table' && n.tableName === tableName);
          
          dbNodes.forEach(dbNode => {
            hookNode.sources.push(dbNode.id);
            dbNode.consumers.push(hookNode.id);
          });
        }
        
        this.graph.nodes.set(hookNode.id, hookNode);
      }
    }
  }

  /**
   * Step 4: Discover components and their data dependencies
   */
  private async discoverComponents() {
    const componentFiles = this.findFiles(
      ['src/components', 'components', 'app/components', 'src/app', 'app'],
      ['.tsx', '.jsx']
    );
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = this.program.getSourceFile(file);
      if (!sourceFile) continue;
      
      // Find component definitions
      const componentPattern = /(?:export\s+)?(?:const|function)\s+([A-Z]\w+).*?(?:React\.FC|=>)/g;
      let match;
      
      while ((match = componentPattern.exec(content)) !== null) {
        const componentName = match[1];
        
        // Find hooks used by this component
        const hooksUsed = this.findHooksUsed(content);
        
        // Find props interface
        const propsType = this.findPropsType(content, componentName);
        
        // Extract fields actually used
        const fields = this.extractFieldsUsed(content);
        
        const componentNode: DataFlowNode = {
          id: `component:${componentName}`,
          type: 'component',
          name: componentName,
          file,
          dataType: propsType,
          fields,
          sources: [],
          consumers: []
        };
        
        // Connect to hooks
        hooksUsed.forEach(hookName => {
          const hookNode = this.graph.nodes.get(`hook:${hookName}`);
          if (hookNode) {
            componentNode.sources.push(hookNode.id);
            hookNode.consumers.push(componentNode.id);
          }
        });
        
        this.graph.nodes.set(componentNode.id, componentNode);
      }
    }
  }

  /**
   * Step 5: Discover API endpoints
   */
  private async discoverAPIEndpoints() {
    const apiFiles = this.findFiles(
      ['src/app/api', 'app/api', 'pages/api', 'src/pages/api'],
      ['.ts', '.tsx']
    );
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Extract route from file path
      const route = file
        .replace(this.projectPath, '')
        .replace(/\.(ts|tsx|js|jsx)$/, '')
        .replace('/route', '');
      
      // Find what table/type this API works with
      const tableName = this.findTableReference(content);
      const dataType = this.findTypeReference(content);
      
      const apiNode: DataFlowNode = {
        id: `api:${route}`,
        type: 'api',
        name: route,
        file,
        tableName,
        dataType,
        fields: this.extractFieldsUsed(content),
        sources: [],
        consumers: []
      };
      
      this.graph.nodes.set(apiNode.id, apiNode);
    }
  }

  /**
   * Step 6: Connect the data flow graph
   */
  private async connectDataFlow() {
    // This step creates edges between nodes based on imports and usage
    for (const [nodeId, node] of this.graph.nodes) {
      if (node.type === 'component' || node.type === 'hook') {
        const content = fs.readFileSync(node.file, 'utf-8');
        
        // Find imports
        const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = importPattern.exec(content)) !== null) {
          const importPath = match[1];
          
          // Find nodes from this import path
          const importedNodes = Array.from(this.graph.nodes.values())
            .filter(n => n.file.includes(importPath));
          
          importedNodes.forEach(imported => {
            if (!node.sources.includes(imported.id)) {
              node.sources.push(imported.id);
              imported.consumers.push(nodeId);
              
              this.graph.edges.push({
                from: imported.id,
                to: nodeId,
                dataType: imported.dataType,
                isValid: true // Will be validated in next step
              });
            }
          });
        }
      }
    }
  }

  /**
   * Step 7: Validate the data flow - this is where we detect drift!
   */
  private async validateDataFlow() {
    for (const edge of this.graph.edges) {
      const fromNode = this.graph.nodes.get(edge.from);
      const toNode = this.graph.nodes.get(edge.to);
      
      if (!fromNode || !toNode) continue;
      
      // Check 1: Type compatibility
      if (fromNode.dataType && toNode.dataType) {
        if (!this.areTypesCompatible(fromNode.dataType, toNode.dataType)) {
          edge.isValid = false;
          this.graph.issues.push({
            severity: 'error',
            type: 'type-mismatch',
            message: `Type mismatch: ${toNode.name} expects ${toNode.dataType} but receives ${fromNode.dataType}`,
            expected: toNode.dataType,
            actual: fromNode.dataType,
            suggestion: `Ensure ${fromNode.name} returns ${toNode.dataType} or update ${toNode.name} to accept ${fromNode.dataType}`
          });
        }
      }
      
      // Check 2: Field compatibility
      if (fromNode.fields && toNode.fields) {
        const missingFields = toNode.fields.filter(f => !fromNode.fields?.includes(f));
        if (missingFields.length > 0) {
          this.graph.issues.push({
            severity: 'warning',
            type: 'field-mismatch',
            message: `${toNode.name} uses fields not provided by ${fromNode.name}: ${missingFields.join(', ')}`,
            suggestion: `Either add these fields to ${fromNode.name} or remove their usage from ${toNode.name}`
          });
        }
      }
      
      // Check 3: Table consistency
      if (fromNode.tableName && toNode.tableName) {
        if (fromNode.tableName !== toNode.tableName) {
          this.graph.issues.push({
            severity: 'error',
            type: 'table-mismatch',
            message: `${toNode.name} expects data from '${toNode.tableName}' but receives from '${fromNode.tableName}'`,
            expected: toNode.tableName,
            actual: fromNode.tableName,
            suggestion: `Ensure consistent table usage throughout the data flow`
          });
        }
      }
      
      // Check 4: Hook naming convention
      if (fromNode.type === 'hook') {
        const expectedTable = this.getExpectedTableFromHookName(fromNode.name);
        if (expectedTable && fromNode.tableName && expectedTable !== fromNode.tableName) {
          this.graph.issues.push({
            severity: 'warning',
            type: 'table-mismatch',
            message: `Hook ${fromNode.name} should query '${expectedTable}' table but queries '${fromNode.tableName}'`,
            expected: expectedTable,
            actual: fromNode.tableName,
            suggestion: `Rename hook to match table or fix the query`
          });
        }
      }
    }
  }

  /**
   * Helper methods
   */
  
  private findFiles(dirs: string[], extensions: string[]): string[] {
    const files: string[] = [];
    
    for (const dir of dirs) {
      const fullPath = path.join(this.projectPath, dir);
      if (!fs.existsSync(fullPath)) continue;
      
      this.walkDir(fullPath, (file) => {
        if (extensions.some(ext => file.endsWith(ext))) {
          files.push(file);
        }
      });
    }
    
    return files;
  }
  
  private walkDir(dir: string, callback: (file: string) => void) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        this.walkDir(fullPath, callback);
      } else if (item.isFile()) {
        callback(fullPath);
      }
    }
  }
  
  private extractFieldsFromType(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration): string[] {
    const fields: string[] = [];
    
    if (ts.isInterfaceDeclaration(node)) {
      node.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.name) {
          fields.push(member.name.getText());
        }
      });
    }
    
    return fields;
  }
  
  private extractFieldsFromQuery(content: string, position: number): string[] {
    // Extract fields from nearby select/insert statements
    const fields: string[] = [];
    const nearbyCode = content.substring(Math.max(0, position - 200), position + 500);
    
    // Patterns for field extraction
    const patterns = [
      /select\(['"](.*?)['"]\)/g,
      /\.select\(\[(.*?)\]\)/g,
      /insert\(\{(.*?)\}\)/g,
      /where\(['"](\w+)['"].*?\)/g,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(nearbyCode)) !== null) {
        const fieldStr = match[1];
        fields.push(...fieldStr.split(',').map(f => f.trim().replace(/['"]/g, '')));
      }
    });
    
    return [...new Set(fields)];
  }
  
  private extractFieldsUsed(content: string): string[] {
    const fields: string[] = [];
    
    // Common patterns for field access
    const patterns = [
      /\b(\w+)\.(\w+)/g,           // object.field
      /\{.*?(\w+).*?\}/g,          // destructuring
      /\['(\w+)'\]/g,               // bracket notation
      /data\.(\w+)/g,               // data.field
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const field = match[match.length - 1];
        if (field && !this.isKeyword(field)) {
          fields.push(field);
        }
      }
    });
    
    return [...new Set(fields)];
  }
  
  private findTableReference(content: string): string | undefined {
    const patterns = [
      /from\(['"`](\w+)['"`]\)/,
      /db\.(\w+)\./,
      /table:\s*['"`](\w+)['"`]/,
      /collection\(['"`](\w+)['"`]\)/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }
  
  private findTypeReference(content: string): string | undefined {
    const patterns = [
      /:\s*(\w+)(?:\[\])?(?:\s|>|$)/,
      /as\s+(\w+)(?:\[\])?/,
      /<(\w+)(?:\[\])?>/,
      /interface\s+\w+\s+extends\s+(\w+)/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && !this.isKeyword(match[1])) {
        return match[1];
      }
    }
    
    return undefined;
  }
  
  private inferReturnType(content: string, position: number): string | undefined {
    const nearbyCode = content.substring(Math.max(0, position - 200), position + 500);
    
    // Look for type annotations
    const patterns = [
      /:\s*Promise<(\w+)(?:\[\])?>/,
      /:\s*(\w+)(?:\[\])?/,
      /as\s+(\w+)(?:\[\])?/,
    ];
    
    for (const pattern of patterns) {
      const match = nearbyCode.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }
  
  private inferTypeFromTableName(tableName: string): string {
    // Convert table name to type name (users -> User, products -> Product)
    const singular = tableName.replace(/s$/, '');
    return singular.charAt(0).toUpperCase() + singular.slice(1);
  }
  
  private findHookReturnType(content: string, hookName: string): string | undefined {
    const patterns = [
      new RegExp(`${hookName}.*?:\\s*\\{[^}]*data:\\s*(\\w+)`),
      new RegExp(`${hookName}.*?<(\\w+)>`),
      new RegExp(`return.*?:\\s*(\\w+)`),
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }
  
  private findHooksUsed(content: string): string[] {
    const hooks: string[] = [];
    const hookPattern = /\b(use[A-Z]\w+)\s*\(/g;
    
    let match;
    while ((match = hookPattern.exec(content)) !== null) {
      hooks.push(match[1]);
    }
    
    return [...new Set(hooks)];
  }
  
  private findPropsType(content: string, componentName: string): string | undefined {
    const patterns = [
      new RegExp(`${componentName}.*?:\\s*React\\.FC<(\\w+)>`),
      new RegExp(`interface\\s+(\\w*Props)`),
      new RegExp(`type\\s+(\\w*Props)`),
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }
  
  private areTypesCompatible(type1: string, type2: string): boolean {
    // Simple compatibility check - can be enhanced
    if (type1 === type2) return true;
    if (type1 === 'any' || type2 === 'any') return true;
    if (type1.replace('[]', '') === type2.replace('[]', '')) return true;
    
    // Check for similar names (User vs UserData)
    const base1 = type1.toLowerCase().replace(/data|type|model|entity/, '');
    const base2 = type2.toLowerCase().replace(/data|type|model|entity/, '');
    
    return base1 === base2;
  }
  
  private getExpectedTableFromHookName(hookName: string): string | undefined {
    // useUsers -> users, useProduct -> products
    const match = hookName.match(/use(\w+)/);
    if (!match) return undefined;
    
    const entity = match[1];
    // Convert to lowercase and potentially pluralize
    const table = entity.toLowerCase();
    
    // Common pluralization
    if (!table.endsWith('s')) {
      return table + 's';
    }
    
    return table;
  }
  
  private isKeyword(word: string): boolean {
    const keywords = [
      'const', 'let', 'var', 'function', 'class', 'interface', 'type',
      'import', 'export', 'return', 'if', 'else', 'for', 'while',
      'true', 'false', 'null', 'undefined', 'async', 'await'
    ];
    
    return keywords.includes(word);
  }

  /**
   * Generate a report of all issues found
   */
  generateReport(): string {
    let report = '# Data Flow Analysis Report\n\n';
    
    report += `## Summary\n`;
    report += `- Total nodes analyzed: ${this.graph.nodes.size}\n`;
    report += `- Total connections: ${this.graph.edges.length}\n`;
    report += `- Issues found: ${this.graph.issues.length}\n\n`;
    
    if (this.graph.issues.length > 0) {
      report += '## Issues Found\n\n';
      
      const criticalIssues = this.graph.issues.filter(i => i.severity === 'error');
      const warnings = this.graph.issues.filter(i => i.severity === 'warning');
      
      if (criticalIssues.length > 0) {
        report += '### 🔴 Critical Issues\n\n';
        criticalIssues.forEach(issue => {
          report += `- **${issue.type}**: ${issue.message}\n`;
          if (issue.expected && issue.actual) {
            report += `  - Expected: ${issue.expected}\n`;
            report += `  - Actual: ${issue.actual}\n`;
          }
          report += `  - Fix: ${issue.suggestion}\n\n`;
        });
      }
      
      if (warnings.length > 0) {
        report += '### ⚠️ Warnings\n\n';
        warnings.forEach(issue => {
          report += `- **${issue.type}**: ${issue.message}\n`;
          report += `  - Fix: ${issue.suggestion}\n\n`;
        });
      }
    } else {
      report += '✅ No data flow issues detected!\n';
    }
    
    // Add flow visualization
    report += '\n## Data Flow Visualization\n\n';
    report += '```mermaid\n';
    report += 'graph TD\n';
    
    for (const edge of this.graph.edges) {
      const from = this.graph.nodes.get(edge.from);
      const to = this.graph.nodes.get(edge.to);
      if (from && to) {
        const style = edge.isValid ? '-->' : '-.->'; 
        report += `  ${from.name.replace(/\s/g, '_')}${style}${to.name.replace(/\s/g, '_')}\n`;
      }
    }
    
    report += '```\n';
    
    return report;
  }
}