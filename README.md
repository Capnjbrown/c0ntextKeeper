# 🧠 c0ntextKeeper

> Fully automatic context preservation for Claude Code - Never lose valuable work again!
>
> Last Updated: 2025-10-06

[![npm version](https://img.shields.io/npm/v/c0ntextkeeper.svg)](https://www.npmjs.com/package/c0ntextkeeper)
[![Downloads](https://img.shields.io/npm/dt/c0ntextkeeper.svg)](https://www.npmjs.com/package/c0ntextkeeper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)
[![🤖 Fully Automatic](https://img.shields.io/badge/🤖-Fully%20Automatic-success)](https://github.com/yourusername/c0ntextKeeper#-how-it-works-automatically)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/yourusername/c0ntextKeeper?style=social)](https://github.com/yourusername/c0ntextKeeper/stargazers)

## 🎯 Why c0ntextKeeper?

**Never lose valuable context again!** c0ntextKeeper automatically preserves your Claude Code work before compaction (both manual `/compact` and automatic), making it instantly retrievable through **highly reliable MCP tools** with enhanced natural language understanding.

### 🎁 Works Out of the Box
- **Zero Configuration** - Install and immediately start preserving context
- **Automatic Detection** - Recognizes your project and creates proper archives
- **Instant MCP Tools** - Three powerful retrieval tools ready immediately
- **Smart Defaults** - Optimized settings for 99% of use cases
- **No Learning Curve** - Works exactly as you'd expect

### ✨ Key Benefits
- 🎁 **Out of the Box** - Works immediately with zero configuration required
- 🎯 **Auto-Load Context** - Claude automatically reads your project context on startup
- 🤖 **Fully Automatic** - Preserves context without any manual intervention
- ⚡ **Blazing Fast** - All operations under 10ms average performance
- 🧠 **Intelligent Extraction** - 187 semantic patterns for context detection (verified via code audit)
- 🔍 **Fast Search** - O(1) keyword lookups with inverted index
- 🎨 **Beautiful CLI** - Rich formatting with chalk styling
- 📊 **Rich Analytics** - Track tools, patterns, and session insights
- 🔍 **Natural Language Search** - Enhanced query understanding in v0.7.4
- 🔒 **Security First** - Automatic filtering of sensitive data
- ✅ **Production Ready** - 100% test coverage (196/196) and CI/CD pipeline

## 📑 Table of Contents
- [Quick Start](#-quick-start)
- [What's New in v0.7.5](#-whats-new-in-v075)
- [How It Works](#-how-it-works)
- [Installation](#-installation)
- [Storage Architecture](#-storage-architecture)
- [Key Features](#key-features-works-out-of-the-box)
- [CLI Commands](#-cli-commands-28-commands)
- [MCP Tools](#mcp-tools)
- [Future Vision](#-future-vision-cloud-based-intelligence)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🚀 Quick Start

```bash
# Install globally
npm install -g c0ntextkeeper

# Run setup wizard (enables PreCompact hook)
c0ntextkeeper setup

# Verify installation
c0ntextkeeper status
```

That's it! c0ntextKeeper is now preserving your context automatically.

### 🎁 What You Get Out of the Box

After the 60-second setup above, c0ntextKeeper **automatically**:
- ✅ **Preserves context** before every compaction (manual `/compact` or automatic)
- ✅ **Extracts valuable patterns** using 187 semantic detection rules
- ✅ **Builds searchable archive** with problems, solutions, decisions, implementations
- ✅ **Auto-loads context** at session start via MCP resources (Claude knows your project!)
- ✅ **Filters sensitive data** (API keys, secrets, credentials, PII)
- ✅ **Generates analytics** dashboards showing tool usage and patterns
- ✅ **Provides MCP tools** for instant context retrieval (`fetch_context`, `search_archive`, `get_patterns`)

**Zero ongoing configuration required!** Just work normally in Claude Code.

**📖 See the [Quick Start Guide](docs/guides/quickstart.md) for a complete walkthrough.**

---

## 🚀 What's New

**Package Version**: 0.7.5.1 | **Extraction Algorithm**: 0.7.5 | **Test Success**: 100% (196/196 tests)

### ⚡ v0.7.5.1 (2025-10-06) - CLI Output Quality Revolution!

**Complete Context Visibility** - Eliminated frustrating "..." cutoffs in all CLI commands!
- **Preview Command**: 500 → 5000 chars (10x) - See complete session context
- **Problem/Solution Display**: 300 → 1500 chars (5x) - Full technical details without truncation
- **Search Results**: 200 → 600 chars (3x) - Sufficient context for decision-making
- **Implementation Details**: 150 → 800 chars (5.3x) - Complete code context and file paths
- **MCP Tool Responses**: Full visibility without mid-sentence cutoffs
- **User Experience**: No more incomplete information - every command shows what you need

**Why This Matters**: Previously, CLI commands would cut off critical context mid-sentence with "...", making search results nearly useless. Now you see complete problems, full solutions, and sufficient context to understand and act on results.

### 🚨 v0.7.4 (2025-09-19) - CRITICAL FIX: Production Hooks NOW 100% OPERATIONAL!

**v0.7.4 fixes critical production failures** discovered in real-world usage:
- **✅ PostToolUse Hook** - Fixed complete production failure due to field name mismatches
- **✅ Stop Hook** - Updated for Claude Code v1.0.119+ transcript format changes
- **✅ Storage Architecture** - Fixed project name resolution preventing data fragmentation
- **✅ TypeScript Compilation** - Resolved all type errors for clean builds

### 🎯 Key v0.7.4 Improvements
- **🔍 Natural Language Search** - Enhanced query understanding with tokenization
- **🏥 New CLI Command** - `hooks health` for comprehensive diagnostics
- **🐛 Debug Mode** - C0NTEXTKEEPER_DEBUG=true for troubleshooting
- **🧪 Hook Testing Suite** - Complete test suite in scripts/test-hooks/
- **🧹 Scripts Cleanup** - Removed 17 obsolete test scripts, retained 16 essential

### 🔧 Previous Release: MCP Tools Reliability (v0.7.2)
- **✅ Fixed Relevance Scoring** - Now properly capped at 100% (no more impossible 129% scores!)
- **🆔 Deterministic SessionIds** - No more "unknown" sessions - every session gets a proper ID
- **🧠 Natural Language Processing** - Better query understanding with stop word filtering
- **📝 Enhanced Output** - Cleaner, more readable results with smart truncation
- **🔄 Migration Script** - Automatically fix existing archives with unknown sessions
- **🎯 Improved Query Matching** - Tokenization and word expansion for better results

### Previous Release (v0.7.1): Automatic Context Loading for MCP Server
- **🤖 Zero-Configuration Auto-Load** - Context automatically provided when Claude Code connects
- **📊 Smart Loading Strategies** - Choose from smart, recent, relevant, or custom strategies
- **⚡ MCP Resource Support** - Exposes context as `context://project/{name}/current`
- **🎛️ Fully Configurable** - Customize what gets loaded and how much (default 50KB limit)
- **🧠 Intelligent Aggregation** - Combines sessions, patterns, knowledge, and prompts
- **📝 New CLI Commands**:
  - `c0ntextkeeper context preview` - Preview what will be auto-loaded
  - `c0ntextkeeper context test` - Test different loading strategies
  - `c0ntextkeeper context configure` - Interactive configuration wizard
- **🔧 Enhanced Configuration** - New `autoLoad` section with comprehensive settings

### v0.7.1 Features
- Unified Storage Architecture with project-name organization
- Global storage default at `~/.c0ntextkeeper/archive/`
- Smart project detection and test separation

See [Version History](#-version-history) for previous releases or [CHANGELOG.md](CHANGELOG.md) for complete details.

## 🤖 How It Works

c0ntextKeeper operates completely automatically through Claude Code's hook system:

```mermaid
graph LR
    A[You work in Claude Code] --> B[Context grows]
    B --> C[Claude triggers compaction]
    C --> D[PreCompact hook fires]
    D --> E[c0ntextKeeper captures context]
    E --> F[Context preserved in archive]
    F --> G[You continue working]
    G --> H[Use MCP tools to retrieve]
```

### The Magic Happens Automatically
1. **You code normally** - No special commands needed
2. **Context fills up** - From your conversations and tool use
3. **Auto-compaction triggers** - Claude Code manages this
4. **Hook captures everything** - Before any context is lost
5. **Archive created instantly** - With analytics and insights
6. **MCP tools provide access** - Retrieve context anytime

### Key Features (Works Out of the Box!)

#### 🎁 Zero Configuration Required
- **Instant Setup** - Single command enables everything
- **Smart Defaults** - Optimized settings work for 99% of use cases
- **Automatic Detection** - Finds your project and creates proper archives
- **No Dependencies** - Works with vanilla Claude Code installation

#### 🤖 Fully Automatic Operation
- **Dual Compaction Support** - Works with both `/compact` command and auto-compaction
- **55-Second Timeout Protection** - Handles large transcripts gracefully
- **Background Processing** - Never interrupts your workflow
- **Smart Prioritization** - Focuses on high-value context first

#### 🧠 Intelligent Context Understanding (v0.7.3 Enhanced)
- **Natural Language Queries** - Ask questions like "what did we work on yesterday"
- **50+ Semantic Patterns** - Detects problems, solutions, decisions, implementations
- **Relevance Scoring 2.0** - Properly capped at 100% with multi-factor analysis
- **Deterministic SessionIds** - Every session gets a unique, trackable ID
- **Stop Word Filtering** - Better query understanding by removing noise
- **Word Expansion** - Automatically matches related terms (fix → fixed, fixes)

#### 🔍 Powerful MCP Tools
- **fetch_context** - Retrieve relevant archived context instantly
- **search_archive** - Search with natural language across all archives
- **get_patterns** - Identify recurring solutions and approaches
- **Auto-Load Resources** - Context automatically available on startup

#### 📊 Rich Analytics & Insights
- **Analytics Dashboard** - Auto-generated README with visualizations
- **Tool Usage Tracking** - See your most-used tools and patterns
- **Session Metrics** - Duration, relevance, files modified
- **Pattern Recognition** - Identifies recurring code, commands, architecture
- **Quality Scores** - Track context value over time

#### 💾 Smart Storage System
- **Human-Readable Names** - Projects use actual names (c0ntextKeeper)
- **JSON Format** - All data stored as readable JSON, not JSONL
- **Hybrid Architecture** - Choose project-local or global storage
- **Test Isolation** - Automatically separates test data
- **Intelligent Filtering** - Excludes /tmp and test projects

#### 🔒 Enterprise-Grade Security
- **API Key Protection** - Redacts OpenAI, Anthropic, AWS, GitHub keys
- **Credential Filtering** - Removes passwords and connection strings
- **PII Redaction** - Partially masks emails, IPs, phone numbers
- **Token Detection** - Filters JWT and bearer tokens
- **Custom Patterns** - Add project-specific security rules

#### ⚡ Exceptional Performance
- **<10ms Operations** - Lightning-fast extraction and retrieval
- **Stream Processing** - Handles 10,000+ entry transcripts
- **Memory Efficient** - Zero memory leaks with automatic cleanup
- **Instant Loading** - MCP resources ready when Claude connects
- **99.5% Test Coverage** - Comprehensive testing ensures reliability (196/197 tests passing)

## ⚡ Performance

c0ntextKeeper delivers exceptional performance with sophisticated implementation:

- **<10ms Average Operations** - Lightning-fast context extraction and retrieval (verified in benchmarks)
- **55-Second Timeout Protection** - Gracefully handles large transcripts without 504 errors
- **Efficient Stream Processing** - Handles 10,000+ entry transcripts with smart prioritization
- **JSON Storage Format** - All hooks use human-readable JSON (not JSONL) for better accessibility
- **Test Project Filtering** - Actively prevents /tmp and test data pollution in global index
- **Smart Content Limits** - 2000 character limits for questions/solutions prevent overflow
- **Zero Memory Leaks** - Stream processing with automatic cleanup
- **Instant MCP Resource Loading** - Auto-load context ready when Claude Code connects

See [Performance Benchmarks](docs/technical/performance-benchmarks.md) and [Test Results](docs/technical/test-results-summary.md) for detailed metrics.

## 📦 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- Claude Code CLI installed
- npm or yarn package manager

### Install Options

#### Option 1: Global Installation (Recommended)
```bash
npm install -g c0ntextkeeper
```

#### Option 2: Local Development
```bash
git clone https://github.com/yourusername/c0ntextKeeper.git
cd c0ntextKeeper
npm install
npm link
```

### Setup Process

After installation, run the setup wizard:

```bash
# Enable the PreCompact hook
c0ntextkeeper setup

# Verify everything is working
c0ntextkeeper status
```

That's it! c0ntextKeeper is now automatically preserving your context.

## 📁 Global Storage Architecture

### Intelligent Project-Based Storage

c0ntextKeeper uses human-readable project names for all storage - no more cryptic hashes!

```
/Users/[directory-name]/                # Your home directory (~)
│
├── .claude/                            # Claude Code configuration
│   ├── settings.json                   # ← Hook configuration lives here
│   └── hooks/                          # Hook scripts (managed by setup)
│
└── .c0ntextkeeper/                     # ← Global preserved context
    ├── config.json                     # Global configuration
    ├── archive/                        # Main session archives
    │   └── projects/                   # Per-project storage
    │       └── [project-name]/         # Actual project names (e.g., "c0ntextKeeper")
    │           ├── sessions/           # Individual JSON session files
    │           │   └── YYYY-MM-DD_HHMM_MT_[description].json
    │           ├── test/               # Test data (auto-separated)
    │           ├── search-index.json   # Inverted index for O(1) lookups (v0.7.5)
    │           ├── index.json          # Project statistics & tool tracking
    │           └── README.md           # Auto-generated analytics dashboard
    ├── prompts/                        # UserPromptSubmit hook data
    │   └── [project-name]/             # Same naming as archive/projects/
    │       └── YYYY-MM-DD-prompts.json
    ├── patterns/                       # PostToolUse hook data
    │   └── [project-name]/             # Human-readable project names
    │       └── YYYY-MM-DD-patterns.json   # Includes MCP tool tracking
    ├── knowledge/                      # Stop hook Q&A pairs
    │   └── [project-name]/             # Consistent naming across hooks
    │       └── YYYY-MM-DD-knowledge.json
    ├── index.json                      # Project registry (test-filtered)
    └── logs/                           # Hook execution logs
        └── hook.log
```

### Key Storage Features
- **Project Name Storage**: All archives use actual project names like `c0ntextKeeper`
- **Automatic Project Detection**: Intelligently extracts project name from working directory
- **Hybrid Architecture**: Choose project-local (`.c0ntextkeeper/`) or global (`~/.c0ntextkeeper/`) storage
- **Intelligent Path Resolution**: Walks up directory tree to find storage location
- **JSON Format Throughout**: All data stored as formatted JSON for human readability
- **Test Data Isolation**: Test sessions automatically separated to prevent pollution
- **Daily Aggregation**: Hook data organized by date for easy navigation
- **Custom Location**: Override with `CONTEXTKEEPER_HOME` environment variable
- **Smart Filtering**: Excludes `/tmp`, `/var/folders`, and test projects automatically

## 📖 Usage

### Prerequisites
- Node.js >= 18.0.0
- Claude Code installed and configured
- npm or yarn package manager

### Global Installation (Recommended)

```bash
# Step 1: Install globally via npm
npm install -g c0ntextkeeper

# Step 2: Run the setup wizard (REQUIRED)
c0ntextkeeper setup

# The setup command will:
# - Configure Claude Code hooks
# - Create necessary directories
# - Verify installation
# - Show next steps
```

### Development Installation

For developers working on c0ntextKeeper itself:

```bash
# Clone the repository
git clone https://github.com/Capnjbrown/c0ntextKeeper.git
cd c0ntextKeeper

# Install dependencies
npm install

# Build the project
npm run build

# Link for global CLI access
npm link

# Now you can use 'c0ntextkeeper' command globally
c0ntextkeeper status
```

### Project Installation

```bash
# Install in your project
npm install c0ntextkeeper

# Run setup
npx c0ntextkeeper setup
```

### Verify Installation

```bash
# Check version
c0ntextkeeper --version

# Validate setup
c0ntextkeeper validate
```

## 📖 Usage

Once installed, c0ntextKeeper works **completely automatically**! 

### Automatic Context Preservation

1. **Work normally in Claude Code** - Make changes, solve problems, build features
2. **Claude Code auto-compacts when needed** - No action required from you!
3. **c0ntextKeeper captures everything** - Archives created automatically
4. **Manual `/compact` also supported** - Works both ways
5. **Retrieve context anytime** - Use MCP tools to access preserved knowledge

### 📊 Analytics Dashboard

Every project archive includes a comprehensive analytics dashboard that shows:

- **📈 Tool Usage Statistics** - See your most-used tools (Read, Write, Edit, Bash, etc.)
- **📁 Project Activity** - Total sessions, problems solved, implementations made
- **⏱️ Session Metrics** - Duration, files modified, relevance scores
- **🎯 Quality Insights** - Average relevance across sessions
- **🔍 Problem Tracking** - Key issues from each session
- **📝 Detailed Summaries** - Per-session statistics with inline insights

Example from your archive README:
```markdown
## 📊 Project Analytics

### Tool Usage
- **Most Used Tools**: Read (245x), Edit (189x), Write (67x), Bash (134x)
- **Total Tool Invocations**: 635
- **Unique Tools Used**: 12

### Quality Metrics
- **Average Relevance Score**: 68%
- **Files Modified**: 47 across all sessions
```

### Check Automation Status

```bash
# See how c0ntextKeeper is working
c0ntextkeeper status
```

This shows:
- ✅ Whether automatic capture is enabled
- 🔄 What triggers preservation (manual + automatic)
- 📦 Where your archives are stored
- 📊 Which additional hooks are available

### MCP Tools

Ask Claude to use these tools to retrieve context:

#### `fetch_context`
Retrieve relevant archived context for your current task:
```
"Use the fetch_context tool to find previous authentication implementations"
```

#### `search_archive`
Search through all archived contexts with filters:
```
"Search the archive for Redis configuration decisions"
```

#### `get_patterns`
Identify recurring patterns and solutions:
```
"Show me recurring error patterns in this project"
```

## 🔒 Security Features

c0ntextKeeper automatically protects your sensitive information with comprehensive security filtering:

### Protected Data Types
- **API Keys**: OpenAI, Anthropic, AWS, GitHub, and generic API keys
- **Credentials**: Passwords, secrets, database connection strings
- **Private Keys**: RSA, SSH, and other private keys
- **Personal Information**: Emails (partially redacted), IP addresses, phone numbers
- **Tokens**: JWT tokens, bearer tokens, session tokens
- **Environment Variables**: Secret environment variables

### Security Implementation
```typescript
// All context is automatically filtered before storage
const securityFilter = new SecurityFilter();
const safeContext = securityFilter.filterObject(extractedContext);

// Example redactions:
// API_KEY=sk-1234... → API_KEY=[REDACTED]
// user@example.com → ***@example.com
// 192.168.1.100 → 192.168.***.***
```

## 🔄 Migrating Existing Archives

If you have existing archives with hash-based names, migrate them to the new human-readable structure:

```bash
# Preview changes
c0ntextkeeper migrate --dry-run

# Apply migration
c0ntextkeeper migrate
```

The migration tool:
- Converts hash directories (e.g., `c77d2fa7`) to project names (e.g., `c0ntextKeeper`)
- Renames session files with descriptive names
- Adds README files for easy navigation
- Creates automatic backup before changes

## 📖 Examples

### Example 1: Retrieving Previous Solutions
```
User: "How did we fix the JWT authentication error last time?"
Claude: *Uses fetch_context tool*
Found relevant context from 2025-08-15:
- Problem: JWT validation failing with 'invalid signature'
- Solution: Updated the secret key rotation logic in auth.ts
- Implementation: Modified validateJWT() to handle key rotation
```

### Example 2: Finding Patterns
```
User: "What commands do I run most frequently?"
Claude: *Uses get_patterns tool*
Recurring command patterns:
1. npm test (15 times)
2. npm run build && npm run deploy (8 times)
3. git status && git diff (6 times)
```

### Example 3: Architecture Decisions
```
User: "Why did we choose Redis over PostgreSQL for caching?"
Claude: *Uses search_archive tool*
Decision from 2025-08-10:
- Chose Redis for session storage
- Rationale: Better performance for key-value operations
- Impact: 10x faster session retrieval
```

## 🛠️ CLI Commands (28 Commands)

c0ntextKeeper provides a comprehensive CLI with 28 commands for complete control:

### Setup & Configuration

```bash
# Initial setup - REQUIRED after installation
c0ntextkeeper setup          # Interactive setup wizard (enables PreCompact hook)
c0ntextkeeper validate       # Verify installation and hook configuration
c0ntextkeeper doctor         # Diagnose and fix common issues
```

### Storage Management

```bash
# Initialize storage locations
c0ntextkeeper init           # Initialize project-local storage (.c0ntextkeeper/)
c0ntextkeeper init --global  # Initialize global storage (~/.c0ntextkeeper/)
c0ntextkeeper status         # Check storage configuration and automation status
```

### Core Operations

```bash
# Archive and search
c0ntextkeeper archive <file> # Manually archive a JSONL transcript
c0ntextkeeper search [query] # Search archives (shows recent if no query)
                             # Options: --limit <n>, --project <path>

# Analytics and insights
c0ntextkeeper patterns       # Analyze recurring patterns across sessions
                             # Options: --type <code|command|architecture|all>
                             #         --min <frequency>
c0ntextkeeper stats          # Show storage statistics and metrics
```

### Context Management (Auto-Load Features)

```bash
# Preview and test auto-loaded context
c0ntextkeeper context preview      # Preview what will be auto-loaded
c0ntextkeeper context test         # Test context loading and show statistics

# Configure auto-load settings
c0ntextkeeper context configure    # Interactive configuration (shows current settings)
  --enable                         # Enable auto-loading
  --disable                        # Disable auto-loading
  --strategy <type>                # Set strategy: smart, recent, relevant, custom
  --max-size <kb>                  # Set maximum size in KB (default: 50)
  --session-count <n>              # Number of sessions to include
  --pattern-count <n>              # Number of patterns to include
  --format <style>                 # Format: summary, detailed, minimal

# Example: Enable smart loading with 100KB limit
c0ntextkeeper context configure --enable --strategy smart --max-size 100
```

### Hook Management

```bash
# View and manage hooks
c0ntextkeeper hooks list              # Show all hooks and their status
c0ntextkeeper hooks enable <hook>     # Enable a specific hook
c0ntextkeeper hooks disable <hook>    # Disable a specific hook
c0ntextkeeper hooks test <hook>       # Test a hook with sample data
c0ntextkeeper hooks stats             # Show hook execution statistics
c0ntextkeeper hooks config <hook>     # Configure hook settings
  --matcher <pattern>                 # Set matcher pattern for the hook

# Available hooks:
# - PreCompact (enabled by default) - Automatic context preservation
# - UserPromptSubmit                 - Track questions and prompts
# - PostToolUse                      - Capture tool patterns (includes MCP tools)
# - Stop                             - Save complete Q&A exchanges
```

### Maintenance & Migration

```bash
# Clean and maintain archives
c0ntextkeeper cleanup         # Clean invalid/test projects from global index
  --dry-run                   # Preview changes without modifying
  --backup                    # Create backup before cleaning (default: true)
  --force                     # Skip confirmation prompts

# Rebuild search index for fast lookups
c0ntextkeeper rebuild-index   # Recreate inverted index from all sessions

# Migrate archives (v0.7.2 includes sessionId fixes)
c0ntextkeeper migrate         # Migrate old archives to latest format
  --dry-run                   # Preview migration without changes
  --fix-sessions              # Fix "unknown" sessionIds (v0.7.2)
  --fix-relevance             # Fix scores exceeding 100% (v0.7.2)
c0ntextkeeper migrate:restore # Restore from backup after failed migration
```

### Development & Testing

```bash
# Testing commands
c0ntextkeeper test-hook       # Test PreCompact hook with sample data
c0ntextkeeper test-mcp        # Test all MCP tools (v0.7.2)
  --tool <name>               # Test specific tool
  --query <text>              # Test with specific query
c0ntextkeeper server          # Start MCP server manually (for testing)
c0ntextkeeper benchmark       # Run performance benchmarks

# Debugging and diagnostics
c0ntextkeeper debug           # Enable debug mode with verbose logging
c0ntextkeeper logs            # View recent hook execution logs
  --tail                      # Follow log output
  --lines <n>                 # Show last n lines

# Help and version
c0ntextkeeper --help          # Show all commands with descriptions
c0ntextkeeper <cmd> --help    # Show detailed help for specific command
c0ntextkeeper --version       # Show version (currently 0.7.5.1)
c0ntextkeeper changelog       # View recent changes and updates
```

### Quick Examples

```bash
# After installation (works out of the box!)
c0ntextkeeper setup           # Enable automatic preservation
c0ntextkeeper status          # Verify everything is working

# Configure auto-load for your project
c0ntextkeeper context configure --enable --strategy smart
c0ntextkeeper context preview # See what Claude will know on startup

# Search with natural language (v0.7.3 improvements)
c0ntextkeeper search "what have we been working on lately"
c0ntextkeeper search "authentication implementation from yesterday"
c0ntextkeeper patterns --type code --min 3

# Enable additional hooks for richer capture
c0ntextkeeper hooks enable UserPromptSubmit
c0ntextkeeper hooks enable PostToolUse
c0ntextkeeper hooks enable Stop

# Fix existing archives (v0.7.2)
c0ntextkeeper migrate --fix-sessions   # Fix "unknown" sessionIds
c0ntextkeeper migrate --fix-relevance  # Fix scores over 100%

# Advanced usage
c0ntextkeeper search --natural "how did we solve the redis problem"
c0ntextkeeper fetch --smart 10  # Get 10 most relevant contexts
c0ntextkeeper patterns --frequency 5 --type architecture
```

## 🏗️ Architecture

```
c0ntextKeeper/
├── Hook System             # 4 hooks for comprehensive capture
│   ├── PreCompact         # Auto + manual compaction
│   ├── UserPromptSubmit   # Question tracking
│   ├── PostToolUse        # Tool pattern analysis
│   └── Stop               # Q&A knowledge base
├── Extraction Engine       # Analyzes transcripts for valuable context
│   ├── Problem Detector
│   ├── Solution Mapper
│   ├── Decision Extractor
│   └── Pattern Identifier
├── Configuration System    # Hybrid configuration hierarchy
│   ├── Project: .c0ntextkeeper/config.json
│   └── Global: ~/.c0ntextkeeper/config.json
├── Storage Layer          # Flexible storage locations
│   ├── archive/           # Session transcripts
│   ├── prompts/           # User questions
│   ├── patterns/          # Tool usage
│   └── ~/.c0ntextkeeper/knowledge/  # Q&A pairs
└── MCP Server            # Exposes retrieval tools to Claude Code
    ├── fetch_context
    ├── search_archive
    └── get_patterns
```

## 📁 Where Is My Data Stored?

**All data is stored locally on your Mac** - hybrid storage architecture:

### Storage Locations

| Storage Mode | Location | When to Use |
|--------------|----------|-------------|
| **Project-Local** | `.c0ntextkeeper/` in project | Recommended - keeps context with project |
| **Global** | `~/.c0ntextkeeper/` | For shared context across projects |
| **Custom** | Via `CONTEXTKEEPER_HOME` | For custom storage locations |

### Data Organization

| Data Type | Relative Path | Purpose |
|-----------|---------------|----------|
| **Archived Contexts** | `archive/` | Your preserved work sessions |
| **Prompts** | `prompts/` | User questions and requests |
| **Patterns** | `patterns/` | Tool usage patterns |
| **Knowledge** | `knowledge/` | Q&A pairs |
| **Configuration** | `config.json` | Storage settings |
| **Hook Configuration** | `~/.claude/settings.json` | Claude Code integration |

### Quick Access Commands

```bash
# Check current storage location
c0ntextkeeper status

# Open your archives in Finder (project-local)
open .c0ntextkeeper/archive

# Open global archives
open ~/.c0ntextkeeper/archive

# View your latest archive
c0ntextkeeper search  # Shows 5 most recent

# Search your archives
c0ntextkeeper search "authentication"

# Check storage size
du -sh .c0ntextkeeper/  # Project-local
du -sh ~/.c0ntextkeeper/  # Global
```

**📖 For detailed information, see the [User Guide](docs/guides/user-guide.md)**

## ⚙️ Configuration

c0ntextKeeper works out of the box, but you can customize its behavior:

### Environment Variables

```bash
# Storage Configuration
CONTEXTKEEPER_HOME=/path/to/storage  # Override storage location
CONTEXTKEEPER_GLOBAL=true            # Force global storage mode

# Processing Configuration
LOG_LEVEL=INFO           # Logging level (DEBUG, INFO, WARN, ERROR)
RETENTION_DAYS=90        # Days to keep archived context
MAX_CONTEXT_ITEMS=50     # Maximum items per extraction
RELEVANCE_THRESHOLD=0.5  # Minimum relevance score (0-1)
```


## 🧪 Development

### Prerequisites
- Node.js 18.x, 20.x, or 22.x
- TypeScript 5.9+
- Git
- Claude Code CLI (optional, for enhanced development)

### Claude Code CLI Integration

c0ntextKeeper includes special support for Claude Code CLI development:

- **`CLAUDE.md`** - Team-shared Claude Code instructions (version controlled)
- **`CLAUDE.local.md`** - Personal Claude Code settings (git-ignored, optional)

The `CLAUDE.md` file at the project root is automatically detected by Claude Code CLI when running `claude` commands, providing project-specific context and guidelines. For personal settings that shouldn't be shared with the team, create a `CLAUDE.local.md` file (automatically ignored by git).

### Building from Source

```bash
# Clone the repository
git clone https://github.com/Capnjbrown/c0ntextKeeper.git
cd c0ntextKeeper

# Install dependencies
npm install

# Build the project
npm run build

# Run tests with coverage
npm run test:coverage

# Start development mode
npm run dev
```

### Development Scripts

```bash
npm run dev          # Start development server with watch mode
npm run build        # Build TypeScript to JavaScript
npm test            # Run Jest tests
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript type checking
npm run format      # Format code with Prettier
```

### Project Structure

```
src/
├── server/          # MCP server implementation
├── hooks/           # PreCompact hook handlers
├── core/            # Extraction and analysis logic
│   ├── extractor.ts # Context extraction engine
│   ├── scorer.ts    # Relevance scoring
│   └── patterns.ts  # Pattern recognition
├── storage/         # Storage abstraction
├── tools/           # MCP tool implementations
└── utils/           # Utilities and helpers
    ├── security-filter.ts # Security filtering
    └── transcript.ts      # JSONL parsing
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Review [Project Context](docs/development/project-context.md) for technical architecture
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes
5. Update [Project Context](docs/development/project-context.md) if making architectural changes
6. Run tests (`npm test`) and linting (`npm run lint`)
7. Commit using conventional commits (`feat:`, `fix:`, etc.)
8. Push to your branch
9. Open a Pull Request

### Areas for Contribution

- 🔌 Additional extractors for specific patterns
- 🎨 VS Code extension for inline context
- 🚀 Performance optimizations
- 📊 Analytics and visualization
- 🌐 Cloud sync capabilities
- 🧪 Expanding test coverage
- 📝 Documentation improvements
- 🔒 Security enhancements

## 📚 Complete Documentation

### 📖 Getting Started
- **[⚡ Quick Start (60 seconds)](docs/guides/quickstart.md)** - Get running immediately
- **[👤 User Guide](docs/guides/user-guide.md)** - Comprehensive usage guide
- **[🎯 Use Cases & Examples](docs/guides/use-cases.md)** - Real-world scenarios (12+ examples)

### 📘 Feature Documentation
- **[✨ Complete Feature Catalog](docs/FEATURES.md)** - Every feature, command, and capability
- **[🔧 MCP Tools & Resources](docs/technical/mcp-tools.md)** - Detailed tool usage guide
- **[🎣 Hooks Reference](docs/technical/hooks-reference.md)** - What each hook captures
- **[⚙️ Configuration Guide](docs/technical/configuration.md)** - All configuration options

### 🔨 Technical Docs
- **[Hook Integration](docs/technical/hook-integration.md)** - Set up automatic context preservation
- **[File Formats](docs/technical/file-formats.md)** - Archive format specifications
- **[Storage Architecture](docs/technical/storage.md)** - Hybrid storage system
- **[MCP Usage](docs/technical/mcp-usage.md)** - MCP tool patterns

### 🛠️ Development
- **[Project Context](docs/development/project-context.md)** - Technical architecture
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Migration Guide](docs/guides/migration-guide.md)** - Version migration procedures

---

## 📝 License

MIT - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments



## 🧪 Testing

c0ntextKeeper uses Jest for comprehensive testing:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test extraction with various content types
node scripts/test-hooks/test-all.js
```

### CI/CD Pipeline

Our GitHub Actions pipeline runs on every push and PR:
- **Multi-version testing**: Node.js 18.x, 20.x, 22.x
- **Code quality**: ESLint, TypeScript, Prettier
- **Security audits**: npm audit for vulnerabilities
- **Coverage reporting**: Automated Codecov integration
- **Automated releases**: Semantic versioning on main branch

## 🚦 Troubleshooting

### Common Issues and Solutions

#### 504 Timeout Errors During Auto-Compact
**Fixed in v0.2.0** - Now includes 55-second timeout protection
```bash
# Verify you have v0.2.0 or later
c0ntextkeeper --version
```

#### "content.toLowerCase is not a function" Error
**Fixed in v0.2.0** - Type guards handle all content types
```bash
# Update to latest version
npm update -g c0ntextkeeper
```

#### Generic Archive Folder Names
**Fixed in v0.2.0** - Projects now use actual names
```bash
# Migrate old archives
c0ntextkeeper migrate
```

#### Low Relevance Scores for User Questions
**Fixed in v0.5.0** - Questions now properly score 1.0 instead of 0.06
```bash
# Update to latest version
npm update -g c0ntextkeeper
```

#### Archives Not Being Created
```bash
# Enable debug logging
export C0NTEXTKEEPER_FILE_LOGGING=true

# Check logs
tail -f ~/.c0ntextkeeper/logs/hook.log

# Validate installation
c0ntextkeeper validate
```

#### Hook Not Triggering
```bash
# Check hook configuration
cat ~/.claude/settings.json | jq '.hooks.PreCompact'

# Reinstall hooks
c0ntextkeeper setup
```

For more troubleshooting, see the [User Guide](docs/guides/user-guide.md#troubleshooting)

## 📈 Version History

### v0.7.x Series (Current)
- **v0.7.2** - 🔧 MCP tools reliability fixes, natural language processing, sessionId generation
- **v0.7.1** - 🎯 Auto-load context via MCP resources, bug fixes, documentation improvements
- **v0.7.0** - 🤖 Automatic context loading, intelligent strategies, MCP resources

### v0.6.x Series
- **v0.6.0** - Unified storage architecture with project-name organization

### v0.5.x Series  
- **v0.5.3** - Unified JSON format, test data separation
- **v0.5.2** - CLI improvements, version consistency fixes
- **v0.5.1** - Better content preservation (2000 char limits), smarter session naming
- **v0.5.0** - Critical Claude Code compatibility, 187 semantic patterns (verified count)

### v0.4.0 and Earlier
- **v0.4.0** - Open source migration, security hardening
- **v0.3.0** - Analytics dashboard, tool usage tracking
- **v0.2.0** - Type safety, timeout protection
- **v0.1.0** - Initial release

See [CHANGELOG.md](CHANGELOG.md) for complete version details.

## 🚀 Future Vision: Cloud-Based Intelligence

### Next Major Release: Cloud Vector Storage with RAG
We're planning a revolutionary upgrade to take c0ntextKeeper to the cloud:

#### 🌩️ Cloud-Based Vector Storage
- **Semantic Search** - Find context by meaning, not just keywords
- **Vector Embeddings** - Transform your context into searchable knowledge
- **Distributed Storage** - Access your context from any machine
- **Team Collaboration** - Share context across your organization

#### 🤖 RAG (Retrieval Augmented Generation)
- **LLM-Powered Retrieval** - Use AI to find the most relevant context
- **Intelligent Summarization** - Get exactly what you need, when you need it
- **Context Fusion** - Combine multiple contexts for comprehensive answers
- **Continuous Learning** - System improves with every interaction

#### 🎯 Enhanced Features Coming Soon
- **VS Code Extension** - Inline context display while coding
- **Web Dashboard** - Visual analytics and context browsing
- **API Access** - Integrate with your existing tools
- **Multi-Model Support** - Work with Claude, GPT, and other LLMs
- **Enterprise Features** - SSO, audit logs, compliance tools

### Current Roadmap
- ✅ v0.7.2 - MCP tools reliability (COMPLETED)
- 🚀 v0.8.0 - Cloud vector storage foundation
- 🎯 v0.9.0 - RAG implementation
- 🌟 v1.0.0 - Production cloud platform

## 💬 Support

### Getting Help
- 📖 [Documentation Wiki](https://github.com/yourusername/c0ntextKeeper/wiki)
- 💬 [GitHub Discussions](https://github.com/yourusername/c0ntextKeeper/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/c0ntextKeeper/issues)
- 📧 Email Support (placeholder - update with your contact)

### 📚 Documentation

**Complete documentation now available** - See the [Complete Documentation](#-complete-documentation) section below for all guides.

#### Quick Links
- **[⚡ Quick Start (60 seconds)](docs/guides/quickstart.md)** - Get running immediately
- **[✨ Complete Features](docs/FEATURES.md)** - Every feature, command, and capability
- **[🎯 Use Cases](docs/guides/use-cases.md)** - 12+ real-world examples
- **[⚙️ Configuration](docs/technical/configuration.md)** - All settings explained

### External Resources
- [Homepage](https://c0ntextkeeper.com)
- [NPM Package](https://www.npmjs.com/package/c0ntextkeeper)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)

---

<p align="center">
  <strong>Never lose context again.</strong> Start using c0ntextKeeper today!
</p>

<p align="center">
  Built with ❤️ for the Claude Code community by <a href="https://github.com/yourusername">the c0ntextKeeper Contributors</a>
</p>

<p align="center">
  <a href="https://github.com/yourusername/c0ntextKeeper/stargazers">⭐ Star us on GitHub</a> • 
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20c0ntextKeeper%20-%20Never%20lose%20valuable%20context%20in%20Claude%20Code%20again!&url=https://github.com/yourusername/c0ntextKeeper">Share on Twitter</a>
</p>

                                    sMB