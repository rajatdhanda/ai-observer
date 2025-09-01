import { SchemaRegistry } from './schema-registry';
import * as path from 'path';

export class SchemaLoader {
  private registry: SchemaRegistry;
  
  constructor() {
    this.registry = new SchemaRegistry();
  }
  
  async loadProjectSchemas(schemaPath: string): Promise<SchemaRegistry> {
    // Clear the module cache to get fresh imports
    delete require.cache[require.resolve(schemaPath)];
    
    try {
      const schemas = require(schemaPath);
      
      for (const [name, schema] of Object.entries(schemas)) {
        // Skip exported types (they start with uppercase and aren't Zod schemas)
        if (name.endsWith('Schema')) {
          const typeName = name.replace('Schema', '');
          this.registry.loadSchema(typeName, schema as any);
          console.log(`Loaded schema: ${typeName}`);
        }
      }
    } catch (error) {
      console.error('Failed to load schemas:', error);
    }
    
    return this.registry;
  }
  
  getRegistry(): SchemaRegistry {
    return this.registry;
  }
}