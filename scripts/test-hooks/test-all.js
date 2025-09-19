#!/usr/bin/env node
/**
 * Test all c0ntextKeeper hooks
 * Runs test scripts for each hook and reports results
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log("🧪 c0ntextKeeper Hook Test Suite\n");
console.log("=" . repeat(60));

// List of hooks to test
const hooks = [
  {
    name: 'UserPromptSubmit',
    script: 'test-userprompt.js',
    description: 'Captures user prompts and questions'
  },
  {
    name: 'PostToolUse',
    script: 'test-posttool.js',
    description: 'Captures tool usage patterns'
  },
  {
    name: 'Stop',
    script: 'test-stop.js',
    description: 'Captures Q&A exchanges'
  }
];

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Function to run a single test
function runTest(hook) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing ${hook.name} Hook`);
    console.log(`   ${hook.description}`);
    console.log("-".repeat(40));
    
    const scriptPath = path.join(__dirname, hook.script);
    
    if (!fs.existsSync(scriptPath)) {
      console.log(`   ❌ Test script not found: ${hook.script}`);
      testsFailed++;
      resolve(false);
      return;
    }
    
    const testProcess = spawn('node', [scriptPath], {
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      testsRun++;
      if (code === 0) {
        testsPassed++;
        console.log(`   ✅ ${hook.name} test passed`);
        resolve(true);
      } else {
        testsFailed++;
        console.log(`   ❌ ${hook.name} test failed with code ${code}`);
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      testsRun++;
      testsFailed++;
      console.log(`   ❌ ${hook.name} test error: ${error.message}`);
      resolve(false);
    });
  });
}

// Run all tests sequentially
async function runAllTests() {
  // Check if project is built
  const distPath = path.join(__dirname, '../../dist/hooks');
  if (!fs.existsSync(distPath)) {
    console.log("\n❌ Project not built!");
    console.log("\nPlease build the project first:");
    console.log("   npm run build");
    process.exit(1);
  }
  
  // Check debug mode
  if (process.env.C0NTEXTKEEPER_DEBUG === 'true') {
    console.log("\n🔍 Debug mode is ENABLED");
    console.log("   Debug logs will be written to ~/.c0ntextkeeper/debug/");
  } else {
    console.log("\n💡 Tip: Enable debug mode for detailed logs:");
    console.log("   export C0NTEXTKEEPER_DEBUG=true");
  }
  
  // Run each test
  for (const hook of hooks) {
    await runTest(hook);
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary\n");
  console.log(`   Total Tests: ${testsRun}`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  
  if (testsPassed === testsRun) {
    console.log("\n🎉 All tests passed!");
    console.log("\n✅ Next Steps:");
    console.log("   1. Enable hooks in Claude Code:");
    console.log("      c0ntextkeeper hooks enable all");
    console.log("   2. Restart Claude Code");
    console.log("   3. Use Claude Code normally");
    console.log("   4. Check health status:");
    console.log("      c0ntextkeeper hooks health");
  } else {
    console.log("\n⚠️  Some tests failed");
    console.log("\nTroubleshooting:");
    console.log("   1. Enable debug mode:");
    console.log("      export C0NTEXTKEEPER_DEBUG=true");
    console.log("   2. Run individual test scripts");
    console.log("   3. Check debug logs in ~/.c0ntextkeeper/debug/");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});