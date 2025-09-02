/**
 * Enhanced Nine Rules View Component with Hierarchical Organization
 * Groups issues by: Component, File, Rule, Severity
 */

import { ValidationSummary, ValidationResult } from '../../validator/nine-rules-validator';

interface GroupedIssue {
  file?: string;
  line?: number;
  component?: string;
  rule: string;
  ruleNumber: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Extract and group all issues from validation results
 */
function extractAllIssues(summary: ValidationSummary): GroupedIssue[] {
  const issues: GroupedIssue[] = [];
  
  summary.results.forEach(result => {
    result.issues.forEach(issue => {
      // Handle both string and object issues
      let message: string;
      let file: string | undefined;
      let line: number | undefined;
      
      if (typeof issue === 'string') {
        message = issue;
        // Parse file path from issue message if available
        const fileMatch = message.match(/in\s+([^\s]+\.(ts|js|tsx|jsx))/);
        file = fileMatch ? fileMatch[1] : undefined;
      } else if (typeof issue === 'object' && issue !== null) {
        // Handle ValidationIssue object
        message = (issue as any).message || JSON.stringify(issue);
        file = (issue as any).file;
        line = (issue as any).line;
      } else {
        message = String(issue);
      }
      
      // Determine component from file path
      const component = file ? file.split('/').slice(-2, -1)[0] : 'Unknown';
      
      issues.push({
        file,
        line,
        component,
        rule: result.rule,
        ruleNumber: result.ruleNumber,
        message,
        severity: result.status === 'fail' ? 'critical' : 
                 result.status === 'warning' ? 'warning' : 'info'
      });
    });
  });
  
  return issues;
}

/**
 * Group issues by specified key
 */
function groupIssues(issues: GroupedIssue[], groupBy: string): Map<string, GroupedIssue[]> {
  const grouped = new Map<string, GroupedIssue[]>();
  
  issues.forEach(issue => {
    let key = 'Unknown';
    
    switch(groupBy) {
      case 'component':
        key = issue.component || 'No Component';
        break;
      case 'file':
        key = issue.file || 'No File';
        break;
      case 'rule':
        key = `Rule ${issue.ruleNumber}: ${issue.rule}`;
        break;
      case 'severity':
        key = issue.severity;
        break;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(issue);
  });
  
  return grouped;
}


/**
 * Render a group of issues
 */
function renderIssueGroup(groupName: string, issues: GroupedIssue[], isExpanded: boolean = false): string {
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  const groupId = `nine-rules-${groupName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
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
        onclick="toggleNineRulesGroup('${groupId}')"
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
          ${criticalCount > 0 ? `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${criticalCount} critical</span>` : ''}
          ${warningCount > 0 ? `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${warningCount} warnings</span>` : ''}
          <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${issues.length} total</span>
        </div>
      </div>
      
      <div id="${groupId}" style="display: ${isExpanded ? 'block' : 'none'}; margin-top: 12px; padding-left: 20px;">
        ${issues.map(issue => renderSingleIssue(issue)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single issue
 */
function renderSingleIssue(issue: GroupedIssue): string {
  const severityColors = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  const severityIcons = {
    critical: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  return `
    <div style="
      background: rgba(30, 30, 40, 0.6);
      border-left: 3px solid ${severityColors[issue.severity]};
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span>${severityIcons[issue.severity]}</span>
        <strong style="color: ${severityColors[issue.severity]};">
          Rule ${issue.ruleNumber}: ${issue.rule}
        </strong>
      </div>
      
      <div style="color: #e2e8f0; margin-bottom: 8px;">
        ${issue.message}
      </div>
      
      ${issue.file ? `
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
        " onclick="navigator.clipboard.writeText('${issue.file}')" title="Click to copy">
          📍 ${issue.file}${issue.line ? `:${issue.line}` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Main render function for enhanced nine rules view
 */
export function renderEnhancedNineRulesView(summary: ValidationSummary | null, groupBy: string = 'rule'): string {
  if (!summary) {
    return `
      <div style="padding: 20px; color: #64748b;">
        <h2 style="margin-bottom: 20px;">🔍 9 Core Rules Validation</h2>
        <p>No validation data available. Run validation first.</p>
      </div>
    `;
  }

  const grade = summary.overallScore >= 90 ? 'A' :
                summary.overallScore >= 80 ? 'B' :
                summary.overallScore >= 70 ? 'C' :
                summary.overallScore >= 60 ? 'D' : 'F';
  
  const gradeColor = summary.overallScore >= 80 ? '#10b981' :
                     summary.overallScore >= 60 ? '#f59e0b' : '#ef4444';

  const allIssues = extractAllIssues(summary);
  const grouped = groupIssues(allIssues, groupBy);
  const sortedGroups = Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length);

  return `
    <div style="padding: 20px;">
      <!-- Compact Score Bar -->
      <div style="background: rgba(30, 30, 40, 0.8); padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <h3 style="margin: 0; font-size: 16px;">✅ Code Quality</h3>
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 20px; font-weight: bold; color: ${gradeColor};">${grade}</span>
            <span style="font-size: 16px; color: ${gradeColor};">${summary.overallScore}%</span>
          </div>
        </div>
        <div style="display: flex; gap: 20px; font-size: 14px;">
          <span>✅ ${summary.passedRules} passed</span>
          <span style="color: #ef4444;">❌ ${summary.criticalIssues} critical</span>
          <span style="color: #f59e0b;">⚠️ ${summary.warnings} warnings</span>
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
        <button onclick="reloadNineRulesView('rule')" style="
          padding: 6px 12px;
          background: ${groupBy === 'rule' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Rule</button>
        <button onclick="reloadNineRulesView('component')" style="
          padding: 6px 12px;
          background: ${groupBy === 'component' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Component</button>
        <button onclick="reloadNineRulesView('file')" style="
          padding: 6px 12px;
          background: ${groupBy === 'file' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">File</button>
        <button onclick="reloadNineRulesView('severity')" style="
          padding: 6px 12px;
          background: ${groupBy === 'severity' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Severity</button>
      </div>

      <!-- Grouped Issues -->
      <div>
        ${allIssues.length > 0 ? 
          sortedGroups.map(([groupName, issues], index) => 
            renderIssueGroup(groupName, issues, index === 0)
          ).join('') :
          '<div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 8px; color: #10b981;">✅ All 9 core rules are passing!</div>'
        }
      </div>
    </div>
  `;
}