/**
 * Control Bar Component
 * Handles auto-refresh, file watching, and run controls
 * Provides central control interface for the dashboard
 */

class ControlBar {
  constructor(containerId) {
    this.element = document.getElementById(containerId);
    if (!this.element) throw new Error(`Container ${containerId} not found`);
    
    this.autoRefreshEnabled = false;
    this.fileChanges = 0;
    this.lastChangeTime = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.fileWatchTimer = null;
    this.autoRunTimer = null;
  }

  render() {
    this.element.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button 
            id="runButton" 
            onclick="controlBar.runAnalysis()"
            style="
              background: #10b981;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
            "
          >
            ▶ Run Now
          </button>
          
          <div style="display: flex; align-items: center; gap: 8px;">
            <div 
              id="autoRefreshToggle" 
              onclick="controlBar.toggleAutoRefresh()"
              style="
                width: 40px;
                height: 20px;
                background: #374151;
                border-radius: 10px;
                position: relative;
                cursor: pointer;
                transition: all 0.2s;
              "
            >
              <div style="
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 2px;
                left: 2px;
                transition: all 0.2s;
              "></div>
            </div>
            <span id="autoRefreshText" style="color: #9ca3af; font-size: 14px;">Auto-run OFF</span>
          </div>
          
          <div 
            id="changesIndicator" 
            style="
              display: none;
              background: #f59e0b20;
              color: #f59e0b;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
            "
          >
            <span id="changesBadge">0 changes</span>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div 
              id="statusDot" 
              class="status-dot"
              style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #6b7280;
              "
            ></div>
            <span id="statusText" style="color: #9ca3af; font-size: 13px;">Ready</span>
          </div>
          
          <div style="color: #6b7280; font-size: 12px;">
            <span id="lastRunText">Never run</span>
          </div>
        </div>
      </div>
    `;
    
    this.addStatusStyles();
    this.updateLastRunTime();
  }

  addStatusStyles() {
    if (!document.getElementById('control-bar-styles')) {
      const styles = document.createElement('style');
      styles.id = 'control-bar-styles';
      styles.textContent = `
        .status-dot.running {
          background: #f59e0b !important;
          animation: pulse 1.5s infinite;
        }
        
        .status-dot.error {
          background: #ef4444 !important;
        }
        
        #autoRefreshToggle.active {
          background: #10b981 !important;
        }
        
        #autoRefreshToggle.active > div {
          left: 22px !important;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    const toggle = document.getElementById('autoRefreshToggle');
    const text = document.getElementById('autoRefreshText');
    
    if (this.autoRefreshEnabled) {
      toggle.classList.add('active');
      text.textContent = 'Auto-run ON';
      this.startFileWatcher();
    } else {
      toggle.classList.remove('active');
      text.textContent = 'Auto-run OFF';
      this.stopFileWatcher();
    }
  }

  startFileWatcher() {
    // Poll backend for file changes
    this.fileWatchTimer = setInterval(async () => {
      try {
        const response = await fetch('/api/file-changes');
        const data = await response.json();
        
        if (data.changes > 0) {
          this.fileChanges = data.changes;
          this.lastChangeTime = Date.now();
          this.updateChangesIndicator();
          
          // Check if we should auto-run
          this.checkAutoRun();
        }
      } catch (error) {
        console.error('Error checking file changes:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  stopFileWatcher() {
    if (this.fileWatchTimer) {
      clearInterval(this.fileWatchTimer);
      this.fileWatchTimer = null;
    }
    if (this.autoRunTimer) {
      clearTimeout(this.autoRunTimer);
      this.autoRunTimer = null;
    }
  }

  updateChangesIndicator() {
    const indicator = document.getElementById('changesIndicator');
    const badge = document.getElementById('changesBadge');
    
    if (this.fileChanges > 0) {
      indicator.style.display = 'block';
      badge.textContent = `${this.fileChanges} change${this.fileChanges > 1 ? 's' : ''}`;
    } else {
      indicator.style.display = 'none';
    }
  }

  checkAutoRun() {
    if (!this.autoRefreshEnabled || this.isRunning) return;
    
    // Clear existing timer
    if (this.autoRunTimer) {
      clearTimeout(this.autoRunTimer);
    }
    
    // Set timer to run after 30 seconds of no changes AND at least 3 changes
    if (this.fileChanges >= 3) {
      this.autoRunTimer = setTimeout(() => {
        const timeSinceChange = Date.now() - this.lastChangeTime;
        if (timeSinceChange >= 30000) { // 30 seconds
          this.runAnalysis();
        } else {
          // Check again after remaining time
          this.checkAutoRun();
        }
      }, 30000);
    }
  }

  async runAnalysis() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.fileChanges = 0;
    this.updateChangesIndicator();
    this.updateStatus('running', 'Running analysis...');
    
    const button = document.getElementById('runButton');
    button.disabled = true;
    button.innerHTML = '⟳ Running...';
    
    try {
      // Run validation based on current context
      await fetch('/api/validate');
      
      // Reload current data
      if (window.loadCurrentData) {
        await window.loadCurrentData();
      }
      
      this.lastRunTime = Date.now();
      this.updateLastRunTime();
      this.updateStatus('success', 'Analysis complete');
      
    } catch (error) {
      console.error('Analysis error:', error);
      this.updateStatus('error', 'Analysis failed');
    } finally {
      this.isRunning = false;
      button.disabled = false;
      button.innerHTML = '▶ Run Now';
    }
  }

  updateStatus(status, text) {
    const dot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    dot.className = 'status-dot';
    if (status === 'running') {
      dot.classList.add('running');
    } else if (status === 'error') {
      dot.classList.add('error');
    }
    
    statusText.textContent = text;
  }

  updateLastRunTime() {
    const lastRunText = document.getElementById('lastRunText');
    if (this.lastRunTime) {
      const date = new Date(this.lastRunTime);
      lastRunText.textContent = `Last run: ${date.toLocaleTimeString()}`;
    } else {
      lastRunText.textContent = 'Never run';
    }
  }

  // Public method for external components to trigger runs
  triggerRun() {
    this.runAnalysis();
  }

  // Get current state
  getState() {
    return {
      autoRefreshEnabled: this.autoRefreshEnabled,
      isRunning: this.isRunning,
      fileChanges: this.fileChanges,
      lastRunTime: this.lastRunTime
    };
  }
}

// Export for global use
window.ControlBar = ControlBar;