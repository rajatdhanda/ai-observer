// Smart Refresh Manager - Efficient update detection
class SmartRefreshManager {
  constructor() {
    this.lastFileSize = null;
    this.lastModified = null;
    this.lastRefreshTime = Date.now();
    this.checkInterval = null;
    this.fallbackInterval = null;
    this.isActive = false;
    
    // Configuration
    this.QUICK_CHECK_INTERVAL = 5000;  // 5 seconds - lightweight check
    this.FALLBACK_INTERVAL = 120000;   // 2 minutes - force refresh
    this.MIN_REFRESH_GAP = 3000;       // Don't refresh more than every 3 seconds
  }

  async checkForChanges() {
    try {
      const response = await fetch('/api/smart-analysis-meta');
      const meta = await response.json();
      
      // Check if file changed (size or modified time)
      const hasChanged = meta.size !== this.lastFileSize || 
                        meta.modified !== this.lastModified;
      
      if (hasChanged) {
        this.lastFileSize = meta.size;
        this.lastModified = meta.modified;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check for changes:', error);
      return false;
    }
  }

  async refreshIfNeeded() {
    // Throttle refreshes
    const now = Date.now();
    if (now - this.lastRefreshTime < this.MIN_REFRESH_GAP) {
      return false;
    }

    const hasChanges = await this.checkForChanges();
    if (hasChanges) {
      this.doRefresh();
      return true;
    }
    
    return false;
  }

  doRefresh() {
    this.lastRefreshTime = Date.now();
    
    // Update UI
    const view = new SmartAnalysisView('mainContent');
    view.render();
    
    // Update status indicator
    this.updateStatusIndicator('fresh');
    
    console.log('[Smart Refresh] Updated at', new Date().toLocaleTimeString());
  }

  forceRefresh() {
    this.doRefresh();
  }

  updateStatusIndicator(status) {
    const indicator = document.getElementById('refreshStatus');
    if (!indicator) return;
    
    const now = new Date().toLocaleTimeString();
    const timeSinceRefresh = Math.floor((Date.now() - this.lastRefreshTime) / 1000);
    
    if (status === 'fresh' || timeSinceRefresh < 30) {
      indicator.innerHTML = `🟢 Live (${now})`;
      indicator.style.color = '#10b981';
    } else if (timeSinceRefresh < 120) {
      indicator.innerHTML = `🟡 ${timeSinceRefresh}s ago`;
      indicator.style.color = '#f59e0b';
    } else {
      indicator.innerHTML = `🔴 Stale (${Math.floor(timeSinceRefresh / 60)}m ago)`;
      indicator.style.color = '#ef4444';
    }
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    
    // Initial check
    this.checkForChanges();
    
    // Quick lightweight checks
    this.checkInterval = setInterval(async () => {
      await this.refreshIfNeeded();
      this.updateStatusIndicator();
    }, this.QUICK_CHECK_INTERVAL);
    
    // Fallback force refresh
    this.fallbackInterval = setInterval(() => {
      console.log('[Smart Refresh] Fallback refresh triggered');
      this.forceRefresh();
    }, this.FALLBACK_INTERVAL);
    
    console.log('[Smart Refresh] Started monitoring');
  }

  stop() {
    if (!this.isActive) return;
    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
    
    console.log('[Smart Refresh] Stopped monitoring');
  }
}

// Global instance
window.smartRefreshManager = new SmartRefreshManager();