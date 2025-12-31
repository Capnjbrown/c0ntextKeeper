/**
 * Tests for PreCompact Hook Handler
 */

import { handlePreCompact } from '../../../src/hooks/precompact';
import { ContextArchiver } from '../../../src/core/archiver';
import { HookInput, HookOutput } from '../../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('../../../src/core/archiver');
jest.mock('../../../src/utils/logger');
jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn((p: string) => p),
}));

describe('PreCompact Hook Handler', () => {
  let mockArchiver: jest.Mocked<ContextArchiver>;
  let originalStdin: typeof process.stdin;
  let originalExit: typeof process.exit;
  let consoleLogSpy: jest.SpyInstance;
  let exitCode: number | undefined;

  const validHookInput: HookInput = {
    hook_event_name: 'PreCompact',
    session_id: 'test-session-123',
    transcript_path: '/test/transcript.jsonl',
    trigger: 'manual',
    project_path: '/test/project',
  };

  const successArchiveResult = {
    success: true,
    archivePath: '/test/archive/session-123.json',
    stats: {
      problems: 5,
      implementations: 3,
      decisions: 2,
      patterns: 4,
      relevanceScore: 0.85,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    exitCode = undefined;

    // Mock ContextArchiver
    mockArchiver = new ContextArchiver() as jest.Mocked<ContextArchiver>;
    (ContextArchiver as jest.MockedClass<typeof ContextArchiver>).mockImplementation(() => mockArchiver);

    // Mock fs.existsSync to return true by default
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ metadata: {} }));
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    // Mock path.resolve
    (path.resolve as jest.Mock).mockImplementation((p: string) => p);

    // Capture console.log output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock process.exit to capture exit code
    originalExit = process.exit;
    process.exit = jest.fn((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as unknown as typeof process.exit;

    // Store original stdin
    originalStdin = process.stdin;
  });

  afterEach(() => {
    process.exit = originalExit;
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
    consoleLogSpy.mockRestore();
  });

  /**
   * Helper to simulate stdin input
   */
  function simulateStdin(data: string): void {
    const { Readable } = require('stream');
    const readable = new Readable({
      read() {
        this.push(data);
        this.push(null);
      }
    });
    Object.defineProperty(process, 'stdin', {
      value: readable,
      writable: true,
      configurable: true,
    });
  }

  /**
   * Helper to parse console output as HookOutput
   */
  function getHookOutput(): HookOutput | null {
    const calls = consoleLogSpy.mock.calls;
    if (calls.length > 0) {
      try {
        return JSON.parse(calls[calls.length - 1][0]);
      } catch {
        return null;
      }
    }
    return null;
  }

  describe('valid PreCompact hook input', () => {
    it('should process valid PreCompact hook input successfully', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output).toBeTruthy();
      expect(output?.status).toBe('success');
      expect(output?.archiveLocation).toBe('/test/archive/session-123.json');
      expect(output?.stats).toEqual(successArchiveResult.stats);
      expect(mockArchiver.archiveFromTranscript).toHaveBeenCalledWith(
        validHookInput.transcript_path,
        validHookInput.project_path
      );
    });

    it('should handle PreCompact event with lowercase spelling', async () => {
      const lowercaseInput = { ...validHookInput, hook_event_name: 'preCompact' };
      simulateStdin(JSON.stringify(lowercaseInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('success');
    });

    it('should handle auto trigger type', async () => {
      const autoInput = { ...validHookInput, trigger: 'auto' };
      simulateStdin(JSON.stringify(autoInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('success');
      expect(output?.message).toContain('auto');
    });

    it('should include custom instructions in archive metadata', async () => {
      const inputWithInstructions = {
        ...validHookInput,
        custom_instructions: 'Focus on authentication flow',
      };
      simulateStdin(JSON.stringify(inputWithInstructions));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('success');
      // Verify fs.writeFileSync was called to update metadata
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('transcript path handling', () => {
    it('should error when transcript path is not provided', async () => {
      const inputWithoutPath = { ...validHookInput, transcript_path: undefined };
      simulateStdin(JSON.stringify(inputWithoutPath));

      // The hook exits with code 2 for missing transcript
      try {
        await handlePreCompact();
      } catch (e) {
        // Expected - process.exit throws in tests
      }

      // Get the output before process.exit was called
      const calls = consoleLogSpy.mock.calls;
      // Find the error output (should be first one before exit)
      const errorOutput = calls.find(call => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.status === 'error' && parsed.message?.includes('No transcript path');
        } catch {
          return false;
        }
      });
      expect(errorOutput).toBeTruthy();
    });

    it('should error when transcript file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      simulateStdin(JSON.stringify(validHookInput));

      // The hook exits with code 2 for missing file
      try {
        await handlePreCompact();
      } catch (e) {
        // Expected - process.exit throws in tests
      }

      // Get the output before process.exit was called
      const calls = consoleLogSpy.mock.calls;
      // Find the error output
      const errorOutput = calls.find(call => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.status === 'error' && parsed.message?.includes('Transcript file not found');
        } catch {
          return false;
        }
      });
      expect(errorOutput).toBeTruthy();
    });

    it('should resolve absolute path from transcript_path', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      expect(path.resolve).toHaveBeenCalledWith(validHookInput.transcript_path);
    });
  });

  describe('ContextArchiver integration', () => {
    it('should create ContextArchiver instance', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      expect(ContextArchiver).toHaveBeenCalled();
    });

    it('should pass project_path to archiver when provided', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      expect(mockArchiver.archiveFromTranscript).toHaveBeenCalledWith(
        validHookInput.transcript_path,
        validHookInput.project_path
      );
    });

    it('should pass undefined project_path when not provided', async () => {
      const inputWithoutProject = { ...validHookInput, project_path: undefined };
      simulateStdin(JSON.stringify(inputWithoutProject));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      expect(mockArchiver.archiveFromTranscript).toHaveBeenCalledWith(
        validHookInput.transcript_path,
        undefined
      );
    });

    it('should handle archiver failure', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue({
        success: false,
        error: 'Failed to parse transcript',
      });

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('error');
      expect(output?.message).toContain('Failed to archive context');
    });

    it('should update archive metadata with trigger and sessionId', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ metadata: {} }));

      await handlePreCompact();

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      expect(writtenData.metadata.trigger).toBe('manual');
      expect(writtenData.metadata.sessionId).toBe(validHookInput.session_id);
    });
  });

  describe('error handling', () => {
    it('should skip non-PreCompact events', async () => {
      const nonPreCompactInput = { ...validHookInput, hook_event_name: 'PostToolUse' };
      simulateStdin(JSON.stringify(nonPreCompactInput));

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('skipped');
      expect(output?.message).toContain('Not a PreCompact event');
    });

    it('should handle invalid JSON input', async () => {
      simulateStdin('not valid json');

      await expect(handlePreCompact()).rejects.toThrow('process.exit(1)');

      const output = getHookOutput();
      expect(output?.status).toBe('error');
    });

    it('should handle archiver throwing exception', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockRejectedValue(new Error('Archiver crashed'));

      await expect(handlePreCompact()).rejects.toThrow('process.exit(1)');

      const output = getHookOutput();
      expect(output?.status).toBe('error');
      expect(output?.message).toContain('Archiver crashed');
    });

    it('should handle metadata update failure gracefully', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read failed');
      });

      // Should not throw, just log warning
      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('success');
    });
  });

  describe('timeout scenarios', () => {
    it('should handle stdin read timeout', async () => {
      // Simulate a stdin that never ends
      const { Readable } = require('stream');
      const slowStream = new Readable({
        read() {
          // Never push data
        }
      });
      Object.defineProperty(process, 'stdin', {
        value: slowStream,
        writable: true,
        configurable: true,
      });

      // The handler should timeout waiting for stdin
      jest.useFakeTimers();

      const promise = handlePreCompact();
      jest.advanceTimersByTime(6000); // Advance past 5s stdin timeout

      await expect(promise).rejects.toThrow('process.exit(1)');

      jest.useRealTimers();
    }, 10000);

    it('should call archiver with timeout protection', async () => {
      simulateStdin(JSON.stringify(validHookInput));

      // Verify the archiver is called - the timeout logic is handled internally
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      // Verify the archiver was called with correct params
      expect(mockArchiver.archiveFromTranscript).toHaveBeenCalledWith(
        validHookInput.transcript_path,
        validHookInput.project_path
      );
    });
  });

  describe('output format', () => {
    it('should output valid JSON to stdout', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      expect(consoleLogSpy).toHaveBeenCalled();
      const outputStr = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(outputStr)).not.toThrow();
    });

    it('should include stats in success output', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.stats).toBeDefined();
      expect(output?.stats?.problems).toBe(5);
      expect(output?.stats?.implementations).toBe(3);
      expect(output?.stats?.decisions).toBe(2);
      expect(output?.stats?.patterns).toBe(4);
    });

    it('should include archive location in success output', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.archiveLocation).toBe('/test/archive/session-123.json');
    });

    it('should format success message with trigger type and stats', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.message).toContain('manual');
      expect(output?.message).toContain('5 problems');
      expect(output?.message).toContain('3 implementations');
      expect(output?.message).toContain('2 decisions');
    });
  });

  describe('security validation', () => {
    it('should resolve transcript path to prevent path traversal', async () => {
      const maliciousInput = {
        ...validHookInput,
        transcript_path: '../../../etc/passwd',
      };
      simulateStdin(JSON.stringify(maliciousInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      expect(path.resolve).toHaveBeenCalledWith('../../../etc/passwd');
    });
  });

  describe('session handling', () => {
    it('should log session ID from hook input', async () => {
      simulateStdin(JSON.stringify(validHookInput));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      // Verify session ID was processed (metadata update)
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      expect(writtenData.metadata.sessionId).toBe('test-session-123');
    });

    it('should handle missing session ID gracefully', async () => {
      const inputWithoutSession = { ...validHookInput, session_id: undefined };
      simulateStdin(JSON.stringify(inputWithoutSession));
      mockArchiver.archiveFromTranscript = jest.fn().mockResolvedValue(successArchiveResult);

      await handlePreCompact();

      const output = getHookOutput();
      expect(output?.status).toBe('success');
    });
  });
});
