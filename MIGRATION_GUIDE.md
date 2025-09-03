# c0ntextKeeper Migration Guide

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

### v0.6.0 (Planned)
- Vector database integration for semantic search
- Enhanced pattern recognition
- Multi-project context sharing

### v1.0.0 (Planned)
- Production-ready release
- Cloud sync capabilities
- Team collaboration features

---

*Last Updated: 2025-09-02*