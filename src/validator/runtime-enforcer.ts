import * as fs from 'fs';
import * as path from 'path';
import { ZodSchemaGenerator } from './zod-schema-generator';

interface ValidationPoint {
  file: string;
  line: number;
  column: number;
  entity: string;
  operation: 'fetch' | 'save' | 'transform' | 'render';
  code: string;
  suggestion: string;
}

export class RuntimeEnforcer {
  private generator: ZodSchemaGenerator;
  private validationPoints: ValidationPoint[] = [];

  constructor(private projectPath: string) {
    this.generator = new ZodSchemaGenerator(projectPath);
  }

  public analyzeAndInjectValidation(): {
    points: ValidationPoint[];
    schemas: string[];
  } {
    this.findValidationPoints();
    const schemas = this.generateSchemas();
    
    return {
      points: this.validationPoints,
      schemas
    };
  }

  private findValidationPoints() {
    const files = this.getAllTypeScriptFiles(this.projectPath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Find fetch operations
      this.findFetchOperations(file, content);
      
      // Find database operations
      this.findDatabaseOperations(file, content);
      
      // Find hook returns
      this.findHookReturns(file, content);
      
      // Find component props
      this.findComponentProps(file, content);
    }
  }

  private findFetchOperations(file: string, content: string) {
    const fetchRegex = /fetch\(['"`](\/api\/\w+)['"`]\)[\s\S]*?\.json\(\)/g;
    let match;
    
    while ((match = fetchRegex.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length;
      
      // Determine entity from API path
      const apiPath = match[1];
      const entity = this.getEntityFromPath(apiPath);
      
      if (entity) {
        // Check if validation already exists
        const hasValidation = this.checkForExistingValidation(content, match.index);
        
        if (!hasValidation) {
          this.validationPoints.push({
            file,
            line,
            column,
            entity,
            operation: 'fetch',
            code: match[0],
            suggestion: this.generateValidationCode(entity, 'fetch')
          });
        }
      }
    }
  }

  private findDatabaseOperations(file: string, content: string) {
    // Find database queries
    const dbRegex = /(?:db|prisma|knex|supabase)\.\w+\(['"`](\w+)['"`]\)/g;
    let match;
    
    while ((match = dbRegex.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length;
      
      const tableName = match[1];
      const entity = this.getEntityFromTable(tableName);
      
      if (entity) {
        const hasValidation = this.checkForExistingValidation(content, match.index);
        
        if (!hasValidation) {
          this.validationPoints.push({
            file,
            line,
            column,
            entity,
            operation: 'fetch',
            code: match[0],
            suggestion: this.generateValidationCode(entity, 'fetch', true)
          });
        }
      }
    }
  }

  private findHookReturns(file: string, content: string) {
    // Find custom hooks
    const hookRegex = /function\s+use(\w+)\s*\([^)]*\)\s*{[\s\S]*?return\s+({[\s\S]*?});/g;
    let match;
    
    while ((match = hookRegex.exec(content)) !== null) {
      const hookName = match[1];
      const returnStatement = match[2];
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length;
      
      const entity = this.getEntityFromHookName(hookName);
      
      if (entity) {
        const hasValidation = returnStatement.includes('validate') || returnStatement.includes('Contract');
        
        if (!hasValidation) {
          this.validationPoints.push({
            file,
            line,
            column,
            entity,
            operation: 'transform',
            code: `use${hookName}`,
            suggestion: this.generateValidationCode(entity, 'hook')
          });
        }
      }
    }
  }

  private findComponentProps(file: string, content: string) {
    // Find components receiving data props
    const componentRegex = /function\s+(\w+)\s*\(\s*{\s*([^}]+)\s*}\s*:\s*{([^}]+)}\s*\)/g;
    let match;
    
    while ((match = componentRegex.exec(content)) !== null) {
      const componentName = match[1];
      const props = match[2];
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length;
      
      // Check if props include data entities
      const entities = this.extractEntitiesFromProps(props);
      
      for (const entity of entities) {
        this.validationPoints.push({
          file,
          line,
          column,
          entity,
          operation: 'render',
          code: componentName,
          suggestion: this.generateValidationCode(entity, 'component')
        });
      }
    }
  }

  private checkForExistingValidation(content: string, position: number): boolean {
    // Check if validation exists within 10 lines after the position
    const afterContent = content.substring(position, position + 500);
    return afterContent.includes('validate') || 
           afterContent.includes('Contract') || 
           afterContent.includes('.parse(') ||
           afterContent.includes('.safeParse(');
  }

  private getEntityFromPath(path: string): string {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/s$/, '');
  }

  private getEntityFromTable(tableName: string): string {
    return tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');
  }

  private getEntityFromHookName(hookName: string): string {
    // useOrders -> Order, useProducts -> Product
    return hookName.replace(/s$/, '');
  }

  private extractEntitiesFromProps(props: string): string[] {
    const entities: string[] = [];
    const knownEntities = ['order', 'product', 'user', 'professional', 'post'];
    
    for (const entity of knownEntities) {
      if (props.toLowerCase().includes(entity)) {
        entities.push(entity.charAt(0).toUpperCase() + entity.slice(1));
      }
    }
    
    return entities;
  }

  private generateValidationCode(entity: string, context: string, fromDatabase: boolean = false): string {
    switch (context) {
      case 'fetch':
        return `
// Add validation after fetching data:
const validated${entity}s = data.map((item: any) => 
  validate${entity}(item, ${fromDatabase})
);`;
      
      case 'hook':
        return `
// Validate data before returning from hook:
return {
  ${entity.toLowerCase()}s: validate${entity}s(${entity.toLowerCase()}s),
  loading,
  error
};`;
      
      case 'component':
        return `
// Validate props at component boundary:
const validated${entity} = validate${entity}(${entity.toLowerCase()});`;
      
      default:
        return '';
    }
  }

  private generateSchemas(): string[] {
    const schemas: string[] = [];
    const allSchemas = this.generator.getAllSchemas();
    
    for (const [entityName] of allSchemas) {
      const schemaCode = this.generator.generateRuntimeValidator(entityName);
      schemas.push(schemaCode);
      
      // Write schema file
      const schemaPath = path.join(this.projectPath, 'contracts', 'schemas', `${entityName.toLowerCase()}.schema.ts`);
      this.ensureDirectoryExists(path.dirname(schemaPath));
      fs.writeFileSync(schemaPath, schemaCode);
    }
    
    return schemas;
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getAllTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    
    const scanDir = (currentDir: string) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(dir);
    return files;
  }

  public generateReport(): string {
    const groupedByFile = new Map<string, ValidationPoint[]>();
    
    for (const point of this.validationPoints) {
      if (!groupedByFile.has(point.file)) {
        groupedByFile.set(point.file, []);
      }
      groupedByFile.get(point.file)!.push(point);
    }
    
    let report = '# Runtime Contract Enforcement Report\n\n';
    report += `Found ${this.validationPoints.length} locations that need runtime validation\n\n`;
    
    for (const [file, points] of groupedByFile) {
      const relPath = path.relative(this.projectPath, file);
      report += `## ${relPath}\n\n`;
      
      for (const point of points) {
        report += `- **Line ${point.line}**: ${point.operation} operation for ${point.entity}\n`;
        report += `  Code: \`${point.code}\`\n`;
        report += `  ${point.suggestion}\n\n`;
      }
    }
    
    return report;
  }
}