# Storage Architecture

## Overview

c0ntextKeeper implements a sophisticated hybrid storage architecture that supports both project-local and global storage configurations. The system uses intelligent path resolution, human-readable project names, and comprehensive test isolation to maintain clean, organized archives.

> **📝 Note on Directory Creation**: Storage directories are created **on-demand** when their corresponding hooks are enabled and triggered. Only the `sessions/` directory exists by default (since PreCompact is enabled by default). Other directories (`knowledge/`, `patterns/`, `prompts/`, `notifications/`, `sessions-meta/`) are created automatically when you enable their respective hooks and they capture their first data.

## Storage Resolution Algorithm

```
1. Check CONTEXTKEEPER_FORCE_GLOBAL environment variable (force global)
2. Check CONTEXTKEEPER_HOME environment variable (custom path)
3. Search for .c0ntextkeeper/ in current directory
4. Walk up directory tree looking for .c0ntextkeeper/
5. Fall back to ~/.c0ntextkeeper/ (global)
```

### Special Case: c0ntextKeeper Development
When developing c0ntextKeeper itself, the project **always uses global storage** to avoid recursive confusion. This is enforced via the `.env` file with `CONTEXTKEEPER_FORCE_GLOBAL=true`.

## Directory Structures

### Project-Local Structure
Located at `[project-root]/.c0ntextkeeper/`

```
.c0ntextkeeper/
├── archive/                   # Main session archives (FileStore basePath)
│   └── projects/              # Per-project storage
│       └── [project-name]/    # Human-readable name (from directory)
│           ├── sessions/       # Individual JSON session files (PreCompact)
│           │   └── YYYY-MM-DD_HHMM_MT_[description].json
│           ├── knowledge/      # Stop hook Q&A pairs
│           │   └── YYYY-MM-DD-knowledge.json
│           ├── patterns/       # PostToolUse hook data
│           │   └── YYYY-MM-DD-patterns.json
│           ├── prompts/        # UserPromptSubmit hook data
│           │   └── YYYY-MM-DD-prompts.json
│           ├── notifications/  # Notification hook data (v0.7.7)
│           │   └── YYYY-MM-DD-notifications.json
│           ├── sessions-meta/  # SessionStart/End hook data (v0.7.7)
│           │   └── YYYY-MM-DD-sessions.json
│           ├── test/           # Test data (auto-separated)
│           ├── search-index.json  # Inverted index for fast search (v0.7.5)
│           ├── index.json      # Project statistics & tool tracking
│           └── README.md       # Auto-generated analytics dashboard
├── config.json                # Project-specific configuration
└── logs/                      # Hook execution logs
    └── hook.log
```

**Actual Implementation Note**: Project-local storage follows the same structure as global, but is located at the project root. The code in `src/storage/file-store.ts` and `src/utils/path-resolver.ts` creates these directories as needed.

### Global Structure
Located at `~/.c0ntextkeeper/`

```
.c0ntextkeeper/
├── archive/                   # Main session archives (FileStore basePath)
│   └── projects/              # Per-project storage
│       └── [project-name]/    # Actual project names (e.g., "c0ntextKeeper")
│           ├── sessions/       # Individual JSON session files (PreCompact)
│           │   └── YYYY-MM-DD_HHMM_MT_[description].json
│           ├── knowledge/      # Stop hook Q&A pairs
│           │   └── YYYY-MM-DD-knowledge.json
│           ├── patterns/       # PostToolUse hook data
│           │   └── YYYY-MM-DD-patterns.json
│           ├── prompts/        # UserPromptSubmit hook data
│           │   └── YYYY-MM-DD-prompts.json
│           ├── notifications/  # Notification hook data (v0.7.7)
│           │   └── YYYY-MM-DD-notifications.json
│           ├── sessions-meta/  # SessionStart/End hook data (v0.7.7)
│           │   └── YYYY-MM-DD-sessions.json
│           ├── test/           # Test data (auto-separated)
│           ├── search-index.json  # Inverted index for O(1) lookups (v0.7.5)
│           ├── index.json      # Project analytics & statistics
│           └── README.md       # Auto-generated analytics dashboard
├── config.json                # Global configuration
├── index.json                 # Project registry (test projects filtered)
└── logs/                      # Hook execution logs
    └── hook.log
```

**Note**: The `errors/`, `solutions/`, and `subagents/` directories shown in older documentation are not currently created by the implemented code. Sessions contain error patterns within their JSON structure. The SubagentStop hook was removed in v0.7.8 as Claude Code deprecated the SubagentStop event.

**Key Features:**
- Projects organized by actual name (e.g., `c0ntextKeeper`, not `a1b2c3d4`)
- Test projects automatically filtered from index
- All data stored as formatted JSON (not JSONL)
- MCP tools tracked in patterns
- Auto-generated analytics dashboards

## Configuration Hierarchy

1. **Environment Variables** (highest priority)
   - `CONTEXTKEEPER_FORCE_GLOBAL`: Force global storage (set to `true` for c0ntextKeeper itself)
   - `CONTEXTKEEPER_HOME`: Override storage location with custom path

2. **Project Configuration** (`.c0ntextkeeper/config.json`)
   - Project-specific settings
   - Hook configurations
   - Archive preferences

3. **Global Configuration** (`~/.c0ntextkeeper/config.json`)
   - User defaults
   - Shared settings
   - Global preferences

## Implementation Details

### Path Resolution Module
- Location: `src/utils/path-resolver.ts`
- Exports: `getStoragePath()`, `getProjectStorageInfo()`, `initializeStorage()`

### Storage Module Updates
- Location: `src/storage/file-store.ts`
- Uses path resolver for all file operations

### Configuration Module
- Location: `src/core/config.ts`
- Merges global and project configurations

## Usage

### Initialize Project-Local Storage
```bash
# Initialize in current project
c0ntextkeeper init

# With custom project name
c0ntextkeeper init --project-name "my-project"

# Force reinitialize
c0ntextkeeper init --force
```

### Initialize Global Storage
```bash
# Initialize global storage
c0ntextkeeper init --global
```

### Check Storage Status
```bash
# Show current storage configuration
c0ntextkeeper status
```

### Environment Variable Override
```bash
# Use custom storage location
export CONTEXTKEEPER_HOME=/custom/path
c0ntextkeeper status

# Force global mode (used for c0ntextKeeper development)
export CONTEXTKEEPER_FORCE_GLOBAL=true
c0ntextkeeper archive transcript.jsonl

# Or set in .env file for persistent configuration
echo "CONTEXTKEEPER_FORCE_GLOBAL=true" >> .env
```

## Benefits

### Project-Local Storage
- **Portability**: Archives travel with the repository
- **Privacy**: Sensitive data stays within project
- **Isolation**: No cross-project contamination
- **Version Control**: Can be tracked in git (optional)

### Global Storage
- **Cross-Project**: Share insights between projects
- **Centralized**: Single location for all archives
- **Efficiency**: Avoid duplication across projects
- **Patterns**: Identify common solutions globally

## Migration Path

For existing installations using global storage:

1. Projects can be migrated individually using `c0ntextkeeper init`
2. Global storage remains accessible with `--global` flag
3. No data loss during migration
4. Backwards compatible with existing workflows

### Example Migration
```bash
# Check current storage
c0ntextkeeper status

# Initialize project-local storage
cd /path/to/project
c0ntextkeeper init

# Verify new storage
c0ntextkeeper status

# Old global archives still accessible
c0ntextkeeper search --global "old query"
```

## Storage Selection Guidelines

### Use Project-Local Storage When:
- Working on sensitive/proprietary projects
- Need portability across machines
- Want to share archives with team via git
- Prefer isolated project contexts

### Use Global Storage When:
- Working on multiple related projects
- Want to identify cross-project patterns
- Have limited disk space per project
- Prefer centralized management

## File Organization

### Session Files
```
archive/projects/[name]/sessions/YYYY-MM-DD_HHMM_MT_description.json
```
- Date-based naming for chronological ordering
- Descriptive suffixes for easy identification (e.g., "authentication-implementation")
- Individual JSON files with full extracted context
- 2000 character limits for questions/solutions
- Relevance scoring with multi-factor analysis

### Daily Aggregations (Hook Data)
```
archive/projects/[name]/knowledge/YYYY-MM-DD-knowledge.json      # Stop hook Q&A pairs
archive/projects/[name]/patterns/YYYY-MM-DD-patterns.json        # PostToolUse data (with MCP tools)
archive/projects/[name]/prompts/YYYY-MM-DD-prompts.json          # UserPromptSubmit data
archive/projects/[name]/notifications/YYYY-MM-DD-notifications.json  # Notification hook (v0.7.7)
archive/projects/[name]/sessions-meta/YYYY-MM-DD-sessions.json   # SessionStart/End (v0.7.7)
```
- Daily JSON arrays (not JSONL) for readability
- Prevents unbounded file growth
- Automatic date-based organization
- MCP tool support in patterns (filesystem, sequential-thinking, etc.)
- All 7 hooks now supported with dedicated storage categories
- Test data automatically excluded

### Test Data Separation
```
archive/projects/[name]/test/validation-*.json
```
- Test sessions automatically identified and isolated
- Excluded from statistics and project indexes
- Test projects filtered from global index
- Prevents pollution from `/tmp`, `/var/folders`, test patterns
- Identified by `isTest: true` flag in metadata
- Environment variable `CONTEXTKEEPER_TEST_MODE` for test runs

## Security Considerations

### Project-Local Storage
- Respects file system permissions
- Can be excluded from git via .gitignore
- Isolated to project directory
- No global access required

### Global Storage
- User-specific directory (~/.c0ntextkeeper)
- Protected by user permissions
- Shared across all user's projects
- Central point for management

## Troubleshooting

### Storage Not Found
```bash
# Check resolution order
c0ntextkeeper status

# Force initialization
c0ntextkeeper init --force
```

### Permission Issues
```bash
# Check permissions
ls -la .c0ntextkeeper/

# Fix permissions
chmod 755 .c0ntextkeeper/
chmod 644 .c0ntextkeeper/config.json
```

### Environment Variable Issues
```bash
# Verify environment
echo $CONTEXTKEEPER_HOME
echo $CONTEXTKEEPER_FORCE_GLOBAL

# Clear environment
unset CONTEXTKEEPER_HOME
unset CONTEXTKEEPER_FORCE_GLOBAL

# Check .env file
cat .env | grep CONTEXTKEEPER
```

## Advanced Configuration

### Custom Storage Location
```json
// .c0ntextkeeper/config.json
{
  "storage": {
    "basePath": "/custom/archive/path",
    "retentionDays": 180,
    "compressionEnabled": true
  }
}
```

### Hook-Specific Storage
```json
// Configure different storage for different hooks
{
  "hooks": {
    "preCompact": {
      "storage": "local"
    },
    "userPromptSubmit": {
      "storage": "global"
    }
  }
}
```

### Project Registry
```json
// ~/.c0ntextkeeper/index.json
{
  "projects": {
    "abc123def456": {
      "path": "/Users/user/project",
      "name": "my-project",
      "storageType": "local",
      "lastAccessed": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

*Last Updated: 2025-12-26 | c0ntextKeeper v0.7.8*