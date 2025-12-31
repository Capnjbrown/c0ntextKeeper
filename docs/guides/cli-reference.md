# CLI Reference Guide

Complete reference for all c0ntextKeeper CLI commands. This guide covers all 30 commands with full examples and expected outputs.

> **Note**: The CLI command is `c0ntextkeeper` (all lowercase with zero).
> The project name is `c0ntextKeeper` (capital K), but commands are always lowercase.

## Command Structure

c0ntextKeeper provides **30 commands** organized as follows:

| Category | Count | Description |
|----------|-------|-------------|
| **Top-level commands** | 20 | Core commands like `setup`, `status`, `doctor`, `search`, etc. |
| **Hook subcommands** | 7 | Commands under `hooks` (`list`, `health`, `enable`, `disable`, `config`, `test`, `stats`) |
| **Context subcommands** | 3 | Commands under `context` (`preview`, `test`, `configure`) |
| **Total** | **30** | |

When you run `c0ntextkeeper --help`, you will see 21 entries (20 top-level commands + `help`). The hook and context subcommands are accessed via their parent commands (e.g., `c0ntextkeeper hooks list`).

## Quick Reference

| Command | Description |
|---------|-------------|
| **Core Commands** | |
| `setup` | Configure Claude Code hooks integration |
| `status` | Check automation and hook status |
| `doctor` | Run comprehensive health diagnostics |
| `validate` | Validate configuration and storage |
| **Search & Discovery** | |
| `search <query>` | Search archived context |
| `patterns` | View recurring patterns |
| `stats` | Display storage statistics |
| **Hook Management** | |
| `hooks list` | List all available hooks |
| `hooks health` | Check hook data health |
| `hooks enable <hook>` | Enable a specific hook |
| `hooks disable <hook>` | Disable a specific hook |
| `hooks config <hook>` | Configure hook settings |
| `hooks test <hook>` | Test a specific hook |
| `hooks stats` | View hook statistics |
| **Context Management** | |
| `context preview` | Preview auto-load context |
| `context test` | Test context loading |
| `context configure` | Configure auto-load settings |
| **Storage & Maintenance** | |
| `init` | Initialize storage directory |
| `archive <path>` | Archive a transcript file |
| `cleanup` | Clean up old archives |
| `rebuild-index` | Rebuild project indexes |
| `migrate` | Migrate to new storage format |
| `migrate:restore` | Restore from migration backup |
| **Development & Testing** | |
| `debug` | Debug mode with verbose output |
| `benchmark` | Run performance benchmarks |
| `test-hook` | Test hook integration |
| `test-mcp` | Test MCP tools |
| `server` | Start MCP server directly |

---

## Core Commands

### setup

Configure Claude Code hooks integration for automatic context preservation.

**Synopsis:**
```bash
c0ntextkeeper setup [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing hook configuration |
| `--minimal` | Install only essential hooks |

**Example:**
```bash
$ c0ntextkeeper setup

🔧 c0ntextKeeper Setup
━━━━━━━━━━━━━━━━━━━━━━

✅ Storage directory initialized
✅ Configuration created
✅ Claude Code hooks configured

📁 Storage: ~/.c0ntextkeeper/
🔗 Hooks: 7 hooks registered

Next steps:
1. Restart Claude Code to activate hooks
2. Run 'c0ntextkeeper status' to verify
3. Start a session - context will be preserved automatically!
```

**See Also:** `status`, `doctor`, `validate`

---

### status

Check the current automation and hook status.

**Synopsis:**
```bash
c0ntextkeeper status
```

**Example:**
```bash
$ c0ntextkeeper status

┌─────────────────────────────────────────────────────────────┐
│                   c0ntextKeeper Status                      │
├─────────────────────────────────────────────────────────────┤
│  Version: 0.7.8                                             │
│  Storage: ~/.c0ntextkeeper/                                 │
├─────────────────────────────────────────────────────────────┤
│  🟢 Automation: ACTIVE                                      │
│  🟢 MCP Server: Configured                                  │
│  🟢 Hooks: 7/7 enabled                                      │
├─────────────────────────────────────────────────────────────┤
│  📊 Archives: 42 sessions                                   │
│  📁 Storage: 2.4 MB                                         │
│  🔄 Last Activity: 5 minutes ago                            │
└─────────────────────────────────────────────────────────────┘
```

**See Also:** `doctor`, `hooks list`, `stats`

---

### doctor

Run comprehensive health diagnostics to identify and fix issues.

**Synopsis:**
```bash
c0ntextkeeper doctor [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--fix` | Attempt to fix detected issues |
| `--verbose` | Show detailed diagnostic information |

**Example:**
```bash
$ c0ntextkeeper doctor

🏥 c0ntextKeeper Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking storage...
  ✅ Storage directory exists
  ✅ Write permissions OK
  ✅ Archive structure valid

Checking configuration...
  ✅ Config file valid
  ✅ All required fields present

Checking hooks...
  ✅ PreCompact hook configured
  ✅ SessionStart hook configured
  ✅ SessionEnd hook configured
  ✅ Notification hook configured
  ✅ Stop hook configured
  ✅ PostToolUse hook configured
  ✅ UserPromptSubmit hook configured

Checking MCP server...
  ✅ Server binary accessible
  ✅ MCP configuration valid

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All 11 checks passed
🎉 c0ntextKeeper is healthy!
```

**See Also:** `validate`, `status`

---

### validate

Validate configuration and storage integrity.

**Synopsis:**
```bash
c0ntextkeeper validate [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--strict` | Enable strict validation mode |

**Example:**
```bash
$ c0ntextkeeper validate

🔍 Validating c0ntextKeeper Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/4: Checking storage directory...
  ✅ Directory exists: ~/.c0ntextkeeper/

Step 2/4: Validating configuration...
  ✅ Config file valid

Step 3/4: Checking archive integrity...
  ✅ 42 archives validated
  ✅ No corrupted files found

Step 4/4: Verifying hook integration...
  ✅ Claude Code hooks file exists
  ✅ c0ntextKeeper hooks registered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Validation complete - all checks passed
```

**See Also:** `doctor`, `status`

---

## Search & Discovery

### search

Search through archived context for specific information.

**Synopsis:**
```bash
c0ntextkeeper search <query> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 10) |
| `-s, --scope <scope>` | Search scope: session, project, global |
| `--min-relevance <n>` | Minimum relevance score (0-1) |

**Example:**
```bash
$ c0ntextkeeper search "authentication"

🔍 Search Results for "authentication"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 3 relevant contexts:

┌─ Result 1 ─────────────────────────────────────┐
│ 📊 Relevance: 87%                              │
│ 📅 Date: Dec 28, 2025 2:34 PM                  │
│ 📁 Project: site-profiler                      │
├────────────────────────────────────────────────┤
│ 🎯 Problem:                                    │
│ Implement JWT authentication for API endpoints │
│                                                │
│ ✅ Solution:                                   │
│ Created auth middleware using jose library     │
│ with refresh token rotation                    │
└────────────────────────────────────────────────┘

┌─ Result 2 ─────────────────────────────────────┐
│ 📊 Relevance: 72%                              │
│ 📅 Date: Dec 25, 2025 10:15 AM                 │
│ 📁 Project: site-profiler                      │
├────────────────────────────────────────────────┤
│ 🎯 Problem:                                    │
│ Session management for authenticated users     │
│                                                │
│ ✅ Solution:                                   │
│ Implemented cookie-based sessions with         │
│ secure httpOnly flags                          │
└────────────────────────────────────────────────┘

💡 Tip: Use --limit to see more results
```

**See Also:** `patterns`, `stats`

---

### patterns

View recurring patterns extracted from your sessions.

**Synopsis:**
```bash
c0ntextkeeper patterns [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Filter by type: code, command, architecture, all |
| `-l, --limit <n>` | Maximum patterns to show (default: 10) |
| `--min-frequency <n>` | Minimum occurrence count (default: 2) |

**Example:**
```bash
$ c0ntextkeeper patterns

📊 Recurring Patterns
━━━━━━━━━━━━━━━━━━━━━

Found 15 patterns (showing top 10):

🔧 Code Patterns
────────────────
1. async/await error handling     (12 occurrences)
   └─ try-catch with typed errors

2. React useEffect cleanup        (8 occurrences)
   └─ AbortController pattern

3. TypeScript strict null checks  (7 occurrences)
   └─ Optional chaining with defaults

⚡ Command Patterns
────────────────────
4. npm run build && npm test      (15 occurrences)
   └─ Build verification workflow

5. git stash → work → pop         (6 occurrences)
   └─ Context switching pattern

🏗️ Architecture Patterns
─────────────────────────
6. Repository pattern             (4 occurrences)
   └─ Data access abstraction

7. Middleware chain               (3 occurrences)
   └─ Request processing pipeline

💡 Use --type to filter by pattern type
```

**See Also:** `search`, `stats`

---

### stats

Display storage statistics and usage insights.

**Synopsis:**
```bash
c0ntextkeeper stats [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--project <path>` | Show stats for specific project |

**Example:**
```bash
$ c0ntextkeeper stats

📈 c0ntextKeeper Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Storage Overview
────────────────
📁 Total Size: 2.4 MB
📦 Archives: 42 sessions
📊 Patterns: 187 unique patterns

Project Breakdown
─────────────────
┌──────────────────┬──────────┬─────────┐
│ Project          │ Sessions │ Size    │
├──────────────────┼──────────┼─────────┤
│ site-profiler    │ 28       │ 1.6 MB  │
│ c0ntextKeeper    │ 10       │ 0.6 MB  │
│ webcrawler       │ 4        │ 0.2 MB  │
└──────────────────┴──────────┴─────────┘

Activity Insights
─────────────────
📅 First archive: Dec 10, 2025
📅 Last archive: Dec 30, 2025
🔄 Avg sessions/day: 2.1
⭐ Top tool: Edit (847 uses)

💡 Run 'c0ntextkeeper cleanup' to free up space
```

**See Also:** `search`, `patterns`, `cleanup`

---

## Hook Management

### hooks list

List all available hooks and their current status.

**Synopsis:**
```bash
c0ntextkeeper hooks list
```

**Example:**
```bash
$ c0ntextkeeper hooks list

🪝 Available Hooks
━━━━━━━━━━━━━━━━━

┌────────────────┬─────────┬──────────────────────────────────┐
│ Hook           │ Status  │ Description                      │
├────────────────┼─────────┼──────────────────────────────────┤
│ PreCompact     │ 🟢 ON   │ Archive before context compact   │
│ SessionStart   │ 🟢 ON   │ Track session beginnings         │
│ SessionEnd     │ 🟢 ON   │ Track session endings            │
│ Notification   │ 🟢 ON   │ Capture notifications            │
│ Stop           │ 🟢 ON   │ Handle stop events               │
│ PreToolUse     │ 🟢 ON   │ Pre-tool execution hook          │
│ PostToolUse    │ 🟢 ON   │ Post-tool execution hook         │
└────────────────┴─────────┴──────────────────────────────────┘

💡 Use 'hooks enable/disable <hook>' to change status
```

**See Also:** `hooks health`, `hooks enable`, `hooks disable`

---

### hooks health

Check the health of hook data and identify issues.

**Synopsis:**
```bash
c0ntextkeeper hooks health
```

**Example:**
```bash
$ c0ntextkeeper hooks health

🏥 Hook Health Report
━━━━━━━━━━━━━━━━━━━━━

Data Counts
───────────
📦 PreCompact archives: 42
📝 Session records: 156
🔔 Notifications: 89
⚡ Tool events: 1,247

Last Activity
─────────────
🕐 PreCompact: 5 minutes ago
🕐 SessionStart: 5 minutes ago
🕐 Notification: 2 hours ago

Health Status
─────────────
✅ All hooks responding normally
✅ No stale data detected
✅ Storage within limits

💡 Everything looks healthy!
```

**See Also:** `hooks list`, `hooks stats`, `doctor`

---

### hooks enable

Enable a specific hook.

**Synopsis:**
```bash
c0ntextkeeper hooks enable <hook>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `hook` | Hook name: PreCompact, SessionStart, SessionEnd, Notification, Stop, PreToolUse, PostToolUse |

**Example:**
```bash
$ c0ntextkeeper hooks enable PreCompact

✅ Hook 'PreCompact' enabled successfully

🔄 Restart Claude Code for changes to take effect
```

**See Also:** `hooks disable`, `hooks list`

---

### hooks disable

Disable a specific hook.

**Synopsis:**
```bash
c0ntextkeeper hooks disable <hook>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `hook` | Hook name to disable |

**Example:**
```bash
$ c0ntextkeeper hooks disable Notification

✅ Hook 'Notification' disabled successfully

⚠️ Notifications will no longer be captured
🔄 Restart Claude Code for changes to take effect
```

**See Also:** `hooks enable`, `hooks list`

---

### hooks config

Configure settings for a specific hook.

**Synopsis:**
```bash
c0ntextkeeper hooks config <hook> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `hook` | Hook name to configure |

**Options:**
| Option | Description |
|--------|-------------|
| `--set <key=value>` | Set a configuration value |
| `--get <key>` | Get a configuration value |
| `--reset` | Reset to default configuration |

**Example:**
```bash
$ c0ntextkeeper hooks config PreCompact --set minRelevance=0.5

✅ Configuration updated for 'PreCompact'

Current settings:
  minRelevance: 0.5
  maxItems: 100
  includePatterns: true
```

**See Also:** `hooks list`, `hooks test`

---

### hooks test

Test a specific hook with sample data.

**Synopsis:**
```bash
c0ntextkeeper hooks test <hook>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `hook` | Hook name to test |

**Example:**
```bash
$ c0ntextkeeper hooks test PreCompact

🧪 Testing PreCompact Hook
━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Creating test transcript...
  ✅ Test data generated

Step 2: Invoking hook handler...
  ✅ Hook executed successfully

Step 3: Verifying output...
  ✅ Archive created correctly
  ✅ Context extracted: 3 problems, 5 implementations

━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PreCompact hook is working correctly
```

**See Also:** `hooks list`, `test-hook`

---

### hooks stats

View detailed statistics for all hooks.

**Synopsis:**
```bash
c0ntextkeeper hooks stats
```

**Example:**
```bash
$ c0ntextkeeper hooks stats

📊 Hook Statistics
━━━━━━━━━━━━━━━━━━

Archive Summary
───────────────
📦 Total archives: 42
📁 Storage used: 2.4 MB
📊 Avg archive size: 58 KB

Hook Activity (Last 7 Days)
───────────────────────────
┌────────────────┬───────────┬─────────────┐
│ Hook           │ Triggers  │ Last Active │
├────────────────┼───────────┼─────────────┤
│ PreCompact     │ 12        │ 5 min ago   │
│ SessionStart   │ 45        │ 5 min ago   │
│ SessionEnd     │ 43        │ 1 hour ago  │
│ Notification   │ 28        │ 2 hours ago │
│ PostToolUse    │ 1,247     │ 5 min ago   │
└────────────────┴───────────┴─────────────┘

💡 PreCompact is your most valuable hook -
   it preserves context before compaction!
```

**See Also:** `hooks health`, `stats`

---

## Context Management

### context preview

Preview what context will be auto-loaded for a project.

**Synopsis:**
```bash
c0ntextkeeper context preview [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--project <path>` | Preview for specific project |
| `--format <fmt>` | Output format: text, json, markdown |

**Example:**
```bash
$ c0ntextkeeper context preview

📄 Context Preview for: c0ntextKeeper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Auto-Load Strategy: recent
Items to load: 5

Preview Content:
────────────────

## Recent Context (5 items)

1. 🎯 TypeScript lint warning fixes
   └─ Fixed ToolInput interface, reduced warnings 104→96

2. 🎯 Open source release preparation
   └─ Phases 1-4 complete, security audit passed

3. 🔧 Per-session hook storage
   └─ Atomic writes with unique file naming

4. 💡 Decision: Remove SubagentStop hook
   └─ Claude Code doesn't provide required fields

5. 🏗️ Pattern: Error handling with typed errors
   └─ Consistent try-catch with custom error types

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Estimated size: ~2.1 KB
```

**See Also:** `context test`, `context configure`

---

### context test

Test context loading with actual output.

**Synopsis:**
```bash
c0ntextkeeper context test [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed loading process |

**Example:**
```bash
$ c0ntextkeeper context test

🧪 Testing Context Auto-Load
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Loading context for: c0ntextKeeper

Step 1: Reading configuration...
  ✅ Auto-load enabled
  ✅ Strategy: recent

Step 2: Fetching context...
  ✅ Found 42 archives
  ✅ Selected 5 most relevant

Step 3: Formatting output...
  ✅ Generated 2.1 KB of context

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sample Output:
──────────────
# Project Context: c0ntextKeeper

## Recent Problems & Solutions

### TypeScript Lint Warning Fixes
- Created ToolInput interface for type safety
- Fixed 8 public API warnings
- Reduced total warnings from 104 to 96

[... truncated for preview ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Context loading successful!
```

**See Also:** `context preview`, `context configure`

---

### context configure

Configure auto-load settings through an interactive wizard.

**Synopsis:**
```bash
c0ntextkeeper context configure
```

**Example:**
```bash
$ c0ntextkeeper context configure

⚙️ Context Auto-Load Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Settings:
  Enabled: Yes
  Strategy: recent
  Max items: 5
  Include types: problems, implementations, decisions

? Enable auto-load? (Y/n) Y
? Select strategy:
  ❯ recent    - Load most recent context
    relevant  - Load most relevant to current work
    mixed     - Combine recent and relevant

? Maximum items to load: 5
? Include types: (space to select)
  ✔ Problems & solutions
  ✔ Implementations
  ✔ Decisions
  ◯ Patterns

✅ Configuration saved!

💡 Context will auto-load on next session start
```

**See Also:** `context preview`, `context test`

---

## Storage & Maintenance

### init

Initialize the storage directory structure.

**Synopsis:**
```bash
c0ntextkeeper init [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--path <path>` | Custom storage path (default: ~/.c0ntextkeeper) |
| `--force` | Reinitialize existing storage |

**Example:**
```bash
$ c0ntextkeeper init

📁 Initializing c0ntextKeeper Storage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creating directories...
  ✅ ~/.c0ntextkeeper/
  ✅ ~/.c0ntextkeeper/archive/
  ✅ ~/.c0ntextkeeper/archive/projects/
  ✅ ~/.c0ntextkeeper/archive/global/
  ✅ ~/.c0ntextkeeper/config/

Creating default configuration...
  ✅ config.json created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Storage initialized successfully!

Next: Run 'c0ntextkeeper setup' to configure hooks
```

**See Also:** `setup`, `validate`

---

### archive

Manually archive a transcript file.

**Synopsis:**
```bash
c0ntextkeeper archive <transcript-path> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `transcript-path` | Path to the JSONL transcript file |

**Options:**
| Option | Description |
|--------|-------------|
| `--project <path>` | Associate with specific project |
| `--session <id>` | Specify session ID |

**Example:**
```bash
$ c0ntextkeeper archive ~/.claude/sessions/abc123.jsonl

📦 Archiving Transcript
━━━━━━━━━━━━━━━━━━━━━━━

Reading transcript...
  ✅ 247 entries found

Extracting context...
  ✅ 3 problems identified
  ✅ 12 implementations extracted
  ✅ 2 decisions captured
  ✅ 5 patterns detected

Saving archive...
  ✅ Saved to: ~/.c0ntextkeeper/archive/projects/myproject/session_abc123.json

━━━━━━━━━━━━━━━━━━━━━━━
✅ Archive created successfully!
📊 Relevance score: 0.85
```

**See Also:** `search`, `stats`

---

### cleanup

Clean up old archives to free storage space.

**Synopsis:**
```bash
c0ntextkeeper cleanup [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be deleted without deleting |
| `--older-than <days>` | Delete archives older than N days (default: 90) |
| `--keep-min <n>` | Keep minimum N archives per project |
| `--force` | Skip confirmation prompt |

**Example:**
```bash
$ c0ntextkeeper cleanup --dry-run

🧹 Cleanup Preview (Dry Run)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scanning archives...

Archives to remove (older than 90 days):
┌────────────────┬─────────────┬────────────┐
│ Project        │ Archives    │ Size       │
├────────────────┼─────────────┼────────────┤
│ old-project    │ 15          │ 1.2 MB     │
│ test-repo      │ 8           │ 0.4 MB     │
└────────────────┴─────────────┴────────────┘

Summary:
  📦 Archives to remove: 23
  💾 Space to reclaim: 1.6 MB
  📁 Archives to keep: 42

⚠️ This is a dry run. Run without --dry-run to delete.
```

**See Also:** `stats`, `rebuild-index`

---

### rebuild-index

Rebuild project indexes from archive files.

**Synopsis:**
```bash
c0ntextkeeper rebuild-index [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--project <path>` | Rebuild for specific project only |
| `--force` | Force rebuild even if index is valid |

**Example:**
```bash
$ c0ntextkeeper rebuild-index

🔄 Rebuilding Indexes
━━━━━━━━━━━━━━━━━━━━━

Scanning projects...
  Found 3 projects

Rebuilding indexes:
  ✅ site-profiler (28 sessions)
  ✅ c0ntextKeeper (10 sessions)
  ✅ webcrawler (4 sessions)

Updating global patterns...
  ✅ 187 patterns indexed

━━━━━━━━━━━━━━━━━━━━━
✅ All indexes rebuilt successfully!
```

**See Also:** `validate`, `cleanup`

---

### migrate

Migrate archives to a new storage format.

**Synopsis:**
```bash
c0ntextkeeper migrate [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--dry-run` | Show migration plan without executing |
| `--backup` | Create backup before migration (default: true) |
| `--from <version>` | Source format version |

**Example:**
```bash
$ c0ntextkeeper migrate

🔄 Storage Migration
━━━━━━━━━━━━━━━━━━━━

Current version: 0.6.0
Target version: 0.7.8

Creating backup...
  ✅ Backup saved to: ~/.c0ntextkeeper/backup-20251230/

Migrating archives...
  ✅ site-profiler: 28 sessions migrated
  ✅ c0ntextKeeper: 10 sessions migrated
  ✅ webcrawler: 4 sessions migrated

Updating configuration...
  ✅ Config migrated to new format

━━━━━━━━━━━━━━━━━━━━
✅ Migration complete!

💡 Run 'c0ntextkeeper validate' to verify
```

**See Also:** `migrate:restore`, `validate`

---

### migrate:restore

Restore from a migration backup.

**Synopsis:**
```bash
c0ntextkeeper migrate:restore [backup-path]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `backup-path` | Path to backup directory (optional - uses most recent) |

**Example:**
```bash
$ c0ntextkeeper migrate:restore

🔄 Restore from Backup
━━━━━━━━━━━━━━━━━━━━━━

Available backups:
  1. backup-20251230 (2.4 MB) - 30 minutes ago
  2. backup-20251225 (2.1 MB) - 5 days ago

? Select backup to restore: 1

Restoring...
  ✅ Archives restored
  ✅ Configuration restored
  ✅ Indexes rebuilt

━━━━━━━━━━━━━━━━━━━━━━
✅ Restore complete!
```

**See Also:** `migrate`, `validate`

---

## Development & Testing

### debug

Run c0ntextkeeper with verbose debug output.

**Synopsis:**
```bash
c0ntextkeeper debug [command] [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--level <level>` | Debug level: info, debug, trace |
| `--component <name>` | Filter to specific component |

**Example:**
```bash
$ c0ntextkeeper debug search "test"

🔧 Debug Mode Active
━━━━━━━━━━━━━━━━━━━━

[DEBUG] Initializing ContextRetriever
[DEBUG] Storage path: ~/.c0ntextkeeper/
[DEBUG] Loading project index for: c0ntextKeeper
[DEBUG] Found 10 sessions in index
[DEBUG] Searching with query: "test"
[DEBUG] Relevance scoring: TF-IDF + semantic matching
[DEBUG] Found 3 results above threshold (0.3)
[DEBUG] Formatting results...

🔍 Search Results for "test"
... (normal output follows)
```

**See Also:** `doctor`, `validate`

---

### benchmark

Run performance benchmarks on extraction and search operations.

**Synopsis:**
```bash
c0ntextkeeper benchmark [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--iterations <n>` | Number of iterations (default: 100) |
| `--component <name>` | Benchmark specific component |

**Example:**
```bash
$ c0ntextkeeper benchmark

⚡ Performance Benchmark
━━━━━━━━━━━━━━━━━━━━━━━

Running 100 iterations...

Results:
┌─────────────────────┬─────────┬─────────┬─────────┐
│ Operation           │ Min     │ Avg     │ Max     │
├─────────────────────┼─────────┼─────────┼─────────┤
│ Context extraction  │ 2.3 ms  │ 4.7 ms  │ 12.1 ms │
│ Pattern matching    │ 0.8 ms  │ 1.2 ms  │ 3.4 ms  │
│ Search (10 results) │ 1.5 ms  │ 2.8 ms  │ 8.2 ms  │
│ Index load          │ 3.1 ms  │ 5.4 ms  │ 15.7 ms │
└─────────────────────┴─────────┴─────────┴─────────┘

Summary:
  ✅ All operations under 10ms target
  📊 187 patterns processed
  💾 Memory usage: 45 MB peak

💡 Performance is within expected parameters
```

**See Also:** `debug`, `stats`

---

### test-hook

Test hook integration with Claude Code.

**Synopsis:**
```bash
c0ntextkeeper test-hook [hook-name] [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `hook-name` | Specific hook to test (optional - tests all) |

**Options:**
| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed test output |
| `--simulate` | Simulate hook without actual execution |

**Example:**
```bash
$ c0ntextkeeper test-hook PreCompact

🧪 Hook Integration Test
━━━━━━━━━━━━━━━━━━━━━━━━

Testing: PreCompact

Step 1: Check hook registration...
  ✅ Hook registered in Claude Code settings

Step 2: Validate handler script...
  ✅ Script exists and is executable

Step 3: Test with sample input...
  ✅ Handler executed successfully
  ✅ Output format valid

Step 4: Verify archive creation...
  ✅ Test archive created
  ✅ Content structure valid

━━━━━━━━━━━━━━━━━━━━━━━━
✅ PreCompact hook test passed!
```

**See Also:** `hooks test`, `test-mcp`

---

### test-mcp

Test MCP tools and server functionality.

**Synopsis:**
```bash
c0ntextkeeper test-mcp [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--tool <name>` | Test specific tool only |
| `--verbose` | Show detailed request/response |

**Example:**
```bash
$ c0ntextkeeper test-mcp

🧪 MCP Server Test
━━━━━━━━━━━━━━━━━━

Starting test server...
  ✅ Server started on stdio

Testing tools:
  ✅ fetch_context - Working
     └─ Returned 5 contexts in 12ms

  ✅ search_archive - Working
     └─ Found 3 results for test query

  ✅ get_patterns - Working
     └─ Returned 10 patterns in 8ms

Testing resources:
  ✅ context://project/c0ntextKeeper/current
  ✅ context://project/c0ntextKeeper/patterns

━━━━━━━━━━━━━━━━━━
✅ All MCP tests passed!
```

**See Also:** `server`, `test-hook`

---

### server

Start the MCP server directly (mainly for debugging).

**Synopsis:**
```bash
c0ntextkeeper server [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--stdio` | Use stdio transport (default) |
| `--debug` | Enable debug logging |

**Example:**
```bash
$ c0ntextkeeper server

🚀 Starting c0ntextKeeper MCP Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version: 0.7.8
Transport: stdio
Project: c0ntextKeeper

Available tools:
  • fetch_context
  • search_archive
  • get_patterns

Available resources:
  • context://project/*/current
  • context://project/*/patterns

Server ready. Waiting for requests...
^C to stop
```

**See Also:** `test-mcp`, `doctor`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONTEXTKEEPER_HOME` | Storage directory path | `~/.c0ntextkeeper` |
| `C0NTEXTKEEPER_DEBUG` | Enable debug logging | `false` |
| `C0NTEXTKEEPER_LOG_LEVEL` | Log level: error, warn, info, debug | `info` |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Configuration error |
| `3` | Storage error |
| `4` | Hook error |

---

## Common Workflows

### New Project Setup

```bash
# Initialize storage (if first time)
c0ntextkeeper init

# Configure hooks for Claude Code
c0ntextkeeper setup

# Verify everything is working
c0ntextkeeper doctor

# Check status
c0ntextkeeper status
```

### Troubleshooting Issues

```bash
# Run health diagnostics
c0ntextkeeper doctor

# Validate configuration
c0ntextkeeper validate

# Check hook health
c0ntextkeeper hooks health

# Enable debug logging
C0NTEXTKEEPER_DEBUG=true c0ntextkeeper status
```

### Searching Past Context

```bash
# Search for specific topic
c0ntextkeeper search "authentication"

# View patterns
c0ntextkeeper patterns

# Check storage stats
c0ntextkeeper stats
```

### Maintenance

```bash
# Preview cleanup without deleting
c0ntextkeeper cleanup --dry-run

# Clean old archives (90+ days)
c0ntextkeeper cleanup --older-than 90

# Rebuild indexes if corrupted
c0ntextkeeper rebuild-index
```

---

## See Also

- [User Guide](./user-guide.md) - Getting started and usage
- [MCP Guide](./mcp-guide.md) - Natural language search and MCP tools
- [Quick Start](./quickstart.md) - 5-minute setup guide
- [Hooks Reference](../technical/hooks-reference.md) - Detailed hook documentation
- [MCP Tools Reference](../technical/mcp-tools.md) - Technical MCP documentation
