#!/usr/bin/env node

/**
 * c0ntextKeeper MCP Server
 * Intelligent context preservation and retrieval for Claude Code
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  TextContent,
  Resource,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ContextRetriever } from "../core/retriever.js";
import { ContextArchiver as _ContextArchiver } from "../core/archiver.js";
import { PatternAnalyzer } from "../core/patterns.js";
import { contextLoader } from "../core/context-loader.js";
import { ConfigManager } from "../core/config.js";
import { getProjectName } from "../utils/project-utils.js";
import {
  FetchContextInput as _FetchContextInput,
  SearchArchiveInput as _SearchArchiveInput,
  GetPatternsInput as _GetPatternsInput,
} from "../core/types.js";

// Initialize server
const server = new Server(
  {
    name: "c0ntextkeeper",
    version: "0.7.2",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// Define tool schemas using Zod
const FetchContextSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(5),
  scope: z.enum(["session", "project", "global"]).default("project"),
  timeRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  minRelevance: z.number().min(0).max(1).default(0.3), // Lowered for better natural language matching
});

const SearchArchiveSchema = z.object({
  query: z.string(),
  filePattern: z.string().optional(),
  dateRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  projectPath: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(["relevance", "date", "frequency"]).default("relevance"),
});

const GetPatternsSchema = z.object({
  type: z.enum(["code", "command", "architecture", "all"]).default("all"),
  minFrequency: z.number().min(1).default(2),
  projectPath: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "fetch_context",
    description:
      "Fetch relevant archived context for the current task. Returns previously extracted problems, solutions, and implementations.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query or description of needed context",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 5, max: 100)",
          minimum: 1,
          maximum: 100,
        },
        scope: {
          type: "string",
          enum: ["session", "project", "global"],
          description: "Search scope (default: project)",
        },
        minRelevance: {
          type: "number",
          description: "Minimum relevance score (0-1, default: 0.5)",
          minimum: 0,
          maximum: 1,
        },
      },
    },
  },
  {
    name: "search_archive",
    description:
      "Search through archived context with advanced filters. Find specific implementations, errors, or decisions.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (required)",
        },
        filePattern: {
          type: "string",
          description: 'File pattern to filter (e.g., "*.ts", "src/**/*.js")',
        },
        dateRange: {
          type: "object",
          properties: {
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
          },
          description: "Date range for filtering results",
        },
        limit: {
          type: "number",
          description: "Maximum results (default: 10, max: 100)",
          minimum: 1,
          maximum: 100,
        },
        sortBy: {
          type: "string",
          enum: ["relevance", "date", "frequency"],
          description: "Sort order (default: relevance)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_patterns",
    description:
      "Retrieve recurring patterns from archived sessions. Identifies common solutions and approaches.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["code", "command", "architecture", "all"],
          description: "Pattern type to retrieve (default: all)",
        },
        minFrequency: {
          type: "number",
          description: "Minimum occurrence frequency (default: 2)",
          minimum: 1,
        },
        limit: {
          type: "number",
          description: "Maximum patterns to return (default: 10, max: 50)",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const configManager = new ConfigManager();
  const autoLoadSettings = configManager.getAutoLoadSettings();

  // Only expose resources if auto-load is enabled
  if (!autoLoadSettings.enabled) {
    return { resources: [] };
  }

  const projectName = getProjectName(process.cwd());
  const resources: Resource[] = [
    {
      uri: `context://project/${projectName}/current`,
      name: `${projectName} Project Context`,
      description: `Auto-loaded context for ${projectName} using ${autoLoadSettings.strategy} strategy`,
      mimeType: "text/markdown",
    },
  ];

  // Add additional resources based on configuration
  if (autoLoadSettings.includeTypes.includes("patterns")) {
    resources.push({
      uri: `context://project/${projectName}/patterns`,
      name: "Recurring Patterns",
      description: "Common patterns and solutions from this project",
      mimeType: "text/markdown",
    });
  }

  if (autoLoadSettings.includeTypes.includes("knowledge")) {
    resources.push({
      uri: `context://project/${projectName}/knowledge`,
      name: "Knowledge Base",
      description: "Q&A pairs and learned information",
      mimeType: "text/markdown",
    });
  }

  return { resources };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const projectName = getProjectName(process.cwd());

  try {
    // Main project context
    if (uri === `context://project/${projectName}/current`) {
      const context = await contextLoader.getAutoLoadContext();
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: context.content,
          },
        ],
      };
    }

    // Patterns resource
    if (uri === `context://project/${projectName}/patterns`) {
      const analyzer = new PatternAnalyzer();
      const patterns = await analyzer.getPatterns({
        type: "all",
        minFrequency: 2,
        limit: 10,
      });

      const formatted = formatPatternResults(patterns);
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: `# Recurring Patterns for ${projectName}\n\n${formatted}`,
          },
        ],
      };
    }

    // Knowledge base resource
    if (uri === `context://project/${projectName}/knowledge`) {
      const retriever = new ContextRetriever();
      const knowledge = await retriever.fetchRelevantContext({
        scope: "project",
        limit: 20,
      });

      const formatted = formatContextResults(knowledge);
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: `# Knowledge Base for ${projectName}\n\n${formatted}`,
          },
        ],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Resource read error for ${uri}:`, errorMessage);

    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Error reading resource: ${errorMessage}`,
        },
      ],
    };
  }
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "fetch_context": {
        const input = FetchContextSchema.parse(args);
        const retriever = new ContextRetriever();
        const contexts = await retriever.fetchRelevantContext(input);

        return {
          content: [
            {
              type: "text",
              text: formatContextResults(contexts),
            } as TextContent,
          ],
        };
      }

      case "search_archive": {
        const input = SearchArchiveSchema.parse(args);
        const retriever = new ContextRetriever();
        const results = await retriever.searchArchive(input);

        return {
          content: [
            {
              type: "text",
              text: formatSearchResults(results),
            } as TextContent,
          ],
        };
      }

      case "get_patterns": {
        const input = GetPatternsSchema.parse(args);
        const analyzer = new PatternAnalyzer();
        const patterns = await analyzer.getPatterns(input);

        return {
          content: [
            {
              type: "text",
              text: formatPatternResults(patterns),
            } as TextContent,
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Tool error in ${name}:`, errorMessage);

    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        } as TextContent,
      ],
      isError: true,
    };
  }
});

// Helper function to truncate text
function truncateText(text: string, maxLength: number = 200): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Helper function to format session ID
function formatSessionId(sessionId: string): string {
  if (!sessionId || sessionId === "unknown") {
    return "Session-" + Date.now().toString(36).toUpperCase();
  }
  // If it's a long hash, show first 8 chars
  if (sessionId.length > 12) {
    return sessionId.substring(0, 8) + "...";
  }
  return sessionId;
}

// Format functions for better output
function formatContextResults(contexts: any[]): string {
  if (!contexts || contexts.length === 0) {
    return `No relevant context found for your query.

🔍 Troubleshooting:
- Ensure archives exist at: ~/.c0ntextkeeper/archive/projects/
- Try running: c0ntextkeeper status
- Check if PreCompact hook is enabled
- Archives may be under different project names (case-sensitive)

💡 Tips:
- Use broader search terms
- Remove the query to see all recent contexts
- Try scope: "global" instead of "project"`;
  }

  let output = `Found ${contexts.length} relevant context${contexts.length > 1 ? "s" : ""}:\n\n`;

  contexts.forEach((ctx, index) => {
    const relevanceScore = ctx.metadata?.relevanceScore || ctx.relevance || 0;
    const sessionId = formatSessionId(ctx.sessionId);

    output += `## Context ${index + 1}\n`;
    output += `📊 Relevance: ${(relevanceScore * 100).toFixed(0)}% | Session: ${sessionId}\n`;
    output += `📅 Date: ${new Date(ctx.timestamp).toLocaleString()}\n`;

    // Show project path if available
    if (ctx.projectPath) {
      const projectName = ctx.projectPath.split("/").pop() || "unknown";
      output += `📁 Project: ${projectName}\n`;
    }

    output += `\n`;

    // Show first problem/solution pair with truncation
    if (ctx.problems && ctx.problems.length > 0) {
      const firstProblem = ctx.problems[0];
      output += `### 🎯 Main Problem:\n`;
      output += `${truncateText(firstProblem.question, 300)}\n\n`;

      if (firstProblem.solution) {
        output += `### ✅ Solution:\n`;
        output += `${truncateText(firstProblem.solution.approach, 300)}\n\n`;
      }

      if (ctx.problems.length > 1) {
        output += `*(...and ${ctx.problems.length - 1} more problem${ctx.problems.length > 2 ? "s" : ""})*\n\n`;
      }
    }

    // Show first few implementations with better formatting
    if (ctx.implementations && ctx.implementations.length > 0) {
      output += `### 🛠️ Key Implementations:\n`;
      const maxImpl = Math.min(3, ctx.implementations.length);

      for (let i = 0; i < maxImpl; i++) {
        const impl = ctx.implementations[i];
        output += `- **${impl.tool || "Tool"}**: ${impl.file || "unknown file"}\n`;
        if (impl.description) {
          output += `  ${truncateText(impl.description, 150)}\n`;
        }
      }

      if (ctx.implementations.length > maxImpl) {
        output += `*(...and ${ctx.implementations.length - maxImpl} more)*\n`;
      }
      output += "\n";
    }

    // Show first decision if available
    if (ctx.decisions && ctx.decisions.length > 0) {
      const firstDecision = ctx.decisions[0];
      output += `### 💡 Key Decision:\n`;
      output += `${truncateText(firstDecision.decision, 200)}\n`;

      if (ctx.decisions.length > 1) {
        output += `*(...and ${ctx.decisions.length - 1} more decision${ctx.decisions.length > 2 ? "s" : ""})*\n`;
      }
      output += "\n";
    }

    // Show metadata tags if available
    if (ctx.metadata?.tags && ctx.metadata.tags.length > 0) {
      output += `🏷️ Tags: ${ctx.metadata.tags.join(", ")}\n\n`;
    }

    output += `---\n\n`;
  });

  return output;
}

function formatSearchResults(results: any[]): string {
  if (!results || results.length === 0) {
    return "No results found for your search query.";
  }

  let output = `Found ${results.length} matching result${results.length > 1 ? "s" : ""}:\n\n`;

  results.forEach((result, index) => {
    output += `## Result ${index + 1} (Score: ${(result.relevance * 100).toFixed(0)}%)\n`;
    output += `Project: ${result.context.projectPath}\n`;
    output += `Session: ${result.context.sessionId} | ${result.context.timestamp}\n\n`;

    if (result.matches && result.matches.length > 0) {
      output += `### Matches:\n`;
      result.matches.forEach((match: any) => {
        output += `- **${match.field}**: ${match.snippet}\n`;
      });
      output += "\n";
    }
  });

  return output;
}

function formatPatternResults(patterns: any[]): string {
  if (!patterns || patterns.length === 0) {
    return "No recurring patterns found.";
  }

  let output = `Found ${patterns.length} recurring pattern${patterns.length > 1 ? "s" : ""}:\n\n`;

  patterns.forEach((pattern, index) => {
    output += `## Pattern ${index + 1}: ${pattern.type}\n`;
    output += `**Frequency**: ${pattern.frequency} occurrences\n`;
    output += `**Value**: ${pattern.value}\n`;
    output += `**First seen**: ${pattern.firstSeen}\n`;
    output += `**Last seen**: ${pattern.lastSeen}\n`;

    if (pattern.examples && pattern.examples.length > 0) {
      output += `**Examples**:\n`;
      pattern.examples.slice(0, 3).forEach((ex: string) => {
        output += `- ${ex}\n`;
      });
    }
    output += "\n";
  });

  return output;
}

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("c0ntextKeeper MCP server started successfully");
  } catch (error) {
    console.error("Failed to start c0ntextKeeper server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down c0ntextKeeper server...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down c0ntextKeeper server...");
  await server.close();
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}

export { server };
