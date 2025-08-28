/**
 * Context Extraction Engine
 * Analyzes transcripts to extract valuable context
 */

import { 
  TranscriptEntry, 
  ExtractedContext, 
  Problem, 
  Solution,
  Implementation, 
  Decision, 
  Pattern,
  CodeChange
} from './types.js';
import { RelevanceScorer } from './scorer.js';
import { SecurityFilter } from '../utils/security-filter.js';
import crypto from 'crypto';

export class ContextExtractor {
  private scorer: RelevanceScorer;
  private securityFilter: SecurityFilter;
  private relevanceThreshold: number;
  private maxContextItems: number;
  private enableSecurityFilter: boolean;

  constructor(
    relevanceThreshold = 0.5,
    maxContextItems = 50,
    enableSecurityFilter = true
  ) {
    this.scorer = new RelevanceScorer();
    this.securityFilter = new SecurityFilter();
    this.relevanceThreshold = relevanceThreshold;
    this.maxContextItems = maxContextItems;
    this.enableSecurityFilter = enableSecurityFilter;
  }

  /**
   * Extract context from transcript entries
   */
  extract(entries: TranscriptEntry[]): ExtractedContext {
    if (!entries || entries.length === 0) {
      throw new Error('No transcript entries provided');
    }

    const startTime = new Date(entries[0].timestamp).getTime();
    const endTime = new Date(entries[entries.length - 1].timestamp).getTime();

    let context: ExtractedContext = {
      sessionId: entries[0]?.sessionId || this.generateSessionId(),
      projectPath: this.extractProjectPath(entries),
      timestamp: new Date().toISOString(),
      extractedAt: 'preCompact',
      problems: [],
      implementations: [],
      decisions: [],
      patterns: [],
      metadata: {
        entryCount: entries.length,
        duration: endTime - startTime,
        toolsUsed: [],
        filesModified: [],
        relevanceScore: 0,
        extractionVersion: '0.1.0'
      }
    };

    // Extract different types of context
    context.problems = this.extractProblems(entries);
    context.implementations = this.extractImplementations(entries);
    context.decisions = this.extractDecisions(entries);
    context.patterns = this.identifyPatterns(entries);
    
    // Update metadata
    context.metadata.toolsUsed = this.getUniqueTools(entries);
    context.metadata.filesModified = this.getModifiedFiles(entries);
    context.metadata.relevanceScore = this.calculateOverallRelevance(context);

    // Limit items to maxContextItems
    context.problems = context.problems.slice(0, this.maxContextItems);
    context.implementations = context.implementations.slice(0, this.maxContextItems);
    context.decisions = context.decisions.slice(0, this.maxContextItems);
    context.patterns = context.patterns.slice(0, this.maxContextItems);

    // Apply security filtering if enabled
    if (this.enableSecurityFilter) {
      context = this.securityFilter.filterObject(context);
      
      // Add security stats to metadata
      const securityStats = this.securityFilter.getStats();
      (context.metadata as any).securityFiltered = true;
      (context.metadata as any).redactedCount = securityStats.redactedCount;
    }

    return context;
  }

  /**
   * Extract problems and their solutions from transcript
   */
  private extractProblems(entries: TranscriptEntry[]): Problem[] {
    const problems: Problem[] = [];
    let currentProblem: Problem | null = null;
    let potentialSolution: Solution | null = null;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const relevance = this.scorer.scoreEntry(entry);

      if (relevance < this.relevanceThreshold) continue;

      // Detect problem indicators in user messages
      if (entry.type === 'user' && entry.message?.content) {
        const content = entry.message.content;
        if (this.isProblemIndicator(content)) {
          currentProblem = {
            id: this.generateId(),
            question: content.slice(0, 500),
            timestamp: entry.timestamp,
            tags: this.extractTags(content),
            relevance: relevance
          };
        }
      }

      // Look for tool usage that might be solving the problem
      if (currentProblem && entry.type === 'tool_use') {
        const toolName = entry.toolUse?.name || '';
        if (['Write', 'Edit', 'MultiEdit', 'Bash'].includes(toolName)) {
          const file = entry.toolUse?.input?.file_path || 
                      entry.toolUse?.input?.path || 
                      'unknown';
          
          potentialSolution = {
            approach: `Used ${toolName} tool`,
            files: [file],
            successful: true
          };
        }
      }

      // Check tool results for success/failure
      if (potentialSolution && entry.toolResult) {
        if (entry.toolResult.error) {
          potentialSolution.successful = false;
        }
      }

      // Look for assistant explanations as solutions
      if (currentProblem && entry.type === 'assistant' && entry.message?.content) {
        const content = entry.message.content;
        
        // If we have a potential solution from tool use, enhance it
        if (potentialSolution) {
          potentialSolution.approach = content.slice(0, 200);
          currentProblem.solution = potentialSolution;
        } else if (this.isSolutionIndicator(content)) {
          currentProblem.solution = {
            approach: content.slice(0, 500),
            files: [],
            successful: true
          };
        }

        if (currentProblem.solution) {
          problems.push(currentProblem);
          currentProblem = null;
          potentialSolution = null;
        }
      }
    }

    // Add unsolved problems
    if (currentProblem) {
      problems.push(currentProblem);
    }

    return problems.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Extract code implementations
   */
  private extractImplementations(entries: TranscriptEntry[]): Implementation[] {
    const implementations: Implementation[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (entry.type === 'tool_use' && entry.toolUse) {
        const toolName = entry.toolUse.name;
        
        // Focus on code-modifying tools
        if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(toolName)) {
          const file = entry.toolUse.input?.file_path || 
                      entry.toolUse.input?.path || 
                      entry.toolUse.input?.notebook_path ||
                      'unknown';
          
          // Look for description in previous assistant message
          let description = '';
          if (i > 0 && entries[i - 1].type === 'assistant') {
            const prevContent = entries[i - 1].message?.content || '';
            description = prevContent.slice(0, 200);
          }

          const implementation: Implementation = {
            id: this.generateId(),
            tool: toolName,
            file: file,
            description: description,
            timestamp: entry.timestamp,
            relevance: this.scorer.scoreEntry(entry),
            changes: this.extractCodeChanges(entry)
          };

          implementations.push(implementation);
        }
      }
    }

    return implementations.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Extract architectural decisions
   */
  private extractDecisions(entries: TranscriptEntry[]): Decision[] {
    const decisions: Decision[] = [];
    const decisionPatterns = [
      /we should (\w+.*)/gi,
      /better to (\w+.*)/gi,
      /i recommend (\w+.*)/gi,
      /the approach is to (\w+.*)/gi,
      /decided to (\w+.*)/gi,
      /going with (\w+.*)/gi,
      /choosing (\w+.*)/gi
    ];

    for (const entry of entries) {
      if (entry.type === 'assistant' && entry.message?.content) {
        const content = entry.message.content;

        for (const pattern of decisionPatterns) {
          const matches = content.matchAll(pattern);
          for (const match of matches) {
            const contextStart = Math.max(0, match.index! - 100);
            const contextEnd = Math.min(content.length, match.index! + match[0].length + 100);
            
            decisions.push({
              id: this.generateId(),
              decision: match[0],
              context: content.slice(contextStart, contextEnd),
              rationale: this.extractRationale(content, match.index!),
              timestamp: entry.timestamp,
              impact: this.assessImpact(match[0]),
              tags: this.extractTags(match[0])
            });
          }
        }
      }
    }

    return decisions;
  }

  /**
   * Identify recurring patterns
   */
  private identifyPatterns(entries: TranscriptEntry[]): Pattern[] {
    const patternMap = new Map<string, Pattern>();

    for (const entry of entries) {
      // Command patterns
      if (entry.type === 'tool_use' && entry.toolUse?.name === 'Bash') {
        const command = entry.toolUse.input?.command;
        if (command && !this.isTrivialCommand(command)) {
          const key = `cmd:${this.normalizeCommand(command)}`;
          this.updatePattern(patternMap, key, 'command', command, entry.timestamp);
        }
      }

      // Code patterns (looking for repeated operations)
      if (entry.type === 'tool_use' && ['Write', 'Edit'].includes(entry.toolUse?.name || '')) {
        const operation = `${entry.toolUse?.name}:${entry.toolUse?.input?.file_path}`;
        this.updatePattern(patternMap, operation, 'code', operation, entry.timestamp);
      }

      // Error handling patterns
      if (entry.toolResult?.error) {
        const errorType = this.classifyError(entry.toolResult.error);
        if (errorType) {
          this.updatePattern(patternMap, `error:${errorType}`, 'error-handling', errorType, entry.timestamp);
        }
      }
    }

    return Array.from(patternMap.values())
      .filter(p => p.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency);
  }

  // Helper methods

  private isProblemIndicator(content: string): boolean {
    const indicators = [
      'error', 'issue', 'problem', 'fix', 'debug', 
      'why', 'how to', 'not working', 'failed', 'wrong',
      'help', 'stuck', 'confused', 'unclear'
    ];
    const lowerContent = content.toLowerCase();
    return indicators.some(ind => lowerContent.includes(ind));
  }

  private isSolutionIndicator(content: string): boolean {
    const indicators = [
      'here\'s how', 'the solution', 'to fix this',
      'this works', 'resolved', 'solved', 'the answer',
      'you can', 'let me'
    ];
    const lowerContent = content.toLowerCase();
    return indicators.some(ind => lowerContent.includes(ind));
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const techPatterns = /\b(react|typescript|javascript|node|python|api|database|css|html|json|yaml|docker|kubernetes|aws|git)\b/gi;
    const matches = content.match(techPatterns);
    if (matches) {
      tags.push(...matches.map(m => m.toLowerCase()));
    }
    return [...new Set(tags)];
  }

  private extractProjectPath(entries: TranscriptEntry[]): string {
    for (const entry of entries) {
      if (entry.cwd) return entry.cwd;
    }
    return 'unknown';
  }

  private getUniqueTools(entries: TranscriptEntry[]): string[] {
    const tools = new Set<string>();
    for (const entry of entries) {
      if (entry.type === 'tool_use' && entry.toolUse?.name) {
        tools.add(entry.toolUse.name);
      }
    }
    return Array.from(tools);
  }

  private getModifiedFiles(entries: TranscriptEntry[]): string[] {
    const files = new Set<string>();
    for (const entry of entries) {
      if (entry.type === 'tool_use' && entry.toolUse) {
        const file = entry.toolUse.input?.file_path || 
                    entry.toolUse.input?.path ||
                    entry.toolUse.input?.notebook_path;
        if (file && ['Write', 'Edit', 'MultiEdit'].includes(entry.toolUse.name)) {
          files.add(file);
        }
      }
    }
    return Array.from(files);
  }

  private extractCodeChanges(entry: TranscriptEntry): CodeChange[] | undefined {
    if (!entry.toolUse?.input) return undefined;

    const changes: CodeChange[] = [];
    const input = entry.toolUse.input;

    if (entry.toolUse.name === 'Edit' || entry.toolUse.name === 'MultiEdit') {
      // For edits, we can track what was changed
      changes.push({
        type: 'modification',
        lineStart: 0,
        lineEnd: 0,
        content: input.new_string || input.new_content || ''
      });
    } else if (entry.toolUse.name === 'Write') {
      changes.push({
        type: 'addition',
        lineStart: 0,
        lineEnd: 0,
        content: input.content || ''
      });
    }

    return changes.length > 0 ? changes : undefined;
  }

  private extractRationale(content: string, position: number): string {
    const reasonIndicators = ['because', 'since', 'as', 'due to', 'for'];
    const contextWindow = 200;
    const searchArea = content.slice(position, position + contextWindow);
    
    for (const indicator of reasonIndicators) {
      const idx = searchArea.toLowerCase().indexOf(indicator);
      if (idx !== -1) {
        return searchArea.slice(idx, Math.min(idx + 100, searchArea.length));
      }
    }
    
    return '';
  }

  private assessImpact(decision: string): 'high' | 'medium' | 'low' {
    const highImpact = ['architecture', 'database', 'api', 'security', 'framework'];
    const mediumImpact = ['refactor', 'optimize', 'structure', 'design'];
    
    const lowerDecision = decision.toLowerCase();
    
    if (highImpact.some(term => lowerDecision.includes(term))) return 'high';
    if (mediumImpact.some(term => lowerDecision.includes(term))) return 'medium';
    return 'low';
  }

  private normalizeCommand(command: string): string {
    // Remove specific paths and parameters to identify pattern
    return command
      .replace(/\/[^\s]+/g, '<path>')
      .replace(/\d+/g, '<number>')
      .slice(0, 50);
  }

  private isTrivialCommand(command: string): boolean {
    const trivialCommands = ['ls', 'pwd', 'cd', 'echo', 'cat'];
    const firstWord = command.split(' ')[0];
    return trivialCommands.includes(firstWord);
  }

  private classifyError(error: string): string | null {
    if (error.includes('permission')) return 'permission';
    if (error.includes('not found')) return 'not-found';
    if (error.includes('syntax')) return 'syntax';
    if (error.includes('type')) return 'type-error';
    if (error.includes('undefined') || error.includes('null')) return 'null-reference';
    return null;
  }

  private updatePattern(
    patternMap: Map<string, Pattern>,
    key: string,
    type: Pattern['type'],
    value: string,
    timestamp: string
  ): void {
    const existing = patternMap.get(key);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = timestamp;
      if (!existing.examples.includes(value)) {
        existing.examples.push(value);
      }
    } else {
      patternMap.set(key, {
        id: this.generateId(),
        type,
        value: key,
        frequency: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        examples: [value]
      });
    }
  }

  private calculateOverallRelevance(context: ExtractedContext): number {
    const weights = {
      problems: 0.3,
      implementations: 0.3,
      decisions: 0.2,
      patterns: 0.2
    };

    let score = 0;
    score += Math.min(context.problems.length / 10, 1) * weights.problems;
    score += Math.min(context.implementations.length / 10, 1) * weights.implementations;
    score += Math.min(context.decisions.length / 5, 1) * weights.decisions;
    score += Math.min(context.patterns.length / 5, 1) * weights.patterns;

    return Math.min(score, 1);
  }

  private generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
}