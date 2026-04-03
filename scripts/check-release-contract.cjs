#!/usr/bin/env node

const { existsSync, readdirSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { extname, join, resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const packageJsonPath = join(repoRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

function walkFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if ([".js", ".cjs", ".mjs"].includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function ensureFileExists(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

function checkSyntax(filePath) {
  const result = spawnSync(process.execPath, ["--check", filePath], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(`Syntax check failed for ${filePath}\n${result.stderr || result.stdout}`);
  }
}

ensureFileExists(packageJsonPath);
ensureFileExists(join(repoRoot, ".gitignore"));
ensureFileExists(join(repoRoot, "LICENSE"));

if (packageJson.publishConfig?.access !== "public") {
  throw new Error("package.json must declare publishConfig.access=public");
}

if (!packageJson.bin?.["cb-zoo"]) {
  throw new Error("package.json must expose the cb-zoo bin");
}

ensureFileExists(join(repoRoot, packageJson.bin["cb-zoo"]));
ensureFileExists(join(repoRoot, "scripts", "smoke-cli.cjs"));

const roots = ["src", "scripts", "test", "test-support"]
  .map((relativePath) => join(repoRoot, relativePath))
  .filter((path) => existsSync(path));

const filesToCheck = roots.flatMap((path) => walkFiles(path));
for (const filePath of filesToCheck) {
  checkSyntax(filePath);
}

process.stdout.write(`Release contract check passed for ${filesToCheck.length} files.\n`);
