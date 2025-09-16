#!/usr/bin/env node

/**
 * Test script for Stop hook
 * Tests with various input formats to debug why it's not capturing Q&A
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const stopHookPath = path.join(__dirname, '..', 'dist', 'hooks', 'stop.js');

// Test cases with different structures
const testCases = [
  {
    name: "Standard exchange format (expected)",
    input: {
      hook_event_name: "Stop",
      session_id: "test-session-001",
      exchange: {
        user_prompt: "How do I implement authentication in Node.js?",
        assistant_response: "To implement authentication in Node.js, you can use Passport.js or JWT tokens. Here's a basic example with JWT...",
        tools_used: ["Read", "Write", "Edit"],
        files_modified: ["auth.js", "middleware.js"]
      },
      timestamp: new Date().toISOString(),
      project_path: process.cwd()
    }
  },
  {
    name: "Flat structure (possible Claude format)",
    input: {
      hook_event_name: "Stop",
      session_id: "test-session-002",
      user_prompt: "What is the best way to handle errors in async functions?",
      assistant_response: "You should use try-catch blocks with async/await. Here's how to properly handle errors...",
      tools_used: ["Read"],
      files_modified: [],
      timestamp: new Date().toISOString(),
      project_path: process.cwd()
    }
  },
  {
    name: "SubagentStop event",
    input: {
      hook_event_name: "SubagentStop",
      session_id: "test-session-003",
      exchange: {
        user_prompt: "Debug the TypeScript compilation error",
        assistant_response: "I found the issue - there's a type mismatch in the interface. Fixed by updating the type definition...",
        tools_used: ["Edit", "Bash"],
        files_modified: ["types.ts"]
      },
      timestamp: new Date().toISOString(),
      project_path: process.cwd()
    }
  }
];

async function testStopHook(testCase) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('━'.repeat(50));

    // Check if compiled hook exists
    if (!fs.existsSync(stopHookPath)) {
      console.log('⚠️ Compiled hook not found. Running build...');
      const build = spawn('npm', ['run', 'build'], { cwd: path.join(__dirname, '..') });
      build.on('close', () => {
        runTest();
      });
    } else {
      runTest();
    }

    function runTest() {
      const hookProcess = spawn('node', [stopHookPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      hookProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      hookProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      hookProcess.on('close', (code) => {
        console.log(`📋 Input sent:`);
        console.log(JSON.stringify(testCase.input, null, 2).substring(0, 200) + '...');

        if (output) {
          console.log(`\n✅ Output:`);
          try {
            const parsed = JSON.parse(output);
            console.log(JSON.stringify(parsed, null, 2));
          } catch {
            console.log(output);
          }
        }

        if (errorOutput) {
          console.log(`\n❌ Errors:`);
          console.log(errorOutput);
        }

        console.log(`\n📊 Exit code: ${code}`);
        resolve();
      });

      // Send test input
      hookProcess.stdin.write(JSON.stringify(testCase.input));
      hookProcess.stdin.end();
    }
  });
}

async function runAllTests() {
  console.log('🚀 Testing Stop Hook with various input formats\n');

  // Check if debug log exists
  const debugLogPath = path.join(process.env.HOME, '.c0ntextkeeper', 'logs', 'stop-hook-debug.log');
  if (fs.existsSync(debugLogPath)) {
    console.log(`📝 Debug log will be written to: ${debugLogPath}`);
  }

  for (const testCase of testCases) {
    await testStopHook(testCase);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Check if any knowledge files were created
  const knowledgePath = path.join(
    process.env.HOME,
    '.c0ntextkeeper',
    'archive',
    'projects',
    'c0ntextKeeper',
    'knowledge'
  );

  console.log('\n📁 Checking knowledge folder:');
  if (fs.existsSync(knowledgePath)) {
    const files = fs.readdirSync(knowledgePath);
    const today = new Date().toISOString().split('T')[0];
    const todayFile = `${today}-knowledge.json`;

    if (files.includes(todayFile)) {
      console.log(`✅ Today's knowledge file found: ${todayFile}`);
      const content = fs.readFileSync(path.join(knowledgePath, todayFile), 'utf-8');
      const data = JSON.parse(content);
      console.log(`📊 Entries: ${data.length}`);
    } else {
      console.log(`❌ No knowledge file for today (${todayFile})`);
      console.log(`📂 Existing files: ${files.join(', ')}`);
    }
  } else {
    console.log('❌ Knowledge folder not found');
  }

  // Show debug log tail
  if (fs.existsSync(debugLogPath)) {
    console.log('\n📋 Last entries in debug log:');
    const debugContent = fs.readFileSync(debugLogPath, 'utf-8');
    const lines = debugContent.split('\n');
    const recentLines = lines.slice(-20).join('\n');
    console.log(recentLines);
  }

  console.log('\n✨ Testing complete!');
}

runAllTests().catch(console.error);