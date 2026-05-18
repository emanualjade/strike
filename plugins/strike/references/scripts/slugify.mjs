#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const FEATURE_BODY_MAX = 48;
export const ARTIFACT_BODY_MAX = 40;

const TASK_VERBS = new Set([
  "add",
  "allow",
  "build",
  "create",
  "enable",
  "fix",
  "implement",
  "improve",
  "make",
  "remove",
  "support",
  "update",
]);

const ARTICLES = new Set(["a", "an", "the"]);

export function normalizeText(value) {
  return String(value ?? "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function dropLeadingFeatureWords(slug) {
  const parts = slug.split("-");
  if (parts.length < 2 || !TASK_VERBS.has(parts[0])) {
    return slug;
  }

  const withoutVerb = parts.slice(1);
  if (withoutVerb.length >= 2 && ARTICLES.has(withoutVerb[0])) {
    return withoutVerb.slice(1).join("-");
  }
  return withoutVerb.join("-");
}

export function shortenSlug(slug, maxLength) {
  if (slug.length <= maxLength) {
    return slug;
  }

  let shortened = slug.slice(0, maxLength);
  if (shortened.includes("-")) {
    const boundary = shortened.slice(0, shortened.lastIndexOf("-"));
    if (boundary.length >= maxLength / 2) {
      shortened = boundary;
    }
  }
  return shortened.replace(/-+$/g, "");
}

export function slugWithSuffix(baseSlug, suffix, maxLength) {
  const maxBaseLength = Math.max(1, maxLength - suffix.length);
  let stem = baseSlug.slice(0, maxBaseLength).replace(/-+$/g, "");
  if (!stem) {
    stem = baseSlug.slice(0, 1);
  }
  return `${stem}${suffix}`;
}

function requireSlug(slug, kind) {
  if (!slug) {
    throw new Error(
      `Could not derive a valid ${kind} slug. Use text with at least one ASCII letter or number.`,
    );
  }
}

function dedupeBody(baseBody, maxLength, taken, formatCandidate) {
  let body = baseBody;
  let counter = 2;

  while (taken.has(formatCandidate(body))) {
    body = slugWithSuffix(baseBody, `-${counter}`, maxLength);
    counter += 1;
  }

  return body;
}

function indexPrefix(index) {
  const text = String(index ?? "").trim();
  if (!/^(?:0?[1-9]|[1-9][0-9])$/.test(text)) {
    throw new Error("--index must be a decimal integer from 1 to 99.");
  }
  return String(Number(text)).padStart(2, "0");
}

function normalizeExtension(ext) {
  const normalized = String(ext ?? "html").replace(/^\./, "").toLowerCase();
  if (!/^[a-z0-9]+$/.test(normalized)) {
    throw new Error("--ext must contain only ASCII letters and numbers.");
  }
  return normalized;
}

export function createFeatureSlug(text, options = {}) {
  const taken = new Set(options.taken ?? []);
  const dropLeadingWords = options.dropLeadingWords ?? true;
  let body = slugifyText(text);

  if (dropLeadingWords) {
    body = dropLeadingFeatureWords(body);
  }
  body = shortenSlug(body, FEATURE_BODY_MAX);
  requireSlug(body, "feature");
  body = dedupeBody(body, FEATURE_BODY_MAX, taken, (candidate) => candidate);

  return { slug: body };
}

export function createPhaseSlug(text, options = {}) {
  const taken = new Set(options.taken ?? []);
  const prefix = indexPrefix(options.index);
  let body = shortenSlug(slugifyText(text), ARTIFACT_BODY_MAX);

  requireSlug(body, "phase");
  body = dedupeBody(body, ARTIFACT_BODY_MAX, taken, (candidate) => `${prefix}-${candidate}`);

  return {
    slug: `${prefix}-${body}`,
    body,
  };
}

export function createDemoSlug(text, options = {}) {
  const taken = new Set(options.taken ?? []);
  const prefix = indexPrefix(options.index);
  const ext = normalizeExtension(options.ext);
  let body = shortenSlug(slugifyText(text), ARTIFACT_BODY_MAX);

  requireSlug(body, "demo");
  body = dedupeBody(body, ARTIFACT_BODY_MAX, taken, (candidate) => `${prefix}-${candidate}.${ext}`);

  const slug = `${prefix}-${body}`;
  return {
    filename: `${slug}.${ext}`,
    slug,
    body,
  };
}

function parseCliArgs(argv) {
  const mode = argv[0];
  const options = {
    taken: [],
  };

  if (!["feature", "phase", "demo"].includes(mode)) {
    throw new Error("Usage: slugify.mjs <feature|phase|demo> --text <text> [--index <n>] [--taken <value>]...");
  }

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--text":
        index += 1;
        if (index >= argv.length) throw new Error("--text requires a value.");
        options.text = argv[index];
        break;
      case "--index":
        index += 1;
        if (index >= argv.length) throw new Error("--index requires a value.");
        options.index = argv[index];
        break;
      case "--taken":
        index += 1;
        if (index >= argv.length) throw new Error("--taken requires a value.");
        options.taken.push(argv[index]);
        break;
      case "--ext":
        index += 1;
        if (index >= argv.length) throw new Error("--ext requires a value.");
        options.ext = argv[index];
        break;
      case "--keep-leading-words":
        options.dropLeadingWords = false;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.text === undefined) {
    throw new Error("--text is required.");
  }

  return { mode, options };
}

function printKeyValues(result) {
  for (const [key, value] of Object.entries(result)) {
    console.log(`${key}=${value}`);
  }
}

export function runCli(argv = process.argv.slice(2)) {
  const { mode, options } = parseCliArgs(argv);
  if (mode === "feature") {
    printKeyValues(createFeatureSlug(options.text, options));
  } else if (mode === "phase") {
    printKeyValues(createPhaseSlug(options.text, options));
  } else {
    printKeyValues(createDemoSlug(options.text, options));
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFile === invokedFile) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
