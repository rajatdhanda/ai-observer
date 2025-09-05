import * as fs from 'fs';
import * as path from 'path';

export class ProjectContextDetector {
  constructor(private projectPath: string) {}

  detectFramework(): string {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.next) return 'Next.js';
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue';
      if (deps.express) return 'Express';
      if (deps.fastify) return 'Fastify';
    }
    return 'Unknown';
  }

  findEntryPoints(): string[] {
    const entries: string[] = [];
    const patterns = [
      'src/index.ts', 'src/main.ts', 'src/app.ts',
      'src/app/page.tsx', 'src/app/layout.tsx',
      'pages/index.tsx', 'pages/_app.tsx'
    ];
    
    for (const pattern of patterns) {
      const fullPath = path.join(this.projectPath, pattern);
      if (fs.existsSync(fullPath)) {
        entries.push(pattern);
      }
    }
    return entries;
  }

  findApiRoutes(): string[] {
    const routes: string[] = [];
    const apiDirs = [
      path.join(this.projectPath, 'src/app/api'),
      path.join(this.projectPath, 'pages/api'),
      path.join(this.projectPath, 'api')
    ];
    
    for (const dir of apiDirs) {
      if (fs.existsSync(dir)) {
        this.walkDir(dir, (file) => {
          if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            routes.push(file.replace(this.projectPath, ''));
          }
        });
      }
    }
    return routes;
  }

  detectDatabase(): string {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.prisma || deps['@prisma/client']) return 'Prisma/PostgreSQL';
      if (deps.mongoose) return 'MongoDB';
      if (deps.pg) return 'PostgreSQL';
      if (deps.mysql2) return 'MySQL';
      if (deps.sqlite3) return 'SQLite';
    }
    return 'None detected';
  }

  getKeyDependencies(): Record<string, string> {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const important = ['next', 'react', 'typescript', 'prisma', '@prisma/client', 
                        'tailwindcss', 'zod', 'express', 'fastify'];
      const result: Record<string, string> = {};
      
      for (const dep of important) {
        if (pkg.dependencies?.[dep]) result[dep] = pkg.dependencies[dep];
        if (pkg.devDependencies?.[dep]) result[dep] = pkg.devDependencies[dep];
      }
      return result;
    }
    return {};
  }

  detectEnvVars(): string[] {
    const envExample = path.join(this.projectPath, '.env.example');
    const envLocal = path.join(this.projectPath, '.env.local.example');
    const vars = new Set<string>();
    
    for (const file of [envExample, envLocal]) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(/^([A-Z_]+)=/gm);
        if (matches) {
          matches.forEach(m => vars.add(m.replace('=', '')));
        }
      }
    }
    
    return Array.from(vars);
  }

  getBuildCommands(): Record<string, string> {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const important = ['dev', 'build', 'start', 'test', 'lint', 'typecheck'];
      const result: Record<string, string> = {};
      
      for (const script of important) {
        if (pkg.scripts?.[script]) {
          result[script] = pkg.scripts[script];
        }
      }
      return result;
    }
    return {};
  }

  private walkDir(dir: string, callback: (file: string) => void): void {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !file.startsWith('.')) {
        this.walkDir(fullPath, callback);
      } else {
        callback(fullPath);
      }
    });
  }
}