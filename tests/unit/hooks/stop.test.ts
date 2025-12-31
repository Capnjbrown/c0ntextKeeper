/**
 * Tests for Stop Hook Handler
 *
 * Tests the processExchange function which captures Q&A exchanges
 * and builds a knowledge base of problem-solution pairs.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Create mock functions
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockStatSync = jest.fn();
const mockAppendFileSync = jest.fn();
const mockUnlinkSync = jest.fn();

const mockGetStoragePath = jest.fn();
const mockGetHookStoragePath = jest.fn();
const mockIsTestSession = jest.fn();
const mockFilterText = jest.fn<(text: string) => string>().mockImplementation((text: string) => text);
const mockGetRootPath = jest.fn<() => string>().mockReturnValue("/tmp/test-storage");
const mockScoreContent = jest.fn<(input: unknown) => number>().mockReturnValue(0.75);

// Mock fs module
jest.mock("fs", () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  statSync: (...args: unknown[]) => mockStatSync(...args),
  appendFileSync: (...args: unknown[]) => mockAppendFileSync(...args),
  unlinkSync: (...args: unknown[]) => mockUnlinkSync(...args),
}));

// Mock path-resolver
jest.mock("../../../src/utils/path-resolver", () => ({
  getStoragePath: (...args: unknown[]) => mockGetStoragePath(...args),
}));

// Mock hook-storage (new per-session storage)
const mockWriteHookData = jest.fn();
jest.mock("../../../src/utils/hook-storage", () => ({
  writeHookData: (basePath: string, hookType: string, workingDir: string, sessionId: string, data: unknown) =>
    mockWriteHookData(basePath, hookType, workingDir, sessionId, data),
  getHookStorageDir: jest.fn(() => "/tmp/test-storage/archive/projects/test-project/knowledge"),
}));

// Mock project-utils
jest.mock("../../../src/utils/project-utils", () => ({
  getHookStoragePath: (...args: unknown[]) => mockGetHookStoragePath(...args),
  getProjectName: jest.fn(() => "test-project"),
}));

// Mock test-helpers
jest.mock("../../../src/utils/test-helpers", () => ({
  isTestSession: (...args: unknown[]) => mockIsTestSession(...args),
}));

// Mock security-filter
jest.mock("../../../src/utils/security-filter", () => ({
  SecurityFilter: jest.fn().mockImplementation(() => ({
    filterText: (text: string) => mockFilterText(text),
  })),
}));

// Mock file-store
jest.mock("../../../src/storage/file-store", () => ({
  FileStore: jest.fn().mockImplementation(() => ({
    getRootPath: () => mockGetRootPath(),
  })),
}));

// Mock scorer
jest.mock("../../../src/core/scorer", () => ({
  RelevanceScorer: jest.fn().mockImplementation(() => ({
    scoreContent: (input: unknown) => mockScoreContent(input),
  })),
}));

// Mock extractor (imported but not directly used in processExchange)
jest.mock("../../../src/core/extractor", () => ({
  ContextExtractor: jest.fn().mockImplementation(() => ({})),
}));

// Import types and function after mocks
import { processExchange, StopHookInput, QAPair } from "../../../src/hooks/stop";

describe("Stop Hook", () => {
  // Store original process.exit
  const originalExit = process.exit;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.exit to prevent tests from exiting
    process.exit = jest.fn() as unknown as (code?: number) => never;

    // Reset all mocks with default values
    mockExistsSync.mockReturnValue(false);
    mockMkdirSync.mockImplementation(() => undefined);
    mockWriteFileSync.mockImplementation(() => undefined);
    mockReadFileSync.mockReturnValue("[]");
    mockReaddirSync.mockReturnValue([]);
    mockStatSync.mockReturnValue({ size: 1000 });
    mockAppendFileSync.mockImplementation(() => undefined);
    mockUnlinkSync.mockImplementation(() => undefined);

    mockGetStoragePath.mockReturnValue("/tmp/test-storage");
    mockGetHookStoragePath.mockReturnValue(
      "/tmp/test-storage/knowledge/test-project/2024-01-01/knowledge.json"
    );
    // Mock writeHookData to return a path and capture the data
    mockWriteHookData.mockImplementation((_basePath, _hookType, _workingDir, _sessionId, _data) => {
      return "/tmp/test-storage/archive/projects/test-project/knowledge/2024-01-01_1200_MT_12345-knowledge.json";
    });
    mockIsTestSession.mockReturnValue(false);
    mockFilterText.mockImplementation((text: string) => text);
    mockScoreContent.mockReturnValue(0.75);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore original process.exit
    process.exit = originalExit;
  });

  describe("processExchange", () => {
    describe("with valid Q&A exchange data", () => {
      it("should process a valid exchange and store Q&A pair", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I implement authentication?",
            assistant_response:
              "I implemented JWT authentication with proper token validation.",
          },
          timestamp: "2024-01-01T12:00:00Z",
          project_path: "/test/project",
        };

        await processExchange(input);

        // Verify security filter was called
        expect(mockFilterText).toHaveBeenCalledWith(input.exchange.user_prompt);
        expect(mockFilterText).toHaveBeenCalledWith(
          input.exchange.assistant_response
        );

        // Verify scorer was called
        expect(mockScoreContent).toHaveBeenCalled();

        // Verify file was written
        expect(mockWriteFileSync).toHaveBeenCalled();
      });

      it("should include tools_used and files_modified in Q&A pair", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Fix the database connection",
            assistant_response: "I fixed the connection by updating the config.",
            tools_used: ["Edit", "Read", "Bash"],
            files_modified: ["config.ts", "database.ts"],
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        // Verify writeHookData was called with correct data (per-session storage)
        expect(mockWriteHookData).toHaveBeenCalled();
        const [_basePath, _hookType, _workingDir, _sessionId, writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).toolsUsed).toEqual(["Edit", "Read", "Bash"]);
        expect((writtenData as QAPair).filesModified).toEqual([
          "config.ts",
          "database.ts",
        ]);
      });

      it("should handle exchange with solution keywords", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Fix the bug",
            assistant_response:
              "I fixed the issue by implementing proper error handling.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [_basePath, _hookType, _workingDir, _sessionId, writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).hasSolution).toBe(true);
      });

      it("should handle exchange with error keywords", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Why is this failing?",
            assistant_response:
              "The error is caused by a missing dependency. The problem is in the import statement.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [_basePath, _hookType, _workingDir, _sessionId, writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).hasError).toBe(true);
      });
    });

    describe("topic extraction", () => {
      it("should extract authentication topic", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I implement authentication?",
            assistant_response:
              "Here is the authentication implementation with JWT.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("authentication");
      });

      it("should extract database topic", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I query the database?",
            assistant_response: "You can use SQL queries with PostgreSQL.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("database");
      });

      it("should extract testing topic", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I write unit tests?",
            assistant_response: "Use Jest for testing your TypeScript code.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("testing");
      });

      it("should extract multiple topics from exchange", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "I have an error with my React API call",
            assistant_response:
              "I fixed the bug in your frontend code that was calling the REST endpoint incorrectly.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("debugging");
        expect((writtenData as QAPair).topics).toContain("frontend");
        expect((writtenData as QAPair).topics).toContain("api");
      });

      it("should extract security topic", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I encrypt user passwords?",
            assistant_response: "Use bcrypt to hash and verify JWT tokens.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("security");
      });

      it("should extract deployment topic", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I deploy to production?",
            assistant_response: "Set up CI/CD with Docker and Kubernetes.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("deployment");
      });

      it("should extract version-control topic", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I merge branches in git?",
            assistant_response: "Use git merge or rebase on GitHub.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).topics).toContain("version-control");
      });
    });

    describe("relevance scoring", () => {
      it("should include relevance score in Q&A pair", async () => {
        mockScoreContent.mockReturnValue(0.85);

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "How do I fix this critical bug?",
            assistant_response:
              "I implemented the solution by refactoring the error handling.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).relevanceScore).toBe(0.85);
      });

      it("should skip low-relevance exchanges without solution or error", async () => {
        mockScoreContent.mockReturnValue(0.1);

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "ok",
            assistant_response: "Understood.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        // Should not write anything for low-value exchanges
        expect(mockWriteHookData).not.toHaveBeenCalled();
      });

      it("should keep low-relevance exchanges if they have solution keywords", async () => {
        mockScoreContent.mockReturnValue(0.1);

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "ok",
            assistant_response: "I fixed it for you.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
      });

      it("should keep low-relevance exchanges if they have error keywords", async () => {
        mockScoreContent.mockReturnValue(0.1);

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "help",
            assistant_response: "There is an error in line 42.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
      });

      it("should pass correct metadata to scorer", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Show me the code",
            assistant_response:
              "Here is the implementation:\n```typescript\nconst x = 1;\n```",
            tools_used: ["Edit", "Read"],
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        // Verify scoreContent was called with correct structure
        expect(mockScoreContent).toHaveBeenCalled();
        const scorerCall = (mockScoreContent.mock.calls[0] as unknown[])[0] as {
          type: string;
          metadata: { hasCode: boolean; toolsUsed: number };
        };
        expect(scorerCall.type).toBe("exchange");
        expect(scorerCall.metadata.hasCode).toBe(true);
        expect(scorerCall.metadata.toolsUsed).toBe(2);
      });
    });

    describe("error handling", () => {
      it("should handle missing timestamp gracefully", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Question?",
            assistant_response: "I solved the problem.",
          },
          timestamp: "", // Empty timestamp
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        // Should use current date/time
        expect((writtenData as QAPair).timestamp).toBeTruthy();
      });

      it("should handle missing tools_used gracefully", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Question?",
            assistant_response: "I fixed the issue.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).toolsUsed).toEqual([]);
      });

      it("should handle missing files_modified gracefully", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Question?",
            assistant_response: "I implemented the feature.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
        const [, , , , writtenData] = mockWriteHookData.mock.calls[0];

        expect((writtenData as QAPair).filesModified).toEqual([]);
      });

      it("should create unique per-session files (no append behavior)", async () => {
        // Per-session storage: each call creates a new file, no appending
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "New question?",
            assistant_response: "I solved the new problem.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        // Verify writeHookData was called with correct parameters
        expect(mockWriteHookData).toHaveBeenCalled();
        const [basePath, hookType, workingDir, sessionId, data] = mockWriteHookData.mock.calls[0];

        expect(basePath).toBe("/tmp/test-storage");
        expect(hookType).toBe("knowledge");
        expect(sessionId).toBe("session-12345");
        expect((data as QAPair).question).toBe("New question?");
      });
    });

    describe("test session filtering", () => {
      it("should skip test sessions", async () => {
        mockIsTestSession.mockReturnValue(true);

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "test-session-12345",
          exchange: {
            user_prompt: "Test question?",
            assistant_response: "I added the solution.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        // Should not write for test sessions
        expect(mockWriteHookData).not.toHaveBeenCalled();
      });
    });

    describe("security filtering", () => {
      it("should filter sensitive data from question", async () => {
        mockFilterText.mockImplementation((text: string) =>
          text.replace(/sk-[a-zA-Z0-9]+/g, "[REDACTED]")
        );

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "My API key is sk-1234567890abcdef",
            assistant_response: "I updated the configuration.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockFilterText).toHaveBeenCalledWith(
          "My API key is sk-1234567890abcdef"
        );
      });

      it("should filter sensitive data from answer", async () => {
        mockFilterText.mockImplementation((text: string) =>
          text.replace(/password:\s*\S+/gi, "password: [REDACTED]")
        );

        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "What is the password?",
            assistant_response: "The password: secret123 was implemented.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockFilterText).toHaveBeenCalledWith(
          "The password: secret123 was implemented."
        );
      });
    });

    describe("solution indexing", () => {
      it("should index solutions when hasSolution is true", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Fix the authentication bug",
            assistant_response:
              "I fixed the JWT validation by adding proper token checks.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        // Should write to knowledge (via writeHookData) and solutions index (via writeFileSync)
        expect(mockWriteHookData).toHaveBeenCalled();
        expect(mockWriteFileSync).toHaveBeenCalled(); // Solutions index still uses direct file write
      });
    });

    describe("hook event name handling", () => {
      it("should process lowercase stop event", async () => {
        const input: StopHookInput = {
          hook_event_name: "stop" as "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Question?",
            assistant_response: "I implemented it.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
      });

      it("should process Stop event", async () => {
        const input: StopHookInput = {
          hook_event_name: "Stop",
          session_id: "session-12345",
          exchange: {
            user_prompt: "Question?",
            assistant_response: "I created the solution.",
          },
          timestamp: "2024-01-01T12:00:00Z",
        };

        await processExchange(input);

        expect(mockWriteHookData).toHaveBeenCalled();
      });
    });
  });

  describe("QAPair structure", () => {
    it("should create Q&A pair with all required fields", async () => {
      const input: StopHookInput = {
        hook_event_name: "Stop",
        session_id: "session-12345",
        exchange: {
          user_prompt: "How do I implement caching?",
          assistant_response:
            "I implemented Redis caching with proper TTL settings.",
          tools_used: ["Edit", "Bash"],
          files_modified: ["cache.ts", "config.ts"],
        },
        timestamp: "2024-01-01T12:00:00Z",
        project_path: "/test/project",
      };

      await processExchange(input);

      expect(mockWriteHookData).toHaveBeenCalled();
      const [, , , , writtenData] = mockWriteHookData.mock.calls[0];
      const qaPair = writtenData as QAPair;

      expect(qaPair).toMatchObject({
        sessionId: "session-12345",
        timestamp: "2024-01-01T12:00:00Z",
        question: "How do I implement caching?",
        answer: "I implemented Redis caching with proper TTL settings.",
        toolsUsed: ["Edit", "Bash"],
        filesModified: ["cache.ts", "config.ts"],
        hasSolution: true,
        hasError: false,
      });
      expect(qaPair.topics).toBeDefined();
      expect(qaPair.relevanceScore).toBeDefined();
    });
  });
});
