# c0ntextKeeper Specialized Skills

> Audit and validation skills for c0ntextKeeper MCP server development

## Overview

This plugin provides **10 specialized slash command skills** designed for c0ntextKeeper development, maintenance, and release workflows. Each skill invokes a detailed audit system prompt tailored for specific validation tasks.

## Installation

This plugin is installed locally within the c0ntextKeeper project:

```
c0ntextKeeper/.claude/plugins/c0ntextkeeper-agents/
```

It is automatically discovered by Claude Code when working in the c0ntextKeeper project directory.

## Available Skills

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/mcp-audit` | MCP server validation | After modifying MCP tools or server |
| `/hook-validator` | Hook integration testing | After modifying hooks or debugging |
| `/context-quality` | Extraction quality audit | After modifying extractor/scorer |
| `/release-orchestrator` | Release workflow automation | Preparing releases |
| `/archive-integrity` | Archive health checks | Periodic maintenance, corruption issues |
| `/security-audit` | Security filtering validation | After modifying security filter |
| `/documentation-sync` | Doc/code consistency | After significant changes, before release |
| `/performance-monitor` | Performance tracking | Before releases, performance concerns |
| `/doc-crosscheck` | Doc-to-doc consistency | Before releases, after editing docs |
| `/audit` | General-purpose audit | Any custom audit focus |

## Usage

Simply type the slash command in Claude Code:

```bash
# Specialized audits
/mcp-audit              # Audit MCP server implementation
/hook-validator         # Validate all 7 hooks
/context-quality        # Check extraction quality
/release-orchestrator   # Prepare a release
/archive-integrity      # Validate archive health
/security-audit         # Audit security filtering
/documentation-sync     # Check doc/code consistency
/performance-monitor    # Analyze performance

# Documentation audits
/doc-crosscheck         # Cross-check all 48 docs for consistency

# General-purpose audit (parameterized)
/audit                  # Prompts for focus area
/audit error handling   # Specific focus provided
/audit naming conventions
/audit test coverage
```

## Trigger Conditions

| Skill | Trigger When |
|-------|--------------|
| `/mcp-audit` | Modified `src/server/index.ts`, added MCP tools, updated SDK |
| `/hook-validator` | Modified `src/hooks/*`, hooks miss data, Claude Code upgrade |
| `/context-quality` | Modified `extractor.ts`, `scorer.ts`, `patterns.ts` |
| `/release-orchestrator` | Preparing a new version release |
| `/archive-integrity` | Storage issues, periodic maintenance, migration |
| `/security-audit` | Modified `security-filter.ts`, new data types, pre-release |
| `/documentation-sync` | Significant code changes, new features, pre-release |
| `/performance-monitor` | Code changes, pre-release, slowness reported |
| `/doc-crosscheck` | Before releases, after editing documentation files |
| `/audit` | Any ad-hoc audit need (error handling, types, naming, etc.) |

## Architecture

```
.claude/plugins/c0ntextkeeper-agents/
├── plugin.json          # Plugin manifest with 10 skills
├── README.md            # This file
├── skills/              # Slash command definitions
│   ├── mcp-audit.md
│   ├── hook-validator.md
│   ├── context-quality.md
│   ├── release-orchestrator.md
│   ├── archive-integrity.md
│   ├── security-audit.md
│   ├── documentation-sync.md
│   ├── performance-monitor.md
│   ├── doc-crosscheck.md     # NEW: Doc-to-doc consistency
│   └── audit.md              # NEW: General-purpose audit
└── agents/              # System prompt definitions (reference)
    ├── mcp-audit.md
    ├── hook-validator.md
    ├── doc-crosscheck.md     # NEW
    ├── audit.md              # NEW
    └── ... (10 agent definitions)
```

**DRY Principle**: Skills reference agent files for their detailed system prompts, keeping audit logic in one place.

## Output Format

Each skill produces a structured report including:

1. **Summary** - Quick overview of findings
2. **Detailed Analysis** - Section-by-section audit results
3. **Issues Found** - Categorized by severity (Critical/High/Medium/Low)
4. **Recommendations** - Specific, actionable next steps

## Workflows

### Pre-Release Workflow (5 Steps)

```bash
/doc-crosscheck         # 1. Verify doc-to-doc consistency
/documentation-sync     # 2. Check docs match code
/security-audit         # 3. Verify no data leaks
/performance-monitor    # 4. Check for regressions
/release-orchestrator   # 5. Prepare release
```

### Post-Change Workflow

| What Changed | Run This |
|--------------|----------|
| MCP Server | `/mcp-audit` |
| Hooks | `/hook-validator` |
| Extraction | `/context-quality` |
| Security | `/security-audit` |
| Documentation | `/doc-crosscheck` |
| Any aspect | `/audit [focus]` |

## Skill Categories

### Specialized Audits (8 skills)
Fixed-scope audits for specific components:
- `/mcp-audit`, `/hook-validator`, `/context-quality`
- `/archive-integrity`, `/security-audit`, `/documentation-sync`
- `/performance-monitor`, `/release-orchestrator`

### Documentation Audits (2 skills)
- `/documentation-sync` - Docs match code
- `/doc-crosscheck` - Docs match each other

### General-Purpose (1 skill)
- `/audit` - Parameterized for any focus area

## Maintenance

### Updating System Prompts

Edit the agent files in `agents/*.md` - skills automatically reference them.

### Adding New Skills

1. Create agent definition in `agents/new-skill.md` with YAML frontmatter
2. Create skill file in `skills/new-skill.md` that references the agent
3. Register in `plugin.json` skills array
4. Update this README

### Agent Frontmatter Format

```yaml
---
name: agent-name
description: Description with usage triggers
tools: Glob, Grep, Read, Bash
model: sonnet
color: blue
---

[Detailed system prompt content]
```

## Related Documentation

- [CLAUDE.md](../../../CLAUDE.md) - Project development guidelines
- [project-context.md](../../../docs/development/project-context.md) - Technical source of truth
- [RELEASE-GUIDE.md](../../../docs/development/RELEASE-GUIDE.md) - Release procedures

## Version

- **Plugin Version**: 1.2.0
- **Compatible With**: c0ntextKeeper v0.7.7+
- **Claude Code Version**: Any with Skill tool support

## License

MIT - Part of the c0ntextKeeper project
