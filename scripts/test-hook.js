#!/usr/bin/env node

/**
 * Test Script for c0ntextKeeper PreCompact Hook
 * Simulates Claude Code's PreCompact event to verify hook functionality
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = '') {
  console.log(color + message + colors.reset);
}

async function testHook() {
  log('\n🧪 Testing c0ntextKeeper PreCompact Hook', colors.blue);
  log('=========================================\n', colors.blue);

  // Find the hook script
  const projectDir = path.dirname(__dirname);
  const hookScript = path.join(projectDir, 'dist', 'hooks', 'precompact.js');
  const testTranscript = path.join(projectDir, 'tests', 'fixtures', 'sample-transcript.jsonl');

  // Check if hook script exists
  if (!fs.existsSync(hookScript)) {
    log('❌ Hook script not found. Run "npm run build" first.', colors.red);
    process.exit(1);
  }
  log('✅ Hook script found', colors.green);

  // Create test transcript if it doesn't exist
  if (!fs.existsSync(testTranscript)) {
    const testDir = path.dirname(testTranscript);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const sampleContent = [
      '{"type":"user","timestamp":"2025-08-28T10:00:00Z","sessionId":"test-session","message":{"role":"user","content":"How do I implement authentication with JWT tokens?"}}',
      '{"type":"assistant","timestamp":"2025-08-28T10:00:01Z","sessionId":"test-session","message":{"role":"assistant","content":"I\'ll help you implement JWT authentication. Let me create the authentication module."}}',
      '{"type":"tool_use","timestamp":"2025-08-28T10:00:02Z","sessionId":"test-session","toolUse":{"name":"Write","input":{"file_path":"auth.ts","content":"import jwt from \'jsonwebtoken\';\\n\\nexport function generateToken(userId: string): string {\\n  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: \'24h\' });\\n}"}}}',
      '{"type":"tool_result","timestamp":"2025-08-28T10:00:03Z","sessionId":"test-session","toolResult":{"success":true}}',
      '{"type":"assistant","timestamp":"2025-08-28T10:00:04Z","sessionId":"test-session","message":{"role":"assistant","content":"I\'ve created the authentication module with JWT token generation. The solution uses the jsonwebtoken library to create secure tokens."}}'
    ].join('\n');
    
    fs.writeFileSync(testTranscript, sampleContent);
    log('✅ Created sample transcript', colors.green);
  }

  // Test 1: Manual compaction with custom instructions
  log('\n📝 Test 1: Manual Compaction', colors.cyan);
  const manualInput = JSON.stringify({
    hook_event_name: 'PreCompact',
    session_id: 'test-session-' + Date.now(),
    transcript_path: testTranscript,
    trigger: 'manual',
    custom_instructions: 'Focus on authentication patterns'
  });

  await runHookTest(hookScript, manualInput, 'Manual');

  // Test 2: Auto compaction
  log('\n📝 Test 2: Auto Compaction', colors.cyan);
  const autoInput = JSON.stringify({
    hook_event_name: 'PreCompact',
    session_id: 'test-session-' + Date.now(),
    transcript_path: testTranscript,
    trigger: 'auto',
    custom_instructions: ''
  });

  await runHookTest(hookScript, autoInput, 'Auto');

  // Test 3: Missing transcript (should fail)
  log('\n📝 Test 3: Missing Transcript (Should Fail)', colors.cyan);
  const missingInput = JSON.stringify({
    hook_event_name: 'PreCompact',
    session_id: 'test-session-' + Date.now(),
    transcript_path: '/nonexistent/file.jsonl',
    trigger: 'manual',
    custom_instructions: ''
  });

  await runHookTest(hookScript, missingInput, 'Missing File', true);

  // Test 4: Wrong event (should skip)
  log('\n📝 Test 4: Wrong Event (Should Skip)', colors.cyan);
  const wrongEventInput = JSON.stringify({
    hook_event_name: 'PostCompact',
    session_id: 'test-session-' + Date.now(),
    transcript_path: testTranscript,
    trigger: 'manual'
  });

  await runHookTest(hookScript, wrongEventInput, 'Wrong Event');

  // Check archives
  log('\n📂 Checking Archives', colors.cyan);
  const archiveDir = path.join(require('os').homedir(), '.c0ntextkeeper', 'archive');
  
  if (fs.existsSync(archiveDir)) {
    const files = getAllFiles(archiveDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    if (jsonFiles.length > 0) {
      log(`✅ Found ${jsonFiles.length} archive files:`, colors.green);
      jsonFiles.slice(-3).forEach(file => {
        const relativePath = path.relative(archiveDir, file);
        console.log(`   - ${relativePath}`);
      });
      
      // Show content of latest archive
      const latestArchive = jsonFiles[jsonFiles.length - 1];
      try {
        const content = JSON.parse(fs.readFileSync(latestArchive, 'utf-8'));
        log('\n📄 Latest Archive Content:', colors.cyan);
        console.log(`   Session: ${content.sessionId || 'unknown'}`);
        console.log(`   Problems: ${content.problems?.length || 0}`);
        console.log(`   Implementations: ${content.implementations?.length || 0}`);
        console.log(`   Decisions: ${content.decisions?.length || 0}`);
        console.log(`   Patterns: ${content.patterns?.length || 0}`);
        if (content.metadata?.trigger) {
          console.log(`   Trigger: ${content.metadata.trigger}`);
        }
      } catch (error) {
        log('⚠️  Could not parse latest archive', colors.yellow);
      }
    } else {
      log('⚠️  No archive files found', colors.yellow);
    }
  } else {
    log('⚠️  Archive directory does not exist', colors.yellow);
  }

  log('\n✨ Hook testing complete!', colors.green);
}

function runHookTest(hookScript, input, testName, expectError = false) {
  return new Promise((resolve) => {
    const child = spawn('node', [hookScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (stderr) {
        log(`   ⚠️  Stderr: ${stderr.trim()}`, colors.yellow);
      }

      try {
        const output = JSON.parse(stdout);
        
        if (expectError) {
          if (output.status === 'error' || code === 2) {
            log(`   ✅ ${testName}: Failed as expected (${output.message})`, colors.green);
          } else {
            log(`   ❌ ${testName}: Should have failed but didn't`, colors.red);
          }
        } else {
          if (output.status === 'success') {
            log(`   ✅ ${testName}: Success - ${output.message}`, colors.green);
          } else if (output.status === 'skipped') {
            log(`   ⏭️  ${testName}: Skipped - ${output.message}`, colors.yellow);
          } else {
            log(`   ❌ ${testName}: Failed - ${output.message}`, colors.red);
          }
        }
      } catch (error) {
        log(`   ❌ ${testName}: Invalid JSON output: ${stdout}`, colors.red);
      }

      if (code !== 0 && code !== 2 && !expectError) {
        log(`   ⚠️  Exit code: ${code}`, colors.yellow);
      }

      resolve();
    });

    // Send input to stdin
    child.stdin.write(input);
    child.stdin.end();
  });
}

function getAllFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Run tests
testHook().catch(error => {
  log(`\n❌ Test failed: ${error.message}`, colors.red);
  console.error(error.stack);
  process.exit(1);
});