/**
 * Tests for ContextArchiver
 */

import { ContextArchiver } from '../../src/core/archiver';
import { ExtractedContext } from '../../src/core/types';
import { FileStore } from '../../src/storage/file-store';
import { ContextExtractor } from '../../src/core/extractor';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('../../src/storage/file-store');
jest.mock('../../src/core/extractor');
jest.mock('../../src/utils/transcript');
jest.mock('../../src/utils/logger');
jest.mock('fs/promises');

describe('ContextArchiver', () => {
  let archiver: ContextArchiver;
  let mockFileStore: jest.Mocked<FileStore>;
  let mockExtractor: jest.Mocked<ContextExtractor>;

  const mockContext: ExtractedContext = {
    sessionId: 'test-session-123',
    timestamp: '2024-09-04T10:00:00Z',
    projectPath: '/test/project',
    extractedAt: 'preCompact',
    problems: [
      {
        id: 'prob-1',
        question: 'How do I fix authentication?',
        timestamp: '2024-09-04T10:00:00Z',
        tags: ['authentication', 'jwt'],
        relevance: 0.9,
        solution: {
          approach: 'Update JWT validation',
          files: ['auth.ts'],
          successful: true
        }
      }
    ],
    implementations: [],
    decisions: [],
    patterns: [],
    metadata: {
      extractionVersion: '0.5.1',
      filesModified: ['auth.ts'],
      relevanceScore: 0.85,
      duration: 300000,
      entryCount: 10,
      toolsUsed: ['Edit', 'Write'],
      toolCounts: {
        Edit: 2,
        Write: 1
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFileStore = new FileStore() as jest.Mocked<FileStore>;
    mockExtractor = new ContextExtractor() as jest.Mocked<ContextExtractor>;
    
    archiver = new ContextArchiver(mockFileStore, mockExtractor);
  });

  describe('archiveFromTranscript', () => {
    it('should process a JSONL transcript and archive it', async () => {
      const transcriptPath = '/test/transcript.jsonl';
      
      // Mock file existence check
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      
      // Mock transcript parsing
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Test question' }]
          }
        },
        {
          type: 'assistant',
          timestamp: '2024-09-04T10:00:01Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Test answer' }]
          }
        }
      ]);

      // Mock extraction
      mockExtractor.extract = jest.fn().mockReturnValue(mockContext);

      // Mock storage
      mockFileStore.store = jest.fn().mockResolvedValue('/mock/archive/path.json');

      const result = await archiver.archiveFromTranscript(transcriptPath, '/test/project');

      expect(result.success).toBe(true);
      expect(result.archivePath).toBe('/mock/archive/path.json');
      expect(result.stats).toEqual({
        problems: 1,
        implementations: 0,
        decisions: 0,
        patterns: 0,
        relevanceScore: 0.85
      });
      expect(parseTranscript).toHaveBeenCalledWith(transcriptPath, expect.any(Object));
    });

    it('should handle empty transcript', async () => {
      const transcriptPath = '/test/empty.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([]);

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No entries found in transcript');
    });

    it('should handle extraction errors gracefully', async () => {
      const transcriptPath = '/test/transcript.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Test' }]
          }
        }
      ]);

      mockExtractor.extract = jest.fn().mockImplementation(() => {
        throw new Error('Extraction failed');
      });

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Extraction failed');
    });

    it('should handle storage errors', async () => {
      const transcriptPath = '/test/transcript.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Test' }]
          }
        }
      ]);

      mockExtractor.extract = jest.fn().mockReturnValue(mockContext);
      mockFileStore.store = jest.fn().mockRejectedValue(new Error('Storage failed'));

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage failed');
    });

    it('should always store context even with minimal content', async () => {
      const transcriptPath = '/test/minimal.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hi' }]
          }
        }
      ]);

      const minimalContext: ExtractedContext = {
        ...mockContext,
        problems: [],
        implementations: [],
        decisions: [],
        patterns: [],
        metadata: {
          ...mockContext.metadata,
          relevanceScore: 0.1
        }
      };

      mockExtractor.extract = jest.fn().mockReturnValue(minimalContext);
      mockFileStore.store = jest.fn().mockResolvedValue('/mock/archive/minimal.json');

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(true);
      expect(mockFileStore.store).toHaveBeenCalledWith(minimalContext);
      expect(result.stats.relevanceScore).toBe(0.1);
    });

    it('should use provided project path', async () => {
      const transcriptPath = '/test/transcript.jsonl';
      const projectPath = '/custom/project/path';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Test' }]
          }
        }
      ]);

      mockExtractor.extract = jest.fn().mockReturnValue(mockContext);
      mockFileStore.store = jest.fn().mockResolvedValue('/mock/archive/path.json');

      await archiver.archiveFromTranscript(transcriptPath, projectPath);

      expect(mockExtractor.extract).toHaveBeenCalledWith(
        expect.any(Array),
        projectPath
      );
    });

    it('should handle timeout gracefully', async () => {
      const transcriptPath = '/test/huge.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockRejectedValue(new Error('Parsing timed out after 40000ms'));

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should log extraction details', async () => {
      const transcriptPath = '/test/transcript.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'How to fix error?' }]
          }
        }
      ]);

      const detailedContext: ExtractedContext = {
        ...mockContext,
        problems: [
          { 
            id: 'prob-1',
            question: 'How to fix error?', 
            timestamp: '2024-09-04T10:00:00Z',
            tags: ['error', 'fix'],
            relevance: 0.8,
            solution: { approach: 'Fix it', files: [], successful: true } 
          },
          { 
            id: 'prob-2',
            question: 'Another problem', 
            timestamp: '2024-09-04T10:01:00Z',
            tags: ['general'],
            relevance: 0.7,
            solution: undefined 
          }
        ],
        implementations: [
          { 
            id: 'impl-1',
            tool: 'Edit', 
            file: 'bug.ts',
            description: 'Fixed the bug', 
            timestamp: '2024-09-04T10:00:00Z',
            relevance: 0.8
          }
        ],
        decisions: [
          { 
            id: 'dec-1',
            decision: 'Use microservices',
            context: 'Architecture decision for the system',
            rationale: 'Scalability',
            timestamp: '2024-09-04T10:00:00Z',
            impact: 'high' as const,
            tags: ['architecture']
          }
        ],
        patterns: [
          { 
            id: 'pat-1',
            type: 'command' as const,
            value: 'npm test',
            examples: ['npm test'],
            frequency: 3,
            firstSeen: '2024-09-01T10:00:00Z',
            lastSeen: '2024-09-04T10:00:00Z'
          }
        ]
      };

      mockExtractor.extract = jest.fn().mockReturnValue(detailedContext);
      mockFileStore.store = jest.fn().mockResolvedValue('/mock/archive/detailed.json');

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(true);
      expect(result.stats.problems).toBe(2);
      expect(result.stats.implementations).toBe(1);
      expect(result.stats.decisions).toBe(1);
      expect(result.stats.patterns).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON in transcript', async () => {
      const transcriptPath = '/test/malformed.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockRejectedValue(new Error('Invalid JSON'));

      const result = await archiver.archiveFromTranscript(transcriptPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle concurrent archiving requests', async () => {
      const transcriptPath1 = '/test/transcript1.jsonl';
      const transcriptPath2 = '/test/transcript2.jsonl';
      
      const parseTranscript = require('../../src/utils/transcript').parseTranscript;
      parseTranscript.mockResolvedValue([
        {
          type: 'user',
          timestamp: '2024-09-04T10:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Test' }]
          }
        }
      ]);

      mockExtractor.extract = jest.fn().mockReturnValue(mockContext);
      mockFileStore.store = jest.fn().mockResolvedValue('/mock/archive/path.json');

      const [result1, result2] = await Promise.all([
        archiver.archiveFromTranscript(transcriptPath1),
        archiver.archiveFromTranscript(transcriptPath2)
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockExtractor.extract).toHaveBeenCalledTimes(2);
      expect(mockFileStore.store).toHaveBeenCalledTimes(2);
    });
  });
});