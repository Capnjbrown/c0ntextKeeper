# MCP Guide

Complete reference for c0ntextKeeper's Model Context Protocol integration and semantic search capabilities.

> **Note**: MCP tools work automatically when you ask Claude naturally.
> You don't need to know tool names - just describe what you need.

> **Case Sensitivity**: The CLI command is `c0ntextkeeper` (all lowercase with zero).
> The project name is `c0ntextKeeper` (capital K), but commands are always lowercase.

---

## Overview

c0ntextKeeper provides intelligent semantic search through the Model Context Protocol:

| Component | Count | Description |
|-----------|-------|-------------|
| **MCP Tools** | 3 | `fetch_context`, `search_archive`, `get_patterns` |
| **MCP Resources** | 3 | Auto-loaded context at session start |
| **Stop Words** | 32 | Filtered for precision |
| **Word Expansions** | 9 | Automatic query enhancement |

### The Power of Natural Language

**Traditional search:** You need to know exact keywords and file names.

**c0ntextKeeper semantic search:** Just ask Claude what you need. The system automatically:
- Tokenizes your query into meaningful words
- Expands terms (e.g., "fix" → "fixed", "fixes", "fixing")
- Filters noise words ("the", "a", "an")
- Scores results by relevance and recency
- Returns the most useful context

---

## Natural Language Examples

### Finding Past Work

| What You Ask Claude | Tool Used | What Happens |
|---------------------|-----------|--------------|
| "What did I implement for authentication?" | `fetch_context` | Searches all auth-related implementations |
| "How did I fix that database connection error?" | `fetch_context` | Finds database error solutions |
| "What have we done with Redis in this project?" | `fetch_context` | Retrieves Redis-related work |
| "Show me the API endpoint implementations" | `fetch_context` | Lists API-related code |
| "What authentication approaches have I used?" | `fetch_context` | Summarizes auth decisions |
| "Find similar problems I've solved before" | `fetch_context` | Matches current context to past work |
| "What did we decide about the database schema?" | `fetch_context` | Retrieves architecture decisions |

### Filtered Searches

| What You Ask Claude | Tool Used | What Happens |
|---------------------|-----------|--------------|
| "Find TypeScript files with auth logic" | `search_archive` | Filters by `*.ts` pattern |
| "What did I work on last week?" | `search_archive` | Date range filter applied |
| "Show me all React component changes" | `search_archive` | Filters by `*.tsx` pattern |
| "Find the most recent error fixes" | `search_archive` | Sorted by date |
| "What files have I modified most often?" | `search_archive` | Sorted by frequency |

### Pattern Discovery

| What You Ask Claude | Tool Used | What Happens |
|---------------------|-----------|--------------|
| "What commands do I run most often?" | `get_patterns` | Shows command patterns |
| "What are my common coding patterns?" | `get_patterns` | Lists code patterns |
| "Show me recurring error patterns" | `get_patterns` | Displays error-handling patterns |
| "What architectural patterns do I use?" | `get_patterns` | Shows architecture patterns |
| "What's my typical workflow?" | `get_patterns` | Analyzes workflow patterns |

---

## MCP Tools (3 total)

### `fetch_context`

**Purpose**: Semantic search across all archived context

**Best For**:
- Starting work on a new feature
- Understanding past architectural decisions
- Finding solutions to similar problems
- Resuming work after a break

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | (optional) | Search query or task description |
| `limit` | number | 5 | Maximum results to return (1-100) |
| `scope` | string | "project" | Search scope: "session", "project", "global" |
| `minRelevance` | number | 0.3 | Minimum relevance score (0-1) |

**Scope Options**:
- `"session"` - Current conversation only (fastest)
- `"project"` - All sessions in current project (recommended)
- `"global"` - All projects (slowest, cross-project knowledge)

**Example Request**:
```json
{
  "name": "fetch_context",
  "arguments": {
    "query": "authentication implementation JWT",
    "limit": 10,
    "scope": "project",
    "minRelevance": 0.5
  }
}
```

**Example Response**:
```json
{
  "context": {
    "problems": [
      {
        "question": "How to implement JWT authentication?",
        "solution": {
          "approach": "Use jsonwebtoken library with refresh tokens",
          "implementation": "Created auth middleware in src/middleware/auth.ts",
          "outcome": "Secure authentication with token rotation"
        }
      }
    ],
    "implementations": [
      {
        "tool": "Write",
        "file": "src/middleware/auth.ts",
        "description": "JWT authentication middleware"
      }
    ],
    "decisions": [
      {
        "decision": "Use HTTP-only cookies for tokens",
        "reasoning": "Better security against XSS attacks"
      }
    ]
  },
  "metadata": {
    "totalResults": 3,
    "relevanceRange": "0.85-0.92"
  }
}
```

---

### `search_archive`

**Purpose**: Advanced filtered search with date ranges and file patterns

**Best For**:
- Finding specific errors you've encountered
- Filtering by file types (e.g., only TypeScript files)
- Date-based searches ("what did I work on last week?")
- Complex multi-criteria queries

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | (required) | Search keywords |
| `filePattern` | string | (optional) | Filter by glob pattern (e.g., `*.ts`, `src/**/*.js`) |
| `dateRange` | object | (optional) | `{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }` |
| `projectPath` | string | (optional) | Filter by specific project |
| `limit` | number | 10 | Maximum results (1-100) |
| `sortBy` | string | "relevance" | Sort order: "relevance", "date", "frequency" |

**Sort Options**:
- `"relevance"` - Best matches first (default)
- `"date"` - Most recent first
- `"frequency"` - Most matched fields first

**Example Request**:
```json
{
  "name": "search_archive",
  "arguments": {
    "query": "database connection error",
    "filePattern": "*.ts",
    "dateRange": {
      "from": "2025-12-01",
      "to": "2025-12-31"
    },
    "sortBy": "date",
    "limit": 20
  }
}
```

**Example Response**:
```json
{
  "results": [
    {
      "sessionId": "fb212570",
      "date": "2025-12-28",
      "file": "src/db/connection.ts",
      "match": "...fixed database connection timeout by increasing pool size...",
      "relevance": 0.87,
      "matchedFields": ["solutions", "implementations"]
    }
  ],
  "metadata": {
    "totalResults": 5,
    "searchTime": "8ms"
  }
}
```

---

### `get_patterns`

**Purpose**: Discover recurring patterns and workflows

**Best For**:
- Understanding your coding habits
- Finding common solutions you use
- Identifying workflow optimizations
- Tracking pattern trends over time

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "all" | Pattern type: "code", "command", "architecture", "all" |
| `minFrequency` | number | 2 | Minimum occurrences required |
| `projectPath` | string | (optional) | Filter by specific project |
| `limit` | number | 10 | Maximum patterns to return (1-50) |

**Pattern Types**:
- `"code"` - Code patterns and idioms
- `"command"` - CLI commands you run frequently
- `"architecture"` - Architectural decisions and structures
- `"all"` - All pattern types combined

**Example Request**:
```json
{
  "name": "get_patterns",
  "arguments": {
    "type": "command",
    "minFrequency": 3,
    "limit": 10
  }
}
```

**Example Response**:
```json
{
  "patterns": [
    {
      "type": "command",
      "value": "npm run lint && npm run typecheck",
      "frequency": 47,
      "firstSeen": "2025-11-01",
      "lastSeen": "2025-12-31",
      "trend": "stable",
      "examples": [
        "Before committing changes",
        "After major refactoring"
      ]
    },
    {
      "type": "command",
      "value": "git status && git diff",
      "frequency": 32,
      "firstSeen": "2025-10-15",
      "lastSeen": "2025-12-31",
      "trend": "increasing"
    }
  ],
  "metadata": {
    "totalPatterns": 2,
    "projectPath": "/Users/dev/myproject"
  }
}
```

**Trend Analysis**:
- `"increasing"` - Pattern used more frequently recently
- `"stable"` - Consistent usage over time
- `"decreasing"` - Pattern used less frequently

---

## MCP Resources (3 total)

MCP resources are **auto-loaded at session start** before your first message. Claude begins each conversation already aware of your project context.

### `context://project/{name}/current`

**Purpose**: Recent project context

**Content Includes**:
- Recent sessions with problems, implementations, decisions
- Key architectural decisions with reasoning
- Top recurring patterns with frequency counts
- Session metadata (duration, tools used, files modified)

**Auto-Load Behavior**: Loaded automatically when you start a new Claude Code session in a project with archived context.

---

### `context://project/{name}/patterns`

**Purpose**: Recurring patterns for this project

**Content Includes**:
- Up to 10 most frequent patterns
- Pattern types (code, command, architecture)
- First/last seen timestamps
- Usage examples

---

### `context://project/{name}/knowledge`

**Purpose**: Q&A knowledge base

**Content Includes**:
- Up to 20 recent Q&A pairs
- Relevance scores for each entry
- Solutions and outcomes

---

### Resource Configuration

Configure auto-load behavior with:

```bash
c0ntextkeeper context configure
```

**Loading Strategies**:
- `smart` (default) - Balances recency and relevance
- `recent` - Prioritizes most recent sessions
- `relevant` - Prioritizes highest-scoring context
- `custom` - User-defined configuration

---

## How The Search Algorithm Works

c0ntextKeeper uses a sophisticated multi-stage search algorithm that combines natural language processing with relevance scoring.

### 1. Tokenization

Your query is split into individual meaningful words:

```
Input:  "How did I fix the database connection error?"
Output: ["fix", "database", "connection", "error"]
```

Words shorter than 3 characters are removed, along with stop words.

### 2. Word Expansion

Common terms are automatically expanded to catch variations:

| Original Word | Expands To |
|---------------|------------|
| `fix` | fix, fixed, fixes, fixing |
| `implement` | implementation, implemented, implementing |
| `recent` | recently, latest, last |
| `work` | working, worked, works |
| `solution` | solutions, solve, solved, solving |
| `context` | contextkeeper, c0ntextkeeper |
| `fetch` | fetching, fetched, retrieve, retrieval |
| `tool` | tools, tool_use, tooluse |
| `mcp` | mcp__, modelcontextprotocol |

### 3. Stop Word Filtering

These 32 common words are removed from queries for better precision:

```
the, a, an, and, or, but, in, on, at, to, for, of, with, by, from, as,
is, was, are, were, been, be, have, has, had, do, does, did, will,
would, could, should, may, might, must, can, what, we, our, ours,
ourselves, you, your, yours, yourself
```

### 4. Multi-Field Scoring

Different content types are weighted differently:

| Field | Weight | Description |
|-------|--------|-------------|
| **Problems (question)** | 0.30 | Questions you've asked |
| **Problems (solution)** | 0.20 | Solutions that worked |
| **Implementations (description)** | 0.20 | What was built |
| **Implementations (file)** | 0.10 | File paths touched |
| **Decisions (decision)** | 0.20 | Decisions made |
| **Decisions (context)** | 0.10 | Decision context |
| **Patterns** | 0.10 | Recurring patterns |

### 5. Temporal Decay

Recent content scores higher than old content:

```
score = baseScore × e^(-daysSince / 60)
```

| Age | Score Multiplier | Example |
|-----|------------------|---------|
| Today | 100% | Full relevance |
| 1 week | 89% | Slightly reduced |
| 30 days | 61% | Moderately reduced |
| 60 days | 37% | Half-life reached |
| 120 days | 14% | Significantly aged |

**Half-life**: 60 days - content from 60 days ago receives 37% of its original score.

### 6. Frequency Boost

More matches = higher score (up to +30%):

```
frequencyBoost = min(matchCount × 0.05, 0.30)
```

### 7. Final Score

```
finalScore = min((baseScore + frequencyBoost) × temporalFactor, 1.0)
```

Scores are capped at 1.0 (100% relevance).

---

## Tool Selection Guide

| Your Goal | Recommended Tool | Why |
|-----------|------------------|-----|
| Start a new feature | `fetch_context` | Broad semantic search for related work |
| Find a specific error fix | `search_archive` | Can filter by file type and date |
| Understand architecture | `fetch_context` | Finds decisions and implementations |
| See what you did last week | `search_archive` | Use `dateRange` parameter |
| Find TypeScript-only changes | `search_archive` | Use `filePattern: "*.ts"` |
| Discover your habits | `get_patterns` | Shows recurring behaviors |
| Find common commands | `get_patterns` | Use `type: "command"` |
| Resume work after break | `fetch_context` | Gets you up to speed quickly |

---

## Best Practices

### Query Optimization

**Good Queries** (specific, meaningful terms):
```
"authentication JWT implementation"
"database connection error fix"
"React component state management"
"API endpoint validation"
```

**Poor Queries** (too vague or common):
```
"help"
"code"
"error"
"the thing"
```

### Scope Recommendations

| Situation | Recommended Scope |
|-----------|-------------------|
| Working on current project | `"project"` (default) |
| Quick current-session lookup | `"session"` (fastest) |
| Cross-project knowledge | `"global"` (slowest) |

### Relevance Thresholds

| Threshold | Use Case |
|-----------|----------|
| `0.3` | Default - balanced results |
| `0.5` | Higher precision, fewer results |
| `0.7` | Only highly relevant matches |
| `0.1` | Maximum recall, more noise |

---

## Troubleshooting

### No Results Found

**Possible Causes**:
1. No archived sessions yet - run a few sessions first
2. Query too specific - try broader terms
3. Wrong scope - try `"global"` scope
4. High `minRelevance` - lower threshold

**Solutions**:
```bash
# Check if archives exist
c0ntextkeeper stats

# Check archive health
c0ntextkeeper doctor

# Search with lower threshold
# Use minRelevance: 0.1 in tool call
```

### Poor Relevance

**Possible Causes**:
1. Query uses stop words only
2. Content is too old (temporal decay)
3. Wrong field being searched

**Solutions**:
- Use more specific technical terms
- Try different word variations
- Use `search_archive` with file filters

### Auto-Load Not Working

**Check Configuration**:
```bash
# Preview what would load
c0ntextkeeper context preview

# Test loading
c0ntextkeeper context test

# Reconfigure
c0ntextkeeper context configure
```

### MCP Server Issues

**Diagnostic Commands**:
```bash
# Full health check
c0ntextkeeper doctor

# Test MCP tools
c0ntextkeeper test-mcp

# Check server status
c0ntextkeeper status
```

---

## Configuration

### Auto-Load Settings

```bash
# Configure auto-load behavior
c0ntextkeeper context configure

# Options:
# - Loading strategy (smart, recent, relevant, custom)
# - Maximum context size
# - Included content types
# - Minimum relevance threshold
```

### MCP Server Registration

The MCP server is registered in your Claude Code settings at `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "c0ntextkeeper": {
      "command": "npx",
      "args": ["c0ntextkeeper", "server"]
    }
  }
}
```

---

## CLI Commands for MCP

| Command | Description |
|---------|-------------|
| `c0ntextkeeper test-mcp` | Test all MCP tools |
| `c0ntextkeeper context preview` | Preview auto-load content |
| `c0ntextkeeper context test` | Test context loading |
| `c0ntextkeeper context configure` | Configure auto-load |
| `c0ntextkeeper server` | Start MCP server directly |

---

## See Also

- [CLI Reference](./cli-reference.md) - Complete CLI command reference
- [User Guide](./user-guide.md) - Getting started and workflows
- [Quickstart](./quickstart.md) - 60-second setup
- [Technical MCP Reference](../technical/mcp-tools.md) - Deep technical details
- [Auto-Load Guide](./auto-load-guide.md) - Auto-load configuration
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

---

*Last updated: 2025-12-31 | c0ntextKeeper v0.7.8*
