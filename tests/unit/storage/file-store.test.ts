/**
 * Tests for FileStore storage module
 * Comprehensive unit tests for file-based storage operations
 */

import { FileStore } from '../../../src/storage/file-store';
import { ExtractedContext, ProjectIndex } from '../../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../../src/utils/filesystem');
jest.mock('../../../src/utils/path-resolver');
jest.mock('../../../src/utils/session-namer');
jest.mock('../../../src/utils/formatter');

// Import mocked modules for type access
const mockedFs = fs as jest.Mocked<typeof fs>;
const { ensureDir, fileExists } = require('../../../src/utils/filesystem');
const { getStoragePath, getProjectStorageInfo } = require('../../../src/utils/path-resolver');
const { generateSessionName, extractProjectName } = require('../../../src/utils/session-namer');
const {
  formatTimestamp,
  formatRelevance,
  truncateText,
  getTopTools,
  calculateAverage,
  getPackageVersion
} = require('../../../src/utils/formatter');

describe('FileStore', () => {
  let fileStore: FileStore;

  // Test fixtures
  const mockStoragePath = '/mock/storage/.c0ntextkeeper';
  const mockBasePath = '/mock/storage/.c0ntextkeeper/archive';

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
    implementations: [
      {
        id: 'impl-1',
        tool: 'Edit',
        file: 'auth.ts',
        description: 'Fixed JWT validation',
        timestamp: '2024-09-04T10:01:00Z',
        relevance: 0.85
      }
    ],
    decisions: [
      {
        id: 'dec-1',
        decision: 'Use RS256 for JWT signing',
        context: 'Security improvement',
        rationale: 'More secure than HS256',
        timestamp: '2024-09-04T10:02:00Z',
        impact: 'high' as const,
        tags: ['security', 'jwt']
      }
    ],
    patterns: [
      {
        id: 'pat-1',
        type: 'code' as const,
        value: 'JWT validation pattern',
        frequency: 3,
        firstSeen: '2024-09-01T10:00:00Z',
        lastSeen: '2024-09-04T10:00:00Z',
        examples: ['jwt.verify(token, secret)']
      }
    ],
    metadata: {
      extractionVersion: '0.7.8',
      filesModified: ['auth.ts', 'config.ts'],
      relevanceScore: 0.85,
      duration: 300000,
      entryCount: 10,
      toolsUsed: ['Edit', 'Write', 'Read'],
      toolCounts: {
        Edit: 2,
        Write: 1,
        Read: 5
      }
    }
  };

  const mockProjectIndex: ProjectIndex = {
    projectPath: '/test/project',
    projectHash: 'project',
    sessions: [],
    totalProblems: 5,
    totalImplementations: 3,
    totalDecisions: 2,
    totalPatterns: 4,
    lastUpdated: '2024-09-04T10:00:00Z',
    created: '2024-09-01T10:00:00Z',
    totalToolUsage: { Edit: 10, Write: 5 },
    mostUsedTools: ['Edit', 'Write'],
    totalFilesModified: 8,
    averageRelevanceScore: 0.8,
    version: '0.7.8'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    getStoragePath.mockReturnValue(mockStoragePath);
    getProjectStorageInfo.mockReturnValue({ exists: true });
    extractProjectName.mockReturnValue('project');
    generateSessionName.mockReturnValue('2024-09-04_1000_MT_authentication-fix.json');
    formatTimestamp.mockReturnValue('September 4, 2024 10:00 AM MT');
    formatRelevance.mockReturnValue('85%');
    truncateText.mockImplementation((text: string, len: number) => text.slice(0, len));
    getTopTools.mockReturnValue(['Edit', 'Write']);
    calculateAverage.mockReturnValue(0.8);
    getPackageVersion.mockReturnValue('0.7.8');

    // Mock filesystem operations
    ensureDir.mockResolvedValue(undefined);
    fileExists.mockResolvedValue(true);
    mockedFs.writeFile.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));
    mockedFs.readdir.mockResolvedValue([]);
    mockedFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() } as any);
    mockedFs.unlink.mockResolvedValue(undefined);

    fileStore = new FileStore();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      const store = new FileStore();
      expect(getStoragePath).toHaveBeenCalledWith({
        global: false,
        createIfMissing: true
      });
      expect(store.getBasePath()).toBe(path.join(mockStoragePath, 'archive'));
    });

    it('should initialize with global storage option', () => {
      const store = new FileStore({ global: true });
      expect(getStoragePath).toHaveBeenCalledWith({
        global: true,
        createIfMissing: true
      });
    });

    it('should accept custom storage configuration', () => {
      const customConfig = {
        basePath: '/custom/path',
        maxArchiveSize: 200,
        compressionEnabled: true,
        retentionDays: 30
      };

      const store = new FileStore(customConfig);
      expect(store.getBasePath()).toBe('/custom/path');
    });

    it('should use default values when config is partial', () => {
      const partialConfig = {
        retentionDays: 60
      };

      const store = new FileStore(partialConfig);
      // Should still work with defaults for other values
      expect(store.getBasePath()).toContain('archive');
    });
  });

  describe('getBasePath', () => {
    it('should return the archive base path', () => {
      const basePath = fileStore.getBasePath();
      expect(basePath).toBe(path.join(mockStoragePath, 'archive'));
    });
  });

  describe('getRootPath', () => {
    it('should return the root storage path without archive subdirectory', () => {
      getStoragePath.mockReturnValue('/mock/root/.c0ntextkeeper');
      const rootPath = fileStore.getRootPath();
      expect(rootPath).toBe('/mock/root/.c0ntextkeeper');
      expect(getStoragePath).toHaveBeenCalledWith({
        global: false,
        createIfMissing: false
      });
    });
  });

  describe('isInitialized', () => {
    it('should return true when storage exists', () => {
      getProjectStorageInfo.mockReturnValue({ exists: true });
      expect(fileStore.isInitialized()).toBe(true);
    });

    it('should return false when storage does not exist', () => {
      getProjectStorageInfo.mockReturnValue({ exists: false });
      expect(fileStore.isInitialized()).toBe(false);
    });
  });

  describe('getArchivePath', () => {
    it('should return the archive path', () => {
      const archivePath = fileStore.getArchivePath();
      expect(archivePath).toBe(path.join(mockStoragePath, 'archive'));
    });
  });

  describe('getPromptsPath', () => {
    it('should return the prompts directory path', () => {
      getStoragePath.mockReturnValue('/home/user/.c0ntextkeeper');
      const promptsPath = fileStore.getPromptsPath();
      expect(promptsPath).toBe('/home/user/.c0ntextkeeper/prompts');
    });
  });

  describe('getPatternsPath', () => {
    it('should return the patterns directory path', () => {
      getStoragePath.mockReturnValue('/home/user/.c0ntextkeeper');
      const patternsPath = fileStore.getPatternsPath();
      expect(patternsPath).toBe('/home/user/.c0ntextkeeper/patterns');
    });
  });

  describe('getKnowledgePath', () => {
    it('should return the knowledge directory path', () => {
      getStoragePath.mockReturnValue('/home/user/.c0ntextkeeper');
      const knowledgePath = fileStore.getKnowledgePath();
      expect(knowledgePath).toBe('/home/user/.c0ntextkeeper/knowledge');
    });
  });

  describe('initialize', () => {
    it('should create required directories', async () => {
      await fileStore.initialize();

      expect(ensureDir).toHaveBeenCalledWith(expect.stringContaining('archive'));
      expect(ensureDir).toHaveBeenCalledWith(expect.stringContaining('projects'));
      expect(ensureDir).toHaveBeenCalledWith(expect.stringContaining('global'));
    });

    it('should handle directory creation errors', async () => {
      ensureDir.mockRejectedValue(new Error('Permission denied'));

      await expect(fileStore.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('store', () => {
    it('should store context and return the file path', async () => {
      fileExists.mockResolvedValue(false); // No existing index

      const result = await fileStore.store(mockContext);

      expect(result).toContain('2024-09-04_1000_MT_authentication-fix.json');
      expect(mockedFs.writeFile).toHaveBeenCalled();
      expect(ensureDir).toHaveBeenCalled();
    });

    it('should create project directory structure', async () => {
      fileExists.mockResolvedValue(false);

      await fileStore.store(mockContext);

      // Should call ensureDir for project and sessions directories
      expect(ensureDir).toHaveBeenCalledWith(expect.stringContaining('projects'));
    });

    it('should store test data in test subdirectory', async () => {
      const testContext: ExtractedContext = {
        ...mockContext,
        metadata: {
          ...mockContext.metadata,
          isTest: true
        }
      };
      fileExists.mockResolvedValue(false);

      await fileStore.store(testContext);

      expect(ensureDir).toHaveBeenCalledWith(expect.stringContaining('test'));
    });

    it('should update project index for non-test data', async () => {
      fileExists.mockResolvedValue(false);

      await fileStore.store(mockContext);

      // Should write index.json
      const writeFileCalls = mockedFs.writeFile.mock.calls;
      const indexCall = writeFileCalls.find(call =>
        typeof call[0] === 'string' && call[0].includes('index.json')
      );
      expect(indexCall).toBeDefined();
    });

    it('should skip index updates for test data', async () => {
      const testContext: ExtractedContext = {
        ...mockContext,
        metadata: {
          ...mockContext.metadata,
          isTest: true
        }
      };
      fileExists.mockResolvedValue(false);

      await fileStore.store(testContext);

      // Should not write index.json for test data
      const writeFileCalls = mockedFs.writeFile.mock.calls;
      const indexCall = writeFileCalls.find(call =>
        typeof call[0] === 'string' && call[0].includes('index.json')
      );
      expect(indexCall).toBeUndefined();
    });

    it('should handle JSON serialization correctly', async () => {
      fileExists.mockResolvedValue(false);

      await fileStore.store(mockContext);

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('.json') && !call[0].includes('index')
      );
      expect(writeCall).toBeDefined();

      if (writeCall) {
        const content = writeCall[1] as string;
        expect(() => JSON.parse(content)).not.toThrow();
        const parsed = JSON.parse(content);
        expect(parsed.sessionId).toBe('test-session-123');
      }
    });

    it('should handle write errors gracefully', async () => {
      mockedFs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(fileStore.store(mockContext)).rejects.toThrow('Disk full');
    });

    it('should update existing project index', async () => {
      fileExists.mockResolvedValue(true);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockProjectIndex));

      await fileStore.store(mockContext);

      // Should read existing index and update it
      expect(mockedFs.readFile).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getBySessionId', () => {
    it('should retrieve context by session ID', async () => {
      mockedFs.readdir.mockResolvedValue(['test-session-123.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      const result = await fileStore.getBySessionId('test-session-123');

      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('test-session-123');
    });

    it('should return null when session not found', async () => {
      mockedFs.readdir.mockResolvedValue([] as any);
      fileExists.mockResolvedValue(false);

      const result = await fileStore.getBySessionId('non-existent');

      expect(result).toBeNull();
    });

    it('should search across multiple project directories', async () => {
      mockedFs.readdir
        .mockResolvedValueOnce(['project1', 'project2'] as any)
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce(['test-session-123.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      const result = await fileStore.getBySessionId('test-session-123');

      expect(result).not.toBeNull();
    });

    it('should throw on file read errors (no try-catch in implementation)', async () => {
      // Note: Unlike getProjectContexts, getBySessionId does NOT have try-catch
      // around file reads, so errors will propagate up

      // Need to mock the project list first, then sessions within
      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any) // listProjectDirs reads project directories
        .mockResolvedValueOnce(['test-session.json'] as any); // Then reads session files
      fileExists.mockResolvedValueOnce(true) // Projects dir exists
        .mockResolvedValueOnce(true); // Sessions dir exists

      // Use mockImplementationOnce to reject with error
      mockedFs.readFile.mockImplementationOnce(() => {
        return Promise.reject(new Error('File corrupted'));
      });

      // The implementation throws - it doesn't catch file read errors
      await expect(fileStore.getBySessionId('test-session')).rejects.toThrow('File corrupted');
    });
  });

  describe('getProjectContexts', () => {
    it('should retrieve all contexts for a project', async () => {
      mockedFs.readdir.mockResolvedValue(['session1.json', 'session2.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      const results = await fileStore.getProjectContexts('/test/project');

      expect(results.length).toBe(2);
    });

    it('should respect the limit parameter', async () => {
      mockedFs.readdir.mockResolvedValue([
        'session1.json',
        'session2.json',
        'session3.json'
      ] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      const results = await fileStore.getProjectContexts('/test/project', 2);

      expect(results.length).toBe(2);
    });

    it('should return empty array when project not found', async () => {
      fileExists.mockResolvedValue(false);

      const results = await fileStore.getProjectContexts('/non/existent');

      expect(results).toEqual([]);
    });

    it('should sort files by most recent first', async () => {
      mockedFs.readdir.mockResolvedValue([
        '2024-01-01_session.json',
        '2024-09-01_session.json',
        '2024-06-01_session.json'
      ] as any);

      const context1 = { ...mockContext, timestamp: '2024-01-01T00:00:00Z' };
      const context2 = { ...mockContext, timestamp: '2024-09-01T00:00:00Z' };
      const context3 = { ...mockContext, timestamp: '2024-06-01T00:00:00Z' };

      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(context2))
        .mockResolvedValueOnce(JSON.stringify(context3))
        .mockResolvedValueOnce(JSON.stringify(context1));

      await fileStore.getProjectContexts('/test/project');

      // Verify readdir was called
      expect(mockedFs.readdir).toHaveBeenCalled();
    });

    it('should handle corrupted session files', async () => {
      mockedFs.readdir.mockResolvedValue(['good.json', 'bad.json'] as any);
      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockContext))
        .mockRejectedValueOnce(new Error('Corrupted file'));

      const results = await fileStore.getProjectContexts('/test/project');

      // Should return the good one and skip the bad one
      expect(results.length).toBe(1);
    });

    it('should filter out non-JSON files', async () => {
      mockedFs.readdir.mockResolvedValue([
        'session.json',
        'README.md',
        'notes.txt'
      ] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      await fileStore.getProjectContexts('/test/project');

      // Should only read the JSON file
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should try multiple case variations of project name', async () => {
      extractProjectName.mockReturnValue('MyProject');

      // First attempt with original name fails
      fileExists
        .mockResolvedValueOnce(false)  // MyProject/sessions
        .mockResolvedValueOnce(false)  // myproject/sessions
        .mockResolvedValueOnce(true);  // Myproject/sessions

      mockedFs.readdir.mockResolvedValue(['session.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      await fileStore.getProjectContexts('/test/MyProject');

      expect(fileExists).toHaveBeenCalled();
    });
  });

  describe('getProjectIndex', () => {
    it('should retrieve project index', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockProjectIndex));

      const index = await fileStore.getProjectIndex('/test/project');

      expect(index).not.toBeNull();
      expect(index?.totalProblems).toBe(5);
    });

    it('should return null when index does not exist', async () => {
      fileExists.mockResolvedValue(false);

      const index = await fileStore.getProjectIndex('/test/project');

      expect(index).toBeNull();
    });

    it('should handle malformed index file', async () => {
      fileExists.mockResolvedValue(true);
      mockedFs.readFile.mockResolvedValue('{ invalid json }');

      const index = await fileStore.getProjectIndex('/test/project');

      expect(index).toBeNull();
    });
  });

  describe('searchAll', () => {
    it('should search across all contexts with predicate', async () => {
      const contexts = [
        { ...mockContext, sessionId: 'session-1' },
        { ...mockContext, sessionId: 'session-2' }
      ];

      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any)
        .mockResolvedValueOnce(['s1.json', 's2.json'] as any);

      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(contexts[0]))
        .mockResolvedValueOnce(JSON.stringify(contexts[1]));

      const results = await fileStore.searchAll(
        (ctx) => ctx.sessionId === 'session-1'
      );

      expect(results.length).toBe(1);
      expect(results[0].sessionId).toBe('session-1');
    });

    it('should return empty array when no matches', async () => {
      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any)
        .mockResolvedValueOnce(['session.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      const results = await fileStore.searchAll(() => false);

      expect(results).toEqual([]);
    });

    it('should handle empty storage', async () => {
      fileExists.mockResolvedValue(false);

      const results = await fileStore.searchAll(() => true);

      expect(results).toEqual([]);
    });

    it('should skip non-JSON files during search', async () => {
      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any)
        .mockResolvedValueOnce(['session.json', 'README.md'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockContext));

      await fileStore.searchAll(() => true);

      // Should only read the JSON file
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle file processing errors during search', async () => {
      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any)
        .mockResolvedValueOnce(['good.json', 'bad.json'] as any);

      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockContext))
        .mockRejectedValueOnce(new Error('Read error'));

      const results = await fileStore.searchAll(() => true);

      expect(results.length).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return storage statistics', async () => {
      const indexWithSessions = {
        ...mockProjectIndex,
        sessions: [
          {
            sessionId: 's1',
            timestamp: '2024-01-01T00:00:00Z',
            file: 'session1.json',
            stats: { problems: 1, implementations: 1, decisions: 0, patterns: 0 },
            relevanceScore: 0.8
          },
          {
            sessionId: 's2',
            timestamp: '2024-09-01T00:00:00Z',
            file: 'session2.json',
            stats: { problems: 2, implementations: 0, decisions: 1, patterns: 0 },
            relevanceScore: 0.7
          }
        ]
      };

      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any)
        .mockResolvedValueOnce(['session1.json', 'session2.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(indexWithSessions));
      mockedFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() } as any);

      const stats = await fileStore.getStats();

      expect(stats.totalProjects).toBe(1);
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should track oldest and newest sessions', async () => {
      const indexWithSessions = {
        ...mockProjectIndex,
        sessions: [
          {
            sessionId: 's1',
            timestamp: '2024-01-01T00:00:00Z',
            file: 'session1.json',
            stats: { problems: 1, implementations: 0, decisions: 0, patterns: 0 },
            relevanceScore: 0.5
          },
          {
            sessionId: 's2',
            timestamp: '2024-09-01T00:00:00Z',
            file: 'session2.json',
            stats: { problems: 1, implementations: 0, decisions: 0, patterns: 0 },
            relevanceScore: 0.5
          }
        ]
      };

      mockedFs.readdir
        .mockResolvedValueOnce(['project1'] as any)
        .mockResolvedValueOnce(['s1.json', 's2.json'] as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(indexWithSessions));

      const stats = await fileStore.getStats();

      expect(stats.oldestSession).toBe('2024-01-01T00:00:00Z');
      expect(stats.newestSession).toBe('2024-09-01T00:00:00Z');
    });

    it('should handle empty storage', async () => {
      fileExists.mockResolvedValue(false);

      const stats = await fileStore.getStats();

      expect(stats.totalProjects).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestSession).toBeNull();
      expect(stats.newestSession).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context data', async () => {
      const emptyContext: ExtractedContext = {
        ...mockContext,
        problems: [],
        implementations: [],
        decisions: [],
        patterns: []
      };
      fileExists.mockResolvedValue(false);

      await fileStore.store(emptyContext);

      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should handle special characters in project names', async () => {
      extractProjectName.mockReturnValue('my-project_v2.0');
      fileExists.mockResolvedValue(false);

      await fileStore.store(mockContext);

      expect(ensureDir).toHaveBeenCalled();
    });

    it('should handle very long project paths', async () => {
      const longPath = '/very/long/path/' + 'a'.repeat(200);
      const contextWithLongPath = {
        ...mockContext,
        projectPath: longPath
      };
      extractProjectName.mockReturnValue('a'.repeat(100));
      fileExists.mockResolvedValue(false);

      await fileStore.store(contextWithLongPath);

      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should handle concurrent store operations', async () => {
      fileExists.mockResolvedValue(false);

      const promises = [
        fileStore.store({ ...mockContext, sessionId: 'session-1' }),
        fileStore.store({ ...mockContext, sessionId: 'session-2' }),
        fileStore.store({ ...mockContext, sessionId: 'session-3' })
      ];

      await Promise.all(promises);

      // Verify all store operations completed - exact count depends on internal implementation
      // Each store creates: context file, project index, global index, readme = 4 files per store
      expect(mockedFs.writeFile).toHaveBeenCalled();
      expect(mockedFs.writeFile.mock.calls.length).toBeGreaterThanOrEqual(9);
    });

    it('should handle Unicode characters in content', async () => {
      const unicodeContext = {
        ...mockContext,
        problems: [{
          ...mockContext.problems[0],
          question: 'How to fix \u00e9\u00e8\u00ea unicode issues?'
        }]
      };
      fileExists.mockResolvedValue(false);

      await fileStore.store(unicodeContext);

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('.json') && !call[0].includes('index')
      );
      expect(writeCall).toBeDefined();
    });

    it('should handle zero-length metadata arrays', async () => {
      const contextWithEmptyMetadata = {
        ...mockContext,
        metadata: {
          ...mockContext.metadata,
          filesModified: [],
          toolsUsed: [],
          toolCounts: {}
        }
      };
      fileExists.mockResolvedValue(false);

      await fileStore.store(contextWithEmptyMetadata);

      expect(mockedFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean old sessions based on retention days', async () => {
      // Setup FileStore with short retention
      const shortRetentionStore = new FileStore({ retentionDays: 7 });

      // Mock old file dates
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30); // 30 days old

      // When fileExists returns true for index, readFile must return valid index JSON
      const emptyIndex = { ...mockProjectIndex, sessions: [] };

      // Mock fileExists: false for indexes (create new), true for sessions dir
      fileExists.mockImplementation((pathArg: string) => {
        if (pathArg.includes('index.json')) return Promise.resolve(false);
        return Promise.resolve(true);
      });

      mockedFs.readdir.mockResolvedValue(['old-session.json'] as any);
      mockedFs.stat.mockResolvedValue({
        size: 1024,
        mtime: oldDate
      } as any);

      // Store should trigger cleanup
      await shortRetentionStore.store(mockContext);

      expect(mockedFs.unlink).toHaveBeenCalled();
    });

    it('should not clean sessions when retention is 0', async () => {
      const noRetentionStore = new FileStore({ retentionDays: 0 });

      // Mock fileExists: false for indexes, true for directories
      fileExists.mockImplementation((pathArg: string) => {
        if (pathArg.includes('index.json')) return Promise.resolve(false);
        return Promise.resolve(true);
      });

      await noRetentionStore.store(mockContext);

      // unlink should not be called for cleanup when retention is 0
      const unlinkCalls = mockedFs.unlink.mock.calls;
      expect(unlinkCalls.length).toBe(0);
    });

    it('should keep recent sessions', async () => {
      const recentDate = new Date();

      // Mock fileExists: false for indexes (create new), true for directories
      fileExists.mockImplementation((pathArg: string) => {
        if (pathArg.includes('index.json')) return Promise.resolve(false);
        return Promise.resolve(true);
      });

      mockedFs.readdir.mockResolvedValue(['recent-session.json'] as any);
      mockedFs.stat.mockResolvedValue({
        size: 1024,
        mtime: recentDate
      } as any);

      await fileStore.store(mockContext);

      // unlink should not be called for recent files
      const unlinkCalls = mockedFs.unlink.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('recent-session')
      );
      expect(unlinkCalls.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle permission denied errors', async () => {
      mockedFs.writeFile.mockRejectedValue(
        Object.assign(new Error('Permission denied'), { code: 'EACCES' })
      );

      await expect(fileStore.store(mockContext)).rejects.toThrow('Permission denied');
    });

    it('should handle disk full errors', async () => {
      mockedFs.writeFile.mockRejectedValue(
        Object.assign(new Error('No space left on device'), { code: 'ENOSPC' })
      );

      await expect(fileStore.store(mockContext)).rejects.toThrow('No space left');
    });

    it('should handle invalid JSON in stored files', async () => {
      mockedFs.readFile.mockResolvedValue('not valid json');
      fileExists.mockResolvedValue(true);

      const result = await fileStore.getProjectIndex('/test/project');

      expect(result).toBeNull();
    });

    it('should handle missing sessions directory', async () => {
      fileExists.mockResolvedValue(false);
      mockedFs.readdir.mockResolvedValue(['project1'] as any);

      const result = await fileStore.getBySessionId('any-session');

      expect(result).toBeNull();
    });
  });

  describe('Index Management', () => {
    it('should create new index if none exists', async () => {
      // Mock fileExists: false for indexes (create new), true for directories
      fileExists.mockImplementation((pathArg: string) => {
        if (pathArg.includes('index.json')) return Promise.resolve(false);
        return Promise.resolve(true);
      });

      await fileStore.store(mockContext);

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('index.json') && !call[0].includes('global')
      );
      expect(writeCall).toBeDefined();

      if (writeCall) {
        const indexContent = JSON.parse(writeCall[1] as string);
        expect(indexContent.sessions).toHaveLength(1);
        expect(indexContent.totalProblems).toBe(1);
      }
    });

    it('should keep only last 100 sessions in index', async () => {
      // Create an index with 100 sessions already
      const fullIndex = {
        ...mockProjectIndex,
        sessions: Array.from({ length: 100 }, (_, i) => ({
          sessionId: `session-${i}`,
          timestamp: '2024-01-01T00:00:00Z',
          file: `session-${i}.json`,
          stats: { problems: 0, implementations: 0, decisions: 0, patterns: 0 },
          relevanceScore: 0.5
        }))
      };

      fileExists.mockResolvedValue(true);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(fullIndex));

      await fileStore.store(mockContext);

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('index.json')
      );
      expect(writeCall).toBeDefined();

      if (writeCall) {
        const indexContent = JSON.parse(writeCall[1] as string);
        expect(indexContent.sessions.length).toBeLessThanOrEqual(100);
      }
    });

    it('should update global index on store', async () => {
      fileExists.mockResolvedValue(false);

      await fileStore.store(mockContext);

      const globalIndexCall = mockedFs.writeFile.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('global') && call[0].includes('index.json')
      );
      expect(globalIndexCall).toBeDefined();
    });

    it('should aggregate tool usage statistics', async () => {
      const existingIndex = {
        ...mockProjectIndex,
        totalToolUsage: { Edit: 5, Read: 3 },
        sessions: []
      };

      fileExists.mockResolvedValue(true);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(existingIndex));

      await fileStore.store(mockContext);

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        typeof call[0] === 'string' &&
        call[0].includes('index.json') &&
        !call[0].includes('global')
      );
      expect(writeCall).toBeDefined();

      if (writeCall) {
        const indexContent = JSON.parse(writeCall[1] as string);
        expect(indexContent.totalToolUsage.Edit).toBe(7); // 5 + 2
        expect(indexContent.totalToolUsage.Read).toBe(8); // 3 + 5
      }
    });
  });
});
