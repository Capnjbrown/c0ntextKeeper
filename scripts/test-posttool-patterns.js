#!/usr/bin/env node
/**
 * Test script for enhanced MCP tool patterns in posttool.ts
 */

const { spawn } = require('child_process');
const path = require('path');

// Test cases for different tool patterns
const testCases = [
  {
    name: "MCP filesystem read",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "mcp__filesystem__read_text_file",
      input: { path: "/test/file.txt" },
      result: { success: true, content: "file content" },
      timestamp: new Date().toISOString()
    },
    expected: "MCP filesystem: read text file on /test/file.txt - success"
  },
  {
    name: "MCP sequential-thinking",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "mcp__sequential-thinking__sequentialthinking",
      input: { thoughtNumber: 3, totalThoughts: 5 },
      result: { success: true },
      timestamp: new Date().toISOString()
    },
    expected: "MCP sequential-thinking: sequentialthinking - thought 3 of 5"
  },
  {
    name: "MCP GitHub search",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "mcp__github-mcp__search_repositories",
      input: { query: "MCP server" },
      result: { success: true, repositories: [] },
      timestamp: new Date().toISOString()
    },
    expected: "MCP github-mcp: search repositories - success"
  },
  {
    name: "Standard Write tool",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "Write",
      input: { file_path: "/src/test.ts" },
      result: { success: true },
      timestamp: new Date().toISOString()
    },
    expected: "Write: /src/test.ts - modified"
  },
  {
    name: "Bash command with exit code",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "Bash",
      input: { command: "npm test" },
      result: { exit_code: 0 },
      timestamp: new Date().toISOString()
    },
    expected: "Bash: npm - success"
  },
  {
    name: "TodoWrite tool",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "TodoWrite",
      input: { todos: [{}, {}, {}] },
      result: { success: true },
      timestamp: new Date().toISOString()
    },
    expected: "TodoWrite: 3 todos - updated"
  },
  {
    name: "WebSearch tool",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "WebSearch",
      input: { query: "TypeScript best practices" },
      result: { success: true },
      timestamp: new Date().toISOString()
    },
    expected: "WebSearch: \"TypeScript best practices\" - success"
  },
  {
    name: "Failed operation",
    input: {
      hook_event_name: "PostToolUse",
      session_id: "test-session",
      tool: "Edit",
      input: { file_path: "/src/missing.ts" },
      result: { error: "File not found" },
      timestamp: new Date().toISOString()
    },
    expected: "Edit: /src/missing.ts - failed"
  }
];

console.log('Testing enhanced MCP tool patterns...\n');

// Function to run a test case
function runTest(testCase) {
  return new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'posttool.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        const success = result.stats && result.stats.pattern.includes(testCase.expected.substring(0, 30));
        
        console.log(`Test: ${testCase.name}`);
        console.log(`  Input tool: ${testCase.input.tool}`);
        console.log(`  Expected pattern: ${testCase.expected}`);
        console.log(`  Actual pattern: ${result.stats?.pattern || 'N/A'}`);
        console.log(`  Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
        console.log();
        
        resolve(success);
      } catch (e) {
        console.log(`Test: ${testCase.name}`);
        console.log(`  Error: Failed to parse output`);
        console.log(`  Output: ${output}`);
        console.log(`  Error: ${error}`);
        console.log(`  Result: ❌ FAIL`);
        console.log();
        
        resolve(false);
      }
    });
    
    // Send test input
    child.stdin.write(JSON.stringify(testCase.input));
    child.stdin.end();
  });
}

// Run all tests
async function runAllTests() {
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} total`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
  }
}

// Check if hook is compiled
const fs = require('fs');
const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'posttool.js');

if (!fs.existsSync(hookPath)) {
  console.log('Hook not compiled. Running build first...');
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

// Run tests
runAllTests().catch(console.error);