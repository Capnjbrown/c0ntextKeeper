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
      minRelevance = 0.3, // Lowered from 0.5 for better natural language matching
    } = input;

    this.logger.info(
      `Fetching context: query="${query}", scope=${scope}, limit=${limit}`,
    );

    let contexts: ExtractedContext[] = [];

    // Get contexts based on scope
    if (scope === "project") {
      // For project scope, try multiple possible project paths
      const possiblePaths = [
        process.cwd(),
        process.env.PWD || process.cwd(),
        "/Users/jasonbrown/Projects/c0ntextKeeper", // Fallback to known project
        "/Users/jasonbrown/projects/c0ntextkeeper", // Case variation
      ];

      // Try each path until we find contexts
      for (const projectPath of possiblePaths) {
        contexts = await this.storage.getProjectContexts(
          projectPath,
          limit * 2,
        );
        if (contexts.length > 0) {
          this.logger.info(`Found contexts using project path: ${projectPath}`);
          break;
        }
      }

      // If still no contexts, try global search as fallback
      if (contexts.length === 0) {
        this.logger.info(
          "No project contexts found, falling back to global search",
        );
        contexts = await this.storage.searchAll(() => true);
      }
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

    // Tokenize query into individual words for better matching
    const queryWords = this.tokenizeQuery(query);
    let score = 0;
    let matchCount = 0;

    // Check problems
    for (const problem of context.problems) {
      const problemLower = problem.question.toLowerCase();
      const matchScore = this.calculateWordMatchScore(problemLower, queryWords);
      if (matchScore > 0) {
        score += 0.3 * matchScore;
        matchCount++;
      }

      if (problem.solution?.approach) {
        const solutionLower = problem.solution.approach.toLowerCase();
        const solutionScore = this.calculateWordMatchScore(
          solutionLower,
          queryWords,
        );
        if (solutionScore > 0) {
          score += 0.2 * solutionScore;
          matchCount++;
        }
      }
    }

    // Check implementations
    for (const impl of context.implementations) {
      const descLower = impl.description.toLowerCase();
      const descScore = this.calculateWordMatchScore(descLower, queryWords);
      if (descScore > 0) {
        score += 0.2 * descScore;
        matchCount++;
      }

      const fileScore = this.calculateWordMatchScore(
        impl.file.toLowerCase(),
        queryWords,
      );
      if (fileScore > 0) {
        score += 0.1 * fileScore;
        matchCount++;
      }
    }

    // Check decisions
    for (const decision of context.decisions) {
      const decisionScore = this.calculateWordMatchScore(
        decision.decision.toLowerCase(),
        queryWords,
      );
      if (decisionScore > 0) {
        score += 0.2 * decisionScore;
        matchCount++;
      }

      const contextScore = this.calculateWordMatchScore(
        decision.context.toLowerCase(),
        queryWords,
      );
      if (contextScore > 0) {
        score += 0.1 * contextScore;
        matchCount++;
      }
    }

    // Check patterns
    for (const pattern of context.patterns) {
      const patternScore = this.calculateWordMatchScore(
        pattern.value.toLowerCase(),
        queryWords,
      );
      if (patternScore > 0) {
        score += 0.1 * patternScore;
        matchCount++;
      }
    }

    // Apply temporal decay (reduced decay for more recent context)
    const age = Date.now() - new Date(context.timestamp).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    const temporalFactor = Math.exp(-daysSinceCreated / 60); // Increased to 60-day half-life

    // Combine scores
    const baseScore = Math.min(score, 1);
    const frequencyBoost = Math.min(matchCount * 0.05, 0.3);

    return Math.min((baseScore + frequencyBoost) * temporalFactor, 1.0);
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

    // Use tokenized word matching instead of exact substring matching
    const queryWords = this.tokenizeQuery(query);
    const queryLower = query.toLowerCase(); // Keep for snippet extraction

    // Search in problems
    for (const problem of context.problems) {
      const questionLower = problem.question.toLowerCase();
      const questionScore = this.calculateWordMatchScore(questionLower, queryWords);
      if (questionScore > 0) {
        matches.push({
          field: "problem.question",
          snippet: this.extractSnippet(problem.question, queryLower),
          score: 0.8 * questionScore,
        });
      }
      
      if (problem.solution?.approach) {
        const solutionLower = problem.solution.approach.toLowerCase();
        const solutionScore = this.calculateWordMatchScore(solutionLower, queryWords);
        if (solutionScore > 0) {
          matches.push({
            field: "problem.solution",
            snippet: this.extractSnippet(problem.solution.approach, queryLower),
            score: 0.7 * solutionScore,
          });
        }
      }
    }

    // Search in implementations
    for (const impl of context.implementations) {
      const descLower = impl.description.toLowerCase();
      const descScore = this.calculateWordMatchScore(descLower, queryWords);
      if (descScore > 0) {
        matches.push({
          field: "implementation.description",
          snippet: this.extractSnippet(impl.description, queryLower),
          score: 0.6 * descScore,
        });
      }
    }

    // Search in decisions
    for (const decision of context.decisions) {
      const decisionLower = decision.decision.toLowerCase();
      const decisionScore = this.calculateWordMatchScore(decisionLower, queryWords);
      if (decisionScore > 0) {
        matches.push({
          field: "decision",
          snippet: this.extractSnippet(decision.decision, queryLower),
          score: 0.7 * decisionScore,
        });
      }
    }

    // Search in patterns
    for (const pattern of context.patterns) {
      const patternLower = pattern.value.toLowerCase();
      const patternScore = this.calculateWordMatchScore(patternLower, queryWords);
      if (patternScore > 0) {
        matches.push({
          field: "pattern",
          snippet: this.extractSnippet(pattern.value, queryLower),
          score: 0.5 * patternScore,
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

  /**
   * Tokenize query into individual words for better matching
   */
  private tokenizeQuery(query: string): string[] {
    // Remove common stop words for better matching
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "been",
      "be",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "could",
      "what",
      "we",
      "our",
      "ours",
      "ourselves",
      "you",
      "your",
      "yours",
      "yourself",
    ]);

    // Split on whitespace and punctuation, filter out stop words
    const words = query
      .toLowerCase()
      .split(/[\s,;:!?.]+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    // Add variations for common terms
    const expandedWords: string[] = [];
    for (const word of words) {
      expandedWords.push(word);

      // Add common variations
      if (word === "mcp") expandedWords.push("mcp__", "modelcontextprotocol");
      if (word === "fix") expandedWords.push("fixed", "fixes", "fixing");
      if (word === "implement")
        expandedWords.push("implementation", "implemented", "implementing");
      if (word === "recent") expandedWords.push("recently", "latest", "last");
      if (word === "work") expandedWords.push("working", "worked", "works");
      if (word === "solution")
        expandedWords.push("solutions", "solve", "solved", "solving");
      if (word === "context")
        expandedWords.push("contextkeeper", "c0ntextkeeper");
      if (word === "fetch")
        expandedWords.push("fetching", "fetched", "retrieve", "retrieval");
      if (word === "tool") expandedWords.push("tools", "tool_use", "tooluse");
    }

    return expandedWords;
  }

  /**
   * Calculate match score for text against query words
   */
  private calculateWordMatchScore(text: string, queryWords: string[]): number {
    if (queryWords.length === 0) return 0;

    let matchedWords = 0;
    for (const word of queryWords) {
      if (text.includes(word)) {
        matchedWords++;
      }
    }

    // Return percentage of matched words (ANY match strategy)
    // Even one word match gives some score
    return matchedWords / queryWords.length;
  }
}
