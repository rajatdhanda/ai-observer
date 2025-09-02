/**
 * Table-to-Contract Validator
 * Inspired by Postman's approach to API contract testing
 * 
 * This validator ensures that:
 * 1. Every table in the database has a corresponding contract
 * 2. Every contract field exists in the table schema
 * 3. Types match between tables and contracts
 * 4. Naming conventions are consistent
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface ValidationResult {
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface TableContractValidation {
  table: string;
  contract: string;
  validations: ValidationResult[];
  score: number;
  recommendation?: string;
}

export class TableContractValidator {
  private projectPath: string;
  private tables: Map<string, any> = new Map();
  private contracts: Map<string, any> = new Map();
  private results: TableContractValidation[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async validate(): Promise<{
    results: TableContractValidation[];
    summary: {
      totalTables: number;
      tablesWithContracts: number;
      tablesWithoutContracts: number;
      contractsWithoutTables: number;
      passingValidations: number;
      failingValidations: number;
      overallScore: number;
    };
  }> {
    // Step 1: Load all table schemas
    await this.loadTableSchemas();
    
    // Step 2: Load all contracts
    await this.loadContracts();
    
    // Step 3: Validate each table against its contract
    await this.validateTablesAgainstContracts();
    
    // Step 4: Check for orphaned contracts
    await this.checkOrphanedContracts();
    
    // Step 5: Generate summary
    const summary = this.generateSummary();
    
    return {
      results: this.results,
      summary
    };
  }

  private async loadTableSchemas() {
    // Look for database schema files
    const schemaPaths = [
      path.join(this.projectPath, 'prisma', 'schema.prisma'),
      path.join(this.projectPath, 'src', 'types', 'database.types.ts'),
      path.join(this.projectPath, 'types', 'database.types.ts'),
      path.join(this.projectPath, 'src', 'db', 'schema.ts'),
    ];

    for (const schemaPath of schemaPaths) {
      if (fs.existsSync(schemaPath)) {
        const content = fs.readFileSync(schemaPath, 'utf-8');
        
        if (schemaPath.endsWith('.prisma')) {
          this.parsePrismaSchema(content);
        } else if (schemaPath.includes('database.types')) {
          this.parseSupabaseTypes(content);
        } else {
          this.parseTypeScriptSchema(content);
        }
      }
    }

    // Also look for individual table type files
    const typeFiles = this.findTypeFiles();
    for (const file of typeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      this.parseTypeScriptSchema(content);
    }
  }

  private parsePrismaSchema(content: string) {
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
    let match;
    
    while ((match = modelRegex.exec(content)) !== null) {
      const tableName = match[1].toLowerCase();
      const fields = match[2];
      
      const fieldMap = new Map();
      const fieldRegex = /(\w+)\s+(\w+)(\?)?/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
        fieldMap.set(fieldMatch[1], {
          type: fieldMatch[2],
          required: !fieldMatch[3]
        });
      }
      
      this.tables.set(tableName, {
        source: 'prisma',
        fields: fieldMap
      });
    }
  }

  private parseSupabaseTypes(content: string) {
    // Parse Supabase generated types
    const tableRegex = /public\s*:\s*{[^}]*Tables\s*:\s*{([^}]+)}/;
    const match = content.match(tableRegex);
    
    if (match) {
      const tablesContent = match[1];
      const tableDefRegex = /(\w+)\s*:\s*{[^}]*Row\s*:\s*{([^}]+)}/g;
      let tableMatch;
      
      while ((tableMatch = tableDefRegex.exec(tablesContent)) !== null) {
        const tableName = tableMatch[1].toLowerCase();
        const fields = tableMatch[2];
        
        const fieldMap = new Map();
        const fieldRegex = /(\w+)\s*:\s*([^,;]+)/g;
        let fieldMatch;
        
        while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2].trim();
          fieldMap.set(fieldName, {
            type: fieldType,
            required: !fieldType.includes('null')
          });
        }
        
        this.tables.set(tableName, {
          source: 'supabase',
          fields: fieldMap
        });
      }
    }
  }

  private parseTypeScriptSchema(content: string) {
    // Parse TypeScript interfaces/types that look like tables
    const interfaceRegex = /(?:interface|type)\s+(\w+)(?:Model|Entity|Table|Type|Data)?\s*(?:=\s*)?{([^}]+)}/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1];
      // Skip if it doesn't look like a table name
      if (name.includes('Props') || name.includes('State') || name.includes('Context')) continue;
      
      const tableName = name.replace(/Model|Entity|Table|Type|Data/, '').toLowerCase();
      const fields = match[2];
      
      const fieldMap = new Map();
      const fieldRegex = /(\w+)(\?)?\s*:\s*([^;,]+)/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
        fieldMap.set(fieldMatch[1], {
          type: fieldMatch[3].trim(),
          required: !fieldMatch[2]
        });
      }
      
      if (fieldMap.size > 0) {
        this.tables.set(tableName, {
          source: 'typescript',
          fields: fieldMap
        });
      }
    }
  }

  private async loadContracts() {
    const contractPaths = [
      path.join(this.projectPath, 'contracts', 'contracts.yaml'),
      path.join(this.projectPath, 'contracts', 'contracts.json'),
      path.join(this.projectPath, '.contracts.yaml'),
      path.join(this.projectPath, 'contracts.yaml'),
    ];

    for (const contractPath of contractPaths) {
      if (fs.existsSync(contractPath)) {
        const content = fs.readFileSync(contractPath, 'utf-8');
        const data = contractPath.endsWith('.yaml') 
          ? yaml.load(content) as any
          : JSON.parse(content);
        
        if (data.contracts) {
          for (const [name, contract] of Object.entries(data.contracts)) {
            this.contracts.set(name.toLowerCase(), contract);
          }
        }
        break;
      }
    }
  }

  private async validateTablesAgainstContracts() {
    for (const [tableName, tableSchema] of this.tables) {
      const contract = this.contracts.get(tableName);
      const validations: ValidationResult[] = [];
      
      if (!contract) {
        validations.push({
          status: 'warning',
          message: `No contract defined for table '${tableName}'`,
          details: { suggestion: 'Create a contract to ensure API consistency' }
        });
      } else {
        // Validate contract fields exist in table
        if (contract.schema) {
          for (const [fieldName, fieldDef] of Object.entries(contract.schema)) {
            const tableField = tableSchema.fields.get(fieldName);
            
            if (!tableField) {
              // Check for common naming variations
              const snakeCase = this.toSnakeCase(fieldName);
              const camelCase = this.toCamelCase(fieldName);
              
              if (tableSchema.fields.has(snakeCase)) {
                validations.push({
                  status: 'warning',
                  message: `Field '${fieldName}' uses different naming convention`,
                  details: {
                    contract: fieldName,
                    table: snakeCase,
                    suggestion: 'Align naming conventions between contract and table'
                  }
                });
              } else if (tableSchema.fields.has(camelCase)) {
                validations.push({
                  status: 'warning',
                  message: `Field '${fieldName}' uses different naming convention`,
                  details: {
                    contract: fieldName,
                    table: camelCase,
                    suggestion: 'Align naming conventions between contract and table'
                  }
                });
              } else {
                validations.push({
                  status: 'fail',
                  message: `Contract field '${fieldName}' not found in table`,
                  details: {
                    availableFields: Array.from(tableSchema.fields.keys())
                  }
                });
              }
            } else {
              // Validate type compatibility
              const contractType = fieldDef as any;
              const tableType = tableField.type;
              
              if (!this.areTypesCompatible(contractType.type || contractType, tableType)) {
                validations.push({
                  status: 'fail',
                  message: `Type mismatch for field '${fieldName}'`,
                  details: {
                    contract: contractType.type || contractType,
                    table: tableType
                  }
                });
              } else {
                validations.push({
                  status: 'pass',
                  message: `Field '${fieldName}' validated successfully`
                });
              }
            }
          }
        }
        
        // Check for table fields not in contract
        for (const [fieldName, fieldDef] of tableSchema.fields) {
          if (contract.schema && !contract.schema[fieldName]) {
            const camelCase = this.toCamelCase(fieldName);
            const snakeCase = this.toSnakeCase(fieldName);
            
            if (!contract.schema[camelCase] && !contract.schema[snakeCase]) {
              validations.push({
                status: 'warning',
                message: `Table field '${fieldName}' not defined in contract`,
                details: {
                  suggestion: 'Add field to contract for complete API coverage'
                }
              });
            }
          }
        }
      }
      
      const score = this.calculateScore(validations);
      const recommendation = this.generateRecommendation(validations);
      
      this.results.push({
        table: tableName,
        contract: contract ? tableName : 'none',
        validations,
        score,
        recommendation
      });
    }
  }

  private async checkOrphanedContracts() {
    for (const [contractName, contract] of this.contracts) {
      if (!this.tables.has(contractName)) {
        this.results.push({
          table: 'none',
          contract: contractName,
          validations: [{
            status: 'warning',
            message: `Contract '${contractName}' has no corresponding table`,
            details: {
              suggestion: 'Either remove unused contract or create missing table'
            }
          }],
          score: 50,
          recommendation: 'Review if this contract is still needed'
        });
      }
    }
  }

  private areTypesCompatible(contractType: string, tableType: string): boolean {
    const normalizedContract = contractType.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedTable = tableType.toLowerCase().replace(/[^a-z]/g, '');
    
    // Direct match
    if (normalizedContract === normalizedTable) return true;
    
    // Common type mappings
    const typeMappings: Record<string, string[]> = {
      'string': ['text', 'varchar', 'character', 'string'],
      'number': ['int', 'integer', 'float', 'decimal', 'numeric', 'number'],
      'boolean': ['bool', 'boolean'],
      'date': ['date', 'datetime', 'timestamp', 'timestamptz'],
      'json': ['json', 'jsonb', 'object', 'any'],
      'array': ['array', '[]'],
    };
    
    for (const [key, values] of Object.entries(typeMappings)) {
      if (values.includes(normalizedContract) && values.includes(normalizedTable)) {
        return true;
      }
    }
    
    return false;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private calculateScore(validations: ValidationResult[]): number {
    if (validations.length === 0) return 100;
    
    const passed = validations.filter(v => v.status === 'pass').length;
    const failed = validations.filter(v => v.status === 'fail').length;
    const warnings = validations.filter(v => v.status === 'warning').length;
    
    let score = 100;
    score -= failed * 25;
    score -= warnings * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendation(validations: ValidationResult[]): string {
    const failed = validations.filter(v => v.status === 'fail');
    const warnings = validations.filter(v => v.status === 'warning');
    
    if (failed.length > 0) {
      return 'Critical: Fix type mismatches and missing fields immediately';
    } else if (warnings.length > 2) {
      return 'Review naming conventions and ensure complete contract coverage';
    } else if (warnings.length > 0) {
      return 'Minor improvements needed for full compliance';
    } else {
      return 'Excellent! Table and contract are fully aligned';
    }
  }

  private generateSummary() {
    const totalTables = this.tables.size;
    const tablesWithContracts = this.results.filter(r => r.contract !== 'none' && r.table !== 'none').length;
    const tablesWithoutContracts = this.results.filter(r => r.contract === 'none').length;
    const contractsWithoutTables = this.results.filter(r => r.table === 'none').length;
    
    let passingValidations = 0;
    let failingValidations = 0;
    
    for (const result of this.results) {
      passingValidations += result.validations.filter(v => v.status === 'pass').length;
      failingValidations += result.validations.filter(v => v.status === 'fail').length;
    }
    
    const overallScore = this.results.reduce((sum, r) => sum + r.score, 0) / Math.max(1, this.results.length);
    
    return {
      totalTables,
      tablesWithContracts,
      tablesWithoutContracts,
      contractsWithoutTables,
      passingValidations,
      failingValidations,
      overallScore: Math.round(overallScore)
    };
  }

  private findTypeFiles(): string[] {
    const files: string[] = [];
    const searchDirs = [
      path.join(this.projectPath, 'src', 'types'),
      path.join(this.projectPath, 'types'),
      path.join(this.projectPath, 'src', 'models'),
    ];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isFile() && item.name.endsWith('.ts')) {
            files.push(path.join(dir, item.name));
          }
        }
      }
    }
    
    return files;
  }
}