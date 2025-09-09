import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { 
  CONTEXTKEEPER_DIR, 
  getProjectStorageInfo, 
  initializeStorage,
  registerProject 
} from '../utils/path-resolver';
import { Logger } from '../utils/logger';

const logger = new Logger('Init', undefined, false);

export interface InitOptions {
  global?: boolean;
  force?: boolean;
  skipGitignore?: boolean;
  projectName?: string;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const { 
    global: globalInit = false, 
    force = false,
    skipGitignore = false,
    projectName
  } = options;
  
  try {
    if (globalInit) {
      // Initialize global storage
      const globalPath = path.join(os.homedir(), CONTEXTKEEPER_DIR);
      logger.info(`Initializing global c0ntextkeeper storage at: ${globalPath}`);
      
      initializeStorage(globalPath, { isGlobal: true });
      
      logger.info('✓ Global storage initialized successfully');
      logger.info(`\nGlobal configuration: ${path.join(globalPath, 'config.json')}`);
      return;
    }
    
    // Initialize project-local storage
    const projectPath = process.cwd();
    const info = getProjectStorageInfo(projectPath);
    
    if (info.exists && info.type === 'local' && !force) {
      logger.warn(`⚠️  c0ntextkeeper is already initialized in this project`);
      logger.info(`   Path: ${info.local}`);
      logger.info(`   Use --force to reinitialize`);
      return;
    }
    
    logger.info(`Initializing c0ntextkeeper in: ${projectPath}`);
    
    // Create local storage
    initializeStorage(info.local, { 
      isGlobal: false,
      projectName: projectName || path.basename(projectPath)
    });
    
    // Register in global index
    registerProject(projectPath);
    
    // Add to .gitignore if it exists
    if (!skipGitignore) {
      const gitignorePath = path.join(projectPath, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
        if (!gitignore.includes(CONTEXTKEEPER_DIR)) {
          const gitignoreEntry = `
# c0ntextkeeper archives
${CONTEXTKEEPER_DIR}/
# Or selectively ignore:
# ${CONTEXTKEEPER_DIR}/archive/sessions/
# ${CONTEXTKEEPER_DIR}/logs/
`;
          fs.appendFileSync(gitignorePath, gitignoreEntry);
          logger.info('✓ Added .c0ntextkeeper to .gitignore');
        }
      } else {
        logger.info('ℹ No .gitignore found - consider adding .c0ntextkeeper/ to version control exclusions');
      }
    }
    
    logger.info('✓ Project storage initialized successfully');
    logger.info(`\nStorage structure created at: ${info.local}`);
    logger.info('\nNext steps:');
    logger.info('  1. Run your Claude Code commands as normal');
    logger.info('  2. Archives will be stored in .c0ntextkeeper/archive/');
    logger.info('  3. View analytics in .c0ntextkeeper/archive/README.md');
    logger.info('  4. Use --global flag to access global storage');
    
  } catch (error) {
    logger.error('Failed to initialize c0ntextkeeper:', error);
    process.exit(1);
  }
}

/**
 * Check storage status
 */
export async function statusCommand(): Promise<void> {
  const info = getProjectStorageInfo();
  
  logger.info('C0ntextKeeper Storage Status\n');
  logger.info(`Current Directory: ${info.projectPath}`);
  logger.info(`Project Hash: ${info.hash}`);
  
  if (info.exists) {
    logger.info(`\n✓ Storage initialized (${info.type})`);
    logger.info(`  Location: ${info.type === 'local' ? info.local : info.global}`);
    
    // Read and display config
    const configPath = path.join(
      info.type === 'local' ? info.local : info.global,
      'config.json'
    );
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      logger.info(`  Version: ${config.version}`);
      logger.info(`  Created: ${config.createdAt}`);
      logger.info(`  Type: ${config.type}`);
    }
  } else {
    logger.warn('\n⚠️  No storage initialized for this project');
    logger.info('\nRun "c0ntextkeeper init" to initialize local storage');
  }
  
  // Check global storage
  const globalPath = path.join(os.homedir(), CONTEXTKEEPER_DIR);
  if (fs.existsSync(globalPath)) {
    logger.info('\n✓ Global storage exists');
    logger.info(`  Location: ${globalPath}`);
    
    const globalIndexPath = path.join(globalPath, 'index.json');
    if (fs.existsSync(globalIndexPath)) {
      const index = JSON.parse(fs.readFileSync(globalIndexPath, 'utf-8'));
      const projectCount = Object.keys(index.projects || {}).length;
      logger.info(`  Registered projects: ${projectCount}`);
    }
  }
}