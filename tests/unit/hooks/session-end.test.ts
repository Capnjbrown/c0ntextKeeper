/**
 * Tests for SessionEnd Hook Handler
 *
 * Tests the per-session storage pattern using writeHookData and getHookStorageDir.
 * Session-end creates its own file and looks for matching session-start files
 * to calculate duration.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Create mock functions for fs
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockAppendFileSync = jest.fn();

// Mock fs module
jest.mock("fs", () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  appendFileSync: (...args: unknown[]) => mockAppendFileSync(...args),
}));

// Mock path-resolver
const mockGetStoragePath = jest.fn();
jest.mock("../../../src/utils/path-resolver", () => ({
  getStoragePath: (...args: unknown[]) => mockGetStoragePath(...args),
}));

// Mock hook-storage (new per-session storage)
const mockWriteHookData = jest.fn();
const mockGetHookStorageDir = jest.fn();
jest.mock("../../../src/utils/hook-storage", () => ({
  writeHookData: (basePath: string, hookType: string, workingDir: string, sessionId: string, data: unknown) =>
    mockWriteHookData(basePath, hookType, workingDir, sessionId, data),
  getHookStorageDir: (basePath: string, hookType: string, workingDir: string) =>
    mockGetHookStorageDir(basePath, hookType, workingDir),
}));

// Import after mocks
import {
  processSessionEnd,
  debugLog,
  SessionEndHookInput,
  SessionMetaRecord,
} from "../../../src/hooks/session-end";

describe("SessionEnd Hook", () => {
  const mockStoragePath = "/mock/storage/.c0ntextkeeper";
  const mockSessionsDir = "/mock/storage/.c0ntextkeeper/archive/projects/test-project/sessions-meta";

  // Store original process.exit
  const originalExit = process.exit;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    delete process.env.C0NTEXTKEEPER_DEBUG;

    // Mock process.exit to prevent tests from exiting
    process.exit = jest.fn() as unknown as (code?: number) => never;

    // Setup default mocks
    mockGetStoragePath.mockReturnValue(mockStoragePath);

    // Default hook-storage mocks
    mockWriteHookData.mockReset();
    mockWriteHookData.mockReturnValue(
      "/mock/storage/path/sessions-meta/2024-09-15_1430_MT_ion-123-session-end.json"
    );
    mockGetHookStorageDir.mockReset();
    mockGetHookStorageDir.mockReturnValue(mockSessionsDir);

    // Default fs mocks
    mockExistsSync.mockReturnValue(false);
    mockMkdirSync.mockReturnValue(undefined);
    mockWriteFileSync.mockReturnValue(undefined);
    mockReadFileSync.mockReturnValue("[]");
    mockReaddirSync.mockReturnValue([]); // No session-start files by default
    mockAppendFileSync.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore original process.exit
    process.exit = originalExit;
  });

  describe("debugLog", () => {
    // Note: The DEBUG constant is evaluated at module load time.
    // Since C0NTEXTKEEPER_DEBUG is not set when tests run, DEBUG=false
    // and debugLog becomes a no-op. We test that it doesn't throw.

    it("should not log when DEBUG is disabled (default test environment)", () => {
      // DEBUG constant is false when module loads without C0NTEXTKEEPER_DEBUG
      debugLog("Test message", { data: "test" });

      // Should not call appendFileSync since DEBUG is false
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });

    it("should handle being called with various data types without throwing", () => {
      // Test that debugLog gracefully handles different inputs
      expect(() => debugLog("String message")).not.toThrow();
      expect(() => debugLog("With object", { key: "value" })).not.toThrow();
      expect(() => debugLog("With array", [1, 2, 3])).not.toThrow();
      expect(() => debugLog("With null", null)).not.toThrow();
      expect(() => debugLog("With undefined", undefined)).not.toThrow();
      expect(() => debugLog("With number", 42)).not.toThrow();
    });

    it("should be exported as a function", () => {
      expect(typeof debugLog).toBe("function");
    });
  });

  describe("processSessionEnd", () => {
    const validInput: SessionEndHookInput = {
      hook_event_name: "SessionEnd",
      session_id: "test-session-123",
      reason: "user_exit",
      timestamp: "2024-09-15T14:30:00Z",
      project_path: "/test/project",
    };

    it("should process a session end event successfully", async () => {
      mockExistsSync.mockReturnValue(false);

      await processSessionEnd(validInput);

      // Verify writeHookData was called with correct parameters
      expect(mockWriteHookData).toHaveBeenCalledTimes(1);
      const [basePath, hookType, workingDir, sessionId, data] = mockWriteHookData.mock.calls[0];

      expect(basePath).toBe(mockStoragePath);
      expect(hookType).toBe("sessions-meta");
      expect(workingDir).toBe("/test/project");
      expect(sessionId).toBe("test-session-123");
      expect((data as SessionMetaRecord & { eventType: string }).eventType).toBe("session-end");
      expect((data as SessionMetaRecord).status).toBe("completed");
    });

    it("should use current timestamp when not provided", async () => {
      const inputWithoutTimestamp: SessionEndHookInput = {
        hook_event_name: "SessionEnd",
        session_id: "test-session-456",
      };

      mockExistsSync.mockReturnValue(false);

      const beforeCall = new Date().toISOString();
      await processSessionEnd(inputWithoutTimestamp);
      const afterCall = new Date().toISOString();

      const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord;

      // Timestamp should be between before and after
      expect(storedData.endTime! >= beforeCall).toBe(true);
      expect(storedData.endTime! <= afterCall).toBe(true);
    });

    it("should use process.cwd() when project_path is not provided", async () => {
      const inputWithoutPath: SessionEndHookInput = {
        hook_event_name: "SessionEnd",
        session_id: "test-session-789",
      };

      mockExistsSync.mockReturnValue(false);

      await processSessionEnd(inputWithoutPath);

      expect(mockGetStoragePath).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: process.cwd(),
          createIfMissing: true,
        })
      );
    });

    describe("session duration calculation", () => {
      // Note: session_id "test-session-123" has last 8 chars "sion-123"
      // Files must include "sion-123" and end with "-sessions-meta.json"

      it("should calculate duration when matching session-start file exists", async () => {
        // Setup: session directory exists with a matching session-start file
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          // Return true for the sessions-meta directory
          return pathStr.includes("sessions-meta");
        });
        // Filename must include "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue(["2024-09-15_1400_MT_sion-123-sessions-meta.json"]);
        mockReadFileSync.mockReturnValue(
          JSON.stringify({ startTime: "2024-09-15T14:00:00Z" })
        );

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
          durationMs?: number;
        };

        expect(storedData.durationMs).toBe(30 * 60 * 1000); // 30 minutes
        expect(storedData.endTime).toBe("2024-09-15T14:30:00Z");
        expect(storedData.eventType).toBe("session-end");
      });

      it("should handle missing session-start file gracefully", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        mockReaddirSync.mockReturnValue([]); // No matching files

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          durationMs?: number;
        };

        // Duration should be undefined when no start file found
        expect(storedData.durationMs).toBeUndefined();
      });

      it("should handle session-start file without startTime", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // Filename must include "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue(["2024-09-15_1400_MT_sion-123-sessions-meta.json"]);
        mockReadFileSync.mockReturnValue(JSON.stringify({})); // No startTime

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          durationMs?: number;
        };

        // Duration should be undefined when startTime is missing
        expect(storedData.durationMs).toBeUndefined();
      });

      it("should use earliest session-start file when multiple exist", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // Files should be sorted alphabetically, earliest first
        // Filenames must include "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue([
          "2024-09-15_1400_MT_sion-123-sessions-meta.json",
          "2024-09-15_1410_MT_sion-123-sessions-meta.json",
        ]);
        mockReadFileSync.mockReturnValue(
          JSON.stringify({ startTime: "2024-09-15T14:00:00Z" })
        );

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          durationMs?: number;
        };

        expect(storedData.durationMs).toBe(30 * 60 * 1000); // 30 minutes from earliest start
      });
    });

    describe("session end record structure", () => {
      it("should create properly structured session end record", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // Filename must include "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue(["2024-09-15_1400_MT_sion-123-sessions-meta.json"]);
        mockReadFileSync.mockReturnValue(
          JSON.stringify({ startTime: "2024-09-15T14:00:00Z" })
        );

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          eventType: string;
          durationMs?: number;
        };

        expect(storedData).toMatchObject({
          sessionId: "test-session-123",
          sessionType: "unknown",
          startTime: "2024-09-15T14:00:00Z",
          endTime: "2024-09-15T14:30:00Z",
          projectPath: "/test/project",
          status: "completed",
          eventType: "session-end",
          durationMs: 30 * 60 * 1000,
        });
      });

      it("should use endTime as startTime when no session-start file found", async () => {
        mockExistsSync.mockReturnValue(false);

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord;

        // When no start file is found, startTime defaults to endTime
        expect(storedData.startTime).toBe(validInput.timestamp);
        expect(storedData.endTime).toBe(validInput.timestamp);
      });
    });

    describe("error handling", () => {
      it("should handle JSON parse error in session-start file", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // Filename must include "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue(["2024-09-15_1400_MT_sion-123-sessions-meta.json"]);
        mockReadFileSync.mockReturnValue("invalid json {{{");

        // Should not throw
        await processSessionEnd(validInput);

        // Should still create end record without duration
        expect(mockWriteHookData).toHaveBeenCalled();
        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          durationMs?: number;
        };
        expect(storedData.durationMs).toBeUndefined();
      });

      it("should handle file read error for session-start file", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // Filename must include "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue(["2024-09-15_1400_MT_sion-123-sessions-meta.json"]);
        mockReadFileSync.mockImplementation(() => {
          throw new Error("Permission denied");
        });

        // Should not throw
        await processSessionEnd(validInput);

        // Should still create end record without duration
        expect(mockWriteHookData).toHaveBeenCalled();
        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          durationMs?: number;
        };
        expect(storedData.durationMs).toBeUndefined();
      });

      it("should exit with 0 on writeHookData error", async () => {
        const mockConsoleError = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        mockExistsSync.mockReturnValue(false);
        mockWriteHookData.mockImplementation(() => {
          throw new Error("Disk full");
        });

        await processSessionEnd(validInput);

        expect(process.exit).toHaveBeenCalledWith(0);
        expect(mockConsoleError).toHaveBeenCalled();
        const errorOutput = JSON.parse(mockConsoleError.mock.calls[0][0] as string);
        expect(errorOutput.status).toBe("error");
        expect(errorOutput.message).toBe("Disk full");

        mockConsoleError.mockRestore();
      });

      it("should handle unknown error type", async () => {
        const mockConsoleError = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        mockExistsSync.mockReturnValue(false);
        mockWriteHookData.mockImplementation(() => {
          throw "string error"; // Non-Error thrown
        });

        await processSessionEnd(validInput);

        expect(mockConsoleError).toHaveBeenCalled();
        const errorOutput = JSON.parse(mockConsoleError.mock.calls[0][0] as string);
        expect(errorOutput.message).toBe("Unknown error");

        mockConsoleError.mockRestore();
      });
    });

    describe("session ID matching", () => {
      it("should match session-start files using last 8 characters of session ID", async () => {
        // "very-long-session-id-test-session-123".slice(-8) = "sion-123"
        const longSessionId = "very-long-session-id-test-session-123";
        const inputWithLongId: SessionEndHookInput = {
          ...validInput,
          session_id: longSessionId,
        };

        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // File should match last 8 chars: "sion-123"
        mockReaddirSync.mockReturnValue(["2024-09-15_1400_MT_sion-123-sessions-meta.json"]);
        mockReadFileSync.mockReturnValue(
          JSON.stringify({ startTime: "2024-09-15T14:00:00Z" })
        );

        await processSessionEnd(inputWithLongId);

        expect(mockReaddirSync).toHaveBeenCalled();
        expect(mockWriteHookData).toHaveBeenCalled();
      });

      it("should not match files with different session IDs", async () => {
        mockExistsSync.mockImplementation((p: unknown) => {
          const pathStr = String(p);
          return pathStr.includes("sessions-meta");
        });
        // Files that don't match "sion-123" (last 8 chars of "test-session-123")
        mockReaddirSync.mockReturnValue([
          "2024-09-15_1400_MT_other-id-sessions-meta.json",
          "2024-09-15_1400_MT_diff-456-sessions-meta.json",
        ]);

        await processSessionEnd(validInput);

        const storedData = mockWriteHookData.mock.calls[0][4] as SessionMetaRecord & {
          durationMs?: number;
        };
        // Duration should be undefined since no matching start file
        expect(storedData.durationMs).toBeUndefined();
      });
    });

    describe("different end reasons", () => {
      it.each([
        ["user_exit", "user_exit"],
        ["timeout", "timeout"],
        ["error", "error"],
        ["compact", "compact"],
        ["custom_reason", "custom_reason"],
      ])('should handle reason "%s"', async (reason) => {
        const input: SessionEndHookInput = {
          ...validInput,
          reason: reason as SessionEndHookInput["reason"],
        };

        mockExistsSync.mockReturnValue(false);

        await processSessionEnd(input);

        expect(mockWriteHookData).toHaveBeenCalled();
      });
    });

    describe("getHookStorageDir usage", () => {
      it("should call getHookStorageDir with correct parameters", async () => {
        mockExistsSync.mockReturnValue(false);

        await processSessionEnd(validInput);

        expect(mockGetHookStorageDir).toHaveBeenCalledWith(
          mockStoragePath,
          "sessions-meta",
          "/test/project"
        );
      });
    });

    describe("per-session storage pattern", () => {
      it("should store single record per file (not array)", async () => {
        mockExistsSync.mockReturnValue(false);

        await processSessionEnd(validInput);

        // writeHookData receives single record, not array
        const storedData = mockWriteHookData.mock.calls[0][4];
        expect(Array.isArray(storedData)).toBe(false);
        expect(typeof storedData).toBe("object");
        expect((storedData as SessionMetaRecord).sessionId).toBe("test-session-123");
      });

      it("should call writeHookData with session ID for unique filename", async () => {
        mockExistsSync.mockReturnValue(false);

        await processSessionEnd(validInput);

        const [, , , sessionId] = mockWriteHookData.mock.calls[0];
        expect(sessionId).toBe("test-session-123");
      });
    });
  });
});
