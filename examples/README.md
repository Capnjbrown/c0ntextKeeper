# c0ntextKeeper Examples

This directory contains real-world examples demonstrating the power of c0ntextKeeper for preserving valuable context from Claude Code sessions.

## Directory Structure

```
examples/
├── sample-archives/     # Example extracted archives showing real value
├── transcripts/        # Before/after transcript comparisons
├── mcp-usage/         # Code examples using MCP tools
└── troubleshooting/   # Common issues and solutions
```

## Quick Start Examples

### 1. Sample Archives (`sample-archives/`)

Real extracted archives from actual development sessions:
- **react-debugging.json** - Debugging a React component rendering issue
- **api-implementation.json** - Building a REST API endpoint
- **typescript-migration.json** - Converting JavaScript to TypeScript
- **database-optimization.json** - Optimizing slow SQL queries

Each archive shows:
- Problems identified and solved
- Code implementations created
- Architectural decisions made
- Patterns discovered

### 2. Transcript Examples (`transcripts/`)

Before and after comparisons showing extraction in action:
- **debug-session-before.jsonl** - Raw Claude Code transcript
- **debug-session-extracted.json** - Extracted valuable context
- **feature-development.jsonl** - Full feature implementation session
- **feature-extracted.json** - Key decisions and implementations

### 3. MCP Tool Usage (`mcp-usage/`)

Example code for using c0ntextKeeper's MCP tools:
- **fetch-context.js** - Retrieving relevant context
- **search-archive.js** - Searching historical knowledge
- **get-patterns.js** - Finding recurring solutions
- **integration-example.js** - Complete integration example

### 4. Troubleshooting (`troubleshooting/`)

Common issues and their solutions:
- **no-extraction.md** - When nothing gets extracted
- **timeout-errors.md** - Handling large transcripts
- **hook-not-firing.md** - Hook configuration issues
- **permissions.md** - File system permission problems

## Value Demonstration

### What Gets Preserved

c0ntextKeeper intelligently extracts:

1. **Problem-Solution Pairs**
   - User question: "Why is my component re-rendering?"
   - Solution: useCallback and memo implementation
   - Code changes that fixed the issue

2. **Implementation Details**
   - File modifications with before/after
   - Tool usage patterns
   - Command sequences that worked

3. **Architectural Decisions**
   - "Should we use Context or Redux?"
   - Reasoning and final choice
   - Implementation approach

4. **Error Resolutions**
   - Error messages encountered
   - Debugging steps taken
   - Final fix applied

### Real Session Example

From a recent debugging session (see `sample-archives/react-debugging.json`):

```json
{
  "problems": [
    {
      "question": "Why is my useEffect running twice?",
      "solution": "React StrictMode causes double execution in development",
      "implementation": {
        "tool": "Edit",
        "file": "src/App.tsx",
        "changes": "Added cleanup function and dependency array"
      }
    }
  ],
  "relevanceScore": 0.85
}
```

## How to Use These Examples

### For Learning
1. Browse sample archives to see what c0ntextKeeper extracts
2. Compare before/after transcripts to understand the extraction process
3. Review troubleshooting guides for common issues

### For Integration
1. Copy MCP usage examples as starting points
2. Adapt the code to your specific needs
3. Use sample archives to test your integration

### For Testing
1. Use provided transcripts to test extraction locally
2. Verify your setup produces similar results
3. Create your own test cases based on these examples

## Try It Yourself

1. **Manual Test**:
   ```bash
   c0ntextkeeper extract examples/transcripts/debug-session-before.jsonl
   ```

2. **View Extracted Context**:
   ```bash
   c0ntextkeeper view --recent
   ```

3. **Search Archives**:
   ```bash
   c0ntextkeeper search "useEffect"
   ```

## Contributing Examples

Have a great example of c0ntextKeeper in action? Please contribute:
1. Sanitize any sensitive information
2. Include both transcript and extracted context
3. Add a brief description of the value provided
4. Submit a PR to the examples directory

## Questions?

- See the [User Guide](../docs/guides/user-guide.md) for detailed usage
- Check [Troubleshooting](troubleshooting/) for common issues
- Open an [issue](https://github.com/yourusername/c0ntextKeeper/issues) for help