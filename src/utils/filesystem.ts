/**
 * Filesystem utilities
 */

import fs from "fs/promises";
import path from "path";

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, which is fine
    if ((error as any).code !== "EEXIST") {
      throw error;
    }
  }
}

/**
 * Check if a file or directory exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Read JSON file
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Write JSON file
 */
export async function writeJsonFile(
  filePath: string,
  data: any,
): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Get all files in directory recursively
 */
export async function getFilesRecursively(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await traverse(dirPath);
  return files;
}

/**
 * Copy file
 */
export async function copyFile(
  source: string,
  destination: string,
): Promise<void> {
  await fs.copyFile(source, destination);
}

/**
 * Delete file or directory
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rmdir(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
  } catch (error) {
    if ((error as any).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Get directory size recursively
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function calculateSize(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await calculateSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  }

  await calculateSize(dirPath);
  return totalSize;
}
