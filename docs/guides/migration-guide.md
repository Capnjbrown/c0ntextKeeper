# c0ntextKeeper Migration Guide

## v0.6.0 to v0.7.0 Migration

### Overview
Version 0.7.0 introduces automatic context loading via MCP resources, providing Claude Code with immediate project awareness on startup. This guide helps you upgrade from v0.6.0 to v0.7.0.

### Breaking Changes
None - v0.7.0 maintains full backward compatibility while adding auto-load capabilities.

### Key Features

#### 1. Automatic Context Loading
**New in v0.7.0:** Context automatically loads when Claude Code connects to the MCP server.

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
npm update c0ntextkeeper@0.7.0
```

#### Step 2: Enable Auto-Load (Optional - enabled by default)
```bash
c0ntextkeeper context configure --enable
```

#### Step 3: Verify Installation
```bash
c0ntextkeeper --version
# Should output: 0.7.0
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

### v0.7.0 (Planned)
- Vector database integration for semantic search
- Enhanced pattern recognition
- Multi-project context sharing

### v1.0.0 (Planned)
- Production-ready release
- Cloud sync capabilities
- Team collaboration features

---

*Last Updated: 2025-09-02*