// Window extensions for dashboard globals
declare global {
  interface Window {
    DashboardLoader: any;
    liveLogPanel: any;
    SmartAnalysisView: any;
    smartRefreshManager: any;
    runSmartAnalysis: () => Promise<void>;
    startAutoRefresh: () => void;
    stopAutoRefresh: () => void;
    switchTab: (tab: string) => void;
  }
}

export {};