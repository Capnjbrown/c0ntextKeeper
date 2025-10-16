# c0ntextKeeper Real-World Usage Examples

## Table of Contents
- [Quick Start](#quick-start)
- [Common Scenarios](#common-scenarios)
  - [Debugging a Production Issue](#1-debugging-a-production-issue)
  - [Implementing a New Feature](#2-implementing-a-new-feature)
  - [Code Review Preparation](#3-code-review-preparation)
  - [Team Knowledge Sharing](#4-team-knowledge-sharing)
  - [Learning from Past Decisions](#5-learning-from-past-decisions)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)

## Quick Start

### Initial Setup
```bash
# Install c0ntextKeeper globally
npm install -g c0ntextkeeper

# Set up hooks for automatic context preservation
c0ntextkeeper setup

# Verify installation
c0ntextkeeper status
```

## Common Scenarios

### 1. Debugging a Production Issue

**Scenario**: You're debugging a critical production bug with Claude Code. The session involves exploring multiple files, testing hypotheses, and finding the root cause.

```bash
# Start your debugging session with Claude Code
# ... work on debugging the issue ...

# When you find the solution, preserve the context
/compact  # This triggers automatic archival

# Later, search for this debugging session
c0ntextkeeper search "production bug authentication"

# Preview the debugging context
c0ntextkeeper context preview

# Share the solution with your team
c0ntextkeeper search "authentication error" --limit 1 > bug-fix-notes.md
```

**Real Output Example**:
```
🔍 Searching for: "production bug authentication"

✅ Found 3 results:

Result 1:
  🆔 Session: 2025-09-24-auth-debug-session
  📁 Project: /Users/dev/projects/webapp
  📅 Date: Sept 24, 2025 3:45 PM
  📈 Relevance: 95%
  🎯 Matches:
    • Problem: Authentication token expiry not handled correctly
    • Solution: Implemented token refresh mechanism with retry logic
    • Decision: Use JWT with 15-minute expiry and silent refresh
```

### 2. Implementing a New Feature

**Scenario**: You're implementing a complex feature over multiple Claude Code sessions. You want to preserve the evolution of your implementation.

```bash
# Session 1: Initial architecture discussion
# ... discuss architecture with Claude Code ...
/compact  # Archive the architectural decisions

# Session 2: Implementation begins
# ... implement core functionality ...
/compact  # Archive the implementation progress

# Session 3: Testing and refinement
# ... write tests and refine ...
/compact  # Archive the final implementation

# View the feature's evolution
c0ntextkeeper patterns --type architecture --min 1

# Rebuild search index for faster access
c0ntextkeeper rebuild-index

# Generate feature documentation from context
c0ntextkeeper search "payment integration" --limit 5 > feature-docs.md
```

### 3. Code Review Preparation

**Scenario**: You need to review what changes were made during a long coding session before creating a PR.

```bash
# After a coding session, review all implementations
c0ntextkeeper search "" --limit 1  # Show most recent session

# Look for specific patterns used
c0ntextkeeper patterns --type code

# Check all architectural decisions made
c0ntextkeeper search "Decision:" --limit 10

# Preview the auto-loaded context for the next session
c0ntextkeeper context preview --verbose
```

### 4. Team Knowledge Sharing

**Scenario**: A new team member joins and needs to understand project-specific patterns and decisions.

```bash
# Show them the project statistics
c0ntextkeeper stats

# Display common patterns the team uses
c0ntextkeeper patterns --min 3

# Search for onboarding-related contexts
c0ntextkeeper search "setup development environment"

# Export recent architectural decisions
c0ntextkeeper search "architecture" > team-decisions.md

# Show them what context is auto-loaded
c0ntextkeeper context preview
```

**Example Output**:
```
📊 c0ntextKeeper Statistics
──────────────────────────────────────────────────

🏗️ Storage Overview:
  Total Projects: 5
  Total Sessions: 127
  Storage Size: 24.5 MB

📅 Timeline:
  Oldest Session: Aug 28, 2025
  Newest Session: Sept 24, 2025

💡 Insights:
  Average size per session: 198 KB
  Average sessions per project: 25

──────────────────────────────────────────────────
```

### 5. Learning from Past Decisions

**Scenario**: You encounter a problem similar to one you've solved before but can't remember the exact solution.

```bash
# Search for similar problems
c0ntextkeeper search "database connection timeout"

# Look for patterns in how you've handled similar issues
c0ntextkeeper patterns --type code | grep -i "retry"

# Check implementation history for a specific component
c0ntextkeeper search "Implementation: retry mechanism"

# View decisions made about error handling
c0ntextkeeper search "Decision: error handling strategy"
```

## Advanced Usage

### Building a Knowledge Graph

```bash
# Rebuild the search index after importing old sessions
c0ntextkeeper rebuild-index

# Analyze patterns across all projects
c0ntextkeeper patterns --type all --min 1 > patterns-analysis.json

# Search with specific project filters
c0ntextkeeper search "optimization" --project ~/projects/webapp

# Export contexts for external analysis
for session in $(c0ntextkeeper search "" --limit 100 | grep "Session:" | cut -d: -f2); do
  echo "Exporting $session..."
  # Process each session
done
```

### Automating Context Collection

```bash
# Enable all hooks for comprehensive tracking
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# Check hook health
c0ntextkeeper hooks health

# View hook statistics
c0ntextkeeper hooks stats
```

### Creating Project-Specific Workflows

```bash
# Initialize project-specific storage
cd ~/projects/my-app
c0ntextkeeper init --project-name "MyApp"

# Configure auto-load for this project
c0ntextkeeper context configure \
  --strategy smart \
  --max-size 100 \
  --session-count 3 \
  --pattern-count 10

# Test the configuration
c0ntextkeeper context test
```

## Best Practices

### 1. Regular Maintenance

```bash
# Weekly: Rebuild search index for optimal performance
c0ntextkeeper rebuild-index

# Monthly: Check storage statistics
c0ntextkeeper stats

# Quarterly: Clean up test sessions
c0ntextkeeper cleanup --dry-run
```

### 2. Effective Searching

```bash
# Use specific keywords
c0ntextkeeper search "TypeError useState"  # ✅ Specific
c0ntextkeeper search "error"               # ❌ Too generic

# Combine with grep for filtering
c0ntextkeeper search "Implementation" | grep -i "api"

# Use project filters for large codebases
c0ntextkeeper search "bug fix" --project ~/work/project-a
```

### 3. Context Preservation Strategy

```bash
# Before ending important sessions
/compact  # Always compact to preserve context

# For critical decisions
# Add explicit comments in your conversation
"DECISION: Using PostgreSQL for its JSONB support"

# For complex implementations
# Break into logical sessions and compact each
/compact  # After architecture discussion
/compact  # After implementation
/compact  # After testing
```

### 4. Team Collaboration

```bash
# Share specific solutions
c0ntextkeeper search "solution oauth" > solutions/oauth-fix.md

# Document patterns for the team
c0ntextkeeper patterns --type architecture > docs/architecture-patterns.md

# Create onboarding materials
c0ntextkeeper search "setup" > docs/dev-setup.md
```

## Integration Examples

### Git Hook Integration

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Archive current context before committing
c0ntextkeeper archive ~/.claude/compaction/latest.jsonl 2>/dev/null || true
```

### CI/CD Pipeline

```yaml
# .github/workflows/context.yml
name: Archive Context
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  archive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g c0ntextkeeper
      - run: c0ntextkeeper stats
      - run: c0ntextkeeper patterns --min 5
```

### VS Code Task

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Search Context",
      "type": "shell",
      "command": "c0ntextkeeper search \"${input:searchTerm}\"",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ],
  "inputs": [
    {
      "id": "searchTerm",
      "type": "promptString",
      "description": "Search archived contexts for:"
    }
  ]
}
```

## Testing & Diagnostics

### 1. Health Check Before Deployment

**Scenario**: Before deploying your project, you want to ensure c0ntextKeeper is working correctly.

```bash
# Run comprehensive health diagnostics
c0ntextkeeper doctor

# Example output:
# 🏥 c0ntextKeeper Health Check
# 
# 1️⃣ Checking Hook Configuration...
#   ✅ PreCompact hook configured
#   ℹ️  Optional hooks enabled: UserPromptSubmit, PostToolUse, Stop
# 
# 2️⃣ Verifying Storage Setup...
#   ✅ Global storage exists
#   ✅ Archive directory exists
# 
# 3️⃣ Validating Archive Integrity...
#   ✅ 59 sessions in 3 projects
#   ✅ Archive files validated
# 
# 📊 Diagnostic Summary
# ✅ Passed: 6
# 🎉 All systems operational!
```

### 2. Performance Validation

**Scenario**: You want to verify c0ntextKeeper meets performance targets.

```bash
# Run performance benchmark suite
c0ntextkeeper benchmark

# Real output from testing:
# ⚡ c0ntextKeeper Performance Benchmark
# 
# 1️⃣ Testing Transcript Parsing Speed...
#   ✅ Parsed 1000 lines in 6.37ms
#   Throughput: 156,886 lines/sec
# 
# 2️⃣ Testing Context Extraction Performance...
#   ✅ Extracted context in 2.35ms
# 
# 3️⃣ Testing Archive Storage Operations...
#   ✅ Write: 9.70ms
#   ✅ Read: 6.81ms
# 
# 4️⃣ Testing Search Query Performance...
#   ✅ Search completed in 9.76ms
# 
# 5️⃣ Testing Index Rebuild Performance...
#   ✅ Index rebuilt in 21.23ms
# 
# 📊 Performance Report
# ✅ Passed: 6/6
# 🎉 All performance targets met!
```

### 3. Troubleshooting Hook Data Capture

**Scenario**: You notice some context isn't being captured. Debug mode helps identify the issue.

```bash
# Enable debug mode with verbose logging
c0ntextkeeper debug --follow

# Stream logs in real-time
# 📡 Streaming logs (Ctrl+C to exit)...
# 
# [2025-10-06 14:32:15] [Hook] PreCompact triggered
# [2025-10-06 14:32:15] [Extractor] Processing 1234 transcript entries
# [2025-10-06 14:32:15] [Extractor] Found 5 problems, 3 solutions
# [2025-10-06 14:32:15] [Storage] Saved to ~/.c0ntextkeeper/archive/projects/myapp/

# View last 50 log entries
c0ntextkeeper debug --lines 50

# Filter by component
c0ntextkeeper debug --component Hook --severity error
```

### 4. Verifying Hook Configuration

**Scenario**: After initial setup, verify all hooks are working correctly.

```bash
# Test all hooks with sample data
c0ntextkeeper test-hook

# Example output:
# 🧪 c0ntextKeeper Hook Test Suite
# 
# 📋 Testing PreCompact Hook
# ✅ PreCompact test passed
# 
# 📋 Testing UserPromptSubmit Hook
# ✅ UserPromptSubmit test passed
# 
# 📋 Testing PostToolUse Hook
# ✅ PostToolUse test passed
# 
# 📋 Testing Stop Hook
# ✅ Stop test passed
# 
# 📊 Test Summary
# Total Tests: 4
# ✅ Passed: 4
# ❌ Failed: 0
# 🎉 All tests passed!

# Check hook health and statistics
c0ntextkeeper hooks health
c0ntextkeeper hooks stats
```

### 5. Testing MCP Tool Integration

**Scenario**: Verify MCP tools work correctly with natural language queries.

```bash
# Test all MCP tools
c0ntextkeeper test-mcp

# Example output:
# 🧪 Testing c0ntextKeeper MCP Tools with Natural Language
# 
# 1️⃣ Testing fetch_context with various queries...
#    📝 Test: Natural language - recent work
#    Query: "what have we been working on lately"
#    ✅ Found 3 contexts
#    📌 Result 1:
#       📊 Relevance: 95%
#       🆔 Session: session-20251006...
#       📁 Project: c0ntextKeeper
# 
# 2️⃣ Testing search_archive...
#    ✅ Search working correctly
# 
# 3️⃣ Testing get_patterns...
#    ✅ Pattern detection working
# 
# 📊 All MCP tools operational!

# Test specific tool with custom query
c0ntextkeeper test-mcp --tool fetch_context --query "authentication bug fixes"
```

### 6. Pre-Release Validation Workflow

**Scenario**: Complete validation before releasing a new version.

```bash
# Step 1: Run health check
c0ntextkeeper doctor

# Step 2: Verify performance
c0ntextkeeper benchmark

# Step 3: Test all hooks
c0ntextkeeper test-hook

# Step 4: Test MCP tools
c0ntextkeeper test-mcp

# Step 5: Validate installation
c0ntextkeeper validate

# Step 6: Check statistics
c0ntextkeeper stats

# If all pass: Ready for release!
```

## Troubleshooting Common Issues

### No Archives Found

```bash
# Check if hooks are enabled
c0ntextkeeper hooks list

# Verify hook health
c0ntextkeeper hooks health

# Test with manual archive
c0ntextkeeper archive ~/.claude/compaction/latest.jsonl

# Check storage location
c0ntextkeeper status
```

### Search Not Finding Results

```bash
# Rebuild the search index
c0ntextkeeper rebuild-index

# Use broader search terms
c0ntextkeeper search "auth"  # Instead of "authentication"

# Check if archives exist
c0ntextkeeper stats

# View recent archives without search
c0ntextkeeper search  # No query shows recent archives
```

### Performance Issues

```bash
# Check storage size
c0ntextkeeper stats

# Clean up old test sessions
c0ntextkeeper cleanup

# Rebuild index for better performance
c0ntextkeeper rebuild-index

# Limit search results
c0ntextkeeper search "bug" --limit 5
```

## Tips and Tricks

1. **Keyboard Shortcuts**: Add aliases to your shell configuration:
```bash
alias cks="c0ntextkeeper search"
alias ckp="c0ntextkeeper patterns"
alias ckstat="c0ntextkeeper stats"
```

2. **Quick Context Check**: Before starting work:
```bash
c0ntextkeeper context preview | head -20
```

3. **Pattern Discovery**: Find what you do most:
```bash
c0ntextkeeper patterns --min 5 --type command
```

4. **Session Comparison**: Compare two debugging sessions:
```bash
diff <(c0ntextkeeper search "bug fix 1") <(c0ntextkeeper search "bug fix 2")
```

5. **Context Export**: Create a knowledge base:
```bash
c0ntextkeeper search "" --limit 1000 | \
  jq -r '.context | {problems, implementations, decisions}' > knowledge-base.json
```

---

💡 **Remember**: c0ntextKeeper is most valuable when you use it consistently. The more context you preserve, the more valuable your archive becomes over time!