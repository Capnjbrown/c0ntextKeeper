# c0ntextKeeper Scripts

> Last Updated: 2025-09-15 for v0.7.2

This directory contains utility scripts for c0ntextKeeper maintenance, testing, and migration.

## Production Scripts

### setup-hooks.js
**Purpose**: Install and configure Claude Code hooks

```bash
node scripts/setup-hooks.js
```

Automatically:
- Detects Claude Code installation
- Installs PreCompact hook
- Configures hook settings
- Verifies installation

### fix-unknown-sessions.js (v0.7.2)
**Purpose**: Fix existing archives with "unknown" sessionIds

```bash
node scripts/fix-unknown-sessions.js
```

Features:
- Scans all archives in `~/.c0ntextkeeper/archive/`
- Identifies sessions with "unknown" IDs
- Generates deterministic IDs based on content hash
- Creates migration log with results
- Safe - creates backups before modifying

**Migration Example**:
```
Scanning archives...
Found 43 files to check
Fixed 14 files with unknown sessionIds
Migration log saved to: ~/.c0ntextkeeper/archive/migration-log-1757968760690.json
```

### cleanup-archive.js (v0.7.2)
**Purpose**: Clean and organize archive structure

```bash
node scripts/cleanup-archive.js
```

Removes:
- Corrupted `.bak` files
- `.DS_Store` files
- Empty directories
- Malformed date folders
- Duplicate entries

**Safety**: Creates backups before any destructive operations

## Testing Scripts

### test-mcp-tools.js (v0.7.2)
**Purpose**: Comprehensive testing of MCP tools functionality

```bash
node scripts/test-mcp-tools.js
```

Tests:
1. **fetch_context** - Multiple query types including:
   - Natural language queries
   - Technical terms
   - Multiple keywords
   - Empty queries (recent contexts)
2. **search_archive** - Archive searching
3. **get_patterns** - Pattern recognition

**Expected Output**:
```
🧪 Testing c0ntextKeeper MCP Tools with Natural Language

1️⃣ Testing fetch_context with various queries...
   ✅ Found 3 contexts
   📊 Relevance: 100% (properly capped)
   🆔 Session: session-20250915-a1b2c3d4 (no unknowns)
   
2️⃣ Testing search_archive...
   ✅ Found 10 search results

3️⃣ Testing get_patterns...
   ✅ Found 10 patterns
```

### test-extraction.js
**Purpose**: Test context extraction from sample transcripts

```bash
node scripts/test-extraction.js [transcript-file]
```

Features:
- Tests extraction patterns
- Validates relevance scoring
- Checks content limits
- Verifies JSON output

## Development Scripts

### validate-public-ready.sh
**Purpose**: Validate project is ready for public release

```bash
./scripts/validate-public-ready.sh
```

Checks:
- No sensitive data in code
- All tests passing
- Documentation complete
- Version consistency
- License present
- Security vulnerabilities

### post-install.js
**Purpose**: Post-installation setup (runs automatically)

Called by npm after installation to:
- Create necessary directories
- Set up default configuration
- Initialize storage structure
- Display welcome message

## Usage Examples

### Complete Migration to v0.7.2
```bash
# 1. Update package
npm update -g c0ntextkeeper@0.7.2

# 2. Fix unknown sessions
node $(npm root -g)/c0ntextkeeper/scripts/fix-unknown-sessions.js

# 3. Clean archive structure
node $(npm root -g)/c0ntextkeeper/scripts/cleanup-archive.js

# 4. Test MCP tools
node $(npm root -g)/c0ntextkeeper/scripts/test-mcp-tools.js
```

### Development Testing
```bash
# Test extraction on sample
node scripts/test-extraction.js samples/claude-transcript.jsonl

# Validate before release
./scripts/validate-public-ready.sh

# Test MCP tools locally
npm run build
node scripts/test-mcp-tools.js
```

### Troubleshooting Archives
```bash
# Check for issues
ls -la ~/.c0ntextkeeper/archive/projects/

# Fix unknown sessions
node scripts/fix-unknown-sessions.js

# Clean up corrupted files
node scripts/cleanup-archive.js

# Verify fixes
c0ntextkeeper search "test query"
```

## Script Safety

All scripts follow these principles:
1. **Non-destructive by default** - Create backups before modifications
2. **Dry-run mode** - Most scripts support `--dry-run` to preview changes
3. **Logging** - Detailed logs of all operations
4. **Validation** - Check preconditions before execution
5. **Rollback** - Migration scripts create logs for potential rollback

## Adding New Scripts

When adding new scripts:
1. Follow naming convention: `action-target.js`
2. Add comprehensive JSDoc comments
3. Include `--help` flag support
4. Log operations to console
5. Create backups for destructive operations
6. Update this README

## Requirements

- Node.js 18.0.0 or higher
- c0ntextKeeper installed (global or local)
- Write permissions to archive directory
- For shell scripts: bash/zsh

## Common Issues

### Permission Denied
```bash
chmod +x scripts/*.sh
```

### Module Not Found
```bash
npm install
npm run build
```

### Archives Not Found
```bash
c0ntextkeeper status
# Check archive location
```

## Support

For issues with scripts:
1. Check script output for error messages
2. Review logs in `~/.c0ntextkeeper/logs/`
3. Report issues: https://github.com/Capnjbrown/c0ntextKeeper/issues