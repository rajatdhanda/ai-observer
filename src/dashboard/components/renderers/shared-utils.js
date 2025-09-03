/**
 * Shared Utilities for Dashboard Renderers
 * Common helper functions used across dashboard components
 */

(function() {
  'use strict';

  // Helper function for theme colors
  window.getThemeColor = window.getThemeColor || function(path, fallback = '#666') {
    if (!window.AI_OBSERVER_THEME) return fallback;
    const keys = path.split('.');
    let value = window.AI_OBSERVER_THEME;
    for (const key of keys) {
      value = value[key];
      if (!value) return fallback;
    }
    return value;
  };

  // Show all violations handler
  window.showAllViolations = function(type, violations) {
    const listElement = document.getElementById(`${type}List`);
    if (!listElement) return;
    
    listElement.innerHTML = violations.map(violation => {
      const isContract = type === 'contractViolations';
      return `
        <div style="
          background: #0f0f0f;
          border-left: 4px solid #ef4444;
          padding: 16px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 12px;
        ">
          ${isContract ? `
            <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
              <div style="color: #ef4444; font-weight: 500; margin-right: 12px;">
                ${violation.entity}
              </div>
              <div style="
                background: #ef444420;
                color: #ef4444;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                text-transform: uppercase;
              ">
                ${violation.type}
              </div>
            </div>
          ` : ''}
          
          <div style="color: #f8fafc; margin-bottom: 8px; font-size: 14px;">
            ${violation.message}
          </div>
          
          <div style="color: #64748b; font-size: 12px; font-family: monospace; margin-bottom: 8px;">
            ${violation.location || violation.file}
          </div>
          
          ${violation.suggestion || violation.fix ? `
            <div style="color: #3b82f6; font-size: 13px; font-style: italic;">
              💡 ${violation.suggestion || violation.fix}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  };

  // Health scoring configuration
  window.HealthScoringConfig = window.HealthScoringConfig || {
    thresholds: {
      healthy: 70,
      needsAttention: 40
    },
    colors: {
      healthy: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444'
    }
  };

})();