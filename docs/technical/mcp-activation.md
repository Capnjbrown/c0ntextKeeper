# 🚀 c0ntextKeeper MCP Server Activation Guide

## ✅ Installation Complete!

The c0ntextKeeper MCP server has been successfully registered with Claude Code.

## 🔄 Activation Steps

1. **Restart Claude Code**
   - Close Claude Code completely
   - Open Claude Code again

2. **Verify Installation**
   ```
   /mcp
   ```
   You should now see `c0ntextkeeper` in the list of available MCP servers.

3. **Check Status**
   ```
   /status
   ```
   Should show c0ntextkeeper as connected.

## 🧪 Test the MCP Tools

Once Claude Code is restarted, test the three available tools:

### 1. Fetch Context Tool
```
"Use fetch_context to find any previous work on authentication"
```

### 2. Search Archive Tool  
```
"Use search_archive to find any Redis configuration decisions"
```

### 3. Get Patterns Tool
```
"Use get_patterns to show me recurring command patterns"
```

## 📍 MCP Server Location

The server runs from your c0ntextKeeper installation:
```
~/Projects/c0ntextKeeper/dist/server/index.js
```

Or if installed globally via npm:
```
$(npm root -g)/c0ntextkeeper/dist/server/index.js
```

## 🛠️ Manual Testing

You can manually test the server without Claude Code:
```bash
node scripts/test-mcp-server.js
```

## ✅ What's Working

- **MCP Server**: Registered in `.mcp.json` ✅
- **3 Tools Available**:
  - `fetch_context` - Retrieve relevant archived context
  - `search_archive` - Search through all archives
  - `get_patterns` - Find recurring patterns
- **Server Starts**: Successfully tested ✅
- **Tools Respond**: All three tools return valid responses ✅

## 🎣 How It Works Together

1. **Hooks Capture** (4 hooks capture different data):
   - PreCompact → Full session transcripts
   - UserPromptSubmit → Your questions
   - PostToolUse → Tool results
   - Stop → Q&A exchanges

2. **MCP Tools Retrieve** (3 tools access captured data):
   - fetch_context → Gets relevant context
   - search_archive → Searches archives
   - get_patterns → Finds patterns

## 📊 Current Archive Status

Check what's been captured so far:
```bash
# Check storage configuration
c0ntextkeeper status

# Count all archives
find ~/.c0ntextkeeper/archive -name "*.json" | wc -l

# View latest session archive
ls -t ~/.c0ntextkeeper/archive/projects/*/sessions/*.json | head -1

# Check storage size
c0ntextkeeper stats

# Or manually
du -sh ~/.c0ntextkeeper/
```

## 🏗️ v0.7.0 Unified Storage Architecture

- **📁 Global Storage Default** - Archives at `~/.c0ntextkeeper/archive/`
- **🏷️ Project Name Organization** - Archives organized by readable project names
- **🎛️ Environment Override** - Use `CONTEXTKEEPER_HOME` for custom locations
- **📊 Storage Status** - Check configuration with `c0ntextkeeper status`

## 🎉 Success!

Your c0ntextKeeper system is now fully operational with:
- ✅ Automatic context preservation (PreCompact hook)
- ✅ Optional additional hooks (UserPromptSubmit, PostToolUse, Stop)
- ✅ MCP server for context retrieval
- ✅ CLI tools for management

Never lose valuable context again! 🧠