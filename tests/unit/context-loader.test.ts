/**
 * Tests for Context Loader Module
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Mock fs module before any imports that use it
const mockExistsSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockReadFileSync = jest.fn();

jest.mock("fs", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn(),
  },
}));

// Now import modules that use fs
import { ContextLoader } from "../../src/core/context-loader";
import { ConfigManager } from "../../src/core/config";

// Mock other dependencies
jest.mock("../../src/utils/path-resolver", () => ({
  getStoragePath: jest.fn().mockReturnValue("/test/.c0ntextkeeper"),
}));

jest.mock("../../src/utils/project-utils", () => ({
  getProjectName: jest.fn().mockReturnValue("test-project"),
}));

jest.mock("../../src/core/retriever");
jest.mock("../../src/core/patterns");

describe("ContextLoader", () => {
  let contextLoader: ContextLoader;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Configure mock implementations
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      '2025-01-10_10-00-00_session1.json',
      '2025-01-09_15-30-00_session2.json',
      '2025-01-08_09-00-00_session3.json',
    ] as any);
    
    // Mock file reading
    mockReadFileSync.mockImplementation((filePath: any) => {
      if (filePath.includes('session')) {
        return JSON.stringify({
          summary: {
            filesModified: 5,
            uniqueTools: ['Write', 'Edit', 'Bash'],
          },
          context: {
            problems: [
              {
                question: "How do I implement authentication?",
                solution: {
                  approach: "Use JWT tokens with refresh mechanism",
                },
              },
              {
                question: "Why is the build failing?",
                solution: {
                  approach: "Fixed TypeScript configuration issues",
                },
              },
            ],
            implementations: [
              {
                tool: "Write",
                file: "auth.ts",
                description: "Implemented JWT authentication",
              },
            ],
          },
        });
      }
      
      if (filePath.includes('patterns')) {
        return JSON.stringify([
          {
            type: "code",
            pattern: "async/await",
            frequency: 10,
            description: "Async function pattern",
          },
        ]);
      }
      
      if (filePath.includes('knowledge')) {
        return JSON.stringify([
          {
            question: "What is the project architecture?",
            answer: "Modular TypeScript with MCP server",
          },
        ]);
      }
      
      if (filePath.includes('prompts')) {
        return JSON.stringify([
          {
            prompt: "Help me optimize the database queries",
            timestamp: "2025-01-10T10:00:00Z",
          },
        ]);
      }
      
      return "{}";
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReset();
    mockReaddirSync.mockReset();
    mockReadFileSync.mockReset();
  });
  
  describe("getAutoLoadContext", () => {
    it("should return empty content when disabled", async () => {
      // Mock config to be disabled
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: false,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions', 'patterns', 'knowledge', 'prompts'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      expect(result.content).toBe("");
      expect(result.sizeKB).toBe(0);
      expect(result.itemCount).toBe(0);
      expect(result.strategy).toBe("disabled");
    });
    
    it("should load smart context when enabled", async () => {
      // Mock config to be enabled
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions', 'patterns', 'knowledge', 'prompts'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      expect(result.content).toContain("Project Context: test-project");
      expect(result.content).toContain("Recent Work");
      expect(result.sizeKB).toBeGreaterThan(0);
      expect(result.itemCount).toBeGreaterThan(0);
      expect(result.strategy).toBe("smart");
    });
    
    it("should respect size limits", async () => {
      // Mock config with very small size limit
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 0.1, // 100 bytes
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions', 'patterns', 'knowledge', 'prompts'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      expect(result.sizeKB).toBeLessThanOrEqual(0.5); // Allow for header and truncation message
      expect(result.content).toContain("[Context truncated to fit size limit]");
    });
    
    it("should load recent strategy correctly", async () => {
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'recent',
        maxSizeKB: 10,
        sessionCount: 2,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      expect(result.strategy).toBe("recent");
      expect(result.content).toContain("Recent Work");
      expect(result.content).not.toContain("Recurring Patterns");
    });
    
    it("should format content based on formatStyle", async () => {
      // Test summary format
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 1,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const summaryResult = await contextLoader.getAutoLoadContext();
      
      // Test detailed format
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 1,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'detailed',
      });
      
      contextLoader = new ContextLoader();
      const detailedResult = await contextLoader.getAutoLoadContext();
      
      // Detailed should have more content
      expect(detailedResult.content.length).toBeGreaterThan(summaryResult.content.length);
      expect(detailedResult.content).toContain("Files Modified:");
      expect(detailedResult.content).toContain("Tools Used:");
    });
    
    it("should include only specified types", async () => {
      // Only patterns
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['patterns'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      // Mock PatternAnalyzer
      const { PatternAnalyzer } = require("../../src/core/patterns");
      jest.spyOn(PatternAnalyzer.prototype, 'getPatterns').mockResolvedValue([
        {
          id: "pat-1",
          type: "code",
          value: "async function",
          frequency: 10,
          firstSeen: "2025-01-01",
          lastSeen: "2025-01-10",
          examples: ["async function fetchData()"]
        },
      ]);
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      expect(result.content).toContain("Recurring Patterns");
      expect(result.content).not.toContain("Recent Work");
      expect(result.content).not.toContain("Knowledge Base");
    });
  });
  
  describe("previewAutoLoad", () => {
    it("should generate formatted preview", async () => {
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const preview = await contextLoader.previewAutoLoad();
      
      expect(preview).toContain("AUTO-LOAD CONTEXT PREVIEW");
      expect(preview).toContain("Strategy: smart");
      expect(preview).toContain("Size:");
      expect(preview).toContain("Items:");
      expect(preview).toContain("Generated:");
    });
  });
  
  describe("edge cases", () => {
    it("should handle missing archive directories", async () => {
      mockExistsSync.mockReturnValue(false);
      
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions', 'patterns', 'knowledge', 'prompts'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      expect(result.content).toContain("Project Context: test-project");
      expect(result.itemCount).toBe(1); // Project header counts as 1 item
    });
    
    it("should handle corrupted JSON files", async () => {
      mockReadFileSync.mockImplementation(() => {
        return "{ invalid json }";
      });
      
      jest.spyOn(ConfigManager.prototype, 'getAutoLoadSettings').mockReturnValue({
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary',
      });
      
      contextLoader = new ContextLoader();
      const result = await contextLoader.getAutoLoadContext();
      
      // Should handle error gracefully
      expect(result.content).toBeDefined();
      expect(result.strategy).toBe("smart");
    });
  });
});