# 🧠 c0ntextKeeper

> Fully automatic context preservation for Claude Code - Never lose valuable work again!
> 
> Last Updated: 2025-08-28

[![CI](https://github.com/Capnjbrown/c0ntextKeeper/actions/workflows/ci.yml/badge.svg)](https://github.com/Capnjbrown/c0ntextKeeper/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/c0ntextkeeper.svg)](https://www.npmjs.com/package/c0ntextkeeper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)
[![🤖 Fully Automatic](https://img.shields.io/badge/🤖-Fully%20Automatic-success)](https://github.com/Capnjbrown/c0ntextKeeper#-how-it-works-automatically)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🎯 The Problem

Every time Claude Code runs `/compact` (manually OR automatically), valuable context is lost forever:
- ❌ Problem-solution pairs vanish
- ❌ Architectural decisions disappear  
- ❌ Successful implementations are forgotten
- ❌ Error resolutions need to be rediscovered
- ❌ You solve the same problems repeatedly

## ✨ The Solution

**c0ntextKeeper** automatically preserves high-value context before compaction and makes it instantly retrievable through MCP tools. It's like having perfect memory for your Claude Code sessions!

### 🤖 Fully Automatic Operation

**No manual intervention required!** c0ntextKeeper works automatically:
1. **Claude Code monitors context size** during your work
2. **When context gets large**, Claude Code auto-compacts
3. **c0ntextKeeper captures everything** before compaction
4. **You continue working** without interruption
5. **Context is never lost** - it's always preserved!

### Key Features

- 🤖 **Fully Automatic** - Works with both manual `/compact` and automatic compaction
- 🎣 **4 Hook System** - PreCompact, UserPromptSubmit, PostToolUse, and Stop hooks
- 🧠 **Intelligent Extraction** - Identifies problems, solutions, decisions, and patterns
- 📊 **Relevance Scoring** - Multi-factor scoring ensures only valuable context is preserved
- 🔍 **Smart Retrieval** - MCP tools provide instant access to relevant historical context
- 📈 **Pattern Recognition** - Identifies recurring solutions and approaches
- ⚙️ **CLI Management** - Complete control over hook configuration and settings
- 📝 **Configuration System** - Centralized config.json for all preferences
- 🔒 **Security First** - Automatic filtering of sensitive data (API keys, passwords, PII)
- 💾 **Efficient Storage** - Multiple storage locations for different data types
- ✅ **Production Ready** - Full CI/CD pipeline, comprehensive testing, TypeScript strict mode

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [MCP Tools](#mcp-tools)
- [Security Features](#-security-features)
- [Examples](#-examples)
- [CLI Commands](#-cli-commands)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Where Is My Data?](#-where-is-my-data-stored)
- [Support](#-support)

## 🚀 Quick Start

```bash
# Install globally
npm install -g c0ntextkeeper

# Run setup wizard
c0ntextkeeper setup

# Verify installation
c0ntextkeeper validate
```

That's it! c0ntextKeeper now automatically captures context before each `/compact`.

## 🤖 How It Works Automatically

c0ntextKeeper requires **zero effort** after installation:

1. **Install once** - Run setup and you're done
2. **Work normally** - No changes to your workflow
3. **Automatic capture** - Claude Code compacts when needed, c0ntextKeeper captures
4. **Context preserved** - Everything saved before it's lost
5. **Retrieve anytime** - Use MCP tools or CLI to access

### Two Types of Compaction (Both Captured!)

| Type | Trigger | c0ntextKeeper Action |
|------|---------|---------------------|
| **Manual** | You type `/compact` | Captures context before compaction |
| **Automatic** | Claude Code detects large context | Captures context automatically |

**You don't need to do anything** - both types are handled automatically!

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- Claude Code installed and configured
- npm or yarn package manager

### Global Installation (Recommended)

```bash
# Install globally via npm
npm install -g c0ntextkeeper

# Run the setup wizard
c0ntextkeeper setup
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

## 📖 Examples

### Example 1: Retrieving Previous Solutions
```
User: "How did we fix the JWT authentication error last time?"
Claude: *Uses fetch_context tool*
Found relevant context from 2024-01-15:
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
Decision from 2024-01-10:
- Chose Redis for session storage
- Rationale: Better performance for key-value operations
- Impact: 10x faster session retrieval
```

## 🛠️ CLI Commands

### Core Commands

```bash
# Setup and configuration
c0ntextkeeper setup          # Configure hooks for Claude Code
c0ntextkeeper status         # Show automation status

# Manual operations
c0ntextkeeper archive <file> # Manually archive a transcript
c0ntextkeeper search <query> # Search archived contexts
c0ntextkeeper patterns       # Analyze recurring patterns
c0ntextkeeper stats          # Show storage statistics
c0ntextkeeper validate       # Verify installation

# Options
c0ntextkeeper --help         # Show all commands
c0ntextkeeper <cmd> --help   # Show command options
```

### Hook Management (Advanced)

```bash
# Manage multiple hooks
c0ntextkeeper hooks list              # Show all available hooks
c0ntextkeeper hooks enable <hook>     # Enable a specific hook
c0ntextkeeper hooks disable <hook>    # Disable a specific hook
c0ntextkeeper hooks test <hook>       # Test a hook
c0ntextkeeper hooks stats             # Show hook statistics
c0ntextkeeper hooks config <hook> -m <pattern>  # Configure matcher
```

Available hooks:
- **PreCompact** (enabled by default) - Automatic context preservation
- **UserPromptSubmit** - Track your questions and prompts
- **PostToolUse** - Capture tool results and patterns
- **Stop** - Save complete Q&A exchanges

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
├── Configuration System    # Centralized settings
│   └── ~/.c0ntextkeeper/config.json
├── Storage Layer          # Multiple storage locations
│   ├── ~/.c0ntextkeeper/archive/    # Session transcripts
│   ├── ~/.c0ntextkeeper/prompts/    # User questions
│   ├── ~/.c0ntextkeeper/patterns/   # Tool usage
│   └── ~/.c0ntextkeeper/knowledge/  # Q&A pairs
└── MCP Server            # Exposes retrieval tools to Claude Code
    ├── fetch_context
    ├── search_archive
    └── get_patterns
```

## 📁 Where Is My Data Stored?

**All data is stored locally on your Mac** in hidden directories:

| Data Type | Location | Purpose |
|-----------|----------|----------|
| **Archived Contexts** | `~/.c0ntextkeeper/archive/` | Your preserved work sessions |
| **Hook Configuration** | `~/.claude/settings.json` | Claude Code integration settings |
| **Logs** | `~/.c0ntextkeeper/logs/` | Debug and execution logs |

### Quick Access Commands

```bash
# Open your archives in Finder
open ~/.c0ntextkeeper/archive

# View your latest archive
ls -t ~/.c0ntextkeeper/archive/projects/*/sessions/*.json | head -1 | xargs cat | jq '.'

# Search your archives
c0ntextkeeper search "authentication"

# Check storage size
du -sh ~/.c0ntextkeeper/
```

**📖 For detailed information, see the [USER-GUIDE.md](USER-GUIDE.md)**

## ⚙️ Configuration

c0ntextKeeper works out of the box, but you can customize its behavior:

### Environment Variables

```bash
LOG_LEVEL=INFO           # Logging level (DEBUG, INFO, WARN, ERROR)
RETENTION_DAYS=90        # Days to keep archived context
MAX_CONTEXT_ITEMS=50     # Maximum items per extraction
RELEVANCE_THRESHOLD=0.5  # Minimum relevance score (0-1)
```

### Storage Structure

```
~/.c0ntextkeeper/archive/
├── projects/
│   ├── [project-hash]/         # Unique hash per project
│   │   ├── sessions/           # Individual work sessions
│   │   │   └── YYYY-MM-DD-[session-id].json
│   │   └── index.json          # Project index
│   └── ...
└── global/
    └── index.json              # Master index
```

## 🧪 Development

### Prerequisites
- Node.js 18.x, 20.x, or 22.x
- TypeScript 5.9+
- Git

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

## 🧪 Testing

c0ntextKeeper uses Jest for comprehensive testing:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### CI/CD Pipeline

Our GitHub Actions pipeline runs on every push and PR:
- **Multi-version testing**: Node.js 18.x, 20.x, 22.x
- **Code quality**: ESLint, TypeScript, Prettier
- **Security audits**: npm audit for vulnerabilities
- **Coverage reporting**: Automated Codecov integration
- **Automated releases**: Semantic versioning on main branch

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`) and linting (`npm run lint`)
5. Commit using conventional commits (`feat:`, `fix:`, etc.)
6. Push to your branch
7. Open a Pull Request

### Areas for Contribution

- 🔌 Additional extractors for specific patterns
- 🎨 VS Code extension for inline context
- 🚀 Performance optimizations
- 📊 Analytics and visualization
- 🌐 Cloud sync capabilities
- 🧪 Expanding test coverage
- 📝 Documentation improvements
- 🔒 Security enhancements

## 📝 License

MIT - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to:
- The Claude Code team at Anthropic for creating an amazing development environment
- The MCP community for protocol development and support
- All contributors who help make c0ntextKeeper better

## 📊 Project Status

### ✅ Completed Features (v1.0.0)
- **Fully automatic operation** with manual and auto compaction support
- **4 working hooks** (PreCompact, UserPromptSubmit, PostToolUse, Stop)
- **Hook management CLI** with enable/disable/test commands
- **Configuration system** via config.json
- Core extraction engine with intelligent analysis
- MCP server implementation with 3 tools
- File-based storage with multiple directories
- Pattern recognition and analysis
- Security filtering for sensitive data
- CI/CD pipeline with automated testing
- Full TypeScript with strict mode
- ESLint v9 with flat configuration
- Comprehensive test suite with 18 core modules

### 🚧 Roadmap
- SessionStart/SessionEnd hooks (Q1 2025)
- PreToolUse hook implementation (Q1 2025)
- Vector search for semantic queries (Q2 2025)
- Team sharing and collaboration (Q3 2025)
- VS Code extension (Q4 2025)
- Web dashboard for analytics (Q1 2026)
- Cloud sync across devices (Q2 2026)

## 💬 Support

### Getting Help
- 📖 [Documentation Wiki](https://github.com/Capnjbrown/c0ntextKeeper/wiki)
- 💬 [GitHub Discussions](https://github.com/Capnjbrown/c0ntextKeeper/discussions)
- 🐛 [Issue Tracker](https://github.com/Capnjbrown/c0ntextKeeper/issues)
- 📧 [Email Support](mailto:support@c0ntextkeeper.com)

### Resources
- [User Guide](USER-GUIDE.md) - Complete guide to accessing your data
- [Hook Integration](HOOK-INTEGRATION.md) - Technical setup details
- [Homepage](https://c0ntextkeeper.com)
- [NPM Package](https://www.npmjs.com/package/c0ntextkeeper)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)

---

<p align="center">
  <strong>Never lose context again.</strong> Start using c0ntextKeeper today!
</p>

<p align="center">
  Built with ❤️ for the Claude Code community by <a href="https://github.com/Capnjbrown">Jason Brown</a>
</p>

<p align="center">
  <a href="https://github.com/Capnjbrown/c0ntextKeeper/stargazers">⭐ Star us on GitHub</a> • 
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20c0ntextKeeper%20-%20Never%20lose%20valuable%20context%20in%20Claude%20Code%20again!&url=https://github.com/Capnjbrown/c0ntextKeeper">Share on Twitter</a>
</p>

SMB