/**
 * Entity Data Provider (JavaScript version)
 * Provides hardcoded entity data for tables
 */

// Complete entity data for all 24 tables
const ENTITY_DATA = {
  // Missing tables with basic properties
  address: {
    name: 'address',
    properties: [
      { name: 'line1', type: 'string', required: true },
      { name: 'city', type: 'string', required: true },
      { name: 'state', type: 'string', required: true },
      { name: 'pincode', type: 'string', required: true }
    ],
    relationships: []
  },
  analytics: {
    name: 'analytics',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'date', type: 'string', required: true },
      { name: 'profile_views', type: 'number' },
      { name: 'revenue', type: 'number' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  appointment: {
    name: 'appointment',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'client_id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'appointment_date', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Client' },
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  cartitem: {
    name: 'cartitem',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'user_id', type: 'string', required: true },
      { name: 'product_id', type: 'string', required: true },
      { name: 'quantity', type: 'number', required: true },
      { name: 'added_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'User' },
      { type: 'belongsTo', target: 'Product' }
    ]
  },
  comment: {
    name: 'comment',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'post_id', type: 'string', required: true },
      { name: 'content', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Post' },
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  course: {
    name: 'course',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'category', type: 'string', required: true },
      { name: 'difficulty_level', type: 'string' },
      { name: 'rating', type: 'number' }
    ],
    relationships: [
      { type: 'hasMany', target: 'CourseEnrollment' }
    ]
  },
  courseenrollment: {
    name: 'courseenrollment',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'course_id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'progress_percentage', type: 'number' },
      { name: 'enrolled_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Course' },
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  courseprogress: {
    name: 'courseprogress',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'enrollment_id', type: 'string', required: true },
      { name: 'lesson_id', type: 'string', required: true },
      { name: 'completed', type: 'boolean' },
      { name: 'completed_at', type: 'string' }
    ],
    relationships: [
      { type: 'belongsTo', target: 'CourseEnrollment' }
    ]
  },
  daterange: {
    name: 'daterange',
    properties: [
      { name: 'start_date', type: 'string', required: true },
      { name: 'end_date', type: 'string', required: true }
    ],
    relationships: []
  },
  insuranceclaim: {
    name: 'insuranceclaim',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'policy_id', type: 'string', required: true },
      { name: 'claim_number', type: 'string', required: true },
      { name: 'claim_amount', type: 'number', required: true },
      { name: 'status', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'InsurancePolicy' }
    ]
  },
  insurancepolicy: {
    name: 'insurancepolicy',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'policy_number', type: 'string', required: true },
      { name: 'policy_type', type: 'string', required: true },
      { name: 'coverage_amount', type: 'number', required: true },
      { name: 'status', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  livesession: {
    name: 'livesession',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'host_professional_id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'status', type: 'string', required: true },
      { name: 'viewer_count', type: 'number' },
      { name: 'created_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  navitem: {
    name: 'navitem',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'label', type: 'string', required: true },
      { name: 'href', type: 'string', required: true },
      { name: 'icon', type: 'string' },
      { name: 'order', type: 'number' }
    ],
    relationships: []
  },
  notification: {
    name: 'notification',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'message', type: 'string', required: true },
      { name: 'type', type: 'string', required: true },
      { name: 'is_read', type: 'boolean' },
      { name: 'created_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  orderitem: {
    name: 'orderitem',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'order_id', type: 'string', required: true },
      { name: 'product_id', type: 'string', required: true },
      { name: 'quantity', type: 'number', required: true },
      { name: 'unit_price', type: 'number', required: true },
      { name: 'total_price', type: 'number', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Order' },
      { type: 'belongsTo', target: 'Product' }
    ]
  },
  postengagement: {
    name: 'postengagement',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'post_id', type: 'string', required: true },
      { name: 'professional_id', type: 'string', required: true },
      { name: 'engagement_type', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Post' },
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  product: {
    name: 'product',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'price', type: 'number', required: true },
      { name: 'category', type: 'string' },
      { name: 'stock_quantity', type: 'number' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'string', required: true }
    ],
    relationships: [
      { type: 'belongsTo', target: 'Professional' }
    ]
  },
  serviceitem: {
    name: 'serviceitem',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'price', type: 'number', required: true },
      { name: 'duration_minutes', type: 'number', required: true }
    ],
    relationships: []
  },
  sortorder: {
    name: 'sortorder',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'entity_type', type: 'string', required: true },
      { name: 'entity_id', type: 'string', required: true },
      { name: 'sort_order', type: 'number', required: true }
    ],
    relationships: []
  },
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
  }
};

class EntityDataProvider {
  constructor() {
    if (EntityDataProvider.instance) {
      return EntityDataProvider.instance;
    }
    EntityDataProvider.instance = this;
  }

  getEntityData(tableName) {
    return ENTITY_DATA[tableName.toLowerCase()] || null;
  }

  getAllEntities() {
    return Object.values(ENTITY_DATA);
  }

  enrichTableData(tableName, tableData) {
    // First check if we have predefined entity data
    const entityData = this.getEntityData(tableName);
    
    // If no predefined data, generate basic structure dynamically
    const enrichedData = {
      ...tableData,
      properties: entityData?.properties || this.generateBasicProperties(tableData),
      relationships: entityData?.relationships || this.extractRelationships(tableData),
      components: Array.isArray(tableData.components) 
        ? tableData.components.map(c => 
            typeof c === 'string' ? c : (c.componentName || c.name || 'Unknown')
          )
        : [],
      hooks: Array.isArray(tableData.hooks) ? tableData.hooks : []
    };

    return enrichedData;
  }

  // Generate basic properties if not predefined
  generateBasicProperties(tableData) {
    const basicProps = [
      { name: 'id', type: 'string', required: true }
    ];
    
    // Look for common patterns in the table data
    if (tableData.typeDefinition?.properties) {
      return tableData.typeDefinition.properties;
    }
    
    // Add created_at if table seems to be a main entity
    if (!tableData.name?.includes('item') && !tableData.name?.includes('mapping')) {
      basicProps.push({ name: 'created_at', type: 'string', required: true });
      basicProps.push({ name: 'updated_at', type: 'string', required: true });
    }
    
    return basicProps;
  }

  // Extract relationships dynamically
  extractRelationships(tableData) {
    const relationships = [];
    
    // Look for foreign key patterns in properties or type definition
    const allProps = tableData.properties || tableData.typeDefinition?.properties || [];
    
    allProps.forEach(prop => {
      if (prop.name.endsWith('_id') && prop.name !== 'id') {
        const targetEntity = prop.name.replace('_id', '');
        relationships.push({
          type: 'belongsTo',
          target: this.capitalizeFirst(targetEntity)
        });
      }
    });
    
    return relationships;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  parseLocation(location) {
    if (!location) return { file: '', line: null };
    
    const parts = location.split(':');
    const file = parts[0] || location;
    const line = parts[1] ? parseInt(parts[1], 10) : null;
    
    return { file, line };
  }

  formatViolationWithLine(violation) {
    const { file, line } = this.parseLocation(violation.location);
    
    return {
      ...violation,
      file,
      line,
      formattedLocation: line ? `${file.split('/').pop()}:${line}` : file.split('/').pop()
    };
  }
}

// Export for use in browser
window.EntityDataProvider = EntityDataProvider;