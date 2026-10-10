#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./install.sh --target ABSOLUTE_PATH [--dry-run] [--force] [--with-workspace-policy] [--set-default-agent]

Copies the Misa–Herdr kit into an existing target workspace. Existing managed
destinations cause a safe failure unless --force is supplied. --force overwrites
kit-managed files but does not remove target directories.
--with-workspace-policy also installs root AGENTS.md, CLAUDE.md, identities.md,
and .organization/. Use only for a new workspace or after reviewing conflicts.
--set-default-agent sets only the top-level "agent" field in .claude/settings.json
to "misa". When that file already exists, the installer asks first.
USAGE
}

target=""
dry_run=false
force=false
with_workspace_policy=false
set_default_agent=false

while (($#)); do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || { usage >&2; exit 2; }
      target=$2
      shift 2
      ;;
    --dry-run) dry_run=true; shift ;;
    --force) force=true; shift ;;
    --with-workspace-policy) with_workspace_policy=true; shift ;;
    --set-default-agent) set_default_agent=true; shift ;;
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
  .claude/agents/design-analyst.md
  .claude/agents/visual-verifier.md
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

policy_items=(AGENTS.md CLAUDE.md identities.md .organization)

conflicts=()
for item in "${items[@]}"; do
  [[ -e "$source_dir/$item" ]] || { printf 'Kit source missing: %s\n' "$item" >&2; exit 1; }
  [[ ! -e "$target/$item" ]] || conflicts+=("$item")
done

if [[ "$with_workspace_policy" == true ]]; then
  for item in "${policy_items[@]}"; do
    [[ -e "$source_dir/workspace-policy/$item" ]] || { printf 'Kit policy source missing: %s\n' "$item" >&2; exit 1; }
    [[ ! -e "$target/$item" ]] || conflicts+=("$item")
  done
fi

settings_path=$target/.claude/settings.json
if [[ "$set_default_agent" == true ]]; then
  if [[ "$dry_run" == true ]]; then
    printf '%s: %s\n' "$([[ -e "$settings_path" ]] && printf 'SET (preserve other JSON keys)' || printf CREATE)" .claude/settings.json
  elif [[ -e "$settings_path" ]]; then
    printf 'Set only .claude/settings.json top-level "agent" to "misa" and preserve other JSON keys? [y/N] '
    read -r confirmation
    if [[ "$confirmation" != y && "$confirmation" != Y ]]; then
      printf 'Skipped .claude/settings.json.\n'
      set_default_agent=false
    fi
  fi
fi

printf 'Target: %s\n' "$target"
printf 'Mode: %s\n' "$([[ "$dry_run" == true ]] && printf dry-run || printf install)"
for item in "${items[@]}"; do
  if [[ -e "$target/$item" ]]; then
    printf 'REPLACE: %s\n' "$item"
  else
    printf 'CREATE:  %s\n' "$item"
  fi
done

if [[ "$with_workspace_policy" == true ]]; then
  for item in "${policy_items[@]}"; do
    if [[ -e "$target/$item" ]]; then
      printf 'REPLACE: %s\n' "$item"
    else
      printf 'CREATE:  %s\n' "$item"
    fi
  done
fi

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

if [[ "$with_workspace_policy" == true ]]; then
  for item in "${policy_items[@]}"; do
    source_path=$source_dir/workspace-policy/$item
    target_path=$target/$item
    mkdir -p -- "$(dirname -- "$target_path")"
    if [[ -d "$source_path" ]]; then
      mkdir -p -- "$target_path"
      cp -R -- "$source_path/." "$target_path/"
    else
      cp -- "$source_path" "$target_path"
    fi
  done
fi

chmod +x "$target/.misa-herdr/bin/misa-controller"
if [[ "$set_default_agent" == true ]]; then
  node "$target/.misa-herdr/scripts/set-default-agent.cjs" "$settings_path"
fi
node "$target/.misa-herdr/scripts/register-misa-herdr-mcp.cjs" "$target"
printf '\nInstalled. Run:\n  cd %s\n  node .misa-herdr/scripts/test-misa-herdr-commands.cjs\n  node .misa-herdr/scripts/verify-misa-controller.cjs\n' "$target"
