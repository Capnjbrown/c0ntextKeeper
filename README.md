<p align="center">
  <h1 align="center">c0ntextKeeper</h1>
</p>

<p align="center">
  <strong>The only automatic context preservation system for Claude Code</strong><br>
  Zero configuration. Works out of the box. Never lose work to compaction again.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/c0ntextkeeper"><img src="https://img.shields.io/npm/v/c0ntextkeeper?style=for-the-badge&logo=npm&logoColor=white" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/c0ntextkeeper"><img src="https://img.shields.io/npm/dm/c0ntextkeeper?style=for-the-badge&logo=npm&logoColor=white" alt="npm downloads"></a>
  <a href="https://github.com/Capnjbrown/c0ntextKeeper/stargazers"><img src="https://img.shields.io/github/stars/Capnjbrown/c0ntextKeeper?style=for-the-badge&logo=github" alt="GitHub stars"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License: MIT"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js&logoColor=white" alt="Node version">
  <img src="https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tests-483%20Passing-success?style=for-the-badge" alt="Tests">
  <img src="https://img.shields.io/badge/Claude%20Code-7%20Hooks-8B5CF6?style=for-the-badge" alt="Claude Code Hooks">
  <a href="https://github.com/Capnjbrown/c0ntextKeeper/actions"><img src="https://github.com/Capnjbrown/c0ntextKeeper/workflows/CI/badge.svg" alt="CI Status"></a>
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/📦%20Install-Get%20Started-2ea44f?style=for-the-badge" alt="Get Started"></a>
  <a href="#what-this-enables"><img src="https://img.shields.io/badge/🎯%20Use%20Cases-See%20Examples-0969da?style=for-the-badge" alt="Use Cases"></a>
  <a href="#ask-claude-naturally"><img src="https://img.shields.io/badge/🧠%20AI%20Search-Try%20It-8B5CF6?style=for-the-badge" alt="AI Search"></a>
  <a href="https://github.com/Capnjbrown/c0ntextKeeper/stargazers"><img src="https://img.shields.io/badge/⭐%20Star-Support-ffd33d?style=for-the-badge" alt="Star"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#what-this-enables">Use Cases</a> •
  <a href="#ask-claude-naturally">AI Search</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#documentation">Docs</a>
</p>

---

## At a Glance

```bash
npm install -g c0ntextkeeper && c0ntextkeeper setup
```

| | |
|---|---|
| 🤖 **Automatic** | Captures on both `/compact` and auto-compaction |
| 🧠 **AI-Powered Search** | Ask naturally: *What auth did I build last week?* |
| 🔍 **Searchable** | Find past solutions via 3 MCP tools or 30 CLI commands |
| 🔒 **Secure** | Auto-redacts API keys, credentials, and PII |
| ⚡ **Fast** | <10ms operations, zero performance impact |
| 📊 **Comprehensive** | 7 hooks, 187 semantic patterns, 3 MCP tools |
| ✅ **Production Ready** | 483 tests passing, TypeScript, MIT licensed |

---

## The Problem

When Claude Code compacts your conversation, valuable context disappears:
- Solutions you discussed but haven't implemented
- Decisions about architecture and design patterns
- Problems you identified and their fixes
- Implementation details and code patterns

**The cost?** You waste 30+ minutes rediscovering solutions. You repeat past mistakes. You lose architectural consistency across sessions.

**c0ntextKeeper preserves everything automatically—and makes it searchable.**

## Quick Start

```bash
# Install globally
npm install -g c0ntextkeeper

# Run setup (configures Claude Code hooks)
c0ntextkeeper setup

# Verify it's working
c0ntextkeeper status
```

**That's it.** c0ntextKeeper now automatically preserves your context.

> **Note**: The CLI command is `c0ntextkeeper` (all lowercase with zero).
> The project name is `c0ntextKeeper` (capital K), but commands are always lowercase.

## What This Enables

| Use Case | Without c0ntextKeeper | With c0ntextKeeper |
|----------|----------------------|-------------------|
| **Starting a new feature** | Re-explore old solutions from scratch | Ask: *What auth did I implement?* |
| **Debugging an error** | Search files manually for past fixes | Ask: *How did I fix this before?* |
| **Architecture decisions** | Forget why you chose a pattern | Instant access to reasoning |
| **Onboarding teammates** | Explain everything verbally | Share searchable context archive |

**Try it now:**
```bash
c0ntextkeeper search "authentication"
c0ntextkeeper patterns --type command
```

## Ask Claude Naturally

No regex. No exact keywords. Just ask:

> *What did I implement for authentication last week?*
> *How did I fix that database connection error?*
> *What commands do I run most often?*

Claude uses c0ntextKeeper's 3 MCP tools automatically. Your queries are processed with word expansion, stop word filtering, and 60-day temporal decay scoring.

📖 **[Full MCP Guide →](docs/guides/mcp-guide.md)**

## Why c0ntextKeeper

| Feature | Description |
|---------|-------------|
| **Zero Configuration** | Install and immediately start preserving context |
| **Fully Automatic** | Works with both `/compact` and auto-compaction |
| **Intelligent Extraction** | 187 semantic patterns detect problems, solutions, decisions |
| **MCP Integration** | 3 tools + 3 resources for instant context retrieval |
| **Security First** | Automatic redaction of API keys, credentials, PII |
| **Production Ready** | 483 tests passing, <10ms operations |

## How It Compares

| Feature | c0ntextKeeper | Manual Notes | Other MCP Servers |
|---------|:-------------:|:------------:|:-----------------:|
| **Automatic Capture** | ✅ Both manual & auto | ❌ Manual only | ⚠️ Manual trigger |
| **Zero Configuration** | ✅ Works out of box | ❌ Requires discipline | ❌ Complex setup |
| **7 Claude Code Hooks** | ✅ All events | ❌ N/A | ⚠️ Partial support |
| **187 Semantic Patterns** | ✅ Intelligent extraction | ❌ Manual categorization | ⚠️ Basic patterns |
| **Searchable Archive** | ✅ MCP tools + CLI | ❌ File searching | ⚠️ Limited search |
| **Security Filtering** | ✅ Auto-redact secrets | ❌ Manual redaction | ❌ None |
| **Performance** | ✅ <10ms operations | N/A | ⚠️ Varies |
| **Test Coverage** | ✅ 483 tests | N/A | ⚠️ Unknown |

## How It Works

```
You work in Claude Code
        ↓
Context accumulates from conversations
        ↓
Compaction triggers (manual or automatic)
        ↓
c0ntextKeeper captures context via hooks
        ↓
Archive created with searchable index
        ↓
Retrieve via CLI or MCP tools
```

## CLI Tools

c0ntextKeeper provides **30 CLI commands**:
- **20 top-level commands** (`setup`, `status`, `doctor`, `search`, etc.)
- **7 hook management subcommands** (`hooks list`, `hooks enable`, `hooks disable`, etc.)
- **3 context management subcommands** (`context preview`, `context test`, `context configure`)

```bash
# Quick health check
c0ntextkeeper status           # See automation status
c0ntextkeeper doctor           # Full diagnostics

# Search your history
c0ntextkeeper search "auth"    # Find past work
c0ntextkeeper patterns         # View recurring patterns

# Manage hooks
c0ntextkeeper hooks list       # See all 7 hooks
c0ntextkeeper hooks health     # Check data health
```

📖 **[Full CLI Reference with 30 Commands →](docs/guides/cli-reference.md)**

### 7 Supported Hooks

| Hook | Purpose |
|------|---------|
| **PreCompact** | Captures full context before compaction |
| **PostToolUse** | Tracks tool execution patterns |
| **UserPromptSubmit** | Preserves user prompts |
| **Stop** | Captures Q&A exchanges |
| **Notification** | Tracks notifications |
| **SessionStart** | Records session metadata |
| **SessionEnd** | Captures session summaries |

## Search Algorithm Details

How the AI-powered search works under the hood:

| Feature | Description |
|---------|-------------|
| **Word Expansion** | "fix" matches "fixed", "fixes", "fixing" automatically |
| **Stop Word Filtering** | Removes 32 noise words for precision |
| **Temporal Decay** | Recent content scores higher (60-day half-life) |
| **Multi-Field Search** | Searches problems, solutions, decisions, patterns |
| **Relevance Scoring** | Weighted by field: problems (0.3), solutions (0.2), implementations (0.2) |

### Tool Selection Guide

| You Want To... | Claude Uses | Example Query |
|----------------|-------------|---------------|
| Start a new feature | `fetch_context` | "What auth implementations exist?" |
| Find specific work | `search_archive` | "Find Redis config in TypeScript files" |
| Filter by date | `search_archive` | "What did I work on last week?" |
| See your patterns | `get_patterns` | "What commands do I use most?" |

📖 **[Full MCP Guide →](docs/guides/mcp-guide.md)** - Complete documentation with all parameters, examples, and troubleshooting.

---

## MCP Tools

### `fetch_context`

Retrieve relevant archived context for your current task:

```
"Use fetch_context to find previous authentication implementations"
```

**Parameters:**
- `query` (required) - What you're looking for
- `limit` - Maximum results (default: 5)
- `minRelevance` - Minimum score 0-1 (default: 0.5)
- `scope` - "session", "project", or "global"

### `search_archive`

Search with advanced filters:

```
"Search the archive for Redis configuration decisions"
```

**Parameters:**
- `query` (required) - Search query
- `filePattern` - Filter by pattern (e.g., "*.ts")
- `dateRange` - Filter by date
- `sortBy` - "relevance", "date", or "frequency"

### `get_patterns`

Identify recurring patterns and solutions:

```
"Show me recurring error patterns in this project"
```

**Parameters:**
- `type` - "code", "command", "architecture", or "all"
- `minFrequency` - Minimum occurrences
- `limit` - Maximum patterns to return

### MCP Resources (Auto-Loaded)

c0ntextKeeper **automatically loads context at session start** - Claude begins each conversation already aware of your project history:

| Resource | Content |
|----------|---------|
| `context://project/{name}/current` | Recent sessions, decisions, implementations |
| `context://project/{name}/patterns` | Your recurring patterns and workflows |
| `context://project/{name}/knowledge` | Q&A knowledge base |

> **Full MCP documentation:** [MCP Guide](docs/guides/mcp-guide.md) - includes search algorithm details, configuration, and troubleshooting.

---

<details>
<summary><strong>Installation Options</strong></summary>

### Prerequisites
- Node.js 18.0.0 or higher
- Claude Code CLI installed

### Global Installation (Recommended)
```bash
npm install -g c0ntextkeeper
c0ntextkeeper setup
```

### From Source
```bash
git clone https://github.com/Capnjbrown/c0ntextKeeper.git
cd c0ntextKeeper
npm install
npm run build
npm link
```

### Verify Installation
```bash
c0ntextkeeper --version
c0ntextkeeper doctor
```

</details>

<details>
<summary><strong>All CLI Commands (30 total)</strong></summary>

### Core Commands
| Command | Description |
|---------|-------------|
| `setup` | Configure Claude Code hooks |
| `status` | Check automation status |
| `doctor` | Health diagnostics |
| `validate` | Verify configuration |

### Search & Discovery
| Command | Description |
|---------|-------------|
| `search <query>` | Search archived context |
| `patterns` | View recurring patterns |
| `stats` | Storage statistics |

### Hook Management (7 subcommands)
| Command | Description |
|---------|-------------|
| `hooks list` | List all 7 hooks |
| `hooks health` | Check hook data health |
| `hooks enable/disable` | Toggle hooks |
| `hooks config` | Configure hook settings |
| `hooks test` | Test specific hook |
| `hooks stats` | View hook statistics |

### Context Management (3 subcommands)
| Command | Description |
|---------|-------------|
| `context preview` | Preview auto-load content |
| `context test` | Test loading strategies |
| `context configure` | Configuration wizard |

### Storage & Maintenance
| Command | Description |
|---------|-------------|
| `init` | Initialize storage |
| `archive` | Manual archive |
| `cleanup` | Clean old archives |
| `rebuild-index` | Rebuild search indexes |
| `migrate` | Migrate old formats |
| `migrate:restore` | Restore from backup |

### Development
| Command | Description |
|---------|-------------|
| `debug` | Verbose debug mode |
| `benchmark` | Performance testing |
| `test-hook` | Test hook integration |
| `test-mcp` | Test MCP tools |
| `server` | Start MCP server |

📖 **[Full CLI Reference with examples →](docs/guides/cli-reference.md)**

</details>

<details>
<summary><strong>Storage Architecture</strong></summary>

### Directory Structure

```
~/.c0ntextkeeper/
├── config.json                     # Global configuration
└── archive/
    └── projects/
        └── [project-name]/         # Human-readable names
            ├── sessions/           # Full session context
            ├── knowledge/          # Q&A pairs
            ├── patterns/           # Tool usage patterns
            ├── prompts/            # User prompts
            ├── notifications/      # Notifications
            ├── sessions-meta/      # Session lifecycle
            ├── search-index.json   # Inverted index
            └── index.json          # Project stats
```

### Key Features
- **Per-Session Files** - Unique timestamped files per hook event
- **Atomic Writes** - No race conditions or data corruption
- **JSON Format** - Human-readable storage
- **Hybrid Storage** - Project-local or global (configurable)

</details>

<details>
<summary><strong>Configuration</strong></summary>

### Config File

Located at `~/.c0ntextkeeper/config.json`:

```json
{
  "storage": {
    "location": "global",
    "path": "~/.c0ntextkeeper"
  },
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "maxTokens": 50000
  },
  "hooks": {
    "precompact": { "enabled": true },
    "posttool": { "enabled": true },
    "stop": { "enabled": true },
    "userprompt": { "enabled": true },
    "notification": { "enabled": true },
    "sessionstart": { "enabled": true },
    "sessionend": { "enabled": true }
  }
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CONTEXTKEEPER_HOME` | Override storage location |
| `C0NTEXTKEEPER_DEBUG` | Enable debug logging |

</details>

<details>
<summary><strong>Security</strong></summary>

c0ntextKeeper automatically protects sensitive information:

### Protected Data
- **API Keys** - OpenAI, Anthropic, AWS, GitHub
- **Credentials** - Passwords, secrets, connection strings
- **Private Keys** - RSA, SSH keys
- **PII** - Emails (masked), IPs, phone numbers
- **Tokens** - JWT, bearer, session tokens

### Redaction Examples
```
API_KEY=sk-1234...    → API_KEY=[REDACTED]
user@example.com      → ***@example.com
192.168.1.100         → 192.168.***.***
```

</details>

<details>
<summary><strong>Troubleshooting</strong></summary>

### Common Issues

**Hook not triggering:**
```bash
c0ntextkeeper hooks health
c0ntextkeeper doctor
```

**Search returns no results:**
```bash
c0ntextkeeper rebuild-index
c0ntextkeeper status
```

**MCP tools not available:**
1. Verify c0ntextkeeper-server is running
2. Check Claude Code MCP configuration
3. Run `c0ntextkeeper doctor`

### Debug Mode
```bash
C0NTEXTKEEPER_DEBUG=true c0ntextkeeper status
```

</details>

---

## Frequently Asked Questions

<details>
<summary><strong>Does this slow down Claude Code?</strong></summary>

No. All operations average <10ms and hooks run asynchronously without blocking your workflow.
</details>

<details>
<summary><strong>Is my data secure?</strong></summary>

Yes. c0ntextKeeper automatically redacts API keys, credentials, PII, and other sensitive data before archiving. All archives are stored locally on your machine—nothing is sent externally.
</details>

<details>
<summary><strong>Do I need to configure anything after installation?</strong></summary>

No. Run `c0ntextkeeper setup` once and it works automatically forever. Zero ongoing maintenance required.
</details>

<details>
<summary><strong>What happens to my old archives?</strong></summary>

Archives are preserved indefinitely by default. Use `c0ntextkeeper cleanup` to remove old archives if needed, or `c0ntextkeeper stats` to see storage usage.
</details>

<details>
<summary><strong>Can I use this with other AI tools?</strong></summary>

Currently, c0ntextKeeper is designed specifically for Claude Code's hook system. Support for other tools is being considered for future releases.
</details>

---

## Documentation

| Topic | Location |
|-------|----------|
| Quick Start | [docs/guides/quickstart.md](docs/guides/quickstart.md) |
| User Guide | [docs/guides/user-guide.md](docs/guides/user-guide.md) |
| CLI Reference | [docs/guides/cli-reference.md](docs/guides/cli-reference.md) |
| **MCP Guide** | [docs/guides/mcp-guide.md](docs/guides/mcp-guide.md) |
| Hooks Reference | [docs/technical/hooks-reference.md](docs/technical/hooks-reference.md) |
| MCP Tools (Technical) | [docs/technical/mcp-tools.md](docs/technical/mcp-tools.md) |
| Configuration | [docs/technical/configuration.md](docs/technical/configuration.md) |
| Troubleshooting | [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) |
| **CI/CD & Contributing** | [docs/development/CI-CD-GUIDE.md](docs/development/CI-CD-GUIDE.md) |

## Development

```bash
git clone https://github.com/Capnjbrown/c0ntextKeeper.git
cd c0ntextKeeper
npm install

npm run dev          # Development server
npm run build        # Production build
npm test             # Run tests (483 tests)
npm run lint         # Lint code
npm run typecheck    # Type check
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm test`)
5. Open a Pull Request

## Star History

<a href="https://star-history.com/#Capnjbrown/c0ntextKeeper&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Capnjbrown/c0ntextKeeper&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Capnjbrown/c0ntextKeeper&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Capnjbrown/c0ntextKeeper&type=Date" />
 </picture>
</a>

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Made for the Claude Code community!</strong>
</p>

<p align="center">
  <sub>SmB</sub>
</p>
