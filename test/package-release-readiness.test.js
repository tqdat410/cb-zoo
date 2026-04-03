import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

test("package metadata exposes the public release contract", () => {
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.engines.node, ">=18");
  assert.equal(packageJson.publishConfig.access, "public");
  assert.equal(packageJson.repository.type, "git");
  assert.match(packageJson.repository.url, /github\.com\/tqdat410\/cb-zoo\.git$/);
  assert.equal(packageJson.homepage, "https://github.com/tqdat410/cb-zoo#readme");
  assert.equal(packageJson.bugs.url, "https://github.com/tqdat410/cb-zoo/issues");
});

test("package scripts define the release verification flow", () => {
  assert.equal(packageJson.scripts.check, "node ./scripts/check-release-contract.cjs");
  assert.equal(packageJson.scripts.smoke, "node ./scripts/smoke-cli.cjs");
  assert.equal(packageJson.scripts["release:verify"], "npm run check && npm test && npm run smoke && npm run test:coverage");
  assert.equal(packageJson.scripts["release:check"], "npm run release:verify && npm pack --dry-run");
  assert.equal(packageJson.scripts.prepublishOnly, "npm run release:verify");
});

test("release support files exist in the repository", () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  assert.equal(packageJson.bin["cb-zoo"], "./src/cli.js");
  assert.equal(existsSync(join(repoRoot, ".gitignore")), true);
  assert.equal(existsSync(join(repoRoot, "LICENSE")), true);
  assert.equal(existsSync(join(repoRoot, "package-lock.json")), true);
  assert.equal(existsSync(join(repoRoot, packageJson.bin["cb-zoo"])), true);
  assert.equal(existsSync(join(repoRoot, "scripts", "check-release-contract.cjs")), true);
  assert.equal(existsSync(join(repoRoot, "scripts", "smoke-cli.cjs")), true);
});

test(".gitignore blocks local auth and Claude state files", () => {
  assert.match(gitignore, /^\.npmrc$/m);
  assert.match(gitignore, /^\.claude\.json$/m);
});
