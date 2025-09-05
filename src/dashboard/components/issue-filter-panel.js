/**
 * Issue Filter Panel - Compact filtering and drill-down
 * Shows category breakdown with clickable filters
 */

class IssueFilterPanel {
  constructor() {
    this.currentFilter = null;
    this.categories = {
      'Contract Violations': { icon: '📜', rule: 'Contract Violation', color: '#ef4444' },
      'Design System': { icon: '🎨', rule: 'design_system', color: '#8b5cf6' },
      'Security (Auth)': { icon: '🔒', rule: 'Auth Guard Matrix', color: '#dc2626' },
      'Architecture': { icon: '🏗️', rules: ['Hook-Database Pattern', 'Error Handling', 'Cache Invalidation'], color: '#f59e0b' },
      'Code Quality': { icon: '✨', rules: ['Registry Usage', 'Duplicate Functions', 'Export Completeness'], color: '#3b82f6' }
    };
  }

  render(smartData) {
    if (!smartData?.issue_buckets) return '';
    
    // Calculate counts for each category
    const counts = this.calculateCounts(smartData);
    
    return `
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="color: #f8fafc; font-size: 16px; font-weight: 600; margin: 0;">🎯 Quick Filters</h3>
          ${this.currentFilter ? `
            <button onclick="window.issueFilter.clearFilter()" 
                    style="background: transparent; border: 1px solid #ef4444; color: #ef4444; 
                           padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;
                           transition: all 0.2s;"
                    onmouseover="this.style.background='#ef444420'" 
                    onmouseout="this.style.background='transparent'">
              Clear Filter ✕
            </button>
          ` : ''}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
          ${Object.entries(counts).map(([category, count]) => {
            const config = this.categories[category];
            const isActive = this.currentFilter === category;
            
            return `
              <button onclick="window.issueFilter.setFilter('${category}')"
                      style="position: relative; padding: 12px; border-radius: 8px; 
                             border: 1px solid ${isActive ? config.color : '#333'};
                             background: ${isActive ? config.color + '20' : '#0f0f0f'};
                             cursor: pointer; transition: all 0.2s;
                             ${isActive ? 'transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.3);' : ''}"
                      onmouseover="if(!this.classList.contains('active')) { this.style.background='${config.color}10'; this.style.borderColor='${config.color}60'; }"
                      onmouseout="if(!this.classList.contains('active')) { this.style.background='#0f0f0f'; this.style.borderColor='#333'; }"
                      class="${isActive ? 'active' : ''}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 20px;">${config.icon}</span>
                  <span style="font-size: 24px; font-weight: bold; color: ${config.color};">
                    ${count}
                  </span>
                </div>
                <div style="font-size: 11px; text-align: left; color: ${isActive ? config.color : '#94a3b8'};">
                  ${category}
                </div>
              </button>
            `;
          }).join('')}
        </div>
        
        ${this.currentFilter ? this.renderFilteredIssues(smartData) : ''}
      </div>
    `;
  }

  calculateCounts(smartData) {
    const counts = {};
    
    Object.keys(this.categories).forEach(category => {
      counts[category] = 0;
    });
    
    // Count issues across all buckets
    smartData.issue_buckets.forEach(bucket => {
      bucket.issues.forEach(issue => {
        Object.entries(this.categories).forEach(([category, config]) => {
          if (config.rule && issue.rule === config.rule) {
            counts[category]++;
          } else if (config.rules && config.rules.includes(issue.rule)) {
            counts[category]++;
          } else if (category === 'Design System' && issue.category === 'design_system') {
            counts[category]++;
          } else if (category === 'Code Quality' && issue.rule && issue.rule.includes('Registry Usage')) {
            counts[category]++;
          }
        });
      });
    });
    
    return counts;
  }

  renderFilteredIssues(smartData) {
    const config = this.categories[this.currentFilter];
    const filteredIssues = [];
    
    // Collect filtered issues
    smartData.issue_buckets.forEach(bucket => {
      bucket.issues.forEach(issue => {
        const matches = config.rule 
          ? issue.rule === config.rule
          : config.rules 
            ? config.rules.includes(issue.rule)
            : issue.category === 'design_system';
            
        if (matches) {
          filteredIssues.push({ ...issue, bucket: bucket.name });
        }
      });
    });
    
    // Group by file
    const byFile = {};
    filteredIssues.forEach(issue => {
      const file = issue.file.split('/').pop();
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push(issue);
    });
    
    return `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="color: ${config.color}; font-size: 14px; font-weight: 600; margin: 0;">
            ${config.icon} ${this.currentFilter} Issues
          </h4>
          <span style="color: #64748b; font-size: 11px;">
            ${filteredIssues.length} issues in ${Object.keys(byFile).length} files
          </span>
        </div>
        
        <div style="max-height: 256px; overflow-y: auto; background: #0f0f0f; border: 1px solid #252525; 
                    border-radius: 8px; padding: 12px;">
          ${Object.entries(byFile).slice(0, 10).map(([file, issues]) => `
            <div style="background: #1a1a1a; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
              <div style="font-family: monospace; font-size: 11px; color: #3b82f6; margin-bottom: 4px;">${file}</div>
              ${issues.slice(0, 3).map(issue => `
                <div style="margin-left: 8px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                  • ${issue.message.substring(0, 60)}...
                </div>
              `).join('')}
              ${issues.length > 3 ? `
                <div style="margin-left: 8px; font-size: 11px; color: #64748b; margin-top: 4px;">
                  ... and ${issues.length - 3} more
                </div>
              ` : ''}
            </div>
          `).join('')}
          
          ${Object.keys(byFile).length > 10 ? `
            <div style="text-align: center; color: #64748b; font-size: 11px; padding: 8px;">
              ... and ${Object.keys(byFile).length - 10} more files
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  setFilter(category) {
    this.currentFilter = this.currentFilter === category ? null : category;
    this.update();
  }

  clearFilter() {
    this.currentFilter = null;
    this.update();
  }

  update() {
    // Trigger re-render of the Smart Analysis view
    if (window.smartAnalysisView) {
      window.smartAnalysisView.render();
    }
  }
}

// Make it globally available
window.IssueFilterPanel = IssueFilterPanel;

// Initialize when DOM is ready or immediately if already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.issueFilter = new IssueFilterPanel();
  });
} else {
  window.issueFilter = new IssueFilterPanel();
}