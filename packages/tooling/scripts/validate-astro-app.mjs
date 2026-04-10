import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const command = process.platform === "win32" ? "corepack.cmd" : "corepack";

function spawnPnpm(args, options = {}) {
  return spawn(command, ["pnpm", ...args], {
    cwd: workspaceRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    ...options
  });
}

async function runPnpm(args) {
  const child = spawnPnpm(args);
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`corepack pnpm ${args.join(" ")} failed.\n${stdout}\n${stderr}`.trim());
  }
}

async function waitForHtml(url, expectedText) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const body = await response.text();

        if (body.includes(expectedText)) {
          return;
        }
      }
    } catch {
      // The server is still starting. Keep polling.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

async function stopProcess(child) {
  if (child.killed) {
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.on("close", resolve)),
    delay(5000)
  ]);
}

async function verifyLongRunningCommand(args, checks) {
  const child = spawnPnpm(args);
  let stderr = "";

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    for (const check of checks) {
      await waitForHtml(check.url, check.expectedText);
    }
  } catch (error) {
    await stopProcess(child);
    throw new Error(`${error.message}\n${stderr}`.trim());
  }

  await stopProcess(child);
}

async function main() {
  await runPnpm(["run", "check"]);
  await verifyLongRunningCommand(["run", "dev"], [
    {
      url: "http://127.0.0.1:4321/",
      expectedText: "个人知识库"
    },
    {
      url: "http://127.0.0.1:4321/00-Index/",
      expectedText: "入口页"
    }
  ]);
  await runPnpm(["run", "build"]);
  await verifyLongRunningCommand(["run", "preview"], [
    {
      url: "http://127.0.0.1:4322/",
      expectedText: "个人知识库"
    },
    {
      url: "http://127.0.0.1:4322/20-Engineering/Container/Docker%20%E5%A4%9A%E5%B9%B3%E5%8F%B0%E5%8F%91%E5%B8%83%E7%BB%8F%E9%AA%8C/",
      expectedText: "Docker 多平台发布经验"
    }
  ]);

  assert.ok(true);
  console.log("Validated root Astro dev, build, preview, check, and content routes.");
}

await main();
