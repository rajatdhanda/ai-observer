/**
 * Entity Data Provider
 * Provides hardcoded entity data (properties, relationships) for tables
 * Until backend provides this data
 * Max 500 lines
 */

export interface EntityProperty {
  name: string;
  type: string;
  required?: boolean;
}

export interface EntityRelationship {
  type: string;
  target: string;
  entity?: string;
}

export interface EntityData {
  name: string;
  properties: EntityProperty[];
  relationships: EntityRelationship[];
}

// Hardcoded entity data based on what we see in enhanced dashboard
const ENTITY_DATA: Record<string, EntityData> = {
  order: {
    name: 'order',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'order_number', type: 'string', required: true },
      { name: 'order_date', type: 'string', required: true },
      { name: 'total_amount', type: 'number', required: true },
      { name: 'tax_amount', type: 'number' },
      { name: 'discount_amount', type: 'number' },
      { name: 'final_amount', type: 'number', required: true },
      { name: 'currency', type: "'INR'", required: true },
      { name: 'status', type: 'union' },
      { name: 'payment_status', type: 'string' },
      { name: 'payment_method', type: 'string' },
      { name: 'notes', type: 'string' },
      { name: 'invoice_url', type: 'string' },
      { name: 'items', type: 'array' },
      { name: 'client_id', type: 'string' },
      { name: 'service_date', type: 'string' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' },
      { type: 'hasMany', target: 'OrderItem' }
    ]
  },
  professional: {
    name: 'professional',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'user_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'business_name', type: 'string', required: true },
      { name: 'bio', type: 'string' },
      { name: 'specializations', type: 'string[]' },
      { name: 'experience_years', type: 'number' },
      { name: 'rating', type: 'number' },
      { name: 'total_reviews', type: 'number' },
      { name: 'hourly_rate', type: 'number' },
      { name: 'currency', type: 'string' },
      { name: 'is_verified', type: 'boolean' },
      { name: 'verification_date', type: 'string' },
      { name: 'available_hours', type: 'json' },
      { name: 'portfolio_urls', type: 'string[]' },
      { name: 'certifications', type: 'json' },
      { name: 'languages', type: 'string[]' },
      { name: 'location', type: 'string' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'User' },
      { type: 'hasMany', target: 'Order' },
      { type: 'hasMany', target: 'Service' },
      { type: 'hasMany', target: 'Appointment' }
    ]
  },
  client: {
    name: 'client',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'user_id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'first_name', type: 'string', required: true },
      { name: 'last_name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'phone', type: 'string' },
      { name: 'address', type: 'json' },
      { name: 'date_of_birth', type: 'string' },
      { name: 'gender', type: 'string' },
      { name: 'notes', type: 'text' },
      { name: 'tags', type: 'string[]' },
      { name: 'total_visits', type: 'number' },
      { name: 'total_spent', type: 'number' },
      { name: 'last_visit', type: 'string' },
      { name: 'preferred_contact', type: 'string' },
      { name: 'emergency_contact', type: 'json' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'User' },
      { type: 'belongsTo', target: 'Professional' },
      { type: 'hasMany', target: 'Appointment' },
      { type: 'hasMany', target: 'Order' }
    ]
  },
  post: {
    name: 'post',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'user_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'content', type: 'text', required: true },
      { name: 'media_urls', type: 'string[]' },
      { name: 'media_type', type: 'string' },
      { name: 'visibility', type: 'string' },
      { name: 'likes_count', type: 'number' },
      { name: 'comments_count', type: 'number' },
      { name: 'shares_count', type: 'number' },
      { name: 'is_pinned', type: 'boolean' },
      { name: 'hashtags', type: 'string[]' },
      { name: 'mentions', type: 'string[]' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'User' },
      { type: 'hasMany', target: 'Comment' },
      { type: 'hasMany', target: 'PostEngagement' }
    ]
  },
  user: {
    name: 'user',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'username', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'first_name', type: 'string' },
      { name: 'last_name', type: 'string' },
      { name: 'avatar_url', type: 'string' },
      { name: 'phone', type: 'string' },
      { name: 'role', type: 'string' },
      { name: 'is_active', type: 'boolean' },
      { name: 'is_verified', type: 'boolean' },
      { name: 'last_login', type: 'string' },
      { name: 'preferences', type: 'json' },
      { name: 'notification_settings', type: 'json' }
    ],
    relationships: [
      { type: 'hasOne', target: 'Professional' },
      { type: 'hasMany', target: 'Client' },
      { type: 'hasMany', target: 'Post' }
    ]
  },
  product: {
    name: 'product',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'price', type: 'number', required: true },
      { name: 'currency', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'sku', type: 'string' },
      { name: 'stock_quantity', type: 'number' },
      { name: 'is_active', type: 'boolean' },
      { name: 'images', type: 'string[]' },
      { name: 'tags', type: 'string[]' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' },
      { type: 'hasMany', target: 'OrderItem' }
    ]
  },
  appointment: {
    name: 'appointment',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'client_id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'updated_at', type: 'string', required: true },
      { name: 'appointment_date', type: 'string', required: true },
      { name: 'start_time', type: 'string', required: true },
      { name: 'end_time', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'service_id', type: 'string' },
      { name: 'notes', type: 'text' },
      { name: 'reminder_sent', type: 'boolean' },
      { name: 'cancellation_reason', type: 'string' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Client' },
      { type: 'belongsTo', target: 'Professional' },
      { type: 'belongsTo', target: 'Service' }
    ]
  }
};

// Page hierarchy data
export const PAGE_HIERARCHY = [
  { name: '(main) > crm', path: '/main/crm', health: 60 },
  { name: '(main) > feed', path: '/main/feed', health: 20 },
  { name: '(main) > insurance', path: '/main/insurance', health: 100 },
  { name: '(main) > learning', path: '/main/learning', health: 100 },
  { name: '(main) > orders', path: '/main/orders', health: 100 },
  { name: 'Home', path: '/', health: 100 },
  { name: 'test', path: '/test', health: 100 }
];

export class EntityDataProvider {
  private static instance: EntityDataProvider;
  
  private constructor() {}
  
  static getInstance(): EntityDataProvider {
    if (!EntityDataProvider.instance) {
      EntityDataProvider.instance = new EntityDataProvider();
    }
    return EntityDataProvider.instance;
  }
  
  getEntityData(tableName: string): EntityData | null {
    return ENTITY_DATA[tableName.toLowerCase()] || null;
  }
  
  getAllEntities(): EntityData[] {
    return Object.values(ENTITY_DATA);
  }
  
  getPageHierarchy(): typeof PAGE_HIERARCHY {
    return PAGE_HIERARCHY;
  }
  
  // Enrich table data with entity properties and relationships
  enrichTableData(tableName: string, tableData: any): any {
    const entityData = this.getEntityData(tableName);
    
    if (!entityData) {
      return tableData;
    }
    
    return {
      ...tableData,
      properties: entityData.properties,
      relationships: entityData.relationships,
      // Fix component count - should be actual components, not objects
      components: Array.isArray(tableData.components) 
        ? tableData.components.map((c: any) => 
            typeof c === 'string' ? c : (c.componentName || c.name || 'Unknown')
          )
        : [],
      // Fix hooks - ensure proper structure
      hooks: Array.isArray(tableData.hooks)
        ? tableData.hooks
        : []
    };
  }
  
  // Parse location string to extract line number
  parseLocation(location: string): { file: string; line: number | null } {
    if (!location) return { file: '', line: null };
    
    const parts = location.split(':');
    const file = parts[0] || location;
    const line = parts[1] ? parseInt(parts[1], 10) : null;
    
    return { file, line };
  }
  
  // Format violation with line number
  formatViolationWithLine(violation: any): any {
    const { file, line } = this.parseLocation(violation.location);
    
    return {
      ...violation,
      file,
      line,
      formattedLocation: line ? `${file.split('/').pop()}:${line}` : file.split('/').pop()
    };
  }
}

export const entityDataProvider = EntityDataProvider.getInstance();