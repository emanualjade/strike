#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s [--repo-root <path>] "<feature name>" [--slug <slug>] [--description "<short description>"]\n' "$0" >&2
  printf 'Set STRIKE_REPO_ROOT as an alternative to --repo-root.\n' >&2
}

feature_name=""
slug_override=""
description=""
repo_root="${STRIKE_REPO_ROOT:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      repo_root="$2"
      shift 2
      ;;
    --slug)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      slug_override="$2"
      shift 2
      ;;
    --description)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      description="$2"
      shift 2
      ;;
    -*)
      printf 'Unknown flag: %s\n' "$1" >&2
      usage
      exit 2
      ;;
    *)
      if [[ -n "$feature_name" ]]; then
        printf 'Feature name was provided more than once.\n' >&2
        usage
        exit 2
      fi
      feature_name="$1"
      shift
      ;;
  esac
done

if [[ -z "$feature_name" ]]; then
  usage
  exit 2
fi

if [[ -z "$repo_root" ]]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

if [[ ! -d "$repo_root" ]]; then
  printf 'Repo root does not exist: %s\n' "$repo_root" >&2
  exit 2
fi

repo_root="$(cd "$repo_root" && pwd)"
strike_root="$repo_root/docs/strike"

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

if [[ -n "$slug_override" ]]; then
  slug="$(slugify "$slug_override")"
else
  slug="$(slugify "$feature_name")"
fi

if [[ -z "$slug" ]]; then
  printf 'Could not derive a valid slug.\n' >&2
  exit 2
fi

mkdir -p \
  "$strike_root/board/01-brainstorm" \
  "$strike_root/board/02-grill" \
  "$strike_root/board/03-research" \
  "$strike_root/board/04-spec" \
  "$strike_root/board/05-slice" \
  "$strike_root/board/06-implementation" \
  "$strike_root/board/07-acceptance" \
  "$strike_root/board/08-retro" \
  "$strike_root/board/09-done" \
  "$strike_root/board/blocked" \
  "$strike_root/cards"

touch \
  "$strike_root/board/01-brainstorm/.gitkeep" \
  "$strike_root/board/02-grill/.gitkeep" \
  "$strike_root/board/03-research/.gitkeep" \
  "$strike_root/board/04-spec/.gitkeep" \
  "$strike_root/board/05-slice/.gitkeep" \
  "$strike_root/board/06-implementation/.gitkeep" \
  "$strike_root/board/07-acceptance/.gitkeep" \
  "$strike_root/board/08-retro/.gitkeep" \
  "$strike_root/board/09-done/.gitkeep" \
  "$strike_root/board/blocked/.gitkeep" \
  "$strike_root/cards/.gitkeep"

base_slug="$slug"
if [[ -z "$slug_override" ]]; then
  counter=2
  while [[ -d "$strike_root/cards/$slug" ]]; do
    slug="$base_slug-$counter"
    counter=$((counter + 1))
  done
fi

card_dir="$strike_root/cards/$slug"
card_path="$card_dir/card.md"
pointer_path="$strike_root/board/01-brainstorm/$slug.md"

existing_pointer="$(find "$strike_root/board" -mindepth 2 -maxdepth 2 -type f -name "$slug.md" -print -quit 2>/dev/null || true)"

created_card="no"
if [[ ! -d "$card_dir" ]]; then
  mkdir -p \
    "$card_dir/outputs/brainstorm" \
    "$card_dir/outputs/grill" \
    "$card_dir/outputs/research" \
    "$card_dir/outputs/spec" \
    "$card_dir/outputs/acceptance" \
    "$card_dir/outputs/retro" \
    "$card_dir/demos" \
    "$card_dir/phases"
  touch \
    "$card_dir/outputs/brainstorm/.gitkeep" \
    "$card_dir/outputs/grill/.gitkeep" \
    "$card_dir/outputs/research/.gitkeep" \
    "$card_dir/outputs/spec/.gitkeep" \
    "$card_dir/outputs/acceptance/.gitkeep" \
    "$card_dir/outputs/retro/.gitkeep" \
    "$card_dir/demos/.gitkeep" \
    "$card_dir/phases/.gitkeep"

  short_description="$description"
  if [[ -z "$short_description" ]]; then
    short_description="_Add the rough idea or user-facing outcome here._"
  fi

  cat > "$card_path" <<EOF
# $feature_name

Short description:
$short_description

Run kind:
_Undecided - choose dogfood or shippable by spec/acceptance._

## Working Checklist

- [ ] Brainstorm: sharpen fuzzy idea into a product direction.

## Open Questions

- _None yet._

## Constraints And Decisions

- _None yet._

## Stage Outputs

- Brainstorm: \`outputs/brainstorm/\`
- Grill: \`outputs/grill/\`
- Research: \`outputs/research/\`
- Spec: \`outputs/spec/\`
- Acceptance: \`outputs/acceptance/\`
- Retro: \`outputs/retro/\`

## Phases

- _No phases yet._

## Notes

- Board state lives in \`docs/strike/board/\`, not in this card.
EOF
  created_card="yes"
fi

if [[ -z "$existing_pointer" ]]; then
  cat > "$pointer_path" <<EOF
# $feature_name

Card: ../../cards/$slug/card.md

Current intent: Sharpen the fuzzy idea enough for decision-tree grilling.
EOF
  existing_pointer="$pointer_path"
fi

printf 'card=%s\n' "${card_path#$repo_root/}"
printf 'board=%s\n' "${existing_pointer#$repo_root/}"
printf 'created_card=%s\n' "$created_card"
printf 'next_reset=true\n'
printf 'next_skill=brainstorm\n'
printf 'next_args=%s\n' "$slug"
printf 'next_claude_reset=/clear\n'
printf 'next_claude=/strike:brainstorm %s\n' "$slug"
printf 'next_codex=$brainstorm %s\n' "$slug"
printf 'next_copilot=/brainstorm %s\n' "$slug"
