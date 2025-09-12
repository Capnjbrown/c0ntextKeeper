# 📝 Documentation Naming Conventions

## Overview
This document outlines the naming conventions used throughout the c0ntextKeeper project documentation.

## 📊 Quick Reference Table

| Convention | Example | Primary Usage |
|------------|---------|---------------|
| camelCase | `firstName` | JS/TS variables |
| PascalCase | `FirstName` | Classes, components |
| snake_case | `first_name` | Python, Ruby |
| kebab-case | `first-name` | URLs, CSS, files, documentations |
| SCREAMING_SNAKE | `FIRST_NAME` | Constants |
| Train-Case | `First-Name` | HTTP headers |
| dot.case | `first.name` | Package names |
| flatcase | `firstname` | Hashtags |

### 🤖 Claude Code CLI Files
Special files automatically detected by Claude Code CLI when running `claude` commands:
- `CLAUDE.md` - Team-shared Claude Code instructions (version controlled)
- `CLAUDE.local.md` - Personal Claude Code settings (git-ignored)

**Note:** These conventions apply to Claude Code CLI (the command-line tool), not the Claude.ai web interface.

## Naming Rules by Location

### 🏠 Root Level Files
**Convention:** `UPPERCASE.md` or `UPPERCASE_WITH_UNDERSCORES.md`

These files use UPPERCASE naming for automatic detection by GitHub and Claude Code CLI:
- `README.md` - Project overview (GitHub standard)
- `LICENSE` - Legal documentation (no extension)
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community standards
- `SECURITY.md` - Security policy
- `CLAUDE.md` - Claude Code CLI instructions (MUST be uppercase, auto-detected)
- `CLAUDE.local.md` - Personal Claude Code settings (optional, git-ignored)

**Rationale:** GitHub automatically detects certain files (README, LICENSE, etc.) when named in UPPERCASE at the root level. CLAUDE.md follows this convention and is automatically detected by Claude Code CLI (the command-line tool) when running `claude` commands. Note: This is specific to Claude Code CLI, not the Claude.ai web interface.

### 📁 Documentation in `/docs`
**Convention:** `lowercase-hyphenated.md`

All documentation files within the `/docs` directory tree use lowercase with hyphens:

#### `/docs/technical/`
- `file-formats.md` (not FILE-FORMATS.md)
- `hook-integration.md` (not HOOK-INTEGRATION.md)
- `mcp-usage.md` (not MCP-USAGE.md)
- `storage.md` (not STORAGE.md)

#### `/docs/guides/`
- `user-guide.md` (not USER-GUIDE.md)
- `migration-guide.md` (not MIGRATION_GUIDE.md)

#### `/docs/development/`
- `project-context.md` (not PROJECT_CONTEXT.md)
- `public-migration-report.md` (not PUBLIC_MIGRATION_REPORT.md)

**Rationale:** Lowercase hyphenated names are the modern standard for documentation directories, improving readability and consistency.

### 🔧 GitHub Special Directories
**Convention:** Follows GitHub's requirements

#### `/.github/`
- `PULL_REQUEST_TEMPLATE.md` - UPPERCASE (GitHub requirement)
- `BRANCH_STRATEGY.md` - UPPERCASE for consistency
- `REPOSITORY_SETTINGS.md` - UPPERCASE for consistency

#### `/.github/ISSUE_TEMPLATE/`
- `bug_report.md` - lowercase (GitHub's generated format)
- `feature_request.md` - lowercase (GitHub's generated format)

**Rationale:** GitHub has specific requirements for template detection in the `.github` directory.

## Summary Table

| Location | Convention | Example | Purpose |
|----------|------------|---------|---------|
| Root (`/`) | UPPERCASE | `CHANGELOG.md` | Auto-detection by GitHub/Claude Code CLI |
| `/docs/**` | lowercase-hyphenated | `user-guide.md` | Modern documentation standard |
| `/.github/` | UPPERCASE | `PULL_REQUEST_TEMPLATE.md` | GitHub template detection |
| `/.github/ISSUE_TEMPLATE/` | lowercase | `bug_report.md` | GitHub's format |

## Important Notes

1. **CLAUDE.md MUST be uppercase** - Required by Claude Code CLI for auto-detection
2. **CLAUDE.md placement flexibility** - While typically at root, can also be placed in:
   - Parent directories of where you run `claude`
   - Child directories of where you run `claude`  
   - Your home folder (`~/.claude/CLAUDE.md`)
3. **CLAUDE.local.md for personal settings** - Use for personal Claude Code settings not shared with team (should be git-ignored)
4. **Never use spaces** in filenames - Use hyphens instead
5. **Avoid underscores** in `/docs` - Use hyphens for consistency (except root level)
6. **Keep extensions lowercase** - Always use `.md`, never `.MD`

## Migration from Old Structure

When moving files from root to `/docs`:
- `FILE-FORMATS.md` → `/docs/technical/file-formats.md`
- `USER_GUIDE.md` → `/docs/guides/user-guide.md`
- `project-context.md` → `/docs/development/project-context.md`

Exception:
- `CLAUDE.md` stays at root (required by Claude Code CLI)

---

*Last Updated: 2025-09-09*