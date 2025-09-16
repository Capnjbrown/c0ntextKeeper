# Auto-Load Context Guide

> Last Updated: 2025-09-15 for v0.7.2

## Overview

c0ntextKeeper v0.7.2+ introduces **automatic context loading** - a powerful feature that proactively provides relevant project context when Claude Code sessions begin. This ensures Claude has immediate awareness of your project's recent work, patterns, and knowledge without requiring manual tool calls.

## How It Works

When the c0ntextKeeper MCP server starts, it:
1. Checks if auto-loading is enabled
2. Loads relevant context based on your configured strategy
3. Exposes this context as MCP resources
4. Claude automatically reads these resources on startup

**v0.7.2 Enhancement**: The context retrieval is now more reliable with:
- Relevance scores properly capped at 100%
- No more "unknown" sessionIds
- Better natural language query understanding
- Cleaner output formatting with content snippets

## Configuration

### Quick Start

Auto-loading is **enabled by default** with sensible settings that work out-of-the-box:

```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "maxSizeKB": 10,
    "sessionCount": 3,
    "patternCount": 5,
    "knowledgeCount": 10,
    "promptCount": 5,
    "includeTypes": ["sessions", "patterns", "knowledge", "prompts"],
    "timeWindowDays": 7,
    "priorityKeywords": [],
    "formatStyle": "summary"
  }
}
```

### Configuration Options

| Option | Description | Default | Values |
|--------|-------------|---------|--------|
| `enabled` | Enable/disable auto-loading | `true` | `true`, `false` |
| `strategy` | Context selection strategy | `"smart"` | `"smart"`, `"recent"`, `"relevant"`, `"custom"` |
| `maxSizeKB` | Maximum context size in KB | `10` | Any number |
| `sessionCount` | Number of recent sessions | `3` | Any number |
| `patternCount` | Number of patterns to include | `5` | Any number |
| `knowledgeCount` | Q&A pairs to include | `10` | Any number |
| `promptCount` | Recent prompts to include | `5` | Any number |
| `includeTypes` | Types of context to include | All types | Array of: `"sessions"`, `"patterns"`, `"knowledge"`, `"prompts"` |
| `timeWindowDays` | Look-back period in days | `7` | Any number |
| `priorityKeywords` | Keywords for relevant strategy | `[]` | Array of strings |
| `formatStyle` | Output format style | `"summary"` | `"summary"`, `"detailed"`, `"minimal"` |

## Loading Strategies

### Smart Strategy (Default)
Intelligently combines recent work with patterns and knowledge:
- Last 3 sessions' key problems and solutions
- Top 5 recurring code patterns
- 10 most recent Q&A pairs
- 5 recent user prompts
- Formatted as concise markdown

### Recent Strategy
Focuses exclusively on recent sessions:
- Loads only session history
- Good for ongoing work continuation
- Minimal context overhead

### Relevant Strategy
Keyword-based context selection:
- Uses `priorityKeywords` for matching
- Scores context by relevance
- Falls back to smart strategy if no matches

### Custom Strategy
User-defined loading logic:
- Extend for project-specific needs
- Combine with custom patterns

## CLI Commands

### Preview Context
See what will be auto-loaded:
```bash
c0ntextkeeper context preview
```

### Test Loading
Test the loading mechanism:
```bash
c0ntextkeeper context test
```

### Configure Settings
Modify auto-load settings:
```bash
# View current settings
c0ntextkeeper context configure

# Enable/disable
c0ntextkeeper context configure --enable
c0ntextkeeper context configure --disable

# Change strategy
c0ntextkeeper context configure --strategy recent

# Adjust size limit
c0ntextkeeper context configure --max-size 20

# Change format style
c0ntextkeeper context configure --format detailed
```

## Configuration Examples

### Minimal Context (Performance)
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "recent",
    "maxSizeKB": 5,
    "sessionCount": 1,
    "includeTypes": ["sessions"],
    "formatStyle": "minimal"
  }
}
```

### Maximum Context (Complex Projects)
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "maxSizeKB": 50,
    "sessionCount": 10,
    "patternCount": 20,
    "knowledgeCount": 50,
    "timeWindowDays": 30,
    "formatStyle": "detailed"
  }
}
```

### Focused Context (Specific Work)
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "relevant",
    "maxSizeKB": 15,
    "priorityKeywords": ["authentication", "JWT", "security"],
    "formatStyle": "detailed"
  }
}
```

### Patterns Only
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "includeTypes": ["patterns"],
    "patternCount": 20,
    "formatStyle": "summary"
  }
}
```

## Format Styles

### Summary Format (Default)
- Concise, focused on key points
- Truncates long content
- Ideal for quick context awareness

### Detailed Format
- Complete information
- Includes metadata and statistics
- Better for complex debugging

### Minimal Format
- Ultra-compact representation
- Maximum information density
- For performance-critical scenarios

## MCP Resources

When auto-loading is enabled, c0ntextKeeper exposes these MCP resources:

| Resource URI | Description |
|-------------|-------------|
| `context://project/{name}/current` | Main auto-loaded context |
| `context://project/{name}/patterns` | Recurring patterns (if enabled) |
| `context://project/{name}/knowledge` | Knowledge base (if enabled) |

## Troubleshooting

### Context Not Loading

1. Check if auto-loading is enabled:
```bash
c0ntextkeeper context configure
```

2. Verify archives exist:
```bash
c0ntextkeeper stats
```

3. Test loading manually:
```bash
c0ntextkeeper context test
```

### Context Too Large

Reduce the size limit or item counts:
```bash
c0ntextkeeper context configure --max-size 5 --session-count 1
```

### Wrong Context Loading

Adjust the strategy or priority keywords:
```bash
c0ntextkeeper context configure --strategy relevant
```

## Best Practices

1. **Start with defaults** - The smart strategy with 10KB limit works well for most projects

2. **Adjust gradually** - If you need more context, increase limits incrementally

3. **Use relevant strategy** - For focused work on specific features

4. **Monitor size** - Keep context under 20KB for optimal performance

5. **Refresh periodically** - Context updates as you work, restart Claude Code to refresh

## Disabling Auto-Load

If you prefer manual context control:

```bash
c0ntextkeeper context configure --disable
```

Or in config.json:
```json
{
  "autoLoad": {
    "enabled": false
  }
}
```

## Advanced Usage

### Custom Context Preparation

Extend the `ContextLoader` class for custom logic:

```typescript
class CustomContextLoader extends ContextLoader {
  async loadCustomContext() {
    // Your custom context preparation
  }
}
```

### Programmatic Access

```typescript
import { contextLoader } from "c0ntextkeeper/core/context-loader";

const context = await contextLoader.getAutoLoadContext();
console.log(`Loaded ${context.sizeKB}KB of context`);
```

## Performance Considerations

- **Size vs. Relevance**: Smaller, focused context often works better than large dumps
- **Format Style**: Summary format reduces token usage
- **Strategy Choice**: Recent strategy is fastest, relevant strategy requires more processing
- **Include Types**: Loading fewer types improves startup time

## Integration with Claude Code

The auto-loaded context seamlessly integrates with Claude Code:

1. Context loads when MCP server starts
2. Claude reads resources automatically
3. You can reference the context in your prompts
4. Context updates reflect in new sessions

## Examples of Auto-Loaded Context

### Smart Strategy Output
```markdown
# Project Context: c0ntextKeeper
*Auto-loaded by c0ntextKeeper on 1/10/2025, 10:00:00 AM*

## Recent Work

### Session: 2025-01-10 09:30
**Key Problems:**
- How do I implement authentication?
  → Use JWT tokens with refresh mechanism
- Why is the build failing?
  → Fixed TypeScript configuration issues

**Key Actions:**
- Write: Implemented JWT authentication in auth.ts
- Edit: Updated config for TypeScript strict mode

## Recurring Patterns

- **code** (15x): `async/await` - Async function pattern
- **command** (8x): `npm test` - Running test suite
- **architecture** (5x): `MCP server pattern` - Server implementation

## Knowledge Base

- Q: What is the project architecture?
  A: Modular TypeScript with MCP server

- Q: How do we handle errors?
  A: Try-catch with custom error classes

## Recent Questions

- Help me optimize the database queries
- How can I improve test coverage?
- What's the best way to handle authentication?
```

This context gives Claude immediate awareness of:
- What you've been working on
- Common patterns in your codebase
- Architectural decisions
- Recent challenges and solutions

---

With auto-loading enabled, c0ntextKeeper ensures Claude Code always starts with relevant project awareness, making your development sessions more productive from the first prompt.