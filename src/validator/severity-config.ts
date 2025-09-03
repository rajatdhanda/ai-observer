/**
 * Unified Severity Configuration
 * CRITICAL = Will break production code
 * WARNING = Should fix but won't break
 * INFO = Nice to have
 */

export const SeverityLevels = {
  // CRITICAL - WILL BREAK YOUR CODE
  CRITICAL: {
    color: '#ef4444', // RED
    score: 50,        // Heavy penalty
    icon: '🚨',
    label: 'CRITICAL',
    issues: [
      'Type mismatch',
      'Contract violation', 
      'Missing required field',
      'Undefined variable',
      'Import not found',
      'Schema validation failure',
      'Database query without table',
      'API endpoint without handler',
      'Null pointer access',
      'Type incompatibility'
    ]
  },
  
  // WARNING - Should fix but won't break
  WARNING: {
    color: '#f59e0b', // YELLOW
    score: 10,        // Minor penalty
    icon: '⚠️',
    label: 'WARNING',
    issues: [
      'Missing error handling',
      'No loading state',
      'Missing cache invalidation',
      'No retry logic',
      'Console.log in production',
      'Unused variable',
      'Missing documentation',
      'No test coverage'
    ]
  },
  
  // INFO - Nice to have
  INFO: {
    color: '#3b82f6', // BLUE
    score: 2,         // Tiny penalty
    icon: 'ℹ️',
    label: 'INFO',
    issues: [
      'Could use memoization',
      'Consider extracting component',
      'File too long',
      'Complex function',
      'Magic number',
      'TODO comment'
    ]
  }
};

export function getSeverity(issue: string): keyof typeof SeverityLevels {
  const lowerIssue = issue.toLowerCase();
  
  // Check for CRITICAL patterns
  if (
    lowerIssue.includes('type') && (lowerIssue.includes('mismatch') || lowerIssue.includes('error')) ||
    lowerIssue.includes('contract') && lowerIssue.includes('violation') ||
    lowerIssue.includes('undefined') ||
    lowerIssue.includes('null') && lowerIssue.includes('pointer') ||
    lowerIssue.includes('cannot find') ||
    lowerIssue.includes('does not exist') ||
    lowerIssue.includes('required') && lowerIssue.includes('missing') ||
    lowerIssue.includes('schema') && lowerIssue.includes('fail')
  ) {
    return 'CRITICAL';
  }
  
  // Check for WARNING patterns
  if (
    lowerIssue.includes('error handling') ||
    lowerIssue.includes('loading state') ||
    lowerIssue.includes('cache') ||
    lowerIssue.includes('retry') ||
    lowerIssue.includes('console.log') ||
    lowerIssue.includes('unused')
  ) {
    return 'WARNING';
  }
  
  // Default to INFO
  return 'INFO';
}

export function calculateRealHealthScore(issues: Array<{message: string, severity?: string}>): number {
  let score = 100;
  
  issues.forEach(issue => {
    const severity = issue.severity || getSeverity(issue.message);
    
    switch(severity) {
      case 'CRITICAL':
      case 'critical':
      case 'error':
        score -= 50; // HUGE penalty for breaking issues
        break;
      case 'WARNING':  
      case 'warning':
        score -= 10; // Small penalty
        break;
      case 'INFO':
      case 'info':
        score -= 2;  // Tiny penalty
        break;
    }
  });
  
  return Math.max(0, score);
}

export function getHealthColor(score: number): string {
  if (score >= 90) return '#10b981'; // Green - Actually good
  if (score >= 70) return '#f59e0b'; // Yellow - Has warnings
  return '#ef4444'; // Red - Has critical issues
}

export function getHealthLabel(score: number): string {
  if (score >= 90) return 'Healthy';
  if (score >= 70) return 'Needs Attention';
  if (score >= 50) return 'Critical Issues';
  return 'BROKEN - Fix Immediately!';
}