# c0ntextKeeper Migration Guide

> Last Updated: 2025-12-26 for v0.7.8

## v0.7.7 to v0.7.8 Migration

### Overview
Version 0.7.8 removes the SubagentStop hook as Claude Code deprecated the SubagentStop event. This is a minor cleanup release with no breaking changes.

### Key Changes
- **7 Hooks Total**: Removed SubagentStop hook (deprecated by Claude Code)
- **6 Storage Categories**: Removed subagents/ directory

---

## v0.7.6 to v0.7.7 Migration

### Overview
Version 0.7.7 added 3 new Claude Code hooks for expanded hook coverage and introduced 2 new storage categories. This was a significant feature release with no breaking changes.

### Key Features
- **7 Hooks Total**: Added Notification, SessionStart, SessionEnd hooks
- **6 Storage Categories**: Added notifications/, sessions-meta/ directories
- **187 Semantic Patterns**: Verified pattern count (116 problem + 41 request + 23 solution + 7 decision)
- **100% Test Pass Rate**: All 483 tests passing (23% code coverage)
- **8 Specialized Agents**: Pre-built audit agents for development workflow

### New Hooks Available (v0.7.7)

| Hook | Purpose | Storage |
|------|---------|---------|
| Notification | Capture alerts and warnings | notifications/ |
| SessionStart | Session lifecycle start | sessions-meta/ |
| SessionEnd | Session lifecycle end | sessions-meta/ |

### Migration Steps

#### Step 1: Update Package
```bash
npm update -g c0ntextkeeper@latest
```

#### Step 2: Rebuild (if from source)
```bash
npm run build
```

#### Step 3: Enable New Hooks (Optional)
```bash
# Enable any of the new hooks
c0ntextkeeper hooks enable notification
c0ntextkeeper hooks enable sessionstart
c0ntextkeeper hooks enable sessionend

# Or enable all at once
c0ntextkeeper hooks enable all
```

#### Step 4: Verify
```bash
# Check version
c0ntextkeeper --version
# Should show: 0.7.7

# Verify all 7 hooks are available
c0ntextkeeper hooks list

# Run health check
c0ntextkeeper hooks health
```

### New Storage Directories
v0.7.7 automatically creates these new directories as needed:
```
~/.c0ntextkeeper/archive/projects/[name]/
├── notifications/    # Notification hook data
└── sessions-meta/    # SessionStart/End lifecycle data
```

### No Breaking Changes
Version 0.7.7 maintains full backward compatibility:
- All existing archives remain valid
- Existing hooks continue to work unchanged
- Storage architecture unchanged for existing categories
- All CLI commands work as before

---

## v0.7.4 to v0.7.5+ Migration

### Overview
Version 0.7.5 introduces search indexing with inverted index for O(1) lookups, beautiful CLI styling with chalk, and comprehensive test suite improvements. Version 0.7.6 dramatically improves CLI output quality with 3-10x truncation limit increases.

### Key Improvements
- **Search Indexing**: O(1) keyword lookups with inverted index
- **CLI Styling**: Beautiful output with chalk semantic colors
- **Test Coverage**: Improved from 95.9% to 99.5% (196/197 tests)
- **Pattern Count**: Verified 180 semantic patterns via code audit
- **Truncation Limits**: 3-10x increases for complete context visibility (v0.7.6)

### Migration Steps

#### Step 1: Update Package
```bash
npm update -g c0ntextkeeper@latest
```

#### Step 2: Rebuild Search Index
After updating, rebuild the search index for better performance:
```bash
c0ntextkeeper rebuild-index
```

#### Step 3: Verify
```bash
# Check version
c0ntextkeeper --version
# Should show: 0.7.5 or higher

# Test search with improved CLI output
c0ntextkeeper search "recent work"
# Should show: Full context without '...' cutoffs
```

### No Breaking Changes
Version 0.7.5+ maintains full backward compatibility. All existing archives, configurations, and hooks continue to work without modification.

---

## v0.7.4 to Previous Migration History

### Overview
Version 0.7.4 introduces critical improvements to MCP tools reliability, fixing relevance scoring and sessionId generation issues.

### Key Improvements
- **Relevance Scoring**: Now properly capped at 100% (was showing up to 129%)
- **SessionId Generation**: No more "unknown" sessions
- **Natural Language Processing**: Better query understanding with tokenization
- **Output Formatting**: Cleaner results with content snippets

### Migration Steps

#### Step 1: Update Package
```bash
npm update -g c0ntextkeeper@0.7.4
```

#### Step 2: Fix Existing Archives
If you have archives with "unknown" sessionIds:
```bash
node $(npm root -g)/c0ntextkeeper/scripts/fix-unknown-sessions.js
```

#### Step 3: Verify
```bash
# Test MCP tools
c0ntextkeeper search "recent work"

# Should show:
# - Relevance scores 0-100%
# - Proper sessionIds
# - Content snippets
```

### Detailed Migration Instructions

#### Clean Archive (Optional)

If you want to clean up your archive structure before migration:

```bash
# Run cleanup script
node $(npm root -g)/c0ntextkeeper/scripts/cleanup-archive.js
```

This removes:
- Corrupted `.bak` files
- `.DS_Store` files
- Empty directories
- Malformed date folders

#### Understanding the Migration Script

The `fix-unknown-sessions.js` script:
- Scans all archives in `~/.c0ntextkeeper/archive/`
- Identifies sessions with "unknown" IDs
- Generates deterministic IDs based on content hash
- Creates format: `session-YYYYMMDD-hashcode`
- Saves a migration log for rollback if needed

#### Verify MCP Tools

After migration, test that MCP tools are working correctly:

```bash
# Test with dedicated script
node $(npm root -g)/c0ntextkeeper/scripts/test-mcp-tools.js
```

Expected output:
- Relevance scores between 0-100% (not 129%!)
- SessionIds like `session-20250915-a1b2c3d4`
- Natural language queries working
- Content snippets in results

### Troubleshooting

#### Issue: Still Seeing "Unknown" Sessions

If you still see "unknown" sessions after migration:

1. **Check Archive Location**
   ```bash
   c0ntextkeeper status
   ```
   Verify archives are in the expected location.

2. **Run Migration with Force**
   ```bash
   node $(npm root -g)/c0ntextkeeper/scripts/fix-unknown-sessions.js --force
   ```

3. **Check Permissions**
   Ensure you have write permissions to archive files.

#### Issue: Relevance Scores Still Over 100%

This indicates old code is still running:

1. **Clear npm cache and reinstall**
   ```bash
   npm cache clean --force
   npm uninstall -g c0ntextkeeper
   npm install -g c0ntextkeeper@0.7.4
   ```

2. **Restart Claude Code**
   Exit and restart Claude Code CLI to load updated MCP server.

#### Issue: Natural Language Queries Not Working

The new tokenization requires the updated build:

1. **Verify version**
   ```bash
   c0ntextkeeper --version
   # Should show: 0.7.4
   ```

2. **Test with simple query**
   ```bash
   c0ntextkeeper search "what have we been working on lately"
   ```

### What to Expect After Migration

#### Improved Query Matching
- Queries like "what have we been working on lately" now work
- Stop words (the, a, an, etc.) are automatically filtered
- Common terms are expanded (fix → fixed, fixes, fixing)
- Better matching with 60-day temporal decay

#### Better Output Quality
- SessionIds like `session-20250915-a1b2c3d4` instead of "unknown"
- Relevance scores properly displayed (e.g., 87%, not 129%)
- Content snippets included in results for context
- Clean truncation of long text with "..."

### Rolling Back (If Needed)

If you need to rollback to v0.7.4:

```bash
# Downgrade package
npm install -g c0ntextkeeper@0.7.4

# Note: Archives modified by migration script will retain new sessionIds
# This is harmless and actually beneficial
```

## v0.6.0 to v0.7.4 Migration

### Overview
Version 0.7.4 introduces automatic context loading via MCP resources, providing Claude Code with immediate project awareness on startup. This guide helps you upgrade from v0.6.0 to v0.7.4.

### Breaking Changes
None - v0.7.4 maintains full backward compatibility while adding auto-load capabilities.

### Key Features

#### 1. Automatic Context Loading
**New in v0.7.4:** Context automatically loads when Claude Code connects to the MCP server.

**Configuration:**
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "maxSizeKB": 50,
    "formatStyle": "summary"
  }
}
```

#### 2. MCP Resources
**Resource URIs:** Your context is now exposed as MCP resources:
- `context://project/{name}/current` - Main auto-loaded context
- `context://project/{name}/patterns` - Recurring patterns
- `context://project/{name}/knowledge` - Knowledge base

#### 3. New CLI Commands
```bash
# Preview what will be auto-loaded
c0ntextkeeper context preview

# Test different loading strategies
c0ntextkeeper context test

# Configure auto-load settings
c0ntextkeeper context configure
```

### Migration Steps

#### Step 1: Update Package
```bash
npm update c0ntextkeeper@0.7.4
```

#### Step 2: Enable Auto-Load (Optional - enabled by default)
```bash
c0ntextkeeper context configure --enable
```

#### Step 3: Verify Installation
```bash
c0ntextkeeper --version
# Should output: 0.7.4
```

### Performance Improvements
- All operations now execute in <10ms average
- Zero memory leaks with efficient stream processing
- Instant context availability on Claude Code startup

### Compatibility Notes
- Archives from v0.6.0 remain fully compatible
- Storage architecture unchanged from v0.6.0
- All existing hooks and tools continue to work

---

## v0.4.0 to v0.5.0 Migration

### Overview
Version 0.5.0 introduces critical fixes for Claude Code's JSONL format compatibility and significantly improves relevance scoring. This guide helps you upgrade from v0.4.0 to v0.5.0.

### Breaking Changes
None - v0.5.0 maintains full backward compatibility while adding support for Claude Code's format.

### Key Improvements

#### 1. Claude Code JSONL Format Support
**Before (v0.4.0):** Only supported simple string content format
```json
{
  "message": {
    "role": "user",
    "content": "How do I implement JWT?"
  }
}
```

**After (v0.5.0):** Full support for Claude Code's content array format
```json
{
  "message": {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "How do I implement JWT?"
      }
    ]
  }
}
```

#### 2. Relevance Scoring Improvements
**Before (v0.4.0):** User questions scored ~0.06 relevance
**After (v0.5.0):** User questions score 0.9-1.0 relevance

- Added 50+ semantic problem indicators
- Enhanced pattern matching for questions
- Better detection of technical problems
- Improved solution mapping

#### 3. Tool Tracking Enhancement
**Before (v0.4.0):** Tool usage extracted from simple fields
**After (v0.5.0):** Tool usage extracted from embedded content arrays

### Migration Steps

#### Step 1: Update Package
```bash
npm update c0ntextkeeper@0.5.0
```

#### Step 2: Rebuild Hooks (if using locally)
```bash
npm run build
c0ntextkeeper hooks reinstall
```

#### Step 3: Verify Installation
```bash
c0ntextkeeper --version
# Should output: 0.5.0
```

#### Step 4: Test Extraction
Run a test extraction to verify v0.5.0 is working:
```bash
node scripts/test-extraction.js
```

### Compatibility Notes

#### Transcript Formats
v0.5.0 supports both formats:
- ✅ Old format (string content) - still works
- ✅ New format (array content) - now supported

#### Existing Archives
- Archives created with v0.4.0 remain valid
- New archives will use extraction algorithm v0.5.0
- No need to regenerate old archives unless desired

#### Test Fixtures
If you have custom test fixtures, update them to Claude Code format:
```javascript
// Old format
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "Your question here"
  }
}

// New format (recommended)
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Your question here"
      }
    ]
  }
}
```

### Testing Your Migration

#### 1. Check Version
```bash
# In your project
cat package.json | grep '"c0ntextkeeper"'
# Should show: "c0ntextkeeper": "^0.5.0"
```

#### 2. Test Extraction
Create a test transcript with Claude format:
```bash
cat > test-transcript.jsonl << 'EOF'
{"type":"user","timestamp":"2025-09-02T10:00:00Z","message":{"role":"user","content":[{"type":"text","text":"How do I fix this error?"}]}}
{"type":"assistant","timestamp":"2025-09-02T10:00:01Z","message":{"role":"assistant","content":[{"type":"text","text":"I'll help you fix that error."}]}}
EOF

# Run extraction
c0ntextkeeper archive test-transcript.jsonl
```

#### 3. Verify Results
Check the generated archive has:
- `extractionVersion: "0.5.0"`
- Problems with relevance ~1.0 for user questions
- Proper content extraction

### Troubleshooting

#### Problem: Low relevance scores
**Solution:** Ensure you've rebuilt the project after updating:
```bash
npm run build
```

#### Problem: Content not extracted
**Solution:** Verify your transcript uses proper JSONL format with each entry on a single line.

#### Problem: TypeScript errors
**Solution:** The TranscriptEntry type now supports both formats:
```typescript
message?: {
  role: string;
  content: string | Array<{ type: string; text?: string; [key: string]: any }>;
};
```

### Feature Comparison

| Feature | v0.4.0 | v0.5.0 |
|---------|--------|--------|
| String content format | ✅ | ✅ |
| Array content format | ❌ | ✅ |
| Claude Code compatibility | ❌ | ✅ |
| User question relevance | ~0.06 | ~1.0 |
| Problem indicators | Basic | 50+ patterns |
| Tool extraction | Simple | Enhanced |
| Extraction algorithm | 0.2.0 | 0.5.0 |

### Support

If you encounter issues during migration:
1. Check the [GitHub Issues](https://github.com/Capnjbrown/c0ntextKeeper/issues)
2. Review test scripts in `/scripts` for examples
3. Run diagnostic scripts:
   - `scripts/test-extraction.js` - Test basic extraction
   - `scripts/validate-archive.js` - Validate generated archives
   - `scripts/test-complete-extraction.js` - Test all features

### Next Steps

After successful migration:
1. Monitor extraction quality with `c0ntextkeeper stats`
2. Review generated archives for improved relevance scores
3. Consider regenerating important archives with v0.5.0
4. Update any custom scripts to use Claude Code format

---

## Future Versions

### v0.8.0 (Planned)
- Vector database integration for semantic search
- Enhanced pattern recognition
- Multi-project context sharing

### v1.0.0 (Planned)
- Production-ready release
- Cloud sync capabilities
- Team collaboration features
- VS Code extension
- Web dashboard

---

*Last Updated: 2025-12-26 | c0ntextKeeper v0.7.8*