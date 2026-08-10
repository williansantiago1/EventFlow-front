import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.E2E !== "1") {
  console.log(
    "[e2e] Skipped (set E2E=1 to run). See web/e2e/README.md — browsers are optional.",
  );
  process.exit(0);
}

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", ...process.argv.slice(2)],
  {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
