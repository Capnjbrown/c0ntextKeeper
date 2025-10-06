/**
 * Context Loader Module for c0ntextKeeper
 *
 * Intelligently prepares and loads relevant context for MCP server startup
 */

import * as path from "path";
import * as fs from "fs";
import { getStoragePath } from "../utils/path-resolver.js";
import { ConfigManager, AutoLoadSettings } from "./config.js";
import { ContextRetriever } from "./retriever.js";
import { PatternAnalyzer } from "./patterns.js";
import { ExtractedContext, Pattern } from "./types.js";
import { getProjectName } from "../utils/project-utils.js";
// Note: formatFileSize and formatDuration removed - unused in implementation

export interface LoadedContext {
  content: string;
  sizeKB: number;
  itemCount: number;
  strategy: string;
  timestamp: string;
}

export class ContextLoader {
  private config: AutoLoadSettings;
  private retriever: ContextRetriever;
  private patternAnalyzer: PatternAnalyzer;
  private storagePath: string;

  constructor() {
    const configManager = new ConfigManager();
    this.config = configManager.getAutoLoadSettings();
    this.storagePath = getStoragePath();
    this.retriever = new ContextRetriever();
    this.patternAnalyzer = new PatternAnalyzer();
  }

  /**
   * Get auto-loaded context based on configuration
   */
  async getAutoLoadContext(): Promise<LoadedContext> {
    if (!this.config.enabled) {
      return {
        content: "",
        sizeKB: 0,
        itemCount: 0,
        strategy: "disabled",
        timestamp: new Date().toISOString(),
      };
    }

    let content = "";
    let itemCount = 0;

    switch (this.config.strategy) {
      case "smart":
        const smartResult = await this.loadSmartContext();
        content = smartResult.content;
        itemCount = smartResult.itemCount;
        break;
      case "recent":
        const recentResult = await this.loadRecentContext();
        content = recentResult.content;
        itemCount = recentResult.itemCount;
        break;
      case "relevant":
        const relevantResult = await this.loadRelevantContext();
        content = relevantResult.content;
        itemCount = relevantResult.itemCount;
        break;
      case "custom":
        const customResult = await this.loadCustomContext();
        content = customResult.content;
        itemCount = customResult.itemCount;
        break;
    }

    // Enforce size limit
    const maxBytes = this.config.maxSizeKB * 1024;
    if (Buffer.byteLength(content, "utf8") > maxBytes) {
      content = this.truncateToSize(content, maxBytes);
    }

    return {
      content,
      sizeKB: Buffer.byteLength(content, "utf8") / 1024,
      itemCount,
      strategy: this.config.strategy,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Smart loading strategy - combines recent, patterns, and knowledge
   */
  private async loadSmartContext(): Promise<{
    content: string;
    itemCount: number;
  }> {
    const projectName = getProjectName(process.cwd());
    const sections: string[] = [];
    let itemCount = 0;

    // Header
    sections.push(`# Project Context: ${projectName}`);
    sections.push(
      `*Auto-loaded by c0ntextKeeper on ${new Date().toLocaleString()}*\n`,
    );

    // Recent Sessions
    if (this.config.includeTypes.includes("sessions")) {
      const sessions = await this.loadRecentSessions();
      if (sessions.content) {
        sections.push("## Recent Work\n");
        sections.push(sessions.content);
        itemCount += sessions.itemCount;
      }
    }

    // Top Patterns
    if (this.config.includeTypes.includes("patterns")) {
      const patterns = await this.loadTopPatterns();
      if (patterns.content) {
        sections.push("\n## Recurring Patterns\n");
        sections.push(patterns.content);
        itemCount += patterns.itemCount;
      }
    }

    // Knowledge Base
    if (this.config.includeTypes.includes("knowledge")) {
      const knowledge = await this.loadKnowledgeBase();
      if (knowledge.content) {
        sections.push("\n## Knowledge Base\n");
        sections.push(knowledge.content);
        itemCount += knowledge.itemCount;
      }
    }

    // Recent Prompts
    if (this.config.includeTypes.includes("prompts")) {
      const prompts = await this.loadRecentPrompts();
      if (prompts.content) {
        sections.push("\n## Recent Questions\n");
        sections.push(prompts.content);
        itemCount += prompts.itemCount;
      }
    }

    return {
      content: sections.join("\n"),
      itemCount,
    };
  }

  /**
   * Load recent sessions with key insights
   */
  private async loadRecentSessions(): Promise<{
    content: string;
    itemCount: number;
  }> {
    const projectPath = path.join(
      this.storagePath,
      "archive",
      "projects",
      getProjectName(process.cwd()),
      "sessions",
    );

    if (!fs.existsSync(projectPath)) {
      return { content: "", itemCount: 0 };
    }

    const files = fs
      .readdirSync(projectPath)
      .filter((f) => f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a)) // Most recent first
      .slice(0, this.config.sessionCount);

    const sections: string[] = [];
    let itemCount = 0;

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const session = JSON.parse(content);

        if (session.summary && session.context) {
          const sessionDate = file
            .replace(".json", "")
            .split("_")
            .slice(0, 2)
            .join(" ");

          if (this.config.formatStyle === "summary") {
            sections.push(`### Session: ${sessionDate}`);

            // Top problems
            const problems = session.context.problems?.slice(0, 2) || [];
            if (problems.length > 0) {
              sections.push("**Key Problems:**");
              problems.forEach((p: any) => {
                const question = this.truncateText(p.question, 800);
                sections.push(`- ${question}`);
                if (p.solution) {
                  const solution = this.truncateText(p.solution.approach, 1000);
                  sections.push(`  → ${solution}`);
                }
              });
            }

            // Key implementations
            const implementations =
              session.context.implementations?.slice(0, 2) || [];
            if (implementations.length > 0) {
              sections.push("**Key Actions:**");
              implementations.forEach((impl: any) => {
                const desc = this.truncateText(impl.description, 500);
                sections.push(`- ${impl.tool}: ${desc}`);
              });
            }

            itemCount += problems.length + implementations.length;
          } else if (this.config.formatStyle === "detailed") {
            // More detailed format
            sections.push(`### Session: ${sessionDate}`);
            sections.push(
              `- Files Modified: ${session.summary.filesModified || 0}`,
            );
            sections.push(
              `- Tools Used: ${session.summary.uniqueTools?.join(", ") || "N/A"}`,
            );

            // Include more context
            if (session.context.problems?.length > 0) {
              sections.push("**Problems & Solutions:**");
              session.context.problems.slice(0, 3).forEach((p: any) => {
                sections.push(`- Q: ${this.truncateText(p.question, 800)}`);
                if (p.solution) {
                  sections.push(
                    `  A: ${this.truncateText(p.solution.approach, 1000)}`,
                  );
                }
              });
            }

            itemCount += session.context.problems?.length || 0;
          }

          sections.push(""); // Empty line between sessions
        }
      } catch (error) {
        console.error(`Error loading session ${file}:`, error);
      }
    }

    return {
      content: sections.join("\n"),
      itemCount,
    };
  }

  /**
   * Load top recurring patterns
   */
  private async loadTopPatterns(): Promise<{
    content: string;
    itemCount: number;
  }> {
    const patterns = await this.patternAnalyzer.getPatterns({
      type: "all",
      minFrequency: 2,
      limit: this.config.patternCount,
    });

    if (!patterns || patterns.length === 0) {
      return { content: "", itemCount: 0 };
    }

    const sections: string[] = [];

    patterns.forEach((pattern: Pattern) => {
      if (this.config.formatStyle === "summary") {
        sections.push(
          `- **${pattern.type}** (${pattern.frequency}x): \`${this.truncateText(pattern.value, 400)}\``,
        );
        if ((pattern as any).description) {
          sections.push(
            `  ${this.truncateText((pattern as any).description, 400)}`,
          );
        }
      } else if (this.config.formatStyle === "detailed") {
        sections.push(`### ${pattern.type} Pattern`);
        sections.push(`- **Pattern**: \`${pattern.value}\``);
        sections.push(`- **Frequency**: ${pattern.frequency} occurrences`);
        if ((pattern as any).description) {
          sections.push(`- **Description**: ${(pattern as any).description}`);
        }
        if ((pattern as any).lastUsed) {
          sections.push(
            `- **Last Used**: ${new Date((pattern as any).lastUsed).toLocaleDateString()}`,
          );
        }
        sections.push("");
      }
    });

    return {
      content: sections.join("\n"),
      itemCount: patterns.length,
    };
  }

  /**
   * Load knowledge base (Q&A pairs)
   */
  private async loadKnowledgeBase(): Promise<{
    content: string;
    itemCount: number;
  }> {
    const knowledgePath = path.join(
      this.storagePath,
      "archive",
      "projects",
      getProjectName(process.cwd()),
      "knowledge",
    );

    if (!fs.existsSync(knowledgePath)) {
      return { content: "", itemCount: 0 };
    }

    const files = fs
      .readdirSync(knowledgePath)
      .filter((f) => f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 1); // Get most recent knowledge file

    const sections: string[] = [];
    let itemCount = 0;

    for (const file of files) {
      const filePath = path.join(knowledgePath, file);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const entries = JSON.parse(content);

        if (Array.isArray(entries)) {
          const recentEntries = entries.slice(0, this.config.knowledgeCount);

          recentEntries.forEach((entry: any) => {
            if (this.config.formatStyle === "summary") {
              sections.push(`- Q: ${this.truncateText(entry.question, 800)}`);
              sections.push(`  A: ${this.truncateText(entry.answer, 1000)}`);
            } else if (this.config.formatStyle === "detailed") {
              sections.push(`**Q:** ${entry.question}`);
              sections.push(`**A:** ${this.truncateText(entry.answer, 1000)}`);
              sections.push("");
            }
            itemCount++;
          });
        }
      } catch (error) {
        console.error(`Error loading knowledge ${file}:`, error);
      }
    }

    return {
      content: sections.join("\n"),
      itemCount,
    };
  }

  /**
   * Load recent user prompts
   */
  private async loadRecentPrompts(): Promise<{
    content: string;
    itemCount: number;
  }> {
    const promptsPath = path.join(
      this.storagePath,
      "archive",
      "projects",
      getProjectName(process.cwd()),
      "prompts",
    );

    if (!fs.existsSync(promptsPath)) {
      return { content: "", itemCount: 0 };
    }

    const files = fs
      .readdirSync(promptsPath)
      .filter((f) => f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 1); // Get most recent prompts file

    const sections: string[] = [];
    let itemCount = 0;

    for (const file of files) {
      const filePath = path.join(promptsPath, file);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const entries = JSON.parse(content);

        if (Array.isArray(entries)) {
          const recentPrompts = entries.slice(0, this.config.promptCount);

          recentPrompts.forEach((entry: any) => {
            sections.push(
              `- ${this.truncateText(entry.prompt || entry.content, 800)}`,
            );
            itemCount++;
          });
        }
      } catch (error) {
        console.error(`Error loading prompts ${file}:`, error);
      }
    }

    return {
      content: sections.join("\n"),
      itemCount,
    };
  }

  /**
   * Load recent context only
   */
  private async loadRecentContext(): Promise<{
    content: string;
    itemCount: number;
  }> {
    // Focus only on recent sessions
    const oldIncludeTypes = this.config.includeTypes;
    this.config.includeTypes = ["sessions"];
    const result = await this.loadSmartContext();
    this.config.includeTypes = oldIncludeTypes;
    return result;
  }

  /**
   * Load relevant context based on keywords
   */
  private async loadRelevantContext(): Promise<{
    content: string;
    itemCount: number;
  }> {
    const contexts = await this.retriever.fetchRelevantContext({
      query: this.config.priorityKeywords.join(" "),
      limit: 20,
      scope: "project",
      minRelevance: 0.6,
    });

    if (!contexts || contexts.length === 0) {
      // Fall back to smart strategy if no relevant context found
      return this.loadSmartContext();
    }

    const sections: string[] = [
      `# Relevant Context for: ${this.config.priorityKeywords.join(", ")}\n`,
    ];

    contexts.forEach((ctx: ExtractedContext) => {
      if (ctx.problems && ctx.problems.length > 0) {
        sections.push("## Problems & Solutions");
        ctx.problems.forEach((p) => {
          sections.push(`- ${this.truncateText(p.question, 800)}`);
          if (p.solution) {
            sections.push(`  → ${this.truncateText(p.solution.approach, 1000)}`);
          }
        });
      }
    });

    return {
      content: sections.join("\n"),
      itemCount: contexts.length,
    };
  }

  /**
   * Load custom context based on user configuration
   */
  private async loadCustomContext(): Promise<{
    content: string;
    itemCount: number;
  }> {
    // For now, use smart strategy as base
    // Users can extend this with custom logic
    return this.loadSmartContext();
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  /**
   * Truncate content to fit within size limit
   */
  private truncateToSize(content: string, maxBytes: number): string {
    const buffer = Buffer.from(content, "utf8");
    if (buffer.length <= maxBytes) return content;

    // Find a good truncation point
    let truncated = buffer.slice(0, maxBytes).toString("utf8");

    // Try to end at a line break
    const lastNewline = truncated.lastIndexOf("\n");
    if (lastNewline > maxBytes * 0.8) {
      truncated = truncated.substring(0, lastNewline);
    }

    return truncated + "\n\n*[Context truncated to fit size limit]*";
  }

  /**
   * Preview what will be auto-loaded (for CLI testing)
   */
  async previewAutoLoad(): Promise<string> {
    const context = await this.getAutoLoadContext();

    const preview = [
      "=".repeat(60),
      "AUTO-LOAD CONTEXT PREVIEW",
      "=".repeat(60),
      `Strategy: ${context.strategy}`,
      `Size: ${context.sizeKB.toFixed(2)} KB`,
      `Items: ${context.itemCount}`,
      `Generated: ${new Date(context.timestamp).toLocaleString()}`,
      "-".repeat(60),
      "",
      context.content,
      "",
      "=".repeat(60),
    ];

    return preview.join("\n");
  }
}

// Export singleton instance
export const contextLoader = new ContextLoader();
