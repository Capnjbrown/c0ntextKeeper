# c0ntextKeeper - Project Context Summary

## Executive Overview

**c0ntextKeeper** is an open-source MCP (Model Context Protocol) server designed to solve Claude Code's critical context loss problem during compaction. When Claude Code runs `/compact`, valuable implementation details, decision rationale, and discovered solutions are lost forever. c0ntextKeeper automatically preserves this high-value context and makes it retrievable for future sessions, creating a persistent knowledge layer that makes Claude Code smarter over time.

**Project Identity**:
- **Name**: c0ntextKeeper (stylized with zero)
- **Domain**: c0ntextkeeper.com
- **GitHub**: github.com/YOUR_USERNAME/c0ntextKeeper
- **npm Package**: c0ntextkeeper
- **License**: MIT (open source with monetization strategy)

---

## The Problem We're Solving

### Current State Pain Points
1. **Context Amnesia**: Every `/compact` operation creates lossy summaries, discarding valuable details
2. **Repeated Problem Solving**: Developers solve the same issues multiple times
3. **Lost Decision History**: Architectural decisions and their rationale vanish
4. **No Knowledge Accumulation**: Each session starts fresh without learning from past work
5. **Manual Memory Management**: Developers resort to copy-pasting into CLAUDE.md files

### Why This Matters
- Engineers using Claude Code report context loss as the #1 frustration
- Complex debugging sessions lose critical discoveries
- Team knowledge isn't captured or shareable
- Token budget is wasted re-explaining context

---

## Our Solution Architecture

### Core Innovation
Unlike static memory files (CLAUDE.md) or simple logging tools, c0ntextKeeper:
- **Dynamically captures** actual implementation context during preCompact
- **Intelligently extracts** problems, solutions, decisions, and patterns
- **Preserves high-fidelity** information about what worked and what didn't
- **Provides instant retrieval** through MCP tools during future sessions
- **Builds knowledge graphs** that grow smarter over time

### Technical Architecture

```
┌─────────────────┐
│  Claude Code    │
│    Session      │
├─────────────────┤
│   /compact      │ ──triggers──> PreCompact Hook
└─────────────────┘                      │
                                         ▼
                              ┌──────────────────┐
                              │  c0ntextKeeper   │
                              │   Extraction     │
                              └──────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
            Extract Problems     Extract Patterns     Extract Decisions
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         ▼
                              ┌──────────────────┐
                              │  Archive Storage │
                              │ ~/.c0ntextkeeper │
                              └──────────────────┘
                                         │
                              ┌──────────────────┐
                              │   MCP Tools      │
                              ├──────────────────┤
                              │ • fetch_context  │
                              │ • search_archive │
                              │ • get_patterns   │
                              └──────────────────┘
```

### Key Components

1. **Hook System Integration**
   - Captures full transcript before compaction via PreCompact hook
   - Non-blocking async processing to avoid slowing Claude Code
   - Automatic trigger without user intervention

2. **Intelligent Extraction Engine**
   - Multi-factor relevance scoring (0.0-1.0)
   - Pattern recognition for recurring operations
   - Problem-solution mapping
   - Decision and rationale extraction
   - Code change tracking with context

3. **Structured Storage System**
   - File-based JSON storage initially (simple, portable)
   - Hierarchical organization by project and session
   - Searchable indices for fast retrieval
   - Progressive summarization for old contexts
   - Future: Vector DB for semantic search

4. **MCP Tool Suite**
   - `fetch_context`: Retrieve relevant archived context
   - `search_archive`: Search with filters and patterns
   - `get_patterns`: Identify recurring solutions
   - `analyze_decisions`: Review past architectural choices

---

## Why TypeScript Was Chosen

### Technical Rationale
1. **Native JSON handling** - Claude's JSONL format works perfectly with JS/TS
2. **MCP SDK first-class support** - Official SDK is TypeScript-first
3. **Complex type safety** - Nested context structures need compile-time guarantees
4. **Stream processing** - Node.js excels at processing JSONL streams
5. **VS Code extension path** - Future extension must be TypeScript
6. **npm ecosystem** - Simple distribution and installation
7. **Developer alignment** - Target audience already uses Node.js

### Rejected Alternatives
- **Python**: Dynamic typing risky for complex JSON, distribution harder
- **Go**: Verbose JSON handling, no official MCP SDK
- **Rust**: Overkill for I/O-bound operations, tiny contributor pool

---

## Implementation Roadmap

### Phase 0: Foundation (Week 1) ✅
- Proof of concept script (COMPLETE)
- Basic extraction logic (COMPLETE)
- Hook integration design (COMPLETE)

### Phase 1: MVP (Current)
- TypeScript project setup
- Basic MCP server with tools
- Core extraction engine
- File-based storage
- Installation automation

### Phase 2: Intelligence (Week 2)
- Relevance scoring algorithm
- Pattern recognition
- Decision extraction
- Smart summarization

### Phase 3: Search (Week 3)
- Full-text search
- Temporal filtering
- File pattern matching
- Context ranking

### Phase 4: Polish (Week 4)
- Comprehensive documentation
- VS Code extension
- Team sharing features
- Analytics dashboard

---

## Business Model & Monetization

### Open Source Strategy
- **Core**: MIT licensed, fully open source
- **Adoption**: Free tier drives widespread usage
- **Trust**: Developers can inspect and modify code
- **Community**: Contributors improve the product

### Revenue Streams

#### c0ntextKeeper Pro ($10/month)
- Cloud sync across machines
- Advanced AI-powered search
- VS Code extension pro features
- Priority support

#### c0ntextKeeper Team ($25/user/month)
- Shared team knowledge base
- Collaborative patterns library
- Admin controls and analytics
- Slack/Discord integration

#### c0ntextKeeper Enterprise (Custom)
- Self-hosted deployment
- SSO/SAML authentication
- SLA guarantees
- Custom integrations

### Market Opportunity
- 100k+ Claude Code users (rapidly growing)
- 10% conversion = 10k potential customers
- Average $20/month = $200k MRR potential
- Enterprise deals could 5x this

---

## Critical Implementation Details

### Relevance Scoring Algorithm
```typescript
// High-value indicators (0.8-1.0)
- Code modifications (Write, Edit, MultiEdit tools)
- Error resolutions
- Architectural decisions

// Medium-value (0.4-0.7)
- Problem statements
- File reads and explorations
- Command executions

// Low-value (0.0-0.3)
- Simple queries
- Navigation commands
- Routine operations
```

### Storage Structure
```
~/.c0ntextkeeper/
├── archive/
│   ├── [project-hash]/
│   │   ├── sessions/
│   │   │   └── 2024-01-15-[session-id].json
│   │   ├── patterns.json
│   │   ├── decisions.json
│   │   └── index.json
│   └── global/
│       └── cross-project-patterns.json
├── config.json
└── analytics.json
```

### Context Extraction Example
```json
{
  "sessionId": "abc-123",
  "timestamp": "2024-01-15T10:30:00Z",
  "problems": [{
    "question": "How to fix authentication error?",
    "solution": {
      "approach": "Updated JWT validation logic",
      "files": ["auth.ts", "middleware.ts"],
      "successful": true
    }
  }],
  "patterns": [{
    "type": "error-handling",
    "value": "try-catch with specific error types",
    "frequency": 3
  }],
  "decisions": [{
    "decision": "Use Redis for session storage",
    "rationale": "Better performance than database",
    "impact": "high"
  }]
}
```

---

## Unique Value Propositions

### For Individual Developers
- Never solve the same problem twice
- Build personal knowledge base over time
- Instant context retrieval
- Learn from past decisions

### for Teams
- Shared context across developers
- Onboarding acceleration with team knowledge
- Pattern library from collective experience
- Reduced duplicate problem-solving

### Competitive Advantages
1. **First-mover** in Claude Code context preservation
2. **Deep integration** via MCP and hooks
3. **Intelligent extraction** not just logging
4. **Open source trust** with monetization path
5. **c0ntextKeeper brand** - unique and memorable

---

## Success Metrics

### Technical Goals
- Extract >90% of valuable context
- <100ms retrieval time
- 10:1 compression ratio
- Zero performance impact on Claude Code

### Business Goals
- Week 1: 50 beta users
- Month 1: 1,000 npm downloads
- Month 3: 100 paying customers
- Month 6: $10k MRR

### Community Goals
- 100+ GitHub stars in first month
- 10+ contributors by month 3
- Active Discord with 500+ members
- Weekly blog posts about development

---

## Key Insights & Decisions

### Why This Will Succeed
1. **Solves Universal Pain**: Every Claude Code user faces context loss
2. **Natural Integration**: MCP + hooks = seamless experience
3. **Immediate Value**: Even basic version provides utility
4. **Network Effects**: More usage = better patterns = more value
5. **Clear Monetization**: Natural premium features for teams

### Strategic Decisions Made
1. **Name**: c0ntextKeeper (unique, memorable, available)
2. **Language**: TypeScript (ecosystem fit, type safety)
3. **License**: MIT (maximum adoption)
4. **Storage**: Start file-based, add vector later
5. **Distribution**: npm + GitHub + website

### Risk Mitigation
- **Technical**: Start simple, iterate based on usage
- **Adoption**: Free open-source core ensures users
- **Competition**: First-mover advantage + brand ownership
- **Sustainability**: Clear monetization path from day 1

---

## Current Status & Next Steps

### Completed ✅
- Problem validation and solution design
- Proof of concept implementation
- Technical architecture planning
- Branding and domain secured
- Business model defined

### Immediate Next Steps (Today)
1. Create GitHub repository
2. Initialize TypeScript project
3. Set up testing infrastructure
4. Convert POC to TypeScript modules
5. Implement basic MCP server

### This Week's Goals
- Working MVP with basic extraction
- MCP tools accessible from Claude Code
- Documentation and README
- Beta testing with 5-10 users
- First GitHub release

---

## Summary for Claude Code

You're building **c0ntextKeeper**, an MCP server that preserves valuable context during Claude Code's compaction. The core innovation is intelligent extraction and retrieval of problems, solutions, decisions, and patterns that would otherwise be lost. Using TypeScript, MCP SDK, and hooks, you'll create a seamless integration that makes Claude Code progressively smarter. The project is open source (MIT) with a clear monetization path through premium features. The immediate goal is an MVP that extracts context during preCompact and provides retrieval tools, with the long-term vision of becoming the standard context management solution for Claude Code users worldwide.