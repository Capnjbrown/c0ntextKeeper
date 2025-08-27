# 🧠 c0ntextKeeper

> Intelligent context preservation and retrieval for Claude Code - Never lose valuable context again!
> 
> Last Updated: 2025-08-27

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)

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
- 💾 **Efficient Storage** - File-based storage with searchable indices

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g c0ntextkeeper

# Run the setup wizard
c0ntextkeeper setup
```

Or install locally in a project:

```bash
npm install c0ntextkeeper
npx c0ntextkeeper setup
```

### Usage

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

### Building from Source

```bash
# Clone the repository
git clone https://github.com/Capnjbrown/c0ntextKeeper.git
cd c0ntextKeeper

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Project Structure

```
src/
├── server/          # MCP server implementation
├── hooks/           # PreCompact hook handlers
├── core/            # Extraction and analysis logic
├── storage/         # Storage abstraction
├── tools/           # MCP tool implementations
└── utils/           # Utilities and helpers
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- 🔌 Additional extractors for specific patterns
- 🎨 VS Code extension for inline context
- 🚀 Performance optimizations
- 📊 Analytics and visualization
- 🌐 Cloud sync capabilities

## 📝 License

MIT - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built for the Claude Code community to solve the universal problem of context loss during compaction.

## 📊 Status

- ✅ Core extraction engine
- ✅ MCP server implementation
- ✅ PreCompact hook integration
- ✅ File-based storage
- ✅ Pattern recognition
- ✅ CLI tools
- 🚧 Vector search (coming soon)
- 🚧 Team sharing (planned)
- 🚧 VS Code extension (planned)

## 🔗 Links

- [Homepage](https://c0ntextkeeper.com)
- [Documentation](https://github.com/Capnjbrown/c0ntextKeeper/wiki)
- [Issues](https://github.com/Capnjbrown/c0ntextKeeper/issues)
- [NPM Package](https://www.npmjs.com/package/c0ntextkeeper)

---

**Never lose context again.** Start using c0ntextKeeper today!

> Built with ❤️ for the Claude Code community. SMB.