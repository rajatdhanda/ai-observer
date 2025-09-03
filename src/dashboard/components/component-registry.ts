/**
 * Component Registry
 * Central registry for all dashboard components
 * Provides unified interface for component usage
 */

import { HealthScoreViewer } from './health-score-viewer';
import { QueryInspectorEnhanced } from './query-inspector-enhanced';
import { TableDetailsViewer } from './table-details-viewer';
import { SidebarNavigator } from './sidebar-navigator';
import { ControlBar } from './control-bar';

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, any> = new Map();
  
  private constructor() {
    this.registerComponents();
  }
  
  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }
  
  private registerComponents(): void {
    this.components.set('HealthScoreViewer', HealthScoreViewer);
    this.components.set('QueryInspectorEnhanced', QueryInspectorEnhanced);
    this.components.set('TableDetailsViewer', TableDetailsViewer);
    this.components.set('SidebarNavigator', SidebarNavigator);
    this.components.set('ControlBar', ControlBar);
  }
  
  getComponent(name: string): any {
    return this.components.get(name);
  }
  
  createHealthScoreViewer(containerId: string): HealthScoreViewer {
    return new HealthScoreViewer(containerId);
  }
  
  createQueryInspector(containerId: string): QueryInspectorEnhanced {
    return new QueryInspectorEnhanced(containerId);
  }
  
  createTableDetailsViewer(containerId: string): TableDetailsViewer {
    return new TableDetailsViewer(containerId);
  }
  
  createSidebarNavigator(containerId: string, callbacks: any): SidebarNavigator {
    return new SidebarNavigator(containerId, callbacks);
  }
  
  createControlBar(containerId: string, config: any): ControlBar {
    return new ControlBar(containerId, config);
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistry.getInstance();