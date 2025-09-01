import { TypeSystem, DataFlowMap, BusinessEntity, Relationship, PropertyDefinition } from './index';

export class EntityIdentifier {
  async identify(types: TypeSystem, dataFlow: DataFlowMap): Promise<BusinessEntity[]> {
    const entities: BusinessEntity[] = [];
    
    // Identify entities from database types
    const dbTypes = types.interfaces.filter(t => t.category === 'database');
    
    for (const type of dbTypes) {
      const entity = this.createEntity(type, types);
      if (entity) {
        entities.push(entity);
      }
    }
    
    // Identify entities from other types that look like domain models
    const modelTypes = types.interfaces.filter(t => 
      this.looksLikeEntity(t.name) && t.category !== 'database'
    );
    
    for (const type of modelTypes) {
      const entity = this.createEntity(type, types);
      if (entity && !entities.find(e => e.name === entity.name)) {
        entities.push(entity);
      }
    }
    
    // Establish relationships between entities
    this.establishRelationships(entities, types);
    
    // Identify operations for each entity
    this.identifyOperations(entities, dataFlow);
    
    return entities;
  }

  private looksLikeEntity(name: string): boolean {
    // Common entity patterns
    const entityPatterns = [
      'User', 'Profile', 'Account',
      'Product', 'Item', 'Article',
      'Order', 'Cart', 'Purchase',
      'Post', 'Comment', 'Message',
      'Category', 'Tag', 'Group',
      'Payment', 'Transaction', 'Invoice',
      'Customer', 'Client', 'Vendor',
      'Project', 'Task', 'Todo',
      'Document', 'File', 'Media',
      'Session', 'Token', 'Auth'
    ];
    
    return entityPatterns.some(pattern => 
      name.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private createEntity(type: any, types: TypeSystem): BusinessEntity | null {
    if (!type.properties || type.properties.length === 0) {
      return null;
    }
    
    return {
      name: type.name,
      type: this.determineEntityType(type.name),
      properties: type.properties.map((p: PropertyDefinition) => ({
        name: p.name,
        type: this.normalizeType(p.type),
        required: p.required,
        description: p.description
      })),
      relationships: [],
      operations: []
    };
  }

  private determineEntityType(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('user') || nameLower.includes('account') || nameLower.includes('profile')) {
      return 'user';
    }
    if (nameLower.includes('product') || nameLower.includes('item')) {
      return 'product';
    }
    if (nameLower.includes('order') || nameLower.includes('cart') || nameLower.includes('purchase')) {
      return 'transaction';
    }
    if (nameLower.includes('post') || nameLower.includes('article') || nameLower.includes('comment')) {
      return 'content';
    }
    if (nameLower.includes('category') || nameLower.includes('tag')) {
      return 'taxonomy';
    }
    
    return 'general';
  }

  private normalizeType(type: string): string {
    // Simplify complex TypeScript types
    if (type.includes('|')) {
      return 'union';
    }
    if (type.includes('[]')) {
      return 'array';
    }
    if (type.includes('<')) {
      return type.split('<')[0];
    }
    
    return type;
  }

  private establishRelationships(entities: BusinessEntity[], types: TypeSystem) {
    for (const entity of entities) {
      for (const prop of entity.properties) {
        // Check for foreign key patterns
        if (prop.name.endsWith('_id') || prop.name.endsWith('Id')) {
          const relatedEntityName = this.extractEntityFromForeignKey(prop.name);
          const relatedEntity = entities.find(e => 
            e.name.toLowerCase() === relatedEntityName.toLowerCase()
          );
          
          if (relatedEntity) {
            entity.relationships.push({
              type: 'belongsTo',
              entity: relatedEntity.name,
              foreign_key: prop.name
            });
          }
        }
        
        // Check for array relationships
        if (prop.type === 'array') {
          const relatedEntityName = this.extractEntityFromArrayType(prop.name);
          const relatedEntity = entities.find(e => 
            e.name.toLowerCase() === relatedEntityName.toLowerCase()
          );
          
          if (relatedEntity) {
            entity.relationships.push({
              type: 'hasMany',
              entity: relatedEntity.name
            });
          }
        }
      }
    }
    
    // Add inverse relationships
    for (const entity of entities) {
      for (const rel of entity.relationships) {
        if (rel.type === 'belongsTo') {
          const relatedEntity = entities.find(e => e.name === rel.entity);
          if (relatedEntity) {
            const inverseExists = relatedEntity.relationships.some(r => 
              r.entity === entity.name && r.type === 'hasMany'
            );
            
            if (!inverseExists) {
              relatedEntity.relationships.push({
                type: 'hasMany',
                entity: entity.name
              });
            }
          }
        }
      }
    }
  }

  private extractEntityFromForeignKey(propName: string): string {
    // Remove _id or Id suffix
    let entityName = propName.replace(/_id$/i, '').replace(/Id$/i, '');
    
    // Convert to PascalCase
    entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    
    // Handle special cases
    if (entityName === 'Professional') return 'Professional';
    if (entityName === 'User') return 'User';
    if (entityName === 'Post') return 'Post';
    if (entityName === 'Product') return 'Product';
    if (entityName === 'Order') return 'Order';
    
    return entityName;
  }

  private extractEntityFromArrayType(propName: string): string {
    // Handle plural to singular
    if (propName.endsWith('s')) {
      return propName.slice(0, -1);
    }
    if (propName.endsWith('ies')) {
      return propName.slice(0, -3) + 'y';
    }
    
    return propName;
  }

  private identifyOperations(entities: BusinessEntity[], dataFlow: DataFlowMap) {
    for (const entity of entities) {
      const operations: string[] = [];
      
      // Standard CRUD operations
      operations.push(`create${entity.name}`);
      operations.push(`get${entity.name}`);
      operations.push(`update${entity.name}`);
      operations.push(`delete${entity.name}`);
      operations.push(`list${entity.name}s`);
      
      // Entity-specific operations
      if (entity.type === 'user') {
        operations.push('authenticate', 'authorize', 'resetPassword');
      }
      if (entity.type === 'transaction') {
        operations.push('processPayment', 'refund', 'calculateTotal');
      }
      if (entity.type === 'content') {
        operations.push('publish', 'archive', 'share');
      }
      
      // Check data flow for actual operations
      const apiComponents = dataFlow.layers.find(l => l.type === 'api')?.components || [];
      const relevantApis = apiComponents.filter(api => 
        api.toLowerCase().includes(entity.name.toLowerCase())
      );
      
      if (relevantApis.length > 0) {
        operations.push(...relevantApis.map(api => `api:${api}`));
      }
      
      entity.operations = [...new Set(operations)];
    }
  }
}