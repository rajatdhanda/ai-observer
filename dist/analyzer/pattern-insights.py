#!/usr/bin/env python3
"""
AI Pattern Insights Analyzer
Analyzes issues to find patterns and generate intelligent insights
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
import re

def analyze_patterns(fixes_data):
    """Analyze issues to find patterns and generate insights"""
    
    insights = {
        "patterns": [],
        "hotspots": [],
        "recommendations": [],
        "summary": {}
    }
    
    # Check both old and new formats
    if fixes_data.get("issue_buckets"):
        # New format: issue_buckets at root level
        buckets = fixes_data["issue_buckets"]
    elif fixes_data.get("analysis") and fixes_data["analysis"].get("issue_buckets"):
        # Old format: issue_buckets under analysis
        buckets = fixes_data["analysis"]["issue_buckets"]
    else:
        return insights
    
    # Collect all issues
    all_issues = []
    for bucket in buckets:
        all_issues.extend(bucket.get("issues", []))
    
    if not all_issues:
        return insights
    
    total_issues = len(all_issues)
    
    # 1. Analyze file path patterns
    path_patterns = defaultdict(list)
    file_counts = Counter()
    
    for issue in all_issues:
        file_path = issue.get("file", "")
        file_counts[file_path] += 1
        
        # Categorize by path patterns
        if "/admin/" in file_path or "admin" in file_path.lower():
            path_patterns["admin"].append(issue)
        if "hook" in file_path.lower() or "/hooks/" in file_path:
            path_patterns["hooks"].append(issue)
        if "component" in file_path.lower() or "/components/" in file_path:
            path_patterns["components"].append(issue)
        if "/api/" in file_path:
            path_patterns["api"].append(issue)
        if "page.tsx" in file_path or "page.ts" in file_path:
            path_patterns["pages"].append(issue)
        if "db" in file_path.lower() or "database" in file_path.lower() or "prisma" in file_path.lower():
            path_patterns["database"].append(issue)
        if "auth" in file_path.lower():
            path_patterns["authentication"].append(issue)
    
    # 2. Analyze issue types
    issue_types = defaultdict(int)
    for issue in all_issues:
        message = issue.get("message", "").lower()
        
        # Categorize by message patterns
        if "onclick" in message or "button" in message or "handler" in message:
            issue_types["missing_handlers"] += 1
        if "loading" in message or "isloading" in message:
            issue_types["loading_states"] += 1
        if "error" in message and "handling" in message:
            issue_types["error_handling"] += 1
        if "type" in message or "typescript" in message or "any" in message:
            issue_types["type_issues"] += 1
        if "unused" in message or "never used" in message:
            issue_types["unused_code"] += 1
        if "undefined" in message or "null" in message:
            issue_types["null_checks"] += 1
        if "async" in message or "await" in message or "promise" in message:
            issue_types["async_issues"] += 1
    
    # 3. Generate pattern insights
    for pattern_name, issues in path_patterns.items():
        percentage = (len(issues) / total_issues) * 100
        if percentage >= 20:  # Significant if 20% or more
            emoji = {
                "admin": "👤",
                "hooks": "🔄", 
                "components": "🧩",
                "api": "🌐",
                "pages": "📄",
                "database": "💾",
                "authentication": "🔐"
            }.get(pattern_name, "📍")
            
            insights["patterns"].append(
                f"{emoji} {pattern_name.capitalize()} area has {len(issues)} issues ({percentage:.0f}% of total)"
            )
    
    # 4. Find hotspot files (top problematic files)
    top_files = file_counts.most_common(5)
    for file_path, count in top_files:
        if count >= 3:  # Only show files with 3+ issues
            file_name = Path(file_path).name
            insights["hotspots"].append(f"{file_path} ({count} issues)")
    
    # 5. Generate issue type insights
    for issue_type, count in issue_types.items():
        percentage = (count / total_issues) * 100
        if percentage >= 15:  # Significant if 15% or more
            type_descriptions = {
                "missing_handlers": "Missing onClick/event handlers",
                "loading_states": "Missing or incorrect loading states",
                "error_handling": "Inadequate error handling",
                "type_issues": "TypeScript type issues",
                "unused_code": "Unused variables or imports",
                "null_checks": "Missing null/undefined checks",
                "async_issues": "Async/await problems"
            }
            desc = type_descriptions.get(issue_type, issue_type.replace("_", " ").title())
            insights["patterns"].append(f"⚠️ {desc}: {count} occurrences ({percentage:.0f}%)")
    
    # 6. Generate smart recommendations based on patterns
    if path_patterns["admin"] and len(path_patterns["admin"]) >= total_issues * 0.3:
        insights["recommendations"].append("Consider refactoring admin components - they contain 30%+ of all issues")
    
    if issue_types["missing_handlers"] >= total_issues * 0.2:
        insights["recommendations"].append("Implement a shared button component with proper handler validation")
    
    if issue_types["error_handling"] >= total_issues * 0.15:
        insights["recommendations"].append("Add error boundaries and standardize error handling patterns")
    
    if path_patterns["hooks"] and len(path_patterns["hooks"]) >= total_issues * 0.25:
        insights["recommendations"].append("Review and standardize React hooks implementation")
    
    if issue_types["loading_states"] >= total_issues * 0.15:
        insights["recommendations"].append("Create a consistent loading state management strategy")
    
    if len(top_files) > 0 and top_files[0][1] >= total_issues * 0.1:
        insights["recommendations"].append(f"Priority: Fix {Path(top_files[0][0]).name} first - it has {top_files[0][1]} issues")
    
    # 7. Add summary statistics
    insights["summary"] = {
        "total_files_affected": len(file_counts),
        "average_issues_per_file": round(total_issues / len(file_counts), 1) if file_counts else 0,
        "most_common_issue_type": max(issue_types.items(), key=lambda x: x[1])[0] if issue_types else "unknown"
    }
    
    # Limit insights to most important ones
    insights["patterns"] = insights["patterns"][:5]
    insights["hotspots"] = insights["hotspots"][:3]
    insights["recommendations"] = insights["recommendations"][:4]
    
    return insights

def main():
    """Main function to read fixes.json and add insights"""
    try:
        # Read from stdin (piped from TypeScript)
        input_data = sys.stdin.read()
        if input_data:
            fixes_data = json.loads(input_data)
        else:
            # Fallback: try to read from file
            fixes_path = Path("src/contracts/fixes.json")
            if not fixes_path.exists():
                fixes_path = Path(".observer/FIX_THIS.json")
            
            with open(fixes_path, 'r') as f:
                fixes_data = json.load(f)
        
        # Generate insights
        insights = analyze_patterns(fixes_data)
        
        # Add insights to the data
        fixes_data["ai_insights"] = insights
        
        # Output the enhanced data
        print(json.dumps(fixes_data, indent=2))
        
    except Exception as e:
        # On error, return original data or empty insights
        error_output = {
            "ai_insights": {
                "patterns": [],
                "hotspots": [],
                "recommendations": [f"Analysis error: {str(e)}"],
                "summary": {}
            }
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()