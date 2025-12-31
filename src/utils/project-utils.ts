import * as path from "path";
import * as crypto from "crypto";
import * as fs from "fs";

/**
 * Find the project root by looking for package.json or .git
 * Returns null if no project root found
 */
function findProjectRoot(startPath: string): string | null {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  // Common subdirectory names that should never be project names
  const invalidProjectNames = new Set([
    "scripts",
    "src",
    "dist",
    "lib",
    "bin",
    "test",
    "tests",
    "docs",
    "build",
    "out",
    "tmp",
    "temp",
    "node_modules",
    ".git",
    ".vscode",
    ".idea",
    "coverage",
    "__tests__",
  ]);

  while (currentPath !== root) {
    // Check for project indicators
    if (
      fs.existsSync(path.join(currentPath, "package.json")) ||
      fs.existsSync(path.join(currentPath, ".git")) ||
      fs.existsSync(path.join(currentPath, ".c0ntextkeeper"))
    ) {
      // Make sure the basename isn't an invalid project name
      const basename = path.basename(currentPath);
      if (!invalidProjectNames.has(basename.toLowerCase())) {
        return currentPath;
      }
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Extract project name from working directory path
 * Walks up directory tree to find actual project root
 * Falls back to hash if name cannot be determined
 */
export function getProjectName(workingDir: string): string {
  try {
    // Try to find the actual project root
    const projectRoot = findProjectRoot(workingDir);

    if (projectRoot) {
      const projectName = path.basename(projectRoot);

      // Validate it's a reasonable project name
      if (
        projectName &&
        projectName !== "." &&
        projectName !== "/" &&
        projectName !== ""
      ) {
        // Sanitize for filesystem use (remove special chars except dash and underscore)
        return projectName.replace(/[^a-zA-Z0-9-_]/g, "-");
      }
    }

    // If no project root found, use the original directory basename
    // but only if it's not a common subdirectory name
    const fallbackName = path.basename(workingDir);
    const invalidNames = ["scripts", "src", "dist", "lib", "test", "tests"];

    if (
      fallbackName &&
      !invalidNames.includes(fallbackName.toLowerCase()) &&
      fallbackName !== "." &&
      fallbackName !== "/" &&
      fallbackName !== ""
    ) {
      return fallbackName.replace(/[^a-zA-Z0-9-_]/g, "-");
    }
  } catch {
    // Fall through to hash generation
  }

  // Fallback to hash if we can't determine a good name
  return crypto
    .createHash("md5")
    .update(workingDir)
    .digest("hex")
    .substring(0, 12);
}

/**
 * Get the storage path for a specific hook type
 * Note: basePath should already include .c0ntextkeeper from getStoragePath()
 */
export function getHookStoragePath(
  basePath: string,
  hookType: "sessions" | "knowledge" | "patterns" | "prompts" | "notifications" | "subagents" | "sessions-meta",
  workingDir: string,
  dateString: string,
  fileName: string,
): string {
  const projectName = getProjectName(workingDir);

  // Combine date and filename (e.g., 2025-09-16-prompts.json)
  const fullFileName = `${dateString}-${fileName}`;

  return path.join(
    basePath,
    "archive",
    "projects",
    projectName,
    hookType,
    fullFileName,
  );
}

/**
 * Ensure the archive structure exists for a project
 */
export function ensureProjectArchiveStructure(
  basePath: string,
  workingDir: string,
): {
  projectName: string;
  projectPath: string;
  sessionsPath: string;
  knowledgePath: string;
  patternsPath: string;
  promptsPath: string;
  notificationsPath: string;
  subagentsPath: string;
  sessionsMetaPath: string;
} {
  const projectName = getProjectName(workingDir);
  const projectPath = path.join(
    basePath,
    ".c0ntextkeeper",
    "archive",
    "projects",
    projectName,
  );

  return {
    projectName,
    projectPath,
    sessionsPath: path.join(projectPath, "sessions"),
    knowledgePath: path.join(projectPath, "knowledge"),
    patternsPath: path.join(projectPath, "patterns"),
    promptsPath: path.join(projectPath, "prompts"),
    notificationsPath: path.join(projectPath, "notifications"),
    subagentsPath: path.join(projectPath, "subagents"),
    sessionsMetaPath: path.join(projectPath, "sessions-meta"),
  };
}
