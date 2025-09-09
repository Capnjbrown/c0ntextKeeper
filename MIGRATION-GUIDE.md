# Migration Guide

## Migrating to v0.6.0 (Hybrid Storage Architecture)

Version 0.6.0 introduces a flexible hybrid storage system that supports both project-local and global storage. This guide helps you migrate from earlier versions.

### What's Changed

#### Storage Architecture
- **New**: Project-local storage in `.c0ntextkeeper/` directories
- **New**: Intelligent path resolution with directory tree walking
- **New**: Environment variable override via `CONTEXTKEEPER_HOME`
- **New**: Configuration merging (global + project configs)
- **Maintained**: Full backwards compatibility with global storage

#### New Commands
- `c0ntextkeeper init` - Initialize project-local storage
- `c0ntextkeeper init --global` - Initialize global storage
- `c0ntextkeeper status` - Check storage configuration

### Migration Paths

#### Option 1: Keep Using Global Storage (No Action Required)
If you're happy with global storage at `~/.c0ntextkeeper/`, **no migration is needed**. Version 0.6.0 is fully backwards compatible.

```bash
# Your existing setup continues to work
c0ntextkeeper search  # Still searches global storage
c0ntextkeeper stats   # Still shows global statistics
```

#### Option 2: Migrate to Project-Local Storage (Recommended)
To start using project-local storage for better organization:

```bash
# 1. Navigate to your project
cd /path/to/your/project

# 2. Initialize project-local storage
c0ntextkeeper init

# 3. Optionally copy existing archives
cp -r ~/.c0ntextkeeper/archive/projects/your-project/* .c0ntextkeeper/archive/

# 4. Verify the migration
c0ntextkeeper status
c0ntextkeeper search
```

#### Option 3: Hybrid Approach
Use both global and project-local storage:

```bash
# Global storage for shared patterns
c0ntextkeeper init --global

# Project storage for specific projects
cd /path/to/project
c0ntextkeeper init

# The system automatically finds the right storage
c0ntextkeeper status  # Shows current storage location
```

### Environment Variables

#### Custom Storage Location
```bash
# Set custom storage path
export CONTEXTKEEPER_HOME=/custom/path/storage

# All commands now use this location
c0ntextkeeper status
```

#### Force Global Mode
```bash
# Always use global storage
export CONTEXTKEEPER_GLOBAL=true

# Even in projects with local storage
c0ntextkeeper status  # Uses ~/.c0ntextkeeper/
```

### Backwards Compatibility

Version 0.6.0 maintains full backwards compatibility:

- ✅ Existing global storage continues to work
- ✅ All hooks find storage automatically
- ✅ MCP tools work with both storage modes
- ✅ CLI commands adapt to storage location
- ✅ No configuration changes required

### Common Scenarios

#### Moving Project Archives to Local Storage
```bash
# Find your project hash
ls ~/.c0ntextkeeper/archive/projects/

# Initialize local storage
cd /path/to/project
c0ntextkeeper init

# Copy archives (replace PROJECT_NAME with actual name)
cp -r ~/.c0ntextkeeper/archive/projects/PROJECT_NAME/* \
      .c0ntextkeeper/archive/

# Verify
c0ntextkeeper search
```

#### Sharing Storage Across Team
```bash
# Initialize in project
c0ntextkeeper init

# Add to version control (optional)
git add .c0ntextkeeper/
git commit -m "Add c0ntextkeeper storage"

# Team members pull and use immediately
git pull
c0ntextkeeper status  # Automatically detects storage
```

#### Using Different Storage Per Project
```bash
# Project A: Local storage
cd /projects/project-a
c0ntextkeeper init

# Project B: Global storage
cd /projects/project-b
# Don't run init - uses global by default

# Project C: Custom location
cd /projects/project-c
CONTEXTKEEPER_HOME=/data/archives c0ntextkeeper init
```

### Troubleshooting

#### Storage Not Found
```bash
# Check current storage location
c0ntextkeeper status

# Force initialization if needed
c0ntextkeeper init --force
```

#### Wrong Storage Location
```bash
# Check resolution path
echo $CONTEXTKEEPER_HOME  # Check environment
ls -la .c0ntextkeeper/    # Check local
ls -la ~/.c0ntextkeeper/  # Check global
```

#### Hooks Not Finding Storage
```bash
# Rebuild the project
npm run build

# Reinstall hooks
c0ntextkeeper setup --force
```

### Best Practices

1. **Use Project-Local for Active Projects**
   - Keeps context with code
   - Easy to archive with project
   - Can be version controlled

2. **Use Global for Personal Patterns**
   - Cross-project learnings
   - Shared solutions
   - Personal knowledge base

3. **Document Storage Choice**
   - Add to project README
   - Include in onboarding docs
   - Specify in .env.example

### Version History

- **v0.6.0**: Hybrid storage architecture
- **v0.5.3**: JSON format standardization
- **v0.5.1**: Content preservation improvements
- **v0.5.0**: Claude Code compatibility fixes
- **v0.4.0**: Open source preparation
- **v0.3.0**: Analytics dashboard
- **v0.2.0**: Critical bug fixes
- **v0.1.0**: Initial release

### Getting Help

If you encounter issues during migration:

1. Check the [troubleshooting section](#troubleshooting)
2. Run `c0ntextkeeper validate` for diagnostics
3. Review logs at `.c0ntextkeeper/logs/hook.log`
4. Open an issue at [GitHub](https://github.com/Capnjbrown/c0ntextKeeper/issues)

### Summary

Version 0.6.0's hybrid storage is designed to be:
- **Flexible**: Choose the best storage for your workflow
- **Backwards Compatible**: No breaking changes
- **Intelligent**: Automatically finds the right storage
- **Simple**: Just run `c0ntextkeeper init` to get started

No immediate action is required - your existing setup continues to work!