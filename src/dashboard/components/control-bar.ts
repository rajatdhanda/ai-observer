/**
 * Control Bar Component
 * Run button, auto-refresh, status indicator, file watcher
 * Max 200 lines
 */

export interface ControlBarConfig {
  projectPath: string;
  onRun: () => Promise<void>;
  onExport: () => void;
  onTestContracts: () => void;
  onViewChanges: () => void;
}

export class ControlBar {
  private container: HTMLElement;
  private config: ControlBarConfig;
  private autoRefreshInterval: number | null = null;
  private isAutoRefresh: boolean = false;
  private status: 'ready' | 'running' | 'error' = 'ready';
  private lastRunTime: Date | null = null;
  private changeCount: number = 0;
  
  constructor(containerId: string, config: ControlBarConfig) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
    this.config = config;
    this.render();
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div style="
        background: #1a1a1a;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #333;
      ">
        <div style="display: flex; gap: 12px; align-items: center;">
          ${this.renderRunButton()}
          ${this.renderAutoRefreshToggle()}
          ${this.renderQuickActions()}
          ${this.renderChangesIndicator()}
        </div>
        
        <div style="display: flex; gap: 16px; align-items: center;">
          ${this.renderStatusIndicator()}
          ${this.renderLastRunTime()}
          ${this.renderProjectPath()}
        </div>
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  private renderRunButton(): string {
    return `
      <button id="runButton" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: transform 0.2s;
      ">
        <span id="runIcon">▶</span>
        <span id="runText">Run Analysis</span>
      </button>
    `;
  }
  
  private renderAutoRefreshToggle(): string {
    return `
      <div id="autoRefreshToggle" style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #252525;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
      ">
        <span id="autoRefreshIcon" style="
          font-size: 16px;
          color: ${this.isAutoRefresh ? '#10b981' : '#64748b'};
        ">⟲</span>
        <span style="font-size: 13px; color: #94a3b8;">
          Auto-refresh <span id="autoRefreshStatus">${this.isAutoRefresh ? 'ON' : 'OFF'}</span>
        </span>
      </div>
    `;
  }
  
  private renderQuickActions(): string {
    return `
      <div style="display: flex; gap: 8px;">
        <button id="exportBtn" style="
          background: #252525;
          color: #94a3b8;
          border: 1px solid #333;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        ">
          📊 Export
        </button>
        
        <button id="testContractsBtn" style="
          background: #8b5cf620;
          color: #8b5cf6;
          border: 1px solid #8b5cf640;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        ">
          🧪 Test Contracts
        </button>
      </div>
    `;
  }
  
  private renderChangesIndicator(): string {
    return `
      <div id="changesIndicator" style="
        display: ${this.changeCount > 0 ? 'flex' : 'none'};
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: #f59e0b20;
        border: 1px solid #f59e0b40;
        border-radius: 6px;
        cursor: pointer;
      ">
        <span style="color: #f59e0b; font-size: 12px; font-weight: 600;">
          ${this.changeCount} changes
        </span>
        <span style="color: #f59e0b; font-size: 10px;">→</span>
      </div>
    `;
  }
  
  private renderStatusIndicator(): string {
    const colors = {
      ready: '#10b981',
      running: '#f59e0b',
      error: '#ef4444'
    };
    
    return `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span id="statusDot" style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${colors[this.status]};
          animation: ${this.status === 'running' ? 'pulse 1.5s infinite' : 'none'};
        "></span>
        <span id="statusText" style="font-size: 12px; color: #94a3b8;">
          ${this.status.charAt(0).toUpperCase() + this.status.slice(1)}
        </span>
      </div>
      
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;
  }
  
  private renderLastRunTime(): string {
    const timeText = this.lastRunTime 
      ? `Last run: ${this.lastRunTime.toLocaleTimeString()}`
      : 'Never run';
    
    return `
      <span id="lastRunTime" style="font-size: 11px; color: #64748b;">
        ${timeText}
      </span>
    `;
  }
  
  private renderProjectPath(): string {
    return `
      <span style="font-size: 11px; color: #64748b; opacity: 0.7;">
        ${this.config.projectPath}
      </span>
    `;
  }
  
  private attachEventListeners(): void {
    document.getElementById('runButton')?.addEventListener('click', () => this.handleRun());
    document.getElementById('autoRefreshToggle')?.addEventListener('click', () => this.toggleAutoRefresh());
    document.getElementById('exportBtn')?.addEventListener('click', () => this.config.onExport());
    document.getElementById('testContractsBtn')?.addEventListener('click', () => this.config.onTestContracts());
    document.getElementById('changesIndicator')?.addEventListener('click', () => this.config.onViewChanges());
  }
  
  private async handleRun(): Promise<void> {
    this.setStatus('running');
    try {
      await this.config.onRun();
      this.lastRunTime = new Date();
      this.setStatus('ready');
      this.render();
    } catch (error) {
      this.setStatus('error');
      console.error('Run failed:', error);
    }
  }
  
  private toggleAutoRefresh(): void {
    this.isAutoRefresh = !this.isAutoRefresh;
    
    if (this.isAutoRefresh) {
      this.autoRefreshInterval = window.setInterval(() => this.handleRun(), 30000);
    } else if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
    
    this.render();
  }
  
  setStatus(status: 'ready' | 'running' | 'error'): void {
    this.status = status;
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
      const colors = { ready: '#10b981', running: '#f59e0b', error: '#ef4444' };
      statusDot.style.background = colors[status];
      statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
  
  updateChangeCount(count: number): void {
    this.changeCount = count;
    const indicator = document.getElementById('changesIndicator');
    if (indicator) {
      indicator.style.display = count > 0 ? 'flex' : 'none';
      const span = indicator.querySelector('span');
      if (span) span.textContent = `${count} changes`;
    }
  }
}