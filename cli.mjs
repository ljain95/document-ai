#!/usr/bin/env node
// Thin wrapper around `docker compose -f deploy/dev.yaml ...` so the
// invocation is the same regardless of which directory you're in.
//
// Usage:
//   node cli.mjs up     # apply pending migrations against Supabase (flyway migrate)
//   node cli.mjs down   # tear down anything left running for this compose project

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMPOSE_FILE = path.join(HERE, "migrations", "docker.yaml");

function compose(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["compose", "-f", COMPOSE_FILE, ...args], {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`docker terminated by ${signal}`));
      else if (code !== 0) reject(new Error(`docker exited with ${code}`));
      else resolve();
    });
  });
}

const commands = {
  up: () => compose(["run", "--rm", "flyway"]),
  down: () => compose(["down", "--remove-orphans"]),
};

const cmd = process.argv[2];
if (!cmd || !commands[cmd]) {
  console.error(`Usage: node cli.mjs <${Object.keys(commands).join("|")}>`);
  process.exit(1);
}

try {
  await commands[cmd]();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
