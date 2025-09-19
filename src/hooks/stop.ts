#!/usr/bin/env node
/**
 * Stop Hook Handler for c0ntextKeeper
 *
 * Captures complete Q&A exchanges after Claude finishes responding
 * Builds a knowledge base of problem-solution pairs
 */

import { SecurityFilter } from "../utils/security-filter";
import { FileStore } from "../storage/file-store";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ContextExtractor } from "../core/extractor";
import { RelevanceScorer } from "../core/scorer";
import { getStoragePath } from "../utils/path-resolver";
import { getHookStoragePath } from "../utils/project-utils";
import * as fs from "fs";
import * as path from "path";

// Debug logging utility
const DEBUG = process.env.C0NTEXTKEEPER_DEBUG === 'true';
const debugLog = (message: string, data?: any) => {
  if (!DEBUG) return;
  
  const logDir = path.join(process.env.HOME || '', '.c0ntextkeeper', 'debug');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `stop-${new Date().toISOString().split('T')[0]}.log`);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
  
  fs.appendFileSync(logFile, logEntry, 'utf-8');
};

interface StopHookInput {
  hook_event_name: "Stop" | "stop" | "SubagentStop";
  session_id: string;
  exchange: {
    user_prompt: string;
    assistant_response: string;
    tools_used?: string[];
    files_modified?: string[];
  };
  timestamp: string;
  project_path?: string;
}

interface QAPair {
  sessionId: string;
  timestamp: string;
  question: string;
  answer: string;
  toolsUsed: string[];
  filesModified: string[];
  topics: string[];
  relevanceScore: number;
  hasSolution: boolean;
  hasError: boolean;
}

async function processExchange(input: StopHookInput): Promise<void> {
  const securityFilter = new SecurityFilter();
  const storage = new FileStore();
  // const extractor = new ContextExtractor();
  const scorer = new RelevanceScorer();
  
  debugLog('processExchange called', {
    session_id: input.session_id,
    hasExchange: !!input.exchange,
    hasTranscriptPath: !!(input as any).transcript_path,
    timestamp: input.timestamp
  });

  try {
    // Filter sensitive data
    const safeQuestion = securityFilter.filterText(input.exchange.user_prompt);
    const safeAnswer = securityFilter.filterText(
      input.exchange.assistant_response,
    );

    // Extract topics and patterns
    const topics = extractTopics(safeQuestion + " " + safeAnswer);

    // Check if this is a valuable exchange
    const hasSolution = /fixed|solved|implemented|created|updated|added/i.test(
      safeAnswer,
    );
    const hasError = /error|failed|issue|problem|bug/i.test(safeAnswer);

    // Calculate relevance
    const relevanceScore = scorer.scoreContent({
      type: "exchange",
      content: safeAnswer,
      metadata: {
        hasCode: /```[\s\S]*?```/.test(safeAnswer),
        hasSolution,
        hasError,
        toolsUsed: input.exchange.tools_used?.length || 0,
      },
    });

    // Skip low-value exchanges
    if (relevanceScore < 0.3 && !hasSolution && !hasError) {
      // Skip low relevance exchanges
      return;
    }

    // Build Q&A pair
    const qaPair: QAPair = {
      sessionId: input.session_id,
      timestamp: input.timestamp || new Date().toISOString(),
      question: safeQuestion,
      answer: safeAnswer,
      toolsUsed: input.exchange.tools_used || [],
      filesModified: input.exchange.files_modified || [],
      topics,
      relevanceScore,
      hasSolution,
      hasError,
    };

    // Store in knowledge base as JSON for better readability
    const dateString = new Date().toISOString().split("T")[0];
    const workingDir = input.project_path || process.cwd();

    // Use proper storage resolution (respects env vars and storage hierarchy)
    const basePath = getStoragePath({
      projectPath: workingDir,
      createIfMissing: true,
    });

    // Use unified project-based storage structure
    const storagePath = getHookStoragePath(
      basePath,
      "knowledge",
      workingDir,
      dateString,
      "knowledge.json",
    );

    // Ensure directory exists
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing Q&A pairs or create new array
    let qaPairs: QAPair[] = [];
    if (fs.existsSync(storagePath)) {
      try {
        const existingData = fs.readFileSync(storagePath, "utf-8");
        qaPairs = JSON.parse(existingData);
        // Ensure it's an array
        if (!Array.isArray(qaPairs)) {
          qaPairs = [];
        }
      } catch {
        // Failed to parse existing knowledge file
        qaPairs = [];
      }
    }

    // Add new Q&A pair to array
    qaPairs.push(qaPair);

    // Write back as formatted JSON
    fs.writeFileSync(storagePath, JSON.stringify(qaPairs, null, 2), "utf-8");
    
    debugLog('Q&A pair stored successfully', {
      storagePath,
      qaPairsCount: qaPairs.length,
      relevanceScore: qaPair.relevanceScore,
      hasSolution,
      hasError
    });

    // If this solved a problem, also store in solutions index
    if (hasSolution) {
      await indexSolution(qaPair, storage);
    }

    // Q&A captured successfully
  } catch {
    // Error processing Q&A exchange
    // Non-blocking error
    process.exit(0);
  }
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];

  // Common programming topics
  const topicPatterns = [
    { pattern: /auth(entication|orization)?/gi, topic: "authentication" },
    { pattern: /database|db|sql|postgres|mysql|mongo/gi, topic: "database" },
    { pattern: /api|endpoint|rest|graphql/gi, topic: "api" },
    { pattern: /test(ing)?|jest|mocha|vitest/gi, topic: "testing" },
    { pattern: /error|bug|fix|issue|problem/gi, topic: "debugging" },
    {
      pattern: /deploy|deployment|ci\/cd|docker|kubernetes/gi,
      topic: "deployment",
    },
    { pattern: /typescript|javascript|node|npm/gi, topic: "javascript" },
    { pattern: /react|vue|angular|svelte/gi, topic: "frontend" },
    { pattern: /css|style|tailwind|sass/gi, topic: "styling" },
    { pattern: /security|encrypt|hash|token|jwt/gi, topic: "security" },
    { pattern: /performance|optimize|speed|cache/gi, topic: "performance" },
    { pattern: /git|github|version|branch|merge/gi, topic: "version-control" },
  ];

  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(text) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics;
}

async function indexSolution(
  qaPair: QAPair,
  storage: FileStore,
): Promise<void> {
  // Create a solutions index for quick retrieval at root level
  const solutionsPath = path.join(
    storage.getRootPath(),
    "solutions",
    "index.json",
  );

  const dir = path.dirname(solutionsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let solutions: any[] = [];
  if (fs.existsSync(solutionsPath)) {
    const content = fs.readFileSync(solutionsPath, "utf-8");
    solutions = JSON.parse(content);
  }

  // Add new solution
  solutions.push({
    timestamp: qaPair.timestamp,
    problem: qaPair.question.substring(0, 100),
    solution: qaPair.answer.substring(0, 200),
    topics: qaPair.topics,
    filesModified: qaPair.filesModified,
    relevance: qaPair.relevanceScore,
  });

  // Keep only recent solutions (last 1000)
  if (solutions.length > 1000) {
    solutions = solutions.slice(-1000);
  }

  fs.writeFileSync(solutionsPath, JSON.stringify(solutions, null, 2));
}

// Main execution
async function main() {
  debugLog('Stop hook started');
  
  let input = "";

  // Read from stdin
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    debugLog('Input received', { length: input.length });

    if (!input) {
      debugLog('No input provided, exiting');
      // No input provided
      process.exit(0);
    }

    try {
      const hookData = JSON.parse(input) as any; // Use any for now to see structure
      
      debugLog('Parsed hook data', {
        hook_event_name: hookData.hook_event_name,
        session_id: hookData.session_id,
        hasExchange: !!hookData.exchange,
        hasTranscriptPath: !!hookData.transcript_path,
        hasUserPrompt: !!hookData.user_prompt,
        hasAssistantResponse: !!hookData.assistant_response,
        keys: Object.keys(hookData)
      });

      // Validate hook event (handle multiple names)
      const validEvents = ["Stop", "stop", "SubagentStop", "stop_hook", "StopHook"];
      if (!validEvents.some(event => 
        hookData.hook_event_name?.toLowerCase() === event.toLowerCase()
      )) {
        debugLog('Not a Stop event', {
          received: hookData.hook_event_name,
          expected: validEvents
        });
        // Not a Stop event
        process.exit(0);
      }

      // Check if exchange exists and has expected structure
      if (!hookData.exchange) {
        debugLog('No exchange data, checking for transcript_path');
        
        // Claude Code sends transcript_path instead of exchange data
        if (hookData.transcript_path) {
          debugLog('Reading transcript from', { path: hookData.transcript_path });
          
          // Read the transcript and extract the last exchange
          try {
            const transcriptData = fs.readFileSync(hookData.transcript_path, "utf-8");
            const lines = transcriptData.trim().split("\n");
            
            debugLog('Transcript lines count', { count: lines.length });
            
            let lastUserPrompt = "";
            let lastAssistantResponse = "";
            const toolsUsed: string[] = [];
            const filesModified: string[] = [];
            
            // Parse JSONL to find last user prompt and assistant response
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const entry = JSON.parse(line);
                
                // Extract user prompt
                if (entry.type === "human" || entry.role === "user") {
                  lastUserPrompt = Array.isArray(entry.content) 
                    ? entry.content.map((c: any) => c.text || "").join(" ")
                    : entry.content || "";
                }
                
                // Extract assistant response
                if (entry.type === "assistant" || entry.role === "assistant") {
                  lastAssistantResponse = Array.isArray(entry.content)
                    ? entry.content.map((c: any) => c.text || "").join(" ")
                    : entry.content || "";
                }
                
                // Track tool usage
                if (entry.type === "tool_use" || entry.name === "tool_use") {
                  toolsUsed.push(entry.tool || entry.name || "unknown");
                  if (entry.input?.file_path || entry.input?.path) {
                    filesModified.push(entry.input.file_path || entry.input.path);
                  }
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
            
            // Create exchange from extracted data
            if (lastUserPrompt && lastAssistantResponse) {
              debugLog('Extracted Q&A from transcript', {
                promptLength: lastUserPrompt.length,
                responseLength: lastAssistantResponse.length,
                toolsCount: toolsUsed.length,
                filesCount: filesModified.length
              });
              
              hookData.exchange = {
                user_prompt: lastUserPrompt,
                assistant_response: lastAssistantResponse,
                tools_used: [...new Set(toolsUsed)], // Remove duplicates
                files_modified: [...new Set(filesModified)],
              };
            } else {
              debugLog('No complete Q&A exchange found in transcript');
              // No complete Q&A exchange found in transcript
              process.exit(0);
            }
          } catch (error) {
            debugLog('Failed to read transcript', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Failed to read transcript
            process.exit(0);
          }
        } else if (hookData.user_prompt && hookData.assistant_response) {
          debugLog('Using flat structure for exchange data');
          
          // Support flat structure for backward compatibility
          hookData.exchange = {
            user_prompt: hookData.user_prompt,
            assistant_response: hookData.assistant_response,
            tools_used: hookData.tools_used,
            files_modified: hookData.files_modified,
          };
        } else {
          debugLog('Missing exchange data in hook input');
          // Missing exchange data in hook input
          process.exit(0);
        }
      }

      await processExchange(hookData as StopHookInput);
      process.exit(0);
    } catch (error) {
      console.error(
        JSON.stringify({
          status: "error",
          message: `Failed to parse input: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
      process.exit(0);
    }
  });

  // Handle timeout
  setTimeout(() => {
    // Hook timeout after 5 seconds
    process.exit(0);
  }, 5000);
}

// Run if executed directly
if (require.main === module) {
  main().catch(() => {
    // Error in main execution
    process.exit(0);
  });
}

export { processExchange, StopHookInput, QAPair };
