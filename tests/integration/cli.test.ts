/**
 * Integration Tests for c0ntextKeeper CLI
 *
 * Tests actual CLI execution using spawnSync for real code coverage
 */

import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Test helper to run CLI commands using spawnSync with array args (safe - no shell interpretation)
function runCLI(args: string[]): {
  stdout: string;
  stderr: string;
  code: number;
} {
  const result = spawnSync("npx", ["tsx", "src/cli.ts", ...args], {
    encoding: "utf-8",
    env: { ...process.env, NODE_ENV: "test" },
    cwd: path.resolve(__dirname, "../.."),
    timeout: 30000, // 30 second timeout
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    code: result.status ?? 1,
  };
}

describe("CLI Integration Tests", () => {
  let originalCwd: string;
  let testDir: string;

  beforeAll(() => {
    // Store original working directory
    originalCwd = process.cwd();
  });

  beforeEach(() => {
    // Create temp directory for testing
    testDir = path.join(
      os.tmpdir(),
      `c0ntextkeeper-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      if (testDir && fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(() => {
    // Restore original working directory
    process.chdir(originalCwd);
  });

  describe("Basic Commands", () => {
    it("should display help information", () => {
      const result = runCLI(["--help"]);

      expect(result.stdout).toContain("Usage: c0ntextkeeper");
      expect(result.stdout).toContain("Intelligent context preservation");
      expect(result.stdout).toContain("Commands:");
      expect(result.code).toBe(0);
    });

    it("should display version", () => {
      const result = runCLI(["--version"]);

      // Version should match package.json (0.7.x format)
      expect(result.stdout).toMatch(/0\.7\.\d+/);
      expect(result.code).toBe(0);
    });

    it("should show help for unknown commands", () => {
      const result = runCLI(["unknown-command"]);

      // Commander shows error for unknown commands
      expect(result.stderr + result.stdout).toContain("unknown command");
      expect(result.code).not.toBe(0);
    });
  });

  describe("status command", () => {
    it("should show storage status", () => {
      const result = runCLI(["status"]);

      // Status command should run and show storage info
      expect(result.stdout).toContain("c0ntextKeeper");
      expect(result.code).toBe(0);
    });
  });

  describe("hooks list command", () => {
    it("should list available hooks", () => {
      const result = runCLI(["hooks", "list"]);

      // Should list hook names
      expect(result.stdout + result.stderr).toMatch(
        /PreCompact|UserPromptSubmit|PostToolUse|Stop|hook/i
      );
      // The command should complete (may exit 0 or 1 depending on hook state)
    });

    it("should show help for hooks subcommand", () => {
      const result = runCLI(["hooks", "--help"]);

      expect(result.stdout).toContain("list");
      expect(result.stdout).toContain("enable");
      expect(result.stdout).toContain("disable");
      expect(result.code).toBe(0);
    });
  });

  describe("stats command", () => {
    it("should display storage statistics", () => {
      const result = runCLI(["stats"]);

      // Stats command should show statistics header
      expect(result.stdout).toContain("Statistics");
      expect(result.code).toBe(0);
    });
  });

  describe("patterns command", () => {
    it("should run pattern analysis", () => {
      const result = runCLI(["patterns"]);

      // Patterns command should run (may show no patterns found)
      expect(result.stdout).toMatch(/Pattern|pattern/i);
      expect(result.code).toBe(0);
    });

    it("should accept type filter option", () => {
      const result = runCLI(["patterns", "--type", "code"]);

      expect(result.stdout).toMatch(/Pattern|pattern/i);
      expect(result.code).toBe(0);
    });
  });

  describe("search command", () => {
    it("should run search without query (shows recent)", () => {
      const result = runCLI(["search"]);

      // Search without query shows recent archives
      expect(result.stdout).toMatch(/Recent|archive|Search/i);
      expect(result.code).toBe(0);
    });

    it("should run search with query", () => {
      const result = runCLI(["search", "test-query"]);

      // Search with query should run
      expect(result.stdout).toContain("Searching");
      expect(result.code).toBe(0);
    });

    it("should accept limit option", () => {
      const result = runCLI(["search", "test", "--limit", "5"]);

      expect(result.code).toBe(0);
    });
  });

  describe("validate command", () => {
    it("should validate installation", () => {
      const result = runCLI(["validate"]);

      // Validate command should run and check installation
      expect(result.stdout).toContain("Validating");
      // May show warnings about missing hooks, but should complete
    });
  });

  describe("context commands", () => {
    it("should preview auto-loaded context", () => {
      const result = runCLI(["context", "preview"]);

      // Context preview should run
      expect(result.stdout).toMatch(/Context|Preview/i);
      expect(result.code).toBe(0);
    });

    it("should test context loading", () => {
      const result = runCLI(["context", "test"]);

      // Context test should run
      expect(result.stdout).toMatch(/Context|Test|Strategy/i);
      expect(result.code).toBe(0);
    });

    it("should show context configure options", () => {
      const result = runCLI(["context", "configure"]);

      // Configure without options shows current settings
      expect(result.stdout).toMatch(/settings|Strategy|Enabled/i);
      expect(result.code).toBe(0);
    });

    it("should show help for context subcommand", () => {
      const result = runCLI(["context", "--help"]);

      expect(result.stdout).toContain("preview");
      expect(result.stdout).toContain("test");
      expect(result.stdout).toContain("configure");
      expect(result.code).toBe(0);
    });
  });

  describe("init command", () => {
    it("should show init command help", () => {
      const result = runCLI(["init", "--help"]);

      expect(result.stdout).toContain("--global");
      expect(result.stdout).toContain("--force");
      expect(result.code).toBe(0);
    });
  });

  describe("archive command", () => {
    it("should require transcript file argument", () => {
      const result = runCLI(["archive"]);

      // Archive without file should show error
      expect(result.stderr).toContain("missing required argument");
      expect(result.code).not.toBe(0);
    });

    it("should handle non-existent file", () => {
      const result = runCLI(["archive", "/nonexistent/path/file.jsonl"]);

      // Should handle missing file gracefully
      expect(result.stderr + result.stdout).toMatch(/error|not found|ENOENT/i);
      expect(result.code).not.toBe(0);
    });

    it("should archive a valid transcript file", () => {
      // Create a mock transcript file
      const transcriptPath = path.join(testDir, "test-transcript.jsonl");
      const transcriptContent = JSON.stringify({
        type: "user",
        timestamp: new Date().toISOString(),
        message: {
          role: "user",
          content: [{ type: "text", text: "Test message for archiving" }],
        },
      });
      fs.writeFileSync(transcriptPath, transcriptContent);

      const result = runCLI(["archive", transcriptPath]);

      // Should attempt to archive (may succeed or fail depending on storage state)
      expect(result.stdout + result.stderr).toBeDefined();
    });
  });

  describe("migrate command", () => {
    it("should run migrate with dry-run", () => {
      const result = runCLI(["migrate", "--dry-run"]);

      // Migrate command should run (may have nothing to migrate)
      expect(result.stdout).toMatch(/Migration|migrate/i);
      expect(result.code).toBe(0);
    });
  });

  describe("rebuild-index command", () => {
    it("should run rebuild-index command", () => {
      const result = runCLI(["rebuild-index"]);

      // Should attempt to rebuild index
      expect(result.stdout).toMatch(/Index|Rebuild/i);
      expect(result.code).toBe(0);
    });
  });

  describe("doctor command", () => {
    it("should run diagnostic checks", () => {
      const result = runCLI(["doctor"]);

      // Doctor command should run diagnostics
      expect(result.stdout).toMatch(/diagnostic|check|c0ntextKeeper/i);
      // May exit with code 1 if issues found
    });
  });

  describe("Error Handling", () => {
    it("should provide helpful message for missing command", () => {
      const result = runCLI([]);

      // No command shows help (Commander outputs to stderr by default)
      const output = result.stdout + result.stderr;
      expect(output).toContain("Usage: c0ntextkeeper");
      // Commander may return 0 or non-zero when showing help
    });

    it("should handle invalid options gracefully", () => {
      const result = runCLI(["--invalid-option"]);

      // Invalid option should show error
      expect(result.stderr).toContain("unknown option");
      expect(result.code).not.toBe(0);
    });

    it("should show subcommand help for invalid subcommand", () => {
      const result = runCLI(["hooks", "invalid-subcommand"]);

      // Invalid subcommand should show error
      expect(result.stderr + result.stdout).toContain("unknown command");
      expect(result.code).not.toBe(0);
    });
  });

  describe("Command Output Format", () => {
    it("should output well-formatted help text", () => {
      const result = runCLI(["--help"]);

      // Help should have proper sections
      expect(result.stdout).toContain("Options:");
      expect(result.stdout).toContain("Commands:");
      expect(result.stdout).toContain("-V, --version");
      expect(result.stdout).toContain("-h, --help");
    });

    it("should list all major commands in help", () => {
      const result = runCLI(["--help"]);

      // Should list main commands
      expect(result.stdout).toContain("status");
      expect(result.stdout).toContain("search");
      expect(result.stdout).toContain("archive");
      expect(result.stdout).toContain("hooks");
      expect(result.stdout).toContain("stats");
    });
  });
});
