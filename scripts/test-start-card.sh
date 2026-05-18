#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
start_script="$root/plugins/strike/skills/start/scripts/start-card.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

field() {
  local name="$1"
  awk -F= -v key="$name" '$1 == key { print substr($0, length(key) + 2); exit }'
}

assert_eq() {
  local actual="$1"
  local expected="$2"
  local message="$3"

  [[ "$actual" == "$expected" ]] || fail "$message: expected '$expected', got '$actual'"
}

assert_file() {
  [[ -f "$1" ]] || fail "missing file: $1"
}

run_start() {
  local repo_root="$1"
  shift

  "$start_script" --repo-root "$repo_root" "$@"
}

test_generated_slug() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" "Add user profile page")"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "user-profile-page" "generated slug"
  assert_file "$repo/docs/strike/cards/user-profile-page/card.md"
  assert_file "$repo/docs/strike/board/01-brainstorm/user-profile-page.md"
}

test_unquoted_feature_name() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" Add user profile page)"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "user-profile-page" "unquoted feature name slug"
}

test_flag_like_feature_words() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" Add --dry-run flag)"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "dry-run-flag" "flag-like feature word slug"
}

test_long_slug_is_capped() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" "Add user profile page with a much longer name that should be pleasant to use repeatedly in commands")"
  slug="$(printf '%s\n' "$output" | field next_args)"

  (( ${#slug} <= 48 )) || fail "slug is longer than 48 chars: $slug"
  [[ "$slug" != *- ]] || fail "slug should not end with a hyphen: $slug"
  assert_file "$repo/docs/strike/cards/$slug/card.md"
}

test_article_after_task_verb_is_dropped() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" "Add a really long user profile editing and account preference management experience for power users")"
  slug="$(printf '%s\n' "$output" | field next_args)"

  [[ "$slug" != a-* ]] || fail "slug should drop article after task verb: $slug"
  (( ${#slug} <= 48 )) || fail "slug is longer than 48 chars: $slug"
}

test_short_task_verb_is_dropped() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" Add auth)"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "auth" "short task verb slug"
}

test_explicit_slug_dedupes() {
  local repo output slug

  repo="$(mktemp -d)"
  run_start "$repo" First --slug user-profile-page >/dev/null
  output="$(run_start "$repo" Second --slug user-profile-page)"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "user-profile-page-2" "explicit slug dedupe"
  assert_file "$repo/docs/strike/cards/user-profile-page-2/card.md"
}

test_board_pointer_collision_dedupes() {
  local repo output slug pointer

  repo="$(mktemp -d)"
  pointer="$repo/docs/strike/board/02-grill/user-profile-page.md"
  mkdir -p "$(dirname "$pointer")"
  printf '# Old pointer\n\nCard: ../../cards/somewhere-else/card.md\n' > "$pointer"

  output="$(run_start "$repo" Add user profile page)"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "user-profile-page-2" "board pointer collision dedupe"
  assert_file "$repo/docs/strike/cards/user-profile-page-2/card.md"
  assert_file "$repo/docs/strike/board/01-brainstorm/user-profile-page-2.md"
}

test_suffix_stays_within_cap() {
  local repo base output slug

  repo="$(mktemp -d)"
  base="this-is-a-very-long-feature-name-that-will-be-cut"
  run_start "$repo" First --slug "$base" >/dev/null
  output="$(run_start "$repo" Second --slug "$base")"
  slug="$(printf '%s\n' "$output" | field next_args)"

  (( ${#slug} <= 48 )) || fail "deduped slug is longer than 48 chars: $slug"
  [[ "$slug" == *-2 ]] || fail "deduped slug should end with -2: $slug"
}

test_special_characters_are_sanitized() {
  local repo output slug

  repo="$(mktemp -d)"
  output="$(run_start "$repo" 'Add user profile page!!! @#$ 100% / edit & view')"
  slug="$(printf '%s\n' "$output" | field next_args)"

  assert_eq "$slug" "user-profile-page-100-edit-view" "special character slug"
}

test_invalid_slug_source_fails() {
  local repo

  repo="$(mktemp -d)"
  if run_start "$repo" '!!! @#$' >/dev/null 2>&1; then
    fail "invalid slug source should fail"
  fi
}

test_unquoted_description() {
  local repo card

  repo="$(mktemp -d)"
  run_start "$repo" Add user profile page --description Let users view and edit their basic profile information. >/dev/null
  card="$repo/docs/strike/cards/user-profile-page/card.md"

  assert_file "$card"
  grep -F 'Let users view and edit their basic profile information.' "$card" >/dev/null \
    || fail "unquoted description was not written"
}

test_flag_like_description_words() {
  local repo card

  repo="$(mktemp -d)"
  run_start "$repo" Add dry run flag --description Add support for --dry-run before saving. >/dev/null
  card="$repo/docs/strike/cards/dry-run-flag/card.md"

  assert_file "$card"
  grep -F 'Add support for --dry-run before saving.' "$card" >/dev/null \
    || fail "flag-like description word was not written"
}

test_unknown_flag_before_feature_fails() {
  local repo

  repo="$(mktemp -d)"
  if run_start "$repo" --unknown Add user profile page >/dev/null 2>&1; then
    fail "unknown flag before feature should fail"
  fi
}

test_markdown_text_is_normalized() {
  local repo card

  repo="$(mktemp -d)"
  run_start "$repo" $'Add\nprofile\tpage' --description $'Line one\nLine two' >/dev/null
  card="$repo/docs/strike/cards/profile-page/card.md"

  assert_file "$card"
  grep -F '# Add profile page' "$card" >/dev/null || fail "title was not normalized"
  grep -F 'Line one Line two' "$card" >/dev/null || fail "description was not normalized"
}

test_generated_slug
test_unquoted_feature_name
test_flag_like_feature_words
test_long_slug_is_capped
test_article_after_task_verb_is_dropped
test_short_task_verb_is_dropped
test_explicit_slug_dedupes
test_board_pointer_collision_dedupes
test_suffix_stays_within_cap
test_special_characters_are_sanitized
test_invalid_slug_source_fails
test_unquoted_description
test_flag_like_description_words
test_unknown_flag_before_feature_fails
test_markdown_text_is_normalized

printf 'start-card tests passed\n'
