#!/bin/bash
# FE Layer Check — deterministic PASS/FAIL per layer.
# Run after completing each layer: bash scripts/quality/fe-layer-check.sh <layer>
# Layers: model, api, store, ui, page

set -euo pipefail

LAYER="${1:-}"
CLIENT_DIR="client/src"
ERRORS=0

if [ -z "$LAYER" ]; then
  echo "Usage: bash scripts/quality/fe-layer-check.sh <model|api|store|ui|page>"
  exit 1
fi

echo "🔍 Layer check: $LAYER"
echo ""

# ─── TypeScript compilation (always) ───────────────────────────────
echo "── tsc --noEmit ──"
if ! (cd client && npx tsc --noEmit 2>&1); then
  echo "❌ TypeScript compilation failed"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ tsc passed"
fi

case "$LAYER" in
  model)
    echo ""
    echo "── model/ layer checks ──"

    # No React imports
    while IFS= read -r file; do
      if grep -qE "from 'react'|from \"react\"|from 'react-" "$file" 2>/dev/null; then
        echo "❌ $file imports React (model/ must be pure)"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/model -name '*.ts' ! -name '*.spec.ts' 2>/dev/null)

    # No imports from api/store/ui
    while IFS= read -r file; do
      if grep -qE "#features/.*/api/|#features/.*/store/|#features/.*/ui/" "$file" 2>/dev/null; then
        echo "❌ $file imports from api/store/ui (model/ depends on nothing)"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/model -name '*.ts' ! -name '*.spec.ts' 2>/dev/null)

    # Spec files exist for non-type files
    while IFS= read -r file; do
      [ "$(basename "$file")" = "types.ts" ] && continue
      [ "$(basename "$file")" = "index.ts" ] && continue
      dir=$(dirname "$file")
      base=$(basename "$file" .ts)
      if [ ! -f "$dir/$base.spec.ts" ]; then
        echo "⚠️  Missing spec: $file"
      fi
    done < <(find "$CLIENT_DIR"/features/*/model -name '*.ts' ! -name '*.spec.ts' ! -name 'index.ts' ! -name 'types.ts' ! -path '*/node_modules/*' 2>/dev/null)

    # Run specs
    echo ""
    echo "── model/ specs ──"
    if (cd client && npx vitest run model/ --reporter=verbose 2>&1 | tail -5); then
      echo "✅ model/ specs passed"
    else
      echo "❌ model/ specs failed"
      ERRORS=$((ERRORS + 1))
    fi
    ;;

  api)
    echo ""
    echo "── api/ layer checks ──"

    # constants.ts exists per feature that has api/
    for api_dir in "$CLIENT_DIR"/features/*/api/; do
      [ -d "$api_dir" ] || continue
      if [ ! -f "${api_dir}constants.ts" ]; then
        echo "❌ ${api_dir} missing constants.ts (API_PATHS + QUERY_KEYS required)"
        ERRORS=$((ERRORS + 1))
      fi
    done

    # No magic string paths in query hooks
    while IFS= read -r file; do
      [ "$(basename "$file")" = "constants.ts" ] && continue
      [ "$(basename "$file")" = "index.ts" ] && continue
      magic_paths=$(grep -nE "path: ['\"]/" "$file" 2>/dev/null || true)
      if [ -n "$magic_paths" ]; then
        echo "❌ $file has hardcoded API path (use API_PATHS constant):"
        echo "$magic_paths"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/api -name '*.ts' ! -name '*.spec.ts' 2>/dev/null)

    # No magic query key strings
    while IFS= read -r file; do
      [ "$(basename "$file")" = "constants.ts" ] && continue
      [ "$(basename "$file")" = "index.ts" ] && continue
      magic_keys=$(grep -nE "queryKey: \['" "$file" 2>/dev/null || true)
      if [ -n "$magic_keys" ]; then
        echo "❌ $file has hardcoded query key (use QUERY_KEYS constant):"
        echo "$magic_keys"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/api -name '*.ts' ! -name '*.spec.ts' 2>/dev/null)
    ;;

  store)
    echo ""
    echo "── store/ layer checks ──"

    # No port interfaces
    while IFS= read -r file; do
      if grep -qE "interface .*(Port|Facade)" "$file" 2>/dev/null; then
        echo "❌ $file has Port/Facade interface (use direct Zustand hook)"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/store -name '*.ts' 2>/dev/null)

    # No ui/ imports
    while IFS= read -r file; do
      if grep -qE "#features/.*/ui/" "$file" 2>/dev/null; then
        echo "❌ $file imports from ui/ (store/ must not depend on ui/)"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/store -name '*.ts' 2>/dev/null)
    ;;

  ui)
    echo ""
    echo "── ui/ layer checks ──"

    # No hardcoded hex colors
    while IFS= read -r file; do
      hex=$(grep -nE "(bg|text|border|ring)-\[#[0-9a-fA-F]" "$file" 2>/dev/null || true)
      if [ -n "$hex" ]; then
        echo "❌ $file has hardcoded hex color:"
        echo "$hex"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/ui -name '*.tsx' 2>/dev/null)

    # No function keyword exports
    while IFS= read -r file; do
      funcs=$(grep -nE "^export function " "$file" 2>/dev/null || true)
      if [ -n "$funcs" ]; then
        echo "❌ $file uses function keyword (use arrow):"
        echo "$funcs"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/ui -name '*.tsx' -o -name '*.ts' 2>/dev/null | grep -v index.ts)

    # No inline callbacks (basic detection)
    while IFS= read -r file; do
      inline=$(grep -nE "(onClick|onChange|onSubmit|onBlur)=\{(\(\)|[a-z]+ =>|\(\) =>)" "$file" 2>/dev/null || true)
      if [ -n "$inline" ]; then
        echo "⚠️  $file may have inline callbacks:"
        echo "$inline"
      fi
    done < <(find "$CLIENT_DIR"/features/*/ui -name '*.tsx' 2>/dev/null)

    # Direct library imports
    while IFS= read -r file; do
      if grep -qE "from '@nivo/|from 'ag-grid" "$file" 2>/dev/null; then
        echo "❌ $file directly imports nivo/ag-grid (use #shared/adapters/)"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(find "$CLIENT_DIR"/features/*/ui -name '*.tsx' 2>/dev/null)
    ;;

  page)
    echo ""
    echo "── page checks ──"

    # Pages should not have business logic imports (store/model internals)
    while IFS= read -r file; do
      if grep -qE "#features/.*/model/|#features/.*/store/|#features/.*/api/" "$file" 2>/dev/null; then
        echo "⚠️  $file imports feature internals (pages should use feature index.ts only)"
      fi
    done < <(find "$CLIENT_DIR"/pages -name '*.tsx' 2>/dev/null)
    ;;

  *)
    echo "❌ Unknown layer: $LAYER"
    echo "Usage: bash scripts/quality/fe-layer-check.sh <model|api|store|ui|page>"
    exit 1
    ;;
esac

# ─── Summary ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo "✅ PASS — $LAYER layer clean"
  exit 0
else
  echo "❌ FAIL — $LAYER layer has $ERRORS error(s). Fix before proceeding."
  exit 1
fi
