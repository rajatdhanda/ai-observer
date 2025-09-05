import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { DataFlowMap, Layer, Connection, CriticalPath, TypeSystem } from './index';

export class DataFlowMapper {
  async map(projectPath: string, types: TypeSystem): Promise<DataFlowMap> {
    const layers = this.identifyLayers(projectPath, types);
    const connections = this.findConnections(projectPath, layers);
    const criticalPaths = this.identifyCriticalPaths(connections, layers);

    return {
      layers,
      connections,
      criticalPaths
    };
  }

  private identifyLayers(projectPath: string, types: TypeSystem): Layer[] {
    const layers: Layer[] = [];

    // Database layer
    const databaseComponents = types.interfaces
      .filter(i => i.category === 'database')
      .map(i => i.name);
    
    if (databaseComponents.length > 0) {
      layers.push({
        name: 'Database',
        type: 'database',
        components: databaseComponents
      });
    }

    // API layer
    const apiComponents = this.findApiRoutes(projectPath);
    if (apiComponents.length > 0) {
      layers.push({
        name: 'API',
        type: 'api',
        components: apiComponents
      });
    }

    // State layer
    const stateComponents = this.findStateManagement(projectPath);
    if (stateComponents.length > 0) {
      layers.push({
        name: 'State Management',
        type: 'state',
        components: stateComponents
      });
    }

    // UI layer
    const uiComponents = this.findUIComponents(projectPath);
    layers.push({
      name: 'UI Components',
      type: 'ui',
      components: uiComponents
    });

    return layers;
  }

  private findApiRoutes(projectPath: string): string[] {
    const apiRoutes: string[] = [];
    const apiDir = path.join(projectPath, 'src', 'app', 'api');
    const pagesApiDir = path.join(projectPath, 'pages', 'api');
    
    // Check Next.js App Router API routes
    if (fs.existsSync(apiDir)) {
      this.walkApiDir(apiDir, apiRoutes);
    }
    
    // Check Next.js Pages Router API routes
    if (fs.existsSync(pagesApiDir)) {
      this.walkApiDir(pagesApiDir, apiRoutes);
    }

    // Check for Express-style routes
    const routesDir = path.join(projectPath, 'routes');
    if (fs.existsSync(routesDir)) {
      this.walkApiDir(routesDir, apiRoutes);
    }

    return apiRoutes;
  }

  private walkApiDir(dir: string, routes: string[]) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.walkApiDir(filePath, routes);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const routeName = this.extractRouteName(filePath);
        if (routeName) {
          routes.push(routeName);
        }
      }
    }
  }

  private extractRouteName(filePath: string): string {
    const parts = filePath.split(path.sep);
    const apiIndex = parts.findIndex(p => p === 'api' || p === 'routes');
    
    if (apiIndex !== -1) {
      const routeParts = parts.slice(apiIndex + 1);
      const routeName = routeParts
        .join('/')
        .replace(/\.(ts|js|tsx|jsx)$/, '')
        .replace(/\/route$/, '')
        .replace(/\/index$/, '');
      
      return `/${routeName}`;
    }
    
    return '';
  }

  private findStateManagement(projectPath: string): string[] {
    const stateComponents: string[] = [];
    const storeDir = path.join(projectPath, 'src', 'store');
    const hooksDir = path.join(projectPath, 'src', 'hooks');
    const contextDir = path.join(projectPath, 'src', 'context');
    
    // Check for Redux/Zustand stores
    if (fs.existsSync(storeDir)) {
      stateComponents.push(...this.getComponentNames(storeDir));
    }
    
    // Check for custom hooks
    if (fs.existsSync(hooksDir)) {
      stateComponents.push(...this.getComponentNames(hooksDir));
    }
    
    // Check for React Context
    if (fs.existsSync(contextDir)) {
      stateComponents.push(...this.getComponentNames(contextDir));
    }

    return stateComponents;
  }

  private findUIComponents(projectPath: string): string[] {
    const components: string[] = [];
    const componentsDir = path.join(projectPath, 'src', 'components');
    const appDir = path.join(projectPath, 'src', 'app');
    const pagesDir = path.join(projectPath, 'pages');
    
    if (fs.existsSync(componentsDir)) {
      components.push(...this.getComponentNames(componentsDir));
    }
    
    if (fs.existsSync(appDir)) {
      components.push(...this.getPageComponents(appDir));
    }
    
    if (fs.existsSync(pagesDir)) {
      components.push(...this.getPageComponents(pagesDir));
    }

    return components;
  }

  private getComponentNames(dir: string): string[] {
    const components: string[] = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        components.push(...this.getComponentNames(filePath));
      } else if (file.match(/\.(tsx?|jsx?)$/)) {
        const name = file.replace(/\.(tsx?|jsx?)$/, '');
        if (name !== 'index') {
          components.push(name);
        }
      }
    }
    
    return components;
  }

  private getPageComponents(dir: string): string[] {
    const pages: string[] = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('_') && !file.startsWith('.')) {
        pages.push(...this.getPageComponents(filePath));
      } else if (file === 'page.tsx' || file === 'page.jsx' || file === 'page.ts' || file === 'page.js') {
        const pageName = path.relative(dir, path.dirname(filePath)) || 'Home';
        pages.push(pageName);
      }
    }
    
    return pages;
  }

  private findConnections(projectPath: string, layers: Layer[]): Connection[] {
    const connections: Connection[] = [];
    
    // Database -> API connections
    const dbLayer = layers.find(l => l.type === 'database');
    const apiLayer = layers.find(l => l.type === 'api');
    
    if (dbLayer && apiLayer) {
      dbLayer.components.forEach(dbComponent => {
        connections.push({
          from: `Database.${dbComponent}`,
          to: 'API',
          dataType: dbComponent,
          method: 'query'
        });
      });
    }
    
    // API -> State connections
    const stateLayer = layers.find(l => l.type === 'state');
    if (apiLayer && stateLayer) {
      stateLayer.components.forEach(stateComponent => {
        if (stateComponent.startsWith('use')) {
          connections.push({
            from: 'API',
            to: `State.${stateComponent}`,
            dataType: 'response',
            method: 'fetch'
          });
        }
      });
    }
    
    // State -> UI connections
    const uiLayer = layers.find(l => l.type === 'ui');
    if (stateLayer && uiLayer) {
      stateLayer.components.forEach(stateComponent => {
        connections.push({
          from: `State.${stateComponent}`,
          to: 'UI',
          dataType: 'props',
          method: 'render'
        });
      });
    }

    return connections;
  }

  private identifyCriticalPaths(connections: Connection[], layers: Layer[]): CriticalPath[] {
    const criticalPaths: CriticalPath[] = [];
    
    // Authentication flow
    if (this.hasAuthComponents(layers)) {
      criticalPaths.push({
        name: 'Authentication',
        steps: ['Login Form', 'API Auth', 'Session Storage', 'Protected Routes'],
        importance: 'high'
      });
    }
    
    // Data CRUD operations
    const dbLayer = layers.find(l => l.type === 'database');
    if (dbLayer && dbLayer.components.length > 0) {
      criticalPaths.push({
        name: 'Data Operations',
        steps: ['UI Form', 'Validation', 'API Request', 'Database Operation', 'Response'],
        importance: 'high'
      });
    }
    
    // Page rendering
    criticalPaths.push({
      name: 'Page Rendering',
      steps: ['Route Request', 'Data Fetching', 'Component Render', 'Client Hydration'],
      importance: 'medium'
    });

    return criticalPaths;
  }

  private hasAuthComponents(layers: Layer[]): boolean {
    return layers.some(layer => 
      layer.components.some(c => 
        c.toLowerCase().includes('auth') || 
        c.toLowerCase().includes('login') ||
        c.toLowerCase().includes('user')
      )
    );
  }
}