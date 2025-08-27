/**
 * Pattern Analyzer
 * Identifies and analyzes recurring patterns across contexts
 */

import { 
  Pattern, 
  ExtractedContext,
  GetPatternsInput 
} from './types.js';
import { FileStore } from '../storage/file-store.js';
import { Logger } from '../utils/logger.js';

export class PatternAnalyzer {
  private storage: FileStore;
  private logger: Logger;

  constructor(storage?: FileStore) {
    this.storage = storage || new FileStore();
    this.logger = new Logger('PatternAnalyzer');
  }

  /**
   * Get patterns based on input criteria
   */
  async getPatterns(input: GetPatternsInput): Promise<Pattern[]> {
    const {
      type = 'all',
      minFrequency = 2,
      projectPath,
      limit = 10
    } = input;

    this.logger.info(`Getting patterns: type=${type}, minFrequency=${minFrequency}`);

    // Get contexts to analyze
    let contexts: ExtractedContext[];
    
    if (projectPath) {
      contexts = await this.storage.getProjectContexts(projectPath);
    } else {
      contexts = await this.storage.searchAll(() => true);
    }

    // Aggregate patterns across contexts
    const patternMap = new Map<string, Pattern>();
    
    for (const context of contexts) {
      for (const pattern of context.patterns) {
        if (type !== 'all' && pattern.type !== type) {
          continue;
        }

        const key = `${pattern.type}:${pattern.value}`;
        const existing = patternMap.get(key);

        if (existing) {
          // Merge pattern occurrences
          existing.frequency += pattern.frequency;
          existing.lastSeen = pattern.lastSeen > existing.lastSeen 
            ? pattern.lastSeen 
            : existing.lastSeen;
          
          // Merge examples (unique)
          const uniqueExamples = new Set([
            ...existing.examples,
            ...pattern.examples
          ]);
          existing.examples = Array.from(uniqueExamples).slice(0, 10);
        } else {
          patternMap.set(key, { ...pattern });
        }
      }
    }

    // Filter by minimum frequency and sort
    const patterns = Array.from(patternMap.values())
      .filter(p => p.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);

    this.logger.info(`Found ${patterns.length} patterns`);
    
    return patterns;
  }

  /**
   * Analyze patterns for a specific project
   */
  async analyzeProject(projectPath: string): Promise<{
    patterns: Pattern[];
    insights: PatternInsight[];
    recommendations: string[];
  }> {
    const contexts = await this.storage.getProjectContexts(projectPath);
    
    // Get all patterns
    const patterns = await this.getPatterns({
      type: 'all',
      minFrequency: 2,
      projectPath
    });

    // Generate insights
    const insights = this.generateInsights(patterns, contexts);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns, insights);

    return {
      patterns,
      insights,
      recommendations
    };
  }

  /**
   * Find similar patterns across projects
   */
  async findSimilarPatterns(pattern: Pattern): Promise<Pattern[]> {
    const allPatterns = await this.getPatterns({
      type: pattern.type,
      minFrequency: 1
    });

    return allPatterns.filter(p => 
      p.id !== pattern.id && 
      this.calculateSimilarity(pattern, p) > 0.7
    );
  }

  /**
   * Get pattern evolution over time
   */
  async getPatternEvolution(
    patternValue: string,
    type: Pattern['type']
  ): Promise<{
    occurrences: Array<{
      timestamp: string;
      frequency: number;
      context: string;
    }>;
    trend: 'increasing' | 'stable' | 'decreasing';
  }> {
    const contexts = await this.storage.searchAll(ctx => 
      ctx.patterns.some(p => p.type === type && p.value === patternValue)
    );

    const occurrences = contexts.map(ctx => {
      const pattern = ctx.patterns.find(p => 
        p.type === type && p.value === patternValue
      );
      return {
        timestamp: ctx.timestamp,
        frequency: pattern?.frequency || 0,
        context: ctx.sessionId
      };
    }).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const trend = this.calculateTrend(occurrences.map(o => o.frequency));

    return {
      occurrences,
      trend
    };
  }

  // Private helper methods

  /**
   * Generate insights from patterns
   */
  private generateInsights(
    patterns: Pattern[],
    contexts: ExtractedContext[]
  ): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // Most common error patterns
    const errorPatterns = patterns.filter(p => p.type === 'error-handling');
    if (errorPatterns.length > 0) {
      insights.push({
        type: 'error-pattern',
        title: 'Recurring Errors',
        description: `Found ${errorPatterns.length} recurring error patterns`,
        patterns: errorPatterns.slice(0, 3),
        severity: 'medium'
      });
    }

    // Frequently modified files
    const filePatterns = new Map<string, number>();
    for (const ctx of contexts) {
      for (const file of ctx.metadata.filesModified) {
        filePatterns.set(file, (filePatterns.get(file) || 0) + 1);
      }
    }
    
    const hotspots = Array.from(filePatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (hotspots.length > 0) {
      insights.push({
        type: 'hotspot',
        title: 'Frequently Modified Files',
        description: `These files are modified most often and may need refactoring`,
        data: hotspots,
        severity: 'low'
      });
    }

    // Command patterns
    const commandPatterns = patterns.filter(p => p.type === 'command');
    if (commandPatterns.length > 3) {
      insights.push({
        type: 'workflow',
        title: 'Common Workflows',
        description: `Identified ${commandPatterns.length} recurring command patterns`,
        patterns: commandPatterns.slice(0, 5),
        severity: 'info'
      });
    }

    return insights;
  }

  /**
   * Generate recommendations from patterns and insights
   */
  private generateRecommendations(
    patterns: Pattern[],
    insights: PatternInsight[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for error patterns
    const errorPatterns = patterns.filter(p => p.type === 'error-handling');
    if (errorPatterns.length > 5) {
      recommendations.push(
        'Consider implementing better error handling strategies - multiple recurring errors detected'
      );
    }

    // Check for command patterns that could be automated
    const commandPatterns = patterns.filter(p => 
      p.type === 'command' && p.frequency > 5
    );
    if (commandPatterns.length > 0) {
      recommendations.push(
        `Automate frequent commands: ${commandPatterns.slice(0, 3).map(p => p.value).join(', ')}`
      );
    }

    // Check for code patterns
    const codePatterns = patterns.filter(p => p.type === 'code');
    if (codePatterns.some(p => p.frequency > 10)) {
      recommendations.push(
        'Extract common code patterns into reusable functions or utilities'
      );
    }

    // Check hotspots
    const hotspotInsight = insights.find(i => i.type === 'hotspot');
    if (hotspotInsight && hotspotInsight.data) {
      const topFile = hotspotInsight.data[0];
      if (topFile && topFile[1] > 10) {
        recommendations.push(
          `Consider refactoring ${topFile[0]} - modified ${topFile[1]} times`
        );
      }
    }

    return recommendations;
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculateSimilarity(p1: Pattern, p2: Pattern): number {
    if (p1.type !== p2.type) return 0;

    // Simple string similarity for pattern values
    const value1 = p1.value.toLowerCase();
    const value2 = p2.value.toLowerCase();
    
    if (value1 === value2) return 1;
    
    // Check for substring matches
    if (value1.includes(value2) || value2.includes(value1)) {
      return 0.8;
    }

    // Check for common words
    const words1 = new Set(value1.split(/\W+/));
    const words2 = new Set(value2.split(/\W+/));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate trend from a series of values
   */
  private calculateTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (values.length < 2) return 'stable';

    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (Math.abs(slope) < 0.1) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }
}

// Type for pattern insights
interface PatternInsight {
  type: 'error-pattern' | 'hotspot' | 'workflow' | 'optimization';
  title: string;
  description: string;
  patterns?: Pattern[];
  data?: any;
  severity: 'high' | 'medium' | 'low' | 'info';
}