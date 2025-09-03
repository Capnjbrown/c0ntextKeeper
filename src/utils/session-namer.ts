/**
 * Session Naming Utility
 * Generates meaningful, descriptive names for archive sessions
 */

import {
  ExtractedContext,
  Problem,
  Implementation,
  Decision,
} from "../core/types.js";

/**
 * Generate a descriptive session name from context
 * Format: YYYY-MM-DD_HHMM_MT_description
 */
export function generateSessionName(context: ExtractedContext): string {
  const date = new Date(context.timestamp);

  // Format date and time for Mountain Time
  const year = date.toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
  });
  const month = date.toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    month: "2-digit",
  });
  const day = date.toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    day: "2-digit",
  });
  const time = date
    .toLocaleTimeString("en-US", {
      timeZone: "America/Denver",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");

  // Extract description from context
  const description = extractDescription(context);

  // Debug logging
  if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
    console.log("[SessionNamer] Generating name for context:");
    console.log(`  Problems: ${context.problems.length}`);
    console.log(`  Implementations: ${context.implementations.length}`);
    console.log(`  Decisions: ${context.decisions.length}`);
    console.log(`  Files modified: ${context.metadata.filesModified.length}`);
    console.log(`  Tools used: ${context.metadata.toolsUsed.join(", ")}`);
    console.log(`  Generated description: ${description}`);
  }

  // Build filename: YYYY-MM-DD_HHMM_MT_description.json
  return `${year}-${month}-${day}_${time}_MT_${description}.json`;
}

/**
 * Extract a meaningful description from the context
 * Prioritizes: problems solved > implementations > decisions > generic
 */
function extractDescription(context: ExtractedContext): string {
  let description = "";

  // Try to get description from problems
  if (context.problems.length > 0) {
    description = getDescriptionFromProblems(context.problems);
  }
  // Try implementations
  else if (context.implementations.length > 0) {
    description = getDescriptionFromImplementations(context.implementations);
  }
  // Try decisions
  else if (context.decisions.length > 0) {
    description = getDescriptionFromDecisions(context.decisions);
  }
  // Try files modified
  else if (context.metadata.filesModified.length > 0) {
    description = getDescriptionFromFiles(context.metadata.filesModified);
  }
  // Try tools used
  else if (context.metadata.toolsUsed.length > 0) {
    description = getDescriptionFromTools(context.metadata.toolsUsed);
  }
  // Better fallback: use timestamp if no meaningful content
  else {
    const time = new Date(context.timestamp);
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const seconds = time.getSeconds().toString().padStart(2, "0");
    description = `session-${hours}${minutes}${seconds}`;
  }

  // Sanitize for filesystem
  return sanitizeForFilename(description);
}

/**
 * Generate description from problems
 */
function getDescriptionFromProblems(problems: Problem[]): string {
  // Look for key problem indicators
  const problemText = problems.map((p) => p.question).join(" ");
  const keywords = extractKeywords(problemText);

  if (process.env.C0NTEXTKEEPER_DEBUG === "true") {
    console.log("[SessionNamer] Extracted keywords from problems:", keywords.slice(0, 5));
  }

  if (
    keywords.includes("error") ||
    keywords.includes("bug") ||
    keywords.includes("fix")
  ) {
    const errorType = findErrorType(problems);
    return errorType ? `fix-${errorType}` : "bug-fix";
  }

  if (
    keywords.includes("implement") ||
    keywords.includes("create") ||
    keywords.includes("add")
  ) {
    const feature = findFeatureName(problems);
    return feature ? `implement-${feature}` : "feature-implementation";
  }

  if (keywords.includes("refactor") || keywords.includes("optimize")) {
    return "refactoring";
  }

  // Common English words to exclude (stopwords)
  const stopwords = new Set([
    // Articles
    "the", "a", "an",
    // Conjunctions
    "and", "or", "but", "nor", "for", "yet", "so",
    // Pronouns
    "that", "this", "these", "those", "them", "they", "their", "there",
    "then", "than", "here", "where", "what", "which", "who", "whom",
    "whose", "when", "why", "how", "all", "both", "each", "few", "more",
    "most", "other", "some", "such", "any", "every",
    // Auxiliary verbs
    "will", "would", "could", "should", "shall", "might", "must",
    "can", "may", "have", "has", "had", "having", "do", "does", "did",
    "done", "doing", "been", "being", "was", "were", "are", "is", "am",
    // Prepositions
    "from", "with", "into", "onto", "upon", "about", "above", "across",
    "after", "against", "along", "among", "around", "at", "before",
    "behind", "below", "beneath", "beside", "between", "beyond", "by",
    "down", "during", "except", "for", "inside", "like", "near", "of",
    "off", "on", "over", "since", "through", "throughout", "till", "to",
    "toward", "under", "until", "up", "within", "without",
    // Common words
    "just", "only", "also", "very", "much", "many", "now", "well",
    "even", "back", "still", "too", "quite", "almost", "enough",
    "though", "although", "while", "whether", "either", "neither",
    "because", "since", "unless", "until", "while", "our", "your",
    "its", "my", "his", "her", "use", "used", "using", "make", "made",
    "get", "got", "getting", "give", "gave", "given", "take", "took",
    "taken", "come", "came", "coming", "go", "went", "going", "gone",
  ]);

  // Filter out stopwords and find first significant keyword
  const significant = keywords.find(
    (k) => !stopwords.has(k.toLowerCase()) && k.length > 3
  );

  // If no significant keyword found, return more specific fallback
  if (!significant) {
    // Try to use tags if available
    if (problems[0]?.tags && problems[0].tags.length > 0) {
      return problems[0].tags[0].toLowerCase();
    }
    return "session-work";
  }

  return significant.toLowerCase();
}

/**
 * Generate description from implementations
 */
function getDescriptionFromImplementations(
  implementations: Implementation[],
): string {
  // Look for common implementation patterns
  const allCode = implementations.map((i) => i.description).join(" ");

  if (
    allCode.includes("auth") ||
    allCode.includes("jwt") ||
    allCode.includes("login")
  ) {
    return "authentication-setup";
  }

  if (
    allCode.includes("test") ||
    allCode.includes("describe") ||
    allCode.includes("expect")
  ) {
    return "test-implementation";
  }

  if (
    allCode.includes("api") ||
    allCode.includes("endpoint") ||
    allCode.includes("route")
  ) {
    return "api-development";
  }

  if (
    allCode.includes("database") ||
    allCode.includes("query") ||
    allCode.includes("schema")
  ) {
    return "database-work";
  }

  // Look at file paths
  const paths = implementations.map((i) => i.file);
  if (paths.some((p) => p.includes("component")))
    return "component-development";
  if (paths.some((p) => p.includes("style") || p.includes("css")))
    return "styling-updates";
  if (paths.some((p) => p.includes("config"))) return "configuration-changes";

  return "code-implementation";
}

/**
 * Generate description from decisions
 */
function getDescriptionFromDecisions(decisions: Decision[]): string {
  const allDecisions = decisions
    .map((d) => d.decision)
    .join(" ")
    .toLowerCase();

  if (allDecisions.includes("architecture")) return "architecture-decisions";
  if (allDecisions.includes("design")) return "design-decisions";
  if (allDecisions.includes("library") || allDecisions.includes("package"))
    return "dependency-choices";
  if (allDecisions.includes("structure")) return "project-structuring";

  return "technical-decisions";
}

/**
 * Generate description from modified files
 */
function getDescriptionFromFiles(files: string[]): string {
  if (files.some((f) => f.includes("README"))) return "documentation-update";
  if (files.some((f) => f.includes("package.json"))) return "dependency-update";
  if (files.some((f) => f.includes("test"))) return "test-updates";
  if (files.some((f) => f.includes(".config"))) return "configuration-update";

  // Use the primary file extension
  const extensions = files.map((f) => f.split(".").pop()).filter(Boolean);
  const primaryExt = extensions[0];

  if (primaryExt === "ts" || primaryExt === "js") return "code-changes";
  if (primaryExt === "css" || primaryExt === "scss") return "style-changes";
  if (primaryExt === "json") return "config-changes";

  return "file-modifications";
}

/**
 * Generate description from tools used
 */
function getDescriptionFromTools(tools: string[]): string {
  if (tools.includes("Write") || tools.includes("Edit")) return "code-writing";
  if (tools.includes("Bash")) return "command-execution";
  if (tools.includes("Read")) return "code-review";

  return "development-work";
}

/**
 * Extract keywords from text with improved filtering
 */
function extractKeywords(text: string): string[] {
  // Comprehensive stopwords list
  const stopwords = new Set([
    // Articles
    "the", "a", "an",
    // Conjunctions  
    "and", "or", "but", "nor", "for", "yet", "so",
    // Pronouns
    "that", "this", "these", "those", "them", "they", "their", "there",
    "then", "than", "here", "where", "what", "which", "who", "whom",
    "whose", "when", "why", "how", "all", "both", "each", "few", "more",
    "most", "other", "some", "such", "any", "every", "another", "it", "its",
    // Auxiliary verbs
    "will", "would", "could", "should", "shall", "might", "must", "may",
    "can", "have", "has", "had", "having", "do", "does", "did", "done",
    "doing", "been", "being", "was", "were", "are", "is", "am", "be",
    // Prepositions
    "from", "with", "into", "onto", "upon", "about", "above", "across",
    "after", "against", "along", "among", "around", "at", "before",
    "behind", "below", "beneath", "beside", "between", "beyond", "by",
    "down", "during", "except", "for", "inside", "like", "near", "of",
    "off", "on", "over", "since", "through", "throughout", "till", "to",
    "toward", "under", "until", "up", "within", "without",
    // Common words
    "just", "only", "also", "very", "much", "many", "now", "well", "even",
    "back", "still", "too", "quite", "almost", "enough", "though", "although",
    "while", "whether", "either", "neither", "because", "unless", "our",
    "your", "my", "his", "her", "use", "used", "using", "make", "made",
    "get", "got", "getting", "give", "gave", "given", "take", "took",
    "taken", "come", "came", "coming", "go", "went", "going", "gone",
    "need", "needs", "needed", "want", "wants", "wanted", "find", "found",
    "know", "knows", "known", "think", "thinks", "thought", "look", "looks",
    "looked", "let", "lets", "mean", "means", "meant", "keep", "keeps",
    "kept", "seem", "seems", "seemed", "ask", "asks", "asked", "tell",
    "tells", "told", "show", "shows", "shown", "say", "says", "said",
  ]);

  // Extract words, filter stopwords and short words
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopwords.has(word));

  // Count word frequency
  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  // Prefer longer, more specific words
  const keywords = Object.entries(frequency)
    .sort((a, b) => {
      // First sort by frequency
      if (b[1] !== a[1]) return b[1] - a[1];
      // Then prefer longer words as they're usually more specific
      return b[0].length - a[0].length;
    })
    .slice(0, 10) // Get more candidates
    .map(([word]) => word);

  return keywords;
}

/**
 * Find specific error type from problems
 */
function findErrorType(problems: Problem[]): string {
  const errorPatterns = [
    { pattern: /typescript|type|ts/i, name: "typescript" },
    { pattern: /syntax/i, name: "syntax" },
    { pattern: /import|module/i, name: "import" },
    { pattern: /undefined|null|reference/i, name: "reference" },
    { pattern: /auth|permission|access/i, name: "auth" },
    { pattern: /network|api|fetch/i, name: "network" },
    { pattern: /database|query|sql/i, name: "database" },
  ];

  const allText = problems.map((p) => p.question).join(" ");

  for (const { pattern, name } of errorPatterns) {
    if (pattern.test(allText)) {
      return name;
    }
  }

  return "";
}

/**
 * Find feature name from problems
 */
function findFeatureName(problems: Problem[]): string {
  const featurePatterns = [
    { pattern: /authentication|auth|login/i, name: "authentication" },
    { pattern: /search/i, name: "search" },
    { pattern: /upload|file/i, name: "file-upload" },
    { pattern: /payment|stripe|checkout/i, name: "payment" },
    { pattern: /email|mail/i, name: "email" },
    { pattern: /notification/i, name: "notifications" },
    { pattern: /dashboard/i, name: "dashboard" },
    { pattern: /api/i, name: "api" },
    { pattern: /hook/i, name: "hooks" },
    { pattern: /storage|archive/i, name: "storage" },
  ];

  const allText = problems.map((p) => p.question).join(" ");

  for (const { pattern, name } of featurePatterns) {
    if (pattern.test(allText)) {
      return name;
    }
  }

  return "";
}

/**
 * Sanitize string for use in filename
 */
function sanitizeForFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric with dash
    .replace(/-+/g, "-") // Replace multiple dashes with single
    .replace(/^-|-$/g, "") // Remove leading/trailing dashes
    .slice(0, 50); // Limit length
}

/**
 * Extract project name from project path
 * Examples:
 * /Users/jasonbrown/Projects/c0ntextKeeper -> c0ntextKeeper
 * /home/user/code/my-app -> my-app
 * C:\Users\Name\Projects\MyApp -> MyApp
 */
export function extractProjectName(projectPath: string): string {
  // Handle Windows paths
  const normalizedPath = projectPath.replace(/\\/g, "/");

  // Get the last directory component
  const parts = normalizedPath.split("/").filter(Boolean);
  let projectName = parts[parts.length - 1] || "unknown-project";

  // Check if it's a generic name that needs improvement
  const genericNames = [
    "users",
    "user",
    "home",
    "project",
    "projects",
    "validation",
    "test",
    "tests",
    "temp",
    "tmp",
    "work",
    "workspace",
  ];

  if (genericNames.includes(projectName.toLowerCase())) {
    // Try to get a better name from parent directory
    if (parts.length > 1) {
      const parentName = parts[parts.length - 2];
      // If parent is also generic, combine them
      if (genericNames.includes(parentName.toLowerCase()) && parts.length > 2) {
        projectName = parts[parts.length - 3] + "-" + projectName;
      } else {
        projectName = parentName + "-" + projectName;
      }
    }
  }

  // Further improve by checking for known project patterns
  // If path contains "Projects/something/project", use "something" as the name
  const projectsIndex = parts.findIndex((p) => p.toLowerCase() === "projects");
  if (projectsIndex !== -1 && projectsIndex < parts.length - 1) {
    const realProjectName = parts[projectsIndex + 1];
    if (!genericNames.includes(realProjectName.toLowerCase())) {
      projectName = realProjectName;
    }
  }

  // Sanitize for filesystem but preserve case and some special chars
  return projectName
    .replace(/[<>:"|?*]/g, "-") // Remove invalid filesystem chars
    .replace(/\.+$/, "") // Remove trailing dots
    .slice(0, 100); // Reasonable length limit
}
