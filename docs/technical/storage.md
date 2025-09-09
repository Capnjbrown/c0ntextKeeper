# Storage Architecture

## Overview

c0ntextkeeper implements a hybrid storage architecture that supports both project-local and global storage configurations. This design allows for maximum flexibility while maintaining clear separation of concerns.

## Storage Resolution Algorithm

```
1. Check CONTEXTKEEPER_HOME environment variable
2. Search for .c0ntextkeeper/ in current directory
3. Walk up directory tree looking for .c0ntextkeeper/
4. Fall back to ~/.c0ntextkeeper/ (global)
```

## Directory Structures

### Project-Local Structure
Located at `[project-root]/.c0ntextkeeper/`

```
.c0ntextkeeper/
├── archive/
│   ├── sessions/         # Session JSON files
│   ├── test/            # Validation data
│   ├── index.json       # Session index
│   └── README.md        # Auto-generated dashboard
├── prompts/             # Daily prompt aggregations
├── patterns/            # Extracted patterns
├── knowledge/           # Q&A pairs
├── errors/              # Error patterns
├── solutions/           # Local solutions
├── config.json          # Project configuration
└── logs/               # Execution logs
```

### Global Structure
Located at `~/.c0ntextkeeper/`

```
.c0ntextkeeper/
├── projects/            # Per-project storage (by hash)
│   └── [hash]/         # Project-specific data
├── global/             
│   └── solutions/      # Shared solutions
├── config.json         # Global configuration
├── index.json          # Project registry
└── logs/              # Global logs
```

## Configuration Hierarchy

1. **Environment Variables** (highest priority)
   - `CONTEXTKEEPER_HOME`: Override storage location
   - `CONTEXTKEEPER_GLOBAL`: Force global mode

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

# Force global mode
export CONTEXTKEEPER_GLOBAL=true
c0ntextkeeper archive transcript.jsonl
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
archive/sessions/YYYY-MM-DD_HHMM_MT_description.json
```
- Date-based naming for chronological ordering
- Descriptive suffixes for easy identification
- JSON format for readability

### Daily Aggregations
```
prompts/YYYY-MM-DD-prompts.json
patterns/YYYY-MM-DD-patterns.json
knowledge/YYYY-MM-DD-knowledge.json
```
- Daily files prevent unbounded growth
- JSON arrays for easy appending
- Automatic date-based organization

### Test Data Separation
```
archive/test/validation-*.json
```
- Test sessions isolated from production data
- Excluded from statistics and indexes
- Clear separation for debugging

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
echo $CONTEXTKEEPER_GLOBAL

# Clear environment
unset CONTEXTKEEPER_HOME
unset CONTEXTKEEPER_GLOBAL
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

*Last Updated: 2025-09-08 | c0ntextKeeper v0.5.3*