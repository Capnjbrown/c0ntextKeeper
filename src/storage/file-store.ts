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

    // Generate project hash from path
    const projectHash = this.generateProjectHash(context.projectPath);
    const projectDir = path.join(this.basePath, 'projects', projectHash);
    const sessionsDir = path.join(projectDir, 'sessions');
    
    await ensureDir(projectDir);
    await ensureDir(sessionsDir);

    // Create session filename
    const dateStr = new Date().toISOString().split('T')[0];
    const sessionFile = `${dateStr}-${context.sessionId}.json`;
    const sessionPath = path.join(sessionsDir, sessionFile);

    // Store context
    await fs.writeFile(
      sessionPath, 
      JSON.stringify(context, null, 2),
      'utf-8'
    );

    // Update project index
    await this.updateProjectIndex(projectDir, context, sessionFile);

    // Update global index
    await this.updateGlobalIndex(context, projectHash);

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
    const projectHash = this.generateProjectHash(projectPath);
    const projectDir = path.join(this.basePath, 'projects', projectHash);
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
    const projectHash = this.generateProjectHash(projectPath);
    const indexPath = path.join(this.basePath, 'projects', projectHash, 'index.json');

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

  private generateProjectHash(projectPath: string): string {
    return crypto
      .createHash('md5')
      .update(projectPath)
      .digest('hex')
      .slice(0, 8);
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
        projectHash: this.generateProjectHash(context.projectPath),
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
    projectHash: string
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

    globalIndex.projects[projectHash] = {
      path: context.projectPath,
      lastActive: context.timestamp,
      sessionCount: (globalIndex.projects[projectHash]?.sessionCount || 0) + 1
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