# 📚 c0ntextKeeper User Guide

> Last Updated: 2025-09-15 for v0.7.2

## 🎯 What's New in v0.7.2

### Enhanced MCP Tools Reliability
- **✅ Fixed Relevance Scoring** - Now properly capped at 100%
- **🆔 No More "Unknown" Sessions** - Every session gets a proper ID
- **🧠 Natural Language Queries** - Better understanding with stop word filtering
- **📝 Cleaner Output** - Results include meaningful content snippets
- **🔄 Migration Script** - Fix existing archives with unknown sessions

Run `node scripts/fix-unknown-sessions.js` to migrate existing archives.

## 🏗️ Storage Modes (v0.7.0+)

c0ntextKeeper v0.7.0 introduces flexible storage options to match your workflow:

### Project-Local Storage (Recommended)
```bash
# Initialize in your project directory
cd /path/to/your/project
c0ntextkeeper init
```
- Creates `.c0ntextkeeper/` within your project
- Keeps context with your code
- Portable with your project
- Can be added to version control (optional)

### Global Storage
```bash
# Initialize global storage for all projects
c0ntextkeeper init --global
```
- Uses `~/.c0ntextkeeper/` for all projects
- Shared context across projects
- Good for personal machines
- Centralized management

### How c0ntextKeeper Finds Your Storage

The system uses intelligent path resolution:
1. **Environment Variable**: Checks `CONTEXTKEEPER_HOME` first
2. **Current Directory**: Looks for `.c0ntextkeeper/` 
3. **Parent Directories**: Walks up the tree searching
4. **Global Fallback**: Uses `~/.c0ntextkeeper/` if nothing found

## Where Your Data Lives

c0ntextKeeper stores all data locally on your Mac. The exact location depends on your storage mode:

### Project-Local Storage Structure
```
/path/to/your/project/
├── .c0ntextkeeper/                     # ← Project-specific context
│   ├── config.json                     # Project configuration
│   ├── archive/                        # Session archives
│   │   ├── README.md                   # Analytics dashboard
│   │   ├── index.json                  # Session index
│   │   ├── sessions/                   # Work sessions
│   │   └── test/                       # Test data (separated)
│   ├── prompts/                        # Your questions
│   ├── patterns/                       # Tool usage patterns
│   ├── knowledge/                      # Q&A pairs
│   └── logs/                          # Execution logs
│
└── your-code-files...
```

### Global Storage Structure
```
/Users/jasonbrown/                      # Your home directory (~)
│
├── .claude/                            # Claude Code configuration
│   ├── settings.json                   # ← Hook configuration lives here
│   └── hooks/                          # Hook scripts
│
└── .c0ntextkeeper/                     # ← Global preserved context
    ├── config.json                     # Global configuration
    ├── archive/                        # Main archive storage
    │   ├── projects/                   # Per-project archives
    │   │   ├── c0ntextKeeper/          # Actual project names (not hashes!)
    │   │   │   ├── README.md           # 📊 Rich analytics dashboard
    │   │   │   ├── index.json          # Project statistics & tool usage
    │   │   │   ├── sessions/           # Individual JSON session files
    │   │   │   │   └── YYYY-MM-DD_HHMM_MT_description.json
    │   │   │   └── test/               # Test data (auto-separated)
    │   │   └── web-scraper/            # Another project
    │   └── global/                     
    │       └── index.json              # Master index (test-filtered)
    ├── prompts/                        # UserPromptSubmit hook data
    │   └── [project-name]/             # Same project names as archive/projects/
    │       └── YYYY-MM-DD-prompts.json       # Daily JSON array (not JSONL)
    ├── patterns/                       # PostToolUse hook data (includes MCP tools)
    │   └── [project-name]/             # Human-readable names
    │       └── YYYY-MM-DD-patterns.json      # Daily JSON array with MCP support
    ├── knowledge/                      # Stop hook Q&A pairs
    │   └── [project-name]/             # Consistent naming across all hooks
    │       └── YYYY-MM-DD-knowledge.json     # Daily JSON array
    ├── errors/                         # Error pattern tracking
    │   └── YYYY-MM-DD-errors.json            # Daily JSON array
    ├── solutions/                      # Indexed solutions
    │   └── index.json                  # Quick solution retrieval
    ├── index.json                      # Project registry (test-filtered)
    └── logs/                           # Hook execution logs
        └── hook.log                    # Debug information
```

**Important Notes:**
- All data is stored as formatted JSON (not JSONL) for readability
- Projects use human-readable names (e.g., `c0ntextKeeper`, not `a1b2c3d4`)
- Test projects are automatically filtered from the global index
- PostToolUse hook captures all MCP server tools (filesystem, sequential-thinking, etc.)
- Analytics dashboards are auto-generated with rich statistics

**Storage Consistency**: All hooks (PreCompact, UserPromptSubmit, PostToolUse, Stop) use the same human-readable project name structure. The system uses `path.basename()` of your project directory, with special characters replaced by dashes. For example, a project at `/Users/jane/my-awesome-app/` would be stored as `my-awesome-app`.

**Note:** Folders starting with `.` (dot) are hidden by default on macOS.

## 🔍 Checking Your Storage Configuration

Use the `status` command to see your current storage setup:

```bash
c0ntextkeeper status
```

Example output:
```
C0ntextKeeper Storage Status

Current Directory: /Users/jasonbrown/projects/my-app
Project Name: my-app
✓ Storage initialized (local)
  Location: /Users/jasonbrown/projects/my-app/.c0ntextkeeper
  Version: 0.7.0
  Created: 2025-09-09
  Type: project
```

### Storage Commands

```bash
# Initialize storage
c0ntextkeeper init              # Project-local (in current directory)
c0ntextkeeper init --global      # Global storage
c0ntextkeeper init --force       # Reinitialize existing storage

# Check status
c0ntextkeeper status             # Show current configuration

# View statistics
c0ntextkeeper stats              # Storage usage and metrics

# Search archives
c0ntextkeeper search             # Show 5 most recent archives
c0ntextkeeper search "query"     # Search for specific content
```

## 📊 Understanding Your Analytics Dashboard

Starting with v0.7.0, every project archive includes a comprehensive analytics dashboard in its README.md file with improved extraction accuracy, better session naming, and organized storage structure. Here's what you'll find:

### Project Analytics Section
- **Total Sessions**: Number of times context was preserved
- **Problems Solved**: Issues identified and resolved
- **Implementations**: Code changes and files created
- **Decisions Made**: Architectural and design choices
- **Patterns Identified**: Recurring approaches and solutions

### Tool Usage Analytics
- **Most Used Tools**: Your top 5 tools by frequency
- **Total Tool Invocations**: Sum of all tool uses
- **Unique Tools Used**: Different tools accessed
- **Tool Distribution**: Which tools you rely on most (Read, Write, Edit, Bash, etc.)

### Quality Metrics
- **Average Relevance Score**: How valuable your preserved context is (0-100%)
  - v0.5.0+: User questions now properly score 100% relevance
  - v0.5.1+: Administrative tools (TodoWrite, Bash) have enhanced scoring
  - Improved with 50+ semantic patterns for better detection
- **Files Modified**: Total unique files changed across sessions
- **Archive Version**: Version of c0ntextKeeper that created the archive
  - Note: The extraction algorithm version tracks improvements to context detection
  - Package version (npm) may differ from extraction version in some releases

### Session Details
Each session entry in the README shows:
- **Description**: What you were working on (v0.5.1: meaningful names, no more "that" or "then"!)
- **Stats**: Problems, implementations, decisions count (v0.5.1: preserves up to 2000 chars)
- **Tools Used**: Which tools were employed (v0.5.1: better file path tracking)
- **Key Issue**: The main problem addressed
- **Relevance**: How important this session was

### Example Dashboard View
```markdown
## 📊 Project Analytics

### Overview
- **Total Sessions**: 47
- **Problems Solved**: 234
- **Implementations**: 189
- **Decisions Made**: 56

### Tool Usage
- **Most Used Tools**: Read (892x), Edit (645x), Write (234x), Bash (456x), Grep (123x)
- **Total Tool Invocations**: 2,350
- **Unique Tools Used**: 15

### Quality Metrics
- **Average Relevance Score**: 72%
- **Files Modified**: 89 across all sessions
- **Archive Version**: v0.3.0
```

## How to Access Your Archives

### Method 1: Using Finder (Visual)

1. **Open Finder**
2. **Press `Cmd + Shift + G`** (Go to Folder)
3. **Enter one of these paths:**
   - `~/.c0ntextkeeper/archive` - See all your archives
   - `~/.claude` - See Claude Code settings

**Tip:** Press `Cmd + Shift + .` in Finder to show/hide hidden files

### Method 2: Using Terminal (Command Line)

```bash
# Open archive folder in Finder via terminal command
open ~/.c0ntextkeeper/archive

# List all archived sessions
ls -la ~/.c0ntextkeeper/archive/projects/*/sessions/

# View a specific archive (formatted)
cat ~/.c0ntextkeeper/archive/projects/*/sessions/*.json | jq '.'

# See how many archives you have
find ~/.c0ntextkeeper/archive -name "*.json" -type f | wc -l

# Check total storage used
du -sh ~/.c0ntextkeeper/
```

### Method 3: Using c0ntextKeeper CLI

```bash
# Search for specific content
c0ntextkeeper search "authentication"

# View statistics
c0ntextkeeper stats

# List recent patterns
c0ntextkeeper patterns

# Validate everything is working
c0ntextkeeper validate
```

### Method 4: Using Claude Code MCP Tools

In Claude Code, you can ask:
- "Use fetch_context to find my previous authentication work"
- "Use search_archive to find Redis configuration decisions"
- "Use get_patterns to show my common commands"

## How c0ntextKeeper Works Automatically

### Automatic Context Preservation

c0ntextKeeper works **completely automatically** through the PreCompact hook:

1. **Claude Code monitors context size** during your work
2. **When context gets large**, Claude Code automatically compacts
3. **PreCompact hook fires automatically** (no action needed!)
4. **Context is preserved** before it's lost
5. **You continue working** without interruption

This happens in addition to manual `/compact` commands - both trigger preservation!

### Available Hooks

c0ntextKeeper provides 4 hooks for different capture strategies:

| Hook | When It Fires | What It Captures | Storage Location | How to Enable |
|------|--------------|------------------|------------------|---------------|
| **PreCompact** | Before compaction (auto + manual) | Full session transcript (55s timeout) | `archive/projects/[name]/sessions/` | Enabled by default |
| **UserPromptSubmit** | When you send a message | Your questions (JSON array) | `archive/projects/[name]/prompts/YYYY-MM-DD-prompts.json` | `c0ntextkeeper hooks enable userprompt` |
| **PostToolUse** | After tool execution | Tool results + MCP tools (JSON array) | `archive/projects/[name]/patterns/YYYY-MM-DD-patterns.json` | `c0ntextkeeper hooks enable posttool` |
| **Stop** | After Claude responds | Q&A exchanges (JSON array) | `archive/projects/[name]/knowledge/YYYY-MM-DD-knowledge.json` | `c0ntextkeeper hooks enable stop` |

### Managing Hooks

```bash
# Check current status
c0ntextkeeper status

# List all hooks
c0ntextkeeper hooks list

# Enable additional hooks
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# View hook statistics
c0ntextkeeper hooks stats
```

## Understanding Your Archives

### What's in Each Archive File?

Each descriptively-named `.json` file in `sessions/` contains:

```json
{
  "sessionId": "unique-session-id",
  "timestamp": "2025-08-28T10:00:00Z",
  "projectPath": "/path/to/your/project",
  "problems": [
    {
      "question": "How do I implement authentication?",
      "relevance": 1.0,
      "solution": {
        "approach": "Use JWT tokens with refresh mechanism",
        "files": ["auth.ts", "middleware.ts"],
        "success": true
      }
    }
  ],
  "implementations": [
    {
      "tool": "mcp__filesystem__write_file",
      "file": "auth.ts",
      "description": "Implemented JWT authentication"
    }
  ],
  "decisions": [
    {
      "decision": "Use Redis for session storage",
      "rationale": "Better performance for key-value operations",
      "impact": "high"
    }
  ],
  "patterns": [
    {
      "type": "code",
      "value": "async/await pattern",
      "frequency": 15
    }
  ],
  "metadata": {
    "trigger": "manual",
    "filesModified": ["auth.ts", "middleware.ts"],
    "relevanceScore": 0.85,
    "toolsUsed": ["Write", "Edit", "mcp__filesystem__read_file"],
    "toolCounts": {"Write": 5, "Edit": 3, "mcp__filesystem__read_file": 10},
    "duration": 3600000,
    "extractionVersion": "0.7.0",
    "isTest": false
  }
}
```

**Key Features:**
- Problems with solutions and 1.0 relevance scoring for user questions
- Full MCP tool tracking in implementations
- Rich metadata with tool counts and statistics
- Test data flagged with `isTest: true`
- 2000 character limits for questions/solutions

### How Projects are Organized

- Each project uses its actual directory name (like `c0ntextKeeper`, `web-scraper`)
- Sessions have descriptive names showing what you worked on
- All sessions from the same project are grouped together
- Each project has a README.md for easy navigation
- This makes your archives intuitive and self-documenting

## Quick Reference Commands

### Essential CLI Commands (v0.7.1)

```bash
# Setup and Status
c0ntextkeeper setup           # Configure hooks (required after install)
c0ntextkeeper status          # Check storage and automation status
c0ntextkeeper validate        # Verify installation

# Search and Analytics
c0ntextkeeper search "query"  # Search archives for specific content
c0ntextkeeper search          # Show recent archives (no query needed)
c0ntextkeeper patterns        # Analyze recurring patterns
c0ntextkeeper stats           # Show storage statistics

# Context Management (NEW in v0.7.x)
c0ntextkeeper context preview     # Preview auto-loaded context
c0ntextkeeper context test        # Test context loading
c0ntextkeeper context configure --enable --strategy smart  # Configure auto-load

# Hook Management
c0ntextkeeper hooks list          # Show all hooks and status
c0ntextkeeper hooks enable Stop   # Enable additional hooks
c0ntextkeeper hooks test PreCompact  # Test a specific hook
```

### View Your Data

```bash
# See your Claude settings (including hooks)
cat ~/.claude/settings.json | jq '.'

# Open archives in your default JSON viewer
open ~/.c0ntextkeeper/archive/projects/*/sessions/*.json

# View latest archive
ls -t ~/.c0ntextkeeper/archive/projects/*/sessions/*.json | head -1 | xargs cat | jq '.'

# Search across all archives
grep -r "search-term" ~/.c0ntextkeeper/archive/
```

### Monitor Activity

```bash
# Watch hook execution in real-time
tail -f ~/.c0ntextkeeper/logs/hook.log

# See when archives were created
ls -lt ~/.c0ntextkeeper/archive/projects/*/sessions/

# Check if hook is configured
cat ~/.claude/settings.json | jq '.hooks.PreCompact'
```

### Manage Storage

```bash
# Check storage size
du -sh ~/.c0ntextkeeper/

# Count total archives
find ~/.c0ntextkeeper/archive -name "*.json" | wc -l

# Find archives older than 30 days
find ~/.c0ntextkeeper/archive -name "*.json" -mtime +30

# Backup your archives
cp -r ~/.c0ntextkeeper/archive ~/Desktop/c0ntextkeeper-backup
```

## Migrating Old Archives

If you have very old archives from early versions (before v0.6.0) with hash-based names (like `c77d2fa7`), you can migrate them to the current human-readable structure:

```bash
# Preview the migration (dry run)
c0ntextkeeper migrate --dry-run

# Apply the migration
c0ntextkeeper migrate

# If something goes wrong, restore from backup
c0ntextkeeper migrate:restore
```

The migration tool will:
- Convert hash directories to project names
- Rename session files with descriptive names
- Add README files for navigation
- Create a backup before making changes
- Preserve all your data integrity

## Frequently Asked Questions

### Does c0ntextKeeper work automatically?

**Yes!** Once installed, c0ntextKeeper works completely automatically:
- Claude Code automatically compacts when context gets large
- The PreCompact hook fires without any action from you
- Your context is preserved before it's lost
- You can also manually run `/compact` - both ways work!

### Where exactly is my data stored?

All your preserved context is stored in:
- **Main archives**: `~/.c0ntextkeeper/archive/`
- **User prompts**: `~/.c0ntextkeeper/prompts/` (if enabled)
- **Tool patterns**: `~/.c0ntextkeeper/patterns/` (if enabled)
- **Q&A knowledge**: `~/.c0ntextkeeper/knowledge/` (if enabled)
- **Configuration**: `~/.c0ntextkeeper/config.json`
- **Hook settings**: `~/.claude/settings.json`
- **Logs**: `~/.c0ntextkeeper/logs/`

The `~` symbol means your home directory (`/Users/yourusername/`)

### How do I view hidden folders on Mac?

**In Finder:**
- Press `Cmd + Shift + .` to toggle hidden files
- Or use `Cmd + Shift + G` and type the path

**In Terminal:**
- Hidden files are shown by default
- Use `ls -la` to list all files including hidden

### Can I move these files?

**No**, the files must stay in their specific locations:
- Claude Code looks for settings in `~/.claude/`
- c0ntextKeeper expects archives in `~/.c0ntextkeeper/`
- Moving them will break the integration

### How much disk space will this use?

Very minimal! Archives are JSON text files:

**With PreCompact only (default)**:
- Each session: ~5-50 KB (individual JSON files)
- 100 sessions: ~1-5 MB
- 1000 sessions: ~10-50 MB
- Performance: <10ms average operations
- Timeout protection: 55 seconds for large transcripts

**With all hooks enabled (JSON arrays)**:
- Daily prompts: ~10-50 KB per file
- Daily patterns: ~20-100 KB per file (includes MCP tools)
- Daily knowledge: ~15-75 KB per file
- Monthly total: ~22-45 MB
- Yearly total: ~270-550 MB

**Test Data**: Automatically separated and excluded from statistics

### What hooks are available?

c0ntextKeeper provides 4 hooks:
1. **PreCompact** - Captures full context (enabled by default)
2. **UserPromptSubmit** - Tracks your questions
3. **PostToolUse** - Captures tool usage patterns
4. **Stop** - Saves Q&A exchanges

Run `c0ntextkeeper hooks list` to see their status.

### How do I enable additional hooks?

```bash
# Enable a specific hook
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# Or enable all at once
c0ntextkeeper hooks enable userprompt && \
c0ntextkeeper hooks enable posttool && \
c0ntextkeeper hooks enable stop
```

### Is my data private and secure?

**Yes**, completely:
- ✅ All data stored locally on your Mac
- ✅ No cloud uploads
- ✅ No external API calls
- ✅ Sensitive data (passwords, API keys) automatically filtered
- ✅ Only accessible by your user account

### How do I know it's working?

Run this command:
```bash
c0ntextkeeper validate
```

You should see:
- ✅ Hook configured in settings.json
- ✅ Hook script exists
- ✅ Archive directory exists

### What happens during compaction?

**For both manual `/compact` AND automatic compaction**:

1. Claude Code triggers the PreCompact hook
2. c0ntextKeeper receives the transcript path
3. Context is extracted (problems, solutions, decisions)
4. Sensitive data is filtered out
5. Archive is saved to `~/.c0ntextkeeper/archive/`
6. You see a success message (manual) or it happens silently (automatic)

**Remember**: You don't need to do anything - automatic compaction preserves context without any action from you!

### Can I manually browse my archives?

Yes! The easiest ways:
```bash
# Open in Finder
open ~/.c0ntextkeeper/archive

# View in VS Code
code ~/.c0ntextkeeper/archive

# Use any JSON viewer
open -a "JSON Editor" ~/.c0ntextkeeper/archive/projects/*/sessions/*.json
```

### How do I search my archives?

Three ways:

1. **CLI Search**:
   ```bash
   c0ntextkeeper search "your search term"
   ```

2. **In Claude Code**:
   ```
   "Use search_archive to find [your query]"
   ```

3. **Terminal grep**:
   ```bash
   grep -r "search term" ~/.c0ntextkeeper/archive/
   ```

## Troubleshooting

### v0.7.1 Improvements

Many improvements and fixes in v0.7.1:

#### 504 Timeout Errors (FIXED)
**Previous Issue**: Hook would timeout during auto-compact with large transcripts
**Solution**: Implemented 55-second timeout protection
```bash
# Verify you have v0.7.1
c0ntextkeeper --version
# Should show: 0.7.1
```

#### "content.toLowerCase is not a function" (FIXED)
**Previous Issue**: Extraction failed with non-string content
**Solution**: Added comprehensive type guards
```bash
# Test extraction works
node scripts/test-extraction.js
# Should show: ✅ Extraction successful!
```

#### Generic Folder Names like "project" (FIXED)
**Previous Issue**: Archives used hash names or generic labels
**Solution**: Archives now use actual project names
```bash
# Your archives now show:
~/.c0ntextkeeper/archive/projects/c0ntextKeeper/  # Not "project"
~/.c0ntextkeeper/archive/projects/web-scraper/    # Not "validation"
```

### Common Issues

#### "Permission denied" errors

```bash
# Fix permissions
chmod 755 ~/.c0ntextkeeper
chmod 644 ~/.c0ntextkeeper/archive/projects/*/sessions/*.json
```

### Can't see archives after /compact

1. Check hook is installed:
   ```bash
   cat ~/.claude/settings.json | jq '.hooks.PreCompact'
   ```

2. Check logs for errors:
   ```bash
   tail -20 ~/.c0ntextkeeper/logs/hook.log
   ```

3. Reinstall if needed:
   ```bash
   c0ntextkeeper setup
   ```

### Archives not being created

1. **Enable file logging for debugging**:
```bash
export C0NTEXTKEEPER_FILE_LOGGING=true
```

2. **Check if extraction is working**:
```bash
# Run test extraction
node /Users/jasonbrown/Projects/c0ntextKeeper/scripts/test-extraction.js

# Should see:
# ✅ Extraction successful!
# Archive created: [path]
# Extraction statistics:
# - Problems: [number]
# - Implementations: [number]
```

3. **Monitor hook execution**:
```bash
# Watch logs in real-time during /compact
tail -f ~/.c0ntextkeeper/logs/hook.log
```

4. **Check for extraction issues**:
If archives are created but empty (0 problems, 0 implementations):
- This is fixed in v0.7.2 with improved extraction patterns
- Any user question (with "?") is now captured
- All tool uses are tracked, not just Write/Edit

### Path Case Sensitivity Issues

If you see "path not found" errors:
```bash
# Check your actual path case
ls -la ~/Projects  # Capital P?
ls -la ~/projects  # Lowercase p?

# Update settings.json with correct case
cat ~/.claude/settings.json | grep -i project
```

### Verifying Your Installation

Run these commands to ensure everything is working:

```bash
# 1. Check version (should be 0.7.2)
c0ntextkeeper --version

# 2. Validate installation
c0ntextkeeper validate
# Should show all green checkmarks

# 3. Test extraction
node scripts/test-extraction.js
# Should create a test archive

# 4. Check automation status
c0ntextkeeper status
# Should show: ✅ Automatic capture enabled

# 5. List your archives
ls -la ~/.c0ntextkeeper/archive/projects/
# Should show your project folders
```

## Support

- **Documentation**: See [README.md](../../README.md) and [Hook Integration](../technical/hook-integration.md)
- **Troubleshooting**: See the comprehensive troubleshooting section above
- **Issues**: https://github.com/Capnjbrown/c0ntextKeeper/issues
- **Logs**: Check `~/.c0ntextkeeper/logs/hook.log`
- **Version**: Current version is v0.7.2 with all improvements

Remember: Everything is stored locally on your Mac in hidden directories. Use the commands above to access and manage your preserved context!