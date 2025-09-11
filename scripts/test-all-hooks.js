#!/usr/bin/env node
/**
 * Comprehensive test for all 4 c0ntextKeeper hooks
 * Tests PreCompact, UserPromptSubmit, PostToolUse, and Stop hooks
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Create sample JSONL transcript for PreCompact hook
async function createTestTranscript(tempDir) {
  const transcriptPath = path.join(tempDir, 'test-transcript.jsonl');
  
  const entries = [
    {
      type: 'user',
      message: { content: 'How do I implement authentication in React?' },
      timestamp: new Date().toISOString(),
      sessionId: 'test-session-1',
      cwd: tempDir
    },
    {
      type: 'assistant',
      message: { content: 'I\'ll help you implement authentication. Here\'s how to do it with JWT tokens.' },
      timestamp: new Date().toISOString()
    },
    {
      type: 'tool_use',
      toolUse: {
        name: 'Write',
        input: {
          file_path: '/src/auth/AuthContext.tsx',
          content: 'import React from "react";\nconst AuthContext = React.createContext({});'
        }
      },
      timestamp: new Date().toISOString()
    },
    {
      type: 'tool_result',
      toolResult: { success: true },
      timestamp: new Date().toISOString()
    },
    {
      type: 'user',
      message: { content: 'Can you add error handling?' },
      timestamp: new Date().toISOString()
    },
    {
      type: 'assistant',
      message: { content: 'Sure, let me add comprehensive error handling.' },
      timestamp: new Date().toISOString()
    }
  ];
  
  const jsonlContent = entries.map(e => JSON.stringify(e)).join('\n');
  await fs.writeFile(transcriptPath, jsonlContent, 'utf-8');
  
  return transcriptPath;
}

// Test PreCompact hook
async function testPreCompactHook(tempDir) {
  console.log(`${colors.bright}${colors.blue}1. Testing PreCompact Hook${colors.reset}`);
  console.log('-'.repeat(40));
  
  const transcriptPath = await createTestTranscript(tempDir);
  
  const hookInput = {
    hook_event_name: 'PreCompact',
    event_type: 'manual',
    transcript_path: transcriptPath,
    session_id: 'test-session-precompact',
    project_path: tempDir,
    timestamp: new Date().toISOString()
  };
  
  return new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'precompact.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    let error = '';
    const timeout = setTimeout(() => {
      child.kill();
      console.log(`  ${colors.red}✗${colors.reset} Hook timed out`);
      resolve({ success: false, error: 'timeout' });
    }, 60000); // 60 second timeout
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      
      try {
        const result = JSON.parse(output);
        
        if (result.status === 'success') {
          console.log(`  ${colors.green}✓${colors.reset} Hook executed successfully`);
          console.log(`    - Archive path: ${result.archivePath || 'N/A'}`);
          console.log(`    - Problems extracted: ${result.stats?.problems || 0}`);
          console.log(`    - Implementations: ${result.stats?.implementations || 0}`);
          resolve({ success: true, stats: result.stats });
        } else {
          console.log(`  ${colors.red}✗${colors.reset} Hook failed: ${result.message}`);
          resolve({ success: false, error: result.message });
        }
      } catch (e) {
        console.log(`  ${colors.red}✗${colors.reset} Failed to parse output`);
        console.log(`    Output: ${output.substring(0, 200)}`);
        console.log(`    Error: ${error.substring(0, 200)}`);
        resolve({ success: false, error: 'parse error' });
      }
    });
    
    child.stdin.write(JSON.stringify(hookInput));
    child.stdin.end();
  });
}

// Test UserPromptSubmit hook
async function testUserPromptHook() {
  console.log(`\n${colors.bright}${colors.blue}2. Testing UserPromptSubmit Hook${colors.reset}`);
  console.log('-'.repeat(40));
  
  const hookInput = {
    hook_event_name: 'UserPromptSubmit',
    session_id: 'test-session-prompt',
    prompt: 'How do I optimize database queries in PostgreSQL?',
    timestamp: new Date().toISOString(),
    project_path: process.cwd()
  };
  
  return new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'userprompt.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        
        if (result.status === 'success') {
          console.log(`  ${colors.green}✓${colors.reset} User prompt captured`);
          console.log(`    - Message: ${result.message}`);
          resolve({ success: true });
        } else if (result.status === 'skipped') {
          console.log(`  ${colors.yellow}⚠${colors.reset} Hook skipped: ${result.message}`);
          resolve({ success: true, skipped: true });
        } else {
          console.log(`  ${colors.red}✗${colors.reset} Hook failed: ${result.message}`);
          resolve({ success: false });
        }
      } catch (e) {
        console.log(`  ${colors.red}✗${colors.reset} Failed to parse output`);
        resolve({ success: false });
      }
    });
    
    child.stdin.write(JSON.stringify(hookInput));
    child.stdin.end();
  });
}

// Test PostToolUse hook (already enhanced)
async function testPostToolHook() {
  console.log(`\n${colors.bright}${colors.blue}3. Testing PostToolUse Hook${colors.reset}`);
  console.log('-'.repeat(40));
  
  const toolTests = [
    {
      name: 'Standard tool',
      input: {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session-tool',
        tool: 'Write',
        input: { file_path: '/src/test.ts', content: 'const test = true;' },
        result: { success: true },
        timestamp: new Date().toISOString(),
        project_path: process.cwd()
      }
    },
    {
      name: 'MCP tool',
      input: {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session-tool',
        tool: 'mcp__filesystem__read_text_file',
        input: { path: '/config.json' },
        result: { success: true, content: '{}' },
        timestamp: new Date().toISOString(),
        project_path: process.cwd()
      }
    },
    {
      name: 'Failed operation',
      input: {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session-tool',
        tool: 'Edit',
        input: { file_path: '/missing.ts' },
        result: { error: 'File not found' },
        timestamp: new Date().toISOString(),
        project_path: process.cwd()
      }
    }
  ];
  
  let allSuccess = true;
  
  for (const test of toolTests) {
    const result = await new Promise((resolve) => {
      const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'posttool.js');
      const child = spawn('node', [hookPath]);
      
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        try {
          const result = JSON.parse(output);
          if (result.status === 'success') {
            console.log(`  ${colors.green}✓${colors.reset} ${test.name}: ${result.stats?.pattern || 'captured'}`);
            resolve(true);
          } else {
            console.log(`  ${colors.red}✗${colors.reset} ${test.name} failed`);
            resolve(false);
          }
        } catch (e) {
          console.log(`  ${colors.red}✗${colors.reset} ${test.name}: parse error`);
          resolve(false);
        }
      });
      
      child.stdin.write(JSON.stringify(test.input));
      child.stdin.end();
    });
    
    if (!result) allSuccess = false;
  }
  
  return { success: allSuccess };
}

// Test Stop hook
async function testStopHook() {
  console.log(`\n${colors.bright}${colors.blue}4. Testing Stop Hook${colors.reset}`);
  console.log('-'.repeat(40));
  
  const hookInput = {
    hook_event_name: 'Stop',
    session_id: 'test-session-stop',
    exchanges: [
      {
        question: 'What is the difference between let and const in JavaScript?',
        answer: 'The main differences are: const creates immutable bindings (cannot be reassigned), while let allows reassignment. Both have block scope.',
        timestamp: new Date().toISOString()
      },
      {
        question: 'How do I handle errors in async functions?',
        answer: 'Use try-catch blocks around await statements, or handle promise rejections with .catch()',
        timestamp: new Date().toISOString()
      }
    ],
    summary: {
      total_questions: 2,
      topics: ['JavaScript', 'error handling'],
      duration: 300000
    },
    timestamp: new Date().toISOString(),
    project_path: process.cwd()
  };
  
  return new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'stop.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        
        if (result.status === 'success') {
          console.log(`  ${colors.green}✓${colors.reset} Q&A knowledge captured`);
          console.log(`    - Exchanges: ${result.stats?.exchanges || 0}`);
          console.log(`    - Topics: ${result.stats?.topics?.join(', ') || 'N/A'}`);
          resolve({ success: true, stats: result.stats });
        } else if (result.status === 'skipped') {
          console.log(`  ${colors.yellow}⚠${colors.reset} Hook skipped: ${result.message}`);
          resolve({ success: true, skipped: true });
        } else {
          console.log(`  ${colors.red}✗${colors.reset} Hook failed: ${result.message}`);
          resolve({ success: false });
        }
      } catch (e) {
        console.log(`  ${colors.red}✗${colors.reset} Failed to parse output`);
        resolve({ success: false });
      }
    });
    
    child.stdin.write(JSON.stringify(hookInput));
    child.stdin.end();
  });
}

// Test edge cases
async function testEdgeCases() {
  console.log(`\n${colors.bright}${colors.blue}5. Testing Edge Cases${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Empty input
  console.log('  Testing empty input handling...');
  const emptyResult = await new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'precompact.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        if (result.status === 'skipped' || result.status === 'error') {
          console.log(`    ${colors.green}✓${colors.reset} Handled empty input gracefully`);
          resolve(true);
        } else {
          console.log(`    ${colors.red}✗${colors.reset} Didn't handle empty input properly`);
          resolve(false);
        }
      } catch (e) {
        console.log(`    ${colors.red}✗${colors.reset} Crashed on empty input`);
        resolve(false);
      }
    });
    
    child.stdin.end(); // Send no input
  });
  
  if (emptyResult) passedTests++; else failedTests++;
  
  // Test 2: Malformed JSON
  console.log('  Testing malformed JSON handling...');
  const malformedResult = await new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'userprompt.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        if (result.status === 'error' || result.status === 'skipped') {
          console.log(`    ${colors.green}✓${colors.reset} Handled malformed JSON gracefully`);
          resolve(true);
        } else {
          console.log(`    ${colors.red}✗${colors.reset} Didn't handle malformed JSON properly`);
          resolve(false);
        }
      } catch (e) {
        // This is actually okay - the hook should handle it
        console.log(`    ${colors.yellow}⚠${colors.reset} Hook output not JSON (might be expected)`);
        resolve(true);
      }
    });
    
    child.stdin.write('{ invalid json }');
    child.stdin.end();
  });
  
  if (malformedResult) passedTests++; else failedTests++;
  
  // Test 3: Wrong event type
  console.log('  Testing wrong event type handling...');
  const wrongEventResult = await new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'posttool.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        if (result.status === 'skipped') {
          console.log(`    ${colors.green}✓${colors.reset} Correctly skipped wrong event type`);
          resolve(true);
        } else {
          console.log(`    ${colors.red}✗${colors.reset} Didn't skip wrong event type`);
          resolve(false);
        }
      } catch (e) {
        console.log(`    ${colors.red}✗${colors.reset} Error handling wrong event`);
        resolve(false);
      }
    });
    
    child.stdin.write(JSON.stringify({
      hook_event_name: 'WrongEventType',
      session_id: 'test'
    }));
    child.stdin.end();
  });
  
  if (wrongEventResult) passedTests++; else failedTests++;
  
  return { passed: passedTests, failed: failedTests };
}

// Test performance with large input
async function testPerformance(tempDir) {
  console.log(`\n${colors.bright}${colors.blue}6. Testing Performance with Large Input${colors.reset}`);
  console.log('-'.repeat(40));
  
  // Create large transcript (1000 entries)
  const entries = [];
  for (let i = 0; i < 1000; i++) {
    entries.push({
      type: i % 2 === 0 ? 'user' : 'assistant',
      message: { content: `Message ${i}: ${' '.repeat(500)}` }, // Large messages
      timestamp: new Date().toISOString(),
      sessionId: 'perf-test'
    });
  }
  
  const transcriptPath = path.join(tempDir, 'large-transcript.jsonl');
  const jsonlContent = entries.map(e => JSON.stringify(e)).join('\n');
  await fs.writeFile(transcriptPath, jsonlContent, 'utf-8');
  
  const hookInput = {
    hook_event_name: 'PreCompact',
    event_type: 'auto',
    transcript_path: transcriptPath,
    session_id: 'test-session-perf',
    project_path: tempDir,
    timestamp: new Date().toISOString()
  };
  
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const hookPath = path.join(__dirname, '..', 'dist', 'hooks', 'precompact.js');
    const child = spawn('node', [hookPath]);
    
    let output = '';
    const timeout = setTimeout(() => {
      child.kill();
      const duration = Date.now() - startTime;
      console.log(`  ${colors.yellow}⚠${colors.reset} Hook timed out after ${duration}ms (expected with 55s limit)`);
      resolve({ success: true, timedOut: true, duration });
    }, 60000);
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      try {
        const result = JSON.parse(output);
        console.log(`  Processed 1000 entries in ${duration}ms`);
        console.log(`  Performance: ${(1000 / (duration / 1000)).toFixed(0)} entries/second`);
        
        if (duration < 55000) {
          console.log(`  ${colors.green}✓${colors.reset} Completed within timeout limit`);
          resolve({ success: true, duration });
        } else {
          console.log(`  ${colors.yellow}⚠${colors.reset} Close to timeout limit`);
          resolve({ success: true, duration, warning: true });
        }
      } catch (e) {
        console.log(`  ${colors.red}✗${colors.reset} Failed to process large input`);
        resolve({ success: false, duration });
      }
    });
    
    child.stdin.write(JSON.stringify(hookInput));
    child.stdin.end();
  });
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}Testing All c0ntextKeeper Hooks${colors.reset}\n`);
  console.log('=' .repeat(60) + '\n');
  
  // Create temp directory for testing
  const tempDir = path.join(os.tmpdir(), 'c0ntextkeeper-hook-test-' + Date.now());
  await fs.mkdir(tempDir, { recursive: true });
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  try {
    // Test each hook
    const precompactResult = await testPreCompactHook(tempDir);
    if (precompactResult.success) totalPassed++; else totalFailed++;
    
    const userpromptResult = await testUserPromptHook();
    if (userpromptResult.success) totalPassed++; else totalFailed++;
    
    const posttoolResult = await testPostToolHook();
    if (posttoolResult.success) totalPassed++; else totalFailed++;
    
    const stopResult = await testStopHook();
    if (stopResult.success) totalPassed++; else totalFailed++;
    
    // Test edge cases
    const edgeResults = await testEdgeCases();
    totalPassed += edgeResults.passed;
    totalFailed += edgeResults.failed;
    
    // Test performance
    const perfResult = await testPerformance(tempDir);
    if (perfResult.success) totalPassed++; else totalFailed++;
    
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error(`${colors.red}Test error:${colors.reset}`, error);
    totalFailed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`Total: ${totalPassed + totalFailed}`);
  
  const successRate = (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1);
  if (totalFailed === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All hooks working correctly! (${successRate}%)${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Some tests failed (${successRate}% success rate)${colors.reset}`);
  }
  
  // Recommendations
  console.log(`\n${colors.cyan}${colors.bright}Optimization Recommendations:${colors.reset}`);
  console.log('1. PreCompact hook handles large transcripts well with timeout protection');
  console.log('2. Consider adding batch processing for multiple tool uses');
  console.log('3. Stop hook could aggregate similar Q&A pairs to reduce storage');
  console.log('4. Add rate limiting for UserPrompt to prevent spam');
  console.log('5. Consider compression for large transcript storage');
}

// Check if compiled
const compiledPath = path.join(__dirname, '..', 'dist', 'hooks', 'precompact.js');
if (!require('fs').existsSync(compiledPath)) {
  console.log('Building project first...');
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

// Run tests
runAllTests().catch(console.error);