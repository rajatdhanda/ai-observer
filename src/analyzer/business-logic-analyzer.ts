import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Business Logic Analyzer
 * Understands the actual business domain, not just code structure
 */

export interface BusinessAnalysis {
  tables: DatabaseTable[];
  workflows: BusinessWorkflow[];
  hooks: HookUsage[];
  features: Feature[];
  apiEndpoints: ApiEndpoint[];
  businessRules: BusinessRule[];
  dataRelationships: DataRelationship[];
}

export interface DatabaseTable {
  name: string;
  fields: Field[];
  relationships: string[];
  operations: string[];
  location: string;
  recordCount?: number;
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  foreignKey?: string;
}

export interface BusinessWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  actors: string[];
  triggers: string[];
  outcomes: string[];
}

export interface WorkflowStep {
  order: number;
  action: string;
  actor: string;
  data: string[];
  nextSteps: string[];
}

export interface HookUsage {
  name: string;
  type: 'state' | 'effect' | 'custom' | 'data';
  purpose: string;
  usedIn: string[];
  dependencies: string[];
  dataFlow: string;
}

export interface Feature {
  name: string;
  type: 'core' | 'support' | 'utility';
  components: string[];
  hooks: string[];
  apis: string[];
  tables: string[];
  healthStatus: 'working' | 'broken' | 'partial';
  issues: string[];
}

export interface ApiEndpoint {
  path: string;
  method: string;
  purpose: string;
  inputData: string[];
  outputData: string[];
  authentication: boolean;
  usedBy: string[];
}

export interface BusinessRule {
  name: string;
  category: string;
  condition: string;
  action: string;
  location: string;
  enforced: boolean;
}

export interface DataRelationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  through?: string;
  cascadeDelete: boolean;
}

export class BusinessLogicAnalyzer {
  private projectPath: string;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.initializeTypeScript();
  }

  private initializeTypeScript() {
    const configPath = ts.findConfigFile(
      this.projectPath,
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );

      this.program = ts.createProgram(
        parsedConfig.fileNames,
        parsedConfig.options
      );
      
      this.checker = this.program.getTypeChecker();

      for (const sourceFile of this.program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
          this.sourceFiles.set(sourceFile.fileName, sourceFile);
        }
      }
    }
  }

  async analyze(): Promise<BusinessAnalysis> {
    console.log('🏢 Analyzing business logic...');
    
    const tables = this.extractTables();
    const hooks = this.extractHooks();
    const workflows = this.identifyWorkflows(tables, hooks);
    const features = this.identifyFeatures(tables, hooks);
    const apiEndpoints = this.extractApiEndpoints();
    const businessRules = this.extractBusinessRules();
    const dataRelationships = this.extractRelationships(tables);

    return {
      tables,
      workflows,
      hooks,
      features,
      apiEndpoints,
      businessRules,
      dataRelationships
    };
  }

  private extractTables(): DatabaseTable[] {
    const tables: DatabaseTable[] = [];
    
    // Look for database type definitions
    const typeFiles = [
      path.join(this.projectPath, 'src/types/database.types.ts'),
      path.join(this.projectPath, 'src/types/models.ts'),
      path.join(this.projectPath, 'src/db/schema.ts'),
      path.join(this.projectPath, 'prisma/schema.prisma')
    ];

    for (const file of typeFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Extract interfaces/types that look like tables
        const tablePattern = /(?:export\s+)?(?:interface|type)\s+(\w+)\s*{([^}]+)}/g;
        let match;
        
        while ((match = tablePattern.exec(content)) !== null) {
          const tableName = match[1];
          const tableContent = match[2];
          
          // Skip if it's not a table-like structure
          if (!this.looksLikeTable(tableName)) continue;
          
          const fields = this.extractFields(tableContent);
          
          tables.push({
            name: tableName,
            fields,
            relationships: this.findRelationships(tableName, fields),
            operations: this.findOperations(tableName),
            location: file
          });
        }
      }
    }

    // Also check for Supabase client usage
    this.extractSupabaseTables(tables);
    
    return tables;
  }

  private looksLikeTable(name: string): boolean {
    const tablePatterns = [
      'User', 'Post', 'Comment', 'Order', 'Product', 
      'Client', 'Professional', 'Course', 'Session',
      'Policy', 'Claim', 'Appointment', 'Category',
      'Tag', 'Cart', 'Payment', 'Review', 'Message'
    ];
    
    return tablePatterns.some(pattern => 
      name.includes(pattern) && !name.includes('Props') && !name.includes('Response')
    );
  }

  private extractFields(content: string): Field[] {
    const fields: Field[] = [];
    const fieldPattern = /(\w+)(\?)?:\s*([^;]+);/g;
    let match;
    
    while ((match = fieldPattern.exec(content)) !== null) {
      const name = match[1];
      const required = !match[2];
      const type = match[3].trim();
      
      fields.push({
        name,
        type: this.normalizeType(type),
        required,
        unique: name === 'id' || name === 'email' || name === 'username',
        foreignKey: name.endsWith('_id') || name.endsWith('Id') ? name : undefined
      });
    }
    
    return fields;
  }

  private normalizeType(type: string): string {
    if (type.includes('string')) return 'string';
    if (type.includes('number')) return 'number';
    if (type.includes('boolean')) return 'boolean';
    if (type.includes('Date')) return 'date';
    if (type.includes('[]')) return 'array';
    return type;
  }

  private findRelationships(tableName: string, fields: Field[]): string[] {
    const relationships: string[] = [];
    
    for (const field of fields) {
      if (field.foreignKey) {
        const relatedTable = field.foreignKey
          .replace(/_id$/i, '')
          .replace(/Id$/i, '');
        relationships.push(relatedTable);
      }
      
      if (field.type === 'array' && field.name !== 'tags') {
        const relatedTable = field.name.replace(/s$/, '');
        relationships.push(relatedTable);
      }
    }
    
    return [...new Set(relationships)];
  }

  private findOperations(tableName: string): string[] {
    const operations: string[] = ['create', 'read', 'update', 'delete', 'list'];
    
    // Look for specific operations in hooks or API files
    const searchTerms = [
      `create${tableName}`,
      `update${tableName}`,
      `delete${tableName}`,
      `get${tableName}`,
      `fetch${tableName}`,
      `use${tableName}`
    ];
    
    // Add found operations (simplified for now)
    return operations;
  }

  private extractSupabaseTables(existingTables: DatabaseTable[]): void {
    // Look for Supabase client usage patterns
    const supabasePattern = /supabase\s*\.\s*from\s*\(\s*['"`](\w+)['"`]\s*\)/g;
    
    for (const [fileName, sourceFile] of this.sourceFiles) {
      const content = sourceFile.getText();
      let match;
      
      while ((match = supabasePattern.exec(content)) !== null) {
        const tableName = match[1];
        
        if (!existingTables.find(t => t.name.toLowerCase() === tableName.toLowerCase())) {
          existingTables.push({
            name: tableName,
            fields: [],
            relationships: [],
            operations: ['supabase-crud'],
            location: fileName
          });
        }
      }
    }
  }

  private extractHooks(): HookUsage[] {
    const hooks: HookUsage[] = [];
    const hooksDir = path.join(this.projectPath, 'src/hooks');
    
    if (fs.existsSync(hooksDir)) {
      const files = fs.readdirSync(hooksDir);
      
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const filePath = path.join(hooksDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Extract hook name and analyze
          const hookName = file.replace(/\.(ts|tsx)$/, '');
          const hook = this.analyzeHook(hookName, content, filePath);
          if (hook) hooks.push(hook);
        }
      }
    }
    
    return hooks;
  }

  private analyzeHook(name: string, content: string, filePath: string): HookUsage | null {
    // Determine hook type
    let type: HookUsage['type'] = 'custom';
    let purpose = '';
    let dataFlow = '';
    
    if (content.includes('useState')) type = 'state';
    if (content.includes('useEffect')) type = 'effect';
    if (content.includes('fetch') || content.includes('supabase')) {
      type = 'data';
      dataFlow = 'api -> state -> component';
    }
    
    // Extract purpose from hook name
    if (name.includes('Auth')) purpose = 'Authentication';
    else if (name.includes('Product')) purpose = 'Product management';
    else if (name.includes('Cart')) purpose = 'Shopping cart';
    else if (name.includes('Order')) purpose = 'Order processing';
    else if (name.includes('Client')) purpose = 'Client management';
    else if (name.includes('Feed')) purpose = 'Social feed';
    else if (name.includes('Insurance')) purpose = 'Insurance management';
    else if (name.includes('Learning')) purpose = 'Course/Learning management';
    else purpose = `Manage ${name.replace('use', '')}`;
    
    // Find where it's used
    const usedIn = this.findHookUsage(name);
    
    // Extract dependencies
    const dependencies: string[] = [];
    const importPattern = /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return {
      name,
      type,
      purpose,
      usedIn,
      dependencies,
      dataFlow
    };
  }

  private findHookUsage(hookName: string): string[] {
    const usage: string[] = [];
    
    for (const [fileName, sourceFile] of this.sourceFiles) {
      if (fileName.includes('component') || fileName.includes('page')) {
        const content = sourceFile.getText();
        if (content.includes(hookName)) {
          usage.push(path.basename(fileName));
        }
      }
    }
    
    return usage;
  }

  private identifyWorkflows(tables: DatabaseTable[], hooks: HookUsage[]): BusinessWorkflow[] {
    const workflows: BusinessWorkflow[] = [];
    
    // Order workflow
    if (tables.find(t => t.name.includes('Order'))) {
      workflows.push({
        name: 'Order Processing',
        description: 'Complete order lifecycle from cart to delivery',
        steps: [
          { order: 1, action: 'Add to Cart', actor: 'Customer', data: ['Product'], nextSteps: ['Checkout'] },
          { order: 2, action: 'Checkout', actor: 'Customer', data: ['Cart', 'Payment'], nextSteps: ['Process Payment'] },
          { order: 3, action: 'Process Payment', actor: 'System', data: ['Payment'], nextSteps: ['Create Order'] },
          { order: 4, action: 'Create Order', actor: 'System', data: ['Order'], nextSteps: ['Fulfill'] },
          { order: 5, action: 'Fulfill', actor: 'Professional', data: ['Order'], nextSteps: ['Complete'] }
        ],
        actors: ['Customer', 'Professional', 'System'],
        triggers: ['Add to Cart', 'Checkout'],
        outcomes: ['Order Completed', 'Order Cancelled']
      });
    }
    
    // Authentication workflow
    if (hooks.find(h => h.name.includes('Auth'))) {
      workflows.push({
        name: 'User Authentication',
        description: 'User login and session management',
        steps: [
          { order: 1, action: 'Enter Credentials', actor: 'User', data: ['Email', 'Password'], nextSteps: ['Validate'] },
          { order: 2, action: 'Validate', actor: 'System', data: ['Credentials'], nextSteps: ['Create Session', 'Show Error'] },
          { order: 3, action: 'Create Session', actor: 'System', data: ['User', 'Token'], nextSteps: ['Redirect'] },
          { order: 4, action: 'Redirect', actor: 'System', data: [], nextSteps: [] }
        ],
        actors: ['User', 'System'],
        triggers: ['Login Button'],
        outcomes: ['Authenticated', 'Authentication Failed']
      });
    }
    
    // Social feed workflow
    if (tables.find(t => t.name.includes('Post'))) {
      workflows.push({
        name: 'Social Feed',
        description: 'Content creation and engagement',
        steps: [
          { order: 1, action: 'Create Post', actor: 'Professional', data: ['Post'], nextSteps: ['Publish'] },
          { order: 2, action: 'Publish', actor: 'System', data: ['Post'], nextSteps: ['Display'] },
          { order: 3, action: 'Display', actor: 'System', data: ['Feed'], nextSteps: ['Engage'] },
          { order: 4, action: 'Engage', actor: 'User', data: ['Like', 'Comment'], nextSteps: ['Update'] }
        ],
        actors: ['Professional', 'User', 'System'],
        triggers: ['Create Post', 'Like', 'Comment'],
        outcomes: ['Post Published', 'Engagement Recorded']
      });
    }
    
    // Insurance workflow
    if (tables.find(t => t.name.includes('Policy') || t.name.includes('Claim'))) {
      workflows.push({
        name: 'Insurance Management',
        description: 'Policy creation and claim processing',
        steps: [
          { order: 1, action: 'Apply for Policy', actor: 'Customer', data: ['Policy'], nextSteps: ['Review'] },
          { order: 2, action: 'Review', actor: 'System', data: ['Policy'], nextSteps: ['Approve', 'Reject'] },
          { order: 3, action: 'Approve', actor: 'System', data: ['Policy'], nextSteps: ['Activate'] },
          { order: 4, action: 'File Claim', actor: 'Customer', data: ['Claim'], nextSteps: ['Process Claim'] },
          { order: 5, action: 'Process Claim', actor: 'System', data: ['Claim'], nextSteps: ['Payout', 'Deny'] }
        ],
        actors: ['Customer', 'System', 'Admin'],
        triggers: ['Apply', 'File Claim'],
        outcomes: ['Policy Active', 'Claim Paid', 'Claim Denied']
      });
    }
    
    return workflows;
  }

  private identifyFeatures(tables: DatabaseTable[], hooks: HookUsage[]): Feature[] {
    const features: Feature[] = [];
    
    // Group related components into features
    const featureMap: Record<string, Feature> = {
      'Order Management': {
        name: 'Order Management',
        type: 'core',
        components: [],
        hooks: [],
        apis: [],
        tables: [],
        healthStatus: 'working',
        issues: []
      },
      'Social Feed': {
        name: 'Social Feed',
        type: 'core',
        components: [],
        hooks: [],
        apis: [],
        tables: [],
        healthStatus: 'working',
        issues: []
      },
      'Insurance': {
        name: 'Insurance',
        type: 'support',
        components: [],
        hooks: [],
        apis: [],
        tables: [],
        healthStatus: 'working',
        issues: []
      },
      'Learning Platform': {
        name: 'Learning Platform',
        type: 'core',
        components: [],
        hooks: [],
        apis: [],
        tables: [],
        healthStatus: 'working',
        issues: []
      },
      'CRM': {
        name: 'CRM',
        type: 'support',
        components: [],
        hooks: [],
        apis: [],
        tables: [],
        healthStatus: 'working',
        issues: []
      }
    };
    
    // Assign tables to features
    for (const table of tables) {
      if (table.name.includes('Order') || table.name.includes('Cart')) {
        featureMap['Order Management'].tables.push(table.name);
      }
      if (table.name.includes('Post') || table.name.includes('Comment')) {
        featureMap['Social Feed'].tables.push(table.name);
      }
      if (table.name.includes('Policy') || table.name.includes('Claim')) {
        featureMap['Insurance'].tables.push(table.name);
      }
      if (table.name.includes('Course') || table.name.includes('Learning')) {
        featureMap['Learning Platform'].tables.push(table.name);
      }
      if (table.name.includes('Client') || table.name.includes('Professional')) {
        featureMap['CRM'].tables.push(table.name);
      }
    }
    
    // Assign hooks to features
    for (const hook of hooks) {
      if (hook.name.includes('Order') || hook.name.includes('Cart')) {
        featureMap['Order Management'].hooks.push(hook.name);
      }
      if (hook.name.includes('Feed') || hook.name.includes('Post')) {
        featureMap['Social Feed'].hooks.push(hook.name);
      }
      if (hook.name.includes('Insurance')) {
        featureMap['Insurance'].hooks.push(hook.name);
      }
      if (hook.name.includes('Learning') || hook.name.includes('Course')) {
        featureMap['Learning Platform'].hooks.push(hook.name);
      }
      if (hook.name.includes('Client')) {
        featureMap['CRM'].hooks.push(hook.name);
      }
    }
    
    // Check health status
    for (const feature of Object.values(featureMap)) {
      // If feature has tables but no hooks, it might be broken
      if (feature.tables.length > 0 && feature.hooks.length === 0) {
        feature.healthStatus = 'partial';
        feature.issues.push('No hooks found for data management');
      }
      
      // If feature has hooks but no tables, it might be incomplete
      if (feature.hooks.length > 0 && feature.tables.length === 0) {
        feature.healthStatus = 'partial';
        feature.issues.push('No database tables found');
      }
      
      features.push(feature);
    }
    
    return features;
  }

  private extractApiEndpoints(): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    
    // Look for Next.js API routes
    const apiDir = path.join(this.projectPath, 'src/app/api');
    if (fs.existsSync(apiDir)) {
      this.walkApiDirectory(apiDir, endpoints);
    }
    
    // Look for route handlers
    const pagesApiDir = path.join(this.projectPath, 'pages/api');
    if (fs.existsSync(pagesApiDir)) {
      this.walkApiDirectory(pagesApiDir, endpoints);
    }
    
    return endpoints;
  }

  private walkApiDirectory(dir: string, endpoints: ApiEndpoint[]): void {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.walkApiDirectory(filePath, endpoints);
      } else if (file === 'route.ts' || file === 'route.js') {
        const path = filePath
          .replace(this.projectPath, '')
          .replace('/src/app', '')
          .replace('/route.ts', '')
          .replace('/route.js', '');
        
        endpoints.push({
          path,
          method: 'GET/POST',
          purpose: this.inferApiPurpose(path),
          inputData: [],
          outputData: [],
          authentication: path.includes('auth') || path.includes('user'),
          usedBy: []
        });
      }
    }
  }

  private inferApiPurpose(path: string): string {
    if (path.includes('auth')) return 'Authentication';
    if (path.includes('user')) return 'User management';
    if (path.includes('product')) return 'Product operations';
    if (path.includes('order')) return 'Order processing';
    if (path.includes('post')) return 'Content management';
    return 'Data operation';
  }

  private extractBusinessRules(): BusinessRule[] {
    const rules: BusinessRule[] = [];
    
    // Look for validation patterns
    for (const [fileName, sourceFile] of this.sourceFiles) {
      const content = sourceFile.getText();
      
      // Find validation rules
      if (content.includes('validate') || content.includes('check') || content.includes('require')) {
        // Extract business rules from conditions
        const conditionPattern = /if\s*\(([^)]+)\)\s*{([^}]+)}/g;
        let match;
        
        while ((match = conditionPattern.exec(content)) !== null) {
          const condition = match[1];
          const action = match[2];
          
          if (this.isBusinessRule(condition)) {
            rules.push({
              name: this.extractRuleName(condition),
              category: this.categorizeRule(condition),
              condition,
              action: action.substring(0, 100),
              location: fileName,
              enforced: true
            });
          }
        }
      }
    }
    
    return rules;
  }

  private isBusinessRule(condition: string): boolean {
    const businessTerms = [
      'price', 'amount', 'quantity', 'status', 'role',
      'permission', 'limit', 'minimum', 'maximum',
      'expired', 'valid', 'active', 'approved'
    ];
    
    return businessTerms.some(term => condition.toLowerCase().includes(term));
  }

  private extractRuleName(condition: string): string {
    if (condition.includes('price')) return 'Price validation';
    if (condition.includes('quantity')) return 'Quantity check';
    if (condition.includes('status')) return 'Status validation';
    if (condition.includes('role')) return 'Role-based access';
    if (condition.includes('expired')) return 'Expiration check';
    return 'Business rule';
  }

  private categorizeRule(condition: string): string {
    if (condition.includes('price') || condition.includes('amount')) return 'Financial';
    if (condition.includes('role') || condition.includes('permission')) return 'Authorization';
    if (condition.includes('quantity') || condition.includes('limit')) return 'Inventory';
    if (condition.includes('expired') || condition.includes('valid')) return 'Validation';
    return 'General';
  }

  private extractRelationships(tables: DatabaseTable[]): DataRelationship[] {
    const relationships: DataRelationship[] = [];
    
    for (const table of tables) {
      for (const field of table.fields) {
        if (field.foreignKey) {
          const relatedTable = field.foreignKey
            .replace(/_id$/i, '')
            .replace(/Id$/i, '');
          
          relationships.push({
            from: table.name,
            to: relatedTable,
            type: 'one-to-many',
            cascadeDelete: false
          });
        }
      }
    }
    
    // Detect many-to-many relationships
    for (const table of tables) {
      if (table.name.includes('_') && table.fields.length === 2) {
        const parts = table.name.split('_');
        if (parts.length === 2) {
          relationships.push({
            from: parts[0],
            to: parts[1],
            type: 'many-to-many',
            through: table.name,
            cascadeDelete: false
          });
        }
      }
    }
    
    return relationships;
  }
}