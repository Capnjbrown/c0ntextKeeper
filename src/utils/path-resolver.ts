import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

export const CONTEXTKEEPER_DIR = '.c0ntextkeeper';
export const GLOBAL_DIR = path.join(os.homedir(), CONTEXTKEEPER_DIR);

export interface StorageOptions {
  global?: boolean;
  projectPath?: string;
  createIfMissing?: boolean;
}

export interface ProjectStorage {
  local: string;
  global: string;
  hash: string;
  projectPath: string;
  exists: boolean;
  type: 'local' | 'global' | 'none';
}

/**
 * Determines the storage location for c0ntextkeeper data
 * Resolution order:
 * 1. CONTEXTKEEPER_HOME environment variable
 * 2. Project-local .c0ntextkeeper (walks up from CWD)
 * 3. Global ~/.c0ntextkeeper fallback
 */
export function getStoragePath(options: StorageOptions = {}): string {
  const { 
    global: forceGlobal = false, 
    projectPath = process.cwd(),
    createIfMissing = false 
  } = options;
  
  // Force global mode
  if (forceGlobal) {
    if (createIfMissing && !fs.existsSync(GLOBAL_DIR)) {
      fs.mkdirSync(GLOBAL_DIR, { recursive: true });
    }
    return GLOBAL_DIR;
  }
  
  // 1. Check environment variable
  if (process.env.CONTEXTKEEPER_HOME) {
    const envPath = path.resolve(process.env.CONTEXTKEEPER_HOME);
    if (createIfMissing && !fs.existsSync(envPath)) {
      fs.mkdirSync(envPath, { recursive: true });
    }
    return envPath;
  }
  
  // 2. Look for project-local storage (walk up from CWD or specified path)
  let dir = path.resolve(projectPath);
  const root = path.parse(dir).root;
  
  while (dir !== root) {
    const candidate = path.join(dir, CONTEXTKEEPER_DIR);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parentDir = path.dirname(dir);
    if (parentDir === dir) break; // Prevent infinite loop
    dir = parentDir;
  }
  
  // 3. Global fallback
  if (createIfMissing && !fs.existsSync(GLOBAL_DIR)) {
    fs.mkdirSync(GLOBAL_DIR, { recursive: true });
  }
  return GLOBAL_DIR;
}

/**
 * Gets comprehensive project storage information
 */
export function getProjectStorageInfo(projectPath: string = process.cwd()): ProjectStorage {
  const normalizedPath = path.resolve(projectPath);
  const hash = crypto.createHash('sha256')
    .update(normalizedPath)
    .digest('hex')
    .slice(0, 12);
  
  const localPath = path.join(normalizedPath, CONTEXTKEEPER_DIR);
  const globalPath = path.join(GLOBAL_DIR, 'projects', hash);
  
  // Determine which exists and type
  let exists = false;
  let type: 'local' | 'global' | 'none' = 'none';
  
  if (fs.existsSync(localPath)) {
    exists = true;
    type = 'local';
  } else if (fs.existsSync(globalPath)) {
    exists = true;
    type = 'global';
  }
  
  return {
    local: localPath,
    global: globalPath,
    hash,
    projectPath: normalizedPath,
    exists,
    type
  };
}

/**
 * Initialize storage structure at the specified path
 */
export function initializeStorage(
  storagePath: string, 
  options: { isGlobal?: boolean; projectName?: string } = {}
): void {
  const { isGlobal = false, projectName } = options;
  
  const dirs = isGlobal ? [
    path.join(storagePath, 'projects'),
    path.join(storagePath, 'global'),
    path.join(storagePath, 'global', 'solutions'),
    path.join(storagePath, 'logs')
  ] : [
    path.join(storagePath, 'archive'),
    path.join(storagePath, 'archive', 'sessions'),
    path.join(storagePath, 'archive', 'test'),
    path.join(storagePath, 'prompts'),
    path.join(storagePath, 'patterns'),
    path.join(storagePath, 'knowledge'),
    path.join(storagePath, 'errors'),
    path.join(storagePath, 'solutions'),
    path.join(storagePath, 'logs')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Create default config if it doesn't exist
  const configPath = path.join(storagePath, 'config.json');
  if (!fs.existsSync(configPath)) {
    const defaultConfig = isGlobal ? {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      type: 'global',
      settings: {
        defaultArchiveFormat: 'json',
        enableAnalytics: true,
        maxSessionAge: 90
      }
    } : {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      type: 'project',
      projectPath: process.cwd(),
      projectName: projectName || path.basename(process.cwd()),
      hooks: {
        enabled: true,
        claudeCode: true
      },
      archive: {
        maxSessionAge: 90,
        compressionEnabled: false
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }
  
  // Create initial README for archive
  if (!isGlobal) {
    const readmePath = path.join(storagePath, 'archive', 'README.md');
    if (!fs.existsSync(readmePath)) {
      const readmeContent = `# ${projectName || 'Project'} Archive Dashboard

## Overview
This archive contains Claude Code session data and analytics.

## Statistics
- Sessions: 0
- Total Interactions: 0
- Last Updated: ${new Date().toISOString()}

## Recent Sessions
*No sessions yet*

---
*This file is automatically updated by c0ntextkeeper*
`;
      fs.writeFileSync(readmePath, readmeContent);
    }
  }
  
  // Create index.json for tracking
  const indexPath = path.join(storagePath, isGlobal ? 'index.json' : 'archive/index.json');
  if (!fs.existsSync(indexPath)) {
    const indexContent = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      projects: isGlobal ? {} : undefined,
      sessions: isGlobal ? undefined : [],
      statistics: {
        totalSessions: 0,
        totalInteractions: 0
      }
    };
    fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
  }
}

/**
 * Register a project in the global index
 */
export function registerProject(projectPath: string): void {
  const info = getProjectStorageInfo(projectPath);
  const globalIndexPath = path.join(GLOBAL_DIR, 'index.json');
  
  // Ensure global directory exists
  if (!fs.existsSync(GLOBAL_DIR)) {
    initializeStorage(GLOBAL_DIR, { isGlobal: true });
  }
  
  // Read or create index
  let index: any = { projects: {} };
  if (fs.existsSync(globalIndexPath)) {
    index = JSON.parse(fs.readFileSync(globalIndexPath, 'utf-8'));
  }
  
  // Update project entry
  index.projects[info.hash] = {
    path: info.projectPath,
    name: path.basename(info.projectPath),
    storageType: info.type,
    lastAccessed: new Date().toISOString(),
    createdAt: index.projects[info.hash]?.createdAt || new Date().toISOString()
  };
  
  index.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(globalIndexPath, JSON.stringify(index, null, 2));
}