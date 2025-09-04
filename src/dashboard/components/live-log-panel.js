// Live Log Panel Component - Real-time observer activity
class LiveLogPanel {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.autoScroll = true;
  }

  addLog(entry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    this.updateDisplay();
  }

  async fetchLogs() {
    try {
      const response = await fetch('/api/observer-logs');
      const data = await response.json();
      
      if (data.logs && Array.isArray(data.logs)) {
        this.logs = data.logs.slice(0, this.maxLogs);
        this.updateDisplay();
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }

  updateDisplay() {
    const container = document.getElementById('liveLogContent');
    if (!container) return;

    container.innerHTML = this.render();
    
    if (this.autoScroll) {
      container.scrollTop = 0; // Scroll to latest (top)
    }
  }

  render() {
    if (this.logs.length === 0) {
      return `
        <div style="padding: 20px; text-align: center; color: #64748b;">
          <div style="font-size: 24px; margin-bottom: 8px;">📝</div>
          <div>Waiting for observer activity...</div>
        </div>
      `;
    }

    return this.logs.map(log => this.renderLogEntry(log)).join('');
  }

  renderLogEntry(log) {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const levelColors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      debug: '#8b5cf6'
    };

    const levelIcons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    };

    const level = log.level || 'info';
    const color = levelColors[level] || '#64748b';
    const icon = levelIcons[level] || '📝';

    return `
      <div style="padding: 8px 12px; border-bottom: 1px solid #1e293b; 
                  font-family: monospace; font-size: 11px;
                  transition: background 0.2s;"
           onmouseover="this.style.background='#0f172a'" 
           onmouseout="this.style.background='transparent'">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="color: ${color}; flex-shrink: 0;">${icon}</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8; font-size: 10px;">${timestamp}</span>
              ${log.source ? `<span style="color: #475569; font-size: 10px;">${log.source}</span>` : ''}
            </div>
            <div style="color: #e2e8f0; line-height: 1.4; word-wrap: break-word;">
              ${this.formatMessage(log.message)}
            </div>
            ${log.details ? `
              <div style="color: #64748b; font-size: 10px; margin-top: 4px; 
                          padding-left: 12px; border-left: 2px solid #334155;">
                ${log.details}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  formatMessage(message) {
    // Highlight file paths
    message = message.replace(/([\/\w-]+\.(ts|tsx|js|jsx|json))/g, 
      '<span style="color: #3b82f6;">$1</span>');
    
    // Highlight numbers
    message = message.replace(/\b(\d+)\b/g, 
      '<span style="color: #f59e0b;">$1</span>');
    
    // Highlight keywords
    const keywords = ['Fixed', 'Found', 'Analyzing', 'Watching', 'Updated', 'Detected', 'Running'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      message = message.replace(regex, 
        `<span style="color: #10b981; font-weight: bold;">${keyword}</span>`);
    });
    
    return message;
  }

  renderPanel() {
    return `
      <div style="height: 100%; display: flex; flex-direction: column; background: #0a0a0a; 
                  border-left: 1px solid #1e293b;">
        <!-- Header -->
        <div style="padding: 12px 16px; border-bottom: 1px solid #1e293b; 
                    background: #0f172a;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: #f8fafc; font-size: 14px; margin: 0; 
                       display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; 
                           background: #10b981; border-radius: 50%; 
                           animation: pulse 2s infinite;"></span>
              Live Observer Activity
            </h3>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.liveLogPanel?.clear()" style="
                background: transparent; border: 1px solid #334155;
                color: #94a3b8; padding: 4px 8px; border-radius: 4px;
                font-size: 11px; cursor: pointer; transition: all 0.2s;
              " onmouseover="this.style.borderColor='#475569'" 
                 onmouseout="this.style.borderColor='#334155'">
                Clear
              </button>
              <button id="autoScrollBtn" onclick="window.liveLogPanel?.toggleAutoScroll()" style="
                background: ${this.autoScroll ? '#1e3a8a' : 'transparent'}; 
                border: 1px solid ${this.autoScroll ? '#3b82f6' : '#334155'};
                color: ${this.autoScroll ? '#93c5fd' : '#94a3b8'}; 
                padding: 4px 8px; border-radius: 4px;
                font-size: 11px; cursor: pointer; transition: all 0.2s;
              ">
                ${this.autoScroll ? '⏸' : '▶'} Auto
              </button>
            </div>
          </div>
        </div>
        
        <!-- Log Content -->
        <div id="liveLogContent" style="flex: 1; overflow-y: auto; padding: 0;">
          ${this.render()}
        </div>
        
        <!-- Footer Stats -->
        <div style="padding: 8px 16px; border-top: 1px solid #1e293b; 
                    background: #0f172a; font-size: 10px; color: #64748b;">
          <div style="display: flex; justify-content: space-between;">
            <span>${this.logs.length} logs</span>
            <span>Last: ${this.logs[0] ? new Date(this.logs[0].timestamp).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        #liveLogContent::-webkit-scrollbar {
          width: 6px;
        }
        
        #liveLogContent::-webkit-scrollbar-track {
          background: #0f172a;
        }
        
        #liveLogContent::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        
        #liveLogContent::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      </style>
    `;
  }

  clear() {
    this.logs = [];
    this.updateDisplay();
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
    const btn = document.getElementById('autoScrollBtn');
    if (btn) {
      btn.style.background = this.autoScroll ? '#1e3a8a' : 'transparent';
      btn.style.border = `1px solid ${this.autoScroll ? '#3b82f6' : '#334155'}`;
      btn.style.color = this.autoScroll ? '#93c5fd' : '#94a3b8';
      btn.innerHTML = `${this.autoScroll ? '⏸' : '▶'} Auto`;
    }
  }


  startPolling() {
    // Fetch real logs every 2 seconds
    this.pollingInterval = setInterval(() => {
      this.fetchLogs();
    }, 2000);
    
    // Initial fetch
    this.fetchLogs();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

// Global instance
window.liveLogPanel = new LiveLogPanel();