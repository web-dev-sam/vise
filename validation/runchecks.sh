#!/usr/bin/env bash
# Runs every structural catcher against the adversarial worktree and reports
# which (if any) fires. Usage: runchecks.sh <label>
set -u
WT=/home/wds/vise-adv
LABEL="${1:-run}"
LOG=/home/wds/Projects/vise/validation/adversarial/logs/$LABEL
mkdir -p "$LOG"

run() { # name  dir  cmd...
  local name="$1" dir="$2"; shift 2
  ( cd "$dir" && "$@" ) >"$LOG/$name.txt" 2>&1
  local rc=$?
  if [ $rc -ne 0 ]; then echo "CAUGHT  $name (exit $rc)"; else echo "pass    $name"; fi
}

run oxlint       "$WT"          vp lint
run typecheck    "$WT/apps/web" ./node_modules/.bin/vue-tsc --noEmit -p tsconfig.json
run depcruise    "$WT/apps/web" ./node_modules/.bin/depcruise src --config .dependency-cruiser.cjs --ignore-known
run tests        "$WT/apps/web" vp test run
run modulecount  "$WT"          vp run --filter @vise/web arch:module-count
run nodisable    "$WT"          vp run --filter @vise/web arch:no-disable
