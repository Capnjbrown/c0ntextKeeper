/**
 * Tests for SessionStart Hook Handler
 * Updated for per-session storage pattern using writeHookData and getHookStorageDir
 */

import { jest } from "@jest/globals";
import * as fs from "fs";

// Mock fs module before importing the hook
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));
const mockedFs = jest.mocked(fs);

// Mock path-resolver
jest.mock("../../../src/utils/path-resolver", () => ({
  getStoragePath: jest.fn(() => "/mock/storage/path"),
}));

// Mock hook-storage (new per-session storage)
const mockWriteHookData = jest.fn();
const mockGetHookStorageDir = jest.fn();
jest.mock("../../../src/utils/hook-storage", () => ({
  writeHookData: (
    basePath: string,
    hookType: string,
    workingDir: string,
    sessionId: string,
    data: unknown
  ) => mockWriteHookData(basePath, hookType, workingDir, sessionId, data),
  getHookStorageDir: (basePath: string, hookType: string, workingDir: string) =>
    mockGetHookStorageDir(basePath, hookType, workingDir),
}));

import {
  processSessionStart,
  SessionStartHookInput,
  SessionMetaRecord,
} from "../../../src/hooks/session-start";
import { getStoragePath } from "../../../src/utils/path-resolver";

describe("SessionStart Hook", () => {
  const mockDate = new Date("2024-01-15T10:30:00Z");
  const originalProcessExit = process.exit;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Date
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Mock process.exit to prevent test termination
    process.exit = jest.fn() as unknown as typeof process.exit;

    // Reset fs mocks
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
    mockedFs.readFileSync.mockReturnValue("[]");
    mockedFs.appendFileSync.mockReturnValue(undefined);
    mockedFs.readdirSync.mockReturnValue([]); // No existing session files by default

    // Reset hook-storage mocks
    mockWriteHookData.mockReset();
    mockWriteHookData.mockReturnValue(
      "/mock/storage/path/sessions-meta/2024-01-15_1030_MT_ion-123-session-start.json"
    );
    mockGetHookStorageDir.mockReset();
    mockGetHookStorageDir.mockReturnValue("/mock/storage/path/sessions-meta");

    // Reset other mocks
    (
      getStoragePath as jest.MockedFunction<typeof getStoragePath>
    ).mockReturnValue("/mock/storage/path");
  });

  afterEach(() => {
    jest.useRealTimers();
    process.exit = originalProcessExit;
  });

  describe("processSessionStart", () => {
    describe("with valid startup input", () => {
      it("should create a new session record for startup type", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "test-session-123",
          session_type: "startup",
          timestamp: "2024-01-15T10:30:00Z",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        // Verify writeHookData was called
        expect(mockWriteHookData).toHaveBeenCalledTimes(1);

        // Check the stored data (5th argument to writeHookData)
        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData).toMatchObject({
          sessionId: "test-session-123",
          sessionType: "startup",
          status: "active",
          projectPath: "/test/project",
        });
        expect(storedData.eventType).toBe("session-start");
      });

      it("should use current time if timestamp not provided", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "test-session-456",
          session_type: "startup",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData.startTime).toBe(mockDate.toISOString());
      });

      it("should use cwd if project_path not provided", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "test-session-789",
          session_type: "startup",
          cwd: "/fallback/cwd",
        };

        await processSessionStart(input);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData.projectPath).toBe("/fallback/cwd");
      });

      it("should call writeHookData with correct parameters", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "test-session-abc",
          session_type: "startup",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        expect(mockWriteHookData).toHaveBeenCalledWith(
          "/mock/storage/path",
          "sessions-meta",
          "/test/project",
          "test-session-abc",
          expect.objectContaining({
            sessionId: "test-session-abc",
            eventType: "session-start",
          })
        );
      });
    });

    describe("with resume session type", () => {
      it("should detect resume when existing session files exist", async () => {
        // Mock that session directory exists and has matching files
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readdirSync.mockReturnValue([
          "2024-01-15_0900_MT_sion-123-session-start.json",
        ] as unknown as ReturnType<typeof fs.readdirSync>);

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "resume-session-123",
          session_type: "resume",
          timestamp: "2024-01-15T10:30:00Z",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        // Should still write the session data
        expect(mockWriteHookData).toHaveBeenCalledTimes(1);
        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData).toMatchObject({
          sessionId: "resume-session-123",
          sessionType: "resume",
          status: "active",
        });
      });

      it("should check for existing session files using getHookStorageDir", async () => {
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readdirSync.mockReturnValue([]);

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "check-dir-session",
          session_type: "resume",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        expect(mockGetHookStorageDir).toHaveBeenCalledWith(
          "/mock/storage/path",
          "sessions-meta",
          "/test/project"
        );
      });

      it("should handle resume when no existing files found", async () => {
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readdirSync.mockReturnValue([]);

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "new-resume-session",
          session_type: "resume",
          timestamp: "2024-01-15T10:30:00Z",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        expect(mockWriteHookData).toHaveBeenCalledTimes(1);
        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData.sessionType).toBe("resume");
      });
    });

    describe("with clear session type", () => {
      it("should create session record for clear type", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "clear-session-123",
          session_type: "clear",
          timestamp: "2024-01-15T10:30:00Z",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData.sessionType).toBe("clear");
        expect(storedData.status).toBe("active");
        expect(storedData.eventType).toBe("session-start");
      });
    });

    describe("with compact session type", () => {
      it("should create session record for compact type", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "compact-session-123",
          session_type: "compact",
          timestamp: "2024-01-15T10:30:00Z",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData.sessionType).toBe("compact");
        expect(storedData.eventType).toBe("session-start");
      });
    });

    describe("error handling", () => {
      it("should handle missing session_id gracefully", async () => {
        const input = {
          hook_event_name: "SessionStart",
          session_type: "startup",
          cwd: "/test/project",
        } as SessionStartHookInput;

        // Should not throw even with missing session_id
        await expect(processSessionStart(input)).resolves.not.toThrow();
      });

      it("should default session_type to startup when not provided", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "default-type-session",
          session_type: undefined as unknown as "startup",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };
        expect(storedData.sessionType).toBe("startup");
      });

      it("should handle writeHookData errors and log to console.error", async () => {
        mockWriteHookData.mockImplementation(() => {
          throw new Error("Write error");
        });

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "write-error-session",
          session_type: "startup",
          cwd: "/test/project",
        };

        // The function catches errors and outputs to console.error
        await processSessionStart(input);

        expect(console.error).toHaveBeenCalled();
      });

      it("should handle readdirSync errors gracefully", async () => {
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readdirSync.mockImplementation(() => {
          throw new Error("Directory read error");
        });

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "readdir-error-session",
          session_type: "startup",
          cwd: "/test/project",
        };

        // Should handle the error gracefully
        await processSessionStart(input);

        // Should still attempt to write or log error
        expect(console.error).toHaveBeenCalled();
      });

      it("should handle non-existent sessions directory", async () => {
        mockedFs.existsSync.mockReturnValue(false);

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "no-dir-session",
          session_type: "startup",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        // readdirSync should not be called when directory doesn't exist
        expect(mockedFs.readdirSync).not.toHaveBeenCalled();
        // writeHookData should still be called
        expect(mockWriteHookData).toHaveBeenCalledTimes(1);
      });
    });

    describe("storage record creation", () => {
      it("should create properly structured SessionMetaRecord with eventType", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "structured-session-123",
          session_type: "startup",
          timestamp: "2024-01-15T10:30:00Z",
          project_path: "/test/project",
          cwd: "/test/cwd",
        };

        await processSessionStart(input);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
        };

        // Verify all required fields
        expect(storedData.sessionId).toBe("structured-session-123");
        expect(storedData.sessionType).toBe("startup");
        expect(storedData.startTime).toBe("2024-01-15T10:30:00Z");
        expect(storedData.projectPath).toBe("/test/project");
        expect(storedData.cwd).toBe("/test/cwd");
        expect(storedData.status).toBe("active");
        expect(storedData.eventType).toBe("session-start");
      });

      it("should pass correct hookType to writeHookData", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "hooktype-test-session",
          session_type: "startup",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        // Second argument should be "sessions-meta"
        expect(mockWriteHookData.mock.calls[0][1]).toBe("sessions-meta");
      });

      it("should pass session ID to writeHookData for unique filename", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "unique-filename-session-abc123",
          session_type: "startup",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        // Fourth argument should be the session ID
        expect(mockWriteHookData.mock.calls[0][3]).toBe(
          "unique-filename-session-abc123"
        );
      });
    });

    describe("console output", () => {
      it("should output JSON with additionalContext on success", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "output-test-session-abcdef",
          session_type: "startup",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        expect(console.log).toHaveBeenCalled();
        const logCall = (console.log as jest.Mock).mock.calls[0][0] as string;
        const parsed = JSON.parse(logCall);

        expect(parsed.additionalContext).toContain("Session started: startup");
        expect(parsed.additionalContext).toContain("output-t");
      });

      it("should include session type in additionalContext", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "context-test-session-123",
          session_type: "resume",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        const logCall = (console.log as jest.Mock).mock.calls[0][0] as string;
        const parsed = JSON.parse(logCall);

        expect(parsed.additionalContext).toContain("Session started: resume");
      });

      it("should include truncated session ID in additionalContext", async () => {
        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "very-long-session-id-that-gets-truncated",
          session_type: "startup",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        const logCall = (console.log as jest.Mock).mock.calls[0][0] as string;
        const parsed = JSON.parse(logCall);

        // Should contain first 8 characters of session ID
        expect(parsed.additionalContext).toContain("very-lon");
        expect(parsed.additionalContext).toContain("...");
      });
    });

    describe("resume detection logic", () => {
      it("should filter files by session ID suffix when checking for resume", async () => {
        mockedFs.existsSync.mockReturnValue(true);
        // Session ID ending in "sion-123" should match files containing "sion-123"
        mockedFs.readdirSync.mockReturnValue([
          "2024-01-15_0900_MT_sion-123-session-start.json",
          "2024-01-15_0800_MT_other-id-session-start.json",
        ] as unknown as ReturnType<typeof fs.readdirSync>);

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "resume-session-123", // Last 8 chars: "sion-123"
          session_type: "startup",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        // Should have called readdirSync to check for existing files
        expect(mockedFs.readdirSync).toHaveBeenCalled();
        expect(mockWriteHookData).toHaveBeenCalledTimes(1);
      });

      it("should not detect resume when no matching session files exist", async () => {
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readdirSync.mockReturnValue([
          "2024-01-15_0900_MT_different-session-start.json",
        ] as unknown as ReturnType<typeof fs.readdirSync>);

        const input: SessionStartHookInput = {
          hook_event_name: "SessionStart",
          session_id: "brand-new-session",
          session_type: "startup",
          project_path: "/test/project",
          cwd: "/test/project",
        };

        await processSessionStart(input);

        expect(mockWriteHookData).toHaveBeenCalledTimes(1);
      });
    });
  });
});
