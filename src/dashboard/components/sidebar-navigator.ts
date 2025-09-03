/**
 * Sidebar Navigator Component
 * Handles all sidebar navigation with proper data parsing
 * Max 400 lines
 */

export interface SidebarData {
  tables: Record<string, any>;
  hooks: any[];
  components: any[];
  apis: any[];
  pages: any[];
}

export interface SidebarCallbacks {
  onSelectTable: (name: string) => void;
  onSelectHook: (name: string) => void;
  onSelectComponent: (name: string) => void;
  onSelectAPI: (endpoint: string) => void;
  onSelectPage: (page: string) => void;
}

export class SidebarNavigator {
  private container: HTMLElement;
  private data: SidebarData;
  private callbacks: SidebarCallbacks;
  private selectedItem: string | null = null;
  private selectedType: string | null = null;
  
  constructor(containerId: string, callbacks: SidebarCallbacks) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
    this.callbacks = callbacks;
    this.data = {
      tables: {},
      hooks: [],
      components: [],
      apis: [],
      pages: []
    };
  }
  
  loadData(data: SidebarData): void {
    this.data = this.processData(data);
    this.render();
  }
  
  private processData(data: SidebarData): SidebarData {
    // Process and deduplicate hooks
    const hooks = new Map();
    Object.values(data.tables || {}).forEach(table => {
      if (table.hooks) {
        table.hooks.forEach((hook: any) => {
          const name = this.extractHookName(hook);
          if (name && !hooks.has(name)) {
            hooks.set(name, hook);
          }
        });
      }
    });
    
    // Process and deduplicate components
    const components = new Set<string>();
    Object.values(data.tables || {}).forEach(table => {
      if (table.components) {
        table.components.forEach((comp: any) => {
          const name = this.extractComponentName(comp);
          if (name) components.add(name);
        });
      }
    });
    
    // Process API endpoints
    const apis = new Map();
    Object.values(data.tables || {}).forEach(table => {
      if (table.apiEndpoints) {
        table.apiEndpoints.forEach((api: any) => {
          const endpoint = this.extractAPIEndpoint(api);
          if (endpoint && !apis.has(endpoint)) {
            apis.set(endpoint, api);
          }
        });
      }
    });
    
    return {
      tables: data.tables || {},
      hooks: Array.from(hooks.values()),
      components: Array.from(components),
      apis: Array.from(apis.values()),
      pages: data.pages || []
    };
  }
  
  private render(): void {
    this.container.innerHTML = `
      <!-- Search -->
      <div style="padding: 16px;">
        <input 
          type="text" 
          id="sidebarSearch"
          placeholder="Search..." 
          style="
            width: 100%;
            padding: 10px 12px;
            background: #0f0f0f;
            border: 1px solid #333;
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
          "
          onkeyup="this.filterItems(event)"
        >
      </div>
      
      <!-- Tables -->
      ${this.renderTableSection()}
      
      <!-- Hooks -->
      ${this.renderHookSection()}
      
      <!-- Components -->
      ${this.renderComponentSection()}
      
      <!-- API Routes -->
      ${this.renderAPISection()}
      
      <!-- Pages -->
      ${this.renderPageSection()}
      
      <!-- Validation Status -->
      ${this.renderValidationStatus()}
    `;
    
    this.attachEventListeners();
  }
  
  private renderTableSection(): string {
    const tables = Object.entries(this.data.tables);
    const count = tables.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="
          padding: 12px 16px;
          background: #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
          ">📊 Tables</h3>
          <span style="
            background: #252525;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: #64748b;
          ">${count}</span>
        </div>
        <div id="tablesList" style="max-height: 300px; overflow-y: auto;">
          ${count === 0 ? this.renderEmptyState('tables') : 
            tables.map(([name, data]) => this.renderTableItem(name, data)).join('')}
        </div>
      </div>
    `;
  }
  
  private renderTableItem(name: string, data: any): string {
    const score = data.score || 100;
    const healthColor = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    
    return `
      <div 
        class="sidebar-item table-item" 
        data-name="${name}"
        data-type="table"
        style="
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s;
          border-left: 3px solid transparent;
        "
        onmouseover="this.style.background='#252525'"
        onmouseout="this.style.background='transparent'"
      >
        <span style="font-size: 16px;">📊</span>
        <span style="flex: 1; color: #e2e8f0; font-size: 13px;">${name}</span>
        <span style="
          font-size: 11px;
          color: #64748b;
          margin-right: 4px;
        ">${score}%</span>
        <span style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${healthColor};
        "></span>
      </div>
    `;
  }
  
  private renderHookSection(): string {
    const count = this.data.hooks.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="
          padding: 12px 16px;
          background: #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
          ">🔗 Hooks</h3>
          <span style="
            background: #252525;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: #64748b;
          ">${count}</span>
        </div>
        <div id="hooksList" style="max-height: 200px; overflow-y: auto;">
          ${count === 0 ? this.renderEmptyState('hooks') : 
            this.data.hooks.slice(0, 15).map(hook => 
              this.renderSimpleItem(this.extractHookName(hook), 'hook', '🔗')
            ).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15) : ''}
        </div>
      </div>
    `;
  }
  
  private renderComponentSection(): string {
    const count = this.data.components.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="
          padding: 12px 16px;
          background: #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
          ">🧩 Components</h3>
          <span style="
            background: #252525;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: #64748b;
          ">${count}</span>
        </div>
        <div id="componentsList" style="max-height: 200px; overflow-y: auto;">
          ${count === 0 ? this.renderEmptyState('components') : 
            this.data.components.slice(0, 15).map(comp => 
              this.renderSimpleItem(comp, 'component', '🧩')
            ).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15) : ''}
        </div>
      </div>
    `;
  }
  
  private renderAPISection(): string {
    const count = this.data.apis.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="
          padding: 12px 16px;
          background: #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
          ">🌐 API Routes</h3>
          <span style="
            background: #252525;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: #64748b;
          ">${count}</span>
        </div>
        <div id="apisList" style="max-height: 200px; overflow-y: auto;">
          ${count === 0 ? this.renderEmptyState('API routes') : 
            this.data.apis.slice(0, 15).map(api => 
              this.renderSimpleItem(this.extractAPIEndpoint(api), 'api', '🌐')
            ).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15) : ''}
        </div>
      </div>
    `;
  }
  
  private renderPageSection(): string {
    const count = this.data.pages.length;
    
    return `
      <div class="entity-section" style="border-bottom: 1px solid #252525;">
        <div style="
          padding: 12px 16px;
          background: #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
          ">📄 Pages</h3>
          <span style="
            background: #252525;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: #64748b;
          ">${count}</span>
        </div>
        <div id="pagesList" style="max-height: 200px; overflow-y: auto;">
          ${count === 0 ? this.renderEmptyState('pages') : 
            this.data.pages.slice(0, 15).map(page => 
              this.renderSimpleItem(page, 'page', '📄')
            ).join('')}
          ${count > 15 ? this.renderMoreIndicator(count - 15) : ''}
        </div>
      </div>
    `;
  }
  
  private renderValidationStatus(): string {
    return `
      <div class="entity-section">
        <div style="
          padding: 12px 16px;
          background: #1a1a1a;
        ">
          <h3 style="
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
          ">✅ Validation Health</h3>
          <div style="display: flex; gap: 8px;">
            <div style="
              flex: 1;
              text-align: center;
              padding: 8px;
              background: #ef444420;
              border-radius: 6px;
              border: 1px solid #ef444440;
            ">
              <div style="color: #ef4444; font-size: 18px; font-weight: bold;">0</div>
              <div style="color: #fca5a5; font-size: 10px;">Critical</div>
            </div>
            <div style="
              flex: 1;
              text-align: center;
              padding: 8px;
              background: #f59e0b20;
              border-radius: 6px;
              border: 1px solid #f59e0b40;
            ">
              <div style="color: #f59e0b; font-size: 18px; font-weight: bold;">0</div>
              <div style="color: #fcd34d; font-size: 10px;">Warning</div>
            </div>
            <div style="
              flex: 1;
              text-align: center;
              padding: 8px;
              background: #3b82f620;
              border-radius: 6px;
              border: 1px solid #3b82f640;
            ">
              <div style="color: #3b82f6; font-size: 18px; font-weight: bold;">0</div>
              <div style="color: #93c5fd; font-size: 10px;">Info</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderSimpleItem(name: string, type: string, icon: string): string {
    return `
      <div 
        class="sidebar-item ${type}-item"
        data-name="${name}"
        data-type="${type}"
        style="
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s;
          border-left: 3px solid transparent;
        "
        onmouseover="this.style.background='#252525'"
        onmouseout="this.style.background='transparent'"
      >
        <span style="font-size: 14px;">${icon}</span>
        <span style="color: #e2e8f0; font-size: 13px;">${name}</span>
      </div>
    `;
  }
  
  private renderEmptyState(type: string): string {
    return `
      <div style="
        padding: 20px;
        text-align: center;
        color: #64748b;
        font-size: 12px;
      ">
        No ${type} found
      </div>
    `;
  }
  
  private renderMoreIndicator(count: number): string {
    return `
      <div style="
        padding: 8px 16px;
        color: #64748b;
        font-size: 11px;
        text-align: center;
        background: #0f0f0f;
      ">
        +${count} more...
      </div>
    `;
  }
  
  // Data extraction helpers
  private extractHookName(hook: any): string {
    if (typeof hook === 'string') return hook;
    return hook.hookName || hook.name || 'Unknown Hook';
  }
  
  private extractComponentName(comp: any): string {
    if (typeof comp === 'string') return comp;
    return comp.name || comp.componentName || comp.displayName || 'Unknown Component';
  }
  
  private extractAPIEndpoint(api: any): string {
    if (typeof api === 'string') return api;
    return api.endpoint || api.path || api.route || 'Unknown Endpoint';
  }
  
  private attachEventListeners(): void {
    // Handle item clicks
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const name = target.dataset.name || '';
        const type = target.dataset.type || '';
        this.selectItem(name, type);
      });
    });
    
    // Handle search
    const searchInput = this.container.querySelector('#sidebarSearch') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('keyup', () => this.filterItems(searchInput.value));
    }
  }
  
  selectItem(name: string, type: string): void {
    // Update selection state
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      (item as HTMLElement).style.borderLeftColor = 'transparent';
      (item as HTMLElement).style.background = 'transparent';
    });
    
    const selected = this.container.querySelector(`[data-name="${name}"][data-type="${type}"]`) as HTMLElement;
    if (selected) {
      selected.style.borderLeftColor = '#667eea';
      selected.style.background = '#252525';
    }
    
    this.selectedItem = name;
    this.selectedType = type;
    
    // Call appropriate callback
    switch(type) {
      case 'table': this.callbacks.onSelectTable(name); break;
      case 'hook': this.callbacks.onSelectHook(name); break;
      case 'component': this.callbacks.onSelectComponent(name); break;
      case 'api': this.callbacks.onSelectAPI(name); break;
      case 'page': this.callbacks.onSelectPage(name); break;
    }
  }
  
  private filterItems(searchTerm: string): void {
    const term = searchTerm.toLowerCase();
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      const name = (item as HTMLElement).dataset.name?.toLowerCase() || '';
      (item as HTMLElement).style.display = name.includes(term) ? 'flex' : 'none';
    });
  }
}