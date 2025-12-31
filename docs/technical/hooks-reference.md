# Hook System Deep-Dive

> Understanding how c0ntextKeeper captures your development workflow

---

## Overview

c0ntextKeeper uses **7 Claude Code hooks** to capture different aspects of your development session:

| Hook | Default | Trigger | Value | Coverage |
|------|---------|---------|-------|----------|
| PreCompact | ✅ Enabled | Compaction | ⭐⭐⭐⭐⭐ | 80% |
| Stop | ⭕ Disabled | After response | ⭐⭐⭐ | Q&A pairs |
| PostToolUse | ⭕ Disabled | Every tool | ⭐⭐⭐⭐ | Tool patterns |
| UserPromptSubmit | ⭕ Disabled | Every prompt | ⭐⭐ | User behavior |
| Notification | ⭕ Disabled | On notification | ⭐⭐ | Alerts/warnings |
| SessionStart | ⭕ Disabled | Session begins | ⭐⭐ | Session lifecycle |
| SessionEnd | ⭕ Disabled | Session ends | ⭐⭐ | Session lifecycle |

**Recommendation**: Start with PreCompact alone. Add others as needed for specific use cases.

---

## PreCompact Hook

### What It Does

Captures a **complete snapshot** of your Claude Code session before compaction, extracting:
- Problems encountered & questions asked
- Solutions provided & implementations created
- Architectural decisions made
- Code patterns & tool usage
- File modifications & metadata

### When It Triggers

1. **Manual Compaction**: User runs `/compact` command
2. **Automatic Compaction**: Claude Code compacts automatically (conversation too long)

### What It Captures

#### 1. **Problems** (Questions & Challenges)

Example extraction:
```json
{
  "id": "a1b2c3d4",
  "question": "How do I implement user authentication with JWT tokens?",
  "timestamp": "2025-10-17T14:30:00Z",
  "tags": ["authentication", "jwt", "security"],
  "relevance": 0.95,
  "solution": {
    "approach": "Implemented JWT auth middleware with token verification...",
    "files": ["src/middleware/auth.ts", "src/utils/jwt.ts"],
    "successful": true
  }
}
```

**187 semantic patterns** recognize problems:
- Error keywords: error, bug, issue, crash, exception, failed, broken
- Questions: why, how, what, where, when
- Dev tasks: implement, create, build, refactor, optimize
- Debugging: debug, fix, solve, troubleshoot
- Architecture: design, architect, structure, pattern

#### 2. **Implementations** (Code Changes)

Example extraction:
```json
{
  "id": "e5f6g7h8",
  "tool": "Write",
  "file": "src/services/auth-service.ts",
  "description": "Created authentication service with login and token validation methods",
  "timestamp": "2025-10-17T14:32:00Z",
  "relevance": 0.88,
  "changes": [
    {
      "type": "addition",
      "lineStart": 1,
      "lineEnd": 50,
      "content": "export class AuthService { ... }"
    }
  ]
}
```

**Tracks ALL tools**:
- Write, Edit, MultiEdit - file modifications
- Bash - command executions
- TodoWrite - task management
- MCP tools - all server integrations
- Custom tools - any registered tool

#### 3. **Decisions** (Architectural Choices)

Example extraction:
```json
{
  "id": "i9j0k1l2",
  "decision": "We should use Redis for session storage instead of in-memory",
  "context": "...for better scalability and session persistence across server restarts...",
  "rationale": "because in-memory storage doesn't survive restarts",
  "timestamp": "2025-10-17T14:35:00Z",
  "impact": "high",
  "tags": ["redis", "session", "architecture"]
}
```

**7 decision patterns**:
- "we should..."
- "better to..."
- "I recommend..."
- "the approach is to..."
- "decided to..."
- "going with..."
- "choosing..."

#### 4. **Patterns** (Recurring Actions)

Example extraction:
```json
{
  "id": "m3n4o5p6",
  "type": "command",
  "value": "npm run dev",
  "frequency": 5,
  "firstSeen": "2025-10-17T14:00:00Z",
  "lastSeen": "2025-10-17T15:00:00Z",
  "examples": ["npm run dev", "npm run dev -- --port 3000"]
}
```

**Pattern types**:
- Command patterns (Bash commands)
- Code patterns (repeated modifications)
- Error patterns (common failures)

#### 5. **Metadata** (Session Statistics)

Example:
```json
{
  "entryCount": 156,
  "duration": 3600000,
  "toolsUsed": ["Write", "Edit", "Bash", "Read"],
  "toolCounts": {"Write": 12, "Edit": 8, "Bash": 5, "Read": 15},
  "filesModified": [
    "src/services/auth-service.ts",
    "src/middleware/auth.ts",
    "tests/auth.test.ts"
  ],
  "relevanceScore": 0.85,
  "extractionVersion": "0.7.8",
  "securityFiltered": true,
  "redactedCount": 2
}
```

### Storage Location

```
~/.c0ntextkeeper/archive/projects/[project-name]/sessions/
├── 2025-10-17-14-30-00-session.json
├── 2025-10-17-16-45-30-session.json
└── 2025-10-18-09-15-00-session.json
```

### Performance

- **Processing time**: <55 seconds (with 5s buffer before Claude's 60s timeout)
- **Average**: ~2-5 seconds for typical sessions
- **Non-blocking**: Compaction proceeds regardless of hook success

### Configuration

```json
{
  "hooks": {
    "preCompact": {
      "enabled": true,
      "captureOn": ["manual", "auto"]  // Which compaction types to capture
    }
  }
}
```

### CLI Commands

```bash
# Check status
c0ntextkeeper hooks list

# Test manually
c0ntextkeeper hooks test precompact

# Health check
c0ntextkeeper hooks health
```

---

## Stop Hook

### What It Does

Captures **every Q&A exchange** after Claude finishes responding, building a searchable knowledge base of:
- User questions
- Assistant answers
- Q&A metadata (topics, relevance, success indicators)
- Tools used in the response
- Files modified in the response

### When It Triggers

After **every** assistant response completes (not on errors or interruptions).

### What It Captures

Example Q&A pair:
```json
{
  "sessionId": "session-abc123",
  "timestamp": "2025-10-17T14:32:15Z",
  "question": "How do I add input validation to my API endpoints?",
  "answer": "You can use Zod for schema validation. Here's an implementation...",
  "toolsUsed": ["Write", "Edit"],
  "filesModified": ["src/api/validation.ts"],
  "topics": ["api", "validation", "typescript"],
  "relevanceScore": 0.75,
  "hasSolution": true,
  "hasError": false
}
```

### Filtering Logic

**Captures when**:
- Relevance score ≥ 0.2 (lowered from 0.3 for better coverage)
- OR has solution keywords
- OR has error keywords

**Skips when**:
- Relevance score < 0.2 AND no solution AND no error
- Response too short (< 50 chars)
- Test session detected

### Storage Location

```
~/.c0ntextkeeper/archive/projects/[project-name]/knowledge/
├── 2025-10-17-knowledge.json   # Array of Q&A pairs
├── 2025-10-18-knowledge.json
└── 2025-10-19-knowledge.json
```

### Solutions Index

High-value Q&A pairs (with solutions) are also indexed globally:

```
~/.c0ntextkeeper/solutions/index.json
```

Contains last 1000 solutions across all projects for quick retrieval.

### Performance

- **Processing time**: <5 seconds
- **Average**: <1 second for typical responses
- **Non-blocking**: Never prevents response delivery

### Configuration

```json
{
  "hooks": {
    "stop": {
      "enabled": false,  // Enable with: c0ntextkeeper hooks enable stop
      "minLength": 50    // Minimum answer length to capture
    }
  }
}
```

### Enable

```bash
c0ntextkeeper hooks enable stop
```

### Use Cases

- **Knowledge Base**: Build searchable Q&A library
- **Team Learning**: Share solutions to common problems
- **Debugging**: Track error resolutions over time
- **Onboarding**: New team members can search past solutions

---

## PostToolUse Hook

### What It Does

Tracks **EVERY tool execution** to build comprehensive pattern analytics:
- Which tools are used most frequently
- Success/failure rates per tool
- Common command sequences
- Error patterns by tool type
- File modification patterns

### When It Triggers

After **every** tool execution completes (successful or failed):
- Write, Edit, MultiEdit - file operations
- Bash - shell commands
- Read, Grep, Glob - search operations
- TodoWrite - task management
- **All MCP tools** - sequential-thinking, filesystem, github-mcp, etc.

### What It Captures

Example tool pattern:
```json
{
  "tool": "Write",
  "success": true,
  "fileModified": "src/components/Button.tsx",
  "pattern": "Write: src/components/Button.tsx - modified",
  "timestamp": "2025-10-17T14:33:00Z",
  "sessionId": "session-abc123"
}
```

Example Bash pattern:
```json
{
  "tool": "Bash",
  "success": true,
  "commandExecuted": "npm test",
  "pattern": "Bash: npm - success",
  "timestamp": "2025-10-17T14:34:00Z",
  "sessionId": "session-abc123"
}
```

Example error pattern:
```json
{
  "tool": "Edit",
  "success": false,
  "error": "File not found: src/missing.ts",
  "fileModified": "src/missing.ts",
  "pattern": "Edit: src/missing.ts - failed",
  "timestamp": "2025-10-17T14:35:00Z",
  "sessionId": "session-abc123"
}
```

### MCP Tool Tracking

Specially formatted for MCP tools:

```json
{
  "tool": "mcp__filesystem__write_file",
  "success": true,
  "pattern": "MCP filesystem: write file on /path/to/file.ts - success",
  "timestamp": "2025-10-17T14:36:00Z"
}
```

```json
{
  "tool": "mcp__sequential-thinking__sequentialthinking",
  "success": true,
  "pattern": "MCP sequential-thinking: sequentialthinking - thought 3 of 10",
  "timestamp": "2025-10-17T14:37:00Z"
}
```

### Storage Locations

**Daily patterns**:
```
~/.c0ntextkeeper/archive/projects/[project-name]/patterns/
├── 2025-10-17-patterns.json   # Array of tool patterns
├── 2025-10-18-patterns.json
└── 2025-10-19-patterns.json
```

**Error patterns** (tracked separately):
```
~/.c0ntextkeeper/errors/
├── 2025-10-17-errors.json
├── 2025-10-18-errors.json
└── 2025-10-19-errors.json
```

### Pattern Analysis

Use `c0ntextkeeper patterns` to analyze:
- Most frequently used tools
- Success rates by tool type
- Common command sequences
- Error frequency by file/tool
- Workflow identification

### Performance

- **Processing time**: <5 seconds
- **Average**: <500ms per tool execution
- **Non-blocking**: Never delays tool completion

### Configuration

```json
{
  "hooks": {
    "postToolUse": {
      "enabled": false,
      "matcher": "Write|Edit|MultiEdit",  // Tool name regex filter
      "captureErrors": true               // Capture failed executions
    }
  }
}
```

### Enable

```bash
c0ntextkeeper hooks enable posttooluse
```

### Use Cases

- **Workflow Optimization**: Identify repetitive tasks for automation
- **Error Analysis**: Find frequently failing operations
- **Tool Usage**: Understand which tools provide most value
- **Pattern Discovery**: Learn common command sequences
- **MCP Analytics**: Track MCP server usage and effectiveness

---

## UserPromptSubmit Hook

### What It Does

Captures **every user question** as it's submitted to build understanding of:
- What problems users are trying to solve
- Question patterns and topics
- Follow-up question tracking
- User behavior analytics

### When It Triggers

Every time user submits a prompt (before Claude responds).

### What It Captures

Example prompt capture:
```json
{
  "sessionId": "session-abc123",
  "timestamp": "2025-10-17T14:30:00Z",
  "projectPath": "/Users/dev/my-project",
  "prompt": "How do I implement rate limiting for my API?",
  "promptLength": 44,
  "hasCodeBlock": false,
  "hasQuestion": true,
  "topics": ["api", "performance"],
  "isFollowUp": false,
  "promptNumber": 1
}
```

Example follow-up:
```json
{
  "sessionId": "session-abc123",
  "timestamp": "2025-10-17T14:35:00Z",
  "prompt": "Can you add Redis as the backing store for rate limits?",
  "promptLength": 56,
  "hasCodeBlock": false,
  "hasQuestion": true,
  "topics": ["redis", "api"],
  "isFollowUp": true,  // Same session, 2nd+ prompt
  "promptNumber": 2
}
```

### Topic Detection

Same patterns as PreCompact hook (common programming topics):
- Authentication, database, API, testing, debugging
- Deployment, JavaScript, frontend, styling, security
- Performance, version control, etc.

### Storage Location

```
~/.c0ntextkeeper/archive/projects/[project-name]/prompts/
├── 2025-10-17-prompts.json   # Array of prompts
├── 2025-10-18-prompts.json
└── 2025-10-19-prompts.json
```

### Filtering Logic

**Captures when**:
- Prompt length ≥ 10 characters

**Skips when**:
- Prompt < 10 characters (likely typos or tests)
- Test session detected

### Performance

- **Processing time**: <5 seconds
- **Average**: <100ms per prompt
- **Non-blocking**: Never delays prompt submission

### Configuration

```json
{
  "hooks": {
    "userPromptSubmit": {
      "enabled": false,
      "minLength": 10,           // Minimum prompt length
      "excludePatterns": []      // Regex patterns to exclude
    }
  }
}
```

### Enable

```bash
c0ntextkeeper hooks enable userpromptsubmit
```

### Use Cases

- **User Behavior**: Understand common question patterns
- **Topic Trends**: Identify frequently discussed topics
- **Follow-up Analysis**: See how conversations develop
- **Coverage Gaps**: Find areas where users ask many questions

---

## Notification Hook

### What It Does

Captures **notifications** sent by Claude Code, including alerts, warnings, success messages, and progress updates. Useful for tracking development warnings and system alerts.

### When It Triggers

When Claude Code sends a notification event (toast messages, alerts, progress updates).

### What It Captures

Example notification capture:
```json
{
  "sessionId": "session-abc123",
  "timestamp": "2025-12-23T14:30:00Z",
  "projectPath": "/Users/dev/my-project",
  "type": "warning",
  "severity": "medium",
  "message": "File not found: config.json - using defaults",
  "context": {
    "tool": "Read",
    "file": "config.json"
  }
}
```

### Storage Location

```
~/.c0ntextkeeper/archive/projects/[project-name]/notifications/
├── 2025-12-23-notifications.json   # Array of notifications
├── 2025-12-24-notifications.json
└── 2025-12-25-notifications.json
```

### Performance

- **Processing time**: <5 seconds
- **Average**: <100ms per notification
- **Non-blocking**: Never delays notification delivery

### Configuration

```json
{
  "hooks": {
    "notification": {
      "enabled": false,
      "severityFilter": ["warning", "error"]  // Optional: filter by severity
    }
  }
}
```

### Enable

```bash
c0ntextkeeper hooks enable notification
```

### Use Cases

- **Warning Tracking**: Monitor development warnings
- **Alert History**: Track system alerts over time
- **Issue Detection**: Identify recurring problems
- **Debug Context**: Understand what happened before errors

---

## SubagentStop Hook (REMOVED in v0.7.8)

> **Note**: The SubagentStop hook was removed in v0.7.8 because Claude Code does not send the required fields (`subagent_type`, `tools_used`, `transcript`). This made the feature non-functional. See CHANGELOG.md for details.

---

## SessionStart Hook

### What It Does

Captures **session start events** to track when Claude Code sessions begin. Provides context about the development environment at session start.

### When It Triggers

When a new Claude Code session begins.

### What It Captures

Example session start capture:
```json
{
  "sessionId": "session-abc123",
  "timestamp": "2025-12-23T09:00:00Z",
  "projectPath": "/Users/dev/my-project",
  "projectName": "my-project",
  "workingDirectory": "/Users/dev/my-project",
  "environment": {
    "nodeVersion": "20.10.0",
    "platform": "darwin"
  }
}
```

### Storage Location

```
~/.c0ntextkeeper/archive/projects/[project-name]/sessions-meta/
├── 2025-12-23-sessions.json   # Array of session lifecycle events
├── 2025-12-24-sessions.json
└── 2025-12-25-sessions.json
```

### Performance

- **Processing time**: <5 seconds
- **Average**: <100ms per session start
- **Non-blocking**: Never delays session initialization

### Configuration

```json
{
  "hooks": {
    "sessionStart": {
      "enabled": false,
      "captureEnvironment": true  // Include environment details
    }
  }
}
```

### Enable

```bash
c0ntextkeeper hooks enable sessionstart
```

### Use Cases

- **Session Tracking**: Know when sessions start
- **Duration Analysis**: Pair with SessionEnd for duration metrics
- **Environment Context**: Track development environment changes
- **Usage Analytics**: Understand development patterns

---

## SessionEnd Hook

### What It Does

Captures **session end events** to track when Claude Code sessions terminate. Provides session duration and summary statistics.

### When It Triggers

When a Claude Code session ends (user exits, timeout, or explicit end).

### What It Captures

Example session end capture:
```json
{
  "sessionId": "session-abc123",
  "timestamp": "2025-12-23T17:30:00Z",
  "projectPath": "/Users/dev/my-project",
  "projectName": "my-project",
  "duration": 30600000,
  "durationFormatted": "8h 30m",
  "summary": {
    "toolsUsed": ["Write", "Edit", "Bash", "Read"],
    "filesModified": 12,
    "questionsAsked": 15,
    "responsesGenerated": 15
  }
}
```

### Storage Location

```
~/.c0ntextkeeper/archive/projects/[project-name]/sessions-meta/
├── 2025-12-23-sessions.json   # Array of session lifecycle events
├── 2025-12-24-sessions.json
└── 2025-12-25-sessions.json
```

### Performance

- **Processing time**: <5 seconds
- **Average**: <200ms per session end
- **Non-blocking**: Never delays session termination

### Configuration

```json
{
  "hooks": {
    "sessionEnd": {
      "enabled": false,
      "captureSummary": true  // Include session summary statistics
    }
  }
}
```

### Enable

```bash
c0ntextkeeper hooks enable sessionend
```

### Use Cases

- **Duration Tracking**: Measure session lengths
- **Productivity Analysis**: Understand work patterns
- **Tool Usage**: See which tools used most per session
- **Session Pairing**: Pair with SessionStart for complete lifecycle

---

## Hook Management

### List All Hooks

```bash
c0ntextkeeper hooks list
```

Output:
```
📋 c0ntextKeeper Hooks
═══════════════════════════════════════════════════════

✅ PreCompact
   Status: Enabled
   Trigger: Before compaction
   Storage: ~/.c0ntextkeeper/archive/projects/[name]/sessions/

⭕ UserPromptSubmit
   Status: Disabled
   Trigger: Every user prompt
   Storage: ~/.c0ntextkeeper/archive/projects/[name]/prompts/

⭕ PostToolUse
   Status: Disabled
   Trigger: After every tool use
   Storage: ~/.c0ntextkeeper/archive/projects/[name]/patterns/

⭕ Stop
   Status: Disabled
   Trigger: After assistant response
   Storage: ~/.c0ntextkeeper/archive/projects/[name]/knowledge/
```

### Enable/Disable Hooks

```bash
# Enable
c0ntextkeeper hooks enable stop
c0ntextkeeper hooks enable posttooluse
c0ntextkeeper hooks enable userpromptsubmit

# Disable
c0ntextkeeper hooks disable stop
```

### Test Hooks

```bash
# Test specific hook
c0ntextkeeper hooks test precompact
c0ntextkeeper hooks test stop

# Test all hooks
c0ntextkeeper test-hook
```

### Health Check

```bash
c0ntextkeeper hooks health
```

Comprehensive diagnostics:
- Hook configuration validation
- File permissions check
- Storage accessibility
- Claude Code settings verification
- Recent hook execution status

### Statistics

```bash
c0ntextkeeper hooks stats
```

Shows:
- Total captures per hook
- Success/failure rates
- Average processing time
- Storage size per hook
- Recent activity

---

## Hook Debugging

### Enable Debug Logging

```bash
export C0NTEXTKEEPER_DEBUG=true
```

### View Debug Logs

```
~/.c0ntextkeeper/debug/
├── precompact-2025-10-17.log
├── stop-2025-10-17.log
├── posttool-2025-10-17.log
└── userprompt-2025-10-17.log
```

Each log contains:
- Hook start time
- Input received
- Parsing details
- Processing steps
- Storage paths
- Errors (if any)
- Completion status

### Common Issues

**Hook not triggering?**
```bash
c0ntextkeeper validate
c0ntextkeeper hooks health
```

**Slow hook execution?**
```bash
c0ntextkeeper benchmark
```

**Hook failing silently?**
```bash
export C0NTEXTKEEPER_DEBUG=true
# Run your workflow
cat ~/.c0ntextkeeper/debug/[hook]-$(date +%Y-%m-%d).log
```

---

## Best Practices

### 1. Start Minimal

Begin with **PreCompact only** - it provides 80% of value with zero overhead.

### 2. Add Hooks Incrementally

Enable additional hooks based on specific needs:
- Building Q&A knowledge base → **Stop**
- Analyzing tool usage → **PostToolUse**
- Understanding user behavior → **UserPromptSubmit**

### 3. Monitor Performance

```bash
c0ntextkeeper benchmark
```

Ensure hooks complete within targets (<10ms operations).

### 4. Clean Regularly

```bash
c0ntextkeeper cleanup --dry-run
```

Remove test data and invalid entries.

### 5. Rebuild Index

```bash
c0ntextkeeper rebuild-index
```

After enabling new hooks or migrating data.

---

## Hook Comparison

### Original Hooks (v0.7.4)

| Feature | PreCompact | Stop | PostToolUse | UserPromptSubmit |
|---------|------------|------|-------------|------------------|
| **Default** | ✅ Enabled | ⭕ Disabled | ⭕ Disabled | ⭕ Disabled |
| **Frequency** | Per compaction | Per response | Per tool use | Per prompt |
| **Coverage** | Complete session | Q&A pairs | Tool patterns | User questions |
| **Storage** | sessions/ | knowledge/ | patterns/ | prompts/ |
| **Value** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Overhead** | Low (1-2/day) | Medium (~20-50/day) | High (100-500/day) | Medium (~20-50/day) |
| **Use Case** | Context preservation | Knowledge base | Tool analytics | Behavior analysis |

### New Hooks (v0.7.7)

| Feature | Notification | SessionStart | SessionEnd |
|---------|--------------|--------------|------------|
| **Default** | ⭕ Disabled | ⭕ Disabled | ⭕ Disabled |
| **Frequency** | Per notification | Per session | Per session |
| **Coverage** | Alerts/warnings | Session start | Session end |
| **Storage** | notifications/ | sessions-meta/ | sessions-meta/ |
| **Value** | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Overhead** | Low (~5-10/day) | Low (1/session) | Low (1/session) |
| **Use Case** | Alert tracking | Lifecycle tracking | Lifecycle tracking |

---

*Last Updated: 2025-12-26 | c0ntextKeeper v0.7.8*

**Next**: Learn about [MCP Tools](./MCP-TOOLS.md) to query your archived context!
