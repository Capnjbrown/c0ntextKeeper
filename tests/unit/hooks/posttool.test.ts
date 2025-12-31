/**
 * Tests for PostToolUse hook handler
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module before importing the module under test
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock path-resolver to avoid filesystem operations
jest.mock('../../../src/utils/path-resolver', () => ({
  getStoragePath: jest.fn(() => '/mock/.c0ntextkeeper'),
}));

// Mock project-utils
jest.mock('../../../src/utils/project-utils', () => ({
  getHookStoragePath: jest.fn(
    (basePath: string, type: string, _projectPath: string, dateStr: string, filename: string) =>
      `${basePath}/archive/projects/test-project/${type}/${dateStr}/${filename}`
  ),
  getProjectName: jest.fn(() => 'test-project'),
}));

// Mock hook-storage (new per-session storage)
const mockWriteHookData = jest.fn();
jest.mock('../../../src/utils/hook-storage', () => ({
  writeHookData: (basePath: string, hookType: string, workingDir: string, sessionId: string, data: unknown) =>
    mockWriteHookData(basePath, hookType, workingDir, sessionId, data),
  getHookStorageDir: jest.fn(() => '/mock/.c0ntextkeeper/archive/projects/test-project/patterns'),
}));

// Mock test-helpers
jest.mock('../../../src/utils/test-helpers', () => ({
  isTestSession: jest.fn((sessionId: string) =>
    sessionId.includes('test-session') || sessionId.startsWith('test-')
  ),
}));

// Mock FileStore
jest.mock('../../../src/storage/file-store', () => ({
  FileStore: jest.fn().mockImplementation(() => ({
    getBasePath: jest.fn(() => '/mock/.c0ntextkeeper/archive'),
    getRootPath: jest.fn(() => '/mock/.c0ntextkeeper'),
  })),
}));

// Mock SecurityFilter
jest.mock('../../../src/utils/security-filter', () => ({
  SecurityFilter: jest.fn().mockImplementation(() => ({
    filterText: jest.fn((text: string) => text),
    filterObject: jest.fn((obj: any) => obj),
  })),
}));

// Import the module under test AFTER mocks are set up
import {
  extractToolPattern,
  trackErrorPattern,
  processToolUse,
} from '../../../src/hooks/posttool';
import type { PostToolHookInput, ToolPattern } from '../../../src/hooks/posttool';
import { FileStore } from '../../../src/storage/file-store';
import { isTestSession } from '../../../src/utils/test-helpers';

const mockFs = fs as jest.Mocked<typeof fs>;

// Mock process.exit to prevent test termination
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

describe('PostToolUse Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset HOME environment variable for consistent paths
    process.env.HOME = '/mock/home';

    // Default mock implementations
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockFs.appendFileSync.mockReturnValue(undefined);
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.statSync.mockReturnValue({ size: 1000 } as fs.Stats);

    // Reset per-session storage mocks
    mockWriteHookData.mockReset();
    mockWriteHookData.mockReturnValue('/mock/storage/path/patterns/2024-01-15_1030_MT_ion-123-patterns.json');

    // Reset process.exit mock
    mockProcessExit.mockClear();
  });

  afterAll(() => {
    mockProcessExit.mockRestore();
  });

  describe('extractToolPattern', () => {
    describe('standard tools', () => {
      it('should extract pattern for Write tool success', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Write',
          input: { file_path: '/src/index.ts' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Write: /src/index.ts - modified');
      });

      it('should extract pattern for Write tool failure', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Write',
          input: { file_path: '/src/index.ts' },
          result: { error: 'Permission denied' },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Write: /src/index.ts - failed');
      });

      it('should extract pattern for Edit tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Edit',
          input: { file_path: '/src/utils.ts' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Edit: /src/utils.ts - modified');
      });

      it('should extract pattern for MultiEdit tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'MultiEdit',
          input: { file_path: '/src/app.ts' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('MultiEdit: /src/app.ts - modified');
      });

      it('should extract pattern for Bash tool with exit code 0', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Bash',
          input: { command: 'npm install' },
          result: { exit_code: 0 },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Bash: npm - success');
      });

      it('should extract pattern for Bash tool with non-zero exit code', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Bash',
          input: { command: 'git push' },
          result: { exit_code: 1 },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Bash: git - exit 1');
      });

      it('should extract pattern for Read tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Read',
          input: { file_path: '/package.json' },
          result: { content: '{}' },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Read: /package.json - success');
      });

      it('should extract pattern for Grep tool with matches', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Grep',
          input: { pattern: 'TODO' },
          result: { matches: [{}, {}, {}] },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Grep: TODO - 3 matches');
      });

      it('should extract pattern for Glob tool with files', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'Glob',
          input: { pattern: '**/*.ts' },
          result: { files: ['a.ts', 'b.ts'] },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Glob: **/*.ts - 2 matches');
      });

      it('should extract pattern for TodoWrite tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'TodoWrite',
          input: { todos: [{ text: 'Task 1' }, { text: 'Task 2' }] },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('TodoWrite: 2 todos - updated');
      });

      it('should extract pattern for ExitPlanMode tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'ExitPlanMode',
          input: {},
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('ExitPlanMode: plan approved');
      });

      it('should extract pattern for WebSearch tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'WebSearch',
          input: { query: 'typescript best practices' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('WebSearch: "typescript best practices" - success');
      });

      it('should extract pattern for WebFetch tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'WebFetch',
          input: { url: 'https://example.com' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('WebFetch: https://example.com - fetched');
      });
    });

    describe('MCP tools', () => {
      it('should extract pattern for filesystem MCP tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'mcp__filesystem__write_file',
          input: { path: '/src/index.ts' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('MCP filesystem: write file on /src/index.ts - success');
      });

      it('should extract pattern for sequential-thinking MCP tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'mcp__sequential-thinking__sequentialthinking',
          input: { thoughtNumber: 3, totalThoughts: 5 },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('MCP sequential-thinking: sequentialthinking - thought 3 of 5');
      });

      it('should extract pattern for github MCP tool', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'mcp__github__search_code',
          input: { query: 'MCP server' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('MCP github: search code - success');
      });

      it('should handle unknown MCP server', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'mcp__unknown__some_method',
          input: {},
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('MCP unknown: some_method - success');
      });
    });

    describe('unknown tools', () => {
      it('should handle unknown tool with file_path', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'UnknownTool',
          input: { file_path: '/some/file.ts' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('UnknownTool: /some/file.ts - success');
      });

      it('should handle unknown tool with path', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'AnotherTool',
          input: { path: '/another/path' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('AnotherTool: /another/path - success');
      });

      it('should handle unknown tool with query', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'QueryTool',
          input: { query: 'search term' },
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('QueryTool: "search term" - success');
      });

      it('should handle unknown tool with no input', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool: 'MinimalTool',
          input: {},
          result: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('MinimalTool: success');
      });
    });

    describe('production format fields', () => {
      it('should handle production format with tool_name and tool_input', () => {
        const input: PostToolHookInput = {
          hook_event_name: 'PostToolUse',
          session_id: 'session-123',
          tool_name: 'Write',
          tool_input: { file_path: '/src/main.ts' },
          tool_response: { success: true },
        };

        const pattern = extractToolPattern(input);
        expect(pattern).toBe('Write: /src/main.ts - modified');
      });
    });
  });

  describe('trackErrorPattern', () => {
    it('should create error file if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue('[]');

      const pattern: ToolPattern = {
        tool: 'Write',
        success: false,
        error: 'File not found',
        pattern: 'Write: /missing.ts - failed',
        timestamp: '2024-01-15T10:00:00Z',
        sessionId: 'session-123',
        fileModified: '/missing.ts',
      };

      const mockStorage = new FileStore() as jest.Mocked<FileStore>;

      await trackErrorPattern(pattern, mockStorage);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('errors'),
        { recursive: true }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should append to existing error file', async () => {
      const existingErrors = [
        {
          tool: 'Bash',
          error: 'Command not found',
          pattern: 'Bash: unknown - failed',
          timestamp: '2024-01-14T10:00:00Z',
        },
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingErrors));

      const pattern: ToolPattern = {
        tool: 'Write',
        success: false,
        error: 'Permission denied',
        pattern: 'Write: /protected.ts - failed',
        timestamp: '2024-01-15T11:00:00Z',
        sessionId: 'session-456',
      };

      const mockStorage = new FileStore() as jest.Mocked<FileStore>;

      await trackErrorPattern(pattern, mockStorage);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Permission denied'),
        'utf-8'
      );
    });

    it('should handle corrupted error file gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const pattern: ToolPattern = {
        tool: 'Edit',
        success: false,
        error: 'Parse error',
        pattern: 'Edit: /bad.ts - failed',
        timestamp: '2024-01-15T12:00:00Z',
        sessionId: 'session-789',
      };

      const mockStorage = new FileStore() as jest.Mocked<FileStore>;

      // Should not throw
      await expect(trackErrorPattern(pattern, mockStorage)).resolves.not.toThrow();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should include command for Bash errors', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const pattern: ToolPattern = {
        tool: 'Bash',
        success: false,
        error: 'Command failed',
        pattern: 'Bash: npm - exit 1',
        timestamp: '2024-01-15T13:00:00Z',
        sessionId: 'session-abc',
        commandExecuted: 'npm install',
      };

      const mockStorage = new FileStore() as jest.Mocked<FileStore>;

      await trackErrorPattern(pattern, mockStorage);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const writtenContent = writeCall[1] as string;
      const parsed = JSON.parse(writtenContent);

      expect(parsed[0].command).toBe('npm install');
    });
  });

  describe('processToolUse', () => {
    beforeEach(() => {
      // Reset mocks for each test
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue('[]');
      mockWriteHookData.mockReset();
      mockWriteHookData.mockReturnValue('/mock/storage/path/patterns/2024-01-15_1030_MT_ion-123-patterns.json');
    });

    it('should skip test sessions', async () => {
      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session-unit',
        tool: 'Write',
        input: { file_path: '/test.ts' },
        result: { success: true },
      };

      await processToolUse(input);

      // writeHookData should not be called for test sessions
      expect(mockWriteHookData).not.toHaveBeenCalled();
    });

    it('should process valid tool usage and store pattern via writeHookData', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-123',
        tool: 'Write',
        input: { file_path: '/src/app.ts' },
        result: { success: true },
        cwd: '/projects/myapp',
      };

      await processToolUse(input);

      expect(mockWriteHookData).toHaveBeenCalledWith(
        '/mock/.c0ntextkeeper',
        'patterns',
        '/projects/myapp',
        'prod-session-123',
        expect.objectContaining({
          tool: 'Write',
          success: true,
          pattern: 'Write: /src/app.ts - modified',
          sessionId: 'prod-session-123',
          fileModified: '/src/app.ts',
        })
      );
    });

    it('should track errors when tool fails', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);
      mockFs.existsSync.mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-456',
        tool: 'Write',
        input: { file_path: '/protected/file.ts' },
        result: { error: 'Permission denied', success: false },
        cwd: '/projects/myapp',
      };

      await processToolUse(input);

      // Should call writeHookData for pattern storage
      expect(mockWriteHookData).toHaveBeenCalledTimes(1);
      // Should also write to error file (per-day pattern for errors)
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should normalize production format fields', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-789',
        tool_name: 'Edit',
        tool_input: { file_path: '/src/utils.ts' },
        tool_response: { success: true },
        project_path: '/projects/myapp',
      };

      await processToolUse(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as ToolPattern;
      expect(storedData.tool).toBe('Edit');
      expect(storedData.success).toBe(true);
    });

    it('should write each pattern to a unique per-session file', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-unique',
        tool: 'Write',
        input: { file_path: '/new-file.ts' },
        result: { success: true },
        cwd: '/projects/myapp',
      };

      await processToolUse(input);

      // Verify writeHookData was called with correct parameters
      expect(mockWriteHookData).toHaveBeenCalledTimes(1);
      expect(mockWriteHookData).toHaveBeenCalledWith(
        '/mock/.c0ntextkeeper',
        'patterns',
        '/projects/myapp',
        'prod-session-unique',
        expect.objectContaining({
          tool: 'Write',
          pattern: 'Write: /new-file.ts - modified',
        })
      );
    });

    it('should add fileModified for file modification tools', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-file',
        tool: 'Write',
        input: { file_path: '/src/component.tsx' },
        result: { success: true },
        cwd: '/projects/myapp',
      };

      await processToolUse(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as ToolPattern;
      expect(storedData.fileModified).toBe('/src/component.tsx');
    });

    it('should add commandExecuted for Bash tool', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-bash',
        tool: 'Bash',
        input: { command: 'npm run build' },
        result: { exit_code: 0 },
        cwd: '/projects/myapp',
      };

      await processToolUse(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as ToolPattern;
      expect(storedData.commandExecuted).toBe('npm run build');
    });

    it('should handle missing input gracefully', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-minimal',
        tool: 'UnknownTool',
        cwd: '/projects/myapp',
      };

      await expect(processToolUse(input)).resolves.not.toThrow();
    });

    it('should use timestamp from input if provided', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      const customTimestamp = '2024-06-15T14:30:00Z';
      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-ts',
        tool: 'Read',
        input: { file_path: '/readme.md' },
        result: { success: true },
        timestamp: customTimestamp,
        cwd: '/projects/myapp',
      };

      await processToolUse(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as ToolPattern;
      expect(storedData.timestamp).toBe(customTimestamp);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockWriteHookData.mockReset();
      mockWriteHookData.mockReturnValue('/mock/storage/path/patterns/2024-01-15_1030_MT_ion-123-patterns.json');
    });

    it('should handle writeHookData errors gracefully', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      mockWriteHookData.mockImplementation(() => {
        throw new Error('Storage write failed');
      });

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-error',
        tool: 'Write',
        input: { file_path: '/test.ts' },
        result: { success: true },
        cwd: '/projects/myapp',
      };

      // Should not throw, should handle error gracefully
      // The function exits with 0 on error to avoid blocking Claude Code
      await expect(processToolUse(input)).resolves.not.toThrow();
    });

    it('should continue processing even with storage issues', async () => {
      (isTestSession as jest.Mock).mockReturnValue(false);

      // First call fails, simulating transient error
      mockWriteHookData.mockImplementationOnce(() => {
        throw new Error('Transient error');
      });

      const input: PostToolHookInput = {
        hook_event_name: 'PostToolUse',
        session_id: 'prod-session-transient',
        tool: 'Write',
        input: { file_path: '/test.ts' },
        result: { success: true },
        cwd: '/projects/myapp',
      };

      // Should handle error gracefully without throwing
      await expect(processToolUse(input)).resolves.not.toThrow();
    });
  });
});
