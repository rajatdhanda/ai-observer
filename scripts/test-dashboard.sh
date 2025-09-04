#!/bin/bash

echo "🔍 Testing Dashboard Tabs..."
echo "=========================="

# Test critical endpoints
endpoints=(
  "http://localhost:3001/api/smart-analysis:Smart Analysis"
  "http://localhost:3001/api/architecture-data:Architecture"
  "http://localhost:3001/api/validation-data:Validation"
  "http://localhost:3001/api/nine-rules:Nine Rules"
)

for endpoint_info in "${endpoints[@]}"; do
  url="${endpoint_info%%:*}"
  name="${endpoint_info##*:}"
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status" == "200" ]; then
    echo "✅ $name: Working (200)"
  else
    echo "❌ $name: Failed ($status)"
  fi
done

echo ""
echo "📊 Summary:"
echo "- Smart Analysis tab should work"
echo "- Architecture tab should work"
echo "- Other tabs may be empty if data missing"