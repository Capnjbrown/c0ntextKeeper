# c0ntextKeeper

An MCP server that intelligently preserves valuable context from Claude Code sessions during compaction, ensuring no critical knowledge is lost between conversations.

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Claude Code CLI installed
- GitHub Personal Access Token (for github-mcp server)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/c0ntextKeeper.git
   cd c0ntextKeeper
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Add your GitHub token**
   Edit `.env` and add your GitHub Personal Access Token:
   ```
   GITHUB_TOKEN=your_github_token_here
   ```
   
   Get a token at: https://github.com/settings/tokens

4. **Start Claude Code with MCP servers**

   **Option A: Use the setup script (Recommended)**
   ```bash
   ./setup-env.sh
   ```

   **Option B: Manual setup**
   ```bash
   # Load environment variables
   source .env
   
   # Start Claude Code
   claude
   ```

   **Option C: Add to shell profile (Permanent)**
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export GITHUB_TOKEN=your_github_token_here
   
   # Reload shell
   source ~/.zshrc
   
   # Start Claude Code normally
   claude
   ```

## MCP Servers Status

### ✅ All Servers Operational (Tested 2025-08-27)

This project includes the following MCP servers:

| Server | Package | Status | Purpose |
|--------|---------|--------|----------|
| **sequential-thinking** | @modelcontextprotocol/server-sequential-thinking | ✅ Operational | Complex reasoning and planning |
| **filesystem** | @modelcontextprotocol/server-filesystem | ✅ Operational | File operations (restricted to project) |
| **github-mcp** | @modelcontextprotocol/server-github | ✅ Operational | GitHub repository research |
| **context7** | @upstash/context7-mcp | ✅ Operational | Documentation lookup |
| **fetch** | @kazuph/mcp-fetch | ✅ Operational | Web content fetching |

### Quick Verification

After starting Claude Code, verify all servers are connected:

```bash
# Check server status
/mcp        # Should list all 5 servers
/status     # Overall Claude Code status
```

### Test Each Server

```bash
# Test filesystem
"Use mcp__filesystem__list_allowed_directories"

# Test sequential-thinking
"Use mcp__sequential-thinking__sequentialthinking to test reasoning"

# Test github-mcp
"Use mcp__github-mcp__search_repositories for 'MCP server'"

# Test context7
"Use mcp__context7__resolve-library-id for 'typescript'"

# Test fetch
"Use mcp__fetch__imageFetch to get https://modelcontextprotocol.io"
```

## Troubleshooting

### MCP servers not connecting

If you see "No MCP servers configured" when running `/mcp`:

1. **Check environment variables are loaded**
   ```bash
   echo $GITHUB_TOKEN
   ```
   Should output your token, not empty

2. **Use the setup script**
   ```bash
   ./setup-env.sh
   ```

3. **Check .mcp.json exists**
   ```bash
   ls -la .mcp.json
   ```

4. **Run diagnostics**
   ```bash
   claude /doctor
   ```

### Missing GITHUB_TOKEN error

The github-mcp server requires a GitHub Personal Access Token. Without it, none of the MCP servers will load.

1. Create a token at https://github.com/settings/tokens
2. Add it to your `.env` file
3. Restart Claude Code using one of the methods above

## Project Structure

```
c0ntextKeeper/
├── .mcp.json          # MCP server configurations
├── .env               # Environment variables (git-ignored)
├── .env.example       # Environment template
├── setup-env.sh       # Quick start script
├── README.md          # This file
├── CLAUDE.md          # Project context and roadmap
├── MCP-USAGE.md       # Detailed MCP server documentation
└── MCP-TESTING.md     # MCP server testing procedures
```

## Documentation

- **[MCP-USAGE.md](./MCP-USAGE.md)** - Comprehensive guide to using each MCP server
- **[MCP-TESTING.md](./MCP-TESTING.md)** - Testing procedures and verification commands
- **[CLAUDE.md](./CLAUDE.md)** - Project context, development roadmap, and architecture

## Development Status

Currently in **Phase 2: Project Setup**
- ✅ MCP servers configured and tested
- ✅ Project isolation enforced
- ✅ Documentation structure complete
- ⏳ Node.js/TypeScript setup pending

See [CLAUDE.md](./CLAUDE.md) for detailed development roadmap.

## License

MIT