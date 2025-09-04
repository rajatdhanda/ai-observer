/**
 * Validation Service (JavaScript version)
 * Centralized service for handling violations, line numbers, and health scoring
 * Ensures consistent behavior across all components
 */

class ValidationService {
  constructor() {
    if (ValidationService.instance) {
      return ValidationService.instance;
    }
    ValidationService.instance = this;
  }

  /**
   * Extract line number from location string
   * Handles formats like "file.ts:123" or "file.ts:123:45"
   */
  extractLineNumber(location) {
    if (!location) return null;
    const match = location.match(/:(\d+)(?::\d+)?$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Parse location string into components
   */
  parseLocation(location) {
    if (!location) return { file: '', line: null };
    
    const parts = location.split(':');
    const file = parts[0] || location;
    const line = parts[1] ? parseInt(parts[1], 10) : null;
    
    return { file, line };
  }

  /**
   * Format file location for display
   */
  formatFileLocation(filePath, line) {
    if (!filePath) return '';
    
    // Special handling for page.tsx files
    if (filePath.endsWith('/page.tsx')) {
      const parts = filePath.split('/');
      // Find the meaningful part (e.g., 'orders' from 'src/app/(main)/orders/page.tsx')
      for (let i = parts.length - 2; i >= 0; i--) {
        if (parts[i] && !parts[i].startsWith('(') && parts[i] !== 'app' && parts[i] !== 'src') {
          return line ? `${parts[i]}/page.tsx:${line}` : `${parts[i]}/page.tsx`;
        }
      }
    }
    
    // Default behavior for other files
    const fileName = filePath.split('/').pop();
    return line ? `${fileName}:${line}` : fileName;
  }

  /**
   * Get violations for any entity (table, hook, component, page)
   */
  getViolationsForEntity(entityName, validationData, entityType = 'any') {
    const violations = [];
    
    if (validationData?.contracts?.violations) {
      validationData.contracts.violations.forEach(v => {
        if (this.violationMatchesEntity(v, entityName, entityType)) {
          const { file, line } = this.parseLocation(v.location);
          violations.push({
            type: 'contract',
            severity: v.type === 'error' ? 'critical' : 'warning',
            message: v.message,
            expected: v.expected,
            actual: v.actual,
            suggestion: v.suggestion,
            location: v.location,
            file,
            line,
            formattedLocation: this.formatFileLocation(file, line)
          });
        }
      });
    }

    if (validationData?.nineRules?.violations) {
      validationData.nineRules.violations.forEach(v => {
        if (this.violationMatchesEntity(v, entityName, entityType)) {
          // Use v.file if available, otherwise v.location
          const locationString = v.file || v.location;
          const { file, line } = this.parseLocation(locationString);
          violations.push({
            type: 'nineRules',
            severity: this.mapNineRulesSeverity(v.severity),
            message: v.message,
            rule: v.rule,
            location: locationString,
            file,
            line,
            formattedLocation: this.formatFileLocation(file, line)
          });
        }
      });
    }
    
    // Add boundary violations
    if (validationData?.boundaries) {
      validationData.boundaries
        .filter(b => !b.hasValidation && this.violationMatchesEntity({ location: b.location }, entityName, entityType))
        .forEach(b => {
          const { file, line } = this.parseLocation(b.location);
          violations.push({
            type: 'boundary',
            severity: (b.boundary.includes('webhook') || b.boundary.includes('dbWrite')) ? 'critical' : 'warning',
            message: b.issue || `Missing ${b.boundary} validation`,
            location: b.location,
            file,
            line,
            formattedLocation: this.formatFileLocation(file, line),
            suggestion: 'Add .parse() or .safeParse() validation'
          });
        });
    }
    
    return violations;
  }

  /**
   * Check if a violation matches an entity
   */
  violationMatchesEntity(violation, entityName, entityType) {
    // Check entity field in violation (for contract violations)
    if (violation.entity) {
      const violationEntity = violation.entity.toLowerCase();
      const name = entityName.toLowerCase();
      
      // Direct match or plural variations
      if (violationEntity === name || 
          violationEntity + 's' === name || 
          violationEntity === name + 's') {
        return true;
      }
    }
    
    // Check location-based matching - support both 'location' and 'file' fields
    const locationField = violation.location || violation.file;
    if (!locationField) return false;
    
    const location = locationField.toLowerCase();
    const name = entityName.toLowerCase();
    
    // Direct name match
    if (location.includes(name)) return true;
    
    // Type-specific matching
    switch (entityType) {
      case 'hook':
        return location.includes('use' + name) || location.includes(name + 'hook');
      case 'component':
        return location.includes(name + 'component') || location.includes(name + '.tsx');
      case 'page':
        // For pages, entityName might be the full path like 'src/app/(main)/orders/page.tsx'
        // We should check if the violation's file path matches
        if (name.includes('page.tsx')) {
          return location === name;
        }
        return location.includes(name + '/page.tsx') || location === name;
      case 'table':
        // For tables, also check if violation entity matches
        return false; // Will be caught by entity check above
      default:
        return false;
    }
  }

  /**
   * Map nine rules severity to standard severity levels
   */
  mapNineRulesSeverity(severity) {
    switch (severity?.toLowerCase()) {
      case 'error': return 'critical';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'warning';
    }
  }

  /**
   * Calculate health score based on violations and configuration
   */
  calculateHealthScore(violations, config = {}) {
    let score = 100;
    
    // Configuration penalties
    if (config.hasErrorHandling === false) score -= 20;
    if (config.hasLoadingState === false) score -= 15;
    if (config.hasCacheInvalidation === false) score -= 10;
    if (config.hasTypeDefinition === false) score -= 20;
    if (config.hasValidation === false) score -= 15;
    
    // Violation penalties
    violations.forEach(v => {
      switch (v.severity) {
        case 'critical': score -= 15; break;
        case 'warning': score -= 8; break;
        case 'info': score -= 3; break;
        default: score -= 5; break;
      }
    });
    
    // Usage penalties
    if (config.usageCount === 0) score -= 10;
    if (config.propertiesCount === 0) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get health status text and color
   */
  getHealthStatus(score) {
    if (score >= 80) return { status: 'Healthy', color: '#10b981' };
    if (score >= 40) return { status: 'Needs Attention', color: '#f59e0b' };
    return { status: 'Critical', color: '#ef4444' };
  }

  /**
   * Render violation with consistent formatting including line numbers
   */
  renderViolation(violation, showDetails = true) {
    const severityColors = {
      critical: { bg: '#ef444410', border: '#ef444430', text: '#ef4444' },
      warning: { bg: '#f59e0b10', border: '#f59e0b30', text: '#f59e0b' },
      info: { bg: '#3b82f610', border: '#3b82f630', text: '#3b82f6' }
    };
    
    const colors = severityColors[violation.severity] || severityColors.warning;
    
    return `
      <div style="
        background: ${colors.bg};
        border: 1px solid ${colors.border};
        border-left: 3px solid ${colors.text};
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="
              display: inline-block;
              padding: 2px 6px;
              background: ${colors.bg};
              color: ${colors.text};
              border-radius: 4px;
              font-size: 10px;
              text-transform: uppercase;
              margin-bottom: 8px;
              font-weight: 600;
            ">
              ${violation.severity}
            </div>
            <div style="color: #f8fafc; font-size: 14px; line-height: 1.4;">
              ${violation.message}
            </div>
            ${violation.suggestion && showDetails ? `
              <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                💡 ${violation.suggestion}
              </div>
            ` : ''}
            ${violation.expected && violation.actual && showDetails ? `
              <div style="margin-top: 8px; font-family: monospace; font-size: 12px;">
                <div style="color: #10b981;">Expected: ${violation.expected}</div>
                <div style="color: #ef4444;">Actual: ${violation.actual || 'undefined'}</div>
              </div>
            ` : ''}
          </div>
          ${violation.line ? `
            <span style="
              padding: 4px 8px;
              background: #667eea20;
              color: #667eea;
              border-radius: 4px;
              font-size: 11px;
              font-family: monospace;
              white-space: nowrap;
            ">Line ${violation.line}</span>
          ` : ''}
        </div>
        ${violation.file && showDetails ? `
          <div style="
            color: #64748b;
            font-size: 11px;
            font-family: monospace;
            margin-top: 8px;
            opacity: 0.7;
          ">
            📁 ${violation.formattedLocation}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render multiple violations as a block
   */
  renderViolations(violations, title = 'Issues Found', showDetails = true) {
    if (!violations || violations.length === 0) {
      return `
        <div style="
          background: #10b98120;
          border: 1px solid #10b98140;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          color: #10b981;
        ">
          ✅ No issues found
        </div>
      `;
    }

    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f87171; margin: 0 0 16px 0;">
          ⚠️ ${title} (${violations.length})
        </h3>
        <div>
          ${violations.map(v => this.renderViolation(v, showDetails)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get summary statistics for violations
   */
  getViolationStats(violations) {
    const stats = {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      warning: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length
    };
    
    return stats;
  }

  /**
   * Format entity name for display
   */
  formatEntityName(name, type) {
    if (type === 'page') {
      if (name.includes('(main)')) {
        const parts = name.split('/');
        const mainIdx = parts.findIndex(p => p === '(main)');
        if (mainIdx >= 0 && mainIdx < parts.length - 1) {
          return `(main) > ${parts[mainIdx + 1]}`;
        }
      }
      const parts = name.split('/');
      const pageName = parts[parts.length - 2];
      return pageName === 'app' ? 'Home' : pageName;
    }
    
    return name;
  }
}

// Export singleton instance
window.ValidationService = ValidationService;
window.validationService = new ValidationService();