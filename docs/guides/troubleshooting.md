# c0ntextKeeper Troubleshooting Guide

This guide helps diagnose and fix common issues with c0ntextKeeper hooks and MCP tools.

## Table of Contents
- [Quick Diagnosis](#quick-diagnosis)
- [Hook Issues](#hook-issues)
  - [Hooks Not Capturing Data](#hooks-not-capturing-data)
  - [PostToolUse Not Working](#posttooluse-not-working)
  - [Stop Hook Not Capturing Q&A](#stop-hook-not-capturing-qa)
  - [UserPromptSubmit Missing Follow-ups](#userpromptsubmit-missing-follow-ups)
- [MCP Tool Issues](#mcp-tool-issues)
  - [search_archive Returns No Results](#search_archive-returns-no-results)
  - [fetch_context Not Finding Data](#fetch_context-not-finding-data)
  - [get_patterns Shows Old Data](#get_patterns-shows-old-data)
- [Debug Mode](#debug-mode)
- [Common Fixes](#common-fixes)
- [FAQ](#faq)

## Quick Diagnosis

Run the health check to quickly identify issues:

```bash
c0ntextkeeper hooks health
```

This will show:
- Which hooks are enabled/disabled
- When data was last captured
- Specific issues and suggestions

## Hook Issues

### Hooks Not Capturing Data

**Symptoms:**
- No new files in `~/.c0ntextkeeper/archive/projects/*/`
- Health check shows "No data captured"

**Solutions:**

1. **Enable the hooks:**
```bash
# Enable all hooks
c0ntextkeeper hooks enable precompact
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# Verify they're enabled
c0ntextkeeper hooks list
```

2. **Restart Claude Code:**
- Hooks only activate after Claude Code restarts
- Close and reopen Claude Code completely

3. **Test with mock data:**
```bash
# Test individual hooks
node scripts/test-hooks/test-posttool.js
node scripts/test-hooks/test-stop.js
node scripts/test-hooks/test-userprompt.js

# Test all hooks
node scripts/test-hooks/test-all.js
```

4. **Enable debug mode:**
```bash
export C0NTEXTKEEPER_DEBUG=true
# Restart Claude Code
# Check logs in ~/.c0ntextkeeper/debug/
```

### PostToolUse Not Working

**Symptoms:**
- Patterns folder empty or only has test data
- Tools being used but not captured

**Diagnosis:**
```bash
# Check if enabled
c0ntextkeeper hooks list | grep PostToolUse

# Check patterns folder
ls -la ~/.c0ntextkeeper/archive/projects/*/patterns/

# Test with mock data
node scripts/test-hooks/test-posttool.js
```

**Solutions:**

1. **Verify hook is enabled in Claude Code:**
```bash
# Enable the hook
c0ntextkeeper hooks enable posttool

# Restart Claude Code
```

2. **Check debug logs (if enabled):**
```bash
tail -f ~/.c0ntextkeeper/debug/posttool-*.log
```

3. **Common issues:**
- Claude Code may not send PostToolUse events for all tools
- Some MCP tools might not trigger the event
- Try using standard tools like Edit, Write, Bash to test

### Stop Hook Not Capturing Q&A

**Symptoms:**
- Knowledge folder has no recent data
- Q&A exchanges not being saved

**Solutions:**

1. **Ensure hook is enabled:**
```bash
c0ntextkeeper hooks enable stop
```

2. **Test transcript reading:**
```bash
# Run test with sample transcript
node scripts/test-hooks/test-stop.js
```

3. **Check if Claude Code sends Stop events:**
- Stop events trigger when conversation ends
- Try ending a conversation explicitly
- Check debug logs for event data

### UserPromptSubmit Missing Follow-ups

**Symptoms:**
- Only first prompt in session captured
- Follow-up questions not saved

**Current Behavior:**
- v0.7.4 now tracks session continuity
- Follow-up prompts are marked with `isFollowUp: true`
- Each prompt gets a `promptNumber` in the session

**Verification:**
```bash
# Check recent prompts
cat ~/.c0ntextkeeper/archive/projects/*/prompts/$(date +%Y-%m-%d)-prompts.json | jq '.'
```

## MCP Tool Issues

### search_archive Returns No Results

**Symptoms:**
- `search_archive` always returns empty array
- Natural language queries don't work

**Fixed in v0.7.4:**
- Now uses tokenized word matching
- Supports natural language queries
- Example: "PostToolUse hook" now works

**Test the fix:**
```javascript
// In Claude Code
await mcp__c0ntextkeeper__search_archive({
  query: "hook patterns testing"
})
```

### fetch_context Not Finding Data

**Symptoms:**
- No contexts returned
- Wrong project path

**Solutions:**

1. **Check project detection:**
```bash
# Verify current project
pwd

# Check if archive exists
ls ~/.c0ntextkeeper/archive/projects/
```

2. **Try global scope:**
```javascript
await mcp__c0ntextkeeper__fetch_context({
  query: "your query",
  scope: "global"  // Search all projects
})
```

### get_patterns Shows Old Data

**Symptoms:**
- Patterns are outdated
- Not reflecting recent tool usage

**Solutions:**

1. **Verify PostToolUse hook is working:**
```bash
c0ntextkeeper hooks health
```

2. **Check patterns are being captured:**
```bash
# Look for recent pattern files
ls -lt ~/.c0ntextkeeper/archive/projects/*/patterns/
```

## Debug Mode

Enable comprehensive debug logging:

```bash
# Enable debug mode
export C0NTEXTKEEPER_DEBUG=true

# Restart Claude Code
# Use normally
# Check debug logs
ls ~/.c0ntextkeeper/debug/

# View logs
tail -f ~/.c0ntextkeeper/debug/posttool-*.log
tail -f ~/.c0ntextkeeper/debug/stop-*.log
tail -f ~/.c0ntextkeeper/debug/userprompt-*.log
```

Debug logs show:
- When hooks are triggered
- What data Claude Code sends
- Processing steps
- Storage locations

## Common Fixes

### 1. Complete Reset
```bash
# Disable all hooks
c0ntextkeeper hooks disable all

# Re-enable hooks
c0ntextkeeper hooks enable all

# Restart Claude Code
```

### 2. Build Issues
```bash
# Rebuild the project
npm run build

# Test hooks
npm test

# Run test scripts
node scripts/test-hooks/test-all.js
```

### 3. Permission Issues
```bash
# Check permissions
ls -la ~/.c0ntextkeeper/

# Fix permissions if needed
chmod -R 755 ~/.c0ntextkeeper/
```

### 4. Storage Issues
```bash
# Initialize storage
c0ntextkeeper init

# Check status
c0ntextkeeper status

# View statistics
c0ntextkeeper stats
```

## FAQ

### Q: Why aren't my hooks capturing data?
**A:** Most commonly:
1. Hooks not enabled (run `c0ntextkeeper hooks enable all`)
2. Claude Code needs restart after enabling
3. Claude Code may not be sending expected events

### Q: How do I know if hooks are working?
**A:** Run `c0ntextkeeper hooks health` for a comprehensive check. Look for:
- ✅ Enabled status
- Recent data capture times
- Non-zero data counts

### Q: What's the difference between test and production data?
**A:** Test data:
- Has sessionIds containing "test"
- Stored when running test scripts
- Automatically separated in `test/` folders

### Q: How often do hooks trigger?
**A:** 
- **PreCompact**: On `/compact` command or auto-compaction
- **UserPromptSubmit**: Every user message
- **PostToolUse**: After each tool execution
- **Stop**: When conversation ends

### Q: Can I manually trigger hooks?
**A:** Yes, use test scripts:
```bash
node scripts/test-hooks/test-all.js
```

### Q: Where is data stored?
**A:** 
- Global: `~/.c0ntextkeeper/archive/projects/[project-name]/`
- Local: `./.c0ntextkeeper/` (if initialized)
- Check with: `c0ntextkeeper status`

### Q: How do I clean up test data?
**A:** Test data is automatically separated:
- Production: `projects/[name]/sessions/`
- Test: `projects/[name]/test/`
- Clean test data: `rm -rf ~/.c0ntextkeeper/archive/projects/*/test/`

### Q: Why is search_archive not finding my queries?
**A:** Fixed in v0.7.4. Update to latest version:
```bash
git pull
npm install
npm run build
```

## Getting Help

If issues persist:

1. **Enable debug mode** and collect logs
2. **Run health check** and save output
3. **Check GitHub issues**: https://github.com/Capnjbrown/c0ntextKeeper/issues
4. **Report new issues** with:
   - c0ntextKeeper version (`c0ntextkeeper --version`)
   - Claude Code version
   - Health check output
   - Debug logs (if available)
   - Steps to reproduce

## Related Documentation
- [Installation Guide](./installation.md)
- [Configuration Guide](./guides/configuration.md)
- [Hook Documentation](./technical/hooks.md)
- [MCP Tools Reference](./api/mcp-tools.md)