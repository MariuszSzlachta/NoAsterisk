#!/bin/bash
# Frontend architecture & convention linter — catches boundary violations, style issues, convention breaks.
# Run: bash scripts/quality/fe-quality-gate.sh

set -euo pipefail

CLIENT_DIR="client/src"
ERRORS=0
WARNINGS=0

if [ ! -d "$CLIENT_DIR" ]; then
  echo "⚠️  No client/src directory found"
  exit 0
fi

echo "🔍 Frontend quality gate — checking $CLIENT_DIR..."

# ═══════════════════════════════════════════════════════════════
# 1. TypeScript compilation
# ═══════════════════════════════════════════════════════════════
echo ""
echo "── TypeScript compilation ──"
if (cd client && npx tsc --noEmit 2>&1); then
  echo "✅ tsc --noEmit passed"
else
  echo "❌ TypeScript compilation failed"
  ERRORS=$((ERRORS + 1))
fi

if [ -f client/tsconfig.vault-v2-tests.json ]; then
  if (cd client && npx tsc --project tsconfig.vault-v2-tests.json 2>&1); then
    echo "✅ Vault v2 test types passed"
  else
    echo "❌ Vault v2 test types failed"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ═══════════════════════════════════════════════════════════════
# 2. FSD boundary violations
# ═══════════════════════════════════════════════════════════════
echo ""
echo "── FSD boundary violations ──"

# 2a. Feature importing from another feature
for feature_dir in "$CLIENT_DIR"/features/*/; do
  [ -d "$feature_dir" ] || continue
  feature_name=$(basename "$feature_dir")

  while IFS= read -r file; do
    other_features=$(grep -nE "from '#features/" "$file" 2>/dev/null | grep -v "#features/${feature_name}" || true)
    if [ -n "$other_features" ]; then
      echo "❌ $file imports from another feature:"
      echo "$other_features"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(find "$feature_dir" -name '*.ts' -o -name '*.tsx' 2>/dev/null | grep -v node_modules)
done

# 2b. model/ importing React, api/, store/, ui/
while IFS= read -r file; do
  if grep -qE "from 'react'|from \"react\"" "$file" 2>/dev/null; then
    echo "❌ $file (model/) imports React"
    ERRORS=$((ERRORS + 1))
  fi
  if grep -qE "from '.*(\/api\/|\/store\/|\/ui\/)" "$file" 2>/dev/null; then
    echo "❌ $file (model/) imports from api/store/ui layer"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR"/features/*/model -name '*.ts' 2>/dev/null)

# 2c. store/ importing from ui/
while IFS= read -r file; do
  if grep -qE "from '.*/ui/" "$file" 2>/dev/null; then
    echo "❌ $file (store/) imports from ui/ layer"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR"/features/*/store -name '*.ts' 2>/dev/null)

# 2d. Direct nivo/ag-grid imports in features (should use shared/adapters/)
while IFS= read -r file; do
  if grep -qE "from '@nivo/|from 'ag-grid|from \"@nivo/|from \"ag-grid" "$file" 2>/dev/null; then
    echo "❌ $file directly imports nivo/ag-grid (use #shared/adapters/)"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR"/features -name '*.ts' -o -name '*.tsx' 2>/dev/null)

# ═══════════════════════════════════════════════════════════════
# 3. Style violations
# ═══════════════════════════════════════════════════════════════
echo ""
echo "── Style violations ──"

# 3a. Hardcoded hex colors in className
while IFS= read -r file; do
  hex_matches=$(grep -nE "(bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]" "$file" 2>/dev/null || true)
  if [ -n "$hex_matches" ]; then
    echo "❌ $file has hardcoded hex colors:"
    echo "$hex_matches"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR" -name '*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.stories.')

# 3b. Inline style={{}} (except dynamic computed values)
while IFS= read -r file; do
  # Allow style={{ width: `${...}%` }} but flag static style={{}}
  style_matches=$(grep -nE "style=\{\{" "$file" 2>/dev/null || true)
  if [ -n "$style_matches" ]; then
    # Check if it's dynamic (has template literal or variable)
    static_styles=$(echo "$style_matches" | grep -v '`\$' | grep -v "style={{ width:" | grep -v "style={{ height:" || true)
    if [ -n "$static_styles" ]; then
      echo "⚠️  $file has inline style={{}} — verify it's dynamic:"
      echo "$static_styles"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done < <(find "$CLIENT_DIR" -name '*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.stories.')

# ═══════════════════════════════════════════════════════════════
# 4. Convention violations
# ═══════════════════════════════════════════════════════════════
echo ""
echo "── Convention violations ──"

# 4a. function keyword in components/hooks (should be arrow)
while IFS= read -r file; do
  func_exports=$(grep -nE "^export function |^export default function " "$file" 2>/dev/null || true)
  if [ -n "$func_exports" ]; then
    echo "❌ $file uses function keyword (use arrow):"
    echo "$func_exports"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR" -name '*.tsx' -o -name '*.ts' 2>/dev/null | grep -v node_modules | grep -v '.spec.' | grep -v '.stories.' | grep -v 'index.ts' | grep -v '.d.ts')

# 4b. Multiple component exports from single .tsx file
while IFS= read -r file; do
  export_count=$(grep -cE "^export const [A-Z]" "$file" 2>/dev/null || true)
  export_count=${export_count:-0}
  if [ "$export_count" -gt 1 ]; then
    echo "❌ $file exports $export_count components (max 1 per file)"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR" -name '*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.stories.' | grep -v 'index.ts')

# 4c. .tsx/.ts files in features without index.ts barrel in parent dir
while IFS= read -r dir; do
  [ -d "$dir" ] || continue
  # Skip if dir only has index.ts or is the feature root
  has_ts=$(find "$dir" -maxdepth 1 \( -name '*.ts' -o -name '*.tsx' \) ! -name 'index.ts' | head -1)
  if [ -n "$has_ts" ] && [ ! -f "$dir/index.ts" ]; then
    echo "❌ $dir has TS files but no index.ts barrel"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR"/features -type d -mindepth 3 2>/dev/null)

# 4d. Inline callbacks in JSX (basic detection)
while IFS= read -r file; do
  inline_callbacks=$(grep -nE "(onClick|onChange|onSubmit|onBlur|onFocus)=\{(\(\)|[a-z]+ =>|\(\) =>)" "$file" 2>/dev/null || true)
  if [ -n "$inline_callbacks" ]; then
    echo "⚠️  $file has inline callbacks:"
    echo "$inline_callbacks"
    WARNINGS=$((WARNINGS + 1))
  fi
done < <(find "$CLIENT_DIR"/features -name '*.tsx' 2>/dev/null | grep -v '.stories.')

# 4e. Relative imports (should use # aliases)
while IFS= read -r file; do
  # Match imports with ../ patterns (2+ levels deep = definitely wrong)
  relative_imports=$(grep -nE "from '\.\./\.\." "$file" 2>/dev/null || true)
  if [ -n "$relative_imports" ]; then
    echo "❌ $file has deep relative imports (use # aliases):"
    echo "$relative_imports"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$CLIENT_DIR" -name '*.ts' -o -name '*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.spec.' | grep -v '.stories.')

# 4f. Raw DTO in ui/ components — ui/ should not import from api/ directly
while IFS= read -r file; do
  # Check if ui/ file imports from api/ (should go through hooks)
  api_imports=$(grep -nE "from '.*/api/(?!.*hooks)" "$file" 2>/dev/null || true)
  # Broader check: import types directly from api layer
  api_type_imports=$(grep -nE "from '#features/.*/api/" "$file" 2>/dev/null | grep -v "hooks" || true)
  if [ -n "$api_type_imports" ]; then
    echo "⚠️  $file (ui/) imports directly from api/ (use hooks or model/ types):"
    echo "$api_type_imports"
    WARNINGS=$((WARNINGS + 1))
  fi
done < <(find "$CLIENT_DIR"/features/*/ui -name '*.tsx' 2>/dev/null | grep -v '.stories.')

# ═══════════════════════════════════════════════════════════════
# 5. TypeScript strict patterns (cross-cutting)
# ═══════════════════════════════════════════════════════════════
echo ""
echo "── TypeScript strict patterns (ts-strict-check.sh fe) ──"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if bash "$SCRIPT_DIR/ts-strict-check.sh" fe 2>&1; then
  echo "✅ ts-strict-check PASSED"
else
  echo "❌ ts-strict-check FAILED"
  ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════════════
# 6. Summary
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ Frontend quality gate PASSED — no violations"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  No errors but $WARNINGS warning(s). Review manually."
  exit 0
else
  echo "❌ Found $ERRORS error(s) and $WARNINGS warning(s). Fix errors before proceeding."
  exit 1
fi
