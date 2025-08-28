# 🎣 c0ntextKeeper Hooks Customization Guide

## Overview

c0ntextKeeper uses multiple Claude Code hooks to capture context at different points in your workflow. The primary PreCompact hook works **completely automatically** - capturing context both when you manually run `/compact` and when Claude Code automatically compacts due to context size limits. This guide explains how to customize which hooks are active and what they capture.

## Available Claude Code Hooks

### Currently Implemented

#### ✅ PreCompact (Default - Fully Automatic)
- **When**: 
  - Before manual `/compact` command
  - Before automatic compaction by Claude Code (no action required!)
- **Captures**: Entire session transcript
- **Use Case**: Preserve everything before context is lost
- **Storage**: ~5-50KB per session
- **Status**: Enabled by default, works automatically

### Now Available! 🎉

#### ✅ UserPromptSubmit
- **When**: Every time you send a message to Claude
- **Captures**: Your questions and requests
- **Use Case**: Track what problems you're solving
- **Storage**: ~1-2KB per prompt
- **Enable**: `c0ntextkeeper hooks enable userprompt`

#### ✅ PostToolUse
- **When**: After Claude uses a tool (Write, Edit, Bash, etc.)
- **Captures**: Tool results and changes made
- **Use Case**: Track successful patterns and errors
- **Storage**: ~2-5KB per tool use
- **Enable**: `c0ntextkeeper hooks enable posttool`

#### ✅ Stop
- **When**: After Claude finishes responding
- **Captures**: Complete Q&A exchange
- **Use Case**: Capture problem-solution pairs
- **Storage**: ~3-10KB per exchange
- **Enable**: `c0ntextkeeper hooks enable stop`

### Coming Soon

#### 🚀 SessionStart
- **When**: New Claude Code session begins
- **Captures**: Project context, initial state
- **Use Case**: Track when and where you work
- **Storage**: ~1KB per session

#### 🏁 SessionEnd
- **When**: Claude Code session ends
- **Captures**: Session summary, final state
- **Use Case**: Summarize accomplishments
- **Storage**: ~2-5KB per session

#### 🔨 PreToolUse
- **When**: Before Claude uses a tool
- **Captures**: Tool intent and parameters
- **Use Case**: Track attempted operations
- **Storage**: ~1-2KB per tool

## Hook Configuration

### Current Configuration

Your current hook setup in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/c0ntextKeeper/dist/hooks/precompact.js"
          }
        ]
      }
    ]
  }
}
```

### Adding Multiple Hooks

To enable additional hooks, add them to your `settings.json`:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/c0ntextKeeper/dist/hooks/precompact.js"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/c0ntextKeeper/dist/hooks/userprompt.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",  // Only for file modifications
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/c0ntextKeeper/dist/hooks/posttool.js"
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns

The `matcher` field controls when hooks trigger:

| Pattern | Description | Example |
|---------|-------------|---------|
| `*` | All events | Capture everything |
| `Write\|Edit` | Multiple tools | Only file modifications |
| `Bash` | Single tool | Only bash commands |
| `^(?!Read).*` | Exclude pattern | Everything except Read |

## Customization Strategies

### Strategy 1: Minimal Capture (Default)
**Just PreCompact** - Current setup
- ✅ Low overhead
- ✅ Captures everything important
- ❌ Only at compaction time

### Strategy 2: Continuous Capture
**UserPromptSubmit + PostToolUse + PreCompact**
- ✅ Never lose context
- ✅ Real-time preservation
- ⚠️ More storage usage

### Strategy 3: Development Focus
**PostToolUse (Write\|Edit) + Stop + PreCompact**
- ✅ Track code changes
- ✅ Capture solutions
- ✅ Moderate overhead

### Strategy 4: Research Mode
**UserPromptSubmit + Stop**
- ✅ Q&A pairs captured
- ✅ Perfect for learning
- ✅ Low storage

### Strategy 5: Debug Mode
**All hooks enabled**
- ✅ Complete visibility
- ⚠️ High storage usage
- ⚠️ May impact performance

## Performance Considerations

### Storage Impact

| Hook | Frequency | Size per Event | Daily Usage (Est.) |
|------|-----------|----------------|-------------------|
| PreCompact | 5-10/day | 20KB | 100-200KB |
| UserPromptSubmit | 50-100/day | 2KB | 100-200KB |
| PostToolUse | 100-200/day | 3KB | 300-600KB |
| Stop | 50-100/day | 5KB | 250-500KB |
| **Total (All)** | - | - | **750KB-1.5MB/day** |

### Performance Impact

- **PreCompact Only**: ~100ms delay on `/compact`
- **All Hooks**: ~50ms delay per operation
- **Recommended**: Start with PreCompact, add others as needed

## Hook Input/Output Reference

### PreCompact Hook

**Input**:
```json
{
  "hook_event_name": "PreCompact",
  "session_id": "session-123",
  "transcript_path": "/path/to/transcript.jsonl",
  "trigger": "manual",
  "custom_instructions": "focus on auth"
}
```

**Output**:
```json
{
  "status": "success",
  "message": "Context preserved: 3 problems, 5 implementations",
  "archiveLocation": "~/.c0ntextkeeper/archive/..."
}
```

### UserPromptSubmit Hook

**Input**:
```json
{
  "hook_event_name": "UserPromptSubmit",
  "session_id": "session-123",
  "prompt": "How do I implement authentication?",
  "timestamp": "2025-08-28T10:00:00Z"
}
```

**Output**:
```json
{
  "status": "success",
  "message": "Prompt captured: \"How do I implement authentication?\"",
  "stats": {
    "length": 35,
    "hasCode": false,
    "isQuestion": true,
    "topics": 1
  }
}
```

### PostToolUse Hook

**Input**:
```json
{
  "hook_event_name": "PostToolUse",
  "session_id": "session-123",
  "tool": "Write",
  "input": { "file_path": "auth.ts", "content": "..." },
  "result": { "success": true },
  "timestamp": "2025-08-28T10:00:00Z"
}
```

**Output**:
```json
{
  "status": "success",
  "message": "Tool use captured: Write (success)",
  "stats": {
    "tool": "Write",
    "success": true,
    "pattern": "Write: auth.ts - modified"
  }
}
```

### Stop Hook

**Input**:
```json
{
  "hook_event_name": "Stop",
  "session_id": "session-123",
  "exchange": {
    "user_prompt": "How do I fix this error?",
    "assistant_response": "You can fix it by updating the import statement.",
    "tools_used": ["Edit"],
    "files_modified": ["app.ts"]
  },
  "timestamp": "2025-08-28T10:00:00Z"
}
```

**Output**:
```json
{
  "status": "success",
  "message": "Q&A captured: \"How do I fix this error?...\"",
  "stats": {
    "relevance": "0.75",
    "hasSolution": true,
    "hasError": true,
    "topics": 2,
    "tools": 1
  }
}
```

## Available CLI Commands

All hook management commands are now available:

```bash
# Check automation status
c0ntextkeeper status

# List all hooks and their current status
c0ntextkeeper hooks list

# Enable a specific hook
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# Disable a hook
c0ntextkeeper hooks disable posttool

# Configure hook matcher pattern
c0ntextkeeper hooks config posttool -m "Write|Edit"

# Test a specific hook
c0ntextkeeper hooks test userprompt

# View hook statistics
c0ntextkeeper hooks stats
```

## Configuration File

c0ntextKeeper uses `~/.c0ntextkeeper/config.json` for centralized configuration:

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
      "excludePatterns": ["test", "debug"]
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
  },
  "security": {
    "filterSensitiveData": true,
    "customPatterns": []
  }
}
```

This file is automatically created with defaults on first run. You can edit it directly or use CLI commands to modify settings.

## Use Cases by Role

### For Learners
Enable: **UserPromptSubmit + Stop**
- Captures your questions and Claude's answers
- Perfect for reviewing what you learned
- Minimal overhead

### For Developers
Enable: **PostToolUse (Write|Edit) + PreCompact**
- Tracks all code changes
- Preserves full context at compaction
- Moderate storage usage

### For Researchers
Enable: **All hooks**
- Complete audit trail
- Pattern analysis across all interactions
- Maximum context preservation

### For Production Work
Enable: **PreCompact only**
- Minimal overhead
- Captures essential context
- Current default setup

## Troubleshooting Custom Hooks

### Hook Not Triggering

1. Check settings.json syntax:
```bash
cat ~/.claude/settings.json | jq '.hooks'
```

2. Verify hook script exists:
```bash
ls -la /path/to/c0ntextKeeper/dist/hooks/
```

3. Check matcher pattern:
```bash
# Test your regex pattern
echo "Write" | grep -E "Write|Edit"
```

### Too Much Data Captured

1. Adjust matcher patterns to be more specific
2. Disable verbose hooks like UserPromptSubmit
3. Set up cleanup script:
```bash
# Remove archives older than 30 days
find ~/.c0ntextkeeper/archive -name "*.json" -mtime +30 -delete
```

### Performance Issues

1. Disable real-time hooks (keep only PreCompact)
2. Check storage usage:
```bash
du -sh ~/.c0ntextkeeper/
```
3. Clear old archives:
```bash
c0ntextkeeper cleanup --older-than 30d
```

## Security Considerations

### Hook Security

- **All hooks run with your user permissions**
- **Can access any file you can access**
- **Only use hooks from trusted sources**
- **c0ntextKeeper filters sensitive data automatically**

### Data Privacy

- All captured context stays local
- No cloud uploads
- Sensitive data (API keys, passwords) auto-filtered
- You control what gets captured

## Roadmap

### Phase 1 (Completed ✅)
- ✅ PreCompact hook with automatic compaction support
- ✅ Basic archival system
- ✅ MCP retrieval tools (fetch_context, search_archive, get_patterns)
- ✅ UserPromptSubmit hook implementation
- ✅ PostToolUse hook implementation
- ✅ Stop hook implementation
- ✅ Configuration system (config.json)
- ✅ CLI hook management commands

### Phase 2 (In Progress)
- ⏳ SessionStart hook
- ⏳ SessionEnd hook
- ⏳ PreToolUse hook
- ⏳ Cloud sync capabilities

### Phase 3 (Future)
- ⏳ Hook chaining and dependencies
- ⏳ Custom hook creation API
- ⏳ Web dashboard for analytics
- ⏳ Vector search integration
- ⏳ Team sharing features

## Contributing

Want to help implement additional hooks? See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Hook development guide
- Testing requirements
- Submission process

## Summary

- **Current**: PreCompact hook captures context before compaction
- **Future**: Multiple hooks for continuous capture
- **Customizable**: Choose which hooks match your workflow
- **Flexible**: Configure with matchers and filters
- **Secure**: All data stays local, sensitive info filtered

Start with the default PreCompact hook, then add others as your needs grow!