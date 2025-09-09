import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { 
  getStoragePath, 
  getProjectStorageInfo,
  initializeStorage,
  registerProject,
  CONTEXTKEEPER_DIR 
} from '../../src/utils/path-resolver';

describe('Path Resolver', () => {
  const originalCwd = process.cwd();
  const testDirName = 'c0ntextkeeper-test-' + Date.now();
  const testDirBase = path.join(os.tmpdir(), testDirName);
  let testDir: string;
  
  beforeEach(() => {
    // Clean test directory
    if (fs.existsSync(testDirBase)) {
      fs.rmSync(testDirBase, { recursive: true });
    }
    fs.mkdirSync(testDirBase, { recursive: true });
    // Resolve symlinks after creation
    testDir = fs.realpathSync(testDirBase);
    process.chdir(testDir);
    
    // Clear environment variables
    delete process.env.CONTEXTKEEPER_HOME;
    delete process.env.CONTEXTKEEPER_GLOBAL;
  });
  
  afterEach(() => {
    process.chdir(originalCwd);
    // Clean up test directory
    if (fs.existsSync(testDirBase)) {
      fs.rmSync(testDirBase, { recursive: true });
    }
  });
  
  describe('getStoragePath', () => {
    test('should resolve to project-local storage when initialized', () => {
      const localPath = path.join(testDir, CONTEXTKEEPER_DIR);
      fs.mkdirSync(localPath);
      
      const resolved = getStoragePath();
      expect(resolved).toBe(localPath);
    });
    
    test('should walk up directory tree to find storage', () => {
      const localPath = path.join(testDir, CONTEXTKEEPER_DIR);
      fs.mkdirSync(localPath);
      
      const subdir = path.join(testDir, 'subdir', 'deep');
      fs.mkdirSync(subdir, { recursive: true });
      process.chdir(subdir);
      
      const resolved = getStoragePath();
      expect(resolved).toBe(localPath);
    });
    
    test('should respect CONTEXTKEEPER_HOME environment variable', () => {
      const customPath = path.join(testDir, 'custom');
      process.env.CONTEXTKEEPER_HOME = customPath;
      
      const resolved = getStoragePath({ createIfMissing: true });
      expect(resolved).toBe(customPath);
      expect(fs.existsSync(customPath)).toBe(true);
    });
    
    test('should fall back to global storage', () => {
      const resolved = getStoragePath();
      expect(resolved).toBe(path.join(os.homedir(), CONTEXTKEEPER_DIR));
    });
    
    test('should force global when option is set', () => {
      const localPath = path.join(testDir, CONTEXTKEEPER_DIR);
      fs.mkdirSync(localPath);
      
      const resolved = getStoragePath({ global: true });
      expect(resolved).toBe(path.join(os.homedir(), CONTEXTKEEPER_DIR));
    });
    
    test('should create directory when createIfMissing is true', () => {
      const customPath = path.join(testDir, 'new-storage');
      process.env.CONTEXTKEEPER_HOME = customPath;
      
      expect(fs.existsSync(customPath)).toBe(false);
      getStoragePath({ createIfMissing: true });
      expect(fs.existsSync(customPath)).toBe(true);
    });
    
    test('should handle nested project paths', () => {
      const projectRoot = path.join(testDir, 'my-project');
      const localPath = path.join(projectRoot, CONTEXTKEEPER_DIR);
      fs.mkdirSync(projectRoot, { recursive: true });
      fs.mkdirSync(localPath);
      
      const deepPath = path.join(projectRoot, 'src', 'components', 'ui');
      fs.mkdirSync(deepPath, { recursive: true });
      process.chdir(deepPath);
      
      const resolved = getStoragePath();
      expect(resolved).toBe(localPath);
    });
  });
  
  describe('getProjectStorageInfo', () => {
    test('should return correct info for local storage', () => {
      const localPath = path.join(testDir, CONTEXTKEEPER_DIR);
      fs.mkdirSync(localPath);
      
      const info = getProjectStorageInfo(testDir);
      expect(info.type).toBe('local');
      expect(info.exists).toBe(true);
      expect(info.local).toBe(localPath);
      expect(info.projectPath).toBe(testDir);
      expect(info.hash).toHaveLength(12);
    });
    
    test('should return correct info for non-existent storage', () => {
      const info = getProjectStorageInfo(testDir);
      expect(info.type).toBe('none');
      expect(info.exists).toBe(false);
      expect(info.projectPath).toBe(testDir);
    });
    
    test('should generate consistent hash for same path', () => {
      const info1 = getProjectStorageInfo(testDir);
      const info2 = getProjectStorageInfo(testDir);
      expect(info1.hash).toBe(info2.hash);
    });
    
    test('should generate different hashes for different paths', () => {
      const path1 = path.join(testDir, 'project1');
      const path2 = path.join(testDir, 'project2');
      
      const info1 = getProjectStorageInfo(path1);
      const info2 = getProjectStorageInfo(path2);
      expect(info1.hash).not.toBe(info2.hash);
    });
  });
  
  describe('initializeStorage', () => {
    test('should create project-local storage structure', () => {
      const storagePath = path.join(testDir, CONTEXTKEEPER_DIR);
      
      initializeStorage(storagePath, { isGlobal: false, projectName: 'test-project' });
      
      // Check directories exist
      expect(fs.existsSync(path.join(storagePath, 'archive'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'archive', 'sessions'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'archive', 'test'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'prompts'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'patterns'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'knowledge'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'errors'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'solutions'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'logs'))).toBe(true);
      
      // Check files exist
      expect(fs.existsSync(path.join(storagePath, 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'archive', 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'archive', 'index.json'))).toBe(true);
      
      // Check config content
      const config = JSON.parse(fs.readFileSync(path.join(storagePath, 'config.json'), 'utf-8'));
      expect(config.type).toBe('project');
      expect(config.projectName).toBe('test-project');
    });
    
    test('should create global storage structure', () => {
      const storagePath = path.join(testDir, 'global-storage');
      
      initializeStorage(storagePath, { isGlobal: true });
      
      // Check directories exist
      expect(fs.existsSync(path.join(storagePath, 'projects'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'global'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'global', 'solutions'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'logs'))).toBe(true);
      
      // Check files exist
      expect(fs.existsSync(path.join(storagePath, 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'index.json'))).toBe(true);
      
      // Check config content
      const config = JSON.parse(fs.readFileSync(path.join(storagePath, 'config.json'), 'utf-8'));
      expect(config.type).toBe('global');
    });
    
    test('should not overwrite existing config', () => {
      const storagePath = path.join(testDir, CONTEXTKEEPER_DIR);
      fs.mkdirSync(storagePath, { recursive: true });
      
      // Create existing config
      const existingConfig = { custom: 'value', version: '0.0.1' };
      fs.writeFileSync(
        path.join(storagePath, 'config.json'),
        JSON.stringify(existingConfig, null, 2)
      );
      
      initializeStorage(storagePath, { isGlobal: false });
      
      // Check config wasn't overwritten
      const config = JSON.parse(fs.readFileSync(path.join(storagePath, 'config.json'), 'utf-8'));
      expect(config.custom).toBe('value');
      expect(config.version).toBe('0.0.1');
    });
  });
  
  describe('registerProject', () => {
    test('should register project in global index', () => {
      const globalPath = path.join(testDir, 'global');
      const projectPath = path.join(testDir, 'my-project');
      
      // Mock global directory
      process.env.CONTEXTKEEPER_HOME = globalPath;
      fs.mkdirSync(globalPath, { recursive: true });
      
      registerProject(projectPath);
      
      const indexPath = path.join(globalPath, 'index.json');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const projectHash = getProjectStorageInfo(projectPath).hash;
      
      expect(index.projects[projectHash]).toBeDefined();
      expect(index.projects[projectHash].path).toBe(projectPath);
      expect(index.projects[projectHash].name).toBe('my-project');
    });
    
    test('should update existing project entry', () => {
      const globalPath = path.join(testDir, 'global');
      const projectPath = path.join(testDir, 'my-project');
      
      process.env.CONTEXTKEEPER_HOME = globalPath;
      fs.mkdirSync(globalPath, { recursive: true });
      
      // Register once
      registerProject(projectPath);
      
      const indexPath = path.join(globalPath, 'index.json');
      const index1 = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const projectHash = getProjectStorageInfo(projectPath).hash;
      const createdAt1 = index1.projects[projectHash].createdAt;
      
      // Wait a bit and register again
      setTimeout(() => {
        registerProject(projectPath);
        
        const index2 = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        const createdAt2 = index2.projects[projectHash].createdAt;
        const lastAccessed2 = index2.projects[projectHash].lastAccessed;
        
        // Created date should remain the same
        expect(createdAt2).toBe(createdAt1);
        // Last accessed should be updated
        expect(new Date(lastAccessed2).getTime()).toBeGreaterThan(new Date(createdAt1).getTime());
      }, 10);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle root directory properly', () => {
      // This test is platform-specific and may need adjustment
      const rootPath = path.parse(process.cwd()).root;
      process.chdir(rootPath);
      
      const resolved = getStoragePath();
      // Should fall back to global since we can't go up from root
      expect(resolved).toBe(path.join(os.homedir(), CONTEXTKEEPER_DIR));
    });
    
    test('should handle paths with spaces', () => {
      const pathWithSpaces = path.join(testDir, 'my project with spaces');
      fs.mkdirSync(pathWithSpaces, { recursive: true });
      process.chdir(pathWithSpaces);
      
      const localPath = path.join(pathWithSpaces, CONTEXTKEEPER_DIR);
      fs.mkdirSync(localPath);
      
      const resolved = getStoragePath();
      expect(resolved).toBe(localPath);
    });
    
    test('should handle symbolic links', () => {
      const realPath = path.join(testDir, 'real-project');
      const linkPath = path.join(testDir, 'linked-project');
      
      fs.mkdirSync(realPath, { recursive: true });
      fs.mkdirSync(path.join(realPath, CONTEXTKEEPER_DIR));
      
      // Create symlink
      fs.symlinkSync(realPath, linkPath, 'dir');
      process.chdir(linkPath);
      
      const resolved = getStoragePath();
      // Should find storage through the symlink
      expect(resolved).toBe(path.join(realPath, CONTEXTKEEPER_DIR));
    });
  });
});