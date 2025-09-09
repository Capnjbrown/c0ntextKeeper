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
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

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
      console.log(
        JSON.stringify({
          status: "skipped",
          message: "Low relevance exchange",
        }),
      );
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
    const projectHash = crypto
      .createHash("md5")
      .update(input.project_path || process.cwd())
      .digest("hex")
      .substring(0, 8);

    // Store knowledge at root level, not under archive/
    const storagePath = path.join(
      process.env.HOME || "",
      ".c0ntextkeeper",
      "knowledge",
      projectHash,
      `${new Date().toISOString().split("T")[0]}-knowledge.json`,
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
        const existingData = fs.readFileSync(storagePath, 'utf-8');
        qaPairs = JSON.parse(existingData);
        // Ensure it's an array
        if (!Array.isArray(qaPairs)) {
          qaPairs = [];
        }
      } catch (error) {
        console.error(`Failed to parse existing knowledge file: ${error}`);
        qaPairs = [];
      }
    }

    // Add new Q&A pair to array
    qaPairs.push(qaPair);

    // Write back as formatted JSON
    fs.writeFileSync(storagePath, JSON.stringify(qaPairs, null, 2), 'utf-8');

    // If this solved a problem, also store in solutions index
    if (hasSolution) {
      await indexSolution(qaPair, storage);
    }

    console.log(
      JSON.stringify({
        status: "success",
        message: `Q&A captured: "${safeQuestion.substring(0, 30)}..."`,
        stats: {
          relevance: relevanceScore.toFixed(2),
          hasSolution,
          hasError,
          topics: topics.length,
          tools: qaPair.toolsUsed.length,
        },
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    );
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
  // Create a solutions index for quick retrieval
  const solutionsPath = path.join(
    storage.getBasePath(),
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
  let input = "";

  // Read from stdin
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    if (!input) {
      console.log(
        JSON.stringify({
          status: "skipped",
          message: "No input provided",
        }),
      );
      process.exit(0);
    }

    try {
      const hookData = JSON.parse(input) as StopHookInput;

      // Validate hook event (handle multiple names)
      const validEvents = ["Stop", "stop", "SubagentStop"];
      if (!validEvents.includes(hookData.hook_event_name)) {
        console.log(
          JSON.stringify({
            status: "skipped",
            message: "Not a Stop event",
          }),
        );
        process.exit(0);
      }

      await processExchange(hookData);
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
    console.error(
      JSON.stringify({
        status: "error",
        message: "Hook timeout after 5 seconds",
      }),
    );
    process.exit(0);
  }, 5000);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        status: "error",
        message: error.message,
      }),
    );
    process.exit(0);
  });
}

export { processExchange, StopHookInput, QAPair };
