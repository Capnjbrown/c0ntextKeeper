/**
 * Context Archiver
 * Manages the archival of extracted context
 */

import { ExtractedContext, TranscriptEntry } from "./types.js";
import { ContextExtractor } from "./extractor.js";
import { FileStore } from "../storage/file-store.js";
import { parseTranscript } from "../utils/transcript.js";
import { Logger } from "../utils/logger.js";

export class ContextArchiver {
  private extractor: ContextExtractor;
  private storage: FileStore;
  private logger: Logger;

  constructor(storage?: FileStore, extractor?: ContextExtractor) {
    this.storage = storage || new FileStore();
    this.extractor = extractor || new ContextExtractor();
    this.logger = new Logger("ContextArchiver");
  }

  /**
   * Archive context from a transcript file
   * @param transcriptPath - Path to the JSONL transcript file
   * @param projectPath - Optional project directory path (from hook input)
   */
  async archiveFromTranscript(
    transcriptPath: string,
    projectPath?: string,
  ): Promise<{
    success: boolean;
    archivePath?: string;
    stats?: any;
    error?: string;
  }> {
    try {
      this.logger.info(`Processing transcript: ${transcriptPath}`);

      // Parse the transcript with timeout and size limits
      const entries = await parseTranscript(transcriptPath, {
        maxEntries: 10000, // Limit to 10k entries for performance
        maxTimeMs: 40000, // 40 seconds max for parsing (leaves time for processing)
        prioritizeRecent: true, // Keep recent entries if we hit limits
      });
      this.logger.info(`Parsed ${entries.length} entries from transcript`);

      if (entries.length === 0) {
        return {
          success: false,
          error: "No entries found in transcript",
        };
      }

      // Extract context with detailed logging
      this.logger.info(
        `Starting extraction from ${entries.length} transcript entries`,
      );
      if (projectPath) {
        this.logger.info(`Using provided project path: ${projectPath}`);
      }
      const context = this.extractor.extract(entries, projectPath);

      // Log detailed extraction results
      this.logger.info("=== EXTRACTION RESULTS ===");
      this.logger.info(`Problems extracted: ${context.problems.length}`);
      this.logger.info(
        `Implementations extracted: ${context.implementations.length}`,
      );
      this.logger.info(`Decisions extracted: ${context.decisions.length}`);
      this.logger.info(`Patterns extracted: ${context.patterns.length}`);
      this.logger.info(`Relevance score: ${context.metadata.relevanceScore}`);

      // Log samples if any
      if (context.problems.length > 0) {
        this.logger.info(
          `Sample problem: ${context.problems[0].question.slice(0, 100)}...`,
        );
      }
      if (context.implementations.length > 0) {
        this.logger.info(
          `Sample implementation: ${context.implementations[0].description.slice(0, 100)}...`,
        );
      }

      // Always store context, even if empty
      const archivePath = await this.storage.store(context);
      this.logger.info(`Context archived to: ${archivePath}`);

      // Return success with statistics
      return {
        success: true,
        archivePath,
        stats: {
          problems: context.problems.length,
          implementations: context.implementations.length,
          decisions: context.decisions.length,
          patterns: context.patterns.length,
          relevanceScore: context.metadata.relevanceScore,
        },
      };
    } catch (error) {
      this.logger.error("Failed to archive context:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Archive context from transcript entries directly
   */
  async archiveFromEntries(entries: TranscriptEntry[]): Promise<{
    success: boolean;
    archivePath?: string;
    context?: ExtractedContext;
    error?: string;
  }> {
    try {
      // Extract context
      const context = this.extractor.extract(entries);

      // Store the context
      const archivePath = await this.storage.store(context);

      return {
        success: true,
        archivePath,
        context,
      };
    } catch (error) {
      this.logger.error("Failed to archive entries:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Archive pre-extracted context
   */
  async archive(context: ExtractedContext): Promise<string> {
    return await this.storage.store(context);
  }

  /**
   * Get archival statistics
   */
  async getStats(): Promise<any> {
    return await this.storage.getStats();
  }

  /**
   * Clean up old archives based on retention policy
   */
  async cleanup(_daysToKeep = 90): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const stats = {
      cleaned: 0,
      errors: [] as string[],
    };

    try {
      // This would be implemented in FileStore
      // For now, just return empty stats
      this.logger.info(`Cleanup completed: ${stats.cleaned} files removed`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      stats.errors.push(errorMsg);
      this.logger.error("Cleanup failed:", error);
    }

    return stats;
  }

  /**
   * Validate that archival is working
   */
  async validate(): Promise<boolean> {
    try {
      // Test storage initialization
      await this.storage.initialize();

      // Test with a dummy context - marked as test data
      const testContext: ExtractedContext = {
        sessionId: "validation-" + Date.now(),
        projectPath: process.cwd(), // Use current working directory instead of test path
        timestamp: new Date().toISOString(),
        extractedAt: "manual",
        problems: [],
        implementations: [],
        decisions: [],
        patterns: [],
        metadata: {
          entryCount: 0,
          duration: 0,
          toolsUsed: [],
          toolCounts: {},
          filesModified: [],
          relevanceScore: 0,
          extractionVersion: "0.7.2",
          isTest: true, // Mark as test data for separation
        },
      };

      const path = await this.storage.store(testContext);
      this.logger.info(`Validation successful, test archive at: ${path}`);

      return true;
    } catch (error) {
      this.logger.error("Validation failed:", error);
      return false;
    }
  }
}
