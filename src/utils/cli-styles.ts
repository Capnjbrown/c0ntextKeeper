/**
 * CLI Styling Utilities
 * Centralized styling for consistent, beautiful CLI output
 */

import chalk from 'chalk';

/**
 * Semantic color styles for different types of output
 */
export const styles = {
  // Status indicators
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,

  // Semantic elements
  header: chalk.bold.white,
  subheader: chalk.bold.gray,
  highlight: chalk.bold.cyan,
  dim: chalk.gray,
  muted: chalk.gray,
  text: chalk.white,

  // Special formatting
  code: chalk.bgGray.white,
  path: chalk.italic.blue,
  number: chalk.magenta,
  timestamp: chalk.gray,
  tip: chalk.yellow,

  // Command/tool names
  command: chalk.bold.yellow,
  tool: chalk.bold.green,

  // Icons (with fallback for Windows)
  icons: {
    success: process.platform === 'win32' ? '[OK]' : '✅',
    error: process.platform === 'win32' ? '[X]' : '❌',
    warning: process.platform === 'win32' ? '[!]' : '⚠️',
    info: process.platform === 'win32' ? '[i]' : 'ℹ️',
    bullet: process.platform === 'win32' ? '*' : '•',
    arrow: process.platform === 'win32' ? '->' : '→',
    check: process.platform === 'win32' ? '[v]' : '✓',
    folder: process.platform === 'win32' ? '[D]' : '📁',
    file: process.platform === 'win32' ? '[F]' : '📄',
    chart: process.platform === 'win32' ? '[#]' : '📊',
    clipboard: process.platform === 'win32' ? '[C]' : '📋',
    search: process.platform === 'win32' ? '[S]' : '🔍',
    sparkles: process.platform === 'win32' ? '*' : '✨'
  }
};

/**
 * Format an error message with icon
 */
export const formatError = (message: string): string =>
  `${styles.icons.error} ${styles.error(message)}`;

/**
 * Format a success message with icon
 */
export const formatSuccess = (message: string): string =>
  `${styles.icons.success} ${styles.success(message)}`;

/**
 * Format a warning message with icon
 */
export const formatWarning = (message: string): string =>
  `${styles.icons.warning} ${styles.warning(message)}`;

/**
 * Format an info message with icon
 */
export const formatInfo = (message: string): string =>
  `${styles.icons.info} ${styles.info(message)}`;

/**
 * Format a header with divider lines
 */
export const formatHeader = (title: string, width = 50): string => {
  const line = '─'.repeat(width);
  return `\n${styles.dim(line)}\n${styles.header(title)}\n${styles.dim(line)}`;
};

/**
 * Format a subheader
 */
export const formatSubheader = (title: string): string => {
  return `\n${styles.subheader(title)}`;
};

/**
 * Format a key-value pair
 */
export const formatKeyValue = (key: string, value: string | number): string =>
  `${styles.dim(key + ':')} ${styles.info(value.toString())}`;

/**
 * Format a table of key-value pairs with proper alignment
 */
export const formatTable = (rows: Array<[string, string | number]>, indent = 2): string => {
  const maxKeyLength = Math.max(...rows.map(([k]) => k.length));
  const indentStr = ' '.repeat(indent);
  return rows
    .map(([key, value]) =>
      `${indentStr}${styles.dim(key.padEnd(maxKeyLength))} ${styles.info(value.toString())}`)
    .join('\n');
};

/**
 * Format a list with bullets
 */
export const formatList = (items: string[], indent = 2): string => {
  const indentStr = ' '.repeat(indent);
  return items
    .map(item => `${indentStr}${styles.dim(styles.icons.bullet)} ${item}`)
    .join('\n');
};

/**
 * Format a progress indicator
 */
export const formatProgress = (current: number, total: number, label?: string): string => {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  const bar = `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
  const labelStr = label ? ` ${label}` : '';
  return `${styles.dim(bar)} ${styles.number(percentage + '%')}${labelStr}`;
};

/**
 * Format a file path with appropriate icon
 */
export const formatPath = (path: string, isDir = false): string => {
  const icon = isDir ? styles.icons.folder : styles.icons.file;
  return `${icon} ${styles.path(path)}`;
};

/**
 * Format a timestamp in readable format
 */
export const formatTimestamp = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return styles.timestamp(d.toLocaleString());
};

/**
 * Format statistics with proper styling
 */
export const formatStats = (stats: Record<string, number | string>): string => {
  const rows = Object.entries(stats).map(([key, value]) => [
    key.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to readable
    value
  ] as [string, string | number]);
  return formatTable(rows);
};

/**
 * Create a colored box around text
 */
export const formatBox = (content: string, color = chalk.cyan): string => {
  const lines = content.split('\n');
  const maxLength = Math.max(...lines.map(l => l.length));
  const top = `┌${'─'.repeat(maxLength + 2)}┐`;
  const bottom = `└${'─'.repeat(maxLength + 2)}┘`;
  const middle = lines.map(line =>
    `│ ${line.padEnd(maxLength)} │`
  ).join('\n');

  return color(`${top}\n${middle}\n${bottom}`);
};

/**
 * Format command usage examples
 */
export const formatCommand = (command: string, description?: string): string => {
  const cmd = styles.command(`$ ${command}`);
  if (description) {
    return `${cmd}\n  ${styles.dim(description)}`;
  }
  return cmd;
};

/**
 * Spinner characters for loading animations (if needed)
 */
export const spinnerFrames = process.platform === 'win32'
  ? ['-', '\\', '|', '/']
  : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];