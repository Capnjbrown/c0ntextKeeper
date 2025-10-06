/**
 * Search Index Manager for c0ntextKeeper
 * Provides fast keyword-based search through archived contexts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExtractedContext } from './types.js';
import { Logger } from '../utils/logger.js';
import { getProjectName } from '../utils/project-utils.js';
import { getStoragePath } from '../utils/path-resolver.js';

/**
 * Structure of the search index
 */
export interface SearchIndex {
  version: string;
  lastUpdated: string;
  projectName: string;
  sessions: {
    [sessionId: string]: SessionIndexEntry;
  };
  keywords: {
    [keyword: string]: string[]; // keyword -> array of sessionIds
  };
  metadata: {
    totalSessions: number;
    totalKeywords: number;
    avgKeywordsPerSession: number;
  };
}

/**
 * Index entry for a single session
 */
export interface SessionIndexEntry {
  sessionId: string;
  timestamp: string;
  keywords: string[];
  relevance: number;
  problemCount: number;
  implementationCount: number;
  decisionCount: number;
  toolsUsed: string[];
  filesModified: string[];
  summary: string;
}

/**
 * Common English stop words to exclude from indexing
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to',
  'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had',
  'what', 'when', 'where', 'who', 'which', 'why', 'how', 'all', 'would',
  'there', 'their', 'or', 'if', 'can', 'may', 'could', 'should', 'would',
  'might', 'must', 'shall', 'will', 'do', 'does', 'did', 'done', 'doing',
  'i', 'you', 'he', 'she', 'we', 'they', 'them', 'your', 'our', 'my'
]);

/**
 * Manages search index for fast context retrieval
 */
export class SearchIndexer {
  private indexPath: string;
  private index: SearchIndex | null = null;
  private logger: Logger;
  private maxKeywordLength = 50;
  private minKeywordLength = 2;
  private maxKeywordsPerSession = 500;

  constructor(projectPath?: string) {
    this.logger = new Logger('SearchIndexer');
    const projectName = getProjectName(projectPath || process.cwd());
    const storagePath = getStoragePath();
    this.indexPath = path.join(
      storagePath,
      'archive',
      'projects',
      projectName,
      'search-index.json'
    );
  }

  /**
   * Load the search index from disk
   */
  private async loadIndex(): Promise<SearchIndex> {
    if (this.index) {
      return this.index;
    }

    try {
      if (fs.existsSync(this.indexPath)) {
        const content = fs.readFileSync(this.indexPath, 'utf-8');
        this.index = JSON.parse(content);
        return this.index!;
      }
    } catch (error) {
      this.logger.warn('Failed to load search index, creating new one', error);
    }

    // Create new index if none exists or loading failed
    this.index = this.createEmptyIndex();
    return this.index;
  }

  /**
   * Create an empty search index
   */
  private createEmptyIndex(): SearchIndex {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      projectName: getProjectName(process.cwd()),
      sessions: {},
      keywords: {},
      metadata: {
        totalSessions: 0,
        totalKeywords: 0,
        avgKeywordsPerSession: 0
      }
    };
  }

  /**
   * Save the index to disk
   */
  private async saveIndex(): Promise<void> {
    if (!this.index) return;

    try {
      // Ensure directory exists
      const dir = path.dirname(this.indexPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Update metadata
      this.index.lastUpdated = new Date().toISOString();
      this.index.metadata.totalSessions = Object.keys(this.index.sessions).length;
      this.index.metadata.totalKeywords = Object.keys(this.index.keywords).length;

      if (this.index.metadata.totalSessions > 0) {
        const totalKeywords = Object.values(this.index.sessions)
          .reduce((sum, session) => sum + session.keywords.length, 0);
        this.index.metadata.avgKeywordsPerSession =
          Math.round(totalKeywords / this.index.metadata.totalSessions);
      }

      // Write atomically using temp file
      const tempPath = this.indexPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.index, null, 2));
      fs.renameSync(tempPath, this.indexPath);

      this.logger.info(`Index saved with ${this.index.metadata.totalSessions} sessions`);
    } catch (error) {
      this.logger.error('Failed to save search index', error);
      throw error;
    }
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Convert to lowercase and split on non-word characters
    const words = text.toLowerCase().split(/\W+/);
    const keywords = new Set<string>();

    for (const word of words) {
      // Skip if too short or too long
      if (word.length < this.minKeywordLength || word.length > this.maxKeywordLength) {
        continue;
      }

      // Skip stop words
      if (STOP_WORDS.has(word)) {
        continue;
      }

      // Skip numbers
      if (/^\d+$/.test(word)) {
        continue;
      }

      keywords.add(word);

      // Limit keywords per session
      if (keywords.size >= this.maxKeywordsPerSession) {
        break;
      }
    }

    return Array.from(keywords);
  }

  /**
   * Extract keywords from context object
   */
  private extractContextKeywords(context: ExtractedContext): string[] {
    const texts: string[] = [];

    // Extract from problems
    if (context.problems) {
      for (const problem of context.problems) {
        texts.push(problem.question);
        if (problem.solution) {
          texts.push(problem.solution.approach);
        }
        texts.push(...(problem.tags || []));
      }
    }

    // Extract from implementations
    if (context.implementations) {
      for (const impl of context.implementations) {
        texts.push(impl.description);
        texts.push(impl.tool);
        if (impl.file) {
          texts.push(impl.file);
        }
      }
    }

    // Extract from decisions
    if (context.decisions) {
      for (const decision of context.decisions) {
        texts.push(decision.decision);
        texts.push(decision.context);
        if (decision.rationale) {
          texts.push(decision.rationale);
        }
        texts.push(...(decision.tags || []));
      }
    }

    // Extract from patterns
    if (context.patterns) {
      for (const pattern of context.patterns) {
        texts.push(pattern.value);
        texts.push(pattern.type);
      }
    }

    // Combine all texts and extract keywords
    const combinedText = texts.join(' ');
    return this.extractKeywords(combinedText);
  }

  /**
   * Update the index with a new context
   */
  async updateIndex(sessionId: string, context: ExtractedContext): Promise<void> {
    const index = await this.loadIndex();

    // Extract keywords from context
    const keywords = this.extractContextKeywords(context);

    // Create summary for quick preview
    const summary = this.createSummary(context);

    // Create session entry
    const sessionEntry: SessionIndexEntry = {
      sessionId,
      timestamp: context.timestamp,
      keywords,
      relevance: context.metadata?.relevanceScore || 0,
      problemCount: context.problems?.length || 0,
      implementationCount: context.implementations?.length || 0,
      decisionCount: context.decisions?.length || 0,
      toolsUsed: context.metadata?.toolsUsed || [],
      filesModified: context.metadata?.filesModified || [],
      summary
    };

    // Remove old entry if exists
    if (index.sessions[sessionId]) {
      // Remove from keyword index
      const oldKeywords = index.sessions[sessionId].keywords;
      for (const keyword of oldKeywords) {
        if (index.keywords[keyword]) {
          index.keywords[keyword] = index.keywords[keyword]
            .filter(id => id !== sessionId);
          if (index.keywords[keyword].length === 0) {
            delete index.keywords[keyword];
          }
        }
      }
    }

    // Add new entry
    index.sessions[sessionId] = sessionEntry;

    // Update keyword index
    for (const keyword of keywords) {
      if (!index.keywords[keyword]) {
        index.keywords[keyword] = [];
      }
      if (!index.keywords[keyword].includes(sessionId)) {
        index.keywords[keyword].push(sessionId);
      }
    }

    // Save updated index
    await this.saveIndex();

    this.logger.info(
      `Indexed session ${sessionId} with ${keywords.length} keywords`
    );
  }

  /**
   * Create a brief summary of the context
   */
  private createSummary(context: ExtractedContext): string {
    const parts: string[] = [];

    if (context.problems?.length > 0) {
      const firstProblem = context.problems[0].question;
      parts.push(firstProblem.substring(0, 100));
    }

    if (context.implementations?.length > 0) {
      parts.push(`${context.implementations.length} implementations`);
    }

    if (context.decisions?.length > 0) {
      parts.push(`${context.decisions.length} decisions`);
    }

    return parts.join(' | ') || 'No summary available';
  }

  /**
   * Search the index for matching sessions
   */
  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const index = await this.loadIndex();
    const queryKeywords = this.extractKeywords(query);

    if (queryKeywords.length === 0) {
      this.logger.warn('No valid keywords in search query');
      return [];
    }

    // Score sessions by keyword matches
    const sessionScores = new Map<string, number>();

    for (const keyword of queryKeywords) {
      const sessions = index.keywords[keyword] || [];
      for (const sessionId of sessions) {
        const currentScore = sessionScores.get(sessionId) || 0;
        sessionScores.set(sessionId, currentScore + 1);
      }
    }

    // Sort by score and convert to results
    const results: SearchResult[] = Array.from(sessionScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([sessionId, score]) => {
        const session = index.sessions[sessionId];
        return {
          sessionId,
          score: score / queryKeywords.length, // Normalize score
          timestamp: session.timestamp,
          summary: session.summary,
          metadata: {
            problemCount: session.problemCount,
            toolsUsed: session.toolsUsed,
            filesModified: session.filesModified,
            relevance: session.relevance
          }
        };
      });

    this.logger.info(
      `Search for "${query}" found ${results.length} results`
    );

    return results;
  }

  /**
   * Rebuild the entire index from scratch
   */
  async rebuildIndex(sessionsPath?: string): Promise<void> {
    this.logger.info('Rebuilding search index...');

    // Clear current index
    this.index = this.createEmptyIndex();

    // Get sessions directory
    const projectName = getProjectName(process.cwd());
    const storagePath = getStoragePath();
    const sessionsDir = sessionsPath || path.join(
      storagePath,
      'archive',
      'projects',
      projectName,
      'sessions'
    );

    if (!fs.existsSync(sessionsDir)) {
      this.logger.warn('No sessions directory found');
      await this.saveIndex();
      return;
    }

    // Read all session files
    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.json'));

    let processed = 0;
    for (const file of files) {
      try {
        const filePath = path.join(sessionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const session = JSON.parse(content);

        if (session.context) {
          const sessionId = session.sessionId ||
            path.basename(file, '.json');
          await this.updateIndex(sessionId, session.context);
          processed++;
        }
      } catch (error) {
        this.logger.warn(`Failed to index ${file}`, error);
      }
    }

    this.logger.info(`Rebuilt index with ${processed} sessions`);
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<any> {
    const index = await this.loadIndex();
    return {
      version: index.version,
      lastUpdated: index.lastUpdated,
      ...index.metadata,
      topKeywords: this.getTopKeywords(index, 10)
    };
  }

  /**
   * Get most frequent keywords
   */
  private getTopKeywords(index: SearchIndex, limit: number): Array<[string, number]> {
    return Object.entries(index.keywords)
      .map(([keyword, sessions]) => [keyword, sessions.length] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
}

/**
 * Search result structure
 */
export interface SearchResult {
  sessionId: string;
  score: number;
  timestamp: string;
  summary: string;
  metadata: {
    problemCount: number;
    toolsUsed: string[];
    filesModified: string[];
    relevance: number;
  };
}