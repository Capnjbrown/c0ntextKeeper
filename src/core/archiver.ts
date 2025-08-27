/**
 * Context Archiver
 * Manages the archival of extracted context
 */

import { ExtractedContext, TranscriptEntry } from './types.js';
import { ContextExtractor } from './extractor.js';
import { FileStore } from '../storage/file-store.js';
import { parseTranscript } from '../utils/transcript.js';
import { Logger } from '../utils/logger.js';

export class ContextArchiver {
  private extractor: ContextExtractor;
  private storage: FileStore;
  private logger: Logger;

  constructor(
    storage?: FileStore,
    extractor?: ContextExtractor
  ) {
    this.storage = storage || new FileStore();
    this.extractor = extractor || new ContextExtractor();
    this.logger = new Logger('ContextArchiver');
  }

  /**
   * Archive context from a transcript file
   */
  async archiveFromTranscript(transcriptPath: string): Promise<{
    success: boolean;
    archivePath?: string;
    stats?: any;
    error?: string;
  }> {
    try {
      this.logger.info(`Processing transcript: ${transcriptPath}`);

      // Parse the transcript
      const entries = await parseTranscript(transcriptPath);
      this.logger.info(`Parsed ${entries.length} entries from transcript`);

      if (entries.length === 0) {
        return {
          success: false,
          error: 'No entries found in transcript'
        };
      }

      // Extract context
      const context = this.extractor.extract(entries);
      this.logger.info(`Extracted context with relevance score: ${context.metadata.relevanceScore}`);

      // Store the context
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
          relevanceScore: context.metadata.relevanceScore
        }
      };
    } catch (error) {
      this.logger.error('Failed to archive context:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
        context
      };
    } catch (error) {
      this.logger.error('Failed to archive entries:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
  async cleanup(daysToKeep = 90): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const stats = {
      cleaned: 0,
      errors: [] as string[]
    };

    try {
      // This would be implemented in FileStore
      // For now, just return empty stats
      this.logger.info(`Cleanup completed: ${stats.cleaned} files removed`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push(errorMsg);
      this.logger.error('Cleanup failed:', error);
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
      
      // Test with a dummy context
      const testContext: ExtractedContext = {
        sessionId: 'test-' + Date.now(),
        projectPath: '/test/validation',
        timestamp: new Date().toISOString(),
        extractedAt: 'manual',
        problems: [],
        implementations: [],
        decisions: [],
        patterns: [],
        metadata: {
          entryCount: 0,
          duration: 0,
          toolsUsed: [],
          filesModified: [],
          relevanceScore: 0,
          extractionVersion: '0.1.0'
        }
      };

      const path = await this.storage.store(testContext);
      this.logger.info(`Validation successful, test archive at: ${path}`);
      
      return true;
    } catch (error) {
      this.logger.error('Validation failed:', error);
      return false;
    }
  }
}