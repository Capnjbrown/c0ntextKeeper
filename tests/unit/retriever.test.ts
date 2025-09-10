/**
 * Tests for ContextRetriever
 */

import { ContextRetriever } from '../../src/core/retriever';
import { ExtractedContext, SearchResult, ProjectIndex } from '../../src/core/types';
import { FileStore } from '../../src/storage/file-store';

// Mock dependencies
jest.mock('../../src/storage/file-store');
jest.mock('../../src/utils/logger');

describe('ContextRetriever', () => {
  let retriever: ContextRetriever;
  let mockFileStore: jest.Mocked<FileStore>;

  const mockContext1: ExtractedContext = {
    sessionId: 'session-1',
    timestamp: '2024-01-01T10:00:00Z',
    projectPath: '/test/project',
    extractedAt: 'preCompact',
    problems: [
      {
        id: 'prob-1',
        question: 'How do I implement authentication?',
        timestamp: '2024-01-01T10:00:00Z',
        solution: {
          approach: 'Use JWT tokens',
          files: ['auth.ts'],
          successful: true
        },
        tags: ['auth', 'jwt', 'security'],
        relevance: 0.9
      }
    ],
    implementations: [
      {
        id: 'impl-1',
        tool: 'Edit',
        file: 'middleware/auth.ts',
        description: 'Updated authentication middleware',
        timestamp: '2024-01-01T10:00:00Z',
        relevance: 0.8
      }
    ],
    decisions: [
      {
        id: 'dec-1',
        decision: 'Use JWT for stateless authentication',
        context: 'Authentication system design',
        rationale: 'Better scalability',
        timestamp: '2024-01-01T10:00:00Z',
        impact: 'high' as const,
        tags: ['architecture', 'auth']
      }
    ],
    patterns: [],
    metadata: {
      extractionVersion: '0.5.1',
      filesModified: ['auth.ts', 'middleware/auth.ts'],
      relevanceScore: 0.85,
      duration: 300000,
      toolCounts: { Edit: 3, Write: 1 },
      entryCount: 10,
      toolsUsed: ['Edit', 'Write']
    }
  };

  const mockContext2: ExtractedContext = {
    sessionId: 'session-2',
    timestamp: '2024-01-02T15:00:00Z',
    projectPath: '/test/project',
    extractedAt: 'preCompact',
    problems: [
      {
        id: 'prob-2',
        question: 'How to optimize database queries?',
        timestamp: '2024-01-02T15:00:00Z',
        solution: {
          approach: 'Add indexes and use query caching',
          files: ['db/queries.ts'],
          successful: true
        },
        tags: ['database', 'optimization', 'performance'],
        relevance: 0.85
      }
    ],
    implementations: [],
    decisions: [],
    patterns: [
      {
        id: 'pat-2',
        type: 'code' as const,
        value: 'Database query pattern',
        examples: ['SELECT * FROM users WHERE active = true'],
        frequency: 5,
        firstSeen: '2024-01-01T10:00:00Z',
        lastSeen: '2024-01-02T15:00:00Z'
      }
    ],
    metadata: {
      extractionVersion: '0.5.1',
      filesModified: ['db/queries.ts'],
      relevanceScore: 0.75,
      duration: 600000,
      toolCounts: { Read: 10, Edit: 2 },
      entryCount: 15,
      toolsUsed: ['Read', 'Edit']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    retriever = new ContextRetriever();
    mockFileStore = (FileStore as any).mock.instances[0];
  });

  describe('fetchRelevantContext', () => {
    it('should fetch contexts for project scope', async () => {
      mockFileStore.getProjectContexts = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.fetchRelevantContext({
        query: 'authentication',
        limit: 5,
        scope: 'project',
        minRelevance: 0.5
      });

      expect(mockFileStore.getProjectContexts).toHaveBeenCalled();
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should fetch contexts for global scope', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.fetchRelevantContext({
        query: 'database',
        limit: 5,
        scope: 'global',
        minRelevance: 0.5
      });

      expect(mockFileStore.searchAll).toHaveBeenCalled();
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should filter by minimum relevance', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.fetchRelevantContext({
        query: 'authentication',
        limit: 10,
        scope: 'global',
        minRelevance: 0.8
      });

      results.forEach(context => {
        expect(context.metadata.relevanceScore).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should handle empty query', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.fetchRelevantContext({
        query: '',
        limit: 10,
        scope: 'global',
        minRelevance: 0.5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should use default values when not provided', async () => {
      mockFileStore.getProjectContexts = jest.fn().mockResolvedValue([mockContext1]);

      const results = await retriever.fetchRelevantContext({});

      expect(mockFileStore.getProjectContexts).toHaveBeenCalledWith(
        expect.any(String),
        10 // Default limit * 2
      );
    });
  });

  describe('searchArchive', () => {
    it('should search with query', async () => {
      mockFileStore.searchAll = jest.fn().mockImplementation((predicate) => {
        // Simulate filtering based on predicate
        return [mockContext1, mockContext2].filter(predicate);
      });

      const results = await retriever.searchArchive({
        query: 'authentication',
        limit: 10
      });

      expect(mockFileStore.searchAll).toHaveBeenCalledWith(expect.any(Function));
      expect(results).toBeDefined();
    });

    it('should filter by date range', async () => {
      mockFileStore.searchAll = jest.fn().mockImplementation((predicate) => {
        return [mockContext1, mockContext2].filter(predicate);
      });

      const results = await retriever.searchArchive({
        query: 'test',
        dateRange: {
          from: '2024-01-01',
          to: '2024-01-01'
        },
        limit: 10
      });

      expect(mockFileStore.searchAll).toHaveBeenCalled();
    });

    it('should filter by file pattern', async () => {
      mockFileStore.searchAll = jest.fn().mockImplementation((predicate) => {
        return [mockContext1, mockContext2].filter(predicate);
      });

      const results = await retriever.searchArchive({
        query: 'test',
        filePattern: '*.ts',
        limit: 10
      });

      expect(mockFileStore.searchAll).toHaveBeenCalled();
    });

    it('should sort by relevance by default', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.searchArchive({
        query: 'authentication',
        limit: 10
      });

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].relevance).toBeGreaterThanOrEqual(results[i + 1].relevance);
        }
      }
    });

    it('should sort by date when specified', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.searchArchive({
        query: 'test',
        sortBy: 'date',
        limit: 10
      });

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          const date1 = new Date(results[i].context.timestamp).getTime();
          const date2 = new Date(results[i + 1].context.timestamp).getTime();
          expect(date1).toBeGreaterThanOrEqual(date2);
        }
      }
    });

    it('should sort by frequency when specified', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.searchArchive({
        query: 'test',
        sortBy: 'frequency',
        limit: 10
      });

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].matches.length).toBeGreaterThanOrEqual(results[i + 1].matches.length);
        }
      }
    });

    it('should limit results', async () => {
      const manyContexts = Array(20).fill(null).map((_, i) => ({
        ...mockContext1,
        sessionId: `session-${i}`
      }));

      mockFileStore.searchAll = jest.fn().mockResolvedValue(manyContexts);

      const results = await retriever.searchArchive({
        query: 'test',
        limit: 5
      });

      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getBySessionId', () => {
    it('should get context by session ID', async () => {
      mockFileStore.getBySessionId = jest.fn().mockResolvedValue(mockContext1);

      const result = await retriever.getBySessionId('session-1');

      expect(mockFileStore.getBySessionId).toHaveBeenCalledWith('session-1');
      expect(result).toEqual(mockContext1);
    });

    it('should return null for non-existent session', async () => {
      mockFileStore.getBySessionId = jest.fn().mockResolvedValue(null);

      const result = await retriever.getBySessionId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getProjectIndex', () => {
    it('should get project index', async () => {
      const mockIndex: ProjectIndex = {
        projectPath: '/test/project',
        projectHash: 'test-hash',
        sessions: [
          {
            sessionId: 'session-1',
            timestamp: '2024-01-01T10:00:00Z',
            file: 'session-1.json',
            stats: {
              problems: 10,
              implementations: 5,
              decisions: 3,
              patterns: 2
            },
            relevanceScore: 0.85
          },
          {
            sessionId: 'session-2',
            timestamp: '2024-01-02T15:00:00Z',
            file: 'session-2.json',
            stats: {
              problems: 10,
              implementations: 3,
              decisions: 2,
              patterns: 3
            },
            relevanceScore: 0.75
          }
        ],
        totalProblems: 20,
        totalImplementations: 8,
        totalDecisions: 5,
        totalPatterns: 5,
        lastUpdated: '2024-01-02T15:00:00Z',
        created: '2024-01-01T10:00:00Z'
      };

      mockFileStore.getProjectIndex = jest.fn().mockResolvedValue(mockIndex);

      const result = await retriever.getProjectIndex('/test/project');

      expect(mockFileStore.getProjectIndex).toHaveBeenCalledWith('/test/project');
      expect(result).toEqual(mockIndex);
    });

    it('should return null for non-existent project', async () => {
      mockFileStore.getProjectIndex = jest.fn().mockResolvedValue(null);

      const result = await retriever.getProjectIndex('/unknown/project');

      expect(result).toBeNull();
    });
  });

  describe('getRecentContexts', () => {
    it('should return recent contexts sorted by timestamp', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const results = await retriever.getRecentContexts(10);

      expect(mockFileStore.searchAll).toHaveBeenCalledWith(expect.any(Function));
      // Should be sorted by timestamp descending
      if (results.length > 1) {
        expect(results[0].timestamp).toBe('2024-01-02T15:00:00Z'); // More recent
        expect(results[1].timestamp).toBe('2024-01-01T10:00:00Z');
      }
    });

    it('should limit results', async () => {
      const manyContexts = Array(20).fill(null).map((_, i) => ({
        ...mockContext1,
        sessionId: `session-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString()
      }));

      mockFileStore.searchAll = jest.fn().mockResolvedValue(manyContexts);

      const results = await retriever.getRecentContexts(5);

      expect(results).toHaveLength(5);
    });

    it('should use default limit of 10', async () => {
      const manyContexts = Array(20).fill(null).map((_, i) => ({
        ...mockContext1,
        sessionId: `session-${i}`
      }));

      mockFileStore.searchAll = jest.fn().mockResolvedValue(manyContexts);

      const results = await retriever.getRecentContexts();

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty storage', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([]);

      const results = await retriever.getRecentContexts(10);

      expect(results).toEqual([]);
    });

    it('should handle storage errors gracefully', async () => {
      mockFileStore.searchAll = jest.fn().mockRejectedValue(new Error('Storage error'));

      // The actual implementation might throw or return empty array
      // Check what the actual behavior is
      await expect(retriever.getRecentContexts(10)).rejects.toThrow('Storage error');
    });
  });
});