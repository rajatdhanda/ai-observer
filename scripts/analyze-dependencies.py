#!/usr/bin/env python3
"""
Dependency Analyzer for AI Observer
Identifies which files are actually being used vs unused/redundant
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict
import subprocess

class DependencyAnalyzer:
    def __init__(self, root_path):
        self.root = Path(root_path)
        self.dependencies = defaultdict(set)
        self.reverse_deps = defaultdict(set)
        self.entry_points = set()
        self.all_files = set()
        self.used_files = set()
        self.component_map = {}
        
    def analyze(self):
        """Main analysis function"""
        print("🔍 Analyzing AI Observer dependencies...")
        
        # 1. Find all source files
        self.find_all_files()
        
        # 2. Identify entry points
        self.find_entry_points()
        
        # 3. Trace dependencies
        self.trace_dependencies()
        
        # 4. Find dashboard components
        self.find_dashboard_components()
        
        # 5. Calculate usage
        self.calculate_usage()
        
        # 6. Generate report
        return self.generate_report()
    
    def find_all_files(self):
        """Find all TypeScript/JavaScript files"""
        for ext in ['*.ts', '*.js', '*.tsx', '*.jsx']:
            for file in self.root.glob(f'src/**/{ext}'):
                if 'node_modules' not in str(file):
                    self.all_files.add(str(file.relative_to(self.root)))
    
    def find_entry_points(self):
        """Find entry points from package.json and bin directory"""
        # Check package.json scripts
        package_json = self.root / 'package.json'
        if package_json.exists():
            with open(package_json) as f:
                pkg = json.load(f)
                
            # Check bin field
            if 'bin' in pkg:
                for cmd, path in pkg['bin'].items():
                    self.entry_points.add(path.replace('./', ''))
            
            # Parse scripts for entry points
            for script_name, script_cmd in pkg.get('scripts', {}).items():
                # Extract file paths from scripts
                if 'tsx' in script_cmd or 'ts-node' in script_cmd or 'node' in script_cmd:
                    match = re.search(r'(src/[\w/\-]+\.(?:ts|js))', script_cmd)
                    if match:
                        self.entry_points.add(match.group(1))
        
        # Check bin directory
        bin_dir = self.root / 'bin'
        if bin_dir.exists():
            for file in bin_dir.glob('*'):
                if file.is_file():
                    self.entry_points.add(f'bin/{file.name}')
                    # Read shebang to find actual script
                    with open(file) as f:
                        first_line = f.readline()
                        if 'node' in first_line or 'tsx' in first_line:
                            for line in f:
                                match = re.search(r'require\([\'"]([^"\']+)', line)
                                if match:
                                    self.entry_points.add(match.group(1).replace('../', ''))
    
    def trace_dependencies(self):
        """Trace import/require dependencies"""
        for file_path in self.all_files:
            full_path = self.root / file_path
            if not full_path.exists():
                continue
                
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Find imports and requires
            imports = []
            
            # ES6 imports
            imports.extend(re.findall(r'import\s+.*?\s+from\s+[\'"]([^"\']+)', content))
            imports.extend(re.findall(r'import\s+[\'"]([^"\']+)', content))
            
            # CommonJS requires
            imports.extend(re.findall(r'require\([\'"]([^"\']+)', content))
            
            # Dynamic imports
            imports.extend(re.findall(r'import\([\'"]([^"\']+)', content))
            
            for imp in imports:
                # Skip node_modules
                if imp.startswith('.'):
                    # Relative import
                    resolved = self.resolve_import(file_path, imp)
                    if resolved:
                        self.dependencies[file_path].add(resolved)
                        self.reverse_deps[resolved].add(file_path)
    
    def resolve_import(self, from_file, import_path):
        """Resolve relative import to actual file"""
        from_dir = Path(from_file).parent
        
        # Clean up the import path
        import_path = import_path.replace('./', '').replace('../', '../')
        
        # Try different extensions
        for ext in ['', '.ts', '.js', '.tsx', '.jsx', '/index.ts', '/index.js']:
            potential = (self.root / from_dir / (import_path + ext)).resolve()
            try:
                rel_path = potential.relative_to(self.root)
                if str(rel_path) in self.all_files:
                    return str(rel_path)
            except ValueError:
                pass
        
        return None
    
    def find_dashboard_components(self):
        """Find dashboard components and their usage"""
        dashboard_dir = self.root / 'src/dashboard'
        if dashboard_dir.exists():
            # Find the main server file
            server_files = list(dashboard_dir.glob('*server*.ts')) + list(dashboard_dir.glob('*server*.js'))
            
            for server_file in server_files:
                with open(server_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                # Look for component registrations
                component_refs = re.findall(r'[\'"]([^"\']+(?:component|view|panel)[^"\']*)[\'"]', content, re.IGNORECASE)
                for ref in component_refs:
                    if '.js' in ref or '.ts' in ref:
                        self.component_map[ref] = str(server_file.relative_to(self.root))
    
    def calculate_usage(self):
        """Calculate which files are actually used"""
        # Start with entry points
        to_process = list(self.entry_points)
        processed = set()
        
        while to_process:
            current = to_process.pop(0)
            if current in processed:
                continue
                
            processed.add(current)
            self.used_files.add(current)
            
            # Add all dependencies of this file
            for dep in self.dependencies.get(current, []):
                if dep not in processed:
                    to_process.append(dep)
        
        # Add dashboard components
        for comp_file in self.component_map.keys():
            if comp_file.startswith('./'):
                comp_file = comp_file[2:]
            if comp_file.startswith('src/'):
                self.used_files.add(comp_file)
            else:
                self.used_files.add(f'src/dashboard/{comp_file}')
    
    def generate_report(self):
        """Generate usage report"""
        unused_files = self.all_files - self.used_files
        
        report = {
            'summary': {
                'total_files': len(self.all_files),
                'used_files': len(self.used_files),
                'unused_files': len(unused_files),
                'usage_percentage': round((len(self.used_files) / len(self.all_files)) * 100, 2) if self.all_files else 0
            },
            'entry_points': sorted(list(self.entry_points)),
            'core_flows': self.identify_core_flows(),
            'unused_files': sorted(list(unused_files)),
            'component_map': self.component_map,
            'recommendations': self.generate_recommendations(unused_files)
        }
        
        return report
    
    def identify_core_flows(self):
        """Identify core application flows"""
        flows = {
            'dashboard': {
                'entry': 'src/dashboard/unified-server.ts',
                'components': [],
                'purpose': 'Web dashboard for viewing analysis results'
            },
            'smart_analyzer': {
                'entry': 'src/cli/analyze-smart.ts', 
                'components': [],
                'purpose': 'Analyzes codebase and generates FIX_THIS.json'
            },
            'observer': {
                'entry': 'bin/ai-observe',
                'components': [],
                'purpose': 'Real-time file monitoring and validation'
            }
        }
        
        # Find components for each flow
        for flow_name, flow_info in flows.items():
            entry = flow_info['entry']
            if entry in self.dependencies:
                flows[flow_name]['components'] = sorted(list(self.dependencies[entry]))[:5]
        
        return flows
    
    def generate_recommendations(self, unused_files):
        """Generate cleanup recommendations"""
        recommendations = []
        
        # Group unused files by directory
        unused_by_dir = defaultdict(list)
        for file in unused_files:
            dir_name = str(Path(file).parent)
            unused_by_dir[dir_name].append(file)
        
        # Identify patterns
        for dir_name, files in unused_by_dir.items():
            if len(files) > 3:
                recommendations.append(f"Directory '{dir_name}' has {len(files)} unused files - consider removing")
        
        # Check for test files
        test_files = [f for f in unused_files if 'test' in f or 'spec' in f]
        if test_files:
            recommendations.append(f"Found {len(test_files)} unused test files")
        
        # Check for duplicate functionality
        validators = [f for f in self.all_files if 'validator' in f]
        if len(validators) > 5:
            recommendations.append(f"Multiple validator files ({len(validators)}) - consider consolidation")
        
        return recommendations


def main():
    analyzer = DependencyAnalyzer('/Users/rajatdhanda/Tech/Projects/ai-observer')
    report = analyzer.analyze()
    
    # Save report
    output_path = Path('/Users/rajatdhanda/Tech/Projects/ai-observer/.observer/dependency-analysis.json')
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print("\n📊 Dependency Analysis Complete!")
    print("=" * 50)
    print(f"Total Files: {report['summary']['total_files']}")
    print(f"Used Files: {report['summary']['used_files']} ({report['summary']['usage_percentage']}%)")
    print(f"Unused Files: {report['summary']['unused_files']}")
    print("\n🎯 Core Flows:")
    for flow_name, flow_info in report['core_flows'].items():
        print(f"  • {flow_name}: {flow_info['purpose']}")
    print("\n💡 Recommendations:")
    for rec in report['recommendations'][:3]:
        print(f"  • {rec}")
    print(f"\n📁 Full report saved to: {output_path}")
    

if __name__ == '__main__':
    main()