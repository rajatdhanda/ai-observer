import * as fs from 'fs';
import * as path from 'path';
import { FrameworkInfo } from './index';

export class FrameworkDetector {
  async detect(projectPath: string): Promise<FrameworkInfo> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('No package.json found in project');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Detect framework
    const framework = this.identifyFramework(deps);
    
    return {
      name: framework.name,
      version: framework.version,
      type: framework.type,
      dependencies: packageJson.dependencies || {},
      scripts: packageJson.scripts || {}
    };
  }

  private identifyFramework(deps: Record<string, string>): {
    name: string;
    version: string;
    type: 'frontend' | 'backend' | 'fullstack';
  } {
    // Next.js detection
    if (deps['next']) {
      return {
        name: 'Next.js',
        version: deps['next'],
        type: 'fullstack'
      };
    }

    // React detection
    if (deps['react'] && !deps['next']) {
      if (deps['react-native']) {
        return {
          name: 'React Native',
          version: deps['react-native'],
          type: 'frontend'
        };
      }
      return {
        name: 'React',
        version: deps['react'],
        type: 'frontend'
      };
    }

    // Vue detection
    if (deps['vue']) {
      if (deps['nuxt']) {
        return {
          name: 'Nuxt.js',
          version: deps['nuxt'],
          type: 'fullstack'
        };
      }
      return {
        name: 'Vue.js',
        version: deps['vue'],
        type: 'frontend'
      };
    }

    // Angular detection
    if (deps['@angular/core']) {
      return {
        name: 'Angular',
        version: deps['@angular/core'],
        type: 'frontend'
      };
    }

    // Express detection
    if (deps['express']) {
      return {
        name: 'Express.js',
        version: deps['express'],
        type: 'backend'
      };
    }

    // NestJS detection
    if (deps['@nestjs/core']) {
      return {
        name: 'NestJS',
        version: deps['@nestjs/core'],
        type: 'backend'
      };
    }

    // Svelte detection
    if (deps['svelte']) {
      if (deps['@sveltejs/kit']) {
        return {
          name: 'SvelteKit',
          version: deps['@sveltejs/kit'],
          type: 'fullstack'
        };
      }
      return {
        name: 'Svelte',
        version: deps['svelte'],
        type: 'frontend'
      };
    }

    // Default Node.js project
    return {
      name: 'Node.js',
      version: process.version,
      type: 'backend'
    };
  }
}