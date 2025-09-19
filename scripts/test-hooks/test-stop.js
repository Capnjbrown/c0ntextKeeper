#!/usr/bin/env node
/**
 * Test script for Stop hook
 * Simulates Q&A exchange events that Claude Code would send
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a temporary transcript file for testing
const tempTranscriptPath = path.join(__dirname, 'test-transcript.jsonl');

// Sample transcript data (JSONL format)
const transcriptData = [
  {
    type: "human",
    content: "How do I implement authentication in Node.js?",
    timestamp: new Date().toISOString()
  },
  {
    type: "assistant", 
    content: "To implement authentication in Node.js, you can use Passport.js with JWT tokens. Here's a basic implementation:\n\n1. Install required packages\n2. Set up Passport strategies\n3. Create auth middleware\n4. Implement login/logout routes\n\nThis solution provides secure authentication for your application.",
    timestamp: new Date().toISOString()
  },
  {
    type: "tool_use",
    tool: "Edit",
    input: { file_path: "/src/auth.js" },
    timestamp: new Date().toISOString()
  }
];

// Write transcript to temp file
fs.writeFileSync(
  tempTranscriptPath,
  transcriptData.map(entry => JSON.stringify(entry)).join('\n'),
  'utf-8'
);

// Test data for Stop event
const testEvent = {
  hook_event_name: "Stop",
  session_id: "test-session-" + Date.now(),
  transcript_path: tempTranscriptPath,
  timestamp: new Date().toISOString(),
  project_path: process.cwd()
};

console.log("🧪 Testing Stop hook...\n");
console.log("Sending test event:");
console.log(JSON.stringify(testEvent, null, 2));
console.log("\n" + "-".repeat(50) + "\n");

// Path to the built hook script
const hookPath = path.join(__dirname, '../../dist/hooks/stop.js');

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
      console.log("✅ Success:", response.message || "Q&A captured successfully");
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
  
  // Clean up temp file
  if (fs.existsSync(tempTranscriptPath)) {
    fs.unlinkSync(tempTranscriptPath);
  }
  
  if (code === 0) {
    console.log("\n✅ Hook test completed successfully!");
    console.log("\n💡 Check the knowledge folder for captured Q&A:");
    console.log("   ~/.c0ntextkeeper/archive/projects/*/knowledge/");
    
    // If debug mode is enabled, mention the debug logs
    if (process.env.C0NTEXTKEEPER_DEBUG === 'true') {
      console.log("\n📝 Debug logs available at:");
      console.log("   ~/.c0ntextkeeper/debug/stop-*.log");
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
  
  // Clean up on error
  if (fs.existsSync(tempTranscriptPath)) {
    fs.unlinkSync(tempTranscriptPath);
  }
});