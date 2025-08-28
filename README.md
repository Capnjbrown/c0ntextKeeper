# 🧠 c0ntextKeeper

> Intelligent context preservation and retrieval for Claude Code - Never lose valuable context again!
> 
> Last Updated: 2025-08-28

[![CI](https://github.com/Capnjbrown/c0ntextKeeper/actions/workflows/ci.yml/badge.svg)](https://github.com/Capnjbrown/c0ntextKeeper/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/c0ntextkeeper.svg)](https://www.npmjs.com/package/c0ntextkeeper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🎯 The Problem

Every time Claude Code runs `/compact`, valuable context is lost forever:
- ❌ Problem-solution pairs vanish
- ❌ Architectural decisions disappear  
- ❌ Successful implementations are forgotten
- ❌ Error resolutions need to be rediscovered
- ❌ You solve the same problems repeatedly

## ✨ The Solution

**c0ntextKeeper** automatically preserves high-value context before compaction and makes it instantly retrievable through MCP tools. It's like having perfect memory for your Claude Code sessions!

### Key Features

- 🎣 **Automatic Capture** - Hooks into preCompact events to preserve context before it's lost
- 🧠 **Intelligent Extraction** - Identifies problems, solutions, decisions, and patterns
- 📊 **Relevance Scoring** - Multi-factor scoring ensures only valuable context is preserved
- 🔍 **Smart Retrieval** - MCP tools provide instant access to relevant historical context
- 📈 **Pattern Recognition** - Identifies recurring solutions and approaches
- 🔒 **Security First** - Automatic filtering of sensitive data (API keys, passwords, PII)
- 💾 **Efficient Storage** - File-based storage with searchable indices
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

Once installed, c0ntextKeeper works automatically! 

1. **Work normally in Claude Code** - Make changes, solve problems, build features
2. **Run `/compact` when needed** - c0ntextKeeper captures context before compaction
3. **Retrieve context anytime** - Use MCP tools to access preserved knowledge

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

```bash
# Setup and configuration
c0ntextkeeper setup          # Configure hooks for Claude Code

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

## 🏗️ Architecture

```
c0ntextKeeper/
├── Hook System          # Captures transcripts during preCompact
├── Extraction Engine    # Analyzes transcripts for valuable context
│   ├── Problem Detector
│   ├── Solution Mapper
│   ├── Decision Extractor
│   └── Pattern Identifier
├── Storage Layer        # Efficient file-based archival
│   └── ~/.c0ntextkeeper/archive/
└── MCP Server           # Exposes retrieval tools to Claude Code
```

## ⚙️ Configuration

c0ntextKeeper works out of the box, but you can customize its behavior:

### Environment Variables

```bash
LOG_LEVEL=INFO           # Logging level (DEBUG, INFO, WARN, ERROR)
RETENTION_DAYS=90        # Days to keep archived context
MAX_CONTEXT_ITEMS=50     # Maximum items per extraction
RELEVANCE_THRESHOLD=0.5  # Minimum relevance score (0-1)
```

### Storage Location

Archives are stored in: `~/.c0ntextkeeper/archive/`

Structure:
```
~/.c0ntextkeeper/archive/
├── projects/
│   ├── [project-hash]/
│   │   ├── sessions/
│   │   │   └── YYYY-MM-DD-[session-id].json
│   │   └── index.json
│   └── ...
└── global/
    └── index.json
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

### ✅ Completed Features
- Core extraction engine with intelligent analysis
- MCP server implementation with 3 tools
- PreCompact hook integration
- File-based storage with indexing
- Pattern recognition and analysis
- CLI tools for manual operations
- Security filtering for sensitive data
- CI/CD pipeline with automated testing
- Full TypeScript with strict mode
- ESLint v9 with flat configuration
- Comprehensive test suite

### 🚧 Roadmap
- Vector search for semantic queries (Q1 2025)
- Team sharing and collaboration (Q2 2025)
- VS Code extension (Q2 2025)
- Web dashboard for analytics (Q3 2025)
- Cloud sync across devices (Q3 2025)

## 💬 Support

### Getting Help
- 📖 [Documentation Wiki](https://github.com/Capnjbrown/c0ntextKeeper/wiki)
- 💬 [GitHub Discussions](https://github.com/Capnjbrown/c0ntextKeeper/discussions)
- 🐛 [Issue Tracker](https://github.com/Capnjbrown/c0ntextKeeper/issues)
- 📧 [Email Support](mailto:support@c0ntextkeeper.com)

### Resources
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