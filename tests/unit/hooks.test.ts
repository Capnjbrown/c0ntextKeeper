/**
 * Tests for c0ntextKeeper Hooks
 */

import { preCompactHandler } from '../../src/hooks/precompact';
import { userPromptHandler } from '../../src/hooks/userprompt';
import { postToolHandler } from '../../src/hooks/posttool';
import { stopHandler } from '../../src/hooks/stop';
import { HookInput } from '../../src/core/types';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('../../src/core/archiver');
jest.mock('../../src/storage/file-store');
jest.mock('../../src/utils/logger');
jest.mock('../../src/core/config');
jest.mock('fs/promises');

describe('Hook Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock config to enable hooks
    const config = require('../../src/core/config');
    config.loadConfig = jest.fn().mockReturnValue({
      hooks: {
        preCompact: { enabled: true },
        userPromptSubmit: { enabled: true },
        postToolUse: { enabled: true },
        stop: { enabled: true }
      }
    });
  });

  describe('preCompactHandler', () => {
    it('should process preCompact hook when enabled', async () => {
      const input: HookInput = {
        hook_event_name: 'PreCompact',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl',
        trigger: 'manual',
        project_path: '/test/project'
      };

      const mockArchiver = require('../../src/core/archiver').ContextArchiver;
      mockArchiver.prototype.archiveFromTranscript = jest.fn().mockResolvedValue({
        success: true,
        archivePath: '/archive/path.json',
        stats: {
          problems: 5,
          implementations: 3,
          decisions: 2,
          patterns: 1,
          relevanceScore: 0.85
        }
      });

      const result = await preCompactHandler(input);

      expect(result.status).toBe('success');
      expect(result.archiveLocation).toBe('/archive/path.json');
      expect(result.stats).toEqual({
        problems: 5,
        implementations: 3,
        decisions: 2,
        patterns: 1
      });
    });

    it('should skip when hook is disabled', async () => {
      const config = require('../../src/core/config');
      config.loadConfig = jest.fn().mockReturnValue({
        hooks: {
          preCompact: { enabled: false }
        }
      });

      const input: HookInput = {
        hook_event_name: 'PreCompact',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl'
      };

      const result = await preCompactHandler(input);

      expect(result.status).toBe('skipped');
      expect(result.message).toContain('Hook is disabled');
    });

    it('should handle archiving errors gracefully', async () => {
      const input: HookInput = {
        hook_event_name: 'PreCompact',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl'
      };

      const mockArchiver = require('../../src/core/archiver').ContextArchiver;
      mockArchiver.prototype.archiveFromTranscript = jest.fn().mockResolvedValue({
        success: false,
        error: 'Failed to parse transcript'
      });

      const result = await preCompactHandler(input);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Failed to parse transcript');
    });

    it('should handle exceptions', async () => {
      const input: HookInput = {
        hook_event_name: 'PreCompact',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl'
      };

      const mockArchiver = require('../../src/core/archiver').ContextArchiver;
      mockArchiver.prototype.archiveFromTranscript = jest.fn()
        .mockRejectedValue(new Error('Unexpected error'));

      const result = await preCompactHandler(input);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Unexpected error');
    });
  });

  describe('userPromptHandler', () => {
    it('should track user questions', async () => {
      const input = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'How do I implement authentication?',
        timestamp: '2024-01-01T10:00:00Z'
      };

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      const mockStoreQuestion = jest.fn().mockResolvedValue(true);
      mockFileStore.prototype.storeQuestion = mockStoreQuestion;

      const result = await userPromptHandler(input);

      expect(result.status).toBe('success');
      expect(mockStoreQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          question: 'How do I implement authentication?',
          timestamp: '2024-01-01T10:00:00Z'
        })
      );
    });

    it('should skip when disabled', async () => {
      const config = require('../../src/core/config');
      config.loadConfig = jest.fn().mockReturnValue({
        hooks: {
          userPromptSubmit: { enabled: false }
        }
      });

      const input = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'Test question'
      };

      const result = await userPromptHandler(input);

      expect(result.status).toBe('skipped');
    });

    it('should handle storage errors', async () => {
      const input = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'Test question'
      };

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      mockFileStore.prototype.storeQuestion = jest.fn()
        .mockRejectedValue(new Error('Storage failed'));

      const result = await userPromptHandler(input);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Storage failed');
    });

    it('should handle questions with special characters', async () => {
      const input = {
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session',
        prompt: 'What is the purpose of @#$%^& in TypeScript?'
      };

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      mockFileStore.prototype.storeQuestion = jest.fn().mockResolvedValue(true);

      const result = await userPromptHandler(input);

      expect(result.status).toBe('success');
      expect(mockFileStore.prototype.storeQuestion).toHaveBeenCalled();
    });
  });

  describe('postToolHandler', () => {
    it('should track tool usage patterns', async () => {
      const input = {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session',
        tool: 'Edit',
        input: {
          file_path: 'test.ts',
          old_string: 'old',
          new_string: 'new'
        },
        output: 'File updated successfully',
        timestamp: '2024-01-01T10:00:00Z'
      };

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      mockFileStore.prototype.storeToolUse = jest.fn().mockResolvedValue(true);

      const result = await postToolHandler(input);

      expect(result.status).toBe('success');
      expect(mockFileStore.prototype.storeToolUse).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          tool: 'Edit',
          timestamp: '2024-01-01T10:00:00Z'
        })
      );
    });

    it('should skip when disabled', async () => {
      const config = require('../../src/core/config');
      config.loadConfig = jest.fn().mockReturnValue({
        hooks: {
          postToolUse: { enabled: false }
        }
      });

      const input = {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session',
        tool: 'Bash',
        output: 'Command executed'
      };

      const result = await postToolHandler(input);

      expect(result.status).toBe('skipped');
    });

    it('should analyze tool patterns', async () => {
      const input = {
        hook_event_name: 'PostToolUse',
        session_id: 'test-session',
        tool: 'Bash',
        input: { command: 'npm test' },
        output: 'Tests passed'
      };

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      mockFileStore.prototype.storeToolUse = jest.fn().mockResolvedValue(true);
      mockFileStore.prototype.getSessionToolUses = jest.fn().mockResolvedValue([
        { tool: 'Bash', input: { command: 'npm test' } },
        { tool: 'Bash', input: { command: 'npm test' } },
        { tool: 'Bash', input: { command: 'npm test' } }
      ]);

      const result = await postToolHandler(input);

      expect(result.status).toBe('success');
      expect(result.patternDetected).toBe(true);
    });
  });

  describe('stopHandler', () => {
    it('should build Q&A knowledge base', async () => {
      const input = {
        hook_event_name: 'Stop',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl',
        timestamp: '2024-01-01T10:00:00Z'
      };

      // Mock transcript reading
      (fs.readFile as jest.Mock).mockResolvedValue(
        '{"type":"user","message":{"content":[{"text":"Question"}]}}\n' +
        '{"type":"assistant","message":{"content":[{"text":"Answer"}]}}'
      );

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      mockFileStore.prototype.storeQAPair = jest.fn().mockResolvedValue(true);

      const result = await stopHandler(input);

      expect(result.status).toBe('success');
      expect(result.qaPairsExtracted).toBeGreaterThan(0);
    });

    it('should skip when disabled', async () => {
      const config = require('../../src/core/config');
      config.loadConfig = jest.fn().mockReturnValue({
        hooks: {
          stop: { enabled: false }
        }
      });

      const input = {
        hook_event_name: 'Stop',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl'
      };

      const result = await stopHandler(input);

      expect(result.status).toBe('skipped');
    });

    it('should handle missing transcript', async () => {
      const input = {
        hook_event_name: 'Stop',
        session_id: 'test-session',
        transcript_path: '/nonexistent/transcript.jsonl'
      };

      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await stopHandler(input);

      expect(result.status).toBe('error');
      expect(result.message).toContain('File not found');
    });

    it('should parse Q&A pairs correctly', async () => {
      const input = {
        hook_event_name: 'Stop',
        session_id: 'test-session',
        transcript_path: '/test/transcript.jsonl'
      };

      // Mock a conversation with multiple Q&A pairs
      const transcript = [
        '{"type":"user","message":{"content":[{"text":"How do I create a component?"}]}}',
        '{"type":"assistant","message":{"content":[{"text":"Use React.FC to create a functional component"}]}}',
        '{"type":"user","message":{"content":[{"text":"What about state management?"}]}}',
        '{"type":"assistant","message":{"content":[{"text":"Use useState for local state"}]}}'
      ].join('\n');

      (fs.readFile as jest.Mock).mockResolvedValue(transcript);

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      const storeQAPair = jest.fn().mockResolvedValue(true);
      mockFileStore.prototype.storeQAPair = storeQAPair;

      const result = await stopHandler(input);

      expect(result.status).toBe('success');
      expect(result.qaPairsExtracted).toBe(2);
      expect(storeQAPair).toHaveBeenCalledTimes(2);
    });
  });

  describe('Hook Integration', () => {
    it('should handle all hooks in sequence', async () => {
      // Simulate a complete session lifecycle
      const sessionId = 'integration-test-session';

      // 1. UserPromptSubmit
      const userPromptInput = {
        hook_event_name: 'UserPromptSubmit',
        session_id: sessionId,
        prompt: 'How to implement caching?'
      };

      const mockFileStore = require('../../src/storage/file-store').FileStore;
      mockFileStore.prototype.storeQuestion = jest.fn().mockResolvedValue(true);
      mockFileStore.prototype.storeToolUse = jest.fn().mockResolvedValue(true);
      mockFileStore.prototype.storeQAPair = jest.fn().mockResolvedValue(true);

      const userResult = await userPromptHandler(userPromptInput);
      expect(userResult.status).toBe('success');

      // 2. PostToolUse
      const postToolInput = {
        hook_event_name: 'PostToolUse',
        session_id: sessionId,
        tool: 'Write',
        input: { file_path: 'cache.ts', content: 'cache implementation' }
      };

      const toolResult = await postToolHandler(postToolInput);
      expect(toolResult.status).toBe('success');

      // 3. PreCompact
      const preCompactInput: HookInput = {
        hook_event_name: 'PreCompact',
        session_id: sessionId,
        transcript_path: '/test/transcript.jsonl',
        trigger: 'auto'
      };

      const mockArchiver = require('../../src/core/archiver').ContextArchiver;
      mockArchiver.prototype.archiveFromTranscript = jest.fn().mockResolvedValue({
        success: true,
        archivePath: '/archive/integration.json',
        stats: { problems: 1, implementations: 1, decisions: 0, patterns: 0 }
      });

      const compactResult = await preCompactHandler(preCompactInput);
      expect(compactResult.status).toBe('success');

      // 4. Stop
      const stopInput = {
        hook_event_name: 'Stop',
        session_id: sessionId,
        transcript_path: '/test/transcript.jsonl'
      };

      (fs.readFile as jest.Mock).mockResolvedValue(
        '{"type":"user","message":{"content":[{"text":"How to implement caching?"}]}}\n' +
        '{"type":"assistant","message":{"content":[{"text":"Use Redis for distributed caching"}]}}'
      );

      const stopResult = await stopHandler(stopInput);
      expect(stopResult.status).toBe('success');
    });
  });
});