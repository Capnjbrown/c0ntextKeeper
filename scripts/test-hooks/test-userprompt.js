#!/usr/bin/env node
/**
 * Test script for UserPromptSubmit hook
 * Simulates user prompt events that Claude Code would send
 */

const { spawn } = require('child_process');
const path = require('path');

// Test data for UserPromptSubmit event
const testEvent = {
  hook_event_name: "UserPromptSubmit",
  session_id: "test-session-" + Date.now(),
  prompt: "How can I optimize the performance of my React application? I'm experiencing slow rendering on large lists and want to implement proper memoization strategies.",
  timestamp: new Date().toISOString(),
  project_path: process.cwd()
};

console.log("🧪 Testing UserPromptSubmit hook...\n");
console.log("Sending test event:");
console.log(JSON.stringify(testEvent, null, 2));
console.log("\n" + "-".repeat(50) + "\n");

// Path to the built hook script
const hookPath = path.join(__dirname, '../../dist/hooks/userprompt.js');

// Spawn the hook process
const hookProcess = spawn('node', [hookPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send the test event
hookProcess.stdin.write(JSON.stringify(testEvent));
hookProcess.stdin.end();

// Capture output
let stdout = '';
let stderr = '';

hookProcess.stdout.on('data', (data) => {
  stdout += data;
});

hookProcess.stderr.on('data', (data) => {
  stderr += data;
});

// Handle completion
hookProcess.on('close', (code) => {
  console.log("Hook Response:");
  
  if (stdout) {
    try {
      const response = JSON.parse(stdout);
      console.log("✅ Success:", response.message || "Prompt captured successfully");
      if (response.stats) {
        console.log("📊 Stats:", response.stats);
      }
    } catch {
      console.log("📝 Output:", stdout);
    }
  }
  
  if (stderr) {
    console.log("⚠️ Errors:", stderr);
  }
  
  if (code === 0) {
    console.log("\n✅ Hook test completed successfully!");
    console.log("\n💡 Check the prompts folder for captured data:");
    console.log("   ~/.c0ntextkeeper/archive/projects/*/prompts/");
    
    // If debug mode is enabled, mention the debug logs
    if (process.env.C0NTEXTKEEPER_DEBUG === 'true') {
      console.log("\n📝 Debug logs available at:");
      console.log("   ~/.c0ntextkeeper/debug/userprompt-*.log");
    }
  } else {
    console.log("\n❌ Hook test failed with exit code:", code);
    console.log("\n💡 Try enabling debug mode:");
    console.log("   export C0NTEXTKEEPER_DEBUG=true");
    console.log("   Then run this test again");
  }
});

// Handle errors
hookProcess.on('error', (error) => {
  console.error("❌ Failed to run hook:", error.message);
  console.error("\n💡 Make sure to build the project first:");
  console.error("   npm run build");
});