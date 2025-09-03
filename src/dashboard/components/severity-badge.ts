/**
 * Severity Badge Component
 * Consistent severity display across all tabs
 */

import { getSeverity } from '../../validator/severity-config';

export interface SeverityBadgeProps {
  severity?: 'CRITICAL' | 'WARNING' | 'INFO' | 'critical' | 'warning' | 'info' | 'error';
  message?: string;
  count?: number;
  compact?: boolean;
}

export class SeverityBadge {
  static render(props: SeverityBadgeProps): string {
    const { severity, message, count, compact = false } = props;
    
    // Determine actual severity
    let actualSeverity = severity?.toUpperCase() || 'INFO';
    if (message && !severity) {
      actualSeverity = getSeverity(message);
    }
    
    // Fix the backwards logic - map old incorrect severities to correct ones
    const severityMap: Record<string, string> = {
      'CRITICAL': 'CRITICAL',  // Type/contract errors
      'ERROR': 'CRITICAL',     // Also critical
      'WARNING': 'WARNING',    // Nice to have
      'INFO': 'INFO'          // Suggestions
    };
    
    const mappedSeverity = severityMap[actualSeverity] || 'INFO';
    
    // Get colors and labels based on CORRECT severity
    const config: Record<string, {
      bg: string;
      text: string;
      label: string;
      icon: string;
      description: string;
    }> = {
      'CRITICAL': {
        bg: '#ef4444',
        text: 'white',
        label: 'CRITICAL',
        icon: '🚨',
        description: 'WILL BREAK CODE'
      },
      'WARNING': {
        bg: '#f59e0b',
        text: 'white',
        label: 'WARNING',
        icon: '⚠️',
        description: 'Should Fix'
      },
      'INFO': {
        bg: '#3b82f6',
        text: 'white',
        label: 'INFO',
        icon: 'ℹ️',
        description: 'Nice to Have'
      }
    };
    
    const style = config[mappedSeverity] || config.INFO;
    
    if (compact) {
      return `
        <span style="
          background: ${style.bg};
          color: ${style.text};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        ">
          ${count !== undefined ? count : style.label}
        </span>
      `;
    }
    
    return `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${style.bg}20;
        border: 1px solid ${style.bg};
        padding: 4px 8px;
        border-radius: 6px;
      ">
        <span style="font-size: 14px;">${style.icon}</span>
        <span style="
          color: ${style.bg};
          font-size: 12px;
          font-weight: 600;
        ">
          ${style.label}
          ${count !== undefined ? ` (${count})` : ''}
        </span>
        <span style="
          color: #64748b;
          font-size: 10px;
        ">
          ${style.description}
        </span>
      </div>
    `;
  }
  
  static renderInline(severity: string, text?: string): string {
    const config: Record<string, any> = {
      'critical': { color: '#ef4444', icon: '🚨' },
      'error': { color: '#ef4444', icon: '🚨' },
      'warning': { color: '#f59e0b', icon: '⚠️' },
      'info': { color: '#3b82f6', icon: 'ℹ️' }
    };
    
    const style = config[severity.toLowerCase()] || config.info;
    
    return `
      <span style="color: ${style.color}; font-weight: 500;">
        ${style.icon} ${text || severity.toUpperCase()}
      </span>
    `;
  }
}