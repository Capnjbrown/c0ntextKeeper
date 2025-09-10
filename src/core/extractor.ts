/**
 * Context Extraction Engine
 * Analyzes transcripts to extract valuable context
 */

import {
  TranscriptEntry,
  ExtractedContext,
  Problem,
  Solution,
  Implementation,
  Decision,
  Pattern,
  CodeChange,
} from "./types.js";
import { RelevanceScorer } from "./scorer.js";
import { SecurityFilter } from "../utils/security-filter.js";
import crypto from "crypto";

export class ContextExtractor {
  private scorer: RelevanceScorer;
  private securityFilter: SecurityFilter;
  private relevanceThreshold: number;
  private maxContextItems: number;
  private enableSecurityFilter: boolean;
  private contentLimits: {
    question: number;
    solution: number;
    implementation: number;
    decision: number;
  };

  constructor(
    relevanceThreshold = 0.5,
    maxContextItems = 50,
    enableSecurityFilter = true,
    contentLimits = {
      question: 2000,
      solution: 2000,
      implementation: 1000,
      decision: 500,
    },
  ) {
    this.scorer = new RelevanceScorer();
    this.securityFilter = new SecurityFilter();
    this.relevanceThreshold = relevanceThreshold;
    this.maxContextItems = maxContextItems;
    this.enableSecurityFilter = enableSecurityFilter;
    this.contentLimits = contentLimits;
  }

  /**
   * Extract context from transcript entries
   * @param entries - Transcript entries to process
   * @param projectPath - Optional project path override (from hook input)
   */
  extract(entries: TranscriptEntry[], projectPath?: string): ExtractedContext {
    if (!entries || entries.length === 0) {
      throw new Error("No transcript entries provided");
    }

    // Debug logging
    if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
      console.log(`[Extractor] Processing ${entries.length} entries`);
      const typeCounts = entries.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log("[Extractor] Entry types:", typeCounts);
    }

    // Ensure proper timestamp ordering for duration calculation
    const timestamps = entries.map(e => new Date(e.timestamp).getTime());
    const startTime = Math.min(...timestamps);
    const endTime = Math.max(...timestamps);

    let context: ExtractedContext = {
      sessionId: entries[0]?.sessionId || this.generateSessionId(),
      projectPath: projectPath || this.extractProjectPath(entries),
      timestamp: new Date().toISOString(),
      extractedAt: "preCompact",
      problems: [],
      implementations: [],
      decisions: [],
      patterns: [],
      metadata: {
        entryCount: entries.length,
        duration: Math.abs(endTime - startTime),
        toolsUsed: [],
        toolCounts: {},
        filesModified: [],
        relevanceScore: 0,
        extractionVersion: "0.7.0", // Auto-load context feature with MCP resources
      },
    };

    // Extract different types of context
    context.problems = this.extractProblems(entries);
    context.implementations = this.extractImplementations(entries);
    context.decisions = this.extractDecisions(entries);
    context.patterns = this.identifyPatterns(entries);

    // Update metadata
    context.metadata.toolsUsed = this.getUniqueTools(entries);
    context.metadata.toolCounts = this.getToolCounts(entries);
    context.metadata.filesModified = this.getModifiedFiles(entries);
    context.metadata.relevanceScore = this.calculateOverallRelevance(context);

    // Debug logging
    if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
      console.log(`[Extractor] Extraction results:`);
      console.log(`  - Problems: ${context.problems.length}`);
      console.log(`  - Implementations: ${context.implementations.length}`);
      console.log(`  - Decisions: ${context.decisions.length}`);
      console.log(`  - Patterns: ${context.patterns.length}`);
      console.log(`  - Tools used: ${context.metadata.toolsUsed.join(", ")}`);
      console.log(`  - Files modified: ${context.metadata.filesModified.length}`);
    }

    // Limit items to maxContextItems
    context.problems = context.problems.slice(0, this.maxContextItems);
    context.implementations = context.implementations.slice(
      0,
      this.maxContextItems,
    );
    context.decisions = context.decisions.slice(0, this.maxContextItems);
    context.patterns = context.patterns.slice(0, this.maxContextItems);

    // Apply security filtering if enabled
    if (this.enableSecurityFilter) {
      context = this.securityFilter.filterObject(context);

      // Add security stats to metadata
      const securityStats = this.securityFilter.getStats();
      (context.metadata as any).securityFiltered = true;
      (context.metadata as any).redactedCount = securityStats.redactedCount;
    }

    return context;
  }

  /**
   * Extract problems and their solutions from transcript
   */
  private extractProblems(entries: TranscriptEntry[]): Problem[] {
    const problems: Problem[] = [];
    let currentProblem: Problem | null = null;
    let potentialSolution: Solution | null = null;

    if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
      console.log(`[extractProblems] Processing ${entries.length} entries`);
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const relevance = this.scorer.scoreEntry(entry);

      if (process.env.C0NTEXTKEEPER_DEBUG === "true" && entry.type === "user") {
        console.log(`[extractProblems] User entry: relevance=${relevance}, threshold=${this.relevanceThreshold}`);
      }

      if (relevance < this.relevanceThreshold) {
        if (process.env.C0NTEXTKEEPER_DEBUG === "true" && entry.type === "user") {
          console.log(`[extractProblems] Skipping user entry due to low relevance`);
        }
        continue;
      }

      // Detect problem indicators in user messages
      if (entry.type === "user" && entry.message?.content) {
        const rawContent = entry.message.content;
        // Normalize content to string for processing
        const content = typeof rawContent === "string" 
          ? rawContent 
          : Array.isArray(rawContent) 
            ? rawContent.map(item => item.text || '').join(' ')
            : JSON.stringify(rawContent);
        const isProblem = this.isProblemIndicator(content);
        
        if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
          console.log(`[extractProblems] User message: "${content.substring(0, 50)}..."`);
          console.log(`[extractProblems] isProblemIndicator: ${isProblem}`);
        }
        
        if (isProblem) {
          currentProblem = {
            id: this.generateId(),
            question: content.slice(0, this.contentLimits.question),
            timestamp: entry.timestamp,
            tags: this.extractTags(content),
            relevance: relevance,
          };
          
          if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
            console.log(`[extractProblems] Created problem: ${currentProblem.question.substring(0, 50)}...`);
          }
        }
      }

      // Look for ANY tool usage as a potential solution
      if (currentProblem && entry.type === "tool_use" && entry.toolUse) {
        const toolName = entry.toolUse.name || "unknown";
        const file =
          entry.toolUse.input?.file_path ||
          entry.toolUse.input?.path ||
          entry.toolUse.input?.uri ||
          entry.toolUse.input?.notebook_path ||
          "";

        potentialSolution = {
          approach: `Used ${toolName} tool`,
          files: file ? [file] : [],
          successful: true,
        };
      }

      // Check tool results for success/failure
      if (potentialSolution && (entry.type === "tool_result" || entry.toolResult)) {
        if (entry.toolResult?.error) {
          potentialSolution.successful = false;
        }
      }

      // Look for assistant explanations as solutions
      if (
        currentProblem &&
        entry.type === "assistant" &&
        entry.message?.content
      ) {
        const rawContent = entry.message.content;
        // Normalize content to string for processing
        const content = typeof rawContent === "string" 
          ? rawContent 
          : Array.isArray(rawContent)
            ? rawContent.map(item => item.text || '').join(' ')
            : JSON.stringify(rawContent);

        // If we have a potential solution from tool use, enhance it
        if (potentialSolution) {
          potentialSolution.approach = content.slice(0, this.contentLimits.solution);
          currentProblem.solution = potentialSolution;
        } else if (this.isSolutionIndicator(content)) {
          currentProblem.solution = {
            approach: content.slice(0, this.contentLimits.solution),
            files: [],
            successful: true,
          };
        }

        if (currentProblem.solution) {
          problems.push(currentProblem);
          currentProblem = null;
          potentialSolution = null;
        }
      }
    }

    // Add unsolved problems
    if (currentProblem) {
      problems.push(currentProblem);
    }

    return problems.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Extract code implementations
   */
  private extractImplementations(entries: TranscriptEntry[]): Implementation[] {
    const implementations: Implementation[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (entry.type === "tool_use" && entry.toolUse) {
        const toolName = entry.toolUse.name;

        // Track ALL tools as potential implementations
        {
          // Extract file path from various tool inputs
          let file =
            entry.toolUse.input?.file_path ||
            entry.toolUse.input?.path ||
            entry.toolUse.input?.notebook_path ||
            "";
          
          // For Bash commands, try to extract cwd or use project path
          if (toolName === "Bash" && !file) {
            file = entry.cwd || entry.toolUse.input?.cwd || "bash_session";
          }
          
          // For TodoWrite, use a descriptive placeholder
          if (toolName === "TodoWrite" && !file) {
            file = "todo_management";
          }
          
          // Default to tool name if still no file
          if (!file) {
            file = toolName.toLowerCase();
          }

          // Look for description in previous assistant message
          let description = "";
          if (i > 0 && entries[i - 1].type === "assistant") {
            const prevContent = entries[i - 1].message?.content || "";
            const prevContentStr =
              typeof prevContent === "string"
                ? prevContent
                : JSON.stringify(prevContent);
            description = prevContentStr.slice(0, this.contentLimits.implementation);
          }

          const implementation: Implementation = {
            id: this.generateId(),
            tool: toolName,
            file: file,
            description: description,
            timestamp: entry.timestamp,
            relevance: this.scorer.scoreEntry(entry),
            changes: this.extractCodeChanges(entry),
          };

          implementations.push(implementation);
        }
      }
    }

    return implementations.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Extract architectural decisions
   */
  private extractDecisions(entries: TranscriptEntry[]): Decision[] {
    const decisions: Decision[] = [];
    const decisionPatterns = [
      /we should (\w+.*)/gi,
      /better to (\w+.*)/gi,
      /i recommend (\w+.*)/gi,
      /the approach is to (\w+.*)/gi,
      /decided to (\w+.*)/gi,
      /going with (\w+.*)/gi,
      /choosing (\w+.*)/gi,
    ];

    for (const entry of entries) {
      if (entry.type === "assistant" && entry.message?.content) {
        const content = entry.message.content;
        const contentStr =
          typeof content === "string" ? content : JSON.stringify(content);

        for (const pattern of decisionPatterns) {
          const matches = contentStr.matchAll(pattern);
          for (const match of matches) {
            const contextStart = Math.max(0, match.index! - 100);
            const contextEnd = Math.min(
              contentStr.length,
              match.index! + match[0].length + 100,
            );

            decisions.push({
              id: this.generateId(),
              decision: match[0],
              context: contentStr.slice(contextStart, contextEnd),
              rationale: this.extractRationale(contentStr, match.index!),
              timestamp: entry.timestamp,
              impact: this.assessImpact(match[0]),
              tags: this.extractTags(match[0]),
            });
          }
        }
      }
    }

    return decisions;
  }

  /**
   * Identify recurring patterns
   */
  private identifyPatterns(entries: TranscriptEntry[]): Pattern[] {
    const patternMap = new Map<string, Pattern>();

    for (const entry of entries) {
      // Command patterns
      if (entry.type === "tool_use" && entry.toolUse?.name === "Bash") {
        const command = entry.toolUse.input?.command;
        if (command && !this.isTrivialCommand(command)) {
          const key = `cmd:${this.normalizeCommand(command)}`;
          this.updatePattern(
            patternMap,
            key,
            "command",
            command,
            entry.timestamp,
          );
        }
      }

      // Code patterns (looking for repeated operations)
      if (
        entry.type === "tool_use" &&
        ["Write", "Edit"].includes(entry.toolUse?.name || "")
      ) {
        const operation = `${entry.toolUse?.name}:${entry.toolUse?.input?.file_path}`;
        this.updatePattern(
          patternMap,
          operation,
          "code",
          operation,
          entry.timestamp,
        );
      }

      // Error handling patterns
      if (entry.toolResult?.error) {
        const errorType = this.classifyError(entry.toolResult.error);
        if (errorType) {
          this.updatePattern(
            patternMap,
            `error:${errorType}`,
            "error-handling",
            errorType,
            entry.timestamp,
          );
        }
      }
    }

    return Array.from(patternMap.values())
      .filter((p) => p.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency);
  }

  // Helper methods

  private isProblemIndicator(content: string): boolean {
    // Much more flexible - any user question or request is a potential problem
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    const lowerContent = contentStr.toLowerCase();

    // Comprehensive problem indicators for Claude Code conversations
    const problemIndicators = [
      // Error-related
      "error", "issue", "problem", "bug", "crash", "exception",
      "failed", "failing", "broken", "wrong", "incorrect",
      "undefined", "null", "nan", "invalid", "missing",
      "timeout", "404", "500", "503", "cors",
      
      // Debugging
      "debug", "fix", "solve", "troubleshoot", "diagnose",
      "not working", "doesn't work", "won't work", "stopped working",
      
      // Questions
      "why", "how do", "how can", "how to", "how should",
      "what is", "what are", "what should", "what would",
      "where is", "where are", "where do", "where should",
      "when should", "when do", "when to",
      "which", "who", "whose",
      
      // Common dev tasks
      "implement", "create", "build", "develop", "add",
      "integrate", "setup", "configure", "install",
      "migrate", "upgrade", "update", "refactor",
      "optimize", "improve", "enhance", "extend",
      
      // Architecture & design
      "design", "architect", "structure", "organize",
      "pattern", "approach", "strategy", "best practice",
      
      // Testing & deployment
      "test", "deploy", "publish", "release", "launch",
      "ci/cd", "pipeline", "workflow", "automation",
      
      // Documentation & understanding
      "explain", "understand", "clarify", "document",
      "confused", "unclear", "stuck", "lost",
      
      // Security & performance
      "secure", "vulnerability", "authentication", "authorization",
      "performance", "slow", "optimize", "memory leak",
      
      // Data & API
      "database", "api", "endpoint", "query", "fetch",
      "store", "retrieve", "parse", "transform",
      
      // UI/UX
      "display", "render", "style", "layout", "responsive",
      "accessibility", "user experience", "interface"
    ];

    // Request indicators (user is asking for help)
    const requestIndicators = [
      // Polite requests
      "can you", "could you", "would you", "will you",
      "please", "kindly", "help me", "assist me",
      
      // Direct requests
      "i need", "i want", "i'd like", "i would like",
      "i'm trying", "i'm attempting", "i'm looking",
      
      // Imperative requests
      "show me", "tell me", "teach me", "guide me",
      "walk me through", "explain to me",
      
      // Planning requests
      "let's", "we should", "we need to", "we must",
      "shall we", "should we",
      
      // Seeking advice
      "recommend", "suggest", "advise", "propose",
      "what's the best", "which is better",
      
      // Common dev requests
      "prepare", "convert", "transform", "translate",
      "extract", "analyze", "review", "check"
    ];

    // Questions always indicate problems to solve
    if (contentStr.includes("?")) return true;

    // Check for problem or request indicators
    return (
      problemIndicators.some((ind) => lowerContent.includes(ind)) ||
      requestIndicators.some((ind) => lowerContent.includes(ind))
    );
  }

  private isSolutionIndicator(content: string): boolean {
    // More flexible - any assistant response with action words is a potential solution
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    const lowerContent = contentStr.toLowerCase();

    const indicators = [
      "here's how",
      "the solution",
      "to fix this",
      "this works",
      "resolved",
      "solved",
      "the answer",
      "you can",
      "let me",
      "i'll",
      "i will",
      "i'm going to",
      "let's",
      "we can",
      "we should",
      "try",
      "use",
      "add",
      "change",
      "update",
      "modify",
      "create",
      "implement",
    ];

    // Any response with code blocks is likely a solution
    if (contentStr.includes("```")) return true;

    return indicators.some((ind) => lowerContent.includes(ind));
  }

  private extractTags(content: string | any): string[] {
    const tags: string[] = [];
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    const techPatterns =
      /\b(react|typescript|javascript|node|python|api|database|css|html|json|yaml|docker|kubernetes|aws|git)\b/gi;
    const matches = contentStr.match(techPatterns);
    if (matches) {
      tags.push(...matches.map((m) => m.toLowerCase()));
    }
    return [...new Set(tags)];
  }

  private extractProjectPath(entries: TranscriptEntry[]): string {
    // Try to find the most common cwd or the first non-generic one
    const cwdCounts = new Map<string, number>();
    let firstCwd = "";

    for (const entry of entries) {
      if (entry.cwd) {
        if (!firstCwd) firstCwd = entry.cwd;
        cwdCounts.set(entry.cwd, (cwdCounts.get(entry.cwd) || 0) + 1);
      }
    }

    // If no cwd found at all
    if (cwdCounts.size === 0) {
      // DO NOT use process.cwd() as it's unreliable for npm packages
      // process.cwd() might return the package installation directory
      // instead of the user's actual project directory
      
      // Try to infer from tool uses (Write/Edit commands often have paths)
      for (const entry of entries) {
        if (entry.toolUse?.name === "Write" || entry.toolUse?.name === "Edit") {
          const input = entry.toolUse.input as any;
          if (input?.file_path) {
            // Extract project root from file path
            const filePath = input.file_path as string;
            if (filePath.includes("/")) {
              const parts = filePath.split("/");
              // Look for common project indicators
              const projectIndicators = [
                "src",
                "lib",
                "app",
                "components",
                "pages",
                "api",
              ];
              for (let i = 0; i < parts.length; i++) {
                if (projectIndicators.includes(parts[i]) && i > 0) {
                  // Return path up to the project indicator
                  return "/" + parts.slice(0, i).join("/");
                }
              }
            }
          }
        }
      }
      // Last resort: return a placeholder
      // The project_path from hook input should prevent this
      return "unknown-project";
    }

    // Find the most frequently used cwd
    let mostCommon = firstCwd;
    let maxCount = 0;

    for (const [cwd, count] of cwdCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = cwd;
      }
    }

    return mostCommon;
  }

  private getUniqueTools(entries: TranscriptEntry[]): string[] {
    const tools = new Set<string>();
    for (const entry of entries) {
      if (entry.type === "tool_use" && entry.toolUse?.name) {
        tools.add(entry.toolUse.name);
      }
    }
    return Array.from(tools);
  }

  private getToolCounts(entries: TranscriptEntry[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.type === "tool_use" && entry.toolUse?.name) {
        const toolName = entry.toolUse.name;
        counts[toolName] = (counts[toolName] || 0) + 1;
      }
    }
    return counts;
  }

  private getModifiedFiles(entries: TranscriptEntry[]): string[] {
    const files = new Set<string>();
    for (const entry of entries) {
      if (entry.type === "tool_use" && entry.toolUse) {
        const file =
          entry.toolUse.input?.file_path ||
          entry.toolUse.input?.path ||
          entry.toolUse.input?.notebook_path;
        if (
          file &&
          ["Write", "Edit", "MultiEdit"].includes(entry.toolUse.name)
        ) {
          files.add(file);
        }
      }
    }
    return Array.from(files);
  }

  private extractCodeChanges(entry: TranscriptEntry): CodeChange[] | undefined {
    if (!entry.toolUse?.input) return undefined;

    const changes: CodeChange[] = [];
    const input = entry.toolUse.input;

    if (entry.toolUse.name === "Edit" || entry.toolUse.name === "MultiEdit") {
      // For edits, we can track what was changed
      changes.push({
        type: "modification",
        lineStart: 0,
        lineEnd: 0,
        content: input.new_string || input.new_content || "",
      });
    } else if (entry.toolUse.name === "Write") {
      changes.push({
        type: "addition",
        lineStart: 0,
        lineEnd: 0,
        content: input.content || "",
      });
    }

    return changes.length > 0 ? changes : undefined;
  }

  private extractRationale(content: string, position: number): string {
    const reasonIndicators = ["because", "since", "as", "due to", "for"];
    const contextWindow = 200;
    const searchArea = content.slice(position, position + contextWindow);

    for (const indicator of reasonIndicators) {
      const idx = searchArea.toLowerCase().indexOf(indicator);
      if (idx !== -1) {
        return searchArea.slice(idx, Math.min(idx + 100, searchArea.length));
      }
    }

    return "";
  }

  private assessImpact(decision: string): "high" | "medium" | "low" {
    const highImpact = [
      "architecture",
      "database",
      "api",
      "security",
      "framework",
    ];
    const mediumImpact = ["refactor", "optimize", "structure", "design"];

    const lowerDecision = decision.toLowerCase();

    if (highImpact.some((term) => lowerDecision.includes(term))) return "high";
    if (mediumImpact.some((term) => lowerDecision.includes(term)))
      return "medium";
    return "low";
  }

  private normalizeCommand(command: string): string {
    // Remove specific paths and parameters to identify pattern
    return command
      .replace(/\/[^\s]+/g, "<path>")
      .replace(/\d+/g, "<number>")
      .slice(0, 50);
  }

  private isTrivialCommand(command: string): boolean {
    const trivialCommands = ["ls", "pwd", "cd", "echo", "cat"];
    const firstWord = command.split(" ")[0];
    return trivialCommands.includes(firstWord);
  }

  private classifyError(error: string): string | null {
    if (error.includes("permission")) return "permission";
    if (error.includes("not found")) return "not-found";
    if (error.includes("syntax")) return "syntax";
    if (error.includes("type")) return "type-error";
    if (error.includes("undefined") || error.includes("null"))
      return "null-reference";
    return null;
  }

  private updatePattern(
    patternMap: Map<string, Pattern>,
    key: string,
    type: Pattern["type"],
    value: string,
    timestamp: string,
  ): void {
    const existing = patternMap.get(key);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = timestamp;
      if (!existing.examples.includes(value)) {
        existing.examples.push(value);
      }
    } else {
      patternMap.set(key, {
        id: this.generateId(),
        type,
        value: key,
        frequency: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        examples: [value],
      });
    }
  }

  private calculateOverallRelevance(context: ExtractedContext): number {
    const weights = {
      problems: 0.3,
      implementations: 0.3,
      decisions: 0.2,
      patterns: 0.2,
    };

    let score = 0;
    score += Math.min(context.problems.length / 10, 1) * weights.problems;
    score +=
      Math.min(context.implementations.length / 10, 1) *
      weights.implementations;
    score += Math.min(context.decisions.length / 5, 1) * weights.decisions;
    score += Math.min(context.patterns.length / 5, 1) * weights.patterns;

    return Math.min(score, 1);
  }

  private generateId(): string {
    return crypto.randomBytes(8).toString("hex");
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }
}
