# 📚 c0ntextKeeper Documentation

Welcome to the c0ntextKeeper documentation! This directory contains all technical specifications, user guides, and development documentation for the project.

## 📁 Documentation Structure

### 🔧 Technical Documentation (`/technical`)
Core technical specifications and integration guides:

- **[File Formats](technical/file-formats.md)** - Complete specification of all archive file formats
- **[Hook Integration](technical/hook-integration.md)** - Claude Code hook setup and troubleshooting
- **[Hooks Customization](technical/hooks-customization.md)** - Advanced hook configuration options
- **[MCP Activation](technical/mcp-activation.md)** - MCP server activation and setup guide
- **[MCP Testing](technical/mcp-testing.md)** - Comprehensive MCP server testing procedures
- **[MCP Usage](technical/mcp-usage.md)** - Detailed MCP tool usage patterns
- **[Storage Architecture](technical/storage.md)** - Hybrid storage system documentation

### 📖 User Guides (`/guides`)
End-user documentation and tutorials:

- **[User Guide](guides/user-guide.md)** - Complete guide to using c0ntextKeeper
- **[Migration Guide](guides/migration-guide.md)** - Version migration procedures

### 🛠️ Development Documentation (`/development`)
Internal development guidelines and project context:

- **[Project Context](development/project-context.md)** - **AUTHORITATIVE SOURCE** - Complete technical specifications
- **[Public Migration Report](development/public-migration-report.md)** - Open-source migration documentation

**Claude Code CLI Files** (at project root):
- `CLAUDE.md` - Team-shared Claude Code instructions (auto-detected by Claude Code CLI)
- `CLAUDE.local.md` - Personal Claude Code settings (optional, git-ignored)

### 🚀 API Documentation (`/api`)
*Coming soon - API specifications and examples*

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
3. Read **[Project Context](development/project-context.md)** for architecture details

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

- **Documentation Version**: 0.6.0
- **Last Updated**: 2025-09-09
- **Project Version**: 0.6.0

## 📝 Notes

- The **[Project Context](development/project-context.md)** document is the single source of truth for technical specifications
- User-facing documentation is mirrored in the root README.md with links to detailed guides here
- This structure follows modern open-source documentation best practices

---

*For the main project README, see [../README.md](../README.md)*