#!/usr/bin/env python3
"""
Data Validation Checklist for AI Observer
Ensures data integrity and completeness across all analysis outputs
"""

import json
import os
from pathlib import Path
import subprocess
from datetime import datetime
from typing import Dict, List, Any

class DataValidator:
    def __init__(self, observer_root='/Users/rajatdhanda/Tech/Projects/ai-observer'):
        self.root = Path(observer_root)
        self.observer_dir = self.root / '.observer'
        self.checklist = {}
        self.validation_results = {
            'timestamp': datetime.now().isoformat(),
            'checks': {},
            'summary': {
                'total_checks': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0
            }
        }
        
    def validate(self):
        """Run all validation checks"""
        print("🔍 Validating AI Observer Data Integrity...")
        print("=" * 50)
        
        # Define validation checks
        checks = [
            ('FIX_THIS.json exists', self.check_fix_this_exists),
            ('FIX_THIS has issue buckets', self.check_fix_this_buckets),
            ('Smart analysis data exists', self.check_smart_analysis),
            ('Contract compliance included', self.check_contract_compliance),
            ('Nine rules validation working', self.check_nine_rules),
            ('AI drift detection present', self.check_ai_drift),
            ('Dashboard API responding', self.check_dashboard_api),
            ('Issue counts consistent', self.check_issue_counts),
            ('Table mappings present', self.check_table_mappings),
            ('Hook analysis present', self.check_hook_analysis),
            ('Severity distribution valid', self.check_severity_distribution),
            ('Analysis timestamp recent', self.check_timestamp_freshness)
        ]
        
        # Run each check
        for check_name, check_func in checks:
            result = check_func()
            self.validation_results['checks'][check_name] = result
            self.validation_results['summary']['total_checks'] += 1
            
            if result['status'] == 'pass':
                self.validation_results['summary']['passed'] += 1
                print(f"✅ {check_name}: {result['value']}")
            elif result['status'] == 'warning':
                self.validation_results['summary']['warnings'] += 1
                print(f"⚠️  {check_name}: {result['message']}")
            else:
                self.validation_results['summary']['failed'] += 1
                print(f"❌ {check_name}: {result['message']}")
        
        # Save results
        self.save_results()
        
        # Print summary
        self.print_summary()
        
    def check_fix_this_exists(self) -> Dict:
        """Check if FIX_THIS.json exists"""
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if fix_this.exists():
            with open(fix_this) as f:
                data = json.load(f)
            return {
                'status': 'pass',
                'value': f"Found with {len(data.get('issues', []))} issues"
            }
        return {
            'status': 'fail',
            'message': 'FIX_THIS.json not found'
        }
    
    def check_fix_this_buckets(self) -> Dict:
        """Check if FIX_THIS has bucket categorization"""
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if not fix_this.exists():
            return {'status': 'fail', 'message': 'FIX_THIS.json missing'}
            
        with open(fix_this) as f:
            data = json.load(f)
        
        buckets = data.get('issue_buckets', [])
        if buckets:
            bucket_names = [b['name'] for b in buckets]
            total_issues = sum(b['count'] for b in buckets)
            return {
                'status': 'pass',
                'value': f"{len(buckets)} buckets: {', '.join(bucket_names)} ({total_issues} issues)"
            }
        return {
            'status': 'fail',
            'message': 'No bucket categorization found'
        }
    
    def check_smart_analysis(self) -> Dict:
        """Check smart analysis data"""
        analysis_file = self.observer_dir / 'smart_analysis.json'
        if analysis_file.exists():
            with open(analysis_file) as f:
                data = json.load(f)
            stats = data.get('stats', {})
            total = stats.get('total_issues_found', 0)
            return {
                'status': 'pass',
                'value': f"{total} total issues analyzed"
            }
        return {
            'status': 'warning',
            'message': 'smart_analysis.json not found'
        }
    
    def check_contract_compliance(self) -> Dict:
        """Check if contract compliance is included"""
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if not fix_this.exists():
            return {'status': 'fail', 'message': 'FIX_THIS.json missing'}
            
        with open(fix_this) as f:
            data = json.load(f)
        
        # Check in bucket issues
        buckets = data.get('issue_buckets', [])
        contract_count = 0
        for bucket in buckets:
            for issue in bucket.get('issues', []):
                if 'contract' in issue.get('rule', '').lower() or 'contract' in issue.get('message', '').lower():
                    contract_count += 1
        
        if contract_count > 0:
            return {
                'status': 'pass',
                'value': f"{contract_count} contract compliance issues found"
            }
        
        return {
            'status': 'fail',
            'message': 'No contract compliance validation found'
        }
    
    def check_nine_rules(self) -> Dict:
        """Check nine rules validation"""
        nine_rules = self.observer_dir / 'nine_rules_validation.json'
        if nine_rules.exists():
            with open(nine_rules) as f:
                data = json.load(f)
            total = len(data.get('violations', []))
            return {
                'status': 'pass',
                'value': f"{total} nine rules violations"
            }
        return {
            'status': 'warning',
            'message': 'nine_rules_validation.json not found'
        }
    
    def check_ai_drift(self) -> Dict:
        """Check AI drift detection (file size, duplicate functions, exports)"""
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if not fix_this.exists():
            return {'status': 'fail', 'message': 'FIX_THIS.json missing'}
            
        with open(fix_this) as f:
            data = json.load(f)
        
        ai_drift_rules = ['File Size Warnings', 'Duplicate Functions', 'Export Completeness']
        found_rules = []
        
        # Check in bucket issues
        buckets = data.get('issue_buckets', [])
        for bucket in buckets:
            for issue in bucket.get('issues', []):
                rule = issue.get('rule', '')
                if any(r in rule for r in ai_drift_rules):
                    if rule not in found_rules:
                        found_rules.append(rule)
        
        if found_rules:
            return {
                'status': 'pass',
                'value': f"AI drift detection active: {', '.join(found_rules)}"
            }
        return {
            'status': 'fail',
            'message': 'No AI drift detection found (File Size, Duplicate Functions, Export Completeness)'
        }
    
    def check_dashboard_api(self) -> Dict:
        """Check if dashboard API endpoints are responding"""
        try:
            # Check if dashboard is running
            result = subprocess.run(
                ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:3001/api/smart-analysis'],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.stdout == '200':
                return {
                    'status': 'pass',
                    'value': 'Dashboard API responding (200 OK)'
                }
            return {
                'status': 'warning',
                'message': f'Dashboard API returned {result.stdout}'
            }
        except:
            return {
                'status': 'warning',
                'message': 'Dashboard not running or not accessible'
            }
    
    def check_issue_counts(self) -> Dict:
        """Check if issue counts are consistent across files"""
        counts = {}
        
        # Check FIX_THIS.json
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if fix_this.exists():
            with open(fix_this) as f:
                data = json.load(f)
            
            # Count issues in buckets (new structure)
            buckets = data.get('issue_buckets', [])
            if buckets:
                actual_count = sum(len(b.get('issues', [])) for b in buckets)
                counts['actual_issues'] = actual_count
                counts['bucket_total'] = sum(b['count'] for b in buckets)
        
        # Check smart_analysis.json
        smart_file = self.observer_dir / 'smart_analysis.json'
        if smart_file.exists():
            with open(smart_file) as f:
                data = json.load(f)
            stats = data.get('stats', {})
            counts['smart_analysis'] = stats.get('total_issues_found', 0)
        
        # Validate consistency
        if len(set(counts.values())) == 1:
            return {
                'status': 'pass',
                'value': f"All counts consistent: {list(counts.values())[0]} issues"
            }
        else:
            return {
                'status': 'warning',
                'message': f"Inconsistent counts: {counts}"
            }
    
    def check_table_mappings(self) -> Dict:
        """Check if table mappings are present"""
        tables_file = self.observer_dir / 'tables.json'
        if tables_file.exists():
            with open(tables_file) as f:
                data = json.load(f)
            table_count = len(data.get('tables', []))
            return {
                'status': 'pass',
                'value': f"{table_count} tables mapped"
            }
        return {
            'status': 'warning',
            'message': 'tables.json not found'
        }
    
    def check_hook_analysis(self) -> Dict:
        """Check if hook analysis is present"""
        hooks_file = self.observer_dir / 'hook-analysis.json'
        if hooks_file.exists():
            with open(hooks_file) as f:
                data = json.load(f)
            hook_count = len(data.get('hooks', []))
            return {
                'status': 'pass',
                'value': f"{hook_count} hooks analyzed"
            }
        return {
            'status': 'warning',
            'message': 'hook-analysis.json not found'
        }
    
    def check_severity_distribution(self) -> Dict:
        """Check severity distribution"""
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if not fix_this.exists():
            return {'status': 'fail', 'message': 'FIX_THIS.json missing'}
            
        with open(fix_this) as f:
            data = json.load(f)
        
        stats = data.get('stats', {})
        severity = stats.get('by_severity', {})
        
        if severity:
            distribution = ', '.join([f"{k}: {v}" for k, v in severity.items()])
            return {
                'status': 'pass',
                'value': f"Severity: {distribution}"
            }
        return {
            'status': 'warning',
            'message': 'No severity distribution found'
        }
    
    def check_timestamp_freshness(self) -> Dict:
        """Check if analysis is recent"""
        fix_this = self.observer_dir / 'FIX_THIS.json'
        if not fix_this.exists():
            return {'status': 'fail', 'message': 'FIX_THIS.json missing'}
            
        with open(fix_this) as f:
            data = json.load(f)
        
        generated = data.get('generated', '')
        if generated:
            # Parse timestamp
            from datetime import datetime
            try:
                timestamp = datetime.fromisoformat(generated.replace('Z', '+00:00'))
                age = datetime.now(timestamp.tzinfo) - timestamp
                
                if age.total_seconds() < 300:  # Less than 5 minutes
                    return {
                        'status': 'pass',
                        'value': f"Fresh analysis ({int(age.total_seconds())} seconds old)"
                    }
                elif age.total_seconds() < 3600:  # Less than 1 hour
                    return {
                        'status': 'warning',
                        'message': f"Analysis {int(age.total_seconds()/60)} minutes old"
                    }
                else:
                    return {
                        'status': 'fail',
                        'message': f"Stale analysis ({int(age.total_seconds()/3600)} hours old)"
                    }
            except:
                pass
        
        return {
            'status': 'warning',
            'message': 'No timestamp found'
        }
    
    def save_results(self):
        """Save validation results"""
        output_file = self.observer_dir / 'validation_results.json'
        with open(output_file, 'w') as f:
            json.dump(self.validation_results, f, indent=2)
    
    def print_summary(self):
        """Print validation summary"""
        summary = self.validation_results['summary']
        
        print("\n" + "=" * 50)
        print("📊 VALIDATION SUMMARY")
        print("=" * 50)
        
        # Calculate confidence
        if summary['total_checks'] > 0:
            confidence = (summary['passed'] / summary['total_checks']) * 100
        else:
            confidence = 0
        
        print(f"✅ Passed: {summary['passed']}/{summary['total_checks']}")
        print(f"⚠️  Warnings: {summary['warnings']}")
        print(f"❌ Failed: {summary['failed']}")
        print(f"🎯 Confidence Level: {confidence:.1f}%")
        
        if confidence >= 80:
            print("\n✨ Data integrity is GOOD - safe to proceed")
        elif confidence >= 60:
            print("\n⚠️  Data integrity is FAIR - review warnings")
        else:
            print("\n❌ Data integrity is POOR - fix failures before proceeding")
        
        print(f"\n📁 Full results saved to: {self.observer_dir}/validation_results.json")


def main():
    validator = DataValidator()
    validator.validate()


if __name__ == '__main__':
    main()