#!/bin/bash

echo "🔍 c0ntextKeeper Public Repository Readiness Check"
echo "=================================================="

ISSUES=0
WARNINGS=0

echo ""
echo "Checking required files..."

# Check for required files
for file in README.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md .env.example .gitignore package.json; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    ((ISSUES++))
  fi
done

echo ""
echo "Checking GitHub templates..."

# Check for GitHub templates
for file in .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md .github/PULL_REQUEST_TEMPLATE.md; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    ((ISSUES++))
  fi
done

echo ""
echo "Scanning for sensitive data..."

# Check for .env file in git (should not be tracked)
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo "❌ .env file is tracked in git - REMOVE FROM GIT IMMEDIATELY"
  ((ISSUES++))
else
  echo "✅ .env file not tracked in git (local .env is OK)"
fi

# Check for sensitive patterns (exclude security-filter.ts which contains detection regex patterns)
if grep -r "ghp_\|ghs_\|github_pat_" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=coverage --exclude="*.md" --exclude="security-filter.ts" --exclude="security-filter.test.ts" 2>/dev/null | grep -v ".env.example"; then
  echo "⚠️  Potential GitHub tokens found"
  ((WARNINGS++))
else
  echo "✅ No GitHub tokens found"
fi

if grep -r "sk-[a-zA-Z0-9]\{48\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude="*.md" 2>/dev/null; then
  echo "⚠️  Potential API keys found"
  ((WARNINGS++))
else
  echo "✅ No API keys found"
fi

# Check if .env is in .gitignore
if grep -q "^\.env$" .gitignore; then
  echo "✅ .env is in .gitignore"
else
  echo "❌ .env not in .gitignore"
  ((ISSUES++))
fi

echo ""
echo "Checking CI/CD..."

# Check for CI/CD
if [ -f ".github/workflows/ci.yml" ]; then
  echo "✅ CI workflow configured"
else
  echo "⚠️  No CI workflow found"
  ((WARNINGS++))
fi

echo ""
echo "Checking documentation..."

# Check README has key sections (modern README uses Quick Start instead of Installation)
if grep -q "## Quick Start" README.md && grep -q "## How It Works" README.md && grep -q "## Contributing" README.md; then
  echo "✅ README has essential sections"
else
  echo "⚠️  README missing essential sections (Quick Start, How It Works, Contributing)"
  ((WARNINGS++))
fi

# Check for npm package readiness
if [ -f "package.json" ]; then
  if grep -q '"name": "c0ntextkeeper"' package.json; then
    echo "✅ Package name configured"
  else
    echo "⚠️  Package name not set correctly"
    ((WARNINGS++))
  fi
  
  if grep -q '"repository"' package.json; then
    echo "✅ Repository field configured"
  else
    echo "⚠️  Repository field missing in package.json"
    ((WARNINGS++))
  fi
fi

echo ""
echo "Checking tests..."

# Check if tests exist and pass
if [ -d "tests" ] || [ -d "test" ] || [ -d "__tests__" ]; then
  echo "✅ Test directory exists"
  
  # Try to run tests
  if command -v npm &> /dev/null; then
    echo "Running tests..."
    if npm test -- --passWithNoTests 2>/dev/null; then
      echo "✅ Tests pass"
    else
      echo "⚠️  Tests fail or not configured"
      ((WARNINGS++))
    fi
  fi
else
  echo "⚠️  No test directory found"
  ((WARNINGS++))
fi

echo ""
echo "=================================================="
echo "Results: $ISSUES critical issues, $WARNINGS warnings"
echo ""

if [ $ISSUES -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo "🎉 c0ntextKeeper is ready for public release!"
  else
    echo "✅ c0ntextKeeper is ready, but review $WARNINGS warnings"
  fi
  exit 0
else
  echo "❌ Fix $ISSUES critical issues before going public"
  exit 1
fi