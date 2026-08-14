import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = process.argv[2];
const wranglerArgs = process.argv.slice(3);

const workspacePaths = {
  frontend: path.join(repoRoot, "apps", "frontend"),
  backend: path.join(repoRoot, "apps", "backend"),
};

if (!workspace || !workspacePaths[workspace]) {
  console.error("Usage: npm run cf:frontend -- <wrangler args>");
  console.error("   or: npm run cf:backend -- <wrangler args>");
  process.exit(1);
}

if (wranglerArgs.length === 0) {
  console.error("Missing Wrangler arguments. Example: npm run cf:frontend -- whoami");
  process.exit(1);
}

const xdgConfigHome = path.join(repoRoot, ".wrangler-agent", "config");
const npmCache = path.join(repoRoot, ".wrangler-agent", "npm-cache");
const workspaceRoot = workspacePaths[workspace];
const wranglerBin = path.join(workspaceRoot, "node_modules", "wrangler", "bin", "wrangler.js");

if (!existsSync(wranglerBin)) {
  console.error(`Wrangler is not installed for ${workspace}: ${wranglerBin}`);
  process.exit(1);
}

mkdirSync(xdgConfigHome, { recursive: true });
mkdirSync(npmCache, { recursive: true });

const child = spawn(process.execPath, [wranglerBin, ...wranglerArgs], {
  cwd: workspaceRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    XDG_CONFIG_HOME: xdgConfigHome,
    npm_config_cache: npmCache,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});
