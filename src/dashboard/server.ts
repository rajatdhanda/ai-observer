import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { EnhancedTypeChecker } from '../validators/enhanced-type-checker';
import { SchemaLoader } from '../validators/schema-loader';

const PORT = 3456;

class DashboardServer {
  private checker!: EnhancedTypeChecker;
  private registry: any;

  async init() {
    const configPath = path.join(process.cwd(), 'observer.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    const loader = new SchemaLoader();
    this.registry = await loader.loadProjectSchemas(path.resolve(config.schemaPath));
    this.checker = new EnhancedTypeChecker(this.registry);
  }

  async runValidation() {
    const configPath = path.join(process.cwd(), 'observer.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    const results = {
      timestamp: new Date().toISOString(),
      files: [] as Array<{path: string, issues: any[], status: string}>,
      totalIssues: 0,
      healthScore: 100
    };

    // Check all files in test-project
    const files = this.getFiles(config.checkPaths[0]);
    
    for (const file of files) {
      const issues = this.checker.checkFile(file);
      results.files.push({
        path: file,
        issues: issues,
        status: issues.length === 0 ? 'pass' : 'fail'
      });
      results.totalIssues += issues.length;
    }

    results.healthScore = Math.round(((files.length - results.files.filter(f => f.status === 'fail').length) / files.length) * 100);
    
    return results;
  }

  getFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      if (item.includes('node_modules')) return;
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  async start() {
    await this.init();
    
    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (req.url === '/api/validate') {
        const results = await this.runValidation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
      } else if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getHTML());
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(PORT, () => {
      console.log(`Dashboard running at http://localhost:${PORT}`);
    });
  }

  getHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI Observer Dashboard</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, system-ui, sans-serif; 
            background: #f3f4f6;
            padding: 20px;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .metric {
            background: white;
            padding: 20px;
            border-radius: 8px;
          }
          .metric h3 {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .metric .value {
            font-size: 32px;
            font-weight: bold;
          }
          .files {
            background: white;
            padding: 20px;
            border-radius: 8px;
          }
          .file {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .file.fail {
            background: #fef2f2;
          }
          .file.pass {
            background: #f0fdf4;
          }
          .issue {
            margin-left: 20px;
            margin-top: 8px;
            color: #ef4444;
            font-size: 14px;
          }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
          }
          button:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI Observer Dashboard</h1>
            <button onclick="runValidation()">Run Validation</button>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <h3>Health Score</h3>
              <div class="value" id="health">-</div>
            </div>
            <div class="metric">
              <h3>Total Files</h3>
              <div class="value" id="total">-</div>
            </div>
            <div class="metric">
              <h3>Issues Found</h3>
              <div class="value" id="issues">-</div>
            </div>
          </div>
          
          <div class="files">
            <h2>Files</h2>
            <div id="fileList"></div>
          </div>
        </div>
        
        <script>
          async function runValidation() {
            const response = await fetch('/api/validate');
            const data = await response.json();
            
            document.getElementById('health').textContent = data.healthScore + '%';
            document.getElementById('total').textContent = data.files.length;
            document.getElementById('issues').textContent = data.totalIssues;
            
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = data.files.map(file => {
              const issues = file.issues.map(issue => 
                '<div class="issue">Line ' + issue.line + ': ' + issue.message + '</div>'
              ).join('');
              
              return '<div class="file ' + file.status + '">' + 
                file.path + 
                issues +
                '</div>';
            }).join('');
          }
          
          // Run on load
          runValidation();
        </script>
      </body>
      </html>
    `;
  }
}

const dashboard = new DashboardServer();
dashboard.start();