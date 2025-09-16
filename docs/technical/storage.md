# Storage Architecture

## Overview

c0ntextKeeper implements a sophisticated hybrid storage architecture that supports both project-local and global storage configurations. The system uses intelligent path resolution, human-readable project names, and comprehensive test isolation to maintain clean, organized archives.

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
├── archive/
│   ├── projects/
│   │   └── [project-name]/     # Human-readable name
│   │       ├── sessions/        # Individual JSON files
│   │       ├── test/           # Test data (auto-separated)
│   │       ├── index.json      # Project statistics
│   │       └── README.md       # Analytics dashboard
│   └── global/
│       └── index.json          # Cross-project index
├── prompts/                    # UserPromptSubmit hook data
│   └── [project-name]/         # Same as archive/projects/
│       └── YYYY-MM-DD-prompts.json    # Daily JSON arrays
├── patterns/                   # PostToolUse hook data
│   └── [project-name]/         # Human-readable names
│       └── YYYY-MM-DD-patterns.json   # Daily JSON arrays (with MCP tools)
├── knowledge/                  # Stop hook Q&A pairs
│   └── [project-name]/         # Consistent naming
│       └── YYYY-MM-DD-knowledge.json  # Daily JSON arrays
├── errors/                     # Error patterns
│   └── YYYY-MM-DD-errors.json         # Daily JSON arrays
├── solutions/                  # Solutions index
│   └── index.json
├── config.json                 # Project configuration
└── logs/                       # Execution logs
    └── hook.log
```

### Global Structure
Located at `~/.c0ntextkeeper/`

```
.c0ntextkeeper/
├── archive/
│   ├── projects/               # Per-project storage
│   │   ├── c0ntextKeeper/     # Actual project names!
│   │   │   ├── sessions/       # Individual JSON sessions
│   │   │   ├── test/          # Test data (auto-filtered)
│   │   │   ├── index.json     # Project analytics
│   │   │   └── README.md      # Dashboard
│   │   └── web-scraper/        # Another project
│   └── global/
│       └── index.json         # Master index (test-filtered)
├── prompts/                   # Hook data by project name
│   └── [project-name]/        # Same names as archive/projects/
│       └── YYYY-MM-DD-prompts.json
├── patterns/                  # Tool patterns (includes MCP)
│   └── [project-name]/        # Human-readable names
│       └── YYYY-MM-DD-patterns.json
├── knowledge/                 # Q&A knowledge base
│   └── [project-name]/        # Consistent across all hooks
│       └── YYYY-MM-DD-knowledge.json
├── errors/                    # Error tracking
│   └── YYYY-MM-DD-errors.json
├── solutions/
│   └── index.json
├── config.json               # Global configuration
├── index.json               # Project registry (test-filtered)
└── logs/                    # Global logs
    └── hook.log
```

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
archive/projects/[name]/prompts/YYYY-MM-DD-prompts.json     # UserPromptSubmit data
archive/projects/[name]/patterns/YYYY-MM-DD-patterns.json   # PostToolUse data (with MCP tools)
archive/projects/[name]/knowledge/YYYY-MM-DD-knowledge.json # Stop hook Q&A pairs
errors/YYYY-MM-DD-errors.json             # Error patterns
```
- Daily JSON arrays (not JSONL) for readability
- Prevents unbounded file growth
- Automatic date-based organization
- MCP tool support in patterns (filesystem, sequential-thinking, etc.)
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

*Last Updated: 2025-09-09 | c0ntextKeeper v0.7.2*