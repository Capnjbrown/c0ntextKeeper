# Technical Framework & Development Instructions

## Quick Start Guide

### Step 1: Test the POC (15 minutes)

```bash
# 1. Create hooks directory
mkdir -p ~/.claude/hooks

# 2. Copy the POC script
cp context-keeper-poc.js ~/.claude/hooks/

# 3. Make it executable
chmod +x ~/.claude/hooks/context-keeper-poc.js

# 4. Configure Claude Code to use the hook
claude settings set hooks.PreCompact '[{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "node /Users/YOUR_USERNAME/.claude/hooks/context-keeper-poc.js"
  }]
}]'

# 5. Test with Claude Code
cd ~/any-project
claude --no-tools  # Start a session
# Do some work, make changes
# Type: /compact
# Check ~/.claude/context-archive/ for archived context
```

### Step 2: Create Development Repository (30 minutes)

```bash
# 1. Create and setup project
mkdir -p ~/projects/mcp-context-keeper
cd ~/projects/mcp-context-keeper
git init

# 2. Create initial structure
cat > package.json << 'EOF'
{
  "name": "claude-context-keeper",
  "version": "0.1.0",
  "description": "Intelligent context preservation for Claude Code",
  "main": "dist/index.js",
  "bin": {
    "context-keeper": "dist/cli.js",
    "context-keeper-server": "dist/server/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/server/index.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'"
  },
  "keywords": ["claude", "mcp", "context", "ai", "development"],
  "author": "",
  "license": "MIT"
}
EOF

# 3. Install dependencies
npm install @modelcontextprotocol/sdk zod
npm install --save-dev typescript @types/node tsx
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 4. Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# 5. Create source directories
mkdir -p src/{server,hooks,core,storage,tools,utils}
mkdir -p tests/{unit,integration,fixtures}
mkdir -p docs scripts examples
```

### Step 3: Implement Core MCP Server (2 hours)

Create `src/server/index.ts`:

```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ContextRetriever } from '../core/retriever.js';
import { ContextArchiver } from '../core/archiver.js';

// Initialize server
const server = new Server(
  {
    name: 'context-keeper',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const TOOLS: Tool[] = [
  {
    name: 'fetch_context',
    description: 'Fetch relevant archived context for the current task',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or description of needed context',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
          default: 5,
        },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Search scope (default: project)',
          default: 'project',
        },
      },
    },
  },
  {
    name: 'search_archive',
    description: 'Search through archived context with filters',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        filePattern: {
          type: 'string',
          description: 'File pattern to filter (e.g., "*.ts")',
        },
        dateRange: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' },
          },
        },
      },
      required: ['query'],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const retriever = new ContextRetriever();
  
  switch (request.params.name) {
    case 'fetch_context': {
      const { query, limit, scope } = request.params.arguments as any;
      const contexts = await retriever.fetchRelevantContext({
        query,
        limit: limit || 5,
        scope: scope || 'project',
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(contexts, null, 2),
          },
        ],
      };
    }
    
    case 'search_archive': {
      const { query, filePattern, dateRange } = request.params.arguments as any;
      const results = await retriever.searchArchive({
        query,
        filePattern,
        dateRange,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Context Keeper MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

### Step 4: Core Implementation Structure

Create the following core files:

#### `src/core/types.ts` - Type Definitions
```typescript
export interface TranscriptEntry {
  type: 'user' | 'assistant' | 'tool_use' | 'system';
  timestamp: string;
  sessionId: string;
  message?: {
    role: string;
    content: string;
  };
  toolUse?: {
    name: string;
    input: any;
  };
}

export interface ExtractedContext {
  sessionId: string;
  projectPath: string;
  timestamp: string;
  problems: Problem[];
  implementations: Implementation[];
  decisions: Decision[];
  patterns: Pattern[];
  metadata: Metadata;
}

export interface Problem {
  question: string;
  timestamp: string;
  solution?: Solution;
  tags: string[];
}

export interface Implementation {
  tool: string;
  file: string;
  description: string;
  timestamp: string;
  changes?: CodeChange[];
}

export interface Decision {
  decision: string;
  context: string;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Pattern {
  type: 'code' | 'command' | 'architecture';
  value: string;
  frequency: number;
  lastSeen: string;
}
```

#### `src/core/extractor.ts` - Context Extraction
```typescript
import { TranscriptEntry, ExtractedContext } from './types.js';

export class ContextExtractor {
  private relevanceThreshold = 0.5;
  
  extract(entries: TranscriptEntry[]): ExtractedContext {
    const context: ExtractedContext = {
      sessionId: entries[0]?.sessionId || 'unknown',
      projectPath: this.extractProjectPath(entries),
      timestamp: new Date().toISOString(),
      problems: [],
      implementations: [],
      decisions: [],
      patterns: [],
      metadata: this.generateMetadata(entries),
    };
    
    // Extract problems and solutions
    context.problems = this.extractProblems(entries);
    
    // Extract code implementations
    context.implementations = this.extractImplementations(entries);
    
    // Extract architectural decisions
    context.decisions = this.extractDecisions(entries);
    
    // Identify patterns
    context.patterns = this.identifyPatterns(entries);
    
    return context;
  }
  
  private extractProblems(entries: TranscriptEntry[]): Problem[] {
    const problems: Problem[] = [];
    let currentProblem: Problem | null = null;
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      if (entry.type === 'user' && entry.message?.content) {
        const content = entry.message.content.toLowerCase();
        if (this.isProblemIndicator(content)) {
          currentProblem = {
            question: entry.message.content,
            timestamp: entry.timestamp,
            tags: this.extractTags(content),
          };
        }
      }
      
      // Look for solutions in subsequent assistant responses
      if (currentProblem && entry.type === 'assistant') {
        currentProblem.solution = {
          approach: entry.message?.content.slice(0, 500) || '',
          successful: true,
        };
        problems.push(currentProblem);
        currentProblem = null;
      }
    }
    
    return problems;
  }
  
  private isProblemIndicator(content: string): boolean {
    const indicators = ['error', 'issue', 'problem', 'fix', 'debug', 'why', 'how to'];
    return indicators.some(ind => content.includes(ind));
  }
  
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    // Extract technology tags
    const techPatterns = /\b(react|typescript|node|python|api|database|css)\b/gi;
    const matches = content.match(techPatterns);
    if (matches) tags.push(...matches.map(m => m.toLowerCase()));
    return [...new Set(tags)];
  }
  
  // Additional extraction methods...
  private extractImplementations(entries: TranscriptEntry[]): Implementation[] {
    // Implementation extraction logic
    return [];
  }
  
  private extractDecisions(entries: TranscriptEntry[]): Decision[] {
    // Decision extraction logic
    return [];
  }
  
  private identifyPatterns(entries: TranscriptEntry[]): Pattern[] {
    // Pattern identification logic
    return [];
  }
  
  private extractProjectPath(entries: TranscriptEntry[]): string {
    // Extract from first entry with cwd
    return 'unknown';
  }
  
  private generateMetadata(entries: TranscriptEntry[]): any {
    return {
      entryCount: entries.length,
      duration: this.calculateDuration(entries),
      toolsUsed: this.getUniqueTools(entries),
    };
  }
}
```

### Step 5: Testing Setup

#### Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

#### Create First Test `tests/unit/extractor.test.ts`:
```typescript
import { ContextExtractor } from '../../src/core/extractor';
import { TranscriptEntry } from '../../src/core/types';

describe('ContextExtractor', () => {
  let extractor: ContextExtractor;
  
  beforeEach(() => {
    extractor = new ContextExtractor();
  });
  
  test('should extract problems from user messages', () => {
    const entries: TranscriptEntry[] = [
      {
        type: 'user',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test-session',
        message: {
          role: 'user',
          content: 'I have an error with the authentication system',
        },
      },
      {
        type: 'assistant',
        timestamp: '2024-01-01T00:00:01Z',
        sessionId: 'test-session',
        message: {
          role: 'assistant',
          content: 'Let me help you fix the authentication error...',
        },
      },
    ];
    
    const context = extractor.extract(entries);
    
    expect(context.problems).toHaveLength(1);
    expect(context.problems[0].question).toContain('authentication');
    expect(context.problems[0].solution).toBeDefined();
  });
});
```

### Step 6: Local Development Workflow

#### Development Commands:
```bash
# Start development server with hot reload
npm run dev

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Test MCP server locally
node dist/server/index.js

# Test with Claude Code
claude mcp add context-keeper-dev \
  --scope project \
  -- node $(pwd)/dist/server/index.js

# View logs
tail -f ~/.claude/context-keeper.log
```

#### Testing with Claude Code:
```bash
# 1. In one terminal, watch and rebuild
npm run dev

# 2. In another terminal, test with Claude
cd ~/test-project
claude

# 3. Work normally, then trigger compact
/compact

# 4. Check archived context
ls ~/.claude/context-archive/

# 5. Test retrieval
# Ask Claude: "Use the context_keeper tools to find previous solutions"
```

### Step 7: Iteration Checklist

#### Daily Development Tasks:
- [ ] Write tests for new features
- [ ] Implement feature code
- [ ] Update documentation
- [ ] Test with real Claude sessions
- [ ] Commit with descriptive message

#### Weekly Milestones:
- [ ] Week 1: POC working, basic MCP server
- [ ] Week 2: Smart extraction, tool implementation
- [ ] Week 3: Search capabilities, storage optimization
- [ ] Week 4: Polish, documentation, beta release

#### For Each Feature:
1. **Design**: Write interface/types first
2. **Test**: Write failing test
3. **Implement**: Make test pass
4. **Document**: Update README/docs
5. **Integrate**: Test with Claude Code
6. **Refactor**: Clean up code
7. **Ship**: Merge to main

### Step 8: Debugging & Troubleshooting

#### Common Issues and Solutions:

```bash
# Issue: MCP server not connecting
# Solution: Check server is executable
chmod +x dist/server/index.js

# Issue: Hooks not firing
# Solution: Verify hook configuration
claude settings get hooks

# Issue: Context not being archived
# Solution: Check permissions and paths
ls -la ~/.claude/context-archive/

# Issue: Tools not showing in Claude
# Solution: Restart Claude Code and check MCP status
claude mcp list
```

#### Debug Mode:
```typescript
// Add to your code for debugging
if (process.env.DEBUG) {
  console.error('[DEBUG]', 'Processing entry:', entry);
}

// Run with debug mode
DEBUG=true node dist/server/index.js
```

### Step 9: Publishing & Distribution

#### Prepare for NPM:
```bash
# 1. Update package.json
npm version patch  # or minor/major

# 2. Build and test
npm run build
npm test

# 3. Test locally
npm pack
npm install -g ./claude-context-keeper-*.tgz

# 4. Publish
npm publish

# 5. Create GitHub release
git tag v0.1.0
git push origin v0.1.0
```

#### Installation Instructions for Users:
```bash
# One-line install
npx claude-context-keeper install

# Or manual setup
npm install -g claude-context-keeper
claude mcp add context-keeper -- context-keeper-server
context-keeper setup-hooks
```

### Step 10: Community & Documentation

#### Essential Documentation:
```markdown
# README.md structure
- Banner image/logo
- One-line description
- Key features (bullet points)
- Quick install (copy-paste command)
- Usage examples (with GIFs)
- Configuration options
- Troubleshooting
- Contributing guidelines
- License
```

#### Create Examples:
```bash
# examples/basic-usage/
- README.md
- .claude/settings.json
- sample-session.jsonl
- expected-output.json

# examples/team-setup/
- README.md
- team-config.json
- sync-setup.md

# examples/custom-extractors/
- README.md
- custom-extractor.ts
- integration-guide.md
```

---

## Success Criteria Checklist

### MVP Launch (Week 2):
- [ ] Basic context extraction works
- [ ] MCP server connects to Claude Code
- [ ] fetch_context tool returns results
- [ ] Installation process documented
- [ ] 5+ beta testers using it

### Beta Release (Week 4):
- [ ] Smart extraction with relevance scoring
- [ ] Search functionality works
- [ ] 90%+ test coverage
- [ ] Documentation complete
- [ ] 50+ GitHub stars

### Production Release (Month 2):
- [ ] Vector search integrated
- [ ] Team sharing features
- [ ] VS Code extension
- [ ] 500+ npm downloads
- [ ] Active Discord community

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm test -- --watch           # Test watch mode
npm run build                 # Build for production

# Testing with Claude
claude mcp add context-keeper-dev --scope project -- node $(pwd)/dist/server/index.js
claude --no-tools             # Start test session
/compact                      # Trigger archival
/mcp                         # Check MCP status

# Debugging
export DEBUG=true            # Enable debug logs
tail -f ~/.claude/*.log      # Watch Claude logs
node --inspect dist/server/index.js  # Node debugger

# Publishing
npm version patch            # Bump version
npm publish                  # Publish to npm
git push --tags             # Push version tags
```

---

## Need Help?

1. **Stuck on implementation?** 
   - Check the examples/ directory
   - Review test files for patterns
   - Ask in GitHub Discussions

2. **MCP not working?**
   - Run `claude mcp list` to check status
   - Verify `~/.claude/mcp.json` configuration
   - Check server logs in `~/.claude/`

3. **Tests failing?**
   - Run single test: `npm test -- extractor.test.ts`
   - Check fixtures in `tests/fixtures/`
   - Verify mock data matches types

Remember: Start simple, iterate quickly, test everything!