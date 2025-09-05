/**
 * Severity Badge Component
 * Renders severity counts with proper styling and labels
 * Matches the enhanced dashboard's severity display
 */

class SeverityBadge {
  constructor() {
    // Singleton pattern
    if (SeverityBadge.instance) {
      return SeverityBadge.instance;
    }
    SeverityBadge.instance = this;
  }

  /**
   * Render severity counts with CORRECT labels matching enhanced dashboard
   */
  renderSeverityCounts(criticalCount, warningCount, infoCount) {
    return `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <div style="color: #ef4444; font-size: 36px; font-weight: bold;">
            ${criticalCount}
          </div>
          <div style="color: #fca5a5; font-size: 13px; margin-top: 4px;">
            CRITICAL - Will Break Code
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
            Type errors, contract violations, missing imports
          </div>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <div style="color: #f59e0b; font-size: 36px; font-weight: bold;">
            ${warningCount}
          </div>
          <div style="color: #fcd34d; font-size: 13px; margin-top: 4px;">
            WARNINGS - Should Fix
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
            Missing error handling, no loading states
          </div>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <div style="color: #3b82f6; font-size: 36px; font-weight: bold;">
            ${infoCount}
          </div>
          <div style="color: #93bbfe; font-size: 13px; margin-top: 4px;">
            INFO - Nice to Have
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
            Optimizations, code style improvements
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Calculate health score with CORRECT weights from enhanced dashboard
   */
  calculateHealthScore(criticalCount, warningCount, infoCount = 0) {
    let score = 100;
    score -= criticalCount * 30;  // Critical issues = major penalty
    score -= warningCount * 10;   // Warnings = minor penalty  
    score -= infoCount * 2;       // Info = tiny penalty
    return Math.max(0, score);
  }

  /**
   * Get color based on health score
   */
  getHealthColor(score) {
    if (score >= 90) return '#10b981';  // Green
    if (score >= 70) return '#f59e0b';  // Yellow
    if (score >= 50) return '#ef4444';  // Red
    return '#991b1b';  // Dark red
  }

  /**
   * Render health score circle matching enhanced dashboard
   */
  renderHealthScore(score, size = 80) {
    const color = this.getHealthColor(score);
    return `
      <div style="text-align: center;">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color}20;
          border: 3px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.3}px;
          font-weight: bold;
          color: ${color};
          margin: 0 auto;
        ">
          ${score}
        </div>
        <div style="
          color: ${color};
          font-size: 12px;
          margin-top: 8px;
          font-weight: 500;
        ">
          ${this.getHealthStatus(score)}
        </div>
      </div>
    `;
  }

  /**
   * Get health status text
   */
  getHealthStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Work';
    return 'Critical';
  }

  /**
   * Render small severity badge for inline use
   */
  renderSmallBadge(severity, count) {
    const colors = {
      critical: { bg: '#ef444410', border: '#ef444430', text: '#ef4444' },
      warning: { bg: '#f59e0b10', border: '#f59e0b30', text: '#f59e0b' },
      info: { bg: '#3b82f610', border: '#3b82f630', text: '#3b82f6' }
    };
    
    const color = colors[severity] || colors.warning;
    
    return `
      <span style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: ${color.bg};
        border: 1px solid ${color.border};
        color: ${color.text};
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      ">
        ${count} ${severity}
      </span>
    `;
  }

  /**
   * Render severity distribution chart
   */
  renderDistributionChart(criticalCount, warningCount, infoCount) {
    const total = criticalCount + warningCount + infoCount;
    if (total === 0) return '';
    
    const criticalPercent = (criticalCount / total) * 100;
    const warningPercent = (warningCount / total) * 100;
    const infoPercent = (infoCount / total) * 100;
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      ">
        <h4 style="color: #f8fafc; margin: 0 0 12px 0; font-size: 14px;">Issue Distribution</h4>
        <div style="
          display: flex;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          background: #374151;
        ">
          <div style="
            background: #ef4444;
            width: ${criticalPercent}%;
            transition: width 0.3s ease;
          "></div>
          <div style="
            background: #f59e0b;
            width: ${warningPercent}%;
            transition: width 0.3s ease;
          "></div>
          <div style="
            background: #3b82f6;
            width: ${infoPercent}%;
            transition: width 0.3s ease;
          "></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px;">
          <span style="color: #ef4444;">${criticalCount} Critical (${criticalPercent.toFixed(1)}%)</span>
          <span style="color: #f59e0b;">${warningCount} Warning (${warningPercent.toFixed(1)}%)</span>
          <span style="color: #3b82f6;">${infoCount} Info (${infoPercent.toFixed(1)}%)</span>
        </div>
      </div>
    `;
  }

  /**
   * Count violations by severity from validation data
   */
  countBySeverity(validationData) {
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    // Count contract violations
    if (validationData?.contracts?.violations) {
      validationData.contracts.violations.forEach(v => {
        if (v.type === 'error') criticalCount++;
        else warningCount++;
      });
    }

    // Count nine rules violations
    if (validationData?.nineRules?.violations) {
      validationData.nineRules.violations.forEach(v => {
        switch (v.severity?.toLowerCase()) {
          case 'error': criticalCount++; break;
          case 'warning': warningCount++; break;
          case 'info': infoCount++; break;
          default: warningCount++; break;
        }
      });
    }

    return { criticalCount, warningCount, infoCount };
  }

  /**
   * Render complete severity overview
   */
  renderSeverityOverview(validationData) {
    const { criticalCount, warningCount, infoCount } = this.countBySeverity(validationData);
    const healthScore = this.calculateHealthScore(criticalCount, warningCount, infoCount);
    
    return `
      <div style="margin-bottom: 24px;">
        ${this.renderDistributionChart(criticalCount, warningCount, infoCount)}
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start;">
          <div>
            ${this.renderSeverityCounts(criticalCount, warningCount, infoCount)}
          </div>
          <div>
            ${this.renderHealthScore(healthScore, 120)}
          </div>
        </div>
      </div>
    `;
  }
}

// Export singleton instance
window.SeverityBadge = SeverityBadge;
window.severityBadge = new SeverityBadge();