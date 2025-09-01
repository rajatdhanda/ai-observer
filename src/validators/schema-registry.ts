import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs';

export interface SchemaInfo {
  name: string;
  schema: z.ZodType<any>;
  fields: Map<string, string>; // fieldName -> type description
}

export class SchemaRegistry {
  private schemas: Map<string, SchemaInfo> = new Map();
  
  loadSchema(name: string, schema: z.ZodType<any>) {
    const fields = this.extractFields(schema);
    this.schemas.set(name, {
      name,
      schema,
      fields
    });
  }
  
  private extractFields(schema: z.ZodType<any>): Map<string, string> {
    const fields = new Map<string, string>();
    
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      for (const [key, value] of Object.entries(shape)) {
        fields.set(key, this.getTypeDescription(value as z.ZodType<any>));
      }
    }
    
    return fields;
  }
  
  private getTypeDescription(schema: z.ZodType<any>): string {
    if (schema instanceof z.ZodString) return 'string';
    if (schema instanceof z.ZodNumber) return 'number';
    if (schema instanceof z.ZodBoolean) return 'boolean';
    if (schema instanceof z.ZodArray) {
      const elementType = (schema._def as any).type;
      return `array`;  // Simplified for now
    }
    if (schema instanceof z.ZodObject) {
      return 'object';
    }
    if (schema instanceof z.ZodOptional) {
      const innerType = (schema._def as any).innerType;
      return `optional`;  // Simplified for now
    }
    return 'unknown';
  }
  
  getSchema(name: string): SchemaInfo | undefined {
    return this.schemas.get(name);
  }
  
  getAllSchemas(): Map<string, SchemaInfo> {
    return this.schemas;
  }
  
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }
}