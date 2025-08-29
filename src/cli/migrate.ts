/**
 * Migration tool for c0ntextKeeper archives
 * Converts old hash-based structure to new human-readable structure
 */

import fs from 'fs/promises';
import path from 'path';
import { ExtractedContext, ProjectIndex } from '../core/types.js';
import { extractProjectName, generateSessionName } from '../utils/session-namer.js';
import { formatTimestamp } from '../utils/formatter.js';
import { ensureDir, fileExists } from '../utils/filesystem.js';
import { Logger } from '../utils/logger.js';

export class ArchiveMigrator {
  private basePath: string;
  private logger: Logger;
  private backupPath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || path.join(process.env.HOME || '', '.c0ntextkeeper', 'archive');
    this.backupPath = path.join(process.env.HOME || '', '.c0ntextkeeper', 'archive-backup');
    this.logger = new Logger('ArchiveMigrator');
  }

  /**
   * Run the migration
   */
  async migrate(dryRun = false): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
    changes: Array<{ from: string; to: string }>;
  }> {
    const result = {
      success: true,
      migrated: 0,
      errors: [] as string[],
      changes: [] as Array<{ from: string; to: string }>
    };

    try {
      this.logger.info(`Starting migration${dryRun ? ' (DRY RUN)' : ''}...`);

      // Create backup if not dry run
      if (!dryRun) {
        await this.createBackup();
      }

      // Get all project directories
      const projectsPath = path.join(this.basePath, 'projects');
      if (!await fileExists(projectsPath)) {
        this.logger.warn('No projects directory found');
        return result;
      }

      const projectDirs = await fs.readdir(projectsPath);
      
      for (const dirName of projectDirs) {
        // Skip if already migrated (not a hash)
        if (!this.isHashDirectory(dirName)) {
          this.logger.info(`Skipping ${dirName} - already migrated`);
          continue;
        }

        const oldPath = path.join(projectsPath, dirName);
        
        try {
          // Read the project index to get the actual project path
          const indexPath = path.join(oldPath, 'index.json');
          if (!await fileExists(indexPath)) {
            result.errors.push(`No index.json found in ${dirName}`);
            continue;
          }

          const indexContent = await fs.readFile(indexPath, 'utf-8');
          const index: ProjectIndex = JSON.parse(indexContent);
          
          // Extract the project name from the path
          const projectName = extractProjectName(index.projectPath);
          const newPath = path.join(projectsPath, projectName);

          // Record the change
          result.changes.push({ from: dirName, to: projectName });

          if (!dryRun) {
            // Create new directory
            await ensureDir(newPath);
            
            // Migrate sessions
            const sessionsDir = path.join(oldPath, 'sessions');
            if (await fileExists(sessionsDir)) {
              const newSessionsDir = path.join(newPath, 'sessions');
              await ensureDir(newSessionsDir);
              
              const sessions = await fs.readdir(sessionsDir);
              for (const sessionFile of sessions) {
                if (!sessionFile.endsWith('.json')) continue;
                
                // Read the session
                const sessionPath = path.join(sessionsDir, sessionFile);
                const sessionContent = await fs.readFile(sessionPath, 'utf-8');
                const session: ExtractedContext = JSON.parse(sessionContent);
                
                // Generate new filename
                const newFileName = generateSessionName(session);
                const newSessionPath = path.join(newSessionsDir, newFileName);
                
                // Write with new filename
                await fs.writeFile(newSessionPath, sessionContent, 'utf-8');
                
                this.logger.info(`Migrated session: ${sessionFile} → ${newFileName}`);
              }
            }
            
            // Update and copy index.json
            index.projectHash = projectName; // Update to use name instead of hash
            await fs.writeFile(
              path.join(newPath, 'index.json'),
              JSON.stringify(index, null, 2),
              'utf-8'
            );
            
            // Create README for the project
            await this.createProjectReadme(newPath, projectName, index.projectPath);
            
            // Remove old directory
            await fs.rm(oldPath, { recursive: true });
            
            result.migrated++;
            this.logger.info(`Migrated: ${dirName} → ${projectName}`);
          } else {
            this.logger.info(`Would migrate: ${dirName} → ${projectName}`);
            result.migrated++;
          }
        } catch (error) {
          const errorMsg = `Failed to migrate ${dirName}: ${error}`;
          result.errors.push(errorMsg);
          this.logger.error(errorMsg);
          result.success = false;
        }
      }

      // Update global index
      if (!dryRun && result.migrated > 0) {
        await this.updateGlobalIndex(result.changes);
      }

      this.logger.info(`Migration complete: ${result.migrated} projects migrated`);
      if (result.errors.length > 0) {
        this.logger.warn(`Errors encountered: ${result.errors.length}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.logger.error('Migration failed:', error);
    }

    return result;
  }

  /**
   * Create a backup of the archive directory
   */
  private async createBackup(): Promise<void> {
    this.logger.info('Creating backup...');
    
    if (await fileExists(this.backupPath)) {
      // Remove old backup
      await fs.rm(this.backupPath, { recursive: true });
    }

    // Copy entire archive directory
    await this.copyDirectory(this.basePath, this.backupPath);
    this.logger.info(`Backup created at: ${this.backupPath}`);
  }

  /**
   * Recursively copy a directory
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await ensureDir(dest);
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Check if a directory name is a hash (8 hex characters)
   */
  private isHashDirectory(name: string): boolean {
    return /^[a-f0-9]{8}$/.test(name);
  }

  /**
   * Create README file for migrated project
   */
  private async createProjectReadme(
    projectDir: string,
    projectName: string,
    projectPath: string
  ): Promise<void> {
    const readmePath = path.join(projectDir, 'README.md');
    const sessionsDir = path.join(projectDir, 'sessions');
    
    // Get list of sessions
    const sessions: string[] = [];
    if (await fileExists(sessionsDir)) {
      const files = await fs.readdir(sessionsDir);
      sessions.push(...files.filter(f => f.endsWith('.json')).sort().reverse());
    }
    
    const content = `# ${projectName} - Archive Sessions

## Migration Notice
This archive was migrated from the old hash-based structure on ${formatTimestamp(new Date())}.

## Project Information
- **Project Path**: ${projectPath}
- **Total Sessions**: ${sessions.length}
- **Migration Date**: ${formatTimestamp(new Date())}

## Sessions

${sessions.slice(0, 10).map(session => {
  const match = session.match(/\d{4}-\d{2}-\d{2}_\d{4}_MT_(.+)\.json$/);
  const description = match ? match[1].replace(/-/g, ' ') : 'session';
  return `- **${session}**
  - Description: ${description}`;
}).join('\n\n')}

${sessions.length > 10 ? `\n...and ${sessions.length - 10} more sessions\n` : ''}

## About This Migration

Your archives have been converted from the old hash-based directory structure to a human-readable project name structure. This makes it easier to:
- Navigate your archives
- Understand which project each archive belongs to
- Find specific sessions by their descriptive names

The original data remains unchanged - only the directory and file names have been updated for better usability.
`;
    
    await fs.writeFile(readmePath, content, 'utf-8');
  }

  /**
   * Update global index with new project names
   */
  private async updateGlobalIndex(changes: Array<{ from: string; to: string }>): Promise<void> {
    const globalIndexPath = path.join(this.basePath, 'global', 'index.json');
    
    if (!await fileExists(globalIndexPath)) {
      this.logger.warn('No global index found');
      return;
    }

    try {
      const content = await fs.readFile(globalIndexPath, 'utf-8');
      const globalIndex = JSON.parse(content);
      
      if (globalIndex.projects) {
        const newProjects: any = {};
        
        for (const [key, value] of Object.entries(globalIndex.projects)) {
          // Find if this key needs to be renamed
          const change = changes.find(c => c.from === key);
          const newKey = change ? change.to : key;
          newProjects[newKey] = value;
        }
        
        globalIndex.projects = newProjects;
        globalIndex.migratedAt = new Date().toISOString();
        
        await fs.writeFile(globalIndexPath, JSON.stringify(globalIndex, null, 2), 'utf-8');
        this.logger.info('Updated global index');
      }
    } catch (error) {
      this.logger.error('Failed to update global index:', error);
    }
  }

  /**
   * Restore from backup
   */
  async restore(): Promise<void> {
    if (!await fileExists(this.backupPath)) {
      throw new Error('No backup found');
    }

    this.logger.info('Restoring from backup...');
    
    // Remove current archive
    if (await fileExists(this.basePath)) {
      await fs.rm(this.basePath, { recursive: true });
    }
    
    // Copy backup back
    await this.copyDirectory(this.backupPath, this.basePath);
    
    this.logger.info('Restore complete');
  }
}