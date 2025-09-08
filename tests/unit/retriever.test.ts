/**
 * Tests for ContextRetriever
 */

import { ContextRetriever } from '../../src/core/retriever';
import { ExtractedContext } from '../../src/core/types';
import { FileStore } from '../../src/storage/file-store';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('../../src/storage/file-store');
jest.mock('../../src/utils/logger');
jest.mock('fs/promises');

describe('ContextRetriever', () => {
  let retriever: ContextRetriever;
  let mockFileStore: jest.Mocked<FileStore>;

  const mockContext1: ExtractedContext = {
    sessionId: 'session-1',
    timestamp: '2024-01-01T10:00:00Z',
    projectPath: '/test/project',
    problems: [
      {
        question: 'How do I implement authentication?',
        solution: {
          approach: 'Use JWT tokens',
          files: ['auth.ts'],
          successful: true
        },
        tags: ['auth', 'jwt', 'security']
      }
    ],
    implementations: [
      {
        tool: 'Edit',
        description: 'Updated authentication middleware',
        files: ['middleware/auth.ts'],
        successful: true
      }
    ],
    decisions: [
      {
        type: 'architecture',
        description: 'Use JWT for stateless authentication',
        rationale: 'Better scalability'
      }
    ],
    patterns: [],
    metadata: {
      trigger: 'manual',
      extractionVersion: '0.5.1',
      filesModified: ['auth.ts', 'middleware/auth.ts'],
      relevanceScore: 0.85,
      duration: 300000,
      toolCounts: { Edit: 3, Write: 1 }
    }
  };

  const mockContext2: ExtractedContext = {
    sessionId: 'session-2',
    timestamp: '2024-01-02T15:00:00Z',
    projectPath: '/test/project',
    problems: [
      {
        question: 'How to optimize database queries?',
        solution: {
          approach: 'Add indexes and use query caching',
          files: ['db/queries.ts'],
          successful: true
        },
        tags: ['database', 'optimization', 'performance']
      }
    ],
    implementations: [],
    decisions: [],
    patterns: [
      {
        type: 'code',
        description: 'Database query pattern',
        examples: ['SELECT * FROM users WHERE active = true'],
        frequency: 5
      }
    ],
    metadata: {
      trigger: 'auto',
      extractionVersion: '0.5.1',
      filesModified: ['db/queries.ts'],
      relevanceScore: 0.75,
      duration: 600000,
      toolCounts: { Read: 10, Edit: 2 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    retriever = new ContextRetriever();
    mockFileStore = (FileStore as any).mock.instances[0];
  });

  describe('search', () => {
    it('should search contexts by query', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('authentication', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-1');
      expect(mockFileStore.loadContexts).toHaveBeenCalled();
    });

    it('should search with case-insensitive matching', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('AUTHENTICATION', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-1');
    });

    it('should search in solutions', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('JWT tokens', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-1');
    });

    it('should search in decisions', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('scalability', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-1');
    });

    it('should search in patterns', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('query pattern', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-2');
    });

    it('should respect limit parameter', async () => {
      const manyContexts = Array(20).fill(null).map((_, i) => ({
        ...mockContext1,
        sessionId: `session-${i}`,
        problems: [{
          question: 'How to implement authentication?',
          tags: ['auth']
        }]
      }));

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(manyContexts);

      const results = await retriever.search('authentication', { limit: 5 });

      expect(results).toHaveLength(5);
    });

    it('should filter by minimum relevance', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('authentication', { 
        limit: 10,
        minRelevance: 0.8
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.relevanceScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should handle empty query', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('', { limit: 10 });

      expect(results).toHaveLength(2); // Returns all contexts when no query
    });

    it('should handle no matches', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('nonexistent-term', { limit: 10 });

      expect(results).toHaveLength(0);
    });

    it('should handle storage errors gracefully', async () => {
      mockFileStore.loadContexts = jest.fn().mockRejectedValue(new Error('Storage error'));

      const results = await retriever.search('test', { limit: 10 });

      expect(results).toEqual([]);
    });

    it('should sort results by relevance', async () => {
      const contexts = [
        { ...mockContext1, metadata: { ...mockContext1.metadata, relevanceScore: 0.5 } },
        { ...mockContext2, metadata: { ...mockContext2.metadata, relevanceScore: 0.9 } },
        { ...mockContext1, sessionId: 'session-3', metadata: { ...mockContext1.metadata, relevanceScore: 0.7 } }
      ];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const results = await retriever.search('', { limit: 10 });

      expect(results[0].metadata.relevanceScore).toBe(0.9);
      expect(results[1].metadata.relevanceScore).toBe(0.7);
      expect(results[2].metadata.relevanceScore).toBe(0.5);
    });

    it('should search by tags', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('security', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-1');
    });

    it('should search in file paths', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.search('middleware/auth.ts', { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-1');
    });
  });

  describe('fetch', () => {
    it('should fetch context for a query', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const result = await retriever.fetch('authentication');

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('session-1');
    });

    it('should use default options', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const result = await retriever.fetch('database');

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('session-2');
    });

    it('should pass through options', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const result = await retriever.fetch('', { limit: 1, minRelevance: 0.8 });

      expect(result).toHaveLength(1);
      expect(result[0].metadata.relevanceScore).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('getRecent', () => {
    it('should return recent contexts', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.getRecent(2);

      expect(results).toHaveLength(2);
      // Should be sorted by timestamp descending
      expect(results[0].sessionId).toBe('session-2'); // More recent
      expect(results[1].sessionId).toBe('session-1');
    });

    it('should limit results', async () => {
      const manyContexts = Array(20).fill(null).map((_, i) => ({
        ...mockContext1,
        sessionId: `session-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString()
      }));

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(manyContexts);

      const results = await retriever.getRecent(5);

      expect(results).toHaveLength(5);
    });

    it('should handle empty storage', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([]);

      const results = await retriever.getRecent(10);

      expect(results).toEqual([]);
    });

    it('should handle storage errors', async () => {
      mockFileStore.loadContexts = jest.fn().mockRejectedValue(new Error('Storage error'));

      const results = await retriever.getRecent(10);

      expect(results).toEqual([]);
    });
  });

  describe('getByProject', () => {
    it('should filter contexts by project path', async () => {
      const contexts = [
        mockContext1,
        { ...mockContext2, projectPath: '/other/project' }
      ];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const results = await retriever.getByProject('/test/project');

      expect(results).toHaveLength(1);
      expect(results[0].projectPath).toBe('/test/project');
    });

    it('should handle normalized paths', async () => {
      const contexts = [
        { ...mockContext1, projectPath: '/test/project/' },
        { ...mockContext2, projectPath: '/test/project' }
      ];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const results = await retriever.getByProject('/test/project/');

      expect(results).toHaveLength(2);
    });

    it('should return empty array for unknown project', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.getByProject('/unknown/project');

      expect(results).toEqual([]);
    });
  });

  describe('getPatterns', () => {
    it('should extract all patterns from contexts', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const patterns = await retriever.getPatterns();

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe('code');
      expect(patterns[0].frequency).toBe(5);
    });

    it('should filter by minimum frequency', async () => {
      const contexts = [
        mockContext2,
        {
          ...mockContext1,
          patterns: [
            {
              type: 'command',
              description: 'npm test',
              examples: ['npm test'],
              frequency: 2
            }
          ]
        }
      ];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const patterns = await retriever.getPatterns(3);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].frequency).toBeGreaterThanOrEqual(3);
    });

    it('should sort patterns by frequency', async () => {
      const contexts = [{
        ...mockContext1,
        patterns: [
          {
            type: 'command',
            description: 'Pattern 1',
            examples: [],
            frequency: 3
          },
          {
            type: 'code',
            description: 'Pattern 2',
            examples: [],
            frequency: 10
          },
          {
            type: 'architecture',
            description: 'Pattern 3',
            examples: [],
            frequency: 5
          }
        ]
      }];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const patterns = await retriever.getPatterns();

      expect(patterns[0].frequency).toBe(10);
      expect(patterns[1].frequency).toBe(5);
      expect(patterns[2].frequency).toBe(3);
    });

    it('should handle contexts without patterns', async () => {
      const contexts = [
        { ...mockContext1, patterns: [] },
        { ...mockContext2, patterns: undefined as any }
      ];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const patterns = await retriever.getPatterns();

      expect(patterns).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should calculate statistics correctly', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const stats = await retriever.getStats();

      expect(stats.totalContexts).toBe(2);
      expect(stats.totalProblems).toBe(2);
      expect(stats.totalSolutions).toBe(2);
      expect(stats.totalDecisions).toBe(1);
      expect(stats.averageRelevance).toBe(0.8); // (0.85 + 0.75) / 2
      expect(stats.projects).toEqual(['/test/project']);
    });

    it('should handle empty storage', async () => {
      mockFileStore.loadContexts = jest.fn().mockResolvedValue([]);

      const stats = await retriever.getStats();

      expect(stats.totalContexts).toBe(0);
      expect(stats.totalProblems).toBe(0);
      expect(stats.totalSolutions).toBe(0);
      expect(stats.totalDecisions).toBe(0);
      expect(stats.averageRelevance).toBe(0);
      expect(stats.projects).toEqual([]);
    });

    it('should deduplicate project paths', async () => {
      const contexts = [
        mockContext1,
        mockContext2,
        { ...mockContext1, sessionId: 'session-3' },
        { ...mockContext2, sessionId: 'session-4', projectPath: '/other/project' }
      ];

      mockFileStore.loadContexts = jest.fn().mockResolvedValue(contexts);

      const stats = await retriever.getStats();

      expect(stats.projects).toHaveLength(2);
      expect(stats.projects).toContain('/test/project');
      expect(stats.projects).toContain('/other/project');
    });

    it('should count problems without solutions', async () => {
      const context = {
        ...mockContext1,
        problems: [
          {
            question: 'Problem 1',
            solution: { approach: 'Solution 1', files: [], successful: true }
          },
          {
            question: 'Problem 2',
            solution: undefined
          }
        ]
      };

      mockFileStore.loadContexts = jest.fn().mockResolvedValue([context]);

      const stats = await retriever.getStats();

      expect(stats.totalProblems).toBe(2);
      expect(stats.totalSolutions).toBe(1);
    });
  });
});