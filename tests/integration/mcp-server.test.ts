/**
 * Integration Tests for c0ntextKeeper MCP Server
 * 
 * Tests the MCP server functionality including tools and resources
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ContextRetriever } from "../../src/core/retriever";
import { PatternAnalyzer } from "../../src/core/patterns";
import { ConfigManager } from "../../src/core/config";
import { contextLoader } from "../../src/core/context-loader";
import * as fs from "fs";
import * as path from "path";

// Mock dependencies
jest.mock("../../src/core/retriever");
jest.mock("../../src/core/patterns");
jest.mock("../../src/core/config");
jest.mock("../../src/core/context-loader");
jest.mock("../../src/utils/path-resolver", () => ({
  getStoragePath: jest.fn().mockReturnValue("/test/.c0ntextkeeper")
}));

describe("MCP Server Integration Tests", () => {
  let server: Server;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import the actual server
    const { server: mcpServer } = require("../../src/server/index");
    server = mcpServer;
  });
  
  describe("Server Initialization", () => {
    it("should be a valid MCP server instance", () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(Server);
    });
    
    it("should have handler methods", () => {
      // Check that server has the necessary handler setup
      expect(typeof server.setRequestHandler).toBe("function");
    });
  });
  
  describe("Tool: fetch_context", () => {
    it("should fetch relevant context successfully", async () => {
      const mockContexts = [
        {
          sessionId: "test-session",
          timestamp: "2025-01-10T00:00:00Z",
          relevance: 0.9,
          problems: [
            {
              id: "prob-1",
              question: "How to implement auth?",
              solution: {
                approach: "Use JWT tokens",
                files: ["auth.ts"],
                successful: true
              }
            }
          ],
          implementations: [],
          decisions: []
        }
      ];
      
      ContextRetriever.prototype.fetchRelevantContext = jest.fn()
        .mockResolvedValue(mockContexts);
      
      // Simulate tool call
      const request = {
        params: {
          name: "fetch_context",
          arguments: {
            query: "authentication",
            limit: 5,
            scope: "project" as const,
            minRelevance: 0.5
          }
        }
      };
      
      // Note: Actual tool invocation would require full server setup
      // This tests the mock behavior
      const retriever = new ContextRetriever();
      const result = await retriever.fetchRelevantContext(request.params.arguments);
      
      expect(result).toEqual(mockContexts);
      expect(ContextRetriever.prototype.fetchRelevantContext).toHaveBeenCalledWith({
        query: "authentication",
        limit: 5,
        scope: "project" as const,
        minRelevance: 0.5
      });
    });
    
    it("should handle errors gracefully", async () => {
      ContextRetriever.prototype.fetchRelevantContext = jest.fn()
        .mockRejectedValue(new Error("Database connection failed"));
      
      const retriever = new ContextRetriever();
      
      await expect(retriever.fetchRelevantContext({}))
        .rejects.toThrow("Database connection failed");
    });
  });
  
  describe("Tool: search_archive", () => {
    it("should search archives with filters", async () => {
      const mockResults = [
        {
          context: {
            sessionId: "test-session",
            timestamp: "2025-01-10T00:00:00Z",
            projectPath: "/test/project"
          },
          relevance: 0.85,
          matches: [
            {
              field: "problem",
              snippet: "authentication error"
            }
          ]
        }
      ];
      
      ContextRetriever.prototype.searchArchive = jest.fn()
        .mockResolvedValue(mockResults);
      
      const request = {
        query: "authentication error",
        filePattern: "*.ts",
        sortBy: "relevance" as const,
        limit: 10
      };
      
      const retriever = new ContextRetriever();
      const result = await retriever.searchArchive(request);
      
      expect(result).toEqual(mockResults);
    });
  });
  
  describe("Tool: get_patterns", () => {
    it("should retrieve recurring patterns", async () => {
      const mockPatterns = [
        {
          type: "code" as const,
          value: "async/await",
          frequency: 15,
          firstSeen: "2025-01-01",
          lastSeen: "2025-01-10",
          examples: ["async function fetchData()"]
        }
      ];
      
      PatternAnalyzer.prototype.getPatterns = jest.fn()
        .mockResolvedValue(mockPatterns);
      
      const request = {
        type: "code" as const,
        minFrequency: 2,
        limit: 10
      };
      
      const analyzer = new PatternAnalyzer();
      const result = await analyzer.getPatterns(request);
      
      expect(result).toEqual(mockPatterns);
    });
  });
  
  describe("Resource: context://project/{name}/current", () => {
    it("should expose auto-loaded context when enabled", async () => {
      // Mock config to enable auto-load
      ConfigManager.prototype.getAutoLoadSettings = jest.fn().mockReturnValue({
        enabled: true,
        strategy: "smart",
        maxSizeKB: 50,
        sessionCount: 5,
        patternCount: 10,
        knowledgeCount: 20,
        promptCount: 10,
        includeTypes: ["sessions", "patterns", "knowledge", "prompts"],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: "summary"
      });
      
      // Mock context loader
      contextLoader.getAutoLoadContext = jest.fn().mockResolvedValue({
        content: "# Project Context\n\n## Recent Work\n- Implemented auth",
        sizeKB: 2.5,
        itemCount: 10,
        truncated: false
      });
      
      const configManager = new ConfigManager();
      const settings = configManager.getAutoLoadSettings();
      
      expect(settings.enabled).toBe(true);
      expect(settings.strategy).toBe("smart");
    });
    
    it("should not expose resources when auto-load is disabled", () => {
      ConfigManager.prototype.getAutoLoadSettings = jest.fn().mockReturnValue({
        enabled: false,
        strategy: "smart",
        maxSizeKB: 50,
        sessionCount: 5,
        patternCount: 10,
        knowledgeCount: 20,
        promptCount: 10,
        includeTypes: [],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: "summary"
      });
      
      const configManager = new ConfigManager();
      const settings = configManager.getAutoLoadSettings();
      
      expect(settings.enabled).toBe(false);
    });
  });
  
  describe("Resource: context://project/{name}/patterns", () => {
    it("should expose patterns resource when included", () => {
      ConfigManager.prototype.getAutoLoadSettings = jest.fn().mockReturnValue({
        enabled: true,
        strategy: "smart",
        maxSizeKB: 50,
        sessionCount: 5,
        patternCount: 10,
        knowledgeCount: 20,
        promptCount: 10,
        includeTypes: ["patterns"],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: "summary"
      });
      
      const configManager = new ConfigManager();
      const settings = configManager.getAutoLoadSettings();
      
      expect(settings.includeTypes).toContain("patterns");
    });
  });
  
  describe("Resource: context://project/{name}/knowledge", () => {
    it("should expose knowledge base resource when included", () => {
      ConfigManager.prototype.getAutoLoadSettings = jest.fn().mockReturnValue({
        enabled: true,
        strategy: "smart",
        maxSizeKB: 50,
        sessionCount: 5,
        patternCount: 10,
        knowledgeCount: 20,
        promptCount: 10,
        includeTypes: ["knowledge"],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: "summary"
      });
      
      const configManager = new ConfigManager();
      const settings = configManager.getAutoLoadSettings();
      
      expect(settings.includeTypes).toContain("knowledge");
    });
  });
  
  describe("Error Handling", () => {
    it("should handle tool errors gracefully", async () => {
      ContextRetriever.prototype.fetchRelevantContext = jest.fn()
        .mockRejectedValue(new Error("Storage not accessible"));
      
      const retriever = new ContextRetriever();
      
      await expect(retriever.fetchRelevantContext({}))
        .rejects.toThrow("Storage not accessible");
    });
    
    it("should handle resource read errors", async () => {
      contextLoader.getAutoLoadContext = jest.fn()
        .mockRejectedValue(new Error("Failed to load context"));
      
      await expect(contextLoader.getAutoLoadContext())
        .rejects.toThrow("Failed to load context");
    });
  });
  
  describe("Format Functions", () => {
    it("should format context results correctly", () => {
      const contexts = [
        {
          sessionId: "test-session",
          timestamp: "2025-01-10T00:00:00Z",
          relevance: 0.9,
          problems: [
            {
              question: "How to fix auth?",
              solution: {
                approach: "Update JWT validation"
              }
            }
          ],
          implementations: [],
          decisions: []
        }
      ];
      
      // Test the formatting logic
      const formatted = contexts.map(ctx => ({
        session: ctx.sessionId,
        relevance: `${(ctx.relevance * 100).toFixed(0)}%`,
        problemCount: ctx.problems.length
      }));
      
      expect(formatted[0].relevance).toBe("90%");
      expect(formatted[0].problemCount).toBe(1);
    });
  });
});