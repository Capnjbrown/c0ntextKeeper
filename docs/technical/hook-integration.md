# Claude Code Hook Integration Guide for c0ntextKeeper

## Overview

c0ntextKeeper uses Claude Code's hook system to automatically capture and preserve valuable context at multiple points in your workflow. The primary PreCompact hook works **completely automatically** - capturing context both when you manually run `/compact` and when Claude Code automatically compacts context due to size limits.

### 🏗️ v0.6.0 Hybrid Storage Architecture
- **📁 Project-Local Storage** - Initialize with `c0ntextkeeper init` in your project
- **🌍 Global Storage** - Use `c0ntextkeeper init --global` for shared storage
- **🔍 Smart Path Resolution** - Automatically finds the right storage location
- **🎛️ Environment Override** - Use `CONTEXTKEEPER_HOME` for custom locations
- **🔧 Configuration Merging** - Global and project configs work together
- **📊 Storage Status** - Check configuration with `c0ntextkeeper status`

### 🚀 v0.5.1 Quality Improvements
- **Better Content Preservation**: Configurable limits up to 2000 chars for questions/solutions
- **Smarter Session Naming**: Fixed "that"/"then" issue with 100+ stopwords filter
- **Enhanced File Tracking**: Better path resolution for all tools (Bash, TodoWrite, etc.)
- **Improved Relevance Scoring**: TodoWrite (0.5), Bash (0.4), better admin tool scores
- **Fixed Duration Calculation**: No more negative durations in metadata
- **Configurable Content Limits**: New settings in config.ts for preservation thresholds

### 🚀 v0.5.0 Critical Fixes
- **Claude Code Compatibility**: Properly parses embedded content arrays in JSONL
- **Fixed Relevance Scoring**: User questions now score 1.0 (was 0.06)
- **50+ Semantic Patterns**: Vastly improved problem and solution detection
- **Tool Tracking Fixed**: Correctly extracts tool_use and tool_result from messages

### 🎆 v0.3.0 Enhancements
- **Analytics Dashboard**: Rich statistics in every archive README
- **Tool Usage Tracking**: Comprehensive tracking of all tool invocations
- **Enhanced Metadata**: Session duration, files modified, top problems
- **Aggregate Metrics**: Project-wide statistics and trends

### v0.2.0 Improvements
- **Timeout Protection**: 55-second limit prevents 504 errors during auto-compact
- **Type Safety**: Handles all content types (strings, arrays, objects) without errors
- **Smart Extraction**: Relaxed patterns capture more valuable context
- **Debug Logging**: Detailed diagnostics for troubleshooting

## Table of Contents
- [Understanding Claude Code Hooks](#understanding-claude-code-hooks)
- [Installation Methods](#installation-methods)
- [Manual Configuration](#manual-configuration)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)

## Understanding Claude Code Hooks

### Available Hooks in c0ntextKeeper

c0ntextKeeper implements 4 powerful hooks:

1. **PreCompact** (Enabled by default)
   - Fires before context compaction (both manual `/compact` and automatic)
   - Captures entire session transcript with v0.5.1 improvements:
     - Configurable content limits (2000 chars for questions/solutions)
     - Smarter session naming with 100+ stopwords
     - Better file path tracking for all tools
     - Enhanced relevance scoring for admin tools
     - Fixed duration calculation (no negatives)
   - v0.5.0 enhancements included:
     - Proper Claude Code JSONL format parsing
     - 50+ semantic patterns for problem detection
     - User questions score 1.0 relevance
     - Tool usage counts and frequency
   - Storage: `archive/` (relative to storage location)
   - Generates analytics dashboard in README.md

2. **UserPromptSubmit** (Optional)
   - Fires when you send a message to Claude
   - Tracks your questions and requests
   - Storage: `archive/projects/[project-name]/prompts/`
   - Enable: `c0ntextkeeper hooks enable userprompt`

3. **PostToolUse** (Optional)
   - Fires after Claude uses tools (Write, Edit, Bash, etc.)
   - Captures tool results and patterns
   - Storage: `archive/projects/[project-name]/patterns/`
   - Enable: `c0ntextkeeper hooks enable posttool`

4. **Stop** (Optional)
   - Fires after Claude finishes responding
   - Saves complete Q&A exchanges
   - Storage: `archive/projects/[project-name]/knowledge/`
   - Enable: `c0ntextkeeper hooks enable stop`

### Automatic Compaction

**Important**: Claude Code performs compaction in two ways:
- **Manual**: When you type `/compact`
- **Automatic**: When context size exceeds limits (no action required!)

The PreCompact hook captures context in **both cases** automatically. You never lose valuable work!

**Security Warning**: Hooks execute arbitrary shell commands automatically. They can modify, delete, or access any files your user account can access. Always validate inputs and use secure practices.

## Installation Methods

### Method 1: Automated Installation (Recommended)

```bash
# Step 1: Install c0ntextkeeper globally
npm install -g c0ntextkeeper

# Step 2: Initialize storage (choose one)
c0ntextkeeper init              # Project-local storage (recommended)
c0ntextkeeper init --global      # Global storage for all projects

# Step 3: Run the setup wizard (enables PreCompact hook)
c0ntextkeeper setup

# Step 4: Check automation status
c0ntextkeeper status

# Step 5: Verify installation
c0ntextkeeper validate
```

### Managing Additional Hooks

After setup, you can enable additional hooks:

```bash
# List all available hooks
c0ntextkeeper hooks list

# Enable specific hooks
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# Test a hook
c0ntextkeeper hooks test <hook-name>

# View hook statistics
c0ntextkeeper hooks stats
```

### Method 2: Manual Installation

If automated setup fails, follow these manual steps:

#### Step 1: Build the Hook Script

```bash
cd ~/Projects/c0ntextKeeper
npm run build
```

This creates the compiled hook at: `dist/hooks/precompact.js`

#### Step 2: Update Claude Code Settings

Add the following to `~/.claude/settings.json`:

```json
{
  "feedbackSurveyState": {
    "lastShownTime": 1753989321394
  },
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline_final.sh"
  },
  "hooks": {
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/Projects/c0ntextKeeper/dist/hooks/precompact.js"
          }
        ]
      }
    ]
  }
}
```

**Important Notes:**
- The `matcher` field accepts glob patterns (`*` matches all projects)
- The `command` must be an absolute path
- Ensure Node.js is in your PATH

#### Step 3: Create Hooks Directory

```bash
mkdir -p ~/.claude/hooks
```

#### Step 4: Create Wrapper Script (Optional)

For better reliability, create a wrapper script:

```bash
cat > ~/.claude/hooks/c0ntextkeeper-hook.sh << 'EOF'
#!/bin/bash
# c0ntextKeeper preCompact Hook Wrapper

# Log hook execution for debugging
echo "[$(date)] Hook triggered" >> ~/.c0ntextkeeper/hook.log

# Execute the actual hook
node ~/Projects/c0ntextKeeper/dist/hooks/precompact.js

# Capture exit code
EXIT_CODE=$?

# Log result
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Hook completed successfully" >> ~/.c0ntextkeeper/hook.log
else
    echo "[$(date)] Hook failed with code $EXIT_CODE" >> ~/.c0ntextkeeper/hook.log
fi

exit $EXIT_CODE
EOF

chmod +x ~/.claude/hooks/c0ntextkeeper-hook.sh
```

Then update settings.json to use the wrapper:
```json
"command": "~/.claude/hooks/c0ntextkeeper-hook.sh"
```

## Verification Steps

### 1. Check Settings Configuration

```bash
# View current settings
cat ~/.claude/settings.json | jq '.hooks'

# Should output:
# {
#   "preCompact": [
#     {
#       "matcher": "*",
#       "hooks": [
#         {
#           "type": "command",
#           "command": "..."
#         }
#       ]
#     }
#   ]
# }
```

### 2. Test Hook Execution

```bash
# Run the hook directly
node /Users/jasonbrown/Projects/c0ntextKeeper/dist/hooks/precompact.js

# Check for errors (should exit immediately with no input)
echo $?  # Should be 0 or 1
```

### 3. Check Archive Directory

After running `/compact` in Claude Code:

```bash
# Check if archives are created
ls -la ~/.c0ntextkeeper/archive/

# View latest archive
ls -la ~/.c0ntextkeeper/archive/projects/*/sessions/
```

### 4. Monitor Hook Logs

```bash
# Watch hook execution logs
tail -f ~/.c0ntextkeeper/hook.log

# In another terminal, trigger /compact in Claude Code
```

## Troubleshooting

### Issue: 504 Timeout Errors (FIXED in v0.2.0)

**Previous Symptoms:**
- Hook would timeout after 60 seconds
- Multiple 504 errors during auto-compact
- Context not preserved

**v0.2.0 Solution:**
- Implemented 55-second timeout protection
- Smart transcript prioritization (first 20% + last 80%)
- Graceful handling of large transcripts

**Verification:**
```bash
# Check version
c0ntextkeeper --version  # Should be 0.2.0+

# Test with large transcript
export C0NTEXTKEEPER_FILE_LOGGING=true
# Trigger /compact and check logs
tail -f ~/.c0ntextkeeper/logs/hook.log
```

### Issue: "content.toLowerCase is not a function" (FIXED in v0.2.0)

**Previous Symptoms:**
- Extraction failed with TypeError
- Archives created but empty

**v0.2.0 Solution:**
- Added comprehensive type guards
- Handles arrays, objects, and strings
- Safe string conversion for all content

**Test extraction:**
```bash
node scripts/test-extraction.js
# Should show: ✅ Extraction successful!
```

### Issue: Hook Not Triggering

**Symptoms:**
- No archives created after `/compact`
- No entries in hook.log

**Solutions:**
1. Verify settings.json has correct hook configuration
2. Ensure hook script is executable
3. Check Node.js is accessible from Claude Code's environment
4. Restart Claude Code after configuration changes

### Issue: Hook Fails with Permission Error

**Symptoms:**
- Error: "EACCES: permission denied"

**Solutions:**
```bash
# Make hook executable
chmod +x ~/Projects/c0ntextKeeper/dist/hooks/precompact.js

# Ensure archive directory is writable
mkdir -p ~/.c0ntextkeeper/archive
chmod 755 ~/.c0ntextkeeper/archive
```

### Issue: Hook Runs but No Archives Created

**Symptoms:**
- Hook executes but no context saved
- Error: "No transcript path provided"

**Solutions:**
1. Claude Code may not be passing transcript path
2. Check hook receives proper input:
```bash
# Test with mock input
echo '{"hook_event_name":"PreCompact","transcript_path":"/path/to/transcript.jsonl"}' | \
  node /Users/jasonbrown/Projects/c0ntextKeeper/dist/hooks/precompact.js
```

### Issue: Claude CLI Commands Timeout

**Symptoms:**
- `claude settings get` hangs indefinitely

**Solutions:**
- Manually edit `~/.claude/settings.json` instead
- Use direct file modification approach
- Ensure Claude Code isn't running during configuration

## Configuration System

c0ntextKeeper uses a configuration file at `~/.c0ntextkeeper/config.json` to manage hook settings:

```json
{
  "hooks": {
    "preCompact": {
      "enabled": true,
      "captureOn": ["manual", "auto"]
    },
    "userPromptSubmit": {
      "enabled": false,
      "minLength": 10,
      "excludePatterns": []
    },
    "postToolUse": {
      "enabled": false,
      "matcher": "Write|Edit|MultiEdit",
      "captureErrors": true
    },
    "stop": {
      "enabled": false,
      "minLength": 50
    }
  },
  "storage": {
    "retentionDays": 90,
    "maxSizeMB": 100,
    "compressionEnabled": false
  },
  "extraction": {
    "relevanceThreshold": 0.5,
    "maxContextItems": 50,
    "enablePatternRecognition": true
  }
}
```

The configuration file is automatically created on first run with sensible defaults.

## Technical Details

### Hook Input Format

The PreCompact hook receives JSON input via stdin:

```typescript
interface HookInput {
  hook_event_name: 'PreCompact';
  session_id: string;           // Current session identifier
  transcript_path: string;      // Path to JSONL transcript
  trigger: 'manual' | 'auto';   // How compaction was triggered
  custom_instructions: string;  // User's instructions (manual) or empty (auto)
}
```

### Hook Output Format

The hook should output JSON to stdout:

```typescript
interface HookOutput {
  status: 'success' | 'error' | 'skipped';
  message: string;
  archiveLocation?: string;
  stats?: {
    problems: number;
    implementations: number;
    decisions: number;
    patterns: number;
  };
}
```

### Hook Execution Environment

- **Working Directory**: Project root where `/compact` was triggered
- **Environment Variables**: 
  - Inherits from Claude Code process
  - `CLAUDE_PROJECT_DIR`: Absolute path to project root
  - `C0NTEXTKEEPER_FILE_LOGGING`: Enable file logging (optional)
- **Timeout Protection** (v0.2.0+):
  - Internal: 55 seconds (5-second buffer)
  - Claude Code: 60 seconds (hard limit)
  - Graceful degradation for large transcripts
- **Input**: JSON via stdin
- **Output**: JSON via stdout
- **Exit Codes**:
  - 0: Success
  - 1: Non-blocking error (continues compaction)
  - 2: Blocking error (prevents compaction)
- **Errors**: stderr is captured in Claude Code logs
- **Parallel Execution**: All matching hooks run in parallel
- **Deduplication**: Multiple identical hook commands are automatically deduplicated

### Timeout Protection Details (v0.2.0)

The PreCompact hook now includes sophisticated timeout protection:

```typescript
const TIMEOUT_MS = 55000; // 55 seconds (5 seconds buffer before Claude's 60s timeout)

// Smart prioritization for large transcripts
if (entries.length > maxEntries) {
  // Keep first 20% (context setup) and last 80% (recent work)
  const firstCount = Math.floor(maxEntries * 0.2);
  const lastCount = maxEntries - firstCount;
  entries = [
    ...entries.slice(0, firstCount),
    ...entries.slice(-lastCount)
  ];
}
```

This ensures:
- Hook completes before Claude's timeout
- Most recent context is prioritized
- No 504 errors during auto-compact
- Graceful handling of massive transcripts

### Archive Storage Structure

```
~/.c0ntextkeeper/
├── config.json              # Hook configuration
├── archive/                 # PreCompact hook data
│   ├── projects/
│   │   ├── [project-hash]/
│   │   │   ├── sessions/
│   │   │   │   ├── 2025-08-28-session-abc123.json
│   │   │   │   └── 2025-08-28-session-def456.json
│   │   │   └── index.json
│   │   │   └── test/           # Test/validation data
│   │   └── [another-project-hash]/
│   │       └── ...
│   └── global/
│       └── index.json
├── prompts/                 # UserPromptSubmit hook data
│   └── [project-hash]/
│       └── 2025-08-28-prompts.json    # JSON array format
├── patterns/                # PostToolUse hook data
│   └── [project-hash]/
│       └── 2025-08-28-patterns.json   # JSON array format
├── knowledge/               # Stop hook data
│   └── [project-hash]/
│       └── 2025-08-28-knowledge.json  # JSON array format
├── errors/                  # Error patterns
│   └── 2025-08-28-errors.json         # JSON array format
├── solutions/               # Indexed solutions
│   └── index.json
└── logs/                    # Hook execution logs
    └── hook.log
```

## Testing the Hook

### Create Test Transcript

Create `test-transcript.jsonl`:
```jsonl
{"type":"user","timestamp":"2025-08-28T10:00:00Z","message":{"role":"user","content":"How do I implement authentication?"}}
{"type":"assistant","timestamp":"2025-08-28T10:00:01Z","message":{"role":"assistant","content":"Let me help you implement authentication using JWT tokens."}}
{"type":"tool_use","timestamp":"2025-08-28T10:00:02Z","toolUse":{"name":"Write","input":{"file_path":"auth.ts","content":"// Authentication implementation"}}}
```

### Run Test

```bash
# Test the hook with mock data
echo '{"hook_event_name":"PreCompact","transcript_path":"./test-transcript.jsonl"}' | \
  node /Users/jasonbrown/Projects/c0ntextKeeper/dist/hooks/precompact.js

# Check output
cat ~/.c0ntextkeeper/archive/projects/*/sessions/*.json | jq '.'
```

## Debugging

### Enable Debug Mode

Set environment variable before running Claude Code:
```bash
export C0NTEXTKEEPER_DEBUG=true
claude code
```

### Check Claude Code Logs

```bash
# macOS
tail -f ~/Library/Logs/Claude/claude.log

# Linux
tail -f ~/.config/Claude/logs/claude.log
```

### Validate Hook Configuration

```bash
# Run validation
c0ntextkeeper validate

# Should output:
# ✓ Hook script exists
# ✓ Hook is executable
# ✓ Settings configured
# ✓ Archive directory writable
# ✓ Hook test successful
```

## Support

If you continue experiencing issues:

1. Check [GitHub Issues](https://github.com/Capnjbrown/c0ntextKeeper/issues)
2. Enable debug mode and collect logs
3. Run `c0ntextkeeper diagnose` to generate diagnostic report
4. Contact support with diagnostic information

## Next Steps

Once the hook is properly configured:
1. Work normally in Claude Code
2. Run `/compact` when needed
3. Use MCP tools to retrieve preserved context:
   - `fetch_context` - Get relevant archived context
   - `search_archive` - Search through all archives
   - `get_patterns` - Identify recurring patterns

The hook will automatically capture and preserve your valuable context before each compaction!