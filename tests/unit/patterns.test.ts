/**
 * Tests for PatternAnalyzer
 */

import { PatternAnalyzer } from '../../src/core/patterns';
import { Pattern, ExtractedContext, GetPatternsInput } from '../../src/core/types';
import { FileStore } from '../../src/storage/file-store';

// Mock dependencies
jest.mock('../../src/storage/file-store');
jest.mock('../../src/utils/logger');

describe('PatternAnalyzer', () => {
  let analyzer: PatternAnalyzer;
  let mockFileStore: jest.Mocked<FileStore>;

  const mockPattern1: Pattern = {
    id: 'pat-1',
    type: 'command' as const,
    value: 'npm test',
    examples: ['npm test', 'npm test -- --coverage'],
    frequency: 5,
    firstSeen: '2024-01-01T10:00:00Z',
    lastSeen: '2024-01-03T10:00:00Z'
  };

  const mockPattern2: Pattern = {
    id: 'pat-2',
    type: 'code' as const,
    value: 'async/await pattern',
    examples: ['async function fetchData() { ... }'],
    frequency: 3,
    firstSeen: '2024-01-01T10:00:00Z',
    lastSeen: '2024-01-02T10:00:00Z'
  };

  const mockContext1: ExtractedContext = {
    sessionId: 'session-1',
    timestamp: '2024-01-01T10:00:00Z',
    projectPath: '/test/project',
    extractedAt: 'preCompact',
    problems: [],
    implementations: [],
    decisions: [],
    patterns: [mockPattern1],
    metadata: {
      extractionVersion: '0.5.1',
      filesModified: ['test.ts'],
      relevanceScore: 0.85,
      duration: 300000,
      toolCounts: { Bash: 5 },
      entryCount: 10,
      toolsUsed: ['Bash']
    }
  };

  const mockContext2: ExtractedContext = {
    sessionId: 'session-2',
    timestamp: '2024-01-02T10:00:00Z',
    projectPath: '/test/project',
    extractedAt: 'preCompact',
    problems: [],
    implementations: [],
    decisions: [],
    patterns: [mockPattern2],
    metadata: {
      extractionVersion: '0.5.1',
      filesModified: ['async.ts'],
      relevanceScore: 0.75,
      duration: 600000,
      toolCounts: { Edit: 3 },
      entryCount: 15,
      toolsUsed: ['Edit']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileStore = new FileStore() as jest.Mocked<FileStore>;
    analyzer = new PatternAnalyzer(mockFileStore);
  });

  describe('getPatterns', () => {
    it('should get all patterns when type is "all"', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 2,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      expect(patterns).toHaveLength(2);
      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'command',
        value: 'npm test'
      }));
      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'code',
        value: 'async/await pattern'
      }));
    });

    it('should filter patterns by type', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const input: GetPatternsInput = {
        type: 'command',
        minFrequency: 2,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe('command');
    });

    it('should filter patterns by minimum frequency', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, mockContext2]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 4,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      // Only npm test pattern has frequency >= 4
      expect(patterns).toHaveLength(1);
      expect(patterns[0].frequency).toBeGreaterThanOrEqual(4);
    });

    it('should respect limit parameter', async () => {
      const manyPatterns = Array(20).fill(null).map((_, i) => ({
        id: `pat-${i}`,
        type: 'command' as const,
        value: `pattern-${i}`,
        examples: [],
        frequency: i + 1,
        firstSeen: '2024-01-01T10:00:00Z',
        lastSeen: '2024-01-03T10:00:00Z'
      }));

      const contextWithManyPatterns = {
        ...mockContext1,
        patterns: manyPatterns
      };

      mockFileStore.searchAll = jest.fn().mockResolvedValue([contextWithManyPatterns]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 1,
        limit: 5
      };

      const patterns = await analyzer.getPatterns(input);

      expect(patterns.length).toBeLessThanOrEqual(5);
    });

    it('should filter by project path when provided', async () => {
      mockFileStore.getProjectContexts = jest.fn().mockResolvedValue([mockContext1]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 2,
        projectPath: '/test/project',
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      expect(mockFileStore.getProjectContexts).toHaveBeenCalledWith('/test/project');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].value).toBe('npm test');
    });

    it('should aggregate patterns across contexts', async () => {
      // Create contexts with the same pattern
      const context3 = {
        ...mockContext1,
        sessionId: 'session-3',
        patterns: [{ ...mockPattern1, frequency: 3 }]
      };

      mockFileStore.searchAll = jest.fn().mockResolvedValue([mockContext1, context3]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 2,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      // Should combine frequencies
      const npmTestPattern = patterns.find(p => p.value === 'npm test');
      expect(npmTestPattern).toBeDefined();
      expect(npmTestPattern?.frequency).toBe(8); // 5 + 3
    });

    it('should handle empty contexts', async () => {
      mockFileStore.searchAll = jest.fn().mockResolvedValue([]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 2,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      expect(patterns).toEqual([]);
    });

    it('should handle contexts without patterns', async () => {
      const contextWithoutPatterns = {
        ...mockContext1,
        patterns: []
      };

      mockFileStore.searchAll = jest.fn().mockResolvedValue([contextWithoutPatterns]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 2,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      expect(patterns).toEqual([]);
    });

    it('should sort patterns by frequency descending', async () => {
      const patterns = [
        { ...mockPattern1, frequency: 3 },
        { ...mockPattern2, frequency: 10 },
        { ...mockPattern1, value: 'npm build', frequency: 5 }
      ];

      const contextWithPatterns = {
        ...mockContext1,
        patterns
      };

      mockFileStore.searchAll = jest.fn().mockResolvedValue([contextWithPatterns]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 1,
        limit: 10
      };

      const result = await analyzer.getPatterns(input);

      // Should be sorted by frequency descending
      expect(result[0].frequency).toBe(10);
      expect(result[1].frequency).toBe(5);
      expect(result[2].frequency).toBe(3);
    });

    it('should handle different pattern types', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pat-code-1',
          type: 'code' as const,
          value: 'React component',
          examples: [],
          frequency: 4,
          firstSeen: '2024-01-01T10:00:00Z',
          lastSeen: '2024-01-03T10:00:00Z'
        },
        {
          id: 'pat-arch-1',
          type: 'architecture' as const,
          value: 'Dependency injection',
          examples: [],
          frequency: 3,
          firstSeen: '2024-01-01T10:00:00Z',
          lastSeen: '2024-01-03T10:00:00Z'
        },
        {
          id: 'pat-err-1',
          type: 'error-handling' as const,
          value: 'Try-catch pattern',
          examples: [],
          frequency: 5,
          firstSeen: '2024-01-01T10:00:00Z',
          lastSeen: '2024-01-03T10:00:00Z'
        }
      ];

      const contextWithPatterns = {
        ...mockContext1,
        patterns
      };

      mockFileStore.searchAll = jest.fn().mockResolvedValue([contextWithPatterns]);

      // Test filtering by architecture type
      const input: GetPatternsInput = {
        type: 'architecture',
        minFrequency: 1,
        limit: 10
      };

      const result = await analyzer.getPatterns(input);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('architecture');
    });

    it('should handle storage errors gracefully', async () => {
      mockFileStore.searchAll = jest.fn().mockRejectedValue(new Error('Storage error'));

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 2,
        limit: 10
      };

      await expect(analyzer.getPatterns(input)).rejects.toThrow('Storage error');
    });
  });

  describe('pattern merging', () => {
    it('should merge patterns with same type and value', async () => {
      const pattern1 = {
        id: 'pat-git-1',
        type: 'command' as const,
        value: 'git commit',
        examples: ['git commit -m "fix"'],
        frequency: 3,
        firstSeen: '2024-01-01T10:00:00Z',
        lastSeen: '2024-01-03T10:00:00Z'
      };

      const pattern2 = {
        id: 'pat-git-2',
        type: 'command' as const,
        value: 'git commit',
        examples: ['git commit -m "feat"'],
        frequency: 2,
        firstSeen: '2024-01-01T10:00:00Z',
        lastSeen: '2024-01-03T10:00:00Z'
      };

      const context1 = { ...mockContext1, patterns: [pattern1] };
      const context2 = { ...mockContext2, patterns: [pattern2] };

      mockFileStore.searchAll = jest.fn().mockResolvedValue([context1, context2]);

      const input: GetPatternsInput = {
        type: 'all',
        minFrequency: 1,
        limit: 10
      };

      const patterns = await analyzer.getPatterns(input);

      const gitCommitPattern = patterns.find(p => p.value === 'git commit');
      expect(gitCommitPattern).toBeDefined();
      expect(gitCommitPattern?.frequency).toBe(5); // 3 + 2
      expect(gitCommitPattern?.examples).toContain('git commit -m "fix"');
      expect(gitCommitPattern?.examples).toContain('git commit -m "feat"');
    });
  });
});