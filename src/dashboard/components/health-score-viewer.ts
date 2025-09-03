/**
 * Health Score Viewer Component
 * Displays health score with visual circle and check items
 * Max 150 lines
 */

export interface HealthScoreData {
  score: number;
  checks: {
    hasType: boolean;
    hasValidation: boolean;
    hasHooks: boolean;
    hasUI: boolean;
    hasAPI: boolean;
  };
  details?: {
    criticalCount?: number;
    warningCount?: number;
    infoCount?: number;
  };
}

export class HealthScoreViewer {
  private container: HTMLElement;
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }
  
  render(data: HealthScoreData): void {
    const scoreClass = this.getScoreClass(data.score);
    const scoreColor = this.getHealthColor(data.score);
    
    this.container.innerHTML = `
      <div class="health-score-container" style="
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        background: #0f0f0f;
        border-radius: 12px;
        border: 1px solid #252525;
      ">
        ${this.renderScoreCircle(data.score, scoreClass)}
        ${this.renderScoreDetails(data)}
      </div>
    `;
  }
  
  private renderScoreCircle(score: number, scoreClass: string): string {
    return `
      <div style="position: relative;">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#252525"
            stroke-width="8"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="${this.getHealthColor(score)}"
            stroke-width="8"
            stroke-dasharray="${this.calculateDashArray(score)}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
            style="transition: stroke-dasharray 0.5s ease;"
          />
        </svg>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
          font-weight: bold;
          color: ${this.getHealthColor(score)};
        ">
          ${score}%
        </div>
      </div>
    `;
  }
  
  private renderScoreDetails(data: HealthScoreData): string {
    return `
      <div style="flex: 1;">
        <div style="font-size: 16px; color: #f8fafc; margin-bottom: 8px; font-weight: 600;">
          Health Score Analysis
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          ${this.renderCheckItem('Type', data.checks.hasType)}
          ${this.renderCheckItem('Validation', data.checks.hasValidation)}
          ${this.renderCheckItem('Hooks', data.checks.hasHooks)}
          ${this.renderCheckItem('UI', data.checks.hasUI)}
          ${this.renderCheckItem('API', data.checks.hasAPI)}
        </div>
        ${data.details ? this.renderDetails(data.details) : ''}
      </div>
    `;
  }
  
  private renderCheckItem(label: string, passed: boolean): string {
    return `
      <span style="
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        background: ${passed ? '#10b98120' : '#ef444420'};
        color: ${passed ? '#10b981' : '#ef4444'};
        border: 1px solid ${passed ? '#10b98140' : '#ef444440'};
      ">
        ${passed ? '✓' : '✗'} ${label}
      </span>
    `;
  }
  
  private renderDetails(details: any): string {
    if (!details.criticalCount && !details.warningCount) return '';
    
    return `
      <div style="display: flex; gap: 16px; margin-top: 8px;">
        ${details.criticalCount ? `
          <span style="color: #ef4444; font-size: 12px;">
            ${details.criticalCount} critical
          </span>
        ` : ''}
        ${details.warningCount ? `
          <span style="color: #f59e0b; font-size: 12px;">
            ${details.warningCount} warnings
          </span>
        ` : ''}
      </div>
    `;
  }
  
  private calculateDashArray(score: number): string {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (score / 100);
    return `${offset} ${circumference}`;
  }
  
  private getHealthColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }
  
  private getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }
}