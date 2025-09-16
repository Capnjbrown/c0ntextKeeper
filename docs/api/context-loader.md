# ContextLoader API Documentation

## Overview

The `ContextLoader` class is responsible for intelligently loading and preparing relevant context for MCP server startup in c0ntextKeeper v0.7.2+. It aggregates context from multiple sources (sessions, patterns, knowledge, prompts) and formats it for automatic delivery to Claude Code.

## Class: ContextLoader

```typescript
import { ContextLoader } from "c0ntextkeeper/core/context-loader";
```

### Constructor

```typescript
constructor()
```

Creates a new instance of the ContextLoader. The loader automatically reads configuration from the global ConfigManager.

### Methods

#### getAutoLoadContext()

Loads context based on the configured strategy and settings.

```typescript
async getAutoLoadContext(): Promise<LoadedContext>
```

**Returns:** `Promise<LoadedContext>`

```typescript
interface LoadedContext {
  content: string;      // Formatted markdown content
  sizeKB: number;      // Size in kilobytes
  itemCount: number;   // Number of items included
  strategy: string;    // Loading strategy used
  timestamp: string;   // ISO timestamp of when context was loaded
}
```

**Example:**
```typescript
const loader = new ContextLoader();
const context = await loader.getAutoLoadContext();
console.log(`Loaded ${context.itemCount} items (${context.sizeKB}KB)`);
```

#### previewAutoLoad()

Generates a preview of what will be auto-loaded without actually loading the full context.

```typescript
async previewAutoLoad(): Promise<string>
```

**Returns:** Formatted preview string showing configuration and sample content

**Example:**
```typescript
const loader = new ContextLoader();
const preview = await loader.previewAutoLoad();
console.log(preview);
// Output:
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        AUTO-LOAD CONTEXT PREVIEW                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝
// Strategy: smart
// Size: 2.5KB / 50KB
// Items: 15
// ...
```

#### testLoading(strategy)

Tests a specific loading strategy and returns formatted results.

```typescript
async testLoading(strategy: 'smart' | 'recent' | 'relevant' | 'custom'): Promise<string>
```

**Parameters:**
- `strategy`: The loading strategy to test

**Returns:** Formatted test results including timing and content preview

**Example:**
```typescript
const loader = new ContextLoader();
const results = await loader.testLoading('smart');
console.log(results);
```

## Configuration: AutoLoadSettings

The ContextLoader behavior is controlled by AutoLoadSettings in the configuration:

```typescript
interface AutoLoadSettings {
  enabled: boolean;              // Whether auto-loading is enabled
  strategy: LoadingStrategy;     // Loading strategy to use
  maxSizeKB: number;             // Maximum size in KB (default: 50)
  sessionCount: number;          // Number of sessions to load
  patternCount: number;          // Number of patterns to load
  knowledgeCount: number;        // Number of knowledge items to load
  promptCount: number;           // Number of prompts to load
  includeTypes: ContextType[];  // Types to include
  timeWindowDays: number;        // Time window in days
  priorityKeywords: string[];   // Keywords for relevance
  formatStyle: FormatStyle;     // Output format style
}

type LoadingStrategy = 'smart' | 'recent' | 'relevant' | 'custom';
type ContextType = 'sessions' | 'patterns' | 'knowledge' | 'prompts';
type FormatStyle = 'summary' | 'detailed' | 'minimal';
```

## Loading Strategies

### Smart Strategy

Combines all context types intelligently, prioritizing based on relevance and recency.

```typescript
{
  strategy: 'smart',
  includeTypes: ['sessions', 'patterns', 'knowledge', 'prompts']
}
```

**Behavior:**
1. Loads recent sessions (last 7 days by default)
2. Includes recurring patterns (frequency > 2)
3. Adds knowledge base Q&A pairs
4. Includes recent user prompts
5. Balances content to stay within size limit

### Recent Strategy

Focuses on the most recent context regardless of type.

```typescript
{
  strategy: 'recent',
  timeWindowDays: 3,
  includeTypes: ['sessions']
}
```

**Behavior:**
1. Loads only sessions from the time window
2. Sorts by timestamp (newest first)
3. Truncates to session count limit

### Relevant Strategy

Loads context matching priority keywords.

```typescript
{
  strategy: 'relevant',
  priorityKeywords: ['authentication', 'security', 'JWT'],
  includeTypes: ['sessions', 'knowledge']
}
```

**Behavior:**
1. Searches all context for keyword matches
2. Scores based on keyword frequency
3. Returns highest scoring items

### Custom Strategy

Uses exactly the configuration specified.

```typescript
{
  strategy: 'custom',
  sessionCount: 2,
  patternCount: 5,
  knowledgeCount: 10,
  promptCount: 0,
  includeTypes: ['patterns', 'knowledge']
}
```

**Behavior:**
1. Loads only specified types
2. Respects exact count limits
3. No automatic adjustments

## Format Styles

### Summary Format

Concise representation focusing on key information.

```markdown
## Recent Work
- Session: auth-implementation (2025-01-10)
  - Problem: How to implement JWT authentication?
    Solution: Use refresh tokens with secure storage
```

### Detailed Format

Comprehensive information including metadata.

```markdown
## Recent Work

### Session: auth-implementation
**Timestamp:** 2025-01-10T10:00:00Z
**Relevance:** 95%

#### Problems & Solutions
1. **Problem:** How to implement JWT authentication?
   - **Tags:** auth, security, JWT
   - **Solution:** Use refresh tokens with secure storage
   - **Files:** auth.ts, jwt.service.ts
   - **Success:** ✓
```

### Minimal Format

Ultra-compact representation.

```markdown
auth-implementation: JWT auth → refresh tokens
```

## Size Management

The ContextLoader automatically manages content size:

1. **Size Calculation:** Tracks byte size as content is added
2. **Smart Truncation:** Removes least relevant items first
3. **Section Balancing:** Ensures all included types get representation
4. **Truncation Indicator:** Adds "..." when content is cut

## Usage Examples

### Basic Usage

```typescript
import { ContextLoader } from "c0ntextkeeper/core/context-loader";
import { ConfigManager } from "c0ntextkeeper/core/config";

// Configure auto-load
const config = new ConfigManager();
config.updateAutoLoadSettings({
  enabled: true,
  strategy: 'smart',
  maxSizeKB: 50,
  formatStyle: 'summary'
});

// Load context
const loader = new ContextLoader();
const context = await loader.getAutoLoadContext();

// Use in MCP server
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'context://project/my-project/current') {
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: 'text/markdown',
        text: context.content
      }]
    };
  }
});
```

### Testing Different Strategies

```typescript
const loader = new ContextLoader();

// Test each strategy
for (const strategy of ['smart', 'recent', 'relevant', 'custom']) {
  const result = await loader.testLoading(strategy);
  console.log(`${strategy}: ${result}`);
}
```

### Custom Configuration

```typescript
const config = new ConfigManager();

// Configure for debugging focus
config.updateAutoLoadSettings({
  enabled: true,
  strategy: 'relevant',
  priorityKeywords: ['error', 'bug', 'fix', 'issue'],
  includeTypes: ['sessions', 'knowledge'],
  formatStyle: 'detailed',
  maxSizeKB: 100
});

const loader = new ContextLoader();
const debugContext = await loader.getAutoLoadContext();
```

## Error Handling

The ContextLoader handles errors gracefully:

- **Missing Storage:** Returns empty context with project header
- **Corrupted Files:** Skips invalid JSON files and continues
- **Size Limits:** Truncates content rather than failing
- **Disabled Auto-load:** Returns minimal context with status message

## Performance Considerations

- **Lazy Loading:** Only reads files when needed
- **Streaming:** Processes large files in chunks
- **Caching:** Reuses loaded data within same session
- **Async Operations:** All I/O operations are asynchronous

## Integration with MCP Server

The ContextLoader integrates seamlessly with the MCP server:

1. **Resource Exposure:** Context available at `context://project/{name}/current`
2. **Automatic Updates:** Refreshes on each resource read
3. **Configuration Sync:** Responds to config changes immediately
4. **Error Isolation:** Loader errors don't crash server

## Best Practices

1. **Start with Smart Strategy:** Works well for most use cases
2. **Adjust Size Limits:** Balance between context richness and performance
3. **Use Priority Keywords:** Improve relevance for specific tasks
4. **Monitor Truncation:** If frequently truncated, increase size limit
5. **Test Strategies:** Use CLI to test which strategy works best

## CLI Commands

```bash
# Preview what will be auto-loaded
c0ntextkeeper context preview

# Test different strategies
c0ntextkeeper context test

# Configure auto-load
c0ntextkeeper context configure --enable
c0ntextkeeper context configure --strategy smart
c0ntextkeeper context configure --max-size 100
```

## Troubleshooting

### Context Not Loading

1. Check if auto-load is enabled: `c0ntextkeeper context preview`
2. Verify storage exists: `c0ntextkeeper status`
3. Check configuration: `c0ntextkeeper context configure`

### Content Truncated

1. Increase maxSizeKB: `c0ntextkeeper context configure --max-size 100`
2. Reduce item counts in configuration
3. Use minimal format style

### Wrong Content Loaded

1. Adjust strategy to match needs
2. Set priority keywords for relevant strategy
3. Adjust time window for recent strategy

---

*Last Updated: 2025-09-10 | c0ntextKeeper v0.7.2*