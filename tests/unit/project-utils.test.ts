import { getProjectName, getHookStoragePath } from '../../src/utils/project-utils';
import * as path from 'path';

describe('Project Utils', () => {
  describe('getProjectName', () => {
    it('should extract project name from path', () => {
      expect(getProjectName('/Users/test/Projects/myProject')).toBe('myProject');
      expect(getProjectName('/home/user/work/another-project')).toBe('another-project');
    });

    it('should sanitize special characters', () => {
      expect(getProjectName('/path/to/my.project@2025')).toBe('my-project-2025');
      expect(getProjectName('/path/with spaces/project')).toBe('project');
    });

    it('should fallback to hash for invalid paths', () => {
      const result = getProjectName('/');
      expect(result).toMatch(/^[a-f0-9]{12}$/); // MD5 hash pattern
    });
  });

  describe('getHookStoragePath', () => {
    const basePath = '/Users/test/.c0ntextkeeper';
    const workingDir = '/Users/test/Projects/myProject';
    const dateString = '2025-09-16';

    it('should create correct path for prompts with date in filename', () => {
      const result = getHookStoragePath(
        basePath,
        'prompts',
        workingDir,
        dateString,
        'prompts.json'
      );

      expect(result).toBe(
        '/Users/test/.c0ntextkeeper/archive/projects/myProject/prompts/2025-09-16-prompts.json'
      );
    });

    it('should create correct path for patterns with date in filename', () => {
      const result = getHookStoragePath(
        basePath,
        'patterns',
        workingDir,
        dateString,
        'patterns.json'
      );

      expect(result).toBe(
        '/Users/test/.c0ntextkeeper/archive/projects/myProject/patterns/2025-09-16-patterns.json'
      );
    });

    it('should create correct path for knowledge with date in filename', () => {
      const result = getHookStoragePath(
        basePath,
        'knowledge',
        workingDir,
        dateString,
        'knowledge.json'
      );

      expect(result).toBe(
        '/Users/test/.c0ntextkeeper/archive/projects/myProject/knowledge/2025-09-16-knowledge.json'
      );
    });

    it('should create correct path for sessions with date in filename', () => {
      const result = getHookStoragePath(
        basePath,
        'sessions',
        workingDir,
        dateString,
        'session.json'
      );

      expect(result).toBe(
        '/Users/test/.c0ntextkeeper/archive/projects/myProject/sessions/2025-09-16-session.json'
      );
    });

    it('should NOT create subdirectories for dates', () => {
      const result = getHookStoragePath(
        basePath,
        'prompts',
        workingDir,
        dateString,
        'prompts.json'
      );

      // Should NOT contain date as a subdirectory
      expect(result).not.toContain('/prompts/2025-09-16/prompts.json');
      // Should have date prefixed to filename
      expect(result).toContain('/prompts/2025-09-16-prompts.json');
    });

    it('should handle projects with special characters', () => {
      const specialDir = '/Users/test/Projects/@scope/package-name';
      const result = getHookStoragePath(
        basePath,
        'prompts',
        specialDir,
        dateString,
        'prompts.json'
      );

      expect(result).toContain('/projects/package-name/prompts/2025-09-16-prompts.json');
    });

    it('should combine date and filename correctly', () => {
      const result = getHookStoragePath(
        basePath,
        'knowledge',
        workingDir,
        '2025-12-31',
        'knowledge.json'
      );

      const filename = path.basename(result);
      expect(filename).toBe('2025-12-31-knowledge.json');
    });
  });
});