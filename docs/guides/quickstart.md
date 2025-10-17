# Quick Start Guide

> **Get c0ntextKeeper running in 60 seconds**

## What You Get

After installation, c0ntextKeeper will **automatically**:
- ✅ Preserve context before every compaction (manual or automatic)
- ✅ Extract problems, solutions, implementations, and decisions
- ✅ Build a searchable knowledge base
- ✅ Auto-load relevant context at session start
- ✅ Filter sensitive data (API keys, secrets, tokens)
- ✅ Generate analytics dashboards

**Zero ongoing configuration required!**

---

## Installation (30 seconds)

```bash
npm install -g c0ntextkeeper
```

Wait for post-install script to complete (creates `~/.c0ntextkeeper/` directory).

---

## Setup (30 seconds)

```bash
c0ntextkeeper setup
```

This configures the **PreCompact hook** in Claude Code. That's it!

---

## Verification (Optional)

Check everything is working:

```bash
c0ntextkeeper status
```

You should see:
```
✅ ENABLED - Fully Automatic!
🔄 Triggers on:
   • Manual /compact command
   • Automatic compaction by Claude Code
```

---

## What Happens Next

### 1. **During Your Claude Code Session**

Every time Claude Code compacts your conversation (manually via `/compact` or automatically):
- c0ntextKeeper captures the transcript
- Extracts valuable context using 187 semantic patterns
- Stores it in `~/.c0ntextkeeper/archive/projects/[your-project]/`

### 2. **At Session Start**

c0ntextKeeper automatically loads relevant context via MCP resources:
- Recent sessions from this project
- Top patterns you've used
- Key decisions made
- Q&A knowledge base

Claude Code gains instant project awareness!

### 3. **When You Search**

```bash
c0ntextkeeper search "authentication error"
```

Get instant results from all past sessions, sorted by relevance.

---

## First Archive

To create your first archive:

1. Open any project in Claude Code
2. Have a conversation (ask questions, write code, solve problems)
3. Run `/compact` in Claude Code
4. c0ntextKeeper automatically preserves everything!

Check your archives:
```bash
c0ntextkeeper stats
```

---

## Optional Enhancements

Want even more capture coverage? Enable additional hooks:

```bash
# Capture every user question
c0ntextkeeper hooks enable userpromptsubmit

# Track ALL tool usage patterns
c0ntextkeeper hooks enable posttooluse

# Build Q&A knowledge base
c0ntextkeeper hooks enable stop
```

**Note**: PreCompact hook alone provides 80% of the value. These are optional!

---

## Common Questions

**Q: Where is my data stored?**
A: `~/.c0ntextkeeper/archive/projects/[project-name]/`

**Q: Does this slow down Claude Code?**
A: No! All operations complete in <10ms. Hooks have 55-second timeout with 5-second buffer.

**Q: What if I don't want a session archived?**
A: Simply don't run `/compact` - nothing is captured without compaction.

**Q: Can I customize what's captured?**
A: Yes! See [CONFIGURATION.md](./CONFIGURATION.md) for all options.

**Q: How do I use the archived context?**
A: It auto-loads at session start via MCP resources. You can also use CLI commands or MCP tools.

---

## Next Steps

- **See all features**: [FEATURES.md](./FEATURES.md)
- **Understand hooks**: [HOOKS.md](./HOOKS.md)
- **Learn MCP tools**: [MCP-TOOLS.md](./MCP-TOOLS.md)
- **Real-world examples**: [USE-CASES.md](./USE-CASES.md)
- **Configure settings**: [CONFIGURATION.md](./CONFIGURATION.md)

---

## Troubleshooting

**Hook not triggering?**
```bash
c0ntextkeeper validate
```

**Want detailed diagnostics?**
```bash
c0ntextkeeper doctor
```

**Test hooks manually?**
```bash
c0ntextkeeper hooks test precompact
```

---

**You're all set!** c0ntextKeeper is now preserving your context automatically. 🎉
