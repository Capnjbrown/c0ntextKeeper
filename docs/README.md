# 📚 c0ntextKeeper Documentation

Welcome to the c0ntextKeeper documentation! This directory contains all technical specifications, user guides, and development documentation for the project.

## 📊 Latest Updates (v0.7.8)

- **7 Claude Code Hooks** - Full support for all hook events (PreCompact, Stop, PostToolUse, UserPromptSubmit, Notification, SessionStart, SessionEnd)
- **187 Semantic Patterns** - Comprehensive problem/solution/decision detection
- **[Performance Benchmarks](technical/performance-benchmarks.md)** - Comprehensive performance analysis showing <10ms operations
- **[Test Results Summary](technical/test-results-summary.md)** - Complete test suite results (100% test pass rate - 483/483 tests)
- **[Auto-Load Guide](guides/auto-load-guide.md)** - Automatic context loading feature
- **[Hooks Reference](technical/hooks-reference.md)** - Complete documentation for all 7 hooks

## 📁 Documentation Structure

### 🔧 Technical Documentation (`/technical`)
Core technical specifications and integration guides:

- **[File Formats](technical/file-formats.md)** - Complete specification of all archive file formats
- **[Hook Integration](technical/hook-integration.md)** - Claude Code hook setup and troubleshooting
- **[Hooks Customization](technical/hooks-customization.md)** - Advanced hook configuration options
- **[MCP Activation](technical/mcp-activation.md)** - MCP server activation and setup guide
- **[MCP Testing](technical/mcp-testing.md)** - Comprehensive MCP server testing procedures
- **[MCP Usage](technical/mcp-usage.md)** - Detailed MCP tool usage patterns
- **[Hooks Reference](technical/hooks-reference.md)** - Complete 7-hook documentation (v0.7.8)
- **[Storage Architecture](technical/storage.md)** - Hybrid storage with 6 categories (v0.7.8)
- **[Performance Benchmarks](technical/performance-benchmarks.md)** - Performance analysis (<10ms operations)
- **[Test Results Summary](technical/test-results-summary.md)** - Test suite results (100% pass rate - 483/483)

### 📖 User Guides (`/guides`)
End-user documentation and tutorials:

- **[User Guide](guides/user-guide.md)** - Complete guide to using c0ntextKeeper
- **[MCP Guide](guides/mcp-guide.md)** - Natural language search and MCP tools (NEW)
- **[CLI Reference](guides/cli-reference.md)** - Complete CLI command reference
- **[Auto-Load Guide](guides/auto-load-guide.md)** - Automatic context loading feature (v0.7.7)
- **[Migration Guide](guides/migration-guide.md)** - Version migration procedures

### 🛠️ Development Documentation (`/development`)
Internal development guidelines and project context:

- **[Project Context](development/project-context.md)** - **AUTHORITATIVE SOURCE** - Complete technical specifications (Updated for v0.7.8)
- **[CI/CD Guide](development/CI-CD-GUIDE.md)** - **NEW** - Complete CI/CD pipeline, PR workflow, and GitHub Actions documentation
- **[Release Guide](development/RELEASE-GUIDE.md)** - Release procedures and verification
- **[Open Source Release Plan](development/OPEN-SOURCE-RELEASE-PLAN.md)** - Public release documentation

**Claude Code CLI Files** (at project root):
- `CLAUDE.md` - Team-shared Claude Code instructions (auto-detected by Claude Code CLI)
- `CLAUDE.local.md` - Personal Claude Code settings (optional, git-ignored)

### 🚀 API Documentation (`/api`)
API specifications and technical references:

- **[ContextLoader API](api/context-loader.md)** - Auto-load context system API (v0.7.7)
- **[MCP Resources](api/mcp-resources.md)** - MCP resource specifications (v0.7.7)

## 🗺️ Quick Navigation

### For Users
1. Start with the **[User Guide](guides/user-guide.md)** for installation and basic usage
2. Check **[Hook Integration](technical/hook-integration.md)** for setting up automatic context preservation
3. Review **[File Formats](technical/file-formats.md)** to understand archive structure

### For Developers
1. Read **[Project Context](development/project-context.md)** for complete technical overview
2. Follow **[CLAUDE.md](../CLAUDE.md)** at root for Claude Code CLI workflow guidelines
3. Test with **[MCP Testing](technical/mcp-testing.md)** procedures

### For Contributors
1. Review the root [README.md](../README.md) for project overview
2. Check [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
3. Read **[CI/CD Guide](development/CI-CD-GUIDE.md)** for PR workflow and CI pipeline
4. Read **[Project Context](development/project-context.md)** for architecture details

## 📋 Documentation Standards

All documentation in this directory follows these standards:

- **Markdown Format** - All docs use GitHub-flavored markdown
- **Lowercase Filenames** - All files use lowercase with hyphens (e.g., `file-formats.md`)
- **Clear Headers** - Each document starts with a clear H1 title
- **Table of Contents** - Documents over 100 lines include a TOC
- **Code Examples** - Include syntax-highlighted examples where relevant
- **Cross-References** - Use relative links between documents

### 📊 Naming Convention Quick Reference

| Convention | Example | Primary Usage |
|------------|---------|---------------|
| camelCase | `firstName` | JS/TS variables |
| PascalCase | `FirstName` | Classes, components |
| snake_case | `first_name` | Python, Ruby |
| kebab-case | `first-name` | URLs, CSS, files |
| SCREAMING_SNAKE | `FIRST_NAME` | Constants |
| Train-Case | `First-Name` | HTTP headers |
| dot.case | `first.name` | Package names |
| flatcase | `firstname` | Hashtags |

**Note:** See [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md) for complete naming rules by location.

## 🔄 Version Information

- **Documentation Version**: 0.7.8
- **Last Updated**: 2026-01-05
- **Project Version**: 0.7.8

## 📝 Notes

- The **[Project Context](development/project-context.md)** document is the single source of truth for technical specifications
- User-facing documentation is mirrored in the root README.md with links to detailed guides here
- This structure follows modern open-source documentation best practices

---

*For the main project README, see [../README.md](../README.md)*