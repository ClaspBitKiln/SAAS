#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tool_cache="${repo_root}/.tool-cache"

export COREPACK_HOME="${tool_cache}/corepack"
export PNPM_HOME="${tool_cache}/pnpm"
export PNPM_STORE_DIR="${tool_cache}/pnpm-store"
export npm_config_store_dir="${PNPM_STORE_DIR}"
export XDG_CACHE_HOME="${tool_cache}/xdg"
export XDG_CONFIG_HOME="${tool_cache}/xdg-config"
export XDG_DATA_HOME="${tool_cache}/xdg-data"
export XDG_STATE_HOME="${tool_cache}/xdg-state"

mkdir -p \
  "${COREPACK_HOME}" \
  "${PNPM_HOME}" \
  "${PNPM_STORE_DIR}" \
  "${XDG_CACHE_HOME}" \
  "${XDG_CONFIG_HOME}" \
  "${XDG_DATA_HOME}" \
  "${XDG_STATE_HOME}"

cd "${repo_root}"
export PATH="${repo_root}/scripts/bin:${PATH}"

pnpm_cmd=(pnpm)

if [[ ! -x node_modules/.bin/turbo ]]; then
  "${pnpm_cmd[@]}" install --frozen-lockfile
fi

"${pnpm_cmd[@]}" --filter @ai-sales-os/api prisma:generate
"${pnpm_cmd[@]}" lint
"${pnpm_cmd[@]}" build
"${pnpm_cmd[@]}" test
