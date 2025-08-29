/**
 * File-based storage implementation
 * Manages context archives in the filesystem
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { 
  ExtractedContext, 
  ProjectIndex, 
  SessionSummary,
  C0ntextKeeperConfig 
} from '../core/types.js';
import { ensureDir, fileExists } from '../utils/filesystem.js';
import { generateSessionName, extractProjectName } from '../utils/session-namer.js';
import { formatTimestamp } from '../utils/formatter.js';

export class FileStore {
  private basePath: string;
  private config: C0ntextKeeperConfig['storage'];

  constructor(config?: Partial<C0ntextKeeperConfig['storage']>) {
    this.config = {
      basePath: path.join(process.env.HOME || '', '.c0ntextkeeper', 'archive'),
      maxArchiveSize: 100, // MB
      compressionEnabled: false,
      retentionDays: 90,
      ...config
    };
    this.basePath = this.config.basePath;
  }

  /**
   * Get the base storage path
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    await ensureDir(this.basePath);
    await ensureDir(path.join(this.basePath, 'projects'));
    await ensureDir(path.join(this.basePath, 'global'));
  }

  /**
   * Store extracted context
   */
  async store(context: ExtractedContext): Promise<string> {
    await this.initialize();

    // Use actual project name instead of hash
    const projectName = extractProjectName(context.projectPath);
    const projectDir = path.join(this.basePath, 'projects', projectName);
    const sessionsDir = path.join(projectDir, 'sessions');
    
    await ensureDir(projectDir);
    await ensureDir(sessionsDir);

    // Create descriptive session filename
    const sessionFile = generateSessionName(context);
    const sessionPath = path.join(sessionsDir, sessionFile);

    // Store context
    await fs.writeFile(
      sessionPath, 
      JSON.stringify(context, null, 2),
      'utf-8'
    );

    // Update project index
    await this.updateProjectIndex(projectDir, context, sessionFile);

    // Create/Update project README for navigation
    await this.createProjectReadme(projectDir, projectName, context);

    // Update global index
    await this.updateGlobalIndex(context, projectName);

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
      const sessionsDir = path.join(projectDir, 'sessions');
      if (!await fileExists(sessionsDir)) continue;

      const files = await fs.readdir(sessionsDir);
      for (const file of files) {
        if (file.includes(sessionId)) {
          const content = await fs.readFile(
            path.join(sessionsDir, file),
            'utf-8'
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
  async getProjectContexts(projectPath: string, limit = 100): Promise<ExtractedContext[]> {
    const projectName = extractProjectName(projectPath);
    const projectDir = path.join(this.basePath, 'projects', projectName);
    const sessionsDir = path.join(projectDir, 'sessions');

    if (!await fileExists(sessionsDir)) {
      return [];
    }

    const files = await fs.readdir(sessionsDir);
    const contexts: ExtractedContext[] = [];

    // Get most recent files first
    const sortedFiles = files
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit);

    for (const file of sortedFiles) {
      try {
        const content = await fs.readFile(
          path.join(sessionsDir, file),
          'utf-8'
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
    const indexPath = path.join(this.basePath, 'projects', projectName, 'index.json');

    if (!await fileExists(indexPath)) {
      return null;
    }

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      return JSON.parse(content) as ProjectIndex;
    } catch (error) {
      console.error('Failed to read project index:', error);
      return null;
    }
  }

  /**
   * Search across all contexts
   */
  async searchAll(predicate: (context: ExtractedContext) => boolean): Promise<ExtractedContext[]> {
    const results: ExtractedContext[] = [];
    const projectDirs = await this.listProjectDirs();

    for (const projectDir of projectDirs) {
      const sessionsDir = path.join(projectDir, 'sessions');
      if (!await fileExists(sessionsDir)) continue;

      const files = await fs.readdir(sessionsDir);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const content = await fs.readFile(
            path.join(sessionsDir, file),
            'utf-8'
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
      const indexPath = path.join(projectDir, 'index.json');
      if (await fileExists(indexPath)) {
        const stats = await fs.stat(indexPath);
        totalSize += stats.size;

        const index = JSON.parse(
          await fs.readFile(indexPath, 'utf-8')
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

      const sessionsDir = path.join(projectDir, 'sessions');
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
      totalSize: Math.round(totalSize / 1024 / 1024), // Convert to MB
      oldestSession,
      newestSession
    };
  }

  // Private helper methods

  /**
   * Generate project hash - kept for backward compatibility
   * @deprecated Use extractProjectName instead
   */
  private generateProjectHash(projectPath: string): string {
    return crypto
      .createHash('md5')
      .update(projectPath)
      .digest('hex')
      .slice(0, 8);
  }

  /**
   * Create or update README file for project navigation
   */
  private async createProjectReadme(
    projectDir: string,
    projectName: string,
    context: ExtractedContext
  ): Promise<void> {
    const readmePath = path.join(projectDir, 'README.md');
    const sessionsDir = path.join(projectDir, 'sessions');
    
    // Get list of sessions
    const sessions: string[] = [];
    if (await fileExists(sessionsDir)) {
      const files = await fs.readdir(sessionsDir);
      sessions.push(...files.filter(f => f.endsWith('.json')).sort().reverse());
    }
    
    // Create README content
    const content = `# ${projectName} - Archive Sessions

## Project Information
- **Project Path**: ${context.projectPath}
- **Total Sessions**: ${sessions.length}
- **Last Updated**: ${formatTimestamp(new Date())}

## Recent Sessions

${sessions.slice(0, 10).map(session => {
  // Extract description from filename
  const match = session.match(/\d{4}-\d{2}-\d{2}_\d{4}_MT_(.+)\.json$/);
  const description = match ? match[1].replace(/-/g, ' ') : 'session';
  return `- **${session}**
  - Description: ${description}`;
}).join('\n\n')}

${sessions.length > 10 ? `\n...and ${sessions.length - 10} more sessions\n` : ''}

## Navigation

This archive contains all preserved context from your Claude Code sessions for the **${projectName}** project.

Each session file contains:
- Problems encountered and solutions
- Code implementations
- Technical decisions made
- Patterns identified
- Metadata about the session

## How to Use

1. Browse session files by their descriptive names
2. Open any JSON file to see the full context
3. Use the c0ntextKeeper CLI to search:
   \`\`\`bash
   c0ntextkeeper search "your query"
   \`\`\`

## Storage Structure

\`\`\`
${projectName}/
├── README.md          # This file
├── index.json         # Project statistics
└── sessions/          # Individual session archives
    ├── YYYY-MM-DD_HHMM_MT_description.json
    └── ...
\`\`\`
`;
    
    await fs.writeFile(readmePath, content, 'utf-8');
  }

  private async listProjectDirs(): Promise<string[]> {
    const projectsPath = path.join(this.basePath, 'projects');
    if (!await fileExists(projectsPath)) {
      return [];
    }

    const dirs = await fs.readdir(projectsPath);
    return dirs.map(dir => path.join(projectsPath, dir));
  }

  private async updateProjectIndex(
    projectDir: string,
    context: ExtractedContext,
    sessionFile: string
  ): Promise<void> {
    const indexPath = path.join(projectDir, 'index.json');
    
    let index: ProjectIndex;
    
    if (await fileExists(indexPath)) {
      const content = await fs.readFile(indexPath, 'utf-8');
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
        created: new Date().toISOString()
      };
    }

    // Add session summary
    const summary: SessionSummary = {
      sessionId: context.sessionId,
      timestamp: context.timestamp,
      file: sessionFile,
      stats: {
        problems: context.problems.length,
        implementations: context.implementations.length,
        decisions: context.decisions.length,
        patterns: context.patterns.length
      },
      relevanceScore: context.metadata.relevanceScore
    };

    index.sessions.push(summary);

    // Update totals
    index.totalProblems += context.problems.length;
    index.totalImplementations += context.implementations.length;
    index.totalDecisions += context.decisions.length;
    index.totalPatterns += context.patterns.length;
    index.lastUpdated = new Date().toISOString();

    // Keep only last 100 sessions in index
    if (index.sessions.length > 100) {
      index.sessions = index.sessions.slice(-100);
    }

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  private async updateGlobalIndex(
    context: ExtractedContext,
    projectName: string
  ): Promise<void> {
    const globalIndexPath = path.join(this.basePath, 'global', 'index.json');
    
    let globalIndex: any = {};
    
    if (await fileExists(globalIndexPath)) {
      const content = await fs.readFile(globalIndexPath, 'utf-8');
      globalIndex = JSON.parse(content);
    }

    if (!globalIndex.projects) {
      globalIndex.projects = {};
    }

    globalIndex.projects[projectName] = {
      path: context.projectPath,
      lastActive: context.timestamp,
      sessionCount: (globalIndex.projects[projectName]?.sessionCount || 0) + 1
    };

    globalIndex.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      globalIndexPath, 
      JSON.stringify(globalIndex, null, 2),
      'utf-8'
    );
  }

  private async cleanOldSessions(projectDir: string): Promise<void> {
    if (this.config.retentionDays <= 0) return;

    const sessionsDir = path.join(projectDir, 'sessions');
    if (!await fileExists(sessionsDir)) return;

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