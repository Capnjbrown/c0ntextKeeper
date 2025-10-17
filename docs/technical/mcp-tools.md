# MCP Tools & Resources Reference

> **Complete guide to c0ntextKeeper's Model Context Protocol integration**

---

## Overview

c0ntextKeeper provides **3 MCP tools** and **3 MCP resources** to give Claude Code intelligent access to your archived context. This enables:

- **Session-Start Awareness**: Auto-loaded context before your first message
- **Intelligent Search**: Natural language queries across all archives
- **Pattern Recognition**: Discover recurring solutions and workflows
- **Cross-Session Learning**: Build on past decisions and implementations

---

## MCP Tools (3 total)

### 1. `fetch_context`

**Purpose**: Retrieve relevant archived context for the current task

**Best For**:
- Getting started on a new feature in an existing project
- Understanding past decisions about architecture
- Finding similar problems you've solved before
- Resuming work after a break

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | (optional) | Search query or task description |
| `limit` | number | 5 | Max results to return (1-100) |
| `scope` | string | "project" | Search scope: "session", "project", "global" |
| `minRelevance` | number | 0.3 | Min relevance score (0-1) |

**How It Works**:

1. **Tokenizes Query**: Splits into meaningful words, removes stop words ("the", "a", etc.)
2. **Word Expansion**: "fix" → ["fix", "fixed", "fixes", "fixing"]
3. **Index Lookup**: O(1) keyword search via inverted index
4. **Relevance Scoring**: Combines term frequency + temporal decay
5. **Context Assembly**: Formats problems, solutions, implementations

**Examples**:

```json
{
  "name": "fetch_context",
  "arguments": {
    "query": "authentication implementation",
    "limit": 10,
    "scope": "project"
  }
}
```

**Claude Code Usage**:
```
Ask Claude: "What have I implemented for user authentication in this project?"
Claude uses: fetch_context with query="authentication implementation"
```

**Response Format**:
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
        "reasoning": "Better security against XSS attacks",
        "alternatives": ["localStorage", "sessionStorage"]
      }
    ]
  },
  "metadata": {
    "totalResults": 3,
    "relevanceRange": "0.85-0.92",
    "sourceCount": 2
  }
}
```

**Scope Behavior**:
- `"session"`: Current conversation only (fastest)
- `"project"`: All sessions in current project (recommended)
- `"global"`: All projects (slowest, rarely needed)

---

### 2. `search_archive`

**Purpose**: Advanced search with filters, sorting, and date ranges

**Best For**:
- Finding specific errors you've encountered
- Filtering by file patterns (e.g., "*.ts" files only)
- Date-based searches ("what did I work on last week?")
- Complex multi-criteria queries

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | (required) | Search keywords |
| `filePattern` | string | (optional) | Filter by glob pattern (e.g., "*.ts", "src/**/*.js") |
| `dateRange` | object | (optional) | `{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }` |
| `projectPath` | string | (optional) | Filter by specific project |
| `limit` | number | 10 | Max results (1-100) |
| `sortBy` | string | "relevance" | Sort order: "relevance", "date", "frequency" |

**How It Works**:

1. **Natural Language Parsing**: Tokenizes query like fetch_context
2. **Filter Application**: Applies file patterns, date ranges, project filters
3. **Index Search**: Uses inverted index for O(1) lookups
4. **Result Ranking**: Scores by relevance, recency, or frequency
5. **Snippet Extraction**: Shows ±50 characters around matches

**Examples**:

```json
{
  "name": "search_archive",
  "arguments": {
    "query": "database connection error fix",
    "filePattern": "*.ts",
    "limit": 20,
    "sortBy": "date"
  }
}
```

```json
{
  "name": "search_archive",
  "arguments": {
    "query": "API rate limiting",
    "dateRange": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    },
    "sortBy": "relevance"
  }
}
```

**Claude Code Usage**:
```
Ask Claude: "Show me TypeScript files where we fixed database errors"
Claude uses: search_archive with query="database error fix" filePattern="*.ts"
```

**Response Format**:
```json
{
  "results": [
    {
      "sessionId": "2025-01-15-14-30-45-session",
      "timestamp": "2025-01-15T14:30:45.000Z",
      "relevanceScore": 0.89,
      "matchCount": 3,
      "snippet": "...connection pool exhausted error. Fixed by implementing connection timeout...",
      "context": {
        "problem": "Database connection pool exhaustion",
        "solution": "Added connection timeout and retry logic",
        "files": ["src/db/pool.ts"]
      }
    }
  ],
  "metadata": {
    "totalResults": 15,
    "searchTime": "4ms",
    "indexSize": "2847 documents"
  }
}
```

**Sort Options**:
- `"relevance"`: Best semantic match (default)
- `"date"`: Most recent first
- `"frequency"`: Most commonly occurring patterns

**File Pattern Examples**:
- `"*.ts"` - TypeScript files only
- `"src/**/*.js"` - JavaScript files in src/ and subdirectories
- `"**/*test*"` - Any file with "test" in the name

---

### 3. `get_patterns`

**Purpose**: Retrieve recurring patterns, common solutions, and workflows

**Best For**:
- Discovering your most-used commands
- Finding common code modification patterns
- Understanding your development workflow
- Identifying frequently solved problems

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "all" | Pattern type: "code", "command", "architecture", "all" |
| `minFrequency` | number | 2 | Minimum occurrences to be considered a pattern |
| `limit` | number | 10 | Max patterns to return (1-50) |

**How It Works**:

1. **Pattern Aggregation**: Scans all PostToolUse hook data
2. **Frequency Analysis**: Counts occurrences of similar patterns
3. **Categorization**: Groups by type (code, command, architecture)
4. **Ranking**: Sorts by frequency and recency
5. **Example Extraction**: Provides real examples from archives

**Examples**:

```json
{
  "name": "get_patterns",
  "arguments": {
    "type": "command",
    "minFrequency": 3,
    "limit": 15
  }
}
```

```json
{
  "name": "get_patterns",
  "arguments": {
    "type": "code",
    "minFrequency": 5,
    "limit": 10
  }
}
```

**Claude Code Usage**:
```
Ask Claude: "What are my most common git commands?"
Claude uses: get_patterns with type="command" minFrequency=3
```

**Response Format**:
```json
{
  "patterns": [
    {
      "type": "command",
      "pattern": "npm run test && npm run build",
      "frequency": 47,
      "lastUsed": "2025-01-20T10:15:30.000Z",
      "examples": [
        {
          "sessionId": "2025-01-20-10-15-30-session",
          "context": "Testing and building before deployment"
        }
      ]
    },
    {
      "type": "code",
      "pattern": "Add error handling with try-catch in async functions",
      "frequency": 23,
      "lastUsed": "2025-01-19T16:45:00.000Z",
      "filesModified": ["src/api/endpoints.ts", "src/db/queries.ts"]
    }
  ],
  "metadata": {
    "totalPatterns": 156,
    "dateRange": "2024-12-01 to 2025-01-20",
    "mostCommonType": "command"
  }
}
```

**Pattern Types**:
- `"code"`: Code modification patterns (e.g., "Add TypeScript types", "Implement retry logic")
- `"command"`: Shell commands and scripts (e.g., "npm test", "git commit")
- `"architecture"`: Design decisions (e.g., "Use singleton pattern", "Implement repository pattern")
- `"all"`: Returns all types

---

## MCP Resources (3 total)

Resources are auto-loaded at session start, providing immediate project awareness without explicit requests.

### 1. `context://project/[name]/current`

**Purpose**: Main project context loaded automatically at session start

**Contains**:
- Recent sessions (default: 3 most recent)
- Top patterns (default: 5 most frequent)
- Key architectural decisions
- Session metadata (duration, tools used, files modified)

**Configuration** (via `c0ntextkeeper context configure`):
```bash
# Enable/disable auto-loading
c0ntextkeeper context configure --enable
c0ntextkeeper context configure --disable

# Set loading strategy
c0ntextkeeper context configure --strategy smart  # Recent + relevant
c0ntextkeeper context configure --strategy recent # Recent only
c0ntextkeeper context configure --strategy relevant # Relevance only

# Customize content
c0ntextkeeper context configure --session-count 5  # Include 5 recent sessions
c0ntextkeeper context configure --pattern-count 10 # Include 10 top patterns
c0ntextkeeper context configure --max-size 20      # Limit to 20KB
```

**Content Example**:
```json
{
  "projectName": "my-app",
  "recentSessions": [
    {
      "sessionId": "2025-01-20-14-30-45-session",
      "timestamp": "2025-01-20T14:30:45.000Z",
      "problems": ["Authentication token expiration handling"],
      "implementations": ["JWT refresh token rotation"],
      "decisions": ["Use HTTP-only cookies for security"]
    }
  ],
  "topPatterns": [
    {
      "pattern": "npm test && npm run lint",
      "frequency": 47
    }
  ],
  "keyDecisions": [
    {
      "decision": "Migrate from REST to GraphQL",
      "timestamp": "2025-01-15T10:00:00.000Z",
      "reasoning": "Better data fetching efficiency"
    }
  ]
}
```

**Loading Strategy Comparison**:

| Strategy | Behavior | Best For |
|----------|----------|----------|
| `smart` (default) | Recent sessions + relevant patterns + key decisions | Most projects |
| `recent` | Only most recent sessions | Projects with high session frequency |
| `relevant` | Only high-relevance content | Large projects with lots of history |
| `custom` | User-defined filters via config.json | Advanced customization |

---

### 2. `context://project/[name]/patterns`

**Purpose**: Recurring patterns from this project

**Contains**:
- Tool usage patterns (most-used tools and commands)
- Command patterns (frequently executed shell commands)
- Code modification patterns (common edits and refactorings)
- Error handling patterns (frequently encountered and solved errors)

**Content Example**:
```json
{
  "toolPatterns": [
    {
      "tool": "Write",
      "frequency": 234,
      "commonFiles": ["src/**/*.ts", "tests/**/*.test.ts"]
    },
    {
      "tool": "Edit",
      "frequency": 189,
      "commonPatterns": ["Add type annotations", "Import statements"]
    }
  ],
  "commandPatterns": [
    {
      "command": "npm test",
      "frequency": 156,
      "successRate": "94%"
    }
  ],
  "errorPatterns": [
    {
      "error": "Type 'undefined' is not assignable to type 'string'",
      "frequency": 23,
      "commonSolution": "Add null check or optional chaining"
    }
  ]
}
```

**Use Cases**:
- Claude learns your common workflows automatically
- Suggests fixes based on past error resolutions
- Recommends tools based on task similarity
- Optimizes suggestions for your coding style

---

### 3. `context://project/[name]/knowledge`

**Purpose**: Q&A knowledge base from Stop hook

**Contains**:
- Q&A pairs (default: 20 most recent)
- Solutions to common problems
- Error resolutions
- Implementation examples

**Requirements**: Stop hook must be enabled
```bash
c0ntextkeeper hooks enable stop
```

**Content Example**:
```json
{
  "qaHistory": [
    {
      "question": "How do I implement rate limiting for API endpoints?",
      "answer": "Use express-rate-limit middleware with Redis for distributed rate limiting...",
      "timestamp": "2025-01-18T15:20:00.000Z",
      "relevanceScore": 0.92,
      "topics": ["api", "performance", "security"],
      "hasSolution": true
    }
  ],
  "topTopics": ["authentication", "database", "testing"],
  "metadata": {
    "totalQA": 156,
    "averageRelevance": 0.78,
    "solutionRate": "87%"
  }
}
```

**Configuration** (in config.json):
```json
{
  "autoLoad": {
    "knowledgeCount": 20,  // Number of Q&A pairs to load
    "minRelevance": 0.5    // Only load Q&A with relevance >= 0.5
  }
}
```

**Use Cases**:
- Claude references past Q&A when you ask similar questions
- Builds on previous explanations for continuity
- Avoids repeating the same explanations
- Provides consistent answers across sessions

---

## Auto-Load System

### How It Works

1. **Session Start**: Claude Code starts a new conversation
2. **MCP Discovery**: Claude requests available resources
3. **Resource Loading**: c0ntextKeeper provides 3 resources
4. **Context Integration**: Claude reads and integrates context BEFORE your first message
5. **Immediate Awareness**: Claude knows your project history from the start

### Performance

- **Load Time**: <50ms for typical projects
- **Size Limits**: Default 10KB (configurable)
- **Caching**: Resources cached for session duration
- **Non-Blocking**: Never delays conversation start

### Size Management

Auto-load respects size limits to avoid overwhelming Claude's context:

```bash
# View current auto-load size
c0ntextkeeper context preview

# Adjust max size (in KB)
c0ntextkeeper context configure --max-size 15

# Preview what would be loaded
c0ntextkeeper context preview
```

**Size Recommendations**:
- Small projects (<10 sessions): 5-10KB
- Medium projects (10-50 sessions): 10-15KB
- Large projects (>50 sessions): 15-20KB
- Very large projects: 20KB+ (may need custom strategy)

---

## Integration with Search System

### Inverted Index

c0ntextKeeper uses an inverted index for O(1) keyword lookups:

```json
{
  "authentication": [
    { "sessionId": "2025-01-15-...", "positions": [45, 123, 789] },
    { "sessionId": "2025-01-10-...", "positions": [234, 567] }
  ],
  "database": [
    { "sessionId": "2025-01-18-...", "positions": [12, 456] }
  ]
}
```

**Benefits**:
- Instant keyword lookups (no full-text scanning)
- Scales to thousands of sessions
- Supports multi-word queries
- Ranks by term frequency

### Natural Language Processing

**Tokenization**:
```
Query: "How do I fix database connection errors?"
Tokens: ["fix", "database", "connection", "errors"]
Stop Words Removed: ["how", "do", "i"]
```

**Word Expansion**:
```
"fix" → ["fix", "fixed", "fixes", "fixing"]
"error" → ["error", "errors", "errored"]
```

**Stop Word List** (57 words filtered):
```
the, a, an, and, or, but, in, on, at, to, for, of, with, by, from,
as, is, was, are, were, be, been, being, have, has, had, do, does,
did, will, would, should, could, can, may, might, must, this, that,
these, those, i, you, he, she, it, we, they, them, what, which, who,
whom, how, when, where, why
```

### Temporal Decay

Recent content ranks higher than old content:

- **Half-Life**: 60 days
- **Formula**: `score × (0.5 ^ (daysSince / 60))`
- **Example**:
  - Today: 100% relevance
  - 60 days ago: 50% relevance
  - 120 days ago: 25% relevance

---

## Best Practices

### Tool Selection

| Use Case | Recommended Tool |
|----------|------------------|
| Starting new feature in existing project | `fetch_context` with broad query |
| Finding specific past error | `search_archive` with error message |
| Understanding workflow patterns | `get_patterns` with type="all" |
| File-specific search | `search_archive` with filePattern |
| Date-range analysis | `search_archive` with dateRange |
| Learning common solutions | Auto-load (knowledge resource) |

### Query Optimization

**Good Queries** (specific, actionable):
- "authentication JWT implementation"
- "database connection pool error fix"
- "React component testing patterns"

**Poor Queries** (too vague):
- "help"
- "error"
- "code"

**Query Tips**:
- Include key technical terms
- Mention specific technologies (e.g., "PostgreSQL", "React")
- Use problem-solution language ("fix", "implement", "resolve")
- Avoid stop words manually (system filters them)

### Resource Configuration

**For New Projects**:
```bash
# Start with defaults
c0ntextkeeper context configure --enable
```

**For Active Projects**:
```bash
# Increase session count for more history
c0ntextkeeper context configure --session-count 5

# Enable knowledge base
c0ntextkeeper hooks enable stop
```

**For Large Projects**:
```bash
# Increase size limit
c0ntextkeeper context configure --max-size 20

# Use relevant strategy to avoid recency bias
c0ntextkeeper context configure --strategy relevant
```

---

## Troubleshooting

### Problem: No results from search

**Causes**:
- Archive is empty (run `/compact` to create first archive)
- Query too specific or contains typos
- Search index not built

**Solutions**:
```bash
# Check archive status
c0ntextkeeper stats

# Rebuild search index
c0ntextkeeper rebuild-index

# Test with broad query
c0ntextkeeper search "code"
```

### Problem: Auto-load not working

**Causes**:
- Auto-load disabled in config
- No archives exist yet
- Project path mismatch

**Solutions**:
```bash
# Verify auto-load enabled
c0ntextkeeper context preview

# Enable if disabled
c0ntextkeeper context configure --enable

# Check MCP server connection
c0ntextkeeper test-mcp
```

### Problem: Resource size too large

**Causes**:
- Too many sessions included
- Very long Q&A answers
- Complex pattern data

**Solutions**:
```bash
# Reduce session count
c0ntextkeeper context configure --session-count 2

# Reduce pattern count
c0ntextkeeper context configure --pattern-count 3

# Set stricter size limit
c0ntextkeeper context configure --max-size 8
```

### Problem: Search results not relevant

**Causes**:
- Query too broad
- Relevance threshold too low
- Old content ranked higher than desired

**Solutions**:
```bash
# Use more specific query
c0ntextkeeper search "specific technical term"

# Increase minRelevance threshold
# In Claude Code: use fetch_context with minRelevance=0.6

# Sort by date instead of relevance
# In Claude Code: use search_archive with sortBy="date"
```

---

## Advanced Usage

### Combining Tools

**Example: Comprehensive Project Analysis**
```
1. fetch_context with query="architecture decisions"
   → Understand past architectural choices

2. get_patterns with type="code"
   → Learn common code patterns

3. search_archive with filePattern="src/api/**"
   → Focus on API implementation details
```

### Custom Workflows

**Daily Standup Context**:
```bash
# Get yesterday's work
c0ntextkeeper search "$(date -v-1d +%Y-%m-%d)"

# Check most used patterns
c0ntextkeeper patterns

# Review current project status
c0ntextkeeper stats
```

**Bug Investigation**:
```
1. search_archive with query="[error message]" sortBy="date"
   → Find recent occurrences

2. get_patterns with type="code" minFrequency=3
   → See if this is a recurring issue

3. fetch_context with query="[error message] fix"
   → Find past solutions
```

---

## Performance Characteristics

| Operation | Target | Actual | Notes |
|-----------|--------|--------|-------|
| fetch_context | <50ms | ~30ms | Includes relevance scoring |
| search_archive | <10ms | <5ms | O(1) index lookups |
| get_patterns | <100ms | ~50ms | Frequency analysis |
| Auto-load (session start) | <100ms | ~50ms | Cached for session |
| Index rebuild | <500ms | ~200ms | Full project re-index |

**Scalability**:
- 1,000 sessions: All operations <50ms
- 10,000 sessions: search_archive <20ms (index scales well)
- 100,000 sessions: Consider archive cleanup for optimal performance

---

## See Also

- **[FEATURES.md](../FEATURES.md)** - Complete feature catalog
- **[Configuration Guide](./configuration.md)** - Detailed config options
- **[Hooks Reference](./hooks-reference.md)** - What data hooks capture
- **[Quick Start](../guides/quickstart.md)** - Get started in 60 seconds
- **[Use Cases](../guides/use-cases.md)** - Real-world examples
