/**
 * AI Observer Dashboard Theme Configuration
 * ==========================================
 * Centralized theme configuration for production deployments
 * Replaces 251+ hardcoded color values for maintainability
 */

window.AI_OBSERVER_THEME = {
  // Brand Colors
  brand: {
    primary: '#8b5cf6',    // Purple
    secondary: '#7c3aed',  // Darker purple
    accent: '#3b82f6',     // Blue
  },
  
  // Status Colors
  status: {
    success: '#10b981',    // Green
    warning: '#f59e0b',    // Orange
    error: '#ef4444',      // Red
    info: '#3b82f6',       // Blue
    critical: '#ef4444',   // Red
  },
  
  // Background Colors
  background: {
    dark: '#0a0a0a',       // Main dark background
    card: '#1a1a1a',       // Card background
    cardDark: '#0f0f0f',   // Darker card sections
    border: '#333',        // Border color
    borderDark: '#252525', // Darker borders
  },
  
  // Text Colors
  text: {
    primary: '#f8fafc',    // White text
    secondary: '#94a3b8',  // Gray text
    muted: '#64748b',      // Muted gray
    accent: '#9ca3af',     // Accent gray
    white: 'white',
    dark: '#1a1a1a',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    accent: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  
  // Transparency variants
  transparent: {
    success: '#10b98120',
    warning: '#f59e0b20',
    error: '#ef444420',
    info: '#3b82f620',
    purple: '#7c3aed20',
    white: 'rgba(255,255,255,0.2)',
  },
  
  // Specific UI Elements
  ui: {
    healthGood: '#10b981',
    healthWarning: '#f59e0b',
    healthCritical: '#ef4444',
    violationBorder: '#ef4444',
    buttonPrimary: '#3b82f6',
    buttonDanger: '#ef4444',
    buttonSuccess: '#10b981',
    navText: '#d1d5db',
    navHover: '#252525',
  }
};

// Helper function to get theme color
window.getThemeColor = function(path) {
  const keys = path.split('.');
  let value = window.AI_OBSERVER_THEME;
  for (const key of keys) {
    value = value[key];
    if (!value) return '#666'; // Fallback color
  }
  return value;
};

// Export for use in components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.AI_OBSERVER_THEME;
}