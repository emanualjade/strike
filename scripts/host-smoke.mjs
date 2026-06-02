#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const targetCli = {
  claude: "claude",
  codex: "codex",
};
const directoryEnvKeys = new Set([
  "CLAUDE_CODE_PLUGIN_CACHE_DIR",
  "CODEX_HOME",
]);

const packageJson = readJson(path.join(repoRoot, "package.json"));
const packageVersion = packageJson.version;
const skillNames = readdirSync(path.join(repoRoot, "plugins/strike/skills"))
  .filter((name) => existsSync(path.join(repoRoot, "plugins/strike/skills", name, "SKILL.md")))
  .sort();

function parseArgs(argv) {
  const options = {
    host: "all",
    skipMissing: false,
    strictMissing: false,
    artifactsDir: null,
    codexSource: null,
    codexRef: null,
    codexSparse: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--host") {
      options.host = requiredValue(argv, ++index, arg);
    } else if (arg.startsWith("--host=")) {
      options.host = arg.slice("--host=".length);
    } else if (arg === "--skip-missing") {
      options.skipMissing = true;
    } else if (arg === "--strict-missing") {
      options.strictMissing = true;
    } else if (arg === "--artifacts-dir") {
      options.artifactsDir = requiredValue(argv, ++index, arg);
    } else if (arg.startsWith("--artifacts-dir=")) {
      options.artifactsDir = arg.slice("--artifacts-dir=".length);
    } else if (arg === "--codex-source") {
      options.codexSource = requiredValue(argv, ++index, arg);
    } else if (arg.startsWith("--codex-source=")) {
      options.codexSource = arg.slice("--codex-source=".length);
    } else if (arg === "--codex-ref") {
      options.codexRef = requiredValue(argv, ++index, arg);
    } else if (arg.startsWith("--codex-ref=")) {
      options.codexRef = arg.slice("--codex-ref=".length);
    } else if (arg === "--codex-sparse") {
      options.codexSparse.push(requiredValue(argv, ++index, arg));
    } else if (arg.startsWith("--codex-sparse=")) {
      options.codexSparse.push(arg.slice("--codex-sparse=".length));
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["all", ...Object.keys(targetCli)].includes(options.host)) {
    throw new Error(`Unsupported --host value: ${options.host}`);
  }
  if (options.skipMissing && options.strictMissing) {
    throw new Error("Use only one of --skip-missing or --strict-missing.");
  }
  return options;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function printHelp() {
  console.log(`Usage: node scripts/host-smoke.mjs [options]

Options:
  --host claude|codex|all
  --skip-missing
  --strict-missing
  --artifacts-dir <dir>
  --codex-source <source>
  --codex-ref <ref>
  --codex-sparse <path>        Repeatable.

Local workstation runs never install target CLIs. They only use binaries that
already exist on PATH. GitHub workflows install target CLIs before calling this
script on disposable runners.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const hosts = options.host === "all" ? Object.keys(targetCli) : [options.host];
  const results = [];
  let attempted = 0;

  for (const host of hosts) {
    const binary = await resolveBinary(targetCli[host]);
    if (!binary) {
      const message = `${targetCli[host]} CLI not found locally; no install attempted. Install it manually or run the GitHub workflow.`;
      if (options.skipMissing) {
        console.log(`[${host}] ${message} Skipped.`);
        results.push({ host, status: "skipped", reason: "missing-cli" });
        continue;
      }
      throw new Error(message);
    }

    attempted += 1;
    if (host === "claude") {
      results.push(await runClaude(binary, options));
    } else if (host === "codex") {
      results.push(await runCodex(binary, options));
    }
  }

  if (attempted === 0) {
    console.log("No target CLI checks were run. Missing target CLIs were skipped without any local install attempt.");
  }

  console.log(JSON.stringify({ packageVersion, results }, null, 2));
}

async function resolveBinary(command) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];

  for (const entry of pathEntries) {
    for (const extension of extensions) {
      const candidate = path.join(entry, `${command}${extension}`);
      try {
        await access(candidate, constants.X_OK);
        return candidate;
      } catch {
        // Continue searching PATH.
      }
    }
  }
  return null;
}

async function runClaude(binary, options) {
  const ctx = createContext("claude", binary, options, {
    CLAUDE_CODE_PLUGIN_CACHE_DIR: "claude-plugins",
    DISABLE_AUTOUPDATER: "1",
    CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL: "1",
    CLAUDE_CODE_PLUGIN_PREFER_HTTPS: "1",
    CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS: "300000",
  });

  let installed = false;
  let marketplaceAdded = false;
  try {
    run(ctx, "version", ["--version"]);
    run(ctx, "validate-marketplace", ["plugin", "validate", "."]);
    run(ctx, "validate-plugin", ["plugin", "validate", "./plugins/strike"]);
    run(ctx, "marketplace-add", ["plugin", "marketplace", "add", repoRoot, "--scope", "user"]);
    marketplaceAdded = true;
    run(ctx, "marketplace-list", ["plugin", "marketplace", "list", "--json"]);
    run(ctx, "plugin-install", ["plugin", "install", "strike@strike", "--scope", "user"]);
    installed = true;

    const firstList = run(ctx, "plugin-list-after-install", ["plugin", "list", "--json"]);
    const installPath = assertClaudeList(firstList.stdout);
    assertPluginRoot(installPath, ".claude-plugin/plugin.json");
    assertInstalledRuntime(installPath, ctx, "claude-after-install");

    run(ctx, "marketplace-update", ["plugin", "marketplace", "update", "strike"]);
    run(ctx, "plugin-update", ["plugin", "update", "strike@strike", "--scope", "user"]);
    const secondList = run(ctx, "plugin-list-after-update", ["plugin", "list", "--json"]);
    const updatedPath = assertClaudeList(secondList.stdout);
    assertPluginRoot(updatedPath, ".claude-plugin/plugin.json");
    assertInstalledRuntime(updatedPath, ctx, "claude-after-update");

    return finishContext(ctx, "passed");
  } finally {
    if (installed) {
      safeRun(ctx, "plugin-uninstall", ["plugin", "uninstall", "strike@strike", "--scope", "user"]);
    }
    if (marketplaceAdded) {
      safeRun(ctx, "marketplace-remove", ["plugin", "marketplace", "remove", "strike"]);
    }
    cleanupContext(ctx);
  }
}

async function runCodex(binary, options) {
  const ctx = createContext("codex", binary, options, {
    CODEX_HOME: "codex-home",
  });
  const gitBackedSource = Boolean(options.codexSource);
  const source = options.codexSource || repoRoot;
  const addArgs = ["plugin", "marketplace", "add", source];
  if (options.codexRef) {
    addArgs.push("--ref", options.codexRef);
  }
  for (const sparsePath of options.codexSparse) {
    addArgs.push("--sparse", sparsePath);
  }

  let marketplaceAdded = false;
  let pluginInstalled = false;
  try {
    run(ctx, "version", ["--version"]);
    run(ctx, "marketplace-add", addArgs);
    marketplaceAdded = true;
    assertCodexConfig(ctx);
    run(ctx, "plugin-list", ["plugin", "list", "--marketplace", "strike"]);

    if (gitBackedSource) {
      run(ctx, "marketplace-upgrade", ["plugin", "marketplace", "upgrade", "strike"]);
    } else {
      console.log("[codex] Local workstation source is not Git-backed; upgrade intentionally skipped.");
    }

    const pluginAdd = run(ctx, "plugin-add", ["plugin", "add", "strike@strike"]);
    pluginInstalled = true;
    const installPath = assertCodexAdd(pluginAdd.stdout);
    assertPluginRoot(installPath, ".codex-plugin/plugin.json");
    assertInstalledRuntime(installPath, ctx, "codex-after-add");

    return finishContext(ctx, "passed");
  } finally {
    if (pluginInstalled) {
      safeRun(ctx, "plugin-remove", ["plugin", "remove", "strike@strike"]);
    }
    if (marketplaceAdded) {
      safeRun(ctx, "marketplace-remove", ["plugin", "marketplace", "remove", "strike"]);
    }
    cleanupContext(ctx);
  }
}

function createContext(host, binary, options, extraEnv = {}) {
  const tempRoot = mkdtempSync(path.join(tmpdir(), `strike-host-smoke-${host}-`));
  const paths = {
    tempRoot,
    home: path.join(tempRoot, "home"),
    cache: path.join(tempRoot, "cache"),
    config: path.join(tempRoot, "config"),
  };
  for (const dir of Object.values(paths)) {
    mkdirSync(dir, { recursive: true });
  }

  const artifactsDir = options.artifactsDir
    ? path.resolve(repoRoot, options.artifactsDir)
    : path.join(tempRoot, "artifacts");
  mkdirSync(artifactsDir, { recursive: true });

  const env = {
    ...process.env,
    HOME: paths.home,
    XDG_CACHE_HOME: paths.cache,
    XDG_CONFIG_HOME: paths.config,
    NO_COLOR: "1",
  };
  for (const [key, value] of Object.entries(extraEnv)) {
    env[key] = directoryEnvKeys.has(key) && !path.isAbsolute(value)
      ? path.join(tempRoot, value)
      : value;
    if (directoryEnvKeys.has(key)) {
      mkdirSync(env[key], { recursive: true });
    }
  }

  return {
    host,
    binary,
    options,
    paths,
    artifactsDir,
    env,
    commandIndex: 0,
    commands: [],
    keepTemp: Boolean(options.artifactsDir || process.env.STRIKE_KEEP_HOST_SMOKE === "1"),
  };
}

function run(ctx, label, args, runOptions = {}) {
  return runCommand(ctx, label, ctx.binary, args, { cwd: repoRoot, ...runOptions });
}

function runCommand(ctx, label, binary, args, runOptions = {}) {
  ctx.commandIndex += 1;
  const logName = `${String(ctx.commandIndex).padStart(2, "0")}-${slug(label)}.log`;
  const logPath = path.join(ctx.artifactsDir, logName);
  const cwd = runOptions.cwd || repoRoot;
  const env = { ...ctx.env, ...(runOptions.env || {}) };
  const commandText = [binary, ...args].map(shellQuote).join(" ");

  console.log(`\n[${ctx.host}] ${commandText}`);
  const result = spawnSync(binary, args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }

  const exitCode = typeof result.status === "number" ? result.status : 1;
  const log = [
    `host: ${ctx.host}`,
    `cwd: ${cwd}`,
    `command: ${commandText}`,
    `exitCode: ${exitCode}`,
    "",
    "stdout:",
    stdout,
    "",
    "stderr:",
    stderr,
  ].join("\n");
  writeFileSync(logPath, log);
  ctx.commands.push({ label, exitCode, logPath });

  if (result.error) {
    throw new Error(`${ctx.host} ${label} failed to start: ${result.error.message}`);
  }
  if (exitCode !== 0 && !runOptions.allowFailure) {
    throw new Error(`${ctx.host} ${label} failed with exit code ${exitCode}. See ${logPath}`);
  }
  return { stdout, stderr, exitCode, logPath };
}

function safeRun(ctx, label, args) {
  try {
    run(ctx, label, args);
  } catch (error) {
    console.warn(`[${ctx.host}] cleanup command failed: ${error.message}`);
  }
}

function assertClaudeList(stdout) {
  const plugins = parseJson(stdout, "claude plugin list --json");
  const plugin = plugins.find((entry) => entry.id === "strike@strike" || entry.name === "strike");
  assert(plugin, "Claude plugin list did not include strike@strike.");
  assert(plugin.version === packageVersion, `Claude installed version ${plugin.version} did not match package.json ${packageVersion}.`);
  assert(plugin.installPath, "Claude plugin list did not include installPath for strike@strike.");
  return plugin.installPath;
}

function assertCodexConfig(ctx) {
  const configPath = [
    ctx.env.CODEX_HOME ? path.join(ctx.env.CODEX_HOME, "config.toml") : null,
    path.join(ctx.paths.home, ".codex/config.toml"),
  ].filter(Boolean).find((candidate) => existsSync(candidate));
  assert(configPath, "Codex did not write expected config file in temp CODEX_HOME or temp HOME.");
  const configText = readFileSync(configPath, "utf8");
  assert(configText.includes("strike"), "Codex config did not include the strike marketplace after add.");
}

function assertCodexAdd(stdout) {
  const match = stdout.match(/^Installed plugin root:\s*(.+)$/m);
  assert(match, "Codex plugin add output did not include an installed plugin root.");
  return match[1].trim();
}

function assertPluginRoot(pluginRoot, manifestRelativePath, options = {}) {
  const check = (condition, message) => {
    if (!condition) {
      if (options.quiet) {
        throw new Error(message);
      }
      assert(condition, message);
    }
  };
  const manifestPath = path.join(pluginRoot, manifestRelativePath);
  check(existsSync(manifestPath), `Missing plugin manifest: ${manifestPath}`);
  const manifest = readJson(manifestPath);
  check(manifest.name === "strike", `${manifestPath} has name ${manifest.name}, expected strike.`);
  check(manifest.version === packageVersion, `${manifestPath} has version ${manifest.version}, expected ${packageVersion}.`);

  for (const skillName of skillNames) {
    const skillPath = path.join(pluginRoot, "skills", skillName, "SKILL.md");
    check(existsSync(skillPath), `Missing installed skill file: ${skillPath}`);
  }
  if (!options.quiet) {
    console.log(`Verified strike ${packageVersion} and ${skillNames.length} skills at ${pluginRoot}`);
  }
}

function assertInstalledRuntime(pluginRoot, ctx, label) {
  const realPluginRoot = realpathSync(pluginRoot);
  const sourcePluginRoot = realpathSync(path.join(repoRoot, "plugins/strike"));
  assert(
    realPluginRoot !== sourcePluginRoot,
    `${ctx.host} ${label} runtime smoke resolved to the source checkout plugin root: ${realPluginRoot}`,
  );

  const allowedRoots = installedRuntimeRoots(ctx);
  assert(
    allowedRoots.some((allowedRoot) => isPathInside(realPluginRoot, allowedRoot)),
    `${ctx.host} ${label} runtime smoke root ${realPluginRoot} is not under an isolated host temp home/cache: ${allowedRoots.join(", ")}`,
  );

  const installedFiles = [
    "skills/go/scripts/state.mjs",
    "references/language.md",
    "references/scripts/slugify.mjs",
    "references/slug-policy.md",
  ];
  for (const relativePath of installedFiles) {
    assertFile(path.join(realPluginRoot, relativePath), `${ctx.host} ${label} installed runtime`);
  }

  const runtimeLabel = slug(label);
  const consumerRepo = path.join(ctx.paths.tempRoot, `runtime-consumer-${runtimeLabel}`);
  mkdirSync(consumerRepo, { recursive: true });

  try {
    const slugifyScript = path.join(realPluginRoot, "references/scripts/slugify.mjs");
    const slugResult = runCommand(
      ctx,
      `${label}-slugify-demo`,
      process.execPath,
      [
        slugifyScript,
        "demo",
        "--text",
        "Mobile flow options",
        "--index",
        "1",
      ],
      {
        cwd: consumerRepo,
      },
    );
    assert(
      /^filename=01-mobile-flow-options\.html$/m.test(slugResult.stdout),
      `${ctx.host} ${label} slugify output did not include the expected demo filename.`,
    );

    const stateScript = path.join(realPluginRoot, "skills/go/scripts/state.mjs");
    const stateInitResult = runCommand(
      ctx,
      `${label}-state-init`,
      process.execPath,
      [stateScript, "init", "gallery", "Gallery"],
      {
        cwd: consumerRepo,
      },
    );
    const stateInitJson = parseJson(stateInitResult.stdout, `${label} state init`);
    assert(
      stateInitJson.nextStep?.skill === "refine-idea",
      `${ctx.host} ${label} state init did not start at refine-idea.`,
    );
    assertFile(path.join(consumerRepo, "PROJECT_LANGUAGE.md"), `${ctx.host} ${label} state init`);
    assertFile(path.join(consumerRepo, "strike/state.json"), `${ctx.host} ${label} state init`);
    assertFile(path.join(consumerRepo, "strike/scripts/state.mjs"), `${ctx.host} ${label} state init`);

    const workspaceStateScript = path.join(consumerRepo, "strike/scripts/state.mjs");
    const stateNextStepResult = runCommand(
      ctx,
      `${label}-state-next-step`,
      process.execPath,
      [workspaceStateScript, "next-step"],
      {
        cwd: consumerRepo,
      },
    );
    const stateNextStepJson = parseJson(stateNextStepResult.stdout, `${label} state next-step`);
    assert(
      stateNextStepJson.artifacts?.includes("strike/initiatives/gallery/idea.md"),
      `${ctx.host} ${label} state next-step did not resolve the refine-idea artifact.`,
    );

    const stateCompleteResult = runCommand(
      ctx,
      `${label}-state-complete-check`,
      process.execPath,
      [workspaceStateScript, "complete-check", "ideaRefined"],
      {
        cwd: consumerRepo,
      },
    );
    const stateCompleteJson = parseJson(stateCompleteResult.stdout, `${label} state complete-check`);
    assert(
      stateCompleteJson.status === "recorded" &&
        stateCompleteJson.completedCheck === "ideaRefined" &&
        stateCompleteJson.runNext === "node strike/scripts/state.mjs next-step",
      `${ctx.host} ${label} complete-check did not return a completion receipt.`,
    );

    const stateNextStepAfterCompleteResult = runCommand(
      ctx,
      `${label}-state-next-step-after-complete`,
      process.execPath,
      [workspaceStateScript, "next-step"],
      {
        cwd: consumerRepo,
      },
    );
    const stateNextStepAfterCompleteJson = parseJson(
      stateNextStepAfterCompleteResult.stdout,
      `${label} state next-step after complete-check`,
    );
    assert(
      stateNextStepAfterCompleteJson.skill === "grill-idea",
      `${ctx.host} ${label} next-step did not advance to grill-idea after complete-check.`,
    );
  } finally {
    writeFileSync(
      path.join(ctx.artifactsDir, `tree-runtime-consumer-${runtimeLabel}.txt`),
      treeSnapshot(consumerRepo),
    );
  }

  console.log(`Verified installed Strike runtime for ${ctx.host} ${label} at ${realPluginRoot}`);
}

function installedRuntimeRoots(ctx) {
  const roots = [ctx.paths.home, ctx.paths.cache, ctx.paths.config];
  if (ctx.env.CODEX_HOME) {
    roots.push(ctx.env.CODEX_HOME);
  }
  if (ctx.env.CLAUDE_CODE_PLUGIN_CACHE_DIR) {
    roots.push(ctx.env.CLAUDE_CODE_PLUGIN_CACHE_DIR);
  }
  return roots.filter((root) => root && existsSync(root)).map((root) => realpathSync(root));
}

function assertFile(filePath, context) {
  assert(existsSync(filePath), `${context}: missing file ${filePath}`);
  assert(statSync(filePath).isFile(), `${context}: expected a file at ${filePath}`);
}

function assertDirectory(filePath, context) {
  assert(existsSync(filePath), `${context}: missing directory ${filePath}`);
  assert(statSync(filePath).isDirectory(), `${context}: expected a directory at ${filePath}`);
}

function isPathInside(childPath, parentPath) {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function walk(root, maxDepth, onFile, depth = 0) {
  if (depth > maxDepth) {
    return;
  }
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath, maxDepth, onFile, depth + 1);
    } else if (entry.isFile()) {
      onFile(entryPath);
    }
  }
}

function finishContext(ctx, status) {
  writeSnapshots(ctx);
  writeFileSync(
    path.join(ctx.artifactsDir, "summary.json"),
    JSON.stringify({
      host: ctx.host,
      status,
      packageVersion,
      skillCount: skillNames.length,
      commands: ctx.commands.map((command) => ({
        label: command.label,
        exitCode: command.exitCode,
        logFile: path.relative(ctx.artifactsDir, command.logPath),
      })),
    }, null, 2),
  );
  ctx.finished = true;
  return { host: ctx.host, status };
}

function writeSnapshots(ctx) {
  const snapshotRoots = [
    ["home", ctx.paths.home],
    ["cache", ctx.paths.cache],
    ["config", ctx.paths.config],
  ];
  if (ctx.env.CLAUDE_CODE_PLUGIN_CACHE_DIR) {
    snapshotRoots.push(["claude-plugin-cache", ctx.env.CLAUDE_CODE_PLUGIN_CACHE_DIR]);
  }
  if (ctx.env.CODEX_HOME) {
    snapshotRoots.push(["codex-home", ctx.env.CODEX_HOME]);
  }
  for (const [name, root] of snapshotRoots) {
    writeFileSync(path.join(ctx.artifactsDir, `tree-${name}.txt`), treeSnapshot(root));
  }
}

function treeSnapshot(root) {
  if (!existsSync(root)) {
    return `${root} does not exist\n`;
  }
  const lines = [root];
  let count = 0;
  const maxEntries = 1200;

  function visit(current, depth) {
    if (depth > 8 || count >= maxEntries) {
      return;
    }
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      lines.push(`${"  ".repeat(depth)}<unreadable: ${error.message}>`);
      return;
    }
    for (const entry of entries) {
      if (count >= maxEntries) {
        lines.push("<truncated>");
        return;
      }
      count += 1;
      const entryPath = path.join(current, entry.name);
      const suffix = entry.isDirectory() ? "/" : "";
      lines.push(`${"  ".repeat(depth)}${path.relative(root, entryPath)}${suffix}`);
      if (entry.isDirectory()) {
        visit(entryPath, depth + 1);
      }
    }
  }

  visit(root, 1);
  return `${lines.join("\n")}\n`;
}

function cleanupContext(ctx) {
  if (!ctx.finished) {
    try {
      writeSnapshots(ctx);
      writeFileSync(
        path.join(ctx.artifactsDir, "summary.json"),
        JSON.stringify({
          host: ctx.host,
          status: "failed",
          packageVersion,
          skillCount: skillNames.length,
          commands: ctx.commands.map((command) => ({
            label: command.label,
            exitCode: command.exitCode,
            logFile: path.relative(ctx.artifactsDir, command.logPath),
          })),
        }, null, 2),
      );
    } catch (error) {
      console.warn(`[${ctx.host}] failed to write diagnostics: ${error.message}`);
    }
  }
  if (ctx.keepTemp) {
    console.log(`[${ctx.host}] Kept diagnostics at ${ctx.artifactsDir}`);
    if (process.env.STRIKE_KEEP_HOST_SMOKE === "1") {
      console.log(`[${ctx.host}] Kept temp root at ${ctx.paths.tempRoot}`);
    } else {
      rmSync(ctx.paths.tempRoot, { recursive: true, force: true });
    }
  } else {
    rmSync(ctx.paths.tempRoot, { recursive: true, force: true });
  }
}

function parseJson(stdout, label) {
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const jsonStart = Math.min(
      ...["[", "{"].map((token) => {
        const index = trimmed.indexOf(token);
        return index === -1 ? Number.POSITIVE_INFINITY : index;
      }),
    );
    if (Number.isFinite(jsonStart)) {
      return JSON.parse(trimmed.slice(jsonStart));
    }
    throw new Error(`Could not parse JSON from ${label}: ${error.message}`);
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    if (process.env.GITHUB_ACTIONS === "true") {
      console.error(`::error::${message.replaceAll("\n", "%0A")}`);
    }
    throw new Error(message);
  }
}

function slug(value) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(value)) {
    return value;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

main().catch((error) => {
  if (process.env.GITHUB_ACTIONS === "true") {
    console.error(`::error::${error.message.replaceAll("\n", "%0A")}`);
  }
  console.error(error.message);
  process.exit(1);
});
