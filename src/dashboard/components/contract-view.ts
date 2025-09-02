/**
 * Dashboard component for displaying contract validation results with hierarchical organization
 * Supports clustering by: Table, Hook, Component, File, Severity
 */

export interface ContractViolation {
  table?: string;
  hook?: string;
  component?: string;
  file?: string;
  line?: number;
  field?: string;
  rule?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;
}

export interface ContractValidationResult {
  violations: ContractViolation[];
  totalChecked: number;
  passed: number;
  failed: number;
  timestamp?: Date;
}

/**
 * Groups violations by a specified key for hierarchical display
 */
function groupViolations(violations: ContractViolation[], groupBy: string): Map<string, ContractViolation[]> {
  const grouped = new Map<string, ContractViolation[]>();
  
  violations.forEach(violation => {
    let key = 'Unknown';
    
    switch(groupBy) {
      case 'table':
        key = violation.table || 'No Table';
        break;
      case 'hook':
        key = violation.hook || 'No Hook';
        break;
      case 'component':
        key = violation.component || 'No Component';
        break;
      case 'api':
        // Extract API/Route name with nested folder structure
        if (violation.file) {
          const filePath = violation.file.toLowerCase();
          if (filePath.includes('/api/') || filePath.includes('/routes/')) {
            // Extract the full path after api/routes
            const parts = violation.file.split('/');
            const apiIndex = parts.findIndex(p => p.toLowerCase() === 'api' || p.toLowerCase() === 'routes');
            if (apiIndex >= 0 && apiIndex < parts.length - 1) {
              // Get all parts after 'api' until the file, creating nested structure
              const pathParts = parts.slice(apiIndex + 1);
              const fileName = pathParts[pathParts.length - 1].replace(/\.(ts|js|tsx|jsx)$/, '');
              
              if (pathParts.length > 1) {
                // Has nested folders - show as "folder/subfolder"
                const folders = pathParts.slice(0, -1).join('/');
                key = `📁 ${folders}/${fileName}`;
              } else {
                // Direct file in api folder
                key = fileName;
              }
            } else {
              key = 'API Endpoint';
            }
          } else {
            key = 'Not an API';
          }
        } else {
          key = 'No API';
        }
        break;
      case 'page':
        // Extract Page name with nested folder structure
        if (violation.file) {
          const filePath = violation.file.toLowerCase();
          if (filePath.includes('/app/') || filePath.includes('/pages/')) {
            // Extract the full path after app/pages
            const parts = violation.file.split('/');
            const pageIndex = parts.findIndex(p => p.toLowerCase() === 'app' || p.toLowerCase() === 'pages');
            if (pageIndex >= 0 && pageIndex < parts.length - 1) {
              // Get all parts after 'app/pages' until the file
              const pathParts = parts.slice(pageIndex + 1);
              const fileName = pathParts[pathParts.length - 1].replace(/\.(ts|js|tsx|jsx)$/, '');
              
              // Handle special Next.js patterns
              const isRouteGroup = pathParts.some(p => p.startsWith('(') && p.endsWith(')'));
              
              if (pathParts.length > 1) {
                // Has nested folders - show full path
                const folders = pathParts.slice(0, -1).map(folder => {
                  // Show route groups in parentheses
                  if (folder.startsWith('(') && folder.endsWith(')')) {
                    return folder;
                  }
                  return folder;
                }).join('/');
                key = `📁 ${folders}/${fileName}`;
              } else {
                // Direct file in app/pages folder
                key = fileName;
              }
            } else {
              key = 'Page';
            }
          } else {
            key = 'Not a Page';
          }
        } else {
          key = 'No Page';
        }
        break;
      case 'severity':
        key = violation.severity;
        break;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(violation);
  });
  
  return grouped;
}

/**
 * Renders a single violation with actionable information
 */
function renderViolation(violation: ContractViolation, index: number): string {
  const severityColors = {
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  const severityIcons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const location = violation.file && violation.line 
    ? `${violation.file}:${violation.line}` 
    : violation.file || '';
    
  return `
    <div style="
      background: rgba(30, 30, 40, 0.6);
      border-left: 3px solid ${severityColors[violation.severity]};
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span>${severityIcons[violation.severity]}</span>
        <strong style="color: ${severityColors[violation.severity]};">
          ${violation.rule || 'Contract Violation'}
        </strong>
        ${violation.field ? `<span style="color: #60a5fa;">Field: ${violation.field}</span>` : ''}
      </div>
      
      <div style="color: #e2e8f0; margin-bottom: 8px;">
        ${violation.message}
      </div>
      
      ${location ? `
        <div style="
          background: rgba(59, 130, 246, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
          color: #60a5fa;
          cursor: pointer;
          word-break: break-all;
          margin-top: 8px;
        " onclick="navigator.clipboard.writeText('${location}')" title="Click to copy">
          📍 ${location}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Renders a group of violations with collapsible sections
 */
function renderViolationGroup(groupName: string, violations: ContractViolation[], isExpanded: boolean = false): string {
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  
  const groupId = `group-${groupName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  return `
    <div style="margin-bottom: 20px;">
      <div 
        style="
          background: rgba(30, 30, 40, 0.8);
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        "
        onclick="toggleGroup('${groupId}')"
        onmouseover="this.style.background='rgba(30, 30, 40, 1)'"
        onmouseout="this.style.background='rgba(30, 30, 40, 0.8)'"
      >
        <div style="display: flex; align-items: center; gap: 12px;">
          <span id="${groupId}-arrow" style="transition: transform 0.2s;">
            ${isExpanded ? '▼' : '▶'}
          </span>
          <strong style="font-size: 16px; color: #e2e8f0;">${groupName}</strong>
        </div>
        
        <div style="display: flex; gap: 12px;">
          ${errorCount > 0 ? `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${errorCount} errors</span>` : ''}
          ${warningCount > 0 ? `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${warningCount} warnings</span>` : ''}
          <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${violations.length} total</span>
        </div>
      </div>
      
      <div id="${groupId}" style="display: ${isExpanded ? 'block' : 'none'}; margin-top: 12px; padding-left: 20px;">
        ${violations.map((v, i) => renderViolation(v, i)).join('')}
      </div>
    </div>
  `;
}

/**
 * Main render function for contract validation view
 */
export function renderContractView(result: ContractValidationResult | null, groupBy: string = 'table'): string {
  if (!result || !result.violations) {
    return `
      <div style="padding: 20px; color: #64748b;">
        <h2 style="margin-bottom: 20px;">📋 Contract Validation</h2>
        <div style="background: rgba(30, 30, 40, 0.6); padding: 20px; border-radius: 8px;">
          <p>No contract validation data available.</p>
          <p style="margin-top: 10px;">To define contracts:</p>
          <ol style="margin-left: 20px; margin-top: 10px; line-height: 1.8;">
            <li>Create a <code>contracts.yaml</code> file in your project root</li>
            <li>Define your data contracts for tables, hooks, and components</li>
            <li>Run contract validation to check compliance</li>
          </ol>
        </div>
      </div>
    `;
  }
  
  const successRate = result.totalChecked > 0 
    ? Math.round((result.passed / result.totalChecked) * 100)
    : 0;
    
  const grouped = groupViolations(result.violations, groupBy);
  
  // Sort groups by violation count (most problematic first)
  const sortedGroups = Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  return `
    <div style="padding: 20px;">
      <!-- Compact Score Bar -->
      <div style="background: rgba(30, 30, 40, 0.8); padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <h3 style="margin: 0; font-size: 16px;">📋 Contracts</h3>
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 20px; font-weight: bold; color: ${successRate >= 80 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444'};">
              ${successRate}%
            </span>
            <span style="font-size: 14px; color: #64748b;">compliance</span>
          </div>
        </div>
        <div style="display: flex; gap: 20px; font-size: 14px;">
          <span>✅ ${result.passed} passed</span>
          <span style="color: #ef4444;">❌ ${result.failed} failed</span>
          <span>📊 ${result.totalChecked} total</span>
        </div>
      </div>
      
      <!-- Grouping Controls -->
      <div style="
        background: rgba(30, 30, 40, 0.6);
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        gap: 12px;
        align-items: center;
      ">
        <strong>Group by:</strong>
        <button onclick="reloadContractView('table')" style="
          padding: 6px 12px;
          background: ${groupBy === 'table' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Table</button>
        <button onclick="reloadContractView('hook')" style="
          padding: 6px 12px;
          background: ${groupBy === 'hook' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Hook</button>
        <button onclick="reloadContractView('component')" style="
          padding: 6px 12px;
          background: ${groupBy === 'component' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Component</button>
        <button onclick="reloadContractView('api')" style="
          padding: 6px 12px;
          background: ${groupBy === 'api' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">API</button>
        <button onclick="reloadContractView('page')" style="
          padding: 6px 12px;
          background: ${groupBy === 'page' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Pages</button>
        <button onclick="reloadContractView('severity')" style="
          padding: 6px 12px;
          background: ${groupBy === 'severity' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Severity</button>
      </div>
      
      <!-- Violations by Group -->
      <div>
        ${sortedGroups.length > 0 ? 
          sortedGroups.map(([groupName, violations], index) => 
            renderViolationGroup(groupName, violations, false) // All collapsed by default
          ).join('') :
          '<div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 8px; color: #10b981;">✅ All contracts are passing!</div>'
        }
      </div>
    </div>
  `;
}

/**
 * Helper function to convert raw contract errors into structured violations
 */
export function parseContractErrors(errors: any[]): ContractViolation[] {
  const violations: ContractViolation[] = [];
  
  errors.forEach(error => {
    // Parse different error formats - this handles various contract validator outputs
    if (typeof error === 'string') {
      // Simple string error
      violations.push({
        message: error,
        severity: 'error'
      });
    } else if (error.path && error.message) {
      // Zod-style error
      violations.push({
        field: error.path.join('.'),
        message: error.message,
        severity: 'error',
        table: error.path[0], // First part is often the table
        suggestedFix: `Ensure ${error.path.join('.')} meets contract requirements`
      });
    } else if (error.table && error.violation) {
      // Structured contract violation
      violations.push({
        table: error.table,
        hook: error.hook,
        component: error.component,
        file: error.file,
        line: error.line,
        field: error.field,
        rule: error.rule,
        message: error.violation,
        severity: error.severity || 'error',
        suggestedFix: error.fix
      });
    } else if (error.entity && error.location) {
      // Contract validator format with location string
      const [filePath, lineNum] = error.location.split(':');
      const file = filePath || error.location;
      const line = lineNum ? parseInt(lineNum) : undefined;
      
      // Extract hook/component from file path
      let hook: string | undefined;
      let component: string | undefined;
      
      if (file.includes('hooks/') || file.includes('use')) {
        // It's a hook
        const hookMatch = file.match(/use[A-Z]\w+/);
        hook = hookMatch ? hookMatch[0] : 'Custom Hook';
      } else if (file.includes('components/') || file.includes('.tsx')) {
        // It's a component
        const filename = file.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '');
        component = filename;
      }
      
      violations.push({
        table: error.entity,
        hook,
        component,
        file,
        line,
        field: error.expected || error.field,
        rule: error.type || 'contract',
        message: error.message,
        severity: error.type === 'warning' ? 'warning' : 'error',
        suggestedFix: error.suggestion
      });
    } else {
      // Generic object error
      violations.push({
        message: JSON.stringify(error),
        severity: 'error'
      });
    }
  });
  
  return violations;
}