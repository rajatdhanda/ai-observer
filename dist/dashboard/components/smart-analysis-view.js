// Smart Analysis View Component
class SmartAnalysisView {
  constructor(containerId) {
    this.containerId = containerId;
    // Make instance globally available for filter panel
    window.smartAnalysisView = this;
  }

  async render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    try {
      // Fetch the smart analysis data
      const response = await fetch('/api/smart-analysis');
      const data = await response.json();

      // Check if we need to add the layout wrapper
      // The container might already have the two-column layout from the parent
      const needsLayout = !container.querySelector('#smartAnalysisMain');
      
      if (needsLayout) {
        // Just render content normally - logs will appear below
        container.innerHTML = `
          <div id="smartAnalysisMain">
            ${!data || !data.exists ? this.renderNoAnalysis() : this.renderAnalysis(data.analysis)}
          </div>
          <div id="liveLogPanel" style="margin-top: 20px;">
            ${window.liveLogPanel ? window.liveLogPanel.renderPanel() : '<div>Loading logs...</div>'}
          </div>
        `;
      } else {
        // Just update the main content
        const mainDiv = container.querySelector('#smartAnalysisMain');
        if (mainDiv) {
          mainDiv.innerHTML = !data || !data.exists ? this.renderNoAnalysis() : this.renderAnalysis(data.analysis);
        }
      }

      // Start log polling if panel exists
      if (window.liveLogPanel) {
        window.liveLogPanel.startPolling();
      }
    } catch (error) {
      console.error('Failed to load smart analysis:', error);
      container.innerHTML = this.renderError(error);
    }
  }

  renderNoAnalysis() {
    return `
      <div style="padding: 40px; text-align: center;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    width: 120px; height: 120px; border-radius: 50%; 
                    margin: 0 auto 24px; display: flex; align-items: center; 
                    justify-content: center; font-size: 48px;">
          🤖
        </div>
        <h2 style="color: #f8fafc; margin-bottom: 16px;">No Smart Analysis Yet</h2>
        <p style="color: #94a3b8; margin-bottom: 24px;">
          Run smart analysis to generate AI-friendly fix instructions
        </p>
        <button onclick="runSmartAnalysis()" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; border: none; padding: 12px 24px;
          border-radius: 8px; cursor: pointer; font-size: 14px;
        ">
          Run Smart Analysis
        </button>
        <div style="margin-top: 24px; padding: 16px; background: #1a1a1a; 
                    border-radius: 8px; text-align: left;">
          <code style="color: #10b981; font-size: 12px;">
            npm run smart-analyze /path/to/project
          </code>
        </div>
      </div>
    `;
  }

  renderAnalysis(analysis) {
    const stats = analysis.stats || {};
    const buckets = analysis.issue_buckets || [];
    const groups = analysis.fix_groups || []; // Fallback for old format
    const hasBuckets = buckets.length > 0;
    
    // Store analysis data globally for filter panel
    window.smartAnalysisData = analysis;
    
    // Initialize filter panel if needed
    if (!window.issueFilter && window.IssueFilterPanel) {
      window.issueFilter = new window.IssueFilterPanel();
    }
    
    // Generate filter panel HTML
    const filterPanelHTML = window.issueFilter ? window.issueFilter.render(analysis) : '';
    console.log('Filter panel available:', !!window.issueFilter);
    console.log('Filter panel HTML length:', filterPanelHTML.length);
    
    return `
      <div style="padding: 20px;">
        <!-- Live Status Bar -->
        <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-family: monospace;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span id="refreshStatus" style="color: #10b981; font-size: 11px;">🟢 Live</span>
              <span style="color: #64748b; font-size: 11px;">Smart refresh enabled</span>
              ${hasBuckets ? '<span style="color: #3b82f6; font-size: 11px;">🆕 Enhanced with buckets</span>' : ''}
            </div>
            <button onclick="window.smartRefreshManager?.forceRefresh()" style="
              background: #1e293b; color: #94a3b8; border: 1px solid #334155;
              padding: 4px 12px; border-radius: 4px; font-size: 11px;
              cursor: pointer; transition: all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              🔄 Refresh Now
            </button>
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            [${new Date(analysis.generated).toLocaleTimeString()}] Analysis complete... 
            ✅ Found ${stats.total_issues || stats.total_issues_found || 0} issues
            ${hasBuckets ? `(${buckets.length} buckets)` : `(${groups.length} groups)`}
            ${stats.visibility_percentage ? `📈 ${stats.visibility_percentage}% visible` : ''}
          </div>
          ${hasBuckets ? 
            buckets.map(b => `
              <div style="color: ${b.color}; font-size: 11px; margin-left: 20px;">
                └─ ${b.name}: ${b.count} issues - ${b.title}
              </div>
            `).join('') :
            groups.map(g => `
              <div style="color: #64748b; font-size: 11px; margin-left: 20px;">
                └─ Group ${g.group}: ${g.fixes.length} ${g.title.toLowerCase()}
              </div>
            `).join('')
          }
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="color: #f8fafc; margin: 0;">
            🤖 Smart Analysis Results
          </h2>
          <div style="color: #94a3b8; font-size: 12px;">
            Last Check: ${new Date(analysis.generated).toLocaleString()}
          </div>
        </div>

        <!-- Issue Filter Panel -->
        ${filterPanelHTML}

        <!-- Filter Bar -->
        ${hasBuckets ? `
        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <!-- Bucket Filters -->
            <div style="display: flex; gap: 8px;">
              <button onclick="filterSmartIssues('all')" id="filter-all" style="
                background: #3b82f6; color: white; border: none; padding: 6px 12px;
                border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;
              ">
                All (${stats.total_issues_found || 0})
              </button>
              ${buckets.map(b => `
                <button onclick="filterSmartIssues('${b.name}')" id="filter-${b.name}" style="
                  background: #1e293b; color: ${b.color}; border: 1px solid ${b.color}40;
                  padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                  font-weight: 500; transition: all 0.2s;
                " onmouseover="this.style.background='${b.color}20'" onmouseout="this.style.background='#1e293b'">
                  ${b.name} (${b.count})
                </button>
              `).join('')}
            </div>
            
            <!-- Search Box -->
            <div style="flex: 1; min-width: 200px;">
              <input type="text" id="smartSearchBox" placeholder="🔍 Search issues..." 
                oninput="searchSmartIssues(this.value)"
                style="
                  width: 100%; background: #1e293b; color: #e2e8f0; border: 1px solid #334155;
                  padding: 6px 12px; border-radius: 4px; font-size: 12px;
                ">
            </div>
            
            <!-- Quick Stats -->
            <div style="display: flex; gap: 16px; margin-left: auto;">
              ${stats.by_severity ? Object.entries(stats.by_severity).filter(([k,v]) => v > 0).map(([severity, count]) => `
                <div style="font-size: 11px; color: #94a3b8;">
                  <span style="color: ${severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : '#3b82f6'};">●</span>
                  ${severity}: ${count}
                </div>
              `).join('') : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                      padding: 20px; border-radius: 12px;">
            <div style="font-size: 32px; font-weight: bold; color: white;">
              ${hasBuckets ? (stats.issues_shown || 0) : (stats.critical_shown || groups.reduce((sum, g) => sum + g.fixes.length, 0) || 0)}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">
              ${hasBuckets ? 'Issues Visible' : 'Critical Issues to Fix'}
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                      padding: 20px; border-radius: 12px;">
            <div style="font-size: 32px; font-weight: bold; color: white;">
              ${hasBuckets ? (stats.visibility_percentage || 100) : (stats.groups_shown || groups.length || 0)}%
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">
              ${hasBuckets ? 'Visibility' : 'Fix Groups'}
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                      padding: 20px; border-radius: 12px;">
            <div style="font-size: 32px; font-weight: bold; color: white;">
              ${stats.total_issues_found || stats.total_issues || 0}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">
              Total Issues Found
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; 
                    padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            📋 AI Instructions
            <span style="background: #10b981; color: white; padding: 2px 8px; 
                         border-radius: 4px; font-size: 11px; font-weight: normal;">
              ${analysis.README || 'Fix in order'}
            </span>
          </h3>
          <div style="color: #94a3b8; font-size: 13px; line-height: 1.8;">
            ${this.renderInstructions(analysis.instructions)}
          </div>
        </div>

        <!-- Issue Buckets (Enhanced) or Fix Groups (Legacy) -->
        ${hasBuckets ? 
          buckets.map(bucket => this.renderBucket(bucket)).join('') :
          groups.map(group => this.renderGroup(group)).join('')
        }

        <!-- File Location -->
        <div style="margin-top: 32px; padding: 16px; background: #0f0f0f; 
                    border-radius: 8px; border: 1px solid #252525;">
          <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">
            📁 Fix instructions saved to:
          </div>
          <code style="color: #3b82f6; font-size: 12px; font-family: monospace;">
            ${analysis.project}/.observer/FIX_THIS.json
          </code>
        </div>
      </div>
    `;
  }

  renderInstructions(instructions) {
    if (!instructions) return 'No specific instructions';
    
    return Object.entries(instructions).map(([key, value]) => `
      <div style="margin-bottom: 8px;">
        <strong style="color: #f8fafc; text-transform: capitalize;">
          ${key.replace('step', 'Step ')}:
        </strong> 
        ${value}
      </div>
    `).join('');
  }

  renderBucket(bucket) {
    return `
      <div class="issue-bucket" data-bucket="${bucket.name}" style="background: #1a1a1a; border: 1px solid ${bucket.color}; border-radius: 12px; 
                  padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="background: ${bucket.color}; 
                      width: 40px; height: 40px; border-radius: 8px; 
                      display: flex; align-items: center; justify-content: center; 
                      color: white; font-weight: bold; font-size: 14px;">
            ${bucket.name.charAt(0)}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h3 style="color: #f8fafc; margin: 0; font-size: 18px;">${bucket.title}</h3>
              <span class="bucket-count" style="background: ${bucket.color}; color: white; padding: 2px 8px; 
                           border-radius: 12px; font-size: 11px; font-weight: bold;">
                ${bucket.count} issues
              </span>
            </div>
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
              ${bucket.description}
            </div>
            <div style="color: ${bucket.color}; font-size: 11px; font-weight: 500;">
              Priority ${bucket.priority} • ${bucket.name}
            </div>
          </div>
        </div>
        
        <div style="space-y: 8px;">
          ${bucket.issues.map(issue => this.renderBucketIssue(issue, bucket.color)).join('')}
        </div>
      </div>
    `;
  }

  renderBucketIssue(issue, bucketColor) {
    return `
      <div class="issue-item" style="background: #0f0f0f; padding: 12px; border-radius: 8px; 
                  margin-bottom: 8px; border-left: 3px solid ${bucketColor};">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="background: ${bucketColor}; color: white; padding: 1px 6px; 
                           border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${issue.rule || issue.type}
              </span>
              <span style="color: #64748b; font-size: 11px;">
                ${issue.severity}
              </span>
            </div>
            <div style="color: #ef4444; font-size: 13px; margin-bottom: 4px;">
              ❌ ${issue.message}
            </div>
            <div style="color: #3b82f6; font-family: monospace; font-size: 11px; margin-bottom: 8px;">
              📁 ${issue.file}${issue.line ? `:${issue.line}` : ''}
            </div>
            <div style="background: #065f46; padding: 8px; border-radius: 4px; margin-top: 8px;">
              <code style="color: #10b981; font-size: 12px;">
                ✅ Fix: ${issue.fix}
              </code>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderGroup(group) {
    return `
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; 
                  padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                      width: 40px; height: 40px; border-radius: 50%; 
                      display: flex; align-items: center; justify-content: center; 
                      color: white; font-weight: bold;">
            ${group.group}
          </div>
          <div>
            <h3 style="color: #f8fafc; margin: 0;">${group.title}</h3>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
              ${group.why}
            </div>
          </div>
        </div>
        
        <div style="space-y: 8px;">
          ${group.fixes.map(fix => this.renderFix(fix)).join('')}
        </div>
      </div>
    `;
  }

  renderFix(fix) {
    return `
      <div style="background: #0f0f0f; padding: 12px; border-radius: 8px; 
                  margin-bottom: 8px; border-left: 3px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="color: #ef4444; font-size: 13px; margin-bottom: 4px;">
              ❌ ${fix.issue}
            </div>
            <div style="color: #3b82f6; font-family: monospace; font-size: 11px; margin-bottom: 8px;">
              📁 ${fix.file}
            </div>
            <div style="background: #065f46; padding: 8px; border-radius: 4px; margin-top: 8px;">
              <code style="color: #10b981; font-size: 12px;">
                ✅ Fix: ${fix.fix}
              </code>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderError(error) {
    return `
      <div style="padding: 40px; text-align: center;">
        <div style="color: #ef4444; font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="color: #f8fafc;">Failed to Load Analysis</h3>
        <p style="color: #94a3b8; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
}

// Global function to run analysis
window.runSmartAnalysis = async function() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Running...';
  
  try {
    const response = await fetch('/api/run-smart-analysis', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      // Reload the view
      const view = new SmartAnalysisView('mainContent');
      view.render();
    } else {
      alert('Analysis failed: ' + result.error);
    }
  } catch (error) {
    alert('Failed to run analysis: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Run Smart Analysis';
  }
};

// Auto-refresh every 5 seconds if on Smart Analysis tab
window.autoRefreshInterval = null;

window.startAutoRefresh = function() {
  if (window.autoRefreshInterval) clearInterval(window.autoRefreshInterval);
  
  window.autoRefreshInterval = setInterval(() => {
    // Only refresh if on Smart Analysis tab
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.textContent.includes('Smart Analysis')) {
      const view = new SmartAnalysisView('mainContent');
      view.render();
    }
  }, 5000); // Refresh every 5 seconds
};

window.stopAutoRefresh = function() {
  if (window.autoRefreshInterval) {
    clearInterval(window.autoRefreshInterval);
    window.autoRefreshInterval = null;
  }
};

// Filter functionality for Smart Analysis
window.filterSmartIssues = function(bucket) {
  // Update button states
  document.querySelectorAll('[id^="filter-"]').forEach(btn => {
    btn.style.background = '#1e293b';
    btn.style.color = btn.id === 'filter-all' ? '#94a3b8' : btn.style.color;
  });
  
  const activeBtn = document.getElementById('filter-' + bucket);
  if (activeBtn) {
    activeBtn.style.background = bucket === 'all' ? '#3b82f6' : activeBtn.style.borderColor + '20';
    activeBtn.style.color = bucket === 'all' ? 'white' : activeBtn.style.color;
  }
  
  // Show/hide buckets
  const buckets = document.querySelectorAll('.issue-bucket');
  buckets.forEach(b => {
    if (bucket === 'all' || b.dataset.bucket === bucket) {
      b.style.display = 'block';
    } else {
      b.style.display = 'none';
    }
  });
  
  // Clear search box when filtering
  const searchBox = document.getElementById('smartSearchBox');
  if (searchBox && bucket !== 'all') {
    searchBox.value = '';
  }
};

// Search functionality for Smart Analysis
window.searchSmartIssues = function(query) {
  const lowerQuery = query.toLowerCase();
  const buckets = document.querySelectorAll('.issue-bucket');
  
  if (!query) {
    // Show all buckets and issues
    buckets.forEach(b => {
      b.style.display = 'block';
      b.querySelectorAll('.issue-item').forEach(item => {
        item.style.display = 'block';
      });
    });
    return;
  }
  
  // Search through issues
  buckets.forEach(bucket => {
    const issues = bucket.querySelectorAll('.issue-item');
    let hasVisibleIssue = false;
    
    issues.forEach(issue => {
      const text = issue.textContent.toLowerCase();
      if (text.includes(lowerQuery)) {
        issue.style.display = 'block';
        hasVisibleIssue = true;
      } else {
        issue.style.display = 'none';
      }
    });
    
    // Show/hide bucket based on whether it has visible issues
    bucket.style.display = hasVisibleIssue ? 'block' : 'none';
    
    // Update bucket count
    if (hasVisibleIssue) {
      const visibleCount = Array.from(issues).filter(i => i.style.display !== 'none').length;
      const countSpan = bucket.querySelector('.bucket-count');
      if (countSpan) {
        countSpan.textContent = `${visibleCount} issues`;
      }
    }
  });
  
  // Reset filter buttons to 'all'
  document.getElementById('filter-all')?.click();
};

// Export for use
window.SmartAnalysisView = SmartAnalysisView;