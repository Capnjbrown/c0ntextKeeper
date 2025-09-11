/**
 * Context Retriever
 * Retrieves and searches archived context
 */

import {
  ExtractedContext,
  FetchContextInput,
  SearchArchiveInput,
  SearchResult,
  Match,
  ProjectIndex,
} from "./types.js";
import { FileStore } from "../storage/file-store.js";
import { RelevanceScorer } from "./scorer.js";
import { Logger } from "../utils/logger.js";

export class ContextRetriever {
  private storage: FileStore;
  private scorer: RelevanceScorer;
  private logger: Logger;

  constructor(storage?: FileStore) {
    this.storage = storage || new FileStore();
    this.scorer = new RelevanceScorer();
    this.logger = new Logger("ContextRetriever");
  }

  /**
   * Fetch relevant context based on query
   */
  async fetchRelevantContext(
    input: FetchContextInput,
  ): Promise<ExtractedContext[]> {
    const {
      query = "",
      limit = 5,
      scope = "project",
      minRelevance = 0.5,
    } = input;

    this.logger.info(
      `Fetching context: query="${query}", scope=${scope}, limit=${limit}`,
    );

    let contexts: ExtractedContext[] = [];

    // Get contexts based on scope
    if (scope === "project") {
      // For project scope, we need the current project path
      // This would typically come from the MCP server context
      const projectPath = process.cwd(); // Default to current directory
      contexts = await this.storage.getProjectContexts(projectPath, limit * 2);
    } else {
      // For global scope, search all contexts
      contexts = await this.storage.searchAll(() => true);
    }

    // Score and filter contexts
    const scoredContexts = contexts.map((context) => ({
      context,
      relevance: this.calculateRelevance(context, query),
    }));

    // Filter by minimum relevance and sort
    const filtered = scoredContexts
      .filter((sc) => sc.relevance >= minRelevance)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    this.logger.info(`Found ${filtered.length} relevant contexts`);

    return filtered.map((sc) => ({
      ...sc.context,
      metadata: {
        ...sc.context.metadata,
        relevanceScore: sc.relevance,
      },
    }));
  }

  /**
   * Search archive with advanced filters
   */
  async searchArchive(input: SearchArchiveInput): Promise<SearchResult[]> {
    const {
      query,
      filePattern,
      dateRange,
      projectPath,
      limit = 10,
      sortBy = "relevance",
    } = input;

    this.logger.info(`Searching archive: query="${query}", sortBy=${sortBy}`);

    // Create search predicate
    const predicate = (context: ExtractedContext): boolean => {
      // Date range filter
      if (dateRange) {
        const contextDate = new Date(context.timestamp);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);

        if (contextDate < fromDate || contextDate > toDate) {
          return false;
        }
      }

      // Project path filter
      if (projectPath && !context.projectPath.includes(projectPath)) {
        return false;
      }

      // File pattern filter
      if (filePattern) {
        const hasMatchingFile = context.metadata.filesModified.some((file) =>
          this.matchesPattern(file, filePattern),
        );
        if (!hasMatchingFile) {
          return false;
        }
      }

      return true;
    };

    // Search all contexts
    const contexts = await this.storage.searchAll(predicate);

    // Find matches within each context
    const results: SearchResult[] = [];

    for (const context of contexts) {
      const matches = this.findMatches(context, query);

      if (matches.length > 0) {
        const relevance = this.calculateSearchRelevance(matches);
        results.push({
          context,
          matches,
          relevance,
        });
      }
    }

    // Sort results
    switch (sortBy) {
      case "date":
        results.sort(
          (a, b) =>
            new Date(b.context.timestamp).getTime() -
            new Date(a.context.timestamp).getTime(),
        );
        break;
      case "frequency":
        results.sort((a, b) => b.matches.length - a.matches.length);
        break;
      case "relevance":
      default:
        results.sort((a, b) => b.relevance - a.relevance);
    }

    return results.slice(0, limit);
  }

  /**
   * Get context by session ID
   */
  async getBySessionId(sessionId: string): Promise<ExtractedContext | null> {
    return await this.storage.getBySessionId(sessionId);
  }

  /**
   * Get project index information
   */
  async getProjectIndex(projectPath: string): Promise<ProjectIndex | null> {
    return await this.storage.getProjectIndex(projectPath);
  }

  /**
   * Get recent contexts across all projects
   */
  async getRecentContexts(limit = 10): Promise<ExtractedContext[]> {
    const contexts = await this.storage.searchAll(() => true);

    return contexts
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  // Private helper methods

  /**
   * Calculate relevance of a context to a query
   */
  private calculateRelevance(context: ExtractedContext, query: string): number {
    if (!query) {
      // If no query, use the context's own relevance score
      return context.metadata.relevanceScore;
    }

    const queryLower = query.toLowerCase();
    let score = 0;
    let matchCount = 0;

    // Check problems
    for (const problem of context.problems) {
      if (problem.question.toLowerCase().includes(queryLower)) {
        score += 0.3;
        matchCount++;
      }
      if (problem.solution?.approach.toLowerCase().includes(queryLower)) {
        score += 0.2;
        matchCount++;
      }
    }

    // Check implementations
    for (const impl of context.implementations) {
      if (impl.description.toLowerCase().includes(queryLower)) {
        score += 0.2;
        matchCount++;
      }
      if (impl.file.toLowerCase().includes(queryLower)) {
        score += 0.1;
        matchCount++;
      }
    }

    // Check decisions
    for (const decision of context.decisions) {
      if (decision.decision.toLowerCase().includes(queryLower)) {
        score += 0.2;
        matchCount++;
      }
      if (decision.context.toLowerCase().includes(queryLower)) {
        score += 0.1;
        matchCount++;
      }
    }

    // Check patterns
    for (const pattern of context.patterns) {
      if (pattern.value.toLowerCase().includes(queryLower)) {
        score += 0.1;
        matchCount++;
      }
    }

    // Apply temporal decay
    const age = Date.now() - new Date(context.timestamp).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    const temporalFactor = Math.exp(-daysSinceCreated / 30); // 30-day half-life

    // Combine scores
    const baseScore = Math.min(score, 1);
    const frequencyBoost = Math.min(matchCount * 0.05, 0.3);

    return (baseScore + frequencyBoost) * temporalFactor;
  }

  /**
   * Find matches within a context
   */
  private findMatches(context: ExtractedContext, query: string): Match[] {
    const matches: Match[] = [];
    
    // Handle undefined or empty query
    if (!query) {
      return matches;
    }
    
    const queryLower = query.toLowerCase();

    // Search in problems
    for (const problem of context.problems) {
      if (problem.question.toLowerCase().includes(queryLower)) {
        matches.push({
          field: "problem.question",
          snippet: this.extractSnippet(problem.question, queryLower),
          score: 0.8,
        });
      }
      if (problem.solution?.approach.toLowerCase().includes(queryLower)) {
        matches.push({
          field: "problem.solution",
          snippet: this.extractSnippet(problem.solution.approach, queryLower),
          score: 0.7,
        });
      }
    }

    // Search in implementations
    for (const impl of context.implementations) {
      if (impl.description.toLowerCase().includes(queryLower)) {
        matches.push({
          field: "implementation.description",
          snippet: this.extractSnippet(impl.description, queryLower),
          score: 0.6,
        });
      }
    }

    // Search in decisions
    for (const decision of context.decisions) {
      if (decision.decision.toLowerCase().includes(queryLower)) {
        matches.push({
          field: "decision",
          snippet: this.extractSnippet(decision.decision, queryLower),
          score: 0.7,
        });
      }
    }

    // Search in patterns
    for (const pattern of context.patterns) {
      if (pattern.value.toLowerCase().includes(queryLower)) {
        matches.push({
          field: "pattern",
          snippet: this.extractSnippet(pattern.value, queryLower),
          score: 0.5,
        });
      }
    }

    return matches;
  }

  /**
   * Extract snippet around match
   */
  private extractSnippet(text: string, query: string): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, 100);

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);

    let snippet = text.slice(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";

    return snippet;
  }

  /**
   * Calculate search relevance from matches
   */
  private calculateSearchRelevance(matches: Match[]): number {
    if (matches.length === 0) return 0;

    const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
    const avgScore = totalScore / matches.length;
    const frequencyBoost = Math.min(matches.length * 0.1, 0.3);

    return Math.min(avgScore + frequencyBoost, 1);
  }

  /**
   * Check if file matches pattern
   */
  private matchesPattern(file: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".")
      .replace(/\//g, "\\/");

    const regex = new RegExp(regexPattern, "i");
    return regex.test(file);
  }
}
