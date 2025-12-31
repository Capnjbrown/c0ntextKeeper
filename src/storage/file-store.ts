/**
 * File-based storage implementation
 * Manages context archives in the filesystem
 */

import fs from "fs/promises";
import path from "path";
import {
  ExtractedContext,
  ProjectIndex,
  SessionSummary,
  C0ntextKeeperConfig,
} from "../core/types.js";
import { ensureDir, fileExists } from "../utils/filesystem.js";
import {
  generateSessionName,
  extractProjectName,
} from "../utils/session-namer.js";
import {
  formatTimestamp,
  formatFileCount as _formatFileCount,
  formatDuration as _formatDuration,
  formatToolStats as _formatToolStats,
  getTopTools,
  calculateAverage,
  formatRelevance,
  truncateText,
  getPackageVersion,
} from "../utils/formatter.js";
import {
  getStoragePath,
  getProjectStorageInfo,
} from "../utils/path-resolver.js";

export class FileStore {
  private basePath: string;
  private config: C0ntextKeeperConfig["storage"];
  private isGlobal: boolean;

  constructor(
    config?: Partial<C0ntextKeeperConfig["storage"]> & { global?: boolean },
  ) {
    // Use path resolver to determine storage location
    this.isGlobal = config?.global || false;
    const resolvedPath = getStoragePath({
      global: this.isGlobal,
      createIfMissing: true,
    });

    this.config = {
      basePath: path.join(resolvedPath, "archive"),
      maxArchiveSize: 100, // MB
      compressionEnabled: false,
      retentionDays: 90,
      ...config,
    };
    this.basePath = this.config.basePath;
  }

  /**
   * Get the base storage path (includes archive subdirectory)
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Get the root storage path (without archive subdirectory)
   * Used for non-archive items like solutions, logs, etc.
   */
  getRootPath(): string {
    const storagePath = getStoragePath({
      global: this.isGlobal,
      createIfMissing: false,
    });
    return storagePath;
  }

  /**
   * Check if storage is initialized for current project
   */
  isInitialized(): boolean {
    const info = getProjectStorageInfo();
    return info.exists;
  }

  /**
   * Get archive path
   */
  getArchivePath(): string {
    return path.join(this.basePath);
  }

  /**
   * Get prompts path (root directory)
   * Note: Actual hook data is stored at project-specific paths via getHookStoragePath()
   * This returns the parent directory: ~/.c0ntextkeeper/prompts/
   * Actual storage: ~/.c0ntextkeeper/archive/projects/[name]/prompts/
   * @deprecated Consider using getHookStoragePath() from project-utils instead
   */
  getPromptsPath(): string {
    const storagePath = getStoragePath({ createIfMissing: false });
    return path.join(storagePath, "prompts");
  }

  /**
   * Get patterns path (root directory)
   * Note: Actual hook data is stored at project-specific paths via getHookStoragePath()
   * This returns the parent directory: ~/.c0ntextkeeper/patterns/
   * Actual storage: ~/.c0ntextkeeper/archive/projects/[name]/patterns/
   * @deprecated Consider using getHookStoragePath() from project-utils instead
   */
  getPatternsPath(): string {
    const storagePath = getStoragePath({ createIfMissing: false });
    return path.join(storagePath, "patterns");
  }

  /**
   * Get knowledge path (root directory)
   * Note: Actual hook data is stored at project-specific paths via getHookStoragePath()
   * This returns the parent directory: ~/.c0ntextkeeper/knowledge/
   * Actual storage: ~/.c0ntextkeeper/archive/projects/[name]/knowledge/
   * @deprecated Consider using getHookStoragePath() from project-utils instead
   */
  getKnowledgePath(): string {
    const storagePath = getStoragePath({ createIfMissing: false });
    return path.join(storagePath, "knowledge");
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    await ensureDir(this.basePath);
    await ensureDir(path.join(this.basePath, "projects"));
    await ensureDir(path.join(this.basePath, "global"));
  }

  /**
   * Store extracted context
   */
  async store(context: ExtractedContext): Promise<string> {
    await this.initialize();

    // Use actual project name instead of hash
    const projectName = extractProjectName(context.projectPath);
    const projectDir = path.join(this.basePath, "projects", projectName);

    // Store test data separately for clarity
    const sessionsDir = context.metadata.isTest
      ? path.join(projectDir, "test")
      : path.join(projectDir, "sessions");

    await ensureDir(projectDir);
    await ensureDir(sessionsDir);

    // Create descriptive session filename
    const sessionFile = generateSessionName(context);
    const sessionPath = path.join(sessionsDir, sessionFile);

    // Store context
    await fs.writeFile(sessionPath, JSON.stringify(context, null, 2), "utf-8");

    // Skip index and README updates for test data
    if (!context.metadata.isTest) {
      // Update project index
      await this.updateProjectIndex(projectDir, context, sessionFile);

      // Create/Update project README for navigation
      await this.createProjectReadme(projectDir, projectName, context);

      // Update global index
      await this.updateGlobalIndex(context, projectName);
    }

    // Clean old sessions if needed
    await this.cleanOldSessions(projectDir);

    return sessionPath;
  }

  /**
   * Retrieve context by session ID
   */
  async getBySessionId(sessionId: string): Promise<ExtractedContext | null> {
    const projectDirs = await this.listProjectDirs();

    for (const projectDir of projectDirs) {
      const sessionsDir = path.join(projectDir, "sessions");
      if (!(await fileExists(sessionsDir))) continue;

      const files = await fs.readdir(sessionsDir);
      for (const file of files) {
        if (file.includes(sessionId)) {
          const content = await fs.readFile(
            path.join(sessionsDir, file),
            "utf-8",
          );
          return JSON.parse(content) as ExtractedContext;
        }
      }
    }

    return null;
  }

  /**
   * Get all contexts for a project
   */
  async getProjectContexts(
    projectPath: string,
    limit = 100,
  ): Promise<ExtractedContext[]> {
    const projectName = extractProjectName(projectPath);

    // Try multiple case variations to find the project directory
    const possibleNames = [
      projectName, // Original extracted name
      projectName.toLowerCase(), // All lowercase
      projectName.charAt(0).toUpperCase() + projectName.slice(1).toLowerCase(), // Capitalize first
      "c0ntextKeeper", // Known variation for this project
    ];

    let sessionsDir: string | null = null;

    // Try each possible name to find existing archives
    for (const name of possibleNames) {
      const candidateDir = path.join(this.basePath, "projects", name);
      const candidateSessionsDir = path.join(candidateDir, "sessions");

      if (await fileExists(candidateSessionsDir)) {
        // projectDir variable removed - was unused
        sessionsDir = candidateSessionsDir;
        console.log(`Found project archive at: ${candidateDir}`);
        break;
      }
    }

    if (!sessionsDir) {
      console.log(
        `No archive found for project: ${projectPath} (tried: ${possibleNames.join(", ")})`,
      );
      return [];
    }

    const files = await fs.readdir(sessionsDir);
    const contexts: ExtractedContext[] = [];

    // Get most recent files first
    const sortedFiles = files
      .filter((f) => f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit);

    for (const file of sortedFiles) {
      try {
        const content = await fs.readFile(
          path.join(sessionsDir, file),
          "utf-8",
        );
        contexts.push(JSON.parse(content) as ExtractedContext);
      } catch (error) {
        console.error(`Failed to read session file ${file}:`, error);
      }
    }

    return contexts;
  }

  /**
   * Get project index
   */
  async getProjectIndex(projectPath: string): Promise<ProjectIndex | null> {
    const projectName = extractProjectName(projectPath);
    const indexPath = path.join(
      this.basePath,
      "projects",
      projectName,
      "index.json",
    );

    if (!(await fileExists(indexPath))) {
      return null;
    }

    try {
      const content = await fs.readFile(indexPath, "utf-8");
      return JSON.parse(content) as ProjectIndex;
    } catch (error) {
      console.error("Failed to read project index:", error);
      return null;
    }
  }

  /**
   * Search across all contexts
   */
  async searchAll(
    predicate: (context: ExtractedContext) => boolean,
  ): Promise<ExtractedContext[]> {
    const results: ExtractedContext[] = [];
    const projectDirs = await this.listProjectDirs();

    for (const projectDir of projectDirs) {
      const sessionsDir = path.join(projectDir, "sessions");
      if (!(await fileExists(sessionsDir))) continue;

      const files = await fs.readdir(sessionsDir);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        try {
          const content = await fs.readFile(
            path.join(sessionsDir, file),
            "utf-8",
          );
          const context = JSON.parse(content) as ExtractedContext;

          if (predicate(context)) {
            results.push(context);
          }
        } catch (error) {
          console.error(`Failed to process file ${file}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalProjects: number;
    totalSessions: number;
    totalSize: number;
    oldestSession: string | null;
    newestSession: string | null;
  }> {
    const projectDirs = await this.listProjectDirs();
    let totalSessions = 0;
    let totalSize = 0;
    let oldestSession: string | null = null;
    let newestSession: string | null = null;

    for (const projectDir of projectDirs) {
      const indexPath = path.join(projectDir, "index.json");
      if (await fileExists(indexPath)) {
        const stats = await fs.stat(indexPath);
        totalSize += stats.size;

        const index = JSON.parse(
          await fs.readFile(indexPath, "utf-8"),
        ) as ProjectIndex;

        totalSessions += index.sessions.length;

        if (index.sessions.length > 0) {
          const oldest = index.sessions[0].timestamp;
          const newest = index.sessions[index.sessions.length - 1].timestamp;

          if (!oldestSession || oldest < oldestSession) {
            oldestSession = oldest;
          }
          if (!newestSession || newest > newestSession) {
            newestSession = newest;
          }
        }
      }

      const sessionsDir = path.join(projectDir, "sessions");
      if (await fileExists(sessionsDir)) {
        const files = await fs.readdir(sessionsDir);
        for (const file of files) {
          const stats = await fs.stat(path.join(sessionsDir, file));
          totalSize += stats.size;
        }
      }
    }

    return {
      totalProjects: projectDirs.length,
      totalSessions,
      totalSize, // Return in bytes
      oldestSession,
      newestSession,
    };
  }

  // Private helper methods

  /**
   * Create or update README file for project navigation
   */
  private async createProjectReadme(
    projectDir: string,
    projectName: string,
    context: ExtractedContext,
  ): Promise<void> {
    const readmePath = path.join(projectDir, "README.md");
    const sessionsDir = path.join(projectDir, "sessions");
    const indexPath = path.join(projectDir, "index.json");

    // Get project index for analytics
    let projectIndex: ProjectIndex | null = null;
    if (await fileExists(indexPath)) {
      try {
        const indexContent = await fs.readFile(indexPath, "utf-8");
        projectIndex = JSON.parse(indexContent) as ProjectIndex;
      } catch (error) {
        console.error("Failed to read project index:", error);
      }
    }

    // Get list of sessions
    const sessions: string[] = [];
    if (await fileExists(sessionsDir)) {
      const files = await fs.readdir(sessionsDir);
      sessions.push(
        ...files
          .filter((f) => f.endsWith(".json"))
          .sort()
          .reverse(),
      );
    }

    // Build analytics section
    let analyticsSection = "";
    if (projectIndex) {
      const toolStats = projectIndex.mostUsedTools?.length
        ? projectIndex.mostUsedTools
            .map((tool) => {
              const count = projectIndex.totalToolUsage?.[tool] || 0;
              return `${tool} (${count}x)`;
            })
            .join(", ")
        : "No tools tracked yet";

      analyticsSection = `
## 📊 Project Analytics

### Overview
- **Total Sessions**: ${projectIndex.sessions.length}
- **Problems Solved**: ${projectIndex.totalProblems}
- **Implementations**: ${projectIndex.totalImplementations}
- **Decisions Made**: ${projectIndex.totalDecisions}
- **Patterns Identified**: ${projectIndex.totalPatterns}

### Tool Usage
- **Most Used Tools**: ${toolStats}
- **Total Tool Invocations**: ${Object.values(projectIndex.totalToolUsage || {}).reduce((a, b) => a + b, 0)}
- **Unique Tools Used**: ${Object.keys(projectIndex.totalToolUsage || {}).length}

### Quality Metrics
- **Average Relevance Score**: ${formatRelevance(projectIndex.averageRelevanceScore || 0)}
- **Files Modified**: ${projectIndex.totalFilesModified || 0} across all sessions
- **Archive Version**: v${projectIndex.version || "unknown"}
`;
    }

    // Create README content
    const content = `# ${projectName} - Context Archive

> Intelligent context preservation powered by c0ntextKeeper  
> Last Updated: ${formatTimestamp(new Date())}

## 🗂️ Project Information
- **Project Path**: \`${context.projectPath}\`
- **Total Sessions**: ${sessions.length}
- **Archive Started**: ${projectIndex?.created ? formatTimestamp(projectIndex.created) : "Unknown"}
- **Latest Activity**: ${formatTimestamp(context.timestamp)}
${analyticsSection}
## 📝 Recent Sessions

${sessions
  .slice(0, 10)
  .map((session) => {
    // Extract description from filename
    const match = session.match(/\d{4}-\d{2}-\d{2}_\d{4}_MT_(.+)\.json$/);
    const description = match ? match[1].replace(/-/g, " ") : "session";

    // Try to find session stats
    const sessionSummary = projectIndex?.sessions.find(
      (s) => s.file === session,
    );

    let statsLine = "";
    if (sessionSummary) {
      const statsParts = [];
      if (sessionSummary.stats.problems > 0)
        statsParts.push(`${sessionSummary.stats.problems} problems`);
      if (sessionSummary.stats.implementations > 0)
        statsParts.push(
          `${sessionSummary.stats.implementations} implementations`,
        );
      if (sessionSummary.stats.decisions > 0)
        statsParts.push(`${sessionSummary.stats.decisions} decisions`);
      if (sessionSummary.relevanceScore > 0)
        statsParts.push(
          `relevance: ${formatRelevance(sessionSummary.relevanceScore)}`,
        );

      if (statsParts.length > 0) {
        statsLine = `\n  - Stats: ${statsParts.join(", ")}`;
      }

      // Add tool usage if available
      if (sessionSummary.toolsUsed && sessionSummary.toolsUsed.length > 0) {
        statsLine += `\n  - Tools: ${sessionSummary.toolsUsed.slice(0, 5).join(", ")}`;
      }

      // Add top problem if available
      if (sessionSummary.topProblem) {
        statsLine += `\n  - Key Issue: "${sessionSummary.topProblem}"`;
      }
    }

    return `### 📄 ${session}
- **Description**: ${description}${statsLine}`;
  })
  .join("\n\n")}

${sessions.length > 10 ? `\n> ...and ${sessions.length - 10} more sessions in the archive\n` : ""}

## 🚀 How to Use This Archive

### Browse Sessions
Each session file contains extracted context from your Claude Code conversations, including:
- **Problems & Solutions**: Issues encountered and how they were resolved
- **Code Implementations**: Files created or modified with full context
- **Technical Decisions**: Architectural choices and their rationale
- **Patterns**: Recurring approaches and best practices
- **Tool Usage**: Which tools were used and how frequently

### Search Your Context
Use the c0ntextKeeper CLI to search across all sessions:

\`\`\`bash
# Search for specific topics
c0ntextkeeper search "authentication"

# Find patterns across sessions
c0ntextkeeper patterns

# Get context for current work
c0ntextkeeper fetch "API implementation"
\`\`\`

### MCP Tools Available
When working in Claude Code, these tools automatically access your archive:
- \`fetch_context\` - Retrieve relevant past context
- \`search_archive\` - Search with advanced filters
- \`get_patterns\` - Identify recurring solutions

## 📁 Storage Structure

\`\`\`
${projectName}/
├── README.md          # This navigation file
├── index.json         # Project statistics and metadata
└── sessions/          # Individual session archives
    ├── YYYY-MM-DD_HHMM_MT_description.json
    └── ... (chronologically organized)
\`\`\`

## 🔍 Understanding Session Files

Each session JSON file contains:
\`\`\`json
{
  "sessionId": "unique-session-identifier",
  "timestamp": "ISO-8601-timestamp",
  "problems": [...],        // Issues and their solutions
  "implementations": [...],  // Code changes made
  "decisions": [...],       // Technical choices
  "patterns": [...],        // Identified patterns
  "metadata": {
    "relevanceScore": 0.0-1.0,
    "toolsUsed": [...],
    "toolCounts": {...},
    "filesModified": [...],
    "duration": milliseconds
  }
}
\`\`\`

## 📈 Archive Benefits

- **Never Lose Context**: Important discussions are preserved before compaction
- **Learn from History**: Past solutions inform future decisions
- **Track Progress**: See how your project evolved over time
- **Share Knowledge**: Team members can access collective learnings
- **Improve Efficiency**: Quickly find previous implementations

---

*Generated by [c0ntextKeeper](https://github.com/Capnjbrown/c0ntextKeeper) v${getPackageVersion()}*
`;

    await fs.writeFile(readmePath, content, "utf-8");
  }

  private async listProjectDirs(): Promise<string[]> {
    const projectsPath = path.join(this.basePath, "projects");
    if (!(await fileExists(projectsPath))) {
      return [];
    }

    const dirs = await fs.readdir(projectsPath);
    return dirs.map((dir) => path.join(projectsPath, dir));
  }

  private async updateProjectIndex(
    projectDir: string,
    context: ExtractedContext,
    sessionFile: string,
  ): Promise<void> {
    const indexPath = path.join(projectDir, "index.json");

    let index: ProjectIndex;

    if (await fileExists(indexPath)) {
      const content = await fs.readFile(indexPath, "utf-8");
      index = JSON.parse(content);
    } else {
      index = {
        projectPath: context.projectPath,
        projectHash: extractProjectName(context.projectPath), // Now stores project name, not hash
        sessions: [],
        totalProblems: 0,
        totalImplementations: 0,
        totalDecisions: 0,
        totalPatterns: 0,
        lastUpdated: new Date().toISOString(),
        created: new Date().toISOString(),
        // Initialize enhanced analytics
        totalToolUsage: {},
        mostUsedTools: [],
        totalFilesModified: 0,
        averageRelevanceScore: 0,
        version: getPackageVersion(),
      };
    }

    // Find the most relevant problem
    const topProblem =
      context.problems.length > 0
        ? context.problems.sort((a, b) => b.relevance - a.relevance)[0].question
        : undefined;

    // Add session summary with enhanced fields
    const summary: SessionSummary = {
      sessionId: context.sessionId,
      timestamp: context.timestamp,
      file: sessionFile,
      stats: {
        problems: context.problems.length,
        implementations: context.implementations.length,
        decisions: context.decisions.length,
        patterns: context.patterns.length,
      },
      relevanceScore: context.metadata.relevanceScore,
      // Enhanced analytics fields
      toolsUsed: context.metadata.toolsUsed,
      toolCounts: context.metadata.toolCounts,
      filesModified: context.metadata.filesModified.length,
      duration: context.metadata.duration,
      topProblem: topProblem ? truncateText(topProblem, 80) : undefined,
      extractionVersion: context.metadata.extractionVersion,
    };

    index.sessions.push(summary);

    // Update totals
    index.totalProblems += context.problems.length;
    index.totalImplementations += context.implementations.length;
    index.totalDecisions += context.decisions.length;
    index.totalPatterns += context.patterns.length;
    index.lastUpdated = new Date().toISOString();

    // Update enhanced analytics
    // Aggregate tool usage
    if (!index.totalToolUsage) {
      index.totalToolUsage = {};
    }
    for (const [tool, count] of Object.entries(context.metadata.toolCounts)) {
      index.totalToolUsage[tool] = (index.totalToolUsage[tool] || 0) + count;
    }

    // Update most used tools (top 5)
    index.mostUsedTools = getTopTools(index.totalToolUsage, 5);

    // Track unique files modified
    const allFiles = new Set<string>();
    for (const session of index.sessions) {
      if (session.filesModified) {
        // Note: We're storing count, but we need to track unique files
        // This is a simplification - in production we'd track actual file paths
        allFiles.add(`session-${session.sessionId}`);
      }
    }
    index.totalFilesModified = allFiles.size;

    // Calculate average relevance score
    const relevanceScores = index.sessions
      .map((s) => s.relevanceScore)
      .filter((score) => score > 0);
    index.averageRelevanceScore = calculateAverage(relevanceScores);

    // Set package version
    index.version = getPackageVersion();

    // Keep only last 100 sessions in index
    if (index.sessions.length > 100) {
      index.sessions = index.sessions.slice(-100);
    }

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
  }

  private async updateGlobalIndex(
    context: ExtractedContext,
    projectName: string,
  ): Promise<void> {
    const globalIndexPath = path.join(this.basePath, "global", "index.json");

    let globalIndex: any = {};

    if (await fileExists(globalIndexPath)) {
      const content = await fs.readFile(globalIndexPath, "utf-8");
      globalIndex = JSON.parse(content);
    }

    if (!globalIndex.projects) {
      globalIndex.projects = {};
    }

    globalIndex.projects[projectName] = {
      path: context.projectPath,
      lastActive: context.timestamp,
      sessionCount: (globalIndex.projects[projectName]?.sessionCount || 0) + 1,
    };

    globalIndex.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      globalIndexPath,
      JSON.stringify(globalIndex, null, 2),
      "utf-8",
    );
  }

  private async cleanOldSessions(projectDir: string): Promise<void> {
    if (this.config.retentionDays <= 0) return;

    const sessionsDir = path.join(projectDir, "sessions");
    if (!(await fileExists(sessionsDir))) return;

    const files = await fs.readdir(sessionsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`Cleaned old session: ${file}`);
      }
    }
  }
}
