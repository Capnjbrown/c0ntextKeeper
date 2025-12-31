# Configuration Reference

> **Complete guide to c0ntextKeeper configuration options**

---

## Overview

c0ntextKeeper uses a two-tier configuration system:

1. **Global Config** (`~/.c0ntextkeeper/config.json`) - Applies to all projects
2. **Project Config** (`<project>/.c0ntextkeeper/config.json`) - Project-specific overrides

**Priority**: Project config > Global config > Defaults

---

## Configuration Levels

### Global Configuration

**Location**: `~/.c0ntextkeeper/config.json`

**Purpose**: Default settings for all projects

**Create**:
```bash
c0ntextkeeper init --global
```

**Edit**:
```bash
# Manual editing
nano ~/.c0ntextkeeper/config.json

# Or use CLI commands (recommended)
c0ntextkeeper hooks enable stop --global
c0ntextkeeper context configure --enable --global
```

**When to Use**:
- Set your preferred hooks across all projects
- Define universal security patterns
- Configure default auto-load strategy
- Set global retention policies

---

### Project Configuration

**Location**: `<project-dir>/.c0ntextkeeper/config.json`

**Purpose**: Override global settings for specific project

**Create**:
```bash
cd ~/my-project
c0ntextkeeper init
```

**Edit**:
```bash
# Manual editing
nano .c0ntextkeeper/config.json

# Or use CLI commands (recommended)
c0ntextkeeper hooks enable posttool
c0ntextkeeper context configure --strategy relevant
```

**When to Use**:
- Enable extra hooks for specific project
- Customize auto-load for project size
- Add project-specific security patterns
- Override global defaults

---

## Configuration Structure

### Complete Default Configuration

```json
{
  "hooks": {
    "preCompact": {
      "enabled": true,
      "captureOn": ["manual", "auto"]
    },
    "userPromptSubmit": {
      "enabled": false,
      "minLength": 10,
      "excludePatterns": []
    },
    "postToolUse": {
      "enabled": false,
      "matcher": "Write|Edit|MultiEdit",
      "captureErrors": true
    },
    "stop": {
      "enabled": false,
      "minLength": 50
    }
  },
  "storage": {
    "retentionDays": 90,
    "maxSizeMB": 100,
    "compressionEnabled": false
  },
  "extraction": {
    "relevanceThreshold": 0.5,
    "maxContextItems": 50,
    "enablePatternRecognition": true,
    "contentLimits": {
      "question": 2000,
      "solution": 2000,
      "implementation": 1000,
      "decision": 500
    }
  },
  "security": {
    "filterSensitiveData": true,
    "customPatterns": []
  },
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

---

## Hook Settings

### preCompact Hook

**Default**: ✅ Enabled (provides 80% of value)

**Settings**:
```json
{
  "enabled": true,
  "captureOn": ["manual", "auto"]
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable hook |
| `captureOn` | string[] | `["manual", "auto"]` | When to trigger: "manual", "auto", or both |

**Examples**:

```bash
# Disable PreCompact (not recommended)
c0ntextkeeper hooks disable precompact

# Only capture on manual /compact
c0ntextkeeper hooks enable precompact --capture-on manual
```

**Manual Config**:
```json
{
  "hooks": {
    "preCompact": {
      "enabled": true,
      "captureOn": ["manual"]  // Only manual /compact
    }
  }
}
```

---

### userPromptSubmit Hook

**Default**: ⭕ Disabled

**Settings**:
```json
{
  "enabled": false,
  "minLength": 10,
  "excludePatterns": []
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable hook |
| `minLength` | number | `10` | Min prompt length to capture (characters) |
| `excludePatterns` | string[] | `[]` | Regex patterns to exclude (e.g., `["^/.*"]` for slash commands) |

**Examples**:

```bash
# Enable with defaults
c0ntextkeeper hooks enable userpromptsubmit

# Enable with custom min length
c0ntextkeeper hooks enable userpromptsubmit --min-length 20
```

**Manual Config**:
```json
{
  "hooks": {
    "userPromptSubmit": {
      "enabled": true,
      "minLength": 20,
      "excludePatterns": ["^/.*", "^test.*"]  // Skip slash commands and test prompts
    }
  }
}
```

**Use Cases**:
- Track user question patterns
- Analyze prompt complexity over time
- Detect follow-up questions
- Build user behavior insights

---

### postToolUse Hook

**Default**: ⭕ Disabled

**Settings**:
```json
{
  "enabled": false,
  "matcher": "Write|Edit|MultiEdit",
  "captureErrors": true
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable hook |
| `matcher` | string | `"Write\|Edit\|MultiEdit"` | Regex to match tool names (pipe-separated) |
| `captureErrors` | boolean | `true` | Capture failed tool executions |

**Examples**:

```bash
# Enable with defaults (Write, Edit, MultiEdit)
c0ntextkeeper hooks enable posttooluse

# Capture all tools
c0ntextkeeper hooks enable posttooluse --matcher ".*"

# Only capture Write operations
c0ntextkeeper hooks enable posttooluse --matcher "Write"
```

**Manual Config**:
```json
{
  "hooks": {
    "postToolUse": {
      "enabled": true,
      "matcher": "Write|Edit|Bash|Read",  // Track file ops and commands
      "captureErrors": true
    }
  }
}
```

**Matcher Examples**:
- `"Write|Edit"` - File modifications only
- `"Bash"` - Shell commands only
- `"mcp__.*"` - All MCP server tools
- `".*"` - All tools (comprehensive tracking)

**Use Cases**:
- Track code modification patterns
- Monitor command execution frequency
- Identify error-prone operations
- Build tool usage analytics

---

### stop Hook

**Default**: ⭕ Disabled

**Settings**:
```json
{
  "enabled": false,
  "minLength": 50
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable hook |
| `minLength` | number | `50` | Min response length to capture (characters) |

**Examples**:

```bash
# Enable with defaults
c0ntextkeeper hooks enable stop

# Enable with lower threshold (more Q&A captured)
c0ntextkeeper hooks enable stop --min-length 20
```

**Manual Config**:
```json
{
  "hooks": {
    "stop": {
      "enabled": true,
      "minLength": 30  // Capture shorter responses
    }
  }
}
```

**Internal Relevance Filtering**:
- Relevance threshold: 0.2 (hardcoded in stop.ts line 114)
- Only stores Q&A with solutions or errors
- Skips trivial exchanges automatically

**Use Cases**:
- Build searchable Q&A knowledge base
- Track problem-solution pairs
- Enable auto-load knowledge resource
- Improve session-to-session continuity

---

## Storage Settings

**Default**:
```json
{
  "retentionDays": 90,
  "maxSizeMB": 100,
  "compressionEnabled": false
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retentionDays` | number | `90` | Auto-delete archives older than N days (0 = never) |
| `maxSizeMB` | number | `100` | Max total archive size in MB (0 = unlimited) |
| `compressionEnabled` | boolean | `false` | Enable gzip compression (not yet implemented) |
| `basePath` | string | `~/.c0ntextkeeper` | Custom storage location |

**Examples**:

```json
{
  "storage": {
    "retentionDays": 180,     // Keep 6 months
    "maxSizeMB": 500,         // Allow 500MB total
    "basePath": "/custom/path"
  }
}
```

**Retention Policy**:
- `retentionDays: 0` - Never delete (manual cleanup only)
- `retentionDays: 30` - Delete after 1 month
- `retentionDays: 90` - Default (3 months)
- `retentionDays: 365` - Keep 1 year

**Size Management**:
- Enforced during cleanup operations
- Oldest sessions deleted first
- Test data excluded from size limits
- Runs via `c0ntextkeeper cleanup`

**Custom Storage Path**:
```json
{
  "storage": {
    "basePath": "/mnt/external/c0ntextkeeper"  // Use external drive
  }
}
```

---

## Extraction Settings

**Default**:
```json
{
  "relevanceThreshold": 0.5,
  "maxContextItems": 50,
  "enablePatternRecognition": true,
  "contentLimits": {
    "question": 2000,
    "solution": 2000,
    "implementation": 1000,
    "decision": 500
  }
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `relevanceThreshold` | number | `0.5` | Min score to include context (0-1) |
| `maxContextItems` | number | `50` | Max items per extraction |
| `enablePatternRecognition` | boolean | `true` | Enable semantic pattern detection |
| `contentLimits` | object | See below | Character limits per content type |

**Content Limits**:

| Type | Default | Description |
|------|---------|-------------|
| `question` | 2000 | Max question length |
| `solution` | 2000 | Max solution length |
| `implementation` | 1000 | Max implementation description |
| `decision` | 500 | Max decision text |

**Examples**:

```json
{
  "extraction": {
    "relevanceThreshold": 0.7,    // Higher quality threshold
    "maxContextItems": 100,       // More items
    "contentLimits": {
      "question": 5000,           // Longer questions
      "solution": 5000            // Longer solutions
    }
  }
}
```

**Relevance Threshold Guide**:
- `0.3` - Very permissive (captures almost everything)
- `0.5` - **Default** (good balance)
- `0.7` - Strict (only high-value content)
- `0.9` - Very strict (critical content only)

**Pattern Recognition**:
- 180 semantic patterns
- 116 problem indicators
- 41 request indicators
- 23 solution indicators
- 7 decision indicators

**Disabling Pattern Recognition**:
```json
{
  "extraction": {
    "enablePatternRecognition": false  // Use basic extraction only
  }
}
```

---

## Security Settings

**Default**:
```json
{
  "filterSensitiveData": true,
  "customPatterns": []
}
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filterSensitiveData` | boolean | `true` | Enable automatic filtering |
| `customPatterns` | string[] | `[]` | Additional regex patterns to filter |

**Automatic Filtering** (when enabled):
- API keys (OpenAI, Anthropic, AWS, GitHub, Stripe)
- Database connection strings (PostgreSQL, MySQL, MongoDB)
- Private keys and SSH keys
- JWT tokens
- Passwords and secrets
- PII (emails, IPs, phone numbers - partially redacted)

**Custom Patterns**:
```json
{
  "security": {
    "filterSensitiveData": true,
    "customPatterns": [
      "MY_CUSTOM_KEY_[A-Z0-9]{32}",
      "INTERNAL_TOKEN_.*",
      "PROJECT_SECRET_\\w+"
    ]
  }
}
```

**Examples**:

```json
{
  "security": {
    "filterSensitiveData": true,
    "customPatterns": [
      "ACME_API_KEY_.*",           // Company-specific API keys
      "db\\.prod\\..*\\.com",      // Production database URLs
      "stripe_test_\\w+",          // Test Stripe keys
      "\\d{3}-\\d{2}-\\d{4}"       // SSN format
    ]
  }
}
```

**Disable Filtering** (not recommended):
```json
{
  "security": {
    "filterSensitiveData": false  // ⚠️ Risky: No automatic filtering
  }
}
```

---

## Auto-Load Settings

**Default**:
```json
{
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
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable auto-load at session start |
| `strategy` | string | `"smart"` | Loading strategy (see below) |
| `maxSizeKB` | number | `10` | Max context size in KB |
| `sessionCount` | number | `3` | Recent sessions to include |
| `patternCount` | number | `5` | Top patterns to include |
| `knowledgeCount` | number | `10` | Q&A pairs to include |
| `promptCount` | number | `5` | Recent prompts to include |
| `includeTypes` | string[] | All types | Content types to load |
| `timeWindowDays` | number | `7` | Only load content from last N days |
| `priorityKeywords` | string[] | `[]` | Boost relevance for keywords |
| `formatStyle` | string | `"summary"` | Output format style |

**Strategies**:

| Strategy | Behavior | Best For |
|----------|----------|----------|
| `"smart"` | Recent + relevant + decisions | Most projects (default) |
| `"recent"` | Only most recent sessions | High-frequency projects |
| `"relevant"` | Only high-relevance content | Large projects with history |
| `"custom"` | Uses includeTypes + keywords | Advanced customization |

**Examples**:

**Small Project** (few sessions):
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "recent",
    "maxSizeKB": 5,
    "sessionCount": 2,
    "patternCount": 3
  }
}
```

**Large Project** (many sessions):
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "relevant",
    "maxSizeKB": 20,
    "sessionCount": 5,
    "patternCount": 10,
    "timeWindowDays": 14,
    "priorityKeywords": ["authentication", "database", "api"]
  }
}
```

**Custom Strategy**:
```json
{
  "autoLoad": {
    "enabled": true,
    "strategy": "custom",
    "maxSizeKB": 15,
    "includeTypes": ["sessions", "patterns"],  // Exclude knowledge
    "timeWindowDays": 30,
    "priorityKeywords": ["critical", "production", "bug"],
    "formatStyle": "detailed"
  }
}
```

**Format Styles**:
- `"summary"` - Brief summaries (default, most compact)
- `"detailed"` - Full context (more verbose)
- `"minimal"` - Titles only (fastest)

**Content Type Filtering**:
```json
{
  "autoLoad": {
    "includeTypes": ["sessions", "patterns"]  // Exclude knowledge and prompts
  }
}
```

**CLI Configuration**:
```bash
# Enable/disable
c0ntextkeeper context configure --enable
c0ntextkeeper context configure --disable

# Set strategy
c0ntextkeeper context configure --strategy smart
c0ntextkeeper context configure --strategy recent

# Customize counts
c0ntextkeeper context configure --session-count 5
c0ntextkeeper context configure --pattern-count 10

# Set size limit
c0ntextkeeper context configure --max-size 20

# Preview current settings
c0ntextkeeper context preview
```

---

## Configuration Management

### View Current Config

```bash
# Show effective config (merged global + project)
c0ntextkeeper status

# View config file directly
cat ~/.c0ntextkeeper/config.json          # Global
cat .c0ntextkeeper/config.json            # Project

# Preview auto-load content
c0ntextkeeper context preview
```

---

### Modify Config

**Option 1: CLI Commands** (Recommended)
```bash
# Hook management
c0ntextkeeper hooks enable stop
c0ntextkeeper hooks disable userpromptsubmit

# Auto-load configuration
c0ntextkeeper context configure --enable
c0ntextkeeper context configure --strategy relevant
c0ntextkeeper context configure --max-size 15
```

**Option 2: Manual Editing**
```bash
# Edit global config
nano ~/.c0ntextkeeper/config.json

# Edit project config
nano .c0ntextkeeper/config.json

# Validate after editing
c0ntextkeeper validate
```

---

### Reset to Defaults

```bash
# Reset specific project to defaults
cd ~/my-project
rm .c0ntextkeeper/config.json
c0ntextkeeper init

# Reset global config
rm ~/.c0ntextkeeper/config.json
c0ntextkeeper init --global
```

---

### Backup Config

```bash
# Backup global config
cp ~/.c0ntextkeeper/config.json ~/config-backup.json

# Restore from backup
cp ~/config-backup.json ~/.c0ntextkeeper/config.json
```

---

## Configuration Scenarios

### Scenario 1: Minimal Setup (Default)

**Goal**: Basic context preservation with minimal overhead

**Config**:
```json
{
  "hooks": {
    "preCompact": { "enabled": true }
  },
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "maxSizeKB": 10
  }
}
```

**CLI**:
```bash
c0ntextkeeper setup  # Default setup
```

**Result**: PreCompact captures on every `/compact`, auto-loads smart context

---

### Scenario 2: Comprehensive Tracking

**Goal**: Capture everything for analytics

**Config**:
```json
{
  "hooks": {
    "preCompact": { "enabled": true },
    "userPromptSubmit": { "enabled": true },
    "postToolUse": { "enabled": true, "matcher": ".*" },
    "stop": { "enabled": true }
  },
  "autoLoad": {
    "enabled": true,
    "strategy": "smart",
    "maxSizeKB": 15
  }
}
```

**CLI**:
```bash
c0ntextkeeper hooks enable userpromptsubmit
c0ntextkeeper hooks enable posttooluse --matcher ".*"
c0ntextkeeper hooks enable stop
c0ntextkeeper context configure --max-size 15
```

**Result**: Full capture pipeline, rich auto-load context

---

### Scenario 3: Large Project with History

**Goal**: Optimize for project with 100+ sessions

**Config**:
```json
{
  "hooks": {
    "preCompact": { "enabled": true }
  },
  "storage": {
    "retentionDays": 180,
    "maxSizeMB": 500
  },
  "extraction": {
    "relevanceThreshold": 0.7,
    "maxContextItems": 100
  },
  "autoLoad": {
    "enabled": true,
    "strategy": "relevant",
    "maxSizeKB": 20,
    "timeWindowDays": 30,
    "priorityKeywords": ["production", "critical", "bug"]
  }
}
```

**CLI**:
```bash
c0ntextkeeper context configure --strategy relevant
c0ntextkeeper context configure --max-size 20
```

**Result**: Relevant content only, 30-day window, keyword prioritization

---

### Scenario 4: Security-Focused

**Goal**: Extra security filtering for sensitive project

**Config**:
```json
{
  "hooks": {
    "preCompact": { "enabled": true }
  },
  "security": {
    "filterSensitiveData": true,
    "customPatterns": [
      "COMPANY_API_KEY_.*",
      "PROD_DB_.*",
      "customer_id_\\d{8}",
      "internal_token_.*"
    ]
  },
  "storage": {
    "retentionDays": 30  // Short retention for sensitive data
  }
}
```

**Result**: Aggressive filtering, short retention, company-specific patterns

---

### Scenario 5: Test/Development Project

**Goal**: Lightweight tracking for testing

**Config**:
```json
{
  "hooks": {
    "preCompact": { "enabled": true, "captureOn": ["manual"] }
  },
  "storage": {
    "retentionDays": 7,
    "maxSizeMB": 10
  },
  "autoLoad": {
    "enabled": false  // Disable auto-load for tests
  }
}
```

**CLI**:
```bash
c0ntextkeeper hooks enable precompact --capture-on manual
c0ntextkeeper context configure --disable
```

**Result**: Manual capture only, short retention, no auto-load

---

## Best Practices

### Configuration Organization

1. **Use Global Config for Defaults**
   - Set preferred hooks globally
   - Define security patterns once
   - Configure universal auto-load strategy

2. **Use Project Config for Overrides**
   - Enable extra hooks for specific projects
   - Adjust auto-load for project size
   - Add project-specific security patterns

3. **Version Control**
   - ✅ Commit `.c0ntextkeeper/config.json` to git
   - ✅ Share hook preferences with team
   - ❌ Don't commit global config (user-specific)

### Performance Optimization

1. **Auto-Load Size**
   - Start small (5-10KB)
   - Increase if needed (monitor preview)
   - Never exceed 50KB (impacts session start)

2. **Hook Selection**
   - Always enable PreCompact (80% value)
   - Enable Stop for Q&A knowledge
   - Enable PostToolUse only if needed (adds overhead)
   - UserPromptSubmit rarely needed

3. **Storage Management**
   - Set reasonable retention (30-180 days)
   - Run cleanup regularly
   - Monitor size with `c0ntextkeeper stats`

### Security Hardening

1. **Always Enable Filtering**
   ```json
   { "security": { "filterSensitiveData": true } }
   ```

2. **Add Custom Patterns**
   - Company API key formats
   - Internal service URLs
   - Customer identifiers
   - Project-specific secrets

3. **Review Archives**
   ```bash
   # Check for sensitive data
   grep -r "password" ~/.c0ntextkeeper/archive/
   grep -r "secret" ~/.c0ntextkeeper/archive/
   ```

---

## Troubleshooting

### Config Not Loading

**Symptoms**: Changes to config.json have no effect

**Solutions**:
```bash
# Validate JSON syntax
cat ~/.c0ntextkeeper/config.json | jq .

# Check for parse errors
c0ntextkeeper validate

# Verify config path
c0ntextkeeper status
```

---

### Auto-Load Too Large

**Symptoms**: Session start feels slow, context too verbose

**Solutions**:
```bash
# Check current size
c0ntextkeeper context preview

# Reduce size limit
c0ntextkeeper context configure --max-size 5

# Reduce counts
c0ntextkeeper context configure --session-count 2
c0ntextkeeper context configure --pattern-count 3
```

---

### Hooks Not Triggering

**Symptoms**: No archives created despite hooks enabled

**Solutions**:
```bash
# Check hook status
c0ntextkeeper hooks list

# Verify enabled
c0ntextkeeper status

# Test hook manually
c0ntextkeeper hooks test precompact

# Check hook health
c0ntextkeeper hooks health
```

---

### Storage Growing Too Large

**Symptoms**: Archive directory consuming too much disk space

**Solutions**:
```bash
# Check current size
c0ntextkeeper stats

# Set retention policy
c0ntextkeeper cleanup --dry-run

# Clean old archives
c0ntextkeeper cleanup

# Reduce max size
# Edit config.json: "maxSizeMB": 50
```

---

## Environment Variables

c0ntextKeeper respects environment variables for advanced configuration:

| Variable | Purpose | Example |
|----------|---------|---------|
| `C0NTEXTKEEPER_STORAGE` | Override storage path | `/mnt/external/archives` |
| `C0NTEXTKEEPER_DEBUG` | Enable debug logging | `true` |
| `NODE_ENV` | Test environment detection | `test` |

**Examples**:
```bash
# Use custom storage location
export C0NTEXTKEEPER_STORAGE=/mnt/external/c0ntextkeeper
c0ntextkeeper status

# Enable debug mode
export C0NTEXTKEEPER_DEBUG=true
c0ntextkeeper hooks test precompact
# Check logs: ~/.c0ntextkeeper/debug/precompact-YYYY-MM-DD.log

# Test mode (skips file operations)
NODE_ENV=test npm test
```

---

## See Also

- **[Hooks Reference](./hooks-reference.md)** - Detailed hook documentation
- **[MCP Tools Guide](./mcp-tools.md)** - MCP tool usage
- **[FEATURES.md](../FEATURES.md)** - Complete feature catalog
- **[Quick Start](../guides/quickstart.md)** - Get started in 60 seconds
