#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./install.sh --target ABSOLUTE_PATH [--dry-run] [--force]

Copies the Misa–Herdr kit into an existing target workspace. Existing managed
destinations cause a safe failure unless --force is supplied. --force overwrites
kit-managed files but does not remove target directories.
USAGE
}

target=""
dry_run=false
force=false

while (($#)); do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || { usage >&2; exit 2; }
      target=$2
      shift 2
      ;;
    --dry-run) dry_run=true; shift ;;
    --force) force=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n "$target" ]] || { usage >&2; exit 2; }
[[ "$target" = /* ]] || { printf '%s\n' '--target must be an absolute path.' >&2; exit 2; }
[[ -d "$target" ]] || { printf 'Target is not an existing directory: %s\n' "$target" >&2; exit 2; }

kit_dir=$(cd -- "$(dirname -- "$0")" && pwd -P)
source_dir=$kit_dir/templates

items=(
  .misa-herdr
  .claude/agents/misa.md
  .claude/agents/git-manager.md
  .claude/agents/portfolio-curator.md
  .claude/skills/misa-adaptive-delivery
  .claude/skills/misa-cross-agent-review
  .claude/skills/misa-grounded-evidence
  .claude/skills/misa-herdr
  .claude/skills/misa-portfolio
  .agents/skills/misa-cross-agent-review
  .agents/skills/misa-grounded-evidence
)

conflicts=()
for item in "${items[@]}"; do
  [[ -e "$source_dir/$item" ]] || { printf 'Kit source missing: %s\n' "$item" >&2; exit 1; }
  [[ ! -e "$target/$item" ]] || conflicts+=("$item")
done

printf 'Target: %s\n' "$target"
printf 'Mode: %s\n' "$([[ "$dry_run" == true ]] && printf dry-run || printf install)"
for item in "${items[@]}"; do
  if [[ -e "$target/$item" ]]; then
    printf 'REPLACE: %s\n' "$item"
  else
    printf 'CREATE:  %s\n' "$item"
  fi
done

if ((${#conflicts[@]})) && [[ "$force" != true ]]; then
  printf '\nRefusing to overwrite existing managed paths. Review these paths, then rerun with --force only if replacement is intended:\n' >&2
  printf '%s\n' "${conflicts[@]}" >&2
  exit 1
fi

[[ "$dry_run" == true ]] && exit 0

for item in "${items[@]}"; do
  source_path=$source_dir/$item
  target_path=$target/$item
  mkdir -p -- "$(dirname -- "$target_path")"
  if [[ -d "$source_path" ]]; then
    mkdir -p -- "$target_path"
    cp -R -- "$source_path/." "$target_path/"
  else
    cp -- "$source_path" "$target_path"
  fi
done

chmod +x "$target/.misa-herdr/bin/misa-controller"
printf '\nInstalled. Run:\n  cd %s\n  node .misa-herdr/scripts/test-misa-herdr-commands.cjs\n  node .misa-herdr/scripts/verify-misa-controller.cjs\n' "$target"
