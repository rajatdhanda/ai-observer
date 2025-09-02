import { z } from 'zod';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

interface ContractField {
  type: string;
  required?: boolean;
  enum?: string[];
  format?: string;
}

interface ContractSchema {
  [key: string]: ContractField | string;
}

interface Contract {
  schema: ContractSchema;
  database_mapping?: Record<string, string>;
  validation_rules?: string[];
}

export class ZodSchemaGenerator {
  private contracts: Map<string, Contract> = new Map();
  private schemas: Map<string, z.ZodSchema> = new Map();
  private mappers: Map<string, z.ZodSchema> = new Map();

  constructor(private projectPath: string) {
    this.loadContracts();
  }

  private loadContracts() {
    const contractsPath = path.join(this.projectPath, 'contracts.yaml');
    if (!fs.existsSync(contractsPath)) {
      console.warn(`No contracts.yaml found at ${contractsPath}`);
      return;
    }

    try {
      const content = fs.readFileSync(contractsPath, 'utf-8');
      const contracts = yaml.load(content) as Record<string, Contract>;
      
      for (const [name, contract] of Object.entries(contracts)) {
        this.contracts.set(name, contract);
        this.generateZodSchema(name, contract);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  }

  private generateZodSchema(name: string, contract: Contract) {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    const mapperFields: Record<string, z.ZodTypeAny> = {};
    const transformMap: Record<string, string> = {};

    for (const [field, definition] of Object.entries(contract.schema)) {
      const fieldSchema = this.createFieldSchema(field, definition);
      schemaFields[field] = fieldSchema;

      // Create database mapper if mapping exists
      if (contract.database_mapping) {
        const dbField = this.getDbFieldName(field, contract.database_mapping);
        if (dbField !== field) {
          mapperFields[dbField] = fieldSchema;
          transformMap[dbField] = field;
        }
      }
    }

    // Create main contract schema
    const schema = z.object(schemaFields);
    this.schemas.set(name, schema);

    // Create database mapper if needed
    if (Object.keys(mapperFields).length > 0) {
      const mapper = z.object({
        ...mapperFields,
        // Include fields that don't need mapping
        ...Object.fromEntries(
          Object.entries(schemaFields).filter(([field]) => !Object.values(transformMap).includes(field))
        )
      }).transform((data) => {
        const transformed: any = {};
        for (const [dbField, contractField] of Object.entries(transformMap)) {
          transformed[contractField] = data[dbField];
        }
        // Copy fields that don't need transformation
        for (const field of Object.keys(schemaFields)) {
          if (!transformed[field] && data[field] !== undefined) {
            transformed[field] = data[field];
          }
        }
        return transformed;
      });
      this.mappers.set(name, mapper);
    }
  }

  private createFieldSchema(field: string, definition: ContractField | string): z.ZodTypeAny {
    if (typeof definition === 'string') {
      return this.getZodTypeFromString(definition);
    }

    let schema = this.getZodTypeFromString(definition.type);

    if (definition.enum) {
      schema = z.enum(definition.enum as [string, ...string[]]);
    }

    if (definition.format === 'datetime') {
      schema = z.string().datetime();
    } else if (definition.format === 'email') {
      schema = z.string().email();
    } else if (definition.format === 'url') {
      schema = z.string().url();
    }

    if (definition.required === false) {
      schema = schema.optional();
    }

    return schema;
  }

  private getZodTypeFromString(type: string): z.ZodTypeAny {
    const cleanType = type.replace('[]', '').replace('?', '');
    const isArray = type.includes('[]');
    const isOptional = type.includes('?');

    let baseType: z.ZodTypeAny;

    switch (cleanType.toLowerCase()) {
      case 'string':
        baseType = z.string();
        break;
      case 'number':
      case 'int':
      case 'integer':
      case 'float':
        baseType = z.number();
        break;
      case 'boolean':
      case 'bool':
        baseType = z.boolean();
        break;
      case 'date':
      case 'datetime':
        baseType = z.string().datetime();
        break;
      case 'any':
        baseType = z.any();
        break;
      default:
        // Check if it's a reference to another contract
        if (this.schemas.has(cleanType)) {
          baseType = this.schemas.get(cleanType)!;
        } else {
          baseType = z.any();
        }
    }

    if (isArray) {
      baseType = z.array(baseType);
    }

    if (isOptional) {
      baseType = baseType.optional();
    }

    return baseType;
  }

  private getDbFieldName(field: string, mapping: Record<string, string>): string {
    // Convert camelCase to snake_case for database
    if (mapping[field]) {
      return mapping[field];
    }
    return field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  public validateData(entityName: string, data: any, useMapper: boolean = false): {
    success: boolean;
    data?: any;
    errors?: z.ZodError;
  } {
    const schema = useMapper ? this.mappers.get(entityName) : this.schemas.get(entityName);
    
    if (!schema) {
      return {
        success: false,
        errors: new z.ZodError([{
          code: 'custom',
          message: `No schema found for entity: ${entityName}`,
          path: []
        }])
      };
    }

    const result = schema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error
    };
  }

  public generateRuntimeValidator(entityName: string): string {
    const contract = this.contracts.get(entityName);
    if (!contract) return '';

    const fields = Object.entries(contract.schema).map(([field, def]) => {
      const type = typeof def === 'string' ? def : def.type;
      return `  ${field}: z.${this.getZodMethodFromType(type)}()`;
    }).join(',\n');

    const mapperFields = contract.database_mapping ? 
      Object.entries(contract.schema).map(([field]) => {
        const dbField = this.getDbFieldName(field, contract.database_mapping || {});
        if (dbField !== field) {
          return `  ${dbField}: z.any()`;
        }
        return null;
      }).filter(Boolean).join(',\n') : '';

    const transformCode = contract.database_mapping ?
      Object.entries(contract.schema).map(([field]) => {
        const dbField = this.getDbFieldName(field, contract.database_mapping || {});
        if (dbField !== field) {
          return `  ${field}: data.${dbField}`;
        }
        return `  ${field}: data.${field}`;
      }).join(',\n') : '';

    return `
import { z } from 'zod';

// Contract Schema for ${entityName}
export const ${entityName}Contract = z.object({
${fields}
});

// Type inference from schema
export type ${entityName} = z.infer<typeof ${entityName}Contract>;

${contract.database_mapping ? `
// Database to Contract Mapper
export const Database${entityName}Mapper = z.object({
${mapperFields}
}).transform((data) => ({
${transformCode}
}));
` : ''}

// Runtime validation function
export function validate${entityName}(data: any, fromDatabase: boolean = false) {
  const schema = ${contract.database_mapping ? `fromDatabase ? Database${entityName}Mapper : ${entityName}Contract` : `${entityName}Contract`};
  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error('CONTRACT VIOLATION for ${entityName}:', result.error.errors);
    throw new Error(\`${entityName} data violates contract: \${result.error.errors.map(e => e.message).join(', ')}\`);
  }
  
  return result.data;
}
`;
  }

  private getZodMethodFromType(type: string): string {
    const cleanType = type.replace('[]', '').replace('?', '').toLowerCase();
    switch (cleanType) {
      case 'string': return 'string';
      case 'number':
      case 'int':
      case 'integer':
      case 'float': return 'number';
      case 'boolean':
      case 'bool': return 'boolean';
      case 'date':
      case 'datetime': return 'string().datetime';
      default: return 'any';
    }
  }

  public getAllSchemas(): Map<string, z.ZodSchema> {
    return this.schemas;
  }

  public getAllMappers(): Map<string, z.ZodSchema> {
    return this.mappers;
  }
}