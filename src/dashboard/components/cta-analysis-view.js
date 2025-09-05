function renderCTAAnalysis(ctaData) {
  if (!ctaData) {
    return `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Analyzing CTAs...</p>
      </div>
    `;
  }

  const { issues, stats } = ctaData;
  
  // Group issues by type
  const groupedIssues = {
    missing_handler: [],
    orphaned_text: [],
    placeholder: [],
    broken_link: []
  };
  
  issues.forEach(issue => {
    groupedIssues[issue.type].push(issue);
  });

  return `
    <div class="cta-analysis-container">
      <div class="cta-header">
        <h2>CTA Analysis</h2>
        <p class="subtitle">Detecting Call-to-Action issues in React/Next.js components</p>
      </div>
      
      <!-- Statistics Overview -->
      <div class="cta-stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Issues</div>
        </div>
        <div class="stat-card critical">
          <div class="stat-value">${stats.bySeverity?.critical || 0}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${stats.bySeverity?.warning || 0}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="stat-card info">
          <div class="stat-value">${stats.bySeverity?.info || 0}</div>
          <div class="stat-label">Info</div>
        </div>
      </div>

      <!-- Issue Categories -->
      <div class="cta-categories">
        ${renderCTACategory('Missing Handlers', 'missing_handler', groupedIssues.missing_handler, 
          'Buttons, forms, and interactive elements without event handlers')}
        
        ${renderCTACategory('Orphaned CTA Text', 'orphaned_text', groupedIssues.orphaned_text,
          'CTA text like "View All" or "Learn More" that isn\'t clickable')}
        
        ${renderCTACategory('Placeholder CTAs', 'placeholder', groupedIssues.placeholder,
          'Temporary CTAs like "Coming Soon" that need implementation')}
        
        ${renderCTACategory('Broken Links', 'broken_link', groupedIssues.broken_link,
          'Link components missing href attributes')}
      </div>

      <!-- Top Files with Issues -->
      ${stats.topFiles && stats.topFiles.length > 0 ? `
        <div class="cta-top-files">
          <h3>Files with Most CTA Issues</h3>
          <div class="file-list">
            ${stats.topFiles.map(file => `
              <div class="file-item">
                <span class="file-path">${file.file}</span>
                <span class="issue-count">${file.count} issues</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <style>
      .cta-analysis-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .cta-header {
        margin-bottom: 30px;
      }

      .cta-header h2 {
        font-size: 24px;
        margin-bottom: 8px;
        color: #1f2937;
      }

      .subtitle {
        color: #6b7280;
        font-size: 14px;
      }

      .cta-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 30px;
      }

      .stat-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      }

      .stat-card.critical {
        border-color: #ef4444;
        background: #fee2e2;
      }

      .stat-card.warning {
        border-color: #f59e0b;
        background: #fef3c7;
      }

      .stat-card.info {
        border-color: #3b82f6;
        background: #dbeafe;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
      }

      .cta-categories {
        margin-bottom: 30px;
      }

      .cta-category {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .category-header {
        background: #f9fafb;
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .category-header:hover {
        background: #f3f4f6;
      }

      .category-title {
        font-weight: 600;
        color: #1f2937;
      }

      .category-description {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
      }

      .category-count {
        background: #e5e7eb;
        color: #374151;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .category-content {
        padding: 8px 0;
        max-height: 400px;
        overflow-y: auto;
      }

      .cta-issue {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        display: flex;
        align-items: start;
        gap: 12px;
      }

      .cta-issue:last-child {
        border-bottom: none;
      }

      .cta-issue:hover {
        background: #f9fafb;
      }

      .severity-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 6px;
        flex-shrink: 0;
      }

      .severity-indicator.critical {
        background: #ef4444;
      }

      .severity-indicator.warning {
        background: #f59e0b;
      }

      .severity-indicator.info {
        background: #3b82f6;
      }

      .issue-content {
        flex: 1;
      }

      .issue-location {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
        font-family: 'Monaco', 'Menlo', monospace;
      }

      .issue-text {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .issue-message {
        font-size: 14px;
        color: #4b5563;
        margin-bottom: 4px;
      }

      .issue-suggestion {
        font-size: 13px;
        color: #059669;
        font-style: italic;
      }

      .cta-top-files {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }

      .cta-top-files h3 {
        font-size: 16px;
        margin-bottom: 12px;
        color: #1f2937;
      }

      .file-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .file-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: #f9fafb;
        border-radius: 4px;
      }

      .file-path {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 13px;
        color: #4b5563;
      }

      .issue-count {
        font-size: 12px;
        color: #6b7280;
        font-weight: 600;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #6b7280;
      }

      .empty-state h3 {
        font-size: 18px;
        margin-bottom: 8px;
        color: #374151;
      }
    </style>
  `;
}

function renderCTACategory(title, type, issues, description) {
  if (issues.length === 0) {
    return '';
  }

  return `
    <div class="cta-category">
      <div class="category-header" onclick="toggleCategory('${type}')">
        <div>
          <div class="category-title">${title}</div>
          <div class="category-description">${description}</div>
        </div>
        <span class="category-count">${issues.length}</span>
      </div>
      <div class="category-content" id="category-${type}">
        ${issues.map(issue => `
          <div class="cta-issue">
            <div class="severity-indicator ${issue.severity}"></div>
            <div class="issue-content">
              <div class="issue-location">${issue.file}:${issue.line}</div>
              <div class="issue-text">&lt;${issue.element}&gt; ${issue.text}</div>
              <div class="issue-message">${issue.message}</div>
              <div class="issue-suggestion">💡 ${issue.suggestion}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderCTAAnalysis };
}