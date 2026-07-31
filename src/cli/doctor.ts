/**
 * Doctor Command - Comprehensive Diagnostics and Auto-Fix
 * Diagnoses common issues and attempts to fix them automatically
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { FileStore } from "../storage/file-store.js";
import {
  formatHeader,
  formatSuccess,
  formatWarning,
  formatError,
  styles,
} from "../utils/cli-styles.js";

interface DiagnosticResult {
  category: string;
  status: "pass" | "warning" | "error";
  message: string;
  autoFixed?: boolean;
}

export async function runDoctorDiagnostics(): Promise<void> {
  console.log(formatHeader("🏥 c0ntextKeeper Health Check"));
  console.log(styles.muted("Running comprehensive diagnostics...\n"));

  const results: DiagnosticResult[] = [];
  let issuesFound = 0;
  let _issuesFixed = 0;

  // 1. Check Hook Configuration
  console.log(styles.info("1️⃣ Checking Hook Configuration..."));
  const hookResults = await checkHookConfiguration();
  results.push(...hookResults);
  console.log();

  // 2. Verify Storage Setup
  console.log(styles.info("2️⃣ Verifying Storage Setup..."));
  const storageResults = await checkStorageSetup();
  results.push(...storageResults);
  console.log();

  // 3. Validate Archive Integrity
  console.log(styles.info("3️⃣ Validating Archive Integrity..."));
  const archiveResults = await checkArchiveIntegrity();
  results.push(...archiveResults);
  console.log();

  // 4. Check Permissions
  console.log(styles.info("4️⃣ Checking Permissions..."));
  const permResults = await checkPermissions();
  results.push(...permResults);
  console.log();

  // 5. Validate File Structure
  console.log(styles.info("5️⃣ Validating File Structure..."));
  const structureResults = await checkFileStructure();
  results.push(...structureResults);
  console.log();

  // Generate summary
  console.log(styles.muted("─".repeat(60)));
  console.log(formatHeader("📊 Diagnostic Summary"));
  console.log();

  const passCount = results.filter((r) => r.status === "pass").length;
  const warnCount = results.filter((r) => r.status === "warning").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const fixedCount = results.filter((r) => r.autoFixed).length;

  if (errorCount > 0) {
    issuesFound += errorCount;
  }
  if (warnCount > 0) {
    issuesFound += warnCount;
  }
  _issuesFixed = fixedCount;

  console.log(styles.success(`✅ Passed: ${passCount}`));
  if (warnCount > 0) {
    console.log(styles.warning(`⚠️  Warnings: ${warnCount}`));
  }
  if (errorCount > 0) {
    console.log(styles.error(`❌ Errors: ${errorCount}`));
  }
  if (fixedCount > 0) {
    console.log(styles.highlight(`🔧 Auto-Fixed: ${fixedCount}`));
  }

  console.log();
  console.log(styles.muted("─".repeat(60)));

  // Detailed results
  if (warnCount > 0 || errorCount > 0) {
    console.log(formatHeader("\n🔍 Detailed Findings"));
    console.log();

    results.forEach((result) => {
      if (result.status === "warning" || result.status === "error") {
        const icon = result.status === "error" ? "❌" : "⚠️ ";
        const statusText = result.autoFixed ? " (auto-fixed)" : "";
        console.log(
          `${icon} ${styles.text(result.category)}: ${result.message}${statusText}`,
        );
      }
    });
  }

  // Final status
  console.log();
  if (errorCount === 0 && warnCount === 0) {
    console.log(formatSuccess("🎉 All systems operational!"));
    console.log();
    console.log(styles.tip("💡 c0ntextKeeper is working perfectly."));
  } else if (errorCount === 0) {
    console.log(
      formatWarning("⚠️  Minor issues detected but nothing critical"),
    );
    console.log();
    console.log(
      styles.tip(
        "💡 Everything is working, but consider reviewing the warnings above.",
      ),
    );
  } else if (fixedCount === issuesFound) {
    console.log(formatSuccess("✅ All issues have been automatically fixed!"));
    console.log();
    console.log(
      styles.tip("💡 Try running the doctor again to confirm all fixes."),
    );
  } else {
    console.log(formatError("❌ Critical issues found"));
    console.log();
    console.log(
      styles.tip(
        "💡 Some issues require manual intervention. See details above.",
      ),
    );
    process.exit(1);
  }
}

async function checkHookConfiguration(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const settingsPath = path.join(os.homedir(), ".claude", "settings.json");

  // Check if settings.json exists
  if (!fs.existsSync(settingsPath)) {
    results.push({
      category: "Hook Configuration",
      status: "warning",
      message:
        "Claude Code settings.json not found. Hooks may not be configured.",
    });
    console.log(styles.warning("  ⚠️  Settings file not found"));
    return results;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));

    // Check for PreCompact hook
    if (settings.hooks?.PreCompact) {
      results.push({
        category: "Hook Configuration",
        status: "pass",
        message: "PreCompact hook is configured",
      });
      console.log(styles.success("  ✅ PreCompact hook configured"));
    } else {
      results.push({
        category: "Hook Configuration",
        status: "warning",
        message:
          "PreCompact hook not enabled. Run 'c0ntextkeeper setup' to enable.",
      });
      console.log(styles.warning("  ⚠️  PreCompact hook not enabled"));
    }

    // Check optional hooks
    const optionalHooks = ["UserPromptSubmit", "PostToolUse", "Stop"];
    const enabledOptional = optionalHooks.filter(
      (hook) => settings.hooks?.[hook],
    );

    if (enabledOptional.length > 0) {
      console.log(
        styles.muted(
          `  ℹ️  Optional hooks enabled: ${enabledOptional.join(", ")}`,
        ),
      );
    }
  } catch {
    results.push({
      category: "Hook Configuration",
      status: "error",
      message: "Failed to parse settings.json. File may be corrupted.",
    });
    console.log(styles.error("  ❌ Failed to parse settings.json"));
  }

  return results;
}

async function checkStorageSetup(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const globalPath = path.join(os.homedir(), ".c0ntextkeeper");
  const archivePath = path.join(globalPath, "archive");

  // Check global storage directory
  if (!fs.existsSync(globalPath)) {
    try {
      fs.mkdirSync(globalPath, { recursive: true });
      results.push({
        category: "Storage Setup",
        status: "pass",
        message: "Global storage directory created",
        autoFixed: true,
      });
      console.log(styles.success("  ✅ Created global storage directory"));
    } catch {
      results.push({
        category: "Storage Setup",
        status: "error",
        message: "Failed to create global storage directory",
      });
      console.log(styles.error("  ❌ Failed to create storage directory"));
      return results;
    }
  } else {
    results.push({
      category: "Storage Setup",
      status: "pass",
      message: "Global storage directory exists",
    });
    console.log(styles.success("  ✅ Global storage exists"));
  }

  // Check archive directory
  if (!fs.existsSync(archivePath)) {
    try {
      fs.mkdirSync(archivePath, { recursive: true });
      results.push({
        category: "Storage Setup",
        status: "pass",
        message: "Archive directory created",
        autoFixed: true,
      });
      console.log(styles.success("  ✅ Created archive directory"));
    } catch {
      results.push({
        category: "Storage Setup",
        status: "error",
        message: "Failed to create archive directory",
      });
      console.log(styles.error("  ❌ Failed to create archive directory"));
    }
  } else {
    results.push({
      category: "Storage Setup",
      status: "pass",
      message: "Archive directory exists",
    });
    console.log(styles.success("  ✅ Archive directory exists"));
  }

  return results;
}

async function checkArchiveIntegrity(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  try {
    const storage = new FileStore();
    const stats = await storage.getStats();

    if (stats.totalSessions === 0) {
      results.push({
        category: "Archive Integrity",
        status: "warning",
        message:
          "No archived sessions found. This is normal for new installations.",
      });
      console.log(
        styles.warning("  ⚠️  No archives found (normal for new install)"),
      );
      return results;
    }

    results.push({
      category: "Archive Integrity",
      status: "pass",
      message: `Found ${stats.totalSessions} archived sessions across ${stats.totalProjects} projects`,
    });
    console.log(
      styles.success(
        `  ✅ ${stats.totalSessions} sessions in ${stats.totalProjects} projects`,
      ),
    );

    // Validate a sample of archives
    const archivePath = path.join(
      os.homedir(),
      ".c0ntextkeeper",
      "archive",
      "projects",
    );
    if (fs.existsSync(archivePath)) {
      const projects = fs.readdirSync(archivePath);
      let corruptedFiles = 0;

      for (const project of projects.slice(0, 5)) {
        // Check first 5 projects
        const projectPath = path.join(archivePath, project, "sessions");
        if (fs.existsSync(projectPath)) {
          const sessions = fs
            .readdirSync(projectPath)
            .filter((f) => f.endsWith(".json"));

          for (const session of sessions.slice(0, 3)) {
            // Check first 3 sessions per project
            try {
              const content = fs.readFileSync(
                path.join(projectPath, session),
                "utf-8",
              );
              JSON.parse(content); // Validate JSON
            } catch {
              corruptedFiles++;
            }
          }
        }
      }

      if (corruptedFiles > 0) {
        results.push({
          category: "Archive Integrity",
          status: "warning",
          message: `Found ${corruptedFiles} potentially corrupted archive files`,
        });
        console.log(
          styles.warning(`  ⚠️  ${corruptedFiles} corrupted files detected`),
        );
      } else {
        console.log(styles.success("  ✅ Archive files validated"));
      }

      // Sessions listed in a project index but absent from disk. Versions
      // before 0.8.0 pruned sessions on every write, so archives created then
      // may be missing files the index still references. Those are gone and
      // cannot be recovered -- this check makes the loss visible rather than
      // letting the index quietly overstate what is retained.
      let indexedButMissing = 0;
      let unreadableIndexes = 0;
      for (const project of projects) {
        const indexPath = path.join(archivePath, project, "index.json");
        if (!fs.existsSync(indexPath)) continue;

        try {
          const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

          // One directory read per project, then O(1) membership checks. The
          // per-entry existsSync this replaced cost one syscall per indexed
          // session -- up to 100 per project, across every project.
          const sessionsDir = path.join(archivePath, project, "sessions");
          const present = fs.existsSync(sessionsDir)
            ? new Set(fs.readdirSync(sessionsDir))
            : new Set<string>();

          for (const session of index.sessions || []) {
            const name = path.basename(session.file || "");
            if (!name) continue;
            if (!present.has(name)) {
              indexedButMissing++;
            }
          }
        } catch {
          // A project index that cannot be read or parsed. The corruption check
          // above does NOT cover this -- it samples only the first 5 projects'
          // first 3 session files and never opens index.json -- so this is
          // reported separately rather than silently skipped.
          unreadableIndexes++;
        }
      }

      if (unreadableIndexes > 0) {
        results.push({
          category: "Archive Integrity",
          status: "warning",
          message:
            `${unreadableIndexes} project indexes could not be read or parsed. ` +
            `Sessions in those projects are not counted below and may be under-reported.`,
        });
        console.log(
          styles.warning(
            `  ⚠️  ${unreadableIndexes} unreadable project index files`,
          ),
        );
      }

      if (indexedButMissing > 0) {
        results.push({
          category: "Archive Integrity",
          status: "warning",
          message:
            `At least ${indexedButMissing} sessions are listed in a project index but missing ` +
            `from disk. Pre-0.8.0 builds pruned archives automatically; this data cannot be ` +
            `recovered. Retention is now disabled by default. Note this is a lower bound: each ` +
            `project index keeps only its most recent 100 entries, so older losses have already ` +
            `rolled off and are no longer countable.`,
        });
        console.log(
          styles.warning(
            `  ⚠️  ${indexedButMissing} indexed sessions missing from disk (pre-0.8.0 auto-pruning)`,
          ),
        );
      }
    }
  } catch {
    results.push({
      category: "Archive Integrity",
      status: "error",
      message: "Failed to check archive integrity",
    });
    console.log(styles.error("  ❌ Failed to validate archives"));
  }

  return results;
}

async function checkPermissions(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const globalPath = path.join(os.homedir(), ".c0ntextkeeper");

  try {
    // Test read permission
    fs.accessSync(globalPath, fs.constants.R_OK);

    // Test write permission
    fs.accessSync(globalPath, fs.constants.W_OK);

    results.push({
      category: "Permissions",
      status: "pass",
      message: "Storage directory has correct permissions",
    });
    console.log(styles.success("  ✅ Read/write permissions OK"));
  } catch {
    results.push({
      category: "Permissions",
      status: "error",
      message: "Storage directory lacks necessary permissions",
    });
    console.log(styles.error("  ❌ Permission issues detected"));
  }

  return results;
}

async function checkFileStructure(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const globalPath = path.join(os.homedir(), ".c0ntextkeeper");
  const indexPath = path.join(globalPath, "index.json");

  // Check global index
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      const projectCount = Object.keys(index.projects || {}).length;

      results.push({
        category: "File Structure",
        status: "pass",
        message: `Global index valid with ${projectCount} projects`,
      });
      console.log(
        styles.success(`  ✅ Global index valid (${projectCount} projects)`),
      );

      // Check for orphaned entries
      const archivePath = path.join(globalPath, "archive", "projects");
      if (fs.existsSync(archivePath)) {
        const actualProjects = fs.readdirSync(archivePath);
        const indexedProjects = Object.keys(index.projects || {});

        const orphaned = actualProjects.filter(
          (p) => !indexedProjects.includes(p),
        );
        if (orphaned.length > 0) {
          console.log(
            styles.warning(`  ⚠️  ${orphaned.length} projects not in index`),
          );
        }
      }
    } catch {
      results.push({
        category: "File Structure",
        status: "error",
        message: "Global index is corrupted",
      });
      console.log(styles.error("  ❌ Global index corrupted"));
    }
  } else {
    results.push({
      category: "File Structure",
      status: "warning",
      message: "Global index not found (will be created on first use)",
    });
    console.log(
      styles.warning("  ⚠️  No global index (normal for new install)"),
    );
  }

  return results;
}
