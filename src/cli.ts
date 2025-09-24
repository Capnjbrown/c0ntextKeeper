#!/usr/bin/env node

/**
 * c0ntextKeeper CLI
 * Command-line interface for managing context preservation
 */

import { Command } from "commander";
import { ContextArchiver } from "./core/archiver.js";
import { ContextRetriever } from "./core/retriever.js";
import { PatternAnalyzer } from "./core/patterns.js";
import { SearchIndexer } from "./core/indexer.js";
import { FileStore } from "./storage/file-store.js";
import { Logger } from "./utils/logger.js";
import { formatTimestamp, formatFileSize } from "./utils/formatter.js";
import { styles, formatHeader, formatSuccess, formatWarning, formatError, formatTable } from "./utils/cli-styles.js";
import { initCommand, statusCommand } from "./cli/init.js";
import { execSync } from "child_process";
import path from "path";
import * as fs from "fs";
import * as os from "os";

const logger = new Logger("CLI", undefined, false);
const program = new Command();

program
  .name("c0ntextkeeper")
  .description("Intelligent context preservation for Claude Code")
  .version("0.7.4")
  .showHelpAfterError("(add --help for additional information)");

// Setup command
program
  .command("setup")
  .description("Configure c0ntextKeeper hooks for Claude Code")
  .action(async () => {
    try {
      // Use the setup-hooks.js script
      const setupScript = path.join(
        __dirname,
        "..",
        "scripts",
        "setup-hooks.js",
      );
      execSync(`node ${setupScript}`, { stdio: "inherit" });
    } catch (error) {
      logger.error("Setup failed:", error);
      process.exit(1);
    }
  });

// Init command for storage initialization
program
  .command("init")
  .description("Initialize c0ntextkeeper storage")
  .option("--global", "Initialize global storage")
  .option("--force", "Force reinitialization")
  .option("--skip-gitignore", "Skip adding to .gitignore")
  .option("--project-name <name>", "Set project name")
  .action(async (options) => {
    await initCommand(options);
  });

// Archive command
program
  .command("archive <transcript>")
  .description(
    "Manually archive a JSONL transcript file (e.g., path/to/transcript.jsonl)",
  )
  .action(async (transcriptPath: string) => {
    try {
      logger.info(`Archiving transcript: ${transcriptPath}`);

      const archiver = new ContextArchiver();
      const result = await archiver.archiveFromTranscript(transcriptPath);

      if (result.success) {
        console.log(formatSuccess("✅ Context archived successfully!"));
        console.log(styles.info(`📁 Location: ${result.archivePath}`));
        console.log();
        console.log(styles.header("📊 Statistics:"));
        console.log(styles.muted(`  Problems: ${result.stats?.problems || 0}`));
        console.log(styles.muted(`  Implementations: ${result.stats?.implementations || 0}`));
        console.log(styles.muted(`  Decisions: ${result.stats?.decisions || 0}`));
        console.log(styles.muted(`  Patterns: ${result.stats?.patterns || 0}`));
        console.log(
          styles.highlight(`  Relevance: ${((result.stats?.relevanceScore || 0) * 100).toFixed(0)}%`),
        );
      } else {
        console.error(formatError(`Archive failed: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      logger.error("Archive error:", error);
      process.exit(1);
    }
  });

// Search command
program
  .command("search [query]")
  .description("Search archived contexts (shows recent archives if no query)")
  .option("-l, --limit <number>", "Maximum results", "10")
  .option("-p, --project <path>", "Filter by project path")
  .action(async (query: string | undefined, options: any) => {
    try {
      const retriever = new ContextRetriever();

      // If no query provided, show recent archives
      if (!query) {
        console.log(formatHeader("📚 Recent Archives"));
        console.log(styles.muted("Use a search query to find specific content\n"));

        const storage = new FileStore();
        const stats = await storage.getStats();

        if (stats.totalSessions === 0) {
          console.log(styles.warning("No archives found yet."));
          console.log();
          console.log(styles.info("💡 Tips:"));
          console.log(styles.muted("  • Archives are created automatically during compaction"));
          console.log(styles.muted("  • Use 'c0ntextkeeper archive <file>' to manually archive"));
          console.log(styles.muted("  • Try 'c0ntextkeeper search authentication' to search for specific topics"));
          return;
        }

        // Get recent contexts without a specific query
        const results = await retriever.searchArchive({
          query: "",
          limit: 5,
          projectPath: options.project,
        });

        console.log(styles.info(`Showing ${Math.min(5, results.length)} most recent archives:\n`));

        results.slice(0, 5).forEach((result, index) => {
          console.log(styles.header(`${index + 1}. Session: ${result.context.sessionId}`));
          console.log(styles.muted(`   Project: ${result.context.projectPath}`));
          console.log(styles.muted(`   Date: ${formatTimestamp(result.context.timestamp)}`));
          console.log();
        });

        console.log(styles.info("💡 Search examples:"));
        console.log(styles.code("  c0ntextkeeper search 'authentication'"));
        console.log(styles.code("  c0ntextkeeper search 'error' --limit 20"));
        console.log(styles.code("  c0ntextkeeper search 'bug fix' --project ~/myproject"));
        return;
      }

      // Original search logic when query is provided
      console.log(formatHeader(`🔍 Searching for: "${query}"`));
      console.log();

      const results = await retriever.searchArchive({
        query,
        limit: parseInt(options.limit),
        projectPath: options.project,
      });

      if (results.length === 0) {
        console.log(formatWarning("No results found."));
        console.log();
        console.log(styles.tip("💡 Try using different keywords or check your spelling"));
        return;
      }

      console.log(formatSuccess(`Found ${results.length} result${results.length > 1 ? 's' : ''}:`));
      console.log();

      results.forEach((result, index) => {
        console.log(styles.header(`Result ${index + 1}:`));
        console.log(styles.info(`  🆔 Session: ${result.context.sessionId}`));
        console.log(styles.muted(`  📁 Project: ${result.context.projectPath}`));
        console.log(styles.muted(`  📅 Date: ${formatTimestamp(result.context.timestamp)}`));
        console.log(styles.highlight(`  📈 Relevance: ${(result.relevance * 100).toFixed(0)}%`));

        if (result.matches.length > 0) {
          console.log(styles.info("  🎯 Matches:"));
          result.matches.slice(0, 3).forEach((match) => {
            console.log(styles.muted(`    • ${match.field}:`), styles.text(match.snippet));
          });
        }
        console.log();
      });
    } catch (error) {
      console.error(formatError("Search failed:"));
      logger.error("Search error:", error);
      process.exit(1);
    }
  });

// Patterns command
program
  .command("patterns")
  .description("Analyze recurring patterns")
  .option(
    "-t, --type <type>",
    "Pattern type (code/command/architecture/all)",
    "all",
  )
  .option("-m, --min <number>", "Minimum frequency", "2")
  .action(async (options: any) => {
    try {
      console.log(formatHeader("🌐 Pattern Analysis"));
      console.log();

      const analyzer = new PatternAnalyzer();
      const patterns = await analyzer.getPatterns({
        type: options.type,
        minFrequency: parseInt(options.min),
      });

      if (patterns.length === 0) {
        console.log(formatWarning("No patterns found."));
        console.log();
        console.log(styles.tip("💡 Patterns are discovered after multiple similar actions"));
        console.log(styles.muted("  Lower the minimum frequency with --min 1"));
        return;
      }

      console.log(formatSuccess(`Found ${patterns.length} pattern${patterns.length > 1 ? 's' : ''}:`));
      console.log();

      patterns.forEach((pattern, index) => {
        const typeIcon = pattern.type === 'code' ? '📝' :
                         pattern.type === 'command' ? '⚡' :
                         pattern.type === 'architecture' ? '🏗️' : '🔹';

        console.log(styles.header(`${typeIcon} Pattern ${index + 1}: ${pattern.type}`));
        console.log(styles.highlight(`  📊 Frequency: ${pattern.frequency} occurrences`));
        console.log(styles.info(`  💭 Value:`), styles.code(pattern.value));
        console.log(styles.muted(`  🕐 First seen: ${formatTimestamp(pattern.firstSeen)}`));
        console.log(styles.muted(`  🕑 Last seen: ${formatTimestamp(pattern.lastSeen)}`));
        console.log();
      });
    } catch (error) {
      console.error(formatError("Pattern analysis failed:"));
      logger.error("Pattern analysis error:", error);
      process.exit(1);
    }
  });

// Stats command
program
  .command("stats")
  .description("Show storage statistics")
  .action(async () => {
    try {
      const storage = new FileStore();
      const stats = await storage.getStats();

      console.log(formatHeader("📊 c0ntextKeeper Statistics"));
      console.log(styles.muted("─".repeat(50)));
      console.log();

      console.log(styles.info("🏗️ Storage Overview:"));
      console.log(styles.text(`  Total Projects:`), styles.highlight(`${stats.totalProjects}`));
      console.log(styles.text(`  Total Sessions:`), styles.highlight(`${stats.totalSessions}`));
      console.log(styles.text(`  Storage Size:`), styles.highlight(formatFileSize(stats.totalSize)));

      if (stats.oldestSession || stats.newestSession) {
        console.log();
        console.log(styles.info("📅 Timeline:"));
        if (stats.oldestSession) {
          console.log(styles.text(`  Oldest Session:`), styles.muted(formatTimestamp(stats.oldestSession)));
        }
        if (stats.newestSession) {
          console.log(styles.text(`  Newest Session:`), styles.success(formatTimestamp(stats.newestSession)));
        }
      }

      // Add usage insights
      if (stats.totalSessions > 0) {
        const avgSizePerSession = stats.totalSize / stats.totalSessions;
        console.log();
        console.log(styles.info("💡 Insights:"));
        console.log(styles.muted(`  Average size per session: ${formatFileSize(avgSizePerSession)}`));

        if (stats.totalProjects > 0) {
          const avgSessionsPerProject = Math.round(stats.totalSessions / stats.totalProjects);
          console.log(styles.muted(`  Average sessions per project: ${avgSessionsPerProject}`));
        }
      }

      console.log();
      console.log(styles.muted("─".repeat(50)));
    } catch (error) {
      console.error(formatError("Failed to retrieve statistics:"));
      logger.error("Stats error:", error);
      process.exit(1);
    }
  });

// Hooks command group
const hooks = program.command("hooks").description("Manage Claude Code hooks");

// Health check command
hooks
  .command("health")
  .description("Check health status of all hooks")
  .action(async () => {
    try {
      const { runHealthCheck } = await import("./cli/hooks-health.js");
      await runHealthCheck();
    } catch (error) {
      logger.error("Health check failed:", error);
      process.exit(1);
    }
  });

// List hooks
hooks
  .command("list")
  .description("List all available hooks and their status")
  .action(async () => {
    try {
      const HooksManager = (await import("./cli/hooks-manager.js"))
        .HooksManager;
      const manager = new HooksManager();
      await manager.listHooks();
    } catch (error) {
      logger.error("List hooks error:", error);
      process.exit(1);
    }
  });

// Enable hook
hooks
  .command("enable <hook>")
  .description(
    "Enable a specific hook (PreCompact, UserPromptSubmit, PostToolUse, or Stop)",
  )
  .action(async (hookName: string) => {
    try {
      const HooksManager = (await import("./cli/hooks-manager.js"))
        .HooksManager;
      const manager = new HooksManager();
      await manager.enableHook(hookName);
    } catch (error) {
      logger.error("Enable hook error:", error);
      process.exit(1);
    }
  });

// Disable hook
hooks
  .command("disable <hook>")
  .description(
    "Disable a specific hook (PreCompact, UserPromptSubmit, PostToolUse, or Stop)",
  )
  .action(async (hookName: string) => {
    try {
      const HooksManager = (await import("./cli/hooks-manager.js"))
        .HooksManager;
      const manager = new HooksManager();
      await manager.disableHook(hookName);
    } catch (error) {
      logger.error("Disable hook error:", error);
      process.exit(1);
    }
  });

// Configure hook
hooks
  .command("config <hook>")
  .description(
    "Configure a hook (PreCompact, UserPromptSubmit, PostToolUse, or Stop)",
  )
  .option("-m, --matcher <pattern>", "Set matcher pattern")
  .action(async (hookName: string, options: any) => {
    try {
      const HooksManager = (await import("./cli/hooks-manager.js"))
        .HooksManager;
      const manager = new HooksManager();
      await manager.configureHook(hookName, options.matcher);
    } catch (error) {
      logger.error("Configure hook error:", error);
      process.exit(1);
    }
  });

// Test hook
hooks
  .command("test <hook>")
  .description(
    "Test a specific hook (PreCompact, UserPromptSubmit, PostToolUse, or Stop)",
  )
  .action(async (hookName: string) => {
    try {
      const HooksManager = (await import("./cli/hooks-manager.js"))
        .HooksManager;
      const manager = new HooksManager();
      await manager.testHook(hookName);
    } catch (error) {
      logger.error("Test hook error:", error);
      process.exit(1);
    }
  });

// Hook stats
hooks
  .command("stats")
  .description("Show hook statistics")
  .action(async () => {
    try {
      const HooksManager = (await import("./cli/hooks-manager.js"))
        .HooksManager;
      const manager = new HooksManager();
      await manager.showStats();
    } catch (error) {
      logger.error("Hook stats error:", error);
      process.exit(1);
    }
  });

// Status command - Show storage and automation status
program
  .command("status")
  .description("Show c0ntextKeeper storage and automation status")
  .action(async () => {
    // Show storage status from new implementation
    await statusCommand();

    // Also show automation/hook status
    try {
      console.log("\n🤖 c0ntextKeeper Automation Status\n");
      console.log("═".repeat(60));

      // Check PreCompact hook
      const fs = require("fs");
      const os = require("os");
      const settingsPath = path.join(os.homedir(), ".claude", "settings.json");

      console.log("📌 PreCompact Hook (Primary):");
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        const hasHook = settings.hooks?.PreCompact;
        if (hasHook) {
          console.log("  ✅ ENABLED - Fully Automatic!");
          console.log("  🔄 Triggers on:");
          console.log("     • Manual /compact command");
          console.log("     • Automatic compaction by Claude Code");
        } else {
          console.log('  ❌ Not enabled - run "c0ntextkeeper setup"');
        }
      }

      console.log("\n📊 Additional Hooks (Optional):");
      const hooks = ["UserPromptSubmit", "PostToolUse", "Stop"];
      for (const hook of hooks) {
        const settings = fs.existsSync(settingsPath)
          ? JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
          : {};
        const enabled = settings.hooks?.[hook];
        const status = enabled ? "✅ Enabled" : "⭕ Disabled";
        console.log(`  ${status} ${hook}`);
      }

      console.log("\n" + "═".repeat(60));
    } catch (error) {
      logger.error("Status error:", error);
      process.exit(1);
    }
  });

// Cleanup command - Clean invalid entries from global index
program
  .command("cleanup")
  .description("Clean invalid/test projects from global index")
  .option("--dry-run", "Preview what would be removed without making changes")
  .option("--backup", "Create backup before cleaning (default: true)", true)
  .action(async () => {
    try {
      const cleanupScript = path.join(
        __dirname,
        "..",
        "scripts",
        "cleanup-index.js",
      );
      if (!fs.existsSync(cleanupScript)) {
        logger.error(
          "Cleanup script not found. Please ensure scripts/cleanup-index.js exists.",
        );
        process.exit(1);
      }

      const { cleanIndex } = require(cleanupScript);

      console.log("\n🧹 c0ntextKeeper Index Cleanup");
      console.log("=".repeat(50));

      const globalPath = path.join(os.homedir(), ".c0ntextkeeper");
      const indexPath = path.join(globalPath, "index.json");

      if (!fs.existsSync(indexPath)) {
        console.log("No index file found. Nothing to clean.");
        return;
      }

      // Read current index
      const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      const projects = index.projects || {};
      const totalCount = Object.keys(projects).length;

      if (totalCount === 0) {
        console.log("No projects in index. Nothing to clean.");
        return;
      }

      console.log(`\nFound ${totalCount} project(s) in index`);

      // Perform cleanup
      cleanIndex();
    } catch (error) {
      logger.error("Cleanup failed:", error);
      process.exit(1);
    }
  });

// Validate command
program
  .command("validate")
  .description("Validate c0ntextKeeper installation and hook configuration")
  .action(async () => {
    try {
      console.log("🔍 Validating c0ntextKeeper installation...\n");
      const fs = require("fs");
      const os = require("os");
      let valid = true;

      // Check hook configuration in settings.json
      const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        const hasHook = settings.hooks?.PreCompact?.some((config: any) =>
          config.hooks?.some(
            (h: any) =>
              h.command?.includes("c0ntextkeeper") ||
              h.command?.includes("precompact"),
          ),
        );
        if (hasHook) {
          console.log("✅ Hook configured in settings.json");
        } else {
          console.log("❌ Hook not found in settings.json");
          valid = false;
        }
      } else {
        console.log("⚠️  Settings.json not found");
        valid = false;
      }

      // Check hook script exists
      const hookScript = path.join(__dirname, "hooks", "precompact.js");
      if (fs.existsSync(hookScript)) {
        console.log("✅ Hook script exists");
      } else {
        console.log('❌ Hook script not found (run "npm run build")');
        valid = false;
      }

      // Check archive directory
      const archiveDir = path.join(os.homedir(), ".c0ntextkeeper", "archive");
      if (fs.existsSync(archiveDir)) {
        console.log("✅ Archive directory exists");

        // Count archived sessions
        const storage = new FileStore();
        const stats = await storage.getStats();
        if (stats.totalSessions > 0) {
          console.log(`✅ Found ${stats.totalSessions} archived sessions`);
        }
      } else {
        console.log("⚠️  Archive directory will be created on first use");
      }

      // Test archiver functionality
      const archiver = new ContextArchiver();
      const archiverValid = await archiver.validate();
      if (archiverValid) {
        console.log("✅ Archiver functionality validated");
      } else {
        console.log("❌ Archiver validation failed");
        valid = false;
      }

      if (valid) {
        console.log("\n✅ Installation valid! c0ntextKeeper is ready to use.");
        console.log("\nNext steps:");
        console.log("1. Open any project in Claude Code");
        console.log("2. Run /compact to trigger context preservation");
        console.log("3. Check archives at: ~/.c0ntextkeeper/archive/");
      } else {
        console.log(
          '\n❌ Installation incomplete. Run "c0ntextkeeper setup" to fix.',
        );
        process.exit(1);
      }
    } catch (error) {
      logger.error("Validation error:", error);
      process.exit(1);
    }
  });

// Test-hook command
program
  .command("test-hook")
  .description("Test the PreCompact hook with sample data")
  .action(async () => {
    try {
      console.log("🧪 Testing PreCompact hook...");
      const testScript = path.join(__dirname, "..", "scripts", "test-hook.js");
      if (require("fs").existsSync(testScript)) {
        execSync(`node ${testScript}`, { stdio: "inherit" });
      } else {
        console.error(
          "Test script not found. Please ensure the project is properly installed.",
        );
        process.exit(1);
      }
    } catch (error) {
      logger.error("Test failed:", error);
      process.exit(1);
    }
  });

// Migrate command
program
  .command("migrate")
  .description(
    "Migrate old hash-based archives to new human-readable structure",
  )
  .option("--dry-run", "Preview changes without modifying files")
  .action(async (options: any) => {
    try {
      const { ArchiveMigrator } = await import("./cli/migrate.js");
      const migrator = new ArchiveMigrator();

      console.log("🔄 Starting archive migration...\n");

      const result = await migrator.migrate(options.dryRun);

      if (result.changes.length > 0) {
        console.log("📋 Changes:");
        result.changes.forEach((change) => {
          console.log(`  ${change.from} → ${change.to}`);
        });
        console.log();
      }

      if (result.success) {
        console.log(`✅ Migration ${options.dryRun ? "preview" : "complete"}!`);
        console.log(`   Projects migrated: ${result.migrated}`);
        if (options.dryRun) {
          console.log("\n💡 Run without --dry-run to apply changes");
        }
      } else {
        console.log("❌ Migration failed with errors:");
        result.errors.forEach((error) => {
          console.log(`  - ${error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      logger.error("Migration error:", error);
      process.exit(1);
    }
  });

// Migrate restore command
program
  .command("migrate:restore")
  .description("Restore archives from backup after failed migration")
  .action(async () => {
    try {
      const { ArchiveMigrator } = await import("./cli/migrate.js");
      const migrator = new ArchiveMigrator();

      console.log("🔄 Restoring from backup...");
      await migrator.restore();
      console.log("✅ Restore complete!");
    } catch (error) {
      logger.error("Restore error:", error);
      process.exit(1);
    }
  });

// Rebuild index command
program
  .command("rebuild-index")
  .description("Rebuild the search index from all archived sessions")
  .option("-p, --project <path>", "Rebuild index for specific project only")
  .action(async (options: any) => {
    try {
      console.log(formatHeader("🔄 Rebuilding Search Index"));
      console.log();

      const indexer = new SearchIndexer(options.project);
      await indexer.rebuildIndex();

      // Get and display stats
      const stats = await indexer.getStats();
      console.log(formatSuccess("✅ Index rebuilt successfully!"));
      console.log();
      console.log(styles.info("📊 Index Statistics:"));
      console.log(styles.muted(`  Version: ${stats.version}`));
      console.log(styles.muted(`  Total Sessions: ${stats.totalSessions}`));
      console.log(styles.muted(`  Total Keywords: ${stats.totalKeywords}`));
      console.log(styles.muted(`  Avg Keywords/Session: ${stats.avgKeywordsPerSession}`));
      console.log(styles.muted(`  Last Updated: ${formatTimestamp(stats.lastUpdated)}`));

      if (stats.topKeywords && stats.topKeywords.length > 0) {
        console.log();
        console.log(styles.info("🔝 Top Keywords:"));
        stats.topKeywords.forEach(([keyword, count]: [string, number], index: number) => {
          console.log(styles.muted(`  ${index + 1}. ${keyword} (${count} sessions)`));
        });
      }
    } catch (error) {
      console.error(formatError("Failed to rebuild index:"));
      logger.error("Rebuild index error:", error);
      process.exit(1);
    }
  });

// Context command group for auto-load features
const context = program
  .command("context")
  .description("Manage auto-loaded context");

// Preview context command
context
  .command("preview")
  .description("Preview what context will be auto-loaded")
  .option("-v, --verbose", "Show detailed preview with full content")
  .option("-s, --strategy <type>", "Preview with specific strategy (smart, recent, relevant)")
  .action(async (options: any) => {
    try {
      const { contextLoader } = await import("./core/context-loader.js");

      // Get the preview content
      const preview = await contextLoader.previewAutoLoad();

      // Create a beautifully formatted output
      console.log(formatHeader("🔮 Context Auto-Load Preview"));
      console.log(styles.muted("=".repeat(60)));
      console.log();

      // Parse and format the preview content
      const lines = preview.split('\n');
      let currentSection = '';

      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) {
          console.log();
          continue;
        }

        // Format headers
        if (line.startsWith('###')) {
          const header = line.replace(/^###\s*/, '');
          console.log(styles.header(`\n📦 ${header}`));
          console.log(styles.muted('─'.repeat(40)));
          currentSection = header.toLowerCase();
        }
        // Format session entries
        else if (line.includes('Session:') || line.includes('Date:')) {
          const [label, value] = line.split(':').map(s => s.trim());
          if (label && value) {
            if (label.includes('Session')) {
              console.log(styles.info(`  🆔 ${label}:`), styles.highlight(value));
            } else {
              console.log(styles.muted(`  ${label}:`), styles.text(value));
            }
          }
        }
        // Format problem entries
        else if (line.includes('**Key Problems:**')) {
          console.log(styles.warning(`\n  🔍 ${line.replace(/\*\*/g, '')}`));
        }
        // Format implementation entries
        else if (line.includes('Implementation:')) {
          const impl = line.replace('Implementation:', '').trim();
          console.log(styles.success(`  ✅ Implementation: ${impl}`));
        }
        // Format pattern entries
        else if (line.includes('Pattern:')) {
          const pattern = line.replace(/^\s*[-•]\s*Pattern:\s*/, '').trim();
          console.log(styles.code(`  🌐 Pattern: ${pattern}`));
        }
        // Format decision entries
        else if (line.includes('Decision:')) {
          const decision = line.replace(/^\s*[-•]\s*Decision:\s*/, '').trim();
          console.log(styles.info(`  💡 Decision: ${decision}`));
        }
        // Format bullet points
        else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          const content = line.replace(/^\s*[-•]\s*/, '').trim();
          console.log(styles.muted(`    • ${content}`));
        }
        // Format strategy info
        else if (line.includes('Strategy:') || line.includes('Size:')) {
          const [label, value] = line.split(':').map(s => s.trim());
          if (label && value) {
            console.log(styles.info(`${label}:`), styles.highlight(value));
          }
        }
        // Default formatting
        else {
          console.log(styles.text(`  ${line.trim()}`));
        }
      }

      // Add usage tip
      console.log();
      console.log(styles.muted('─'.repeat(60)));
      console.log(styles.tip('💡 Tip: This context is automatically loaded when you start a new session'));
      console.log(styles.muted('  Use "c0ntextkeeper context configure" to adjust settings'));

      if (options.verbose) {
        console.log();
        console.log(styles.info('📄 Full context available via MCP resources'));
      }
    } catch (error) {
      console.error(formatError("Context preview failed:"));
      logger.error("Context preview error:", error);
      process.exit(1);
    }
  });

// Test context loading
context
  .command("test")
  .description("Test context loading and show statistics")
  .action(async () => {
    try {
      const { contextLoader } = await import("./core/context-loader.js");
      const context = await contextLoader.getAutoLoadContext();

      console.log("✅ Context Loading Test Results\n");
      console.log(`Strategy: ${context.strategy}`);
      console.log(`Size: ${context.sizeKB.toFixed(2)} KB`);
      console.log(`Items: ${context.itemCount}`);
      console.log(`Timestamp: ${new Date(context.timestamp).toLocaleString()}`);

      if (context.content) {
        console.log("\n📄 Sample (first 500 chars):");
        console.log("-".repeat(50));
        console.log(context.content.substring(0, 500));
        if (context.content.length > 500) {
          console.log("...[truncated]");
        }
      } else {
        console.log("\n⚠️ No content loaded (auto-load may be disabled)");
      }
    } catch (error) {
      logger.error("Context test error:", error);
      process.exit(1);
    }
  });

// Configure context loading
context
  .command("configure")
  .description("Configure auto-load settings")
  .option("--enable", "Enable auto-loading")
  .option("--disable", "Disable auto-loading")
  .option("--strategy <type>", "Set strategy (smart, recent, relevant, custom)")
  .option("--max-size <kb>", "Set maximum size in KB")
  .option("--session-count <n>", "Number of recent sessions to include")
  .option("--pattern-count <n>", "Number of patterns to include")
  .option("--format <style>", "Format style (summary, detailed, minimal)")
  .action(async (options) => {
    try {
      const { ConfigManager } = await import("./core/config.js");
      const configManager = new ConfigManager();
      const currentSettings = configManager.getAutoLoadSettings();

      // Apply changes
      const updates: any = {};
      if (options.enable) updates.enabled = true;
      if (options.disable) updates.enabled = false;
      if (options.strategy) updates.strategy = options.strategy;
      if (options.maxSize) updates.maxSizeKB = parseInt(options.maxSize);
      if (options.sessionCount)
        updates.sessionCount = parseInt(options.sessionCount);
      if (options.patternCount)
        updates.patternCount = parseInt(options.patternCount);
      if (options.format) updates.formatStyle = options.format;

      if (Object.keys(updates).length > 0) {
        configManager.updateAutoLoadSettings(updates);
        console.log("✅ Auto-load settings updated:");
        Object.entries(updates).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log("Current auto-load settings:");
        console.log(`  Enabled: ${currentSettings.enabled}`);
        console.log(`  Strategy: ${currentSettings.strategy}`);
        console.log(`  Max Size: ${currentSettings.maxSizeKB} KB`);
        console.log(`  Session Count: ${currentSettings.sessionCount}`);
        console.log(`  Pattern Count: ${currentSettings.patternCount}`);
        console.log(`  Format Style: ${currentSettings.formatStyle}`);
      }
    } catch (error) {
      logger.error("Configure context error:", error);
      process.exit(1);
    }
  });

// Server command (for testing)
program
  .command("server")
  .description("Start the MCP server (usually started by Claude Code)")
  .action(async () => {
    try {
      console.log("Starting c0ntextKeeper MCP server...");
      const serverPath = path.join(__dirname, "server", "index.js");
      await import(serverPath);
    } catch (error) {
      logger.error("Server error:", error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
