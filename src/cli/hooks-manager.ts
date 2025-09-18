/**
 * Hook Management CLI for c0ntextKeeper
 *
 * Manages multiple Claude Code hooks:
 * - Enable/disable individual hooks
 * - Configure hook settings
 * - List active hooks
 * - Test hook functionality
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

interface HookConfig {
  matcher: string;
  hooks: Array<{
    type: string;
    command: string;
  }>;
}

interface ClaudeSettings {
  hooks?: {
    [key: string]: HookConfig[];
  };
  [key: string]: any;
}

const HOOK_DEFINITIONS: Record<
  string,
  {
    script: string;
    description: string;
    matcher: string;
    enabled: boolean;
  }
> = {
  PreCompact: {
    script: "precompact.js",
    description: "Captures context before /compact",
    matcher: "*",
    enabled: true,
  },
  UserPromptSubmit: {
    script: "userprompt.js",
    description: "Tracks user questions and prompts",
    matcher: "*",
    enabled: false,
  },
  PostToolUse: {
    script: "posttool.js",
    description: "Captures tool results and patterns",
    matcher: "*",
    enabled: false,
  },
  Stop: {
    script: "stop.js",
    description: "Captures complete Q&A exchanges",
    matcher: "*",
    enabled: false,
  },
};

export class HooksManager {
  private settingsPath: string;
  private projectRoot: string;

  constructor() {
    this.settingsPath = path.join(os.homedir(), ".claude", "settings.json");
    this.projectRoot = path.join(__dirname, "..", "..");
  }

  /**
   * List all available hooks and their status
   */
  async listHooks(): Promise<void> {
    const settings = this.loadSettings();

    console.log("\n📋 Available c0ntextKeeper Hooks:\n");
    console.log("─".repeat(60));

    for (const [hookName, config] of Object.entries(HOOK_DEFINITIONS)) {
      const isEnabled = this.isHookEnabled(hookName, settings);
      const status = isEnabled ? "✅ Enabled" : "⭕ Disabled";

      console.log(`${status}  ${hookName}`);
      console.log(`        ${config.description}`);
      console.log(`        Matcher: ${config.matcher}`);
      console.log("");
    }

    console.log("─".repeat(60));
    console.log("\nTo enable a hook:  c0ntextkeeper hooks enable <hook-name>");
    console.log("To disable a hook: c0ntextkeeper hooks disable <hook-name>");
  }

  /**
   * Enable a specific hook
   */
  async enableHook(hookName: string): Promise<void> {
    const normalizedName = this.normalizeHookName(hookName);

    if (!HOOK_DEFINITIONS[normalizedName]) {
      console.error(`❌ Unknown hook: ${hookName}`);
      console.log(
        "\nAvailable hooks:",
        Object.keys(HOOK_DEFINITIONS).join(", "),
      );
      return;
    }

    const settings = this.loadSettings();
    const hookDef = HOOK_DEFINITIONS[normalizedName];
    const hookPath = path.join(
      this.projectRoot,
      "dist",
      "hooks",
      hookDef.script,
    );

    // Ensure hook is built
    if (!fs.existsSync(hookPath)) {
      console.log("⚠️  Hook script not found. Building project...");
      execSync("npm run build", { cwd: this.projectRoot, stdio: "inherit" });
    }

    // Add hook to settings
    if (!settings.hooks) {
      settings.hooks = {};
    }

    settings.hooks[normalizedName] = [
      {
        matcher: hookDef.matcher,
        hooks: [
          {
            type: "command",
            command: `node ${hookPath}`,
          },
        ],
      },
    ];

    this.saveSettings(settings);

    console.log(`✅ Enabled ${normalizedName} hook`);
    console.log(`   Matcher: ${hookDef.matcher}`);
    console.log(`   Script: ${hookPath}`);
    console.log("\n📝 Note: Restart Claude Code for changes to take effect");
  }

  /**
   * Disable a specific hook
   */
  async disableHook(hookName: string): Promise<void> {
    const normalizedName = this.normalizeHookName(hookName);

    if (!HOOK_DEFINITIONS[normalizedName]) {
      console.error(`❌ Unknown hook: ${hookName}`);
      return;
    }

    const settings = this.loadSettings();

    if (settings.hooks && settings.hooks[normalizedName]) {
      delete settings.hooks[normalizedName];
      this.saveSettings(settings);
      console.log(`✅ Disabled ${normalizedName} hook`);
      console.log("\n📝 Note: Restart Claude Code for changes to take effect");
    } else {
      console.log(`ℹ️  ${normalizedName} hook is already disabled`);
    }
  }

  /**
   * Configure a hook's settings
   */
  async configureHook(hookName: string, matcher?: string): Promise<void> {
    const normalizedName = this.normalizeHookName(hookName);

    if (!HOOK_DEFINITIONS[normalizedName]) {
      console.error(`❌ Unknown hook: ${hookName}`);
      return;
    }

    const settings = this.loadSettings();

    if (!settings.hooks?.[normalizedName]) {
      console.error(`❌ ${normalizedName} hook is not enabled`);
      console.log(`   Run: c0ntextkeeper hooks enable ${hookName}`);
      return;
    }

    if (matcher) {
      settings.hooks[normalizedName][0].matcher = matcher;
      this.saveSettings(settings);
      console.log(`✅ Updated ${normalizedName} matcher to: ${matcher}`);
      console.log("\n📝 Note: Restart Claude Code for changes to take effect");
    }
  }

  /**
   * Test a specific hook
   */
  async testHook(hookName: string): Promise<void> {
    const normalizedName = this.normalizeHookName(hookName);

    if (!HOOK_DEFINITIONS[normalizedName]) {
      console.error(`❌ Unknown hook: ${hookName}`);
      return;
    }

    const hookDef = HOOK_DEFINITIONS[normalizedName];
    const hookPath = path.join(
      this.projectRoot,
      "dist",
      "hooks",
      hookDef.script,
    );

    if (!fs.existsSync(hookPath)) {
      console.error(`❌ Hook script not found: ${hookPath}`);
      console.log("   Run: npm run build");
      return;
    }

    console.log(`\n🧪 Testing ${normalizedName} hook...`);

    // Create test input based on hook type
    const testInput = this.createTestInput(normalizedName);

    try {
      const result = execSync(
        `echo '${JSON.stringify(testInput)}' | node ${hookPath}`,
        {
          encoding: "utf-8",
          cwd: this.projectRoot,
        },
      );

      console.log("✅ Hook test successful!");
      console.log("   Output:", result);
    } catch (error: any) {
      console.error("❌ Hook test failed");
      console.error("   Error:", error.message);
    }
  }

  /**
   * Show hook statistics
   */
  async showStats(): Promise<void> {
    const basePath = path.join(os.homedir(), ".c0ntextkeeper");

    console.log("\n📊 c0ntextKeeper Hook Statistics:\n");
    console.log("─".repeat(60));

    // Check archive size
    if (fs.existsSync(path.join(basePath, "archive"))) {
      const archiveCount = this.countFiles(
        path.join(basePath, "archive"),
        ".json",
      );
      console.log(`📦 Archives: ${archiveCount} sessions preserved`);
    }

    // Check prompts
    if (fs.existsSync(path.join(basePath, "prompts"))) {
      const promptCount = this.countFiles(
        path.join(basePath, "prompts"),
        ".jsonl",
      );
      console.log(`💭 Prompts: ${promptCount} prompt files`);
    }

    // Check patterns
    if (fs.existsSync(path.join(basePath, "patterns"))) {
      const patternCount = this.countFiles(
        path.join(basePath, "patterns"),
        ".jsonl",
      );
      console.log(`🔧 Tool Patterns: ${patternCount} pattern files`);
    }

    // Check knowledge base
    if (fs.existsSync(path.join(basePath, "knowledge"))) {
      const knowledgeCount = this.countFiles(
        path.join(basePath, "knowledge"),
        ".jsonl",
      );
      console.log(`🧠 Knowledge: ${knowledgeCount} Q&A files`);
    }

    // Check errors
    if (fs.existsSync(path.join(basePath, "errors"))) {
      const errorCount = this.countFiles(
        path.join(basePath, "errors"),
        ".jsonl",
      );
      console.log(`⚠️  Errors: ${errorCount} error pattern files`);
    }

    // Calculate total size
    const totalSize = this.getDirectorySize(basePath);
    console.log(`\n💾 Total Storage: ${this.formatBytes(totalSize)}`);

    console.log("─".repeat(60));
  }

  // Helper methods

  private loadSettings(): ClaudeSettings {
    if (!fs.existsSync(this.settingsPath)) {
      return {};
    }

    const content = fs.readFileSync(this.settingsPath, "utf-8");
    return JSON.parse(content);
  }

  private saveSettings(settings: ClaudeSettings): void {
    const dir = path.dirname(this.settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
  }

  private isHookEnabled(hookName: string, settings: ClaudeSettings): boolean {
    return !!(settings.hooks && settings.hooks[hookName]);
  }

  private normalizeHookName(name: string): string {
    // Convert various formats to PascalCase
    const lower = name.toLowerCase();

    const mapping: { [key: string]: string } = {
      precompact: "PreCompact",
      "pre-compact": "PreCompact",
      userprompt: "UserPromptSubmit",
      "user-prompt": "UserPromptSubmit",
      userpromptsubmit: "UserPromptSubmit",
      posttool: "PostToolUse",
      "post-tool": "PostToolUse",
      posttooluse: "PostToolUse",
      stop: "Stop",
    };

    return mapping[lower] || name;
  }

  private createTestInput(hookName: string): any {
    const sessionId = "session-" + Date.now();
    const timestamp = new Date().toISOString();

    switch (hookName) {
      case "PreCompact":
        return {
          hook_event_name: "PreCompact",
          session_id: sessionId,
          transcript_path: path.join(
            this.projectRoot,
            "tests",
            "fixtures",
            "sample-transcript.jsonl",
          ),
          trigger: "manual",
          custom_instructions: "Test compaction",
        };

      case "UserPromptSubmit":
        return {
          hook_event_name: "UserPromptSubmit",
          session_id: sessionId,
          prompt: "How do I implement authentication?",
          timestamp,
        };

      case "PostToolUse":
        return {
          hook_event_name: "PostToolUse",
          session_id: sessionId,
          tool: "Write",
          input: { file_path: "test.ts", content: "// test" },
          result: { success: true },
          timestamp,
        };

      case "Stop":
        return {
          hook_event_name: "Stop",
          session_id: sessionId,
          exchange: {
            user_prompt: "How do I fix this error?",
            assistant_response:
              "You can fix it by updating the import statement.",
            tools_used: ["Edit"],
            files_modified: ["app.ts"],
          },
          timestamp,
        };

      default:
        return { hook_event_name: hookName, session_id: sessionId };
    }
  }

  private countFiles(dir: string, extension: string): number {
    if (!fs.existsSync(dir)) return 0;

    let count = 0;
    const walk = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith(extension)) {
          count++;
        }
      }
    };

    walk(dir);
    return count;
  }

  private getDirectorySize(dir: string): number {
    if (!fs.existsSync(dir)) return 0;

    let size = 0;
    const walk = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          size += stat.size;
        }
      }
    };

    walk(dir);
    return size;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// Export for CLI use
export default HooksManager;
