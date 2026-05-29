#!/usr/bin/env node

const userAgent = process.env.npm_config_user_agent || "";

if (userAgent.startsWith("pnpm/")) {
  process.exit(0);
}

const detected = userAgent || "unknown package manager";

console.error("Use pnpm for this repo. npm, yarn, bun, and other package-manager installs are blocked.");
console.error(`Detected: ${detected}`);
console.error("If pnpm is missing on the local workstation, ask the user to install or enable standalone pnpm 11.");
process.exit(1);
