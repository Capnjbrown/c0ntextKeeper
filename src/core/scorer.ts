/**
 * Relevance Scoring Engine
 * Calculates relevance scores for transcript entries and extracted context
 */

import { TranscriptEntry, RelevanceFactors, ScoringWeights } from "./types.js";

export class RelevanceScorer {
  private weights: ScoringWeights;

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = {
      codeChanges: 0.8,
      errorResolution: 0.7,
      decisions: 0.6,
      problemSolution: 0.6,
      toolComplexity: 0.4,
      userEngagement: 0.3,
      ...weights,
    };
  }

  /**
   * Score a single transcript entry
   */
  scoreEntry(entry: TranscriptEntry): number {
    let score = 0;
    const factors = this.extractFactors(entry);

    // Apply weighted scoring
    if (factors.hasCodeChanges) score += this.weights.codeChanges;
    if (factors.hasErrorResolution) score += this.weights.errorResolution;
    if (factors.hasDecision) score += this.weights.decisions;
    if (factors.hasProblemSolution) score += this.weights.problemSolution;

    score += factors.toolComplexity * this.weights.toolComplexity;
    score += factors.userEngagement * this.weights.userEngagement;

    // Normalize to 0-1 range
    return Math.min(score, 1);
  }

  /**
   * Score generic content (for hooks)
   */
  scoreContent(item: {
    type: string;
    content: string;
    metadata?: any;
  }): number {
    let score = 0;

    // Base scoring based on content type
    if (item.type === "exchange") {
      if (item.metadata?.hasSolution) score += this.weights.problemSolution;
      if (item.metadata?.hasError) score += this.weights.errorResolution;
      if (item.metadata?.hasCode) score += this.weights.codeChanges * 0.5;
      if (item.metadata?.toolsUsed > 0)
        score += this.weights.toolComplexity * 0.3;
    } else if (item.type === "prompt") {
      score += this.weights.userEngagement * 0.5;
    } else if (item.type === "tool") {
      score += this.weights.toolComplexity * 0.4;
    }

    // Check content for valuable patterns
    const contentStr =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content);
    const content = contentStr.toLowerCase();
    if (this.containsProblemIndicators(content)) score += 0.2;
    if (this.containsDecisionIndicators(content)) score += 0.1;

    // Normalize to 0-1 range
    return Math.min(score, 1);
  }

  /**
   * Extract relevance factors from an entry
   */
  private extractFactors(entry: TranscriptEntry): RelevanceFactors {
    const factors: RelevanceFactors = {
      hasCodeChanges: false,
      hasErrorResolution: false,
      hasDecision: false,
      hasProblemSolution: false,
      toolComplexity: 0,
      userEngagement: 0,
    };

    // Check for code changes
    if (entry.type === "tool_use" && entry.toolUse) {
      const toolName = entry.toolUse.name;
      if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
        factors.hasCodeChanges = true;
        factors.toolComplexity = this.calculateToolComplexity(
          toolName,
          entry.toolUse.input,
        );
      }

      // Other valuable tools
      if (toolName === "Bash") {
        factors.toolComplexity = 0.5;
      }
      if (["Read", "View", "Grep", "Search"].includes(toolName)) {
        factors.toolComplexity = 0.3;
      }
    }

    // Check for error resolution
    if (entry.toolResult?.error) {
      factors.hasErrorResolution = true;
    }

    // Check user messages for engagement signals
    if (entry.type === "user" && entry.message?.content) {
      const contentStr =
        typeof entry.message.content === "string"
          ? entry.message.content
          : JSON.stringify(entry.message.content);
      const content = contentStr.toLowerCase();
      factors.userEngagement = this.calculateUserEngagement(content);

      // Problem indicators
      if (this.containsProblemIndicators(content)) {
        factors.hasProblemSolution = true;
      }

      // Decision indicators
      if (this.containsDecisionIndicators(content)) {
        factors.hasDecision = true;
      }
    }

    // Check assistant messages for valuable content
    if (entry.type === "assistant" && entry.message?.content) {
      const contentStr =
        typeof entry.message.content === "string"
          ? entry.message.content
          : JSON.stringify(entry.message.content);

      // Code blocks are valuable
      if (contentStr.includes("```")) {
        factors.hasCodeChanges = true;
      }

      // Explanations and reasoning
      if (this.containsExplanationIndicators(contentStr)) {
        factors.hasDecision = true;
      }
    }

    return factors;
  }

  /**
   * Calculate tool complexity based on tool type and input
   */
  private calculateToolComplexity(toolName: string, input: any): number {
    let complexity = 0;

    switch (toolName) {
      case "MultiEdit":
        // Multiple edits are more complex
        complexity = 0.8;
        if (input?.edits && Array.isArray(input.edits)) {
          complexity = Math.min(0.5 + input.edits.length * 0.1, 1);
        }
        break;

      case "Write":
        complexity = 0.7;
        // Large file writes are more significant
        if (input?.content && input.content.length > 1000) {
          complexity = 0.9;
        }
        break;

      case "Edit":
        complexity = 0.6;
        // Complex replacements are more valuable
        if (input?.old_string && input.old_string.length > 100) {
          complexity = 0.7;
        }
        break;

      case "NotebookEdit":
        complexity = 0.7;
        break;

      default:
        complexity = 0.3;
    }

    return complexity;
  }

  /**
   * Calculate user engagement level from message content
   */
  private calculateUserEngagement(content: string): number {
    let engagement = 0.2; // Base engagement for any user input

    // Questions are highly valuable - they represent problems to solve
    if (content.includes("?")) {
      engagement = 1.0; // Max engagement for questions
      return engagement; // Return immediately for questions
    }

    // Length indicates detailed explanation
    if (content.length > 200) engagement += 0.3;
    if (content.length > 500) engagement += 0.2;

    // Technical terms indicate deeper engagement
    const technicalTerms = [
      "function",
      "class",
      "method",
      "variable",
      "api",
      "database",
      "server",
      "client",
      "component",
      "module",
    ];

    const termCount = technicalTerms.filter((term) =>
      content.includes(term),
    ).length;
    engagement += Math.min(termCount * 0.1, 0.3);

    return Math.min(engagement, 1);
  }

  /**
   * Check for problem indicators in content
   */
  private containsProblemIndicators(content: string): boolean {
    const indicators = [
      "error",
      "issue",
      "problem",
      "bug",
      "fix",
      "not working",
      "failed",
      "wrong",
      "broken",
      "crash",
      "exception",
      "undefined",
      "null",
    ];

    return indicators.some((indicator) => content.includes(indicator));
  }

  /**
   * Check for decision indicators in content
   */
  private containsDecisionIndicators(content: string): boolean {
    const indicators = [
      "should we",
      "better to",
      "recommend",
      "suggest",
      "approach",
      "strategy",
      "decision",
      "choose",
      "prefer",
      "optimal",
      "best practice",
    ];

    return indicators.some((indicator) => content.includes(indicator));
  }

  /**
   * Check for explanation indicators in content
   */
  private containsExplanationIndicators(content: string): boolean {
    const indicators = [
      "because",
      "reason",
      "since",
      "therefore",
      "this means",
      "this allows",
      "the purpose",
      "in order to",
      "so that",
      "which enables",
    ];

    return indicators.some((indicator) =>
      content.toLowerCase().includes(indicator),
    );
  }

  /**
   * Calculate relevance decay based on age
   */
  calculateTemporalDecay(timestamp: string, referenceTime?: Date): number {
    const entryTime = new Date(timestamp).getTime();
    const refTime = (referenceTime || new Date()).getTime();
    const ageInDays = (refTime - entryTime) / (1000 * 60 * 60 * 24);

    // Exponential decay with half-life of 30 days
    const halfLife = 30;
    return Math.exp((-0.693 * ageInDays) / halfLife);
  }

  /**
   * Combine multiple relevance scores
   */
  combineScores(scores: number[], weights?: number[]): number {
    if (scores.length === 0) return 0;

    if (weights && weights.length === scores.length) {
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const weightedSum = scores.reduce(
        (sum, score, i) => sum + score * weights[i],
        0,
      );
      return weightedSum / totalWeight;
    }

    // Simple average if no weights provided
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
}
