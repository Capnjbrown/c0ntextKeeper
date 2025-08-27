/**
 * Tests for ContextExtractor
 */

import { ContextExtractor } from '../../src/core/extractor';
import { TranscriptEntry } from '../../src/core/types';

describe('ContextExtractor', () => {
  let extractor: ContextExtractor;

  beforeEach(() => {
    extractor = new ContextExtractor();
  });

  describe('extract', () => {
    it('should extract context from transcript entries', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test-session',
          message: {
            role: 'user',
            content: 'I have an error with the authentication system'
          }
        },
        {
          type: 'assistant',
          timestamp: '2024-01-01T00:00:01Z',
          sessionId: 'test-session',
          message: {
            role: 'assistant',
            content: 'Let me help you fix the authentication error. The solution is to update the JWT validation.'
          }
        },
        {
          type: 'tool_use',
          timestamp: '2024-01-01T00:00:02Z',
          sessionId: 'test-session',
          toolUse: {
            name: 'Edit',
            input: {
              file_path: 'auth.ts',
              old_string: 'validate(token)',
              new_string: 'validateJWT(token)'
            }
          }
        }
      ];

      const context = extractor.extract(entries);

      expect(context).toBeDefined();
      expect(context.sessionId).toBe('test-session');
      expect(context.problems.length).toBeGreaterThan(0);
      expect(context.implementations.length).toBeGreaterThan(0);
      
      // Check problem extraction
      const problem = context.problems[0];
      expect(problem.question).toContain('authentication');
      expect(problem.tags).toContain('api');
    });

    it('should handle empty entries', () => {
      expect(() => extractor.extract([])).toThrow('No transcript entries provided');
    });

    it('should identify patterns', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'tool_use',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test-session',
          toolUse: {
            name: 'Bash',
            input: {
              command: 'npm test'
            }
          }
        },
        {
          type: 'tool_use',
          timestamp: '2024-01-01T00:01:00Z',
          sessionId: 'test-session',
          toolUse: {
            name: 'Bash',
            input: {
              command: 'npm test'
            }
          }
        }
      ];

      const context = extractor.extract(entries);
      
      expect(context.patterns.length).toBeGreaterThan(0);
      const pattern = context.patterns.find(p => p.type === 'command');
      expect(pattern).toBeDefined();
      expect(pattern?.frequency).toBe(2);
    });

    it('should extract decisions', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'assistant',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test-session',
          message: {
            role: 'assistant',
            content: 'We should use Redis for caching because it provides better performance than in-memory storage.'
          }
        }
      ];

      const context = extractor.extract(entries);
      
      expect(context.decisions.length).toBeGreaterThan(0);
      const decision = context.decisions[0];
      expect(decision.decision).toContain('should use Redis');
      expect(decision.rationale).toContain('because');
    });
  });
});