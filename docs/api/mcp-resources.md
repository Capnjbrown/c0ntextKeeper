# MCP Resources API Documentation

## Overview

c0ntextKeeper v0.7.0+ exposes context as MCP (Model Context Protocol) resources, allowing Claude Code to automatically read project context on startup. This provides immediate awareness of recent work, patterns, and knowledge without requiring manual tool calls.

## Resource URIs

### Primary Resource

#### `context://project/{projectName}/current`

The main auto-loaded context resource containing aggregated project information.

**URI Structure:**
- Protocol: `context://`
- Namespace: `project`
- Project Name: Derived from current working directory
- Resource: `current`

**Example:** `context://project/c0ntextKeeper/current`

**Content Type:** `text/markdown`

**Content:** Formatted markdown containing:
- Recent sessions and work
- Recurring patterns
- Knowledge base entries
- Recent prompts

### Secondary Resources

#### `context://project/{projectName}/patterns`

Recurring patterns and solutions identified across sessions.

**Availability:** Only when `includeTypes` contains `'patterns'`

**Content:** 
- Code patterns
- Command patterns
- Architecture patterns
- Common solutions

#### `context://project/{projectName}/knowledge`

Q&A pairs and learned information from Stop hook.

**Availability:** Only when `includeTypes` contains `'knowledge'`

**Content:**
- Question-answer pairs
- Learned facts
- Problem resolutions
- Best practices

## MCP Protocol Implementation

### ListResourcesRequest Handler

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const configManager = new ConfigManager();
  const autoLoadSettings = configManager.getAutoLoadSettings();
  
  // Only expose resources if auto-load is enabled
  if (!autoLoadSettings.enabled) {
    return { resources: [] };
  }

  const projectName = getProjectName(process.cwd());
  const resources: Resource[] = [
    {
      uri: `context://project/${projectName}/current`,
      name: `${projectName} Project Context`,
      description: `Auto-loaded context for ${projectName} using ${autoLoadSettings.strategy} strategy`,
      mimeType: "text/markdown",
    },
  ];

  // Add additional resources based on configuration
  if (autoLoadSettings.includeTypes.includes('patterns')) {
    resources.push({
      uri: `context://project/${projectName}/patterns`,
      name: "Recurring Patterns",
      description: "Common patterns and solutions from this project",
      mimeType: "text/markdown",
    });
  }

  return { resources };
});
```

### ReadResourceRequest Handler

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const projectName = getProjectName(process.cwd());
  
  if (uri === `context://project/${projectName}/current`) {
    const context = await contextLoader.getAutoLoadContext();
    return {
      contents: [{
        uri,
        mimeType: "text/markdown",
        text: context.content,
      }],
    };
  }
  
  // Handle other resources...
});
```

## Resource Types

### Resource Interface

```typescript
interface Resource {
  uri: string;          // Unique resource identifier
  name: string;         // Human-readable name
  description: string;  // Resource description
  mimeType: string;     // Content MIME type
}
```

### ResourceContent Interface

```typescript
interface ResourceContent {
  uri: string;          // Resource URI
  mimeType: string;     // Content MIME type  
  text?: string;        // Text content (for text/*)
  blob?: string;        // Base64 encoded binary
}
```

## Configuration

Resources are controlled by AutoLoadSettings:

```typescript
interface AutoLoadSettings {
  enabled: boolean;              // Must be true to expose resources
  strategy: string;              // Affects resource description
  includeTypes: string[];        // Determines which resources are available
  // ... other settings
}
```

### Enabling Resources

```bash
# Enable auto-load (required for resources)
c0ntextkeeper context configure --enable

# Include specific resource types
c0ntextkeeper context configure --include-types sessions,patterns,knowledge
```

## How Claude Code Uses Resources

### Automatic Reading

When Claude Code connects to the MCP server:

1. **Discovery:** Claude calls ListResources to discover available resources
2. **Selection:** Claude identifies relevant resources based on URI patterns
3. **Reading:** Claude calls ReadResource for each selected resource
4. **Integration:** Content is added to Claude's context automatically

### Manual Access

Users can also manually request resources:

```
Claude, read the context://project/myproject/current resource
```

## Content Generation

### Dynamic Content

Resources generate content dynamically on each read:

1. **Fresh Data:** Always returns latest context
2. **Size Management:** Respects maxSizeKB limits
3. **Relevance Scoring:** Prioritizes important content
4. **Format Consistency:** Uses configured formatStyle

### Content Structure

```markdown
# Project Context: {projectName}

Generated: {timestamp}
Strategy: {strategy}
Size: {sizeKB}KB

## Recent Work
{recent sessions}

## Recurring Patterns
{identified patterns}

## Knowledge Base
{q&a pairs}

## Recent Prompts
{user prompts}
```

## Examples

### Basic Resource Exposure

```typescript
// Minimal configuration - exposes single resource
{
  enabled: true,
  strategy: 'smart',
  includeTypes: ['sessions']
}
// Exposes: context://project/{name}/current
```

### Multiple Resources

```typescript
// Rich configuration - exposes multiple resources
{
  enabled: true,
  strategy: 'smart',
  includeTypes: ['sessions', 'patterns', 'knowledge']
}
// Exposes:
// - context://project/{name}/current
// - context://project/{name}/patterns
// - context://project/{name}/knowledge
```

### Custom Resource Content

```typescript
// Extend server to add custom resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  // Custom resource
  if (uri === 'context://custom/metrics') {
    const metrics = await calculateProjectMetrics();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(metrics, null, 2)
      }]
    };
  }
});
```

## Integration Patterns

### Startup Context

Ideal for providing immediate project awareness:

```typescript
// Configure for startup context
{
  enabled: true,
  strategy: 'smart',
  maxSizeKB: 50,        // Keep reasonable for fast loading
  formatStyle: 'summary' // Concise for quick reading
}
```

### Debug Context

Focused on recent errors and fixes:

```typescript
// Configure for debugging
{
  enabled: true,
  strategy: 'relevant',
  priorityKeywords: ['error', 'bug', 'fix'],
  formatStyle: 'detailed'
}
```

### Learning Context

Emphasizes patterns and knowledge:

```typescript
// Configure for learning
{
  enabled: true,
  strategy: 'custom',
  sessionCount: 2,
  patternCount: 20,
  knowledgeCount: 50,
  includeTypes: ['patterns', 'knowledge']
}
```

## Performance Considerations

### Resource Discovery

- **Cached:** Resource list is generated once per session
- **Lightweight:** Only metadata returned, not content
- **Conditional:** No resources if auto-load disabled

### Content Generation

- **On-Demand:** Content generated only when requested
- **Streaming:** Large content streamed efficiently
- **Truncation:** Automatic size management
- **Async:** Non-blocking I/O operations

### Best Practices

1. **Limit Size:** Keep maxSizeKB reasonable (20-100KB)
2. **Summary Format:** Use for faster loading
3. **Selective Types:** Only include needed context types
4. **Time Windows:** Limit to recent context (7-14 days)

## Troubleshooting

### Resources Not Appearing

```bash
# Check if auto-load is enabled
c0ntextkeeper context preview

# Verify MCP server is running
claude mcp list

# Check server logs
tail -f ~/.c0ntextkeeper/logs/mcp-server.log
```

### Empty Resources

```bash
# Verify storage has content
c0ntextkeeper stats

# Check configuration
c0ntextkeeper context configure

# Test loading manually
c0ntextkeeper context test
```

### Performance Issues

```bash
# Reduce size limit
c0ntextkeeper context configure --max-size 20

# Use summary format
c0ntextkeeper context configure --format summary

# Limit time window
c0ntextkeeper context configure --time-window 3
```

## Security

### Access Control

- **Local Only:** Resources only accessible to local Claude instance
- **Project Scoped:** Each project has isolated resources
- **No Network:** No external network calls
- **Filtered:** Sensitive data automatically redacted

### Data Privacy

- **No Telemetry:** No usage data collected
- **Local Storage:** All data stays on local machine
- **User Control:** Complete control over what's included
- **Opt-in:** Must explicitly enable auto-load

## CLI Commands

```bash
# Check resource availability
c0ntextkeeper context preview

# Test resource content
c0ntextkeeper context test

# Configure resources
c0ntextkeeper context configure --enable
c0ntextkeeper context configure --include-types sessions,patterns
c0ntextkeeper context configure --strategy smart
```

## API Reference

### Server Methods

```typescript
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, handler)

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, handler)
```

### Helper Functions

```typescript
// Get project name for URI
function getProjectName(workingDir: string): string

// Format context for resources
function formatContextResults(contexts: any[]): string

// Format patterns for resources
function formatPatternResults(patterns: any[]): string
```

## Migration from v0.6.0

v0.6.0 users need to:

1. Update to v0.7.0: `npm update c0ntextkeeper`
2. Enable auto-load: `c0ntextkeeper context configure --enable`
3. Restart MCP server for Claude Code

## Future Enhancements

Planned improvements for resources:

- **Streaming Updates:** Real-time context updates
- **Custom Resources:** User-defined resource types
- **Resource Templates:** Customizable content formats
- **Caching Layer:** Improved performance for large contexts
- **Resource Versioning:** Historical context snapshots

## Related Documentation

- [ContextLoader API](./context-loader.md) - Context loading implementation
- [Auto-Load Guide](../guides/auto-load-guide.md) - User guide for auto-load feature
- [MCP Usage](../technical/mcp-usage.md) - General MCP server documentation

---

*Last Updated: 2025-09-10 | c0ntextKeeper v0.7.0*