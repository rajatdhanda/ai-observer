/**
 * Health Score Component
 * Displays health scores with CORRECT severity logic
 */

export interface HealthScoreProps {
  score: number;
  criticalCount?: number;
  warningCount?: number;
  infoCount?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export class HealthScore {
  static calculateScore(critical: number, warnings: number, info: number = 0): number {
    // CORRECT scoring logic
    let score = 100;
    score -= critical * 30;  // Critical issues = major penalty
    score -= warnings * 10;  // Warnings = minor penalty
    score -= info * 2;       // Info = tiny penalty
    return Math.max(0, score);
  }
  
  static getColor(score: number): string {
    // CORRECT color logic based on actual severity
    if (score >= 90) return '#10b981';  // Green - actually healthy
    if (score >= 70) return '#f59e0b';  // Yellow - has warnings
    if (score >= 50) return '#ef4444';  // Red - has critical issues
    return '#991b1b';  // Dark red - severely broken
  }
  
  static getLabel(score: number): string {
    if (score >= 90) return 'Healthy';
    if (score >= 70) return 'Needs Attention';
    if (score >= 50) return 'Critical Issues';
    return 'BROKEN - Fix Now!';
  }
  
  static render(props: HealthScoreProps): string {
    const { 
      score, 
      criticalCount = 0, 
      warningCount = 0, 
      infoCount = 0,
      size = 'medium',
      showLabel = true 
    } = props;
    
    const color = this.getColor(score);
    const label = this.getLabel(score);
    
    const sizes = {
      small: { circle: '40px', font: '16px', label: '10px' },
      medium: { circle: '60px', font: '20px', label: '12px' },
      large: { circle: '80px', font: '28px', label: '14px' }
    };
    
    const sizeConfig = sizes[size];
    
    return `
      <div style="display: inline-flex; align-items: center; gap: 12px;">
        <div style="
          width: ${sizeConfig.circle};
          height: ${sizeConfig.circle};
          border-radius: 50%;
          background: ${color}20;
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${sizeConfig.font};
          font-weight: bold;
          color: ${color};
        ">
          ${score}%
        </div>
        
        ${showLabel ? `
          <div>
            <div style="color: ${color}; font-size: ${sizeConfig.label}; font-weight: 600;">
              ${label}
            </div>
            ${(criticalCount > 0 || warningCount > 0) ? `
              <div style="display: flex; gap: 8px; margin-top: 4px;">
                ${criticalCount > 0 ? `
                  <span style="color: #ef4444; font-size: 11px;">
                    ${criticalCount} critical
                  </span>
                ` : ''}
                ${warningCount > 0 ? `
                  <span style="color: #f59e0b; font-size: 11px;">
                    ${warningCount} warnings
                  </span>
                ` : ''}
                ${infoCount > 0 ? `
                  <span style="color: #3b82f6; font-size: 11px;">
                    ${infoCount} info
                  </span>
                ` : ''}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  static renderCompact(score: number): string {
    const color = this.getColor(score);
    return `
      <span style="
        color: ${color};
        font-weight: bold;
        font-size: 14px;
      ">
        ${score}%
      </span>
    `;
  }
  
  static renderBar(score: number, width: string = '100px'): string {
    const color = this.getColor(score);
    return `
      <div style="
        width: ${width};
        height: 8px;
        background: #1a1a1a;
        border-radius: 4px;
        overflow: hidden;
      ">
        <div style="
          width: ${score}%;
          height: 100%;
          background: ${color};
          transition: width 0.3s ease;
        "></div>
      </div>
    `;
  }
}