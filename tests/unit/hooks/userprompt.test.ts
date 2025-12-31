/**
 * Tests for UserPromptSubmit Hook Handler
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Store original process.exit
const originalProcessExit = process.exit;

// Mock process.exit to prevent test from exiting
const mockProcessExit = jest.fn() as unknown as (code?: number) => never;

// Mock fs module before importing the module under test
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock path-resolver
jest.mock('../../../src/utils/path-resolver', () => ({
  getStoragePath: jest.fn(() => '/mock/storage/path'),
}));

// Mock hook-storage (new per-session storage)
const mockWriteHookData = jest.fn();
const mockGetHookStorageDir = jest.fn();
jest.mock('../../../src/utils/hook-storage', () => ({
  writeHookData: (basePath: string, hookType: string, workingDir: string, sessionId: string, data: unknown) =>
    mockWriteHookData(basePath, hookType, workingDir, sessionId, data),
  getHookStorageDir: (basePath: string, hookType: string, workingDir: string) =>
    mockGetHookStorageDir(basePath, hookType, workingDir),
}));

// Mock project-utils
jest.mock('../../../src/utils/project-utils', () => ({
  getProjectName: jest.fn(() => 'test-project'),
  getHookStoragePath: jest.fn(
    (basePath: string, hookType: string, workingDir: string, dateString: string, fileName: string) =>
      `/mock/storage/path/archive/projects/test-project/${hookType}/${dateString}-${fileName}`
  ),
}));

// Mock SecurityFilter
jest.mock('../../../src/utils/security-filter', () => ({
  SecurityFilter: jest.fn().mockImplementation(() => ({
    filterText: jest.fn((text: string) => text),
  })),
}));

// Import the module after mocking
import { processUserPrompt, extractTopics, UserPromptHookInput, UserPromptContext } from '../../../src/hooks/userprompt';
import { SecurityFilter } from '../../../src/utils/security-filter';
import { getStoragePath } from '../../../src/utils/path-resolver';
import { getHookStoragePath } from '../../../src/utils/project-utils';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockGetStoragePath = getStoragePath as jest.MockedFunction<typeof getStoragePath>;
const mockGetHookStoragePath = getHookStoragePath as jest.MockedFunction<typeof getHookStoragePath>;

describe('UserPromptSubmit Hook', () => {
  beforeAll(() => {
    // Replace process.exit with mock
    process.exit = mockProcessExit;
  });

  afterAll(() => {
    // Restore original process.exit
    process.exit = originalProcessExit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.C0NTEXTKEEPER_DEBUG;
    // Reset all fs mock implementations to defaults
    mockFs.existsSync.mockReset();
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReset();
    mockFs.readFileSync.mockReturnValue('[]');
    mockFs.writeFileSync.mockReset();
    mockFs.mkdirSync.mockReset();
    mockFs.appendFileSync.mockReset();
    mockFs.readdirSync.mockReset();
    mockFs.readdirSync.mockReturnValue([]);
    // Reset storage path mocks
    mockGetStoragePath.mockReset();
    mockGetStoragePath.mockReturnValue('/mock/storage/path');
    mockGetHookStoragePath.mockReset();
    mockGetHookStoragePath.mockImplementation(
      (basePath, hookType, workingDir, dateString, fileName) =>
        `/mock/storage/path/archive/projects/test-project/${hookType}/${dateString}-${fileName}`
    );
    // Reset per-session storage mocks (new pattern)
    mockWriteHookData.mockReset();
    mockWriteHookData.mockReturnValue('/mock/storage/path/archive/projects/test-project/prompts/2024-01-01_1200_MT_sion-123-prompts.json');
    mockGetHookStorageDir.mockReset();
    mockGetHookStorageDir.mockReturnValue('/mock/storage/path/archive/projects/test-project/prompts');
    // Reset SecurityFilter mock to default implementation
    (SecurityFilter as jest.Mock).mockImplementation(() => ({
      filterText: jest.fn((text: string) => text),
    }));
  });

  describe('extractTopics', () => {
    it('should extract authentication topic', () => {
      const topics = extractTopics('I need help with authentication');
      expect(topics).toContain('authentication');
    });

    it('should extract authorization topic', () => {
      const topics = extractTopics('Fix the authorization issue');
      expect(topics).toContain('authentication');
    });

    it('should extract database topics', () => {
      const topics = extractTopics('How do I query the database?');
      expect(topics).toContain('database');
    });

    it('should extract postgres as database topic', () => {
      const topics = extractTopics('Connect to postgres server');
      expect(topics).toContain('database');
    });

    it('should extract mongodb as database topic', () => {
      const topics = extractTopics('Setup mongodb connection');
      expect(topics).toContain('database');
    });

    it('should extract API topics', () => {
      const topics = extractTopics('Create a new API endpoint');
      expect(topics).toContain('api');
    });

    it('should extract REST as API topic', () => {
      const topics = extractTopics('Build a REST service');
      expect(topics).toContain('api');
    });

    it('should extract GraphQL as API topic', () => {
      const topics = extractTopics('Implement GraphQL resolver');
      expect(topics).toContain('api');
    });

    it('should extract testing topics', () => {
      const topics = extractTopics('Write unit tests for the component');
      expect(topics).toContain('testing');
    });

    it('should extract jest as testing topic', () => {
      const topics = extractTopics('Configure jest for TypeScript');
      expect(topics).toContain('testing');
    });

    it('should extract debugging topics', () => {
      const topics = extractTopics('There is an error in the code');
      expect(topics).toContain('debugging');
    });

    it('should extract bug as debugging topic', () => {
      const topics = extractTopics('Fix this bug');
      expect(topics).toContain('debugging');
    });

    it('should extract problem as debugging topic', () => {
      const topics = extractTopics('I have a problem with my code');
      expect(topics).toContain('debugging');
    });

    it('should extract deployment topics', () => {
      const topics = extractTopics('How do I deploy to production?');
      expect(topics).toContain('deployment');
    });

    it('should extract docker as deployment topic', () => {
      const topics = extractTopics('Build a Docker container');
      expect(topics).toContain('deployment');
    });

    it('should extract kubernetes as deployment topic', () => {
      const topics = extractTopics('Configure Kubernetes pods');
      expect(topics).toContain('deployment');
    });

    it('should extract CI/CD as deployment topic', () => {
      const topics = extractTopics('Setup CI/CD pipeline');
      expect(topics).toContain('deployment');
    });

    it('should extract javascript topics', () => {
      const topics = extractTopics('Write typescript code');
      expect(topics).toContain('javascript');
    });

    it('should extract node as javascript topic', () => {
      const topics = extractTopics('Setup node.js server');
      expect(topics).toContain('javascript');
    });

    it('should extract npm as javascript topic', () => {
      const topics = extractTopics('Install npm packages');
      expect(topics).toContain('javascript');
    });

    it('should extract frontend topics', () => {
      const topics = extractTopics('Build a React component');
      expect(topics).toContain('frontend');
    });

    it('should extract vue as frontend topic', () => {
      const topics = extractTopics('Create Vue application');
      expect(topics).toContain('frontend');
    });

    it('should extract angular as frontend topic', () => {
      const topics = extractTopics('Migrate to Angular');
      expect(topics).toContain('frontend');
    });

    it('should extract styling topics', () => {
      const topics = extractTopics('Fix the CSS styles');
      expect(topics).toContain('styling');
    });

    it('should extract tailwind as styling topic', () => {
      const topics = extractTopics('Use tailwind classes');
      expect(topics).toContain('styling');
    });

    it('should extract security topics', () => {
      const topics = extractTopics('Implement security measures');
      expect(topics).toContain('security');
    });

    it('should extract JWT as security topic', () => {
      const topics = extractTopics('Validate the JWT token');
      expect(topics).toContain('security');
    });

    it('should extract encryption as security topic', () => {
      const topics = extractTopics('Encrypt the data');
      expect(topics).toContain('security');
    });

    it('should extract multiple topics from complex prompts', () => {
      const topics = extractTopics(
        'Fix the authentication bug in the React API component and add tests'
      );
      expect(topics).toContain('authentication');
      expect(topics).toContain('debugging');
      expect(topics).toContain('frontend');
      expect(topics).toContain('api');
      expect(topics).toContain('testing');
    });

    it('should return empty array for unrelated text', () => {
      const topics = extractTopics('Hello world');
      expect(topics).toEqual([]);
    });

    it('should handle empty string', () => {
      const topics = extractTopics('');
      expect(topics).toEqual([]);
    });

    it('should not duplicate topics', () => {
      const topics = extractTopics('test testing tests jest mocha vitest');
      const testingCount = topics.filter((t) => t === 'testing').length;
      expect(testingCount).toBe(1);
    });

    it('should be case insensitive', () => {
      const topicsLower = extractTopics('react');
      const topicsUpper = extractTopics('REACT');
      const topicsMixed = extractTopics('ReAcT');

      expect(topicsLower).toContain('frontend');
      expect(topicsUpper).toContain('frontend');
      expect(topicsMixed).toContain('frontend');
    });
  });

  describe('processUserPrompt', () => {
    const createValidInput = (overrides: Partial<UserPromptHookInput> = {}): UserPromptHookInput => ({
      hook_event_name: 'UserPromptSubmit',
      session_id: 'test-session-123',
      prompt: 'Help me fix this authentication bug in React',
      timestamp: '2024-01-01T12:00:00Z',
      project_path: '/test/project',
      ...overrides,
    });

    it('should process a valid user prompt', async () => {
      const input = createValidInput();

      await processUserPrompt(input);

      // Verify storage path resolution was called
      expect(mockGetStoragePath).toHaveBeenCalledWith({
        projectPath: '/test/project',
        createIfMissing: true,
      });

      // Verify per-session storage was used (new pattern)
      expect(mockWriteHookData).toHaveBeenCalledWith(
        '/mock/storage/path',
        'prompts',
        '/test/project',
        'test-session-123',
        expect.objectContaining({
          sessionId: 'test-session-123',
          prompt: 'Help me fix this authentication bug in React',
        })
      );
    });

    it('should skip prompts shorter than 10 characters', async () => {
      const input = createValidInput({ prompt: 'Hi' });
      const consoleSpy = jest.spyOn(console, 'log');

      await processUserPrompt(input);

      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({
          status: 'skipped',
          message: 'Prompt too short to preserve',
        })
      );
      // Per-session storage should NOT be called for skipped prompts
      expect(mockWriteHookData).not.toHaveBeenCalled();
    });

    it('should detect code blocks in prompts', async () => {
      const input = createValidInput({
        prompt: 'Here is my code:\n```typescript\nconst x = 1;\n```\nPlease review it',
      });

      await processUserPrompt(input);

      // Verify the context was stored with hasCodeBlock: true (new per-session pattern)
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.hasCodeBlock).toBe(true);
    });

    it('should detect questions in prompts', async () => {
      const input = createValidInput({
        prompt: 'How do I implement authentication?',
      });

      await processUserPrompt(input);

      // Per-session storage: data is 5th argument (index 4)
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.hasQuestion).toBe(true);
    });

    it('should detect question words (what, why, when, etc)', async () => {
      const inputs = [
        'What is the best approach?',
        'Why does this fail?',
        'When should I use this pattern?',
        'Where is the config file?',
        'Can you help me?',
        'Should I use this library?',
        'Could you explain this?',
      ];

      for (const prompt of inputs) {
        jest.clearAllMocks();
        mockFs.existsSync.mockReturnValue(false);
        mockFs.readdirSync.mockReturnValue([]);
        mockWriteHookData.mockReset();
        mockGetHookStorageDir.mockReturnValue('/mock/storage/path/archive/projects/test-project/prompts');

        await processUserPrompt(createValidInput({ prompt }));

        // Per-session storage: data is 5th argument (index 4)
        const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
        expect(storedData.hasQuestion).toBe(true);
      }
    });

    it('should extract topics from prompt', async () => {
      const input = createValidInput({
        prompt: 'Help me fix this authentication bug in React',
      });

      await processUserPrompt(input);

      // Per-session storage: data is 5th argument (index 4)
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.topics).toContain('authentication');
      expect(storedData.topics).toContain('debugging');
      expect(storedData.topics).toContain('frontend');
    });

    it('should track follow-up prompts in same session', async () => {
      // First prompt - no existing prompt files for this session
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdirSync.mockReturnValue([]);
      const firstInput = createValidInput({ prompt: 'First question about React' });

      await processUserPrompt(firstInput);

      // Verify first prompt is not a follow-up (per-session storage pattern)
      let storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.isFollowUp).toBe(false);
      expect(storedData.promptNumber).toBe(1);

      // Second prompt - existing files with same session ID in directory
      jest.clearAllMocks();
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        '2024-01-01_1200_MT_sion-123-prompts.json',  // Matches session ID ending
      ] as unknown as ReturnType<typeof fs.readdirSync>);
      mockWriteHookData.mockReset();
      mockGetHookStorageDir.mockReturnValue('/mock/storage/path/archive/projects/test-project/prompts');

      const secondInput = createValidInput({ prompt: 'Follow up question about testing' });
      await processUserPrompt(secondInput);

      // Verify second prompt IS a follow-up (file counting finds 1 existing)
      storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.isFollowUp).toBe(true);
      expect(storedData.promptNumber).toBe(2);
    });

    it('should not mark prompts from different sessions as follow-ups', async () => {
      // Different session ID in existing files (doesn't match our session)
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        '2024-01-01_1000_MT_diff-456-prompts.json',  // Different session ID
      ] as unknown as ReturnType<typeof fs.readdirSync>);

      const input = createValidInput({ prompt: 'New session question about API' });
      await processUserPrompt(input);

      // Per-session storage: this is a new session, not a follow-up
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.isFollowUp).toBe(false);
      expect(storedData.promptNumber).toBe(1);
    });

    it('should use cwd when project_path is not provided', async () => {
      const originalCwd = process.cwd();
      const input = createValidInput({ project_path: undefined });

      await processUserPrompt(input);

      expect(mockGetStoragePath).toHaveBeenCalledWith({
        projectPath: originalCwd,
        createIfMissing: true,
      });
    });

    it('should use current timestamp when not provided', async () => {
      const input = createValidInput({ timestamp: undefined as any });

      const beforeTime = new Date().toISOString();
      await processUserPrompt(input);
      const afterTime = new Date().toISOString();

      // Per-session storage: data is 5th argument (index 4)
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      const storedTimestamp = storedData.timestamp;

      expect(storedTimestamp >= beforeTime).toBe(true);
      expect(storedTimestamp <= afterTime).toBe(true);
    });

    it('should write single prompt context per file (per-session storage)', async () => {
      // New per-session storage: each prompt creates its own file
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdirSync.mockReturnValue([]);

      const input = createValidInput();
      await processUserPrompt(input);

      // Per-session storage writes single objects, not arrays
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData).toBeDefined();
      expect(storedData.sessionId).toBe('test-session-123');
      expect(storedData.prompt).toBe('Help me fix this authentication bug in React');
    });

    it('should handle readdirSync errors gracefully when checking follow-ups', async () => {
      // Directory exists but readdirSync throws
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const input = createValidInput();

      // Should fail gracefully since readdirSync throws inside the hook
      await processUserPrompt(input);

      // The hook should have exited with error
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should filter sensitive data through SecurityFilter', async () => {
      const mockFilterText = jest.fn((text: string) => text.replace(/secret/gi, '[REDACTED]'));
      (SecurityFilter as jest.Mock).mockImplementation(() => ({
        filterText: mockFilterText,
      }));

      const input = createValidInput({
        prompt: 'My secret password is abc123',
      });

      await processUserPrompt(input);

      expect(mockFilterText).toHaveBeenCalledWith('My secret password is abc123');
    });

    it('should store prompt length correctly', async () => {
      const longPrompt = 'A'.repeat(100) + ' authentication test';
      const input = createValidInput({ prompt: longPrompt });

      await processUserPrompt(input);

      // Per-session storage: data is 5th argument (index 4)
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;
      expect(storedData.promptLength).toBe(longPrompt.length);
    });

    it('should call writeHookData with correct parameters', async () => {
      mockFs.existsSync.mockReturnValue(false);
      const input = createValidInput();

      await processUserPrompt(input);

      // Per-session storage: writeHookData handles directory creation internally
      expect(mockWriteHookData).toHaveBeenCalledWith(
        '/mock/storage/path',
        'prompts',
        '/test/project',
        'test-session-123',
        expect.any(Object)
      );
    });

    it('should store well-structured UserPromptContext object', async () => {
      const input = createValidInput();

      await processUserPrompt(input);

      // Per-session storage: data is 5th argument (index 4)
      const storedData = mockWriteHookData.mock.calls[0][4] as UserPromptContext;

      // Verify object structure has all required fields
      expect(storedData).toMatchObject({
        sessionId: 'test-session-123',
        prompt: 'Help me fix this authentication bug in React',
        promptLength: expect.any(Number),
        hasCodeBlock: expect.any(Boolean),
        hasQuestion: expect.any(Boolean),
        topics: expect.any(Array),
        isFollowUp: expect.any(Boolean),
        promptNumber: expect.any(Number),
      });
    });
  });

  describe('error handling', () => {
    it('should handle writeHookData errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdirSync.mockReturnValue([]);
      // Simulate writeHookData throwing an error
      mockWriteHookData.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const input: UserPromptHookInput = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'This is a test prompt for error handling',
        timestamp: '2024-01-01T12:00:00Z',
      };

      const consoleSpy = jest.spyOn(console, 'error');

      // Should not throw to the caller, hook catches errors internally
      await processUserPrompt(input);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
      // Verify process.exit was called with 0 (non-blocking exit)
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle getHookStorageDir errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);
      // Simulate getHookStorageDir returning a bad path
      mockGetHookStorageDir.mockReturnValue('/nonexistent/path');
      mockFs.readdirSync.mockReturnValue([]);

      const input: UserPromptHookInput = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'Test prompt with storage path error',
        timestamp: '2024-01-01T12:00:00Z',
      };

      // Should still call writeHookData (error would be there, not in dir function)
      await processUserPrompt(input);

      expect(mockWriteHookData).toHaveBeenCalled();
    });

    it('should include error message and timestamp in error output', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdirSync.mockReturnValue([]);
      // Simulate writeHookData throwing an error
      mockWriteHookData.mockImplementation(() => {
        throw new Error('Test error message');
      });

      const input: UserPromptHookInput = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'This is a test prompt',
        timestamp: '2024-01-01T12:00:00Z',
      };

      const consoleSpy = jest.spyOn(console, 'error');

      await processUserPrompt(input);

      const errorCall = consoleSpy.mock.calls[0][0] as string;
      const errorOutput = JSON.parse(errorCall);
      expect(errorOutput.status).toBe('error');
      expect(errorOutput.message).toBe('Test error message');
      expect(errorOutput.timestamp).toBeDefined();
    });
  });

  describe('UserPromptHookInput interface', () => {
    it('should accept PascalCase event name', async () => {
      const inputPascal: UserPromptHookInput = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'Test prompt Pascal case',
        timestamp: '2024-01-01T12:00:00Z',
      };

      await processUserPrompt(inputPascal);
      // Per-session storage: verify writeHookData was called
      expect(mockWriteHookData).toHaveBeenCalled();
    });

    it('should accept camelCase event name', async () => {
      const inputCamel: UserPromptHookInput = {
        hook_event_name: 'userPromptSubmit',
        session_id: 'test-session',
        prompt: 'Test prompt camel case',
        timestamp: '2024-01-01T12:00:00Z',
      };

      await processUserPrompt(inputCamel);
      // Per-session storage: verify writeHookData was called
      expect(mockWriteHookData).toHaveBeenCalled();
    });
  });
});
