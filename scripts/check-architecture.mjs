import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoots = ["apps", "packages", "tools"];
const productionPageRules = [
  {
    path: "pages/game.html",
    forbidden: ["page-assets/js/admin-assets/admin-slice-demo.js"],
    message: "game page must not eagerly load the debug/admin gameplay slice bundle"
  }
];

const rules = [
  {
    scope: "apps/client/src",
    forbidden: ["@empire/game-core", "apps/server", "apps/admin", "@empire/game-config"]
  },
  {
    scope: "apps/admin/src",
    forbidden: ["@empire/game-core", "apps/client"]
  },
  {
    scope: "apps/server/src/transport",
    forbidden: ["@empire/game-core"]
  },
  {
    scope: "apps/server/src",
    forbidden: ["localStorage", "window", "document"]
  },
  {
    scope: "packages/game-core/src",
    forbidden: ["apps/server", "apps/client", "apps/admin", "react", "document", "window", "localStorage"]
  }
];
const deprecatedImportRules = [
  {
    pattern: /from\s+["']@empire\/shared(?:["']|\/)/,
    message: "use @empire/shared-types instead of deprecated @empire/shared"
  },
  {
    pattern: /from\s+["']@empire\/debug-tools(?:["']|\/)/,
    message: "use tools/debug or tools/seed instead of deprecated @empire/debug-tools"
  }
];

const violations = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      continue;
    }

    const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");
    const content = fs.readFileSync(fullPath, "utf8");

    for (const rule of rules) {
      if (!relativePath.startsWith(rule.scope)) {
        continue;
      }

      for (const forbidden of rule.forbidden) {
        if (content.includes(forbidden)) {
          violations.push(`${relativePath} contains forbidden dependency/pattern "${forbidden}"`);
        }
      }
    }

    for (const rule of deprecatedImportRules) {
      if (rule.pattern.test(content)) {
        violations.push(`${relativePath} imports a deprecated package (${rule.message})`);
      }
    }
  }
};

for (const sourceRoot of sourceRoots) {
  const fullPath = path.join(root, sourceRoot);
  if (fs.existsSync(fullPath)) {
    walk(fullPath);
  }
}

for (const rule of productionPageRules) {
  const fullPath = path.join(root, rule.path);

  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8");

  for (const forbidden of rule.forbidden) {
    if (content.includes(forbidden)) {
      violations.push(`${rule.path} contains forbidden production page pattern "${forbidden}" (${rule.message})`);
    }
  }
}

if (violations.length > 0) {
  console.error("Architecture violations detected:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Architecture checks passed.");
