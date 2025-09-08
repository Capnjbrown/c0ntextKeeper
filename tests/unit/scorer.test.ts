/**
 * Tests for RelevanceScorer
 */

import { RelevanceScorer } from '../../src/core/scorer';
import { TranscriptEntry } from '../../src/core/types';

describe('RelevanceScorer', () => {
  let scorer: RelevanceScorer;

  beforeEach(() => {
    scorer = new RelevanceScorer();
  });

  describe('scoreContent', () => {
    describe('user questions', () => {
      it('should score user questions as 1.0', () => {
        const score = scorer.scoreContent('How do I implement authentication?', 'user');
        expect(score).toBe(1.0);
      });

      it('should score user help requests as 1.0', () => {
        const score = scorer.scoreContent('Can you help me fix this error?', 'user');
        expect(score).toBe(1.0);
      });

      it('should score user problem statements as 1.0', () => {
        const score = scorer.scoreContent('I have an issue with the database connection', 'user');
        expect(score).toBe(1.0);
      });

      it('should score user what questions as 1.0', () => {
        const score = scorer.scoreContent('What is the best way to structure this?', 'user');
        expect(score).toBe(1.0);
      });
    });

    describe('assistant responses', () => {
      it('should score solutions highly', () => {
        const content = 'The solution is to update your JWT validation by implementing proper token verification.';
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBeGreaterThanOrEqual(0.7);
      });

      it('should score error fixes highly', () => {
        const content = 'To fix this error, you need to add proper error handling in your async function.';
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBeGreaterThanOrEqual(0.8);
      });

      it('should score architecture decisions highly', () => {
        const content = 'We should use dependency injection because it provides better testability and maintainability.';
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBeGreaterThanOrEqual(0.7);
      });

      it('should score implementation details moderately', () => {
        const content = 'Here is how you implement the feature using TypeScript interfaces.';
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBeGreaterThanOrEqual(0.6);
      });

      it('should score generic responses lower', () => {
        const content = 'Okay, I understand what you need.';
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBeLessThan(0.5);
      });
    });

    describe('edge cases', () => {
      it('should handle empty strings', () => {
        const score = scorer.scoreContent('', 'user');
        expect(score).toBe(0);
      });

      it('should handle whitespace-only strings', () => {
        const score = scorer.scoreContent('   \n\t  ', 'assistant');
        expect(score).toBe(0);
      });

      it('should handle very long content', () => {
        const longContent = 'This is a solution. '.repeat(1000);
        const score = scorer.scoreContent(longContent, 'assistant');
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1.0);
      });

      it('should handle content with special characters', () => {
        const content = 'How do I fix @#$%^&*() this error?';
        const score = scorer.scoreContent(content, 'user');
        expect(score).toBe(1.0); // User questions always score 1.0
      });
    });

    describe('non-string content handling', () => {
      it('should handle arrays', () => {
        const content = ['item1', 'item2', 'item3'] as any;
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBe(0);
      });

      it('should handle objects', () => {
        const content = { key: 'value' } as any;
        const score = scorer.scoreContent(content, 'assistant');
        expect(score).toBe(0);
      });

      it('should handle null', () => {
        const score = scorer.scoreContent(null as any, 'assistant');
        expect(score).toBe(0);
      });

      it('should handle undefined', () => {
        const score = scorer.scoreContent(undefined as any, 'assistant');
        expect(score).toBe(0);
      });

      it('should handle numbers', () => {
        const score = scorer.scoreContent(42 as any, 'assistant');
        expect(score).toBe(0);
      });
    });
  });

  describe('scoreTool', () => {
    it('should score TodoWrite tool as 0.5', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'TodoWrite',
          input: { todos: [] }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.5);
    });

    it('should score Bash tool as 0.4', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'Bash',
          input: { command: 'npm test' }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.4);
    });

    it('should score Edit tool as 0.8', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'Edit',
          input: { file_path: 'test.ts', old_string: 'old', new_string: 'new' }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.8);
    });

    it('should score Write tool as 0.8', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'Write',
          input: { file_path: 'test.ts', content: 'content' }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.8);
    });

    it('should score Read tool as 0.3', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'Read',
          input: { file_path: 'test.ts' }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.3);
    });

    it('should score Create tool as 0.7', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'Create',
          input: { path: 'new-dir' }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.7);
    });

    it('should score Delete tool as 0.6', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'Delete',
          input: { path: 'old-file.ts' }
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.6);
    });

    it('should score unknown tools as 0.2', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'UnknownTool',
          input: {}
        }
      };
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.2);
    });

    it('should handle mcp prefixed tools', () => {
      const entry: TranscriptEntry = {
        type: 'tool_use',
        timestamp: '2024-01-01T00:00:00Z',
        sessionId: 'test',
        toolUse: {
          name: 'mcp__filesystem__write_file',
          input: { path: 'test.ts', content: 'content' }
        }
      };
      // mcp tools typically score as unknown (0.2) unless specifically handled
      const score = scorer.scoreTool(entry);
      expect(score).toBe(0.2);
    });
  });

  describe('score', () => {
    it('should combine multiple scoring factors', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'How do I fix the authentication error?'
            }]
          }
        },
        {
          type: 'assistant',
          timestamp: '2024-01-01T00:00:01Z',
          sessionId: 'test',
          message: {
            role: 'assistant',
            content: [{
              type: 'text',
              text: 'The solution is to update your JWT validation.'
            }]
          }
        },
        {
          type: 'tool_use',
          timestamp: '2024-01-01T00:00:02Z',
          sessionId: 'test',
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

      const finalScore = scorer.score(entries);
      
      // Should have high score due to:
      // - User question (1.0)
      // - Solution response (high)
      // - Edit tool use (0.8)
      expect(finalScore).toBeGreaterThan(0.7);
      expect(finalScore).toBeLessThanOrEqual(1.0);
    });

    it('should handle empty entries', () => {
      const finalScore = scorer.score([]);
      expect(finalScore).toBe(0);
    });

    it('should handle entries without scorable content', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'system',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test',
          message: {
            role: 'system',
            content: [{
              type: 'text',
              text: 'System message'
            }]
          }
        }
      ];

      const finalScore = scorer.score(entries);
      expect(finalScore).toBe(0);
    });

    it('should cap maximum score at 1.0', () => {
      // Even with many high-scoring entries, score should not exceed 1.0
      const entries: TranscriptEntry[] = Array(10).fill(null).map((_, i) => ({
        type: 'user' as const,
        timestamp: `2024-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
        sessionId: 'test',
        message: {
          role: 'user' as const,
          content: [{
            type: 'text' as const,
            text: 'How do I solve this problem?'
          }]
        }
      }));

      const finalScore = scorer.score(entries);
      expect(finalScore).toBe(1.0);
    });

    it('should weight recent entries more heavily', () => {
      const oldEntries: TranscriptEntry[] = [
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'Old question from earlier'
            }]
          }
        }
      ];

      const recentEntries: TranscriptEntry[] = [
        {
          type: 'user',
          timestamp: '2024-01-01T23:59:00Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'Recent question just now'
            }]
          }
        }
      ];

      // Both have user questions, but timing might affect final score
      const oldScore = scorer.score(oldEntries);
      const recentScore = scorer.score(recentEntries);
      
      // Both should be high since user questions score 1.0
      expect(oldScore).toBeGreaterThan(0.9);
      expect(recentScore).toBeGreaterThan(0.9);
    });
  });

  describe('calculateUserEngagement', () => {
    it('should identify user questions correctly', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'How do I implement this feature?'
            }]
          }
        },
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:01Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'What is the best approach?'
            }]
          }
        }
      ];

      const engagement = (scorer as any).calculateUserEngagement(entries);
      expect(engagement).toBe(1.0); // All entries are questions
    });

    it('should handle mixed question and statement entries', () => {
      const entries: TranscriptEntry[] = [
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'How do I fix this?'
            }]
          }
        },
        {
          type: 'user',
          timestamp: '2024-01-01T00:00:01Z',
          sessionId: 'test',
          message: {
            role: 'user',
            content: [{
              type: 'text',
              text: 'Update the configuration file.'
            }]
          }
        }
      ];

      const engagement = (scorer as any).calculateUserEngagement(entries);
      expect(engagement).toBe(0.5); // Half are questions
    });
  });

  describe('extractKeywords', () => {
    it('should extract technology keywords', () => {
      const content = 'Using React with TypeScript and implementing Redux for state management';
      const keywords = (scorer as any).extractKeywords(content);
      
      expect(keywords).toContain('react');
      expect(keywords).toContain('typescript');
      expect(keywords).toContain('redux');
      expect(keywords).toContain('implementing');
    });

    it('should filter out common words', () => {
      const content = 'The quick brown fox jumps over the lazy dog';
      const keywords = (scorer as any).extractKeywords(content);
      
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('over');
      expect(keywords).toContain('quick');
      expect(keywords).toContain('brown');
    });

    it('should handle empty content', () => {
      const keywords = (scorer as any).extractKeywords('');
      expect(keywords).toEqual([]);
    });

    it('should lowercase all keywords', () => {
      const content = 'REACT TypeScript Node.js';
      const keywords = (scorer as any).extractKeywords(content);
      
      expect(keywords).toContain('react');
      expect(keywords).toContain('typescript');
      expect(keywords).toContain('node.js');
    });

    it('should handle special characters', () => {
      const content = 'node.js @typescript #react $jquery';
      const keywords = (scorer as any).extractKeywords(content);
      
      expect(keywords.length).toBeGreaterThan(0);
    });
  });
});