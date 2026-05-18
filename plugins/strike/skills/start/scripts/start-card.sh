#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s [--repo-root <path>] <project name words> [--slug <slug>] [--description <short description words>]\n' "$0" >&2
  printf 'Set STRIKE_REPO_ROOT as an alternative to --repo-root.\n' >&2
}

project_name_parts=()
slug_override=""
description=""
repo_root="${STRIKE_REPO_ROOT:-}"
node_bin="${STRIKE_NODE:-node}"
script_dir="$(cd "$(dirname "$0")" && pwd)"
plugin_root="$(cd "$script_dir/../../.." && pwd)"
slug_helper="$plugin_root/references/scripts/slugify.mjs"

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
      shift
      description_parts=()
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --repo-root|--slug|--description)
            break
            ;;
          *)
            description_parts+=("$1")
            shift
            ;;
        esac
      done
      [[ ${#description_parts[@]} -gt 0 ]] || { usage; exit 2; }
      description="${description_parts[*]}"
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        project_name_parts+=("$1")
        shift
      done
      ;;
    -*)
      if [[ ${#project_name_parts[@]} -eq 0 ]]; then
        printf 'Unknown flag: %s\n' "$1" >&2
        usage
        exit 2
      fi
      project_name_parts+=("$1")
      shift
      ;;
    *)
      project_name_parts+=("$1")
      shift
      ;;
  esac
done

if [[ ${#project_name_parts[@]} -eq 0 ]]; then
  usage
  exit 2
fi

project_name="${project_name_parts[*]}"

if [[ -z "$repo_root" ]]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

if [[ ! -d "$repo_root" ]]; then
  printf 'Repo root does not exist: %s\n' "$repo_root" >&2
  exit 2
fi

repo_root="$(cd "$repo_root" && pwd)"
strike_root="$repo_root/docs/strike"

if ! command -v "$node_bin" >/dev/null 2>&1; then
  printf 'Node.js 18+ is required to run Strike slug helpers. Install Node.js or set STRIKE_NODE to its path.\n' >&2
  exit 2
fi

if ! "$node_bin" -e 'const major = Number(process.versions.node.split(".")[0]); process.exit(major >= 18 ? 0 : 1);'; then
  printf 'Node.js 18+ is required to run Strike slug helpers. Current version: %s\n' "$("$node_bin" --version 2>/dev/null || printf 'unknown')" >&2
  exit 2
fi

normalize_text() {
  printf '%s' "$1" \
    | tr '\r\n\t' '   ' \
    | sed -E 's/[[:cntrl:]]+/ /g; s/[[:space:]]+/ /g; s/^ //; s/ $//'
}

taken_args=()
if [[ -d "$strike_root/cards" ]]; then
  while IFS= read -r existing_card_slug; do
    [[ -n "$existing_card_slug" ]] && taken_args+=(--taken "$existing_card_slug")
  done < <(find "$strike_root/cards" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
fi
if [[ -d "$strike_root/board" ]]; then
  while IFS= read -r existing_pointer_path; do
    existing_pointer_slug="$(basename "$existing_pointer_path" .md)"
    [[ -n "$existing_pointer_slug" ]] && taken_args+=(--taken "$existing_pointer_slug")
  done < <(find "$strike_root/board" -mindepth 2 -maxdepth 2 -type f -name '*.md' -print | sort)
fi

slug_text="$project_name"
slug_command=("$node_bin" "$slug_helper" project --text "$slug_text")
if [[ -n "$slug_override" ]]; then
  slug_text="$slug_override"
  slug_command=("$node_bin" "$slug_helper" project --text "$slug_text" --keep-leading-words)
fi
if (( ${#taken_args[@]} > 0 )); then
  slug_command+=("${taken_args[@]}")
fi

slug_output="$("${slug_command[@]}")"
slug="$(printf '%s\n' "$slug_output" | awk -F= '$1 == "slug" { print substr($0, 6); exit }')"
if [[ -z "$slug" ]]; then
  printf 'Could not parse slug helper output.\n' >&2
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

card_dir="$strike_root/cards/$slug"
card_path="$card_dir/card.md"
pointer_path="$strike_root/board/01-brainstorm/$slug.md"
display_project_name="$(normalize_text "$project_name")"

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

  short_description="$(normalize_text "$description")"
  if [[ -z "$short_description" ]]; then
    short_description="_Add the rough idea or intended outcome here._"
  fi

  cat > "$card_path" <<EOF
# $display_project_name

Short description:
$short_description

## Working Checklist

- [ ] Brainstorm: sharpen fuzzy idea into a clear project direction.

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
# $display_project_name

Card: ../../cards/$slug/card.md

Current intent: Sharpen the project direction enough for decision-tree grilling.
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
