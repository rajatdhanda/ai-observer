/**
 * Validation Aggregator Component
 * Fetches contract violations and code quality issues
 * Maps them to specific architecture items (tables, hooks, components)
 * Max 500 lines
 */

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  source: 'contract' | 'nine-rules' | 'type-check';
  rule?: string;
  ruleNumber?: number;
  message: string;
  file?: string;
  line?: number;
  expected?: string;
  actual?: string;
  suggestion?: string;
}

export interface ValidationData {
  contracts: {
    score: number;
    violations: any[];
    passed: number;
    failed: number;
  };
  nineRules: {
    overallScore: number;
    results: any[];
    criticalIssues: number;
    warnings: number;
  };
  itemIssues: Map<string, ValidationIssue[]>;
}

export class ValidationAggregator {
  private static instance: ValidationAggregator;
  private validationData: ValidationData | null = null;
  private lastFetch: number = 0;
  private cacheTimeout: number = 30000; // 30 seconds cache
  
  private constructor() {}
  
  static getInstance(): ValidationAggregator {
    if (!ValidationAggregator.instance) {
      ValidationAggregator.instance = new ValidationAggregator();
    }
    return ValidationAggregator.instance;
  }
  
  async fetchValidationData(force: boolean = false): Promise<ValidationData> {
    // Check cache
    if (!force && this.validationData && (Date.now() - this.lastFetch < this.cacheTimeout)) {
      return this.validationData;
    }
    
    try {
      // Fetch both validation sources in parallel
      const [contractsRes, nineRulesRes] = await Promise.all([
        fetch('/api/contracts'),
        fetch('/api/nine-rules')
      ]);
      
      const [contractsData, nineRulesData] = await Promise.all([
        contractsRes.json(),
        nineRulesRes.json()
      ]);
      
      // Process and map issues to items
      const itemIssues = this.mapIssuesToItems(contractsData, nineRulesData);
      
      this.validationData = {
        contracts: {
          score: contractsData.score || 0,
          violations: contractsData.violations || [],
          passed: contractsData.passed || 0,
          failed: contractsData.failed || 0
        },
        nineRules: {
          overallScore: nineRulesData.overallScore || 0,
          results: nineRulesData.results || [],
          criticalIssues: nineRulesData.criticalIssues || 0,
          warnings: nineRulesData.warnings || 0
        },
        itemIssues
      };
      
      this.lastFetch = Date.now();
      return this.validationData;
      
    } catch (error) {
      console.error('Failed to fetch validation data:', error);
      
      // Return empty data on error
      return {
        contracts: { score: 100, violations: [], passed: 0, failed: 0 },
        nineRules: { overallScore: 100, results: [], criticalIssues: 0, warnings: 0 },
        itemIssues: new Map()
      };
    }
  }
  
  private mapIssuesToItems(contractsData: any, nineRulesData: any): Map<string, ValidationIssue[]> {
    const itemIssues = new Map<string, ValidationIssue[]>();
    
    // Map contract violations
    if (contractsData.violations) {
      contractsData.violations.forEach((violation: any) => {
        const issue: ValidationIssue = {
          severity: violation.type === 'error' ? 'critical' : 'warning',
          source: 'contract',
          message: violation.message,
          file: this.extractFilePath(violation.location),
          line: this.extractLineNumber(violation.location),
          expected: violation.expected,
          actual: violation.actual,
          suggestion: violation.suggestion
        };
        
        // Map to entity name or file
        const itemKey = this.getItemKeyFromViolation(violation);
        if (!itemIssues.has(itemKey)) {
          itemIssues.set(itemKey, []);
        }
        itemIssues.get(itemKey)!.push(issue);
      });
    }
    
    // Map nine rules issues
    if (nineRulesData.results) {
      nineRulesData.results.forEach((result: any) => {
        if (result.issues) {
          result.issues.forEach((issue: any) => {
            const validationIssue: ValidationIssue = {
              severity: issue.severity || 'warning',
              source: 'nine-rules',
              rule: result.rule,
              ruleNumber: result.ruleNumber,
              message: issue.message,
              file: issue.file,
              line: issue.line,
              suggestion: issue.suggestion
            };
            
            // Map to item based on file path
            const itemKey = this.getItemKeyFromFile(issue.file);
            if (!itemIssues.has(itemKey)) {
              itemIssues.set(itemKey, []);
            }
            itemIssues.get(itemKey)!.push(validationIssue);
          });
        }
      });
    }
    
    return itemIssues;
  }
  
  getIssuesForItem(itemName: string, itemType: string): ValidationIssue[] {
    if (!this.validationData) return [];
    
    const issues: ValidationIssue[] = [];
    
    // Get direct issues for this item
    const directIssues = this.validationData.itemIssues.get(itemName) || [];
    issues.push(...directIssues);
    
    // For hooks/components, also check for file-based issues
    if (itemType === 'hook' || itemType === 'component') {
      // Search for issues in files that might contain this hook/component
      this.validationData.itemIssues.forEach((fileIssues, key) => {
        if (key.toLowerCase().includes(itemName.toLowerCase())) {
          issues.push(...fileIssues);
        }
      });
    }
    
    // For tables, check for schema/type issues
    if (itemType === 'table') {
      const schemaKey = `${itemName}Schema`;
      const schemaIssues = this.validationData.itemIssues.get(schemaKey) || [];
      issues.push(...schemaIssues);
      
      const typeKey = `${itemName}Type`;
      const typeIssues = this.validationData.itemIssues.get(typeKey) || [];
      issues.push(...typeIssues);
    }
    
    // Remove duplicates
    return this.deduplicateIssues(issues);
  }
  
  getOverallHealth(): { score: number; critical: number; warnings: number; info: number } {
    if (!this.validationData) {
      return { score: 100, critical: 0, warnings: 0, info: 0 };
    }
    
    // Calculate combined score
    const contractScore = this.validationData.contracts.score;
    const nineRulesScore = this.validationData.nineRules.overallScore;
    const combinedScore = Math.round((contractScore + nineRulesScore) / 2);
    
    // Count issues by severity
    let critical = 0;
    let warnings = 0;
    let info = 0;
    
    this.validationData.itemIssues.forEach(issues => {
      issues.forEach(issue => {
        if (issue.severity === 'critical') critical++;
        else if (issue.severity === 'warning') warnings++;
        else info++;
      });
    });
    
    return { score: combinedScore, critical, warnings, info };
  }
  
  // Get issues for a specific file
  getIssuesForFile(filePath: string): ValidationIssue[] {
    if (!this.validationData) return [];
    
    const issues: ValidationIssue[] = [];
    
    // Check contract violations
    this.validationData.contracts.violations.forEach(violation => {
      if (violation.location && violation.location.includes(filePath)) {
        issues.push({
          severity: violation.type === 'error' ? 'critical' : 'warning',
          source: 'contract',
          message: violation.message,
          file: filePath,
          expected: violation.expected,
          actual: violation.actual,
          suggestion: violation.suggestion
        });
      }
    });
    
    // Check nine rules issues
    this.validationData.nineRules.results.forEach(result => {
      if (result.issues) {
        result.issues.forEach((issue: any) => {
          if (issue.file && issue.file.includes(filePath)) {
            issues.push({
              severity: issue.severity || 'warning',
              source: 'nine-rules',
              rule: result.rule,
              ruleNumber: result.ruleNumber,
              message: issue.message,
              file: issue.file,
              line: issue.line,
              suggestion: issue.suggestion
            });
          }
        });
      }
    });
    
    return issues;
  }
  
  // Format issue for display
  formatIssue(issue: ValidationIssue): string {
    let formatted = issue.message;
    
    if (issue.rule) {
      formatted = `[Rule ${issue.ruleNumber}: ${issue.rule}] ${formatted}`;
    }
    
    if (issue.expected && issue.actual) {
      formatted += `\nExpected: ${issue.expected}\nActual: ${issue.actual}`;
    }
    
    if (issue.suggestion) {
      formatted += `\nSuggestion: ${issue.suggestion}`;
    }
    
    return formatted;
  }
  
  // Get validation summary for display
  getValidationSummary(): {
    contracts: { passed: number; failed: number; score: number };
    codeQuality: { passed: number; failed: number; score: number };
    overall: { score: number; status: string };
  } {
    if (!this.validationData) {
      return {
        contracts: { passed: 0, failed: 0, score: 100 },
        codeQuality: { passed: 0, failed: 0, score: 100 },
        overall: { score: 100, status: 'healthy' }
      };
    }
    
    const contracts = {
      passed: this.validationData.contracts.passed,
      failed: this.validationData.contracts.failed,
      score: this.validationData.contracts.score
    };
    
    const codeQuality = {
      passed: this.validationData.nineRules.results.filter(r => r.status === 'pass').length,
      failed: this.validationData.nineRules.results.filter(r => r.status === 'fail').length,
      score: this.validationData.nineRules.overallScore
    };
    
    const overallScore = Math.round((contracts.score + codeQuality.score) / 2);
    const status = overallScore >= 80 ? 'healthy' : overallScore >= 50 ? 'needs-attention' : 'critical';
    
    return {
      contracts,
      codeQuality,
      overall: { score: overallScore, status }
    };
  }
  
  // Helper methods
  private extractFilePath(location: string): string {
    if (!location) return '';
    const parts = location.split(':');
    return parts[0] || location;
  }
  
  private extractLineNumber(location: string): number {
    if (!location) return 0;
    const parts = location.split(':');
    return parts[1] ? parseInt(parts[1]) : 0;
  }
  
  private getItemKeyFromViolation(violation: any): string {
    // Try to extract entity name
    if (violation.entity) return violation.entity;
    
    // Try to extract from location
    if (violation.location) {
      const file = this.extractFilePath(violation.location);
      const fileName = file.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || '';
      return fileName;
    }
    
    return 'unknown';
  }
  
  private getItemKeyFromFile(filePath: string): string {
    if (!filePath) return 'unknown';
    
    // Extract component/hook name from file path
    const fileName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || '';
    
    // Handle special cases
    if (fileName.includes('.hook')) return fileName.replace('.hook', '');
    if (fileName.includes('.component')) return fileName.replace('.component', '');
    if (fileName.includes('.schema')) return fileName.replace('.schema', '');
    if (fileName.includes('.types')) return fileName.replace('.types', '');
    
    return fileName;
  }
  
  private deduplicateIssues(issues: ValidationIssue[]): ValidationIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.source}-${issue.message}-${issue.file}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  // Get health score for a specific item
  calculateItemHealth(itemName: string, itemType: string, baseScore: number = 100): number {
    const issues = this.getIssuesForItem(itemName, itemType);
    
    let score = baseScore;
    
    issues.forEach(issue => {
      if (issue.severity === 'critical') {
        score -= 20;
      } else if (issue.severity === 'warning') {
        score -= 10;
      } else {
        score -= 5;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Render issues as HTML
  renderIssuesHTML(issues: ValidationIssue[]): string {
    if (issues.length === 0) {
      return `
        <div style="
          padding: 12px;
          background: #10b98120;
          border: 1px solid #10b98140;
          border-radius: 8px;
          color: #10b981;
        ">
          ✅ No validation issues found
        </div>
      `;
    }
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');
    const infoIssues = issues.filter(i => i.severity === 'info');
    
    return `
      <div style="margin-bottom: 16px;">
        ${criticalIssues.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <h4 style="color: #ef4444; font-size: 13px; margin: 0 0 8px 0;">
              Critical Issues (${criticalIssues.length})
            </h4>
            ${criticalIssues.map(issue => this.renderSingleIssue(issue)).join('')}
          </div>
        ` : ''}
        
        ${warningIssues.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 8px 0;">
              Warnings (${warningIssues.length})
            </h4>
            ${warningIssues.map(issue => this.renderSingleIssue(issue)).join('')}
          </div>
        ` : ''}
        
        ${infoIssues.length > 0 ? `
          <div>
            <h4 style="color: #3b82f6; font-size: 13px; margin: 0 0 8px 0;">
              Info (${infoIssues.length})
            </h4>
            ${infoIssues.map(issue => this.renderSingleIssue(issue)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private renderSingleIssue(issue: ValidationIssue): string {
    const colors = {
      critical: { bg: '#7f1d1d', border: '#ef4444', text: '#fca5a5' },
      warning: { bg: '#7c2d12', border: '#f59e0b', text: '#fcd34d' },
      info: { bg: '#1e3a8a', border: '#3b82f6', text: '#93c5fd' }
    };
    
    const color = colors[issue.severity];
    
    return `
      <div style="
        background: ${color.bg}20;
        padding: 12px;
        border-radius: 6px;
        border-left: 3px solid ${color.border};
        margin-bottom: 8px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
          <div style="flex: 1;">
            ${issue.rule ? `
              <span style="
                background: ${color.border};
                color: white;
                padding: 1px 6px;
                border-radius: 10px;
                font-size: 10px;
                margin-right: 8px;
              ">
                Rule ${issue.ruleNumber}
              </span>
              <span style="color: ${color.text}; font-weight: 600; font-size: 12px;">
                ${issue.rule}
              </span>
            ` : `
              <span style="
                background: ${color.border};
                color: white;
                padding: 1px 6px;
                border-radius: 10px;
                font-size: 10px;
                text-transform: uppercase;
              ">
                ${issue.source}
              </span>
            `}
          </div>
        </div>
        <div style="color: #e2e8f0; font-size: 12px; margin: 8px 0;">
          ${issue.message}
        </div>
        ${issue.expected && issue.actual ? `
          <div style="
            background: #0a0a0a;
            padding: 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 11px;
          ">
            <div style="color: #64748b;">Expected: <span style="color: #10b981; font-family: monospace;">${issue.expected}</span></div>
            <div style="color: #64748b;">Actual: <span style="color: #ef4444; font-family: monospace;">${issue.actual}</span></div>
          </div>
        ` : ''}
        ${issue.suggestion ? `
          <div style="color: #10b981; font-size: 11px; margin-top: 4px;">
            💡 ${issue.suggestion}
          </div>
        ` : ''}
        ${issue.file ? `
          <div style="color: #64748b; font-size: 10px; margin-top: 4px; font-family: monospace;">
            📁 ${issue.file.split('/').slice(-2).join('/')}${issue.line ? `:${issue.line}` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Export singleton instance
export const validationAggregator = ValidationAggregator.getInstance();