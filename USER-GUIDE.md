# 📚 c0ntextKeeper User Guide

## Where Your Data Lives on Your Mac

c0ntextKeeper stores all data locally on your Mac in hidden directories within your home folder. Here's exactly where everything is located:

```
/Users/jasonbrown/                      # Your home directory (~)
│
├── .claude/                            # Claude Code configuration
│   ├── settings.json                   # ← Hook configuration lives here
│   └── hooks/                          # Hook scripts
│       └── c0ntextkeeper-hook.sh       # Wrapper script for debugging
│
└── .c0ntextkeeper/                     # ← All your preserved context
    ├── config.json                     # Hook and system configuration
    ├── archive/                        # PreCompact hook data
    │   ├── global/                     
    │   │   └── index.json              # Master index of all archives
    │   └── projects/                   # Per-project archives
    │       ├── c77d2fa7/               # Project identified by hash
    │       │   ├── index.json          # Project-specific index
    │       │   └── sessions/           # Individual work sessions
    │       │       └── 2025-08-28-*.json
    │       └── [other-project-hash]/
    │           └── sessions/
    ├── prompts/                        # UserPromptSubmit hook data
    │   └── [project-hash]/
    │       └── 2025-08-28-prompts.jsonl
    ├── patterns/                       # PostToolUse hook data
    │   └── [project-hash]/
    │       └── 2025-08-28-tools.jsonl
    ├── knowledge/                      # Stop hook data
    │   └── [project-hash]/
    │       └── 2025-08-28-qa.jsonl
    ├── errors/                         # Error patterns
    │   └── error-patterns.jsonl
    ├── solutions/                      # Indexed solutions
    │   └── index.json
    └── logs/                           # Hook execution logs
        └── hook.log                    # Debug information
```

**Note:** Folders starting with `.` (dot) are hidden by default on macOS.

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
# Open archive folder in Finder
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
| **PreCompact** | Before compaction (auto + manual) | Full session transcript | `~/.c0ntextkeeper/archive/` | Enabled by default |
| **UserPromptSubmit** | When you send a message | Your questions | `~/.c0ntextkeeper/prompts/` | `c0ntextkeeper hooks enable userprompt` |
| **PostToolUse** | After tool execution | Tool results | `~/.c0ntextkeeper/patterns/` | `c0ntextkeeper hooks enable posttool` |
| **Stop** | After Claude responds | Q&A exchanges | `~/.c0ntextkeeper/knowledge/` | `c0ntextkeeper hooks enable stop` |

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

Each `.json` file in `sessions/` contains:

```json
{
  "sessionId": "unique-session-id",
  "timestamp": "2025-08-28T10:00:00Z",
  "projectPath": "/path/to/your/project",
  "problems": [
    // Problems you encountered and solutions
  ],
  "implementations": [
    // Code you wrote or modified
  ],
  "decisions": [
    // Architectural decisions made
  ],
  "patterns": [
    // Recurring commands or approaches
  ],
  "metadata": {
    "trigger": "manual",  // or "auto"
    "filesModified": ["file1.ts", "file2.js"],
    "relevanceScore": 0.85
  }
}
```

### How Projects are Organized

- Each project gets a unique hash (like `c77d2fa7`)
- The hash is based on your project path
- All sessions from the same project are grouped together
- This keeps your contexts organized by project

## Quick Reference Commands

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
- Each session: ~5-50 KB
- 100 sessions: ~1-5 MB
- 1000 sessions: ~10-50 MB

**With all hooks enabled**:
- Daily usage: ~750KB-1.5MB
- Monthly: ~22-45 MB
- Yearly: ~270-550 MB

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

### "Permission denied" errors

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

Enable debug mode:
```bash
export C0NTEXTKEEPER_DEBUG=true
# Then restart Claude Code and try /compact again
```

## Support

- **Documentation**: See `README.md` and `HOOK-INTEGRATION.md`
- **Issues**: https://github.com/Capnjbrown/c0ntextKeeper/issues
- **Logs**: Check `~/.c0ntextkeeper/logs/hook.log`

Remember: Everything is stored locally on your Mac in hidden directories. Use the commands above to access and manage your preserved context!