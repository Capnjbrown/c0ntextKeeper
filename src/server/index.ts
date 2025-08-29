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
  Tool,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ContextRetriever } from "../core/retriever.js";
import { ContextArchiver as _ContextArchiver } from "../core/archiver.js";
import { PatternAnalyzer } from "../core/patterns.js";
import {
  FetchContextInput as _FetchContextInput,
  SearchArchiveInput as _SearchArchiveInput,
  GetPatternsInput as _GetPatternsInput,
} from "../core/types.js";

// Initialize server
const server = new Server(
  {
    name: "c0ntextkeeper",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
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
  minRelevance: z.number().min(0).max(1).default(0.5),
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

// Format functions for better output
function formatContextResults(contexts: any[]): string {
  if (!contexts || contexts.length === 0) {
    return "No relevant context found for your query.";
  }

  let output = `Found ${contexts.length} relevant context${contexts.length > 1 ? "s" : ""}:\n\n`;

  contexts.forEach((ctx, index) => {
    output += `## Context ${index + 1} (Relevance: ${(ctx.relevance * 100).toFixed(0)}%)\n`;
    output += `Session: ${ctx.sessionId} | ${ctx.timestamp}\n\n`;

    if (ctx.problems && ctx.problems.length > 0) {
      output += `### Problems & Solutions:\n`;
      ctx.problems.forEach((p: any) => {
        output += `- **Problem**: ${p.question}\n`;
        if (p.solution) {
          output += `  **Solution**: ${p.solution.approach}\n`;
        }
      });
      output += "\n";
    }

    if (ctx.implementations && ctx.implementations.length > 0) {
      output += `### Implementations:\n`;
      ctx.implementations.forEach((impl: any) => {
        output += `- **${impl.tool}** on ${impl.file}\n`;
        if (impl.description) {
          output += `  ${impl.description}\n`;
        }
      });
      output += "\n";
    }

    if (ctx.decisions && ctx.decisions.length > 0) {
      output += `### Decisions:\n`;
      ctx.decisions.forEach((d: any) => {
        output += `- **${d.decision}** (Impact: ${d.impact})\n`;
        if (d.rationale) {
          output += `  Rationale: ${d.rationale}\n`;
        }
      });
      output += "\n";
    }
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
