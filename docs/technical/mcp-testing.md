# MCP Server Testing Documentation

## Overview

This document provides comprehensive testing procedures for all MCP servers configured in the c0ntextKeeper project. Use these commands to verify server connectivity, test functionality, and troubleshoot issues.

## Test Status Summary

| Server | Last Tested | Status | Version |
|--------|------------|--------|---------|
| filesystem | 2025-09-09 | ✅ Operational | @modelcontextprotocol/server-filesystem |
| sequential-thinking | 2025-09-09 | ✅ Operational | @modelcontextprotocol/server-sequential-thinking |
| github-mcp | 2025-09-09 | ✅ Operational | @modelcontextprotocol/server-github |
| context7 | 2025-09-09 | ✅ Operational | @upstash/context7-mcp |
| fetch | 2025-09-09 | ✅ Operational | @kazuph/mcp-fetch |
| c0ntextKeeper | 2025-09-09 | ✅ v0.7.2 | Unified storage architecture |

## Quick Health Check

Run these commands immediately after starting Claude Code to verify all servers are connected:

```bash
# 1. Check MCP server connections
/mcp

# Expected output: List of all 5 servers with their status

# 2. Check overall Claude Code status
/status

# Expected output: System status showing all services operational
```

## Individual Server Tests

### 1. Filesystem Server Tests

#### Basic Connectivity Test
```typescript
// Test 1: List allowed directories
"Use mcp__filesystem__list_allowed_directories"
// Expected: Your project directory path

// Test 2: List project contents
"Use mcp__filesystem__list_directory to show current project directory"
// Expected: List of project files including .mcp.json, CLAUDE.md, etc.
```

#### Read Operations
```typescript
// Test 3: Read a file
"Use mcp__filesystem__read_text_file to read .mcp.json"
// Expected: JSON content with all 5 MCP server configurations

// Test 4: Get file info
"Use mcp__filesystem__get_file_info for README.md"
// Expected: File metadata including size, timestamps, permissions
```

#### Search Operations
```typescript
// Test 5: Search for files
"Use mcp__filesystem__search_files to find '*.md' in current project"
// Expected: List of all markdown files
```

#### Write Operations (Use with caution)
```typescript
// Test 6: Create a test file
"Use mcp__filesystem__write_file to create test.txt with content 'MCP test successful'"

// Test 7: Edit the test file
"Use mcp__filesystem__edit_file to change 'successful' to 'complete' in test.txt"

// Test 8: Clean up
"Use mcp__filesystem__move_file to rename test.txt to test-backup.txt"
```

---

### 2. Sequential-Thinking Server Tests

#### Basic Reasoning Test
```typescript
// Test 1: Simple reasoning
"Use mcp__sequential-thinking__sequentialthinking with thought='Testing sequential thinking server', nextThoughtNeeded=false, thoughtNumber=1, totalThoughts=1"
// Expected: Completed thought processing

// Test 2: Multi-step reasoning
"Use sequential-thinking to plan how to implement a JSONL parser in 3 steps"
// Expected: 3-step plan with clear reasoning
```

#### Complex Problem Solving
```typescript
// Test 3: Architecture design
"Use sequential-thinking to design a context extraction pipeline for c0ntextKeeper"
// Expected: Multi-step architectural plan

// Test 4: Debugging assistance
"Use sequential-thinking to analyze why MCP servers might not be connecting"
// Expected: Systematic debugging approach
```

---

### 3. GitHub-MCP Server Tests

#### Search Operations
```typescript
// Test 1: Repository search
"Use mcp__github-mcp__search_repositories with query='MCP server language:TypeScript', perPage=5"
// Expected: List of MCP-related TypeScript repositories

// Test 2: Code search
"Use mcp__github-mcp__search_code with q='preCompact hook Claude'"
// Expected: Code snippets related to Claude hooks

// Test 3: Issue search
"Use mcp__github-mcp__search_issues with q='MCP server implementation'"
// Expected: Related issues and discussions
```

#### Repository Operations
```typescript
// Test 4: Get file contents
"Use mcp__github-mcp__get_file_contents for modelcontextprotocol/servers README.md"
// Expected: README content from the official MCP servers repo

// Test 5: List commits
"Use mcp__github-mcp__list_commits for owner='modelcontextprotocol', repo='servers'"
// Expected: Recent commit history
```

---

### 4. Context7 Server Tests

#### Library Resolution
```typescript
// Test 1: Resolve TypeScript
"Use mcp__context7__resolve-library-id with libraryName='typescript'"
// Expected: List of TypeScript-related libraries with /microsoft/typescript as top result

// Test 2: Resolve Node.js
"Use mcp__context7__resolve-library-id with libraryName='node'"
// Expected: Node.js documentation sources

// Test 3: Resolve Jest
"Use mcp__context7__resolve-library-id with libraryName='jest'"
// Expected: Jest testing framework documentation
```

#### Documentation Retrieval
```typescript
// Test 4: Get TypeScript docs
"Use mcp__context7__get-library-docs with context7CompatibleLibraryID='/microsoft/typescript', topic='generics'"
// Expected: TypeScript generics documentation

// Test 5: Get MCP SDK docs
"First resolve 'model context protocol' then get server implementation docs"
// Expected: MCP SDK documentation for server creation
```

---

### 5. Fetch Server Tests

#### Basic Web Fetching
```typescript
// Test 1: Fetch MCP documentation
"Use mcp__fetch__imageFetch with url='https://modelcontextprotocol.io', maxLength=1000"
// Expected: First 1000 characters of MCP website

// Test 2: Fetch with specific content
"Use fetch to get TypeScript documentation from https://www.typescriptlang.org/docs/"
// Expected: TypeScript documentation content
```

#### Advanced Options
```typescript
// Test 3: Fetch with pagination
"Use fetch with url='https://modelcontextprotocol.io', startIndex=1000, maxLength=500"
// Expected: Characters 1000-1500 from the page

// Test 4: Raw content fetch
"Use fetch with url='https://example.com', raw=true"
// Expected: Raw HTML instead of markdown
```

---

### 6. c0ntextKeeper Server Tests (v0.7.2)

#### Auto-Load Resource Tests (New in v0.7.2)
```typescript
// Test 1: List available resources
"List MCP resources for c0ntextkeeper"
// Expected: Shows context://project/{name}/current and other resources

// Test 2: Read auto-loaded context
"Read resource context://project/c0ntextKeeper/current"
// Expected: Auto-loaded context with recent sessions, patterns, and knowledge

// Test 3: Test context configuration
c0ntextkeeper context preview
// Expected: Preview of what will be auto-loaded

// Test 4: Test loading strategies
c0ntextkeeper context test
// Expected: Results from different loading strategies
```

#### Context Retrieval Tools
```typescript
// Test 1: Fetch relevant context
"Use mcp__c0ntextkeeper__fetch_context with query='authentication implementation'"
// Expected: Relevant archived context about authentication

// Test 2: Search archives
"Use mcp__c0ntextkeeper__search_archive with query='database configuration'"
// Expected: Search results from all archived sessions

// Test 3: Get patterns
"Use mcp__c0ntextkeeper__get_patterns"
// Expected: Recurring patterns and common solutions
```

#### Storage Configuration Test
```bash
# Test storage status
c0ntextkeeper status

# Expected output shows:
# - Storage location (global or local)
# - Automation status
# - Hook configurations
# - Archive statistics
```

#### Hook Testing
```bash
# Test individual hooks
c0ntextkeeper hooks test precompact
c0ntextkeeper hooks test userprompt
c0ntextkeeper hooks test posttool
c0ntextkeeper hooks test stop

# View hook statistics
c0ntextkeeper hooks stats
```

---

## Integration Tests

### Cross-Server Workflow Test
```typescript
// Step 1: Plan with sequential-thinking
"Use sequential-thinking to plan how to research MCP server implementations"

// Step 2: Search with github-mcp
"Use github-mcp to search for 'MCP server TypeScript' repositories"

// Step 3: Get docs with context7
"Use context7 to get TypeScript async/await documentation"

// Step 4: Read local files with filesystem
"Use filesystem to read the current .mcp.json configuration"

// Step 5: Fetch external resource
"Use fetch to get the latest MCP protocol specification"
```

---

## Performance Tests

### Response Time Checks
```typescript
// Test each server's response time
1. "Time how long filesystem takes to list directory"
2. "Time sequential-thinking for a simple thought"
3. "Time github-mcp repository search"
4. "Time context7 library resolution"
5. "Time fetch for a small webpage"

// Expected: All responses under 5 seconds for basic operations
```

### Load Tests
```typescript
// Test handling multiple requests
1. "Use filesystem to read 5 files simultaneously"
2. "Use github-mcp to search 3 different queries"
3. "Use context7 to resolve multiple libraries"

// Expected: All operations complete without errors
```

---

## Troubleshooting Tests

### Connection Issues
```bash
# If servers not showing in /mcp:

# 1. Check environment variable
echo $GITHUB_TOKEN
# Expected: Your GitHub token

# 2. Verify .mcp.json exists
ls -la .mcp.json
# Expected: File exists with correct permissions

# 3. Test with simple server
"Use mcp__filesystem__list_allowed_directories"
# If this fails, filesystem server not connected
```

### Permission Issues
```typescript
// Test filesystem boundaries
"Use filesystem to list parent directory"
// Expected: Error - outside allowed directory

"Use filesystem to list current project directory"
// Expected: Success - within allowed directory
```

### Token Issues
```typescript
// Test GitHub token
"Use github-mcp to search for any repository"
// If fails: Token issue
// If succeeds: Token is valid
```

---

## Periodic Testing Schedule

### Daily Tests (During Development)
- [ ] Run Quick Health Check
- [ ] Test one random server thoroughly
- [ ] Verify filesystem read/write operations

### Weekly Tests
- [ ] Complete Individual Server Tests for all servers
- [ ] Run Integration Tests
- [ ] Check for server updates

### Before Major Changes
- [ ] Full test suite for all servers
- [ ] Performance Tests
- [ ] Document any changes in behavior

---

## Test Automation Script

Create a test script for automated testing:

```bash
#!/bin/bash
# mcp-test.sh

echo "Testing MCP Servers for c0ntextKeeper"
echo "======================================"

# Start Claude Code and run tests
claude << 'EOF'
/mcp
/status
exit
EOF

echo "Basic connectivity test complete"
```

---

## Expected Test Outputs

### Successful /mcp Command
```
MCP Servers:
- filesystem: Connected ✓
- sequential-thinking: Connected ✓  
- github-mcp: Connected ✓
- context7: Connected ✓
- fetch: Connected ✓
```

### Successful Filesystem Test
```
Allowed directories:
[Your project path]
```

### Successful GitHub Search
```
Found 3 repositories:
1. modelcontextprotocol/servers
2. [other MCP-related repos]
```

---

## Reporting Issues

When reporting MCP server issues, include:

1. Output of `/mcp` command
2. Output of `/status` command
3. Specific test command that failed
4. Error message received
5. Contents of `.mcp.json`
6. Whether `$GITHUB_TOKEN` is set

---

## Notes

- All tests performed in your project directory
- Filesystem server restricted to project directory only
- GitHub token required for github-mcp server
- Some operations may have rate limits
- Always clean up test files after testing

## Related Documentation

- [MCP Usage Guide](./mcp-usage.md) - Detailed usage guide
- [CLAUDE.md](../../CLAUDE.md) - Project context and architecture
- [README.md](../../README.md) - Quick start guide