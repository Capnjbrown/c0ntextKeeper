/**
 * Tests for Notification Hook Handler
 * Updated for per-session storage pattern (v0.7.8+)
 */

import { jest } from "@jest/globals";
import * as fs from "fs";

// Store original process.exit for restoration
const originalProcessExit = process.exit;

// Mock fs module before importing the module under test
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

// Mock path-resolver
jest.mock("../../../src/utils/path-resolver", () => ({
  getStoragePath: jest.fn().mockReturnValue("/mock/storage/path"),
}));

// Mock project-utils
jest.mock("../../../src/utils/project-utils", () => ({
  getHookStoragePath: jest.fn().mockReturnValue("/mock/storage/path/notifications/test-project/2025-01-01/notifications.json"),
  getProjectName: jest.fn().mockReturnValue("test-project"),
}));

// Mock hook-storage (new per-session storage)
const mockWriteHookData = jest.fn();
jest.mock("../../../src/utils/hook-storage", () => ({
  writeHookData: (basePath: string, hookType: string, workingDir: string, sessionId: string, data: unknown) =>
    mockWriteHookData(basePath, hookType, workingDir, sessionId, data),
}));

import {
  processNotification,
  categorizeNotification,
} from "../../../src/hooks/notification";
import type { NotificationHookInput, NotificationRecord } from "../../../src/core/types";

const mockFs = fs as jest.Mocked<typeof fs>;

describe("Notification Hook", () => {
  // Mock process.exit properly to prevent test worker crashes
  const mockProcessExit = jest.fn() as unknown as (code?: number) => never;

  beforeAll(() => {
    process.exit = mockProcessExit;
  });

  afterAll(() => {
    process.exit = originalProcessExit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteHookData.mockReset();
    mockWriteHookData.mockReturnValue("/mock/storage/path/notifications/2025-01-01_1200_MT_ion-123-notifications.json");

    // Default mock implementations for fs (still needed for debug logging)
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockFs.readFileSync.mockReturnValue("[]");
  });

  describe("categorizeNotification", () => {
    describe("security category", () => {
      it('should categorize "permission_prompt" as security', () => {
        expect(categorizeNotification("permission_prompt")).toBe("security");
      });

      it('should categorize "permission_denied" as security', () => {
        expect(categorizeNotification("permission_denied")).toBe("security");
      });

      it('should categorize "auth_required" as security', () => {
        expect(categorizeNotification("auth_required")).toBe("security");
      });

      it('should categorize "auth_success" as security', () => {
        expect(categorizeNotification("auth_success")).toBe("security");
      });

      it("should be case-insensitive for permission", () => {
        expect(categorizeNotification("PERMISSION_PROMPT")).toBe("security");
        expect(categorizeNotification("Permission_Required")).toBe("security");
      });
    });

    describe("status category", () => {
      it('should categorize "idle_prompt" as status', () => {
        expect(categorizeNotification("idle_prompt")).toBe("status");
      });

      it('should categorize "idle_warning" as status', () => {
        expect(categorizeNotification("idle_warning")).toBe("status");
      });

      it('should categorize "timeout_warning" as status', () => {
        expect(categorizeNotification("timeout_warning")).toBe("status");
      });

      it('should categorize "session_timeout" as status', () => {
        expect(categorizeNotification("session_timeout")).toBe("status");
      });
    });

    describe("error category", () => {
      it('should categorize "error" as error', () => {
        expect(categorizeNotification("error")).toBe("error");
      });

      it('should categorize "connection_error" as error', () => {
        expect(categorizeNotification("connection_error")).toBe("error");
      });

      it('should categorize "failed_operation" as error', () => {
        expect(categorizeNotification("failed_operation")).toBe("error");
      });

      it('should categorize "api_failure" as error', () => {
        expect(categorizeNotification("api_failure")).toBe("error");
      });
    });

    describe("success category", () => {
      it('should categorize "success" as success', () => {
        expect(categorizeNotification("success")).toBe("success");
      });

      it('should categorize "operation_complete" as success', () => {
        expect(categorizeNotification("operation_complete")).toBe("success");
      });

      it('should categorize "task_completed" as success', () => {
        expect(categorizeNotification("task_completed")).toBe("success");
      });

      it('should categorize "successful_auth" as security due to priority order', () => {
        // Note: This matches both "success" and "auth"
        // The function checks security (auth) before success, so "auth" wins
        expect(categorizeNotification("successful_auth")).toBe("security");
      });

      it('should categorize "operation_successful" as success', () => {
        // A string with "success" but not "auth" should be categorized as success
        expect(categorizeNotification("operation_successful")).toBe("success");
      });
    });

    describe("interaction category", () => {
      it('should categorize "elicitation_dialog" as interaction', () => {
        expect(categorizeNotification("elicitation_dialog")).toBe("interaction");
      });

      it('should categorize "elicitation_prompt" as interaction', () => {
        expect(categorizeNotification("elicitation_prompt")).toBe("interaction");
      });

      it('should categorize "dialog_open" as interaction', () => {
        expect(categorizeNotification("dialog_open")).toBe("interaction");
      });

      it('should categorize "user_dialog" as interaction', () => {
        expect(categorizeNotification("user_dialog")).toBe("interaction");
      });
    });

    describe("general category", () => {
      it('should categorize unknown types as "general"', () => {
        expect(categorizeNotification("info")).toBe("general");
      });

      it('should categorize empty string as "general"', () => {
        expect(categorizeNotification("")).toBe("general");
      });

      it('should categorize random text as "general"', () => {
        expect(categorizeNotification("some_random_notification")).toBe("general");
      });

      it('should categorize "update" as "general"', () => {
        expect(categorizeNotification("update")).toBe("general");
      });
    });
  });

  describe("processNotification", () => {
    const createMockInput = (overrides?: Partial<NotificationHookInput>): NotificationHookInput => ({
      hook_event_name: "Notification",
      session_id: "test-session-123",
      notification_type: "permission_prompt",
      message: "Test notification message",
      timestamp: "2025-01-01T12:00:00.000Z",
      project_path: "/test/project",
      details: { key: "value" },
      ...overrides,
    });

    it("should process a valid notification and store it using writeHookData", async () => {
      await processNotification(createMockInput());

      // Should call writeHookData with correct parameters
      expect(mockWriteHookData).toHaveBeenCalled();
      expect(mockWriteHookData).toHaveBeenCalledWith(
        "/mock/storage/path",
        "notifications",
        "/test/project",
        "test-session-123",
        expect.any(Object)
      );

      // Verify the stored data structure (single object, not array)
      const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
      expect(storedData).toMatchObject({
        sessionId: "test-session-123",
        notificationType: "permission_prompt",
        message: "Test notification message",
        projectPath: "/test/project",
        details: { key: "value" },
      });
    });

    it("should create unique file per notification (not append to existing)", async () => {
      // Process two notifications
      await processNotification(createMockInput({ session_id: "session-1" }));
      await processNotification(createMockInput({ session_id: "session-2" }));

      // Each notification creates its own file via writeHookData
      expect(mockWriteHookData).toHaveBeenCalledTimes(2);

      // Verify different session IDs were passed
      const call1SessionId = mockWriteHookData.mock.calls[0][3];
      const call2SessionId = mockWriteHookData.mock.calls[1][3];
      expect(call1SessionId).toBe("session-1");
      expect(call2SessionId).toBe("session-2");
    });

    it("should use current timestamp if not provided", async () => {
      const input = createMockInput({ timestamp: undefined });

      await processNotification(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
      expect(storedData.timestamp).toBeDefined();
      // Should be a valid ISO string
      expect(() => new Date(storedData.timestamp)).not.toThrow();
    });

    it("should use cwd if project_path is not provided", async () => {
      const originalCwd = process.cwd();
      const input = createMockInput({ project_path: undefined });

      await processNotification(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
      expect(storedData.projectPath).toBe(originalCwd);

      // Verify workingDir passed to writeHookData is cwd
      const passedWorkingDir = mockWriteHookData.mock.calls[0][2];
      expect(passedWorkingDir).toBe(originalCwd);
    });

    it("should handle missing optional fields", async () => {
      const input: NotificationHookInput = {
        hook_event_name: "Notification",
        session_id: "minimal-session",
        notification_type: "info",
      };

      await processNotification(input);

      const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
      expect(storedData.sessionId).toBe("minimal-session");
      expect(storedData.notificationType).toBe("info");
      expect(storedData.message).toBeUndefined();
      expect(storedData.details).toBeUndefined();
    });

    it("should store notification with all notification types", async () => {
      const notificationTypes = [
        "permission_prompt",
        "idle_prompt",
        "auth_success",
        "elicitation_dialog",
        "error",
        "success",
        "custom_type",
      ];

      for (const type of notificationTypes) {
        mockWriteHookData.mockClear();

        await processNotification(createMockInput({ notification_type: type }));

        const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
        expect(storedData.notificationType).toBe(type);
      }
    });

    it("should preserve details object in notification", async () => {
      const complexDetails = {
        tool: "bash",
        command: "npm test",
        nested: {
          level: 2,
          items: [1, 2, 3],
        },
      };

      await processNotification(createMockInput({ details: complexDetails }));

      const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
      expect(storedData.details).toEqual(complexDetails);
    });

    it("should pass correct hookType to writeHookData", async () => {
      await processNotification(createMockInput());

      const passedHookType = mockWriteHookData.mock.calls[0][1];
      expect(passedHookType).toBe("notifications");
    });

    it("should pass basePath from getStoragePath to writeHookData", async () => {
      await processNotification(createMockInput());

      const passedBasePath = mockWriteHookData.mock.calls[0][0];
      expect(passedBasePath).toBe("/mock/storage/path");
    });
  });

  describe("error handling", () => {
    it("should handle writeHookData errors gracefully", async () => {
      mockWriteHookData.mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const input: NotificationHookInput = {
        hook_event_name: "Notification",
        session_id: "test-session",
        notification_type: "info",
      };

      await processNotification(input);

      // Should call process.exit(0) on error
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it("should handle unexpected errors in writeHookData", async () => {
      mockWriteHookData.mockImplementation(() => {
        throw new Error("Unexpected storage error");
      });

      const input: NotificationHookInput = {
        hook_event_name: "Notification",
        session_id: "test-session",
        notification_type: "info",
      };

      await processNotification(input);

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe("integration scenarios", () => {
    it("should handle rapid successive notifications (each gets unique file)", async () => {
      // Simulate multiple rapid notifications
      for (let i = 0; i < 5; i++) {
        await processNotification({
          hook_event_name: "Notification",
          session_id: `session-${i}`,
          notification_type: "info",
          message: `Notification ${i}`,
        });
      }

      // Each notification creates its own file
      expect(mockWriteHookData).toHaveBeenCalledTimes(5);

      // Verify each has correct data
      for (let i = 0; i < 5; i++) {
        const storedData = mockWriteHookData.mock.calls[i][4] as NotificationRecord;
        expect(storedData.message).toBe(`Notification ${i}`);
        expect(storedData.sessionId).toBe(`session-${i}`);
      }
    });

    it("should handle different project paths", async () => {
      const projects = ["/project/a", "/project/b", "/project/c"];

      for (const projectPath of projects) {
        mockWriteHookData.mockClear();

        await processNotification({
          hook_event_name: "Notification",
          session_id: "test-session",
          notification_type: "info",
          project_path: projectPath,
        });

        // Verify workingDir passed to writeHookData
        const passedWorkingDir = mockWriteHookData.mock.calls[0][2];
        expect(passedWorkingDir).toBe(projectPath);

        // Verify projectPath in stored data
        const storedData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
        expect(storedData.projectPath).toBe(projectPath);
      }
    });

    it("should handle same session with multiple notifications", async () => {
      const sessionId = "same-session-id";

      // Multiple notifications from same session
      await processNotification({
        hook_event_name: "Notification",
        session_id: sessionId,
        notification_type: "permission_prompt",
        message: "First notification",
      });

      await processNotification({
        hook_event_name: "Notification",
        session_id: sessionId,
        notification_type: "success",
        message: "Second notification",
      });

      // Each still creates its own file (unique timestamp)
      expect(mockWriteHookData).toHaveBeenCalledTimes(2);

      // Both use same session ID
      expect(mockWriteHookData.mock.calls[0][3]).toBe(sessionId);
      expect(mockWriteHookData.mock.calls[1][3]).toBe(sessionId);

      // But different data
      const firstData = mockWriteHookData.mock.calls[0][4] as NotificationRecord;
      const secondData = mockWriteHookData.mock.calls[1][4] as NotificationRecord;
      expect(firstData.message).toBe("First notification");
      expect(secondData.message).toBe("Second notification");
    });
  });
});
