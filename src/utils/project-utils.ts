import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Extract project name from working directory path
 * Falls back to hash if name cannot be determined
 */
export function getProjectName(workingDir: string): string {
  try {
    // Get the last part of the path as project name
    const projectName = path.basename(workingDir);
    
    // Validate it's a reasonable project name
    if (projectName && projectName !== '.' && projectName !== '/' && projectName !== '') {
      // Sanitize for filesystem use (remove special chars except dash and underscore)
      return projectName.replace(/[^a-zA-Z0-9-_]/g, '-');
    }
  } catch (error) {
    // Fall through to hash generation
  }
  
  // Fallback to hash if we can't determine a good name
  return crypto.createHash('md5').update(workingDir).digest('hex').substring(0, 12);
}

/**
 * Get the storage path for a specific hook type
 * Note: basePath should already include .c0ntextkeeper from getStoragePath()
 */
export function getHookStoragePath(
  basePath: string,
  hookType: 'sessions' | 'knowledge' | 'patterns' | 'prompts',
  workingDir: string,
  dateString: string,
  fileName: string
): string {
  const projectName = getProjectName(workingDir);
  
  return path.join(
    basePath,
    'archive',
    'projects',
    projectName,
    hookType,
    dateString,
    fileName
  );
}

/**
 * Ensure the archive structure exists for a project
 */
export function ensureProjectArchiveStructure(
  basePath: string,
  workingDir: string
): {
  projectName: string;
  projectPath: string;
  sessionsPath: string;
  knowledgePath: string;
  patternsPath: string;
  promptsPath: string;
} {
  const projectName = getProjectName(workingDir);
  const projectPath = path.join(basePath, '.c0ntextkeeper', 'archive', 'projects', projectName);
  
  return {
    projectName,
    projectPath,
    sessionsPath: path.join(projectPath, 'sessions'),
    knowledgePath: path.join(projectPath, 'knowledge'),
    patternsPath: path.join(projectPath, 'patterns'),
    promptsPath: path.join(projectPath, 'prompts')
  };
}