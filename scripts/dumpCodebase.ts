/**
 * IntelliGrid AI - Automated Codebase Dump Generator
 *
 * Generates a clean, consolidated single-file markdown representation of the entire
 * codebase for automated audits, compliance verification, and line-by-line model reviews.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.resolve(ROOT_DIR, "codebase_dump.md");

const INCLUDE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".md",
  ".yml",
  ".yaml",
]);

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".output",
  ".nitro",
  ".tanstack",
  ".wrangler",
  "dist",
  "build",
  "coverage",
]);

const EXCLUDE_FILES = new Set(["package-lock.json", "bun.lock", "codebase_dump.md"]);

function getFilesRecursively(dir: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of list) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        results.push(...getFilesRecursively(path.join(dir, entry.name)));
      }
    } else {
      const ext = path.extname(entry.name);
      if (INCLUDE_EXTENSIONS.has(ext) && !EXCLUDE_FILES.has(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}

function main() {
  console.log(`Starting codebase dump from: ${ROOT_DIR}`);
  const files = getFilesRecursively(ROOT_DIR);
  files.sort();

  let dumpContent = `# IntelliGrid AI — Complete Architecture & Source Code Dump\n`;
  dumpContent += `Generated At: ${new Date().toISOString()}\n`;
  dumpContent += `Total Files Scanned: ${files.length}\n\n`;

  dumpContent += `## Table of Contents\n\n`;
  for (const file of files) {
    const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
    dumpContent += `- [${relPath}](#${relPath.replace(/[^a-zA-Z0-9_-]/g, "-")})\n`;
  }
  dumpContent += `\n---\n\n`;

  for (const file of files) {
    const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
    const ext = path.extname(file).replace(".", "") || "text";
    const lang = ext === "ts" || ext === "tsx" ? "typescript" : ext === "json" ? "json" : ext;

    console.log(`Adding ${relPath}...`);
    const content = fs.readFileSync(file, "utf8");

    dumpContent += `### ${relPath}\n\n`;
    dumpContent += `\`\`\`${lang}\n`;
    dumpContent += content;
    if (!content.endsWith("\n")) dumpContent += "\n";
    dumpContent += `\`\`\`\n\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, dumpContent, "utf8");
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\nCodebase dump completed successfully!`);
  console.log(`File: ${OUTPUT_FILE}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

main();
