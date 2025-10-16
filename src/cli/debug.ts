/**
 * Debug Command - Verbose Logging and Troubleshooting
 * Enables comprehensive logging for diagnosing issues
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger, LogLevel } from "../utils/logger.js";
import { formatHeader, formatSuccess, styles } from "../utils/cli-styles.js";
import { spawn } from "child_process";

interface DebugOptions {
  component?: string;
  severity?: "debug" | "info" | "warn" | "error";
  follow?: boolean;
  export?: boolean;
  lines?: number;
}

export async function runDebugMode(options: DebugOptions = {}): Promise<void> {
  console.log(formatHeader("🐛 c0ntextKeeper Debug Mode"));
  console.log(styles.muted("Enhanced logging and diagnostics enabled\n"));

  // Set environment variable for verbose logging
  process.env.C0NTEXTKEEPER_DEBUG = "1";

  const logDir = path.join(os.homedir(), ".c0ntextkeeper", "logs");
  const logFile = path.join(logDir, "debug.log");

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Show current debug configuration
  console.log(styles.info("📊 Debug Configuration:"));
  console.log(styles.muted(`  Log Directory: ${logDir}`));
  console.log(styles.muted(`  Log File: ${logFile}`));
  console.log(
    styles.muted(`  Component Filter: ${options.component || "all"}`),
  );
  console.log(
    styles.muted(`  Severity Filter: ${options.severity || "all"}`),
  );
  console.log(styles.muted(`  Follow Mode: ${options.follow ? "enabled" : "disabled"}`));
  console.log();

  // Create logger with debug mode
  const logger = new Logger("Debug", LogLevel.DEBUG, true);

  if (options.follow) {
    // Follow mode - tail the log file
    console.log(formatSuccess("📡 Streaming logs (Ctrl+C to exit)..."));
    console.log(styles.muted("─".repeat(60)));
    console.log();

    await tailLogFile(logFile, options);
  } else if (options.export) {
    // Export mode - save current logs
    await exportLogs(logDir, logFile);
  } else {
    // Show recent logs
    await showRecentLogs(logFile, options);
  }
}

/**
 * Tail log file in real-time
 */
async function tailLogFile(
  logFile: string,
  options: DebugOptions,
): Promise<void> {
  // Create log file if it doesn't exist
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "");
  }

  // Use tail -f for following logs
  const tail = spawn("tail", ["-f", logFile]);

  tail.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line: string) => {
      if (!line.trim()) return;

      // Apply filters
      if (options.component && !line.includes(options.component)) return;
      if (options.severity && !line.toLowerCase().includes(options.severity))
        return;

      // Format output based on severity
      if (line.toLowerCase().includes("error")) {
        console.log(styles.error(line));
      } else if (line.toLowerCase().includes("warn")) {
        console.log(styles.warning(line));
      } else if (line.toLowerCase().includes("info")) {
        console.log(styles.info(line));
      } else {
        console.log(styles.muted(line));
      }
    });
  });

  tail.stderr.on("data", (data) => {
    console.error(styles.error(`Tail error: ${data}`));
  });

  tail.on("close", (code) => {
    console.log(styles.muted(`\nLog streaming stopped (exit code ${code})`));
  });

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log(styles.muted("\n\nStopping log stream..."));
    tail.kill();
    process.exit(0);
  });
}

/**
 * Show recent log entries
 */
async function showRecentLogs(
  logFile: string,
  options: DebugOptions,
): Promise<void> {
  if (!fs.existsSync(logFile)) {
    console.log(styles.warning("No log file found."));
    console.log();
    console.log(styles.tip("💡 Logs will be created when c0ntextKeeper operations run"));
    console.log(
      styles.muted("  Try running: c0ntextkeeper debug --follow"),
    );
    return;
  }

  const lineCount = options.lines || 50;
  console.log(formatSuccess(`📄 Showing last ${lineCount} log entries:`));
  console.log(styles.muted("─".repeat(60)));
  console.log();

  // Read log file
  const content = fs.readFileSync(logFile, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const recentLines = lines.slice(-lineCount);

  recentLines.forEach((line) => {
    // Apply filters
    if (options.component && !line.includes(options.component)) return;
    if (options.severity && !line.toLowerCase().includes(options.severity))
      return;

    // Format output
    if (line.toLowerCase().includes("error")) {
      console.log(styles.error(line));
    } else if (line.toLowerCase().includes("warn")) {
      console.log(styles.warning(line));
    } else if (line.toLowerCase().includes("info")) {
      console.log(styles.info(line));
    } else {
      console.log(styles.muted(line));
    }
  });

  console.log();
  console.log(styles.muted("─".repeat(60)));
  console.log();
  console.log(styles.info("💡 Debug Commands:"));
  console.log(styles.code("  c0ntextkeeper debug --follow           # Stream live logs"));
  console.log(styles.code("  c0ntextkeeper debug --component Hook   # Filter by component"));
  console.log(styles.code("  c0ntextkeeper debug --severity error   # Show only errors"));
  console.log(styles.code("  c0ntextkeeper debug --export           # Export logs to file"));
}

/**
 * Export logs to a timestamped file
 */
async function exportLogs(logDir: string, logFile: string): Promise<void> {
  if (!fs.existsSync(logFile)) {
    console.log(styles.warning("No log file found to export."));
    return;
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .split("T")[0];
  const exportFile = path.join(logDir, `debug-export-${timestamp}.log`);

  // Copy log file
  fs.copyFileSync(logFile, exportFile);

  console.log(formatSuccess("✅ Logs exported successfully!"));
  console.log();
  console.log(styles.info(`📁 Export Location: ${exportFile}`));

  // Show stats
  const content = fs.readFileSync(exportFile, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const errors = lines.filter((l) => l.toLowerCase().includes("error")).length;
  const warnings = lines.filter((l) => l.toLowerCase().includes("warn")).length;

  console.log();
  console.log(styles.info("📊 Log Statistics:"));
  console.log(styles.muted(`  Total Lines: ${lines.length}`));
  console.log(styles.error(`  Errors: ${errors}`));
  console.log(styles.warning(`  Warnings: ${warnings}`));
  console.log(
    styles.success(`  Info: ${lines.length - errors - warnings}`),
  );
}

/**
 * Show active debug sessions
 */
export async function showDebugSessions(): Promise<void> {
  console.log(formatHeader("🔍 Active Debug Sessions"));
  console.log();

  const logDir = path.join(os.homedir(), ".c0ntextkeeper", "logs");

  if (!fs.existsSync(logDir)) {
    console.log(styles.warning("No debug sessions found."));
    return;
  }

  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.endsWith(".log"))
    .map((f) => {
      const filePath = path.join(logDir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
      };
    })
    .sort((a, b) => b.modified.getTime() - a.modified.getTime());

  if (files.length === 0) {
    console.log(styles.warning("No log files found."));
    return;
  }

  console.log(styles.success(`Found ${files.length} log file(s):`));
  console.log();

  files.forEach((file, index) => {
    console.log(styles.header(`${index + 1}. ${file.name}`));
    console.log(styles.muted(`   Size: ${(file.size / 1024).toFixed(2)} KB`));
    console.log(
      styles.muted(
        `   Modified: ${file.modified.toLocaleString()}`,
      ),
    );
    console.log();
  });
}

/**
 * Clear debug logs
 */
export async function clearDebugLogs(): Promise<void> {
  console.log(formatHeader("🧹 Clearing Debug Logs"));
  console.log();

  const logDir = path.join(os.homedir(), ".c0ntextkeeper", "logs");

  if (!fs.existsSync(logDir)) {
    console.log(styles.warning("No log directory found."));
    return;
  }

  const files = fs.readdirSync(logDir).filter((f) => f.endsWith(".log"));

  if (files.length === 0) {
    console.log(styles.warning("No log files to clear."));
    return;
  }

  // Prompt for confirmation
  console.log(styles.warning(`About to delete ${files.length} log file(s):`));
  files.forEach((f) => console.log(styles.muted(`  - ${f}`)));
  console.log();

  // Delete files
  let deleted = 0;
  files.forEach((f) => {
    try {
      fs.unlinkSync(path.join(logDir, f));
      deleted++;
    } catch (error) {
      console.log(styles.error(`Failed to delete ${f}: ${error}`));
    }
  });

  console.log(formatSuccess(`✅ Cleared ${deleted} log file(s)`));
}

/**
 * Show component-specific logs
 */
export async function showComponentLogs(component: string): Promise<void> {
  console.log(formatHeader(`🔍 ${component} Component Logs`));
  console.log();

  const logFile = path.join(
    os.homedir(),
    ".c0ntextkeeper",
    "logs",
    "debug.log",
  );

  if (!fs.existsSync(logFile)) {
    console.log(styles.warning("No log file found."));
    return;
  }

  const content = fs.readFileSync(logFile, "utf-8");
  const lines = content
    .split("\n")
    .filter((l) => l.includes(component))
    .slice(-50); // Last 50 matching lines

  if (lines.length === 0) {
    console.log(styles.warning(`No logs found for component: ${component}`));
    console.log();
    console.log(styles.info("Available components:"));
    console.log(styles.muted("  - Hook"));
    console.log(styles.muted("  - Archiver"));
    console.log(styles.muted("  - Extractor"));
    console.log(styles.muted("  - Retriever"));
    console.log(styles.muted("  - Storage"));
    console.log(styles.muted("  - Indexer"));
    return;
  }

  console.log(formatSuccess(`Found ${lines.length} log entries:`));
  console.log(styles.muted("─".repeat(60)));
  console.log();

  lines.forEach((line) => {
    if (line.toLowerCase().includes("error")) {
      console.log(styles.error(line));
    } else if (line.toLowerCase().includes("warn")) {
      console.log(styles.warning(line));
    } else {
      console.log(styles.muted(line));
    }
  });
}
