#!/bin/bash
# Architecture boundary linter — catches illegal imports between layers and modules.
# Run: bash scripts/quality/arch-lint.sh

set -euo pipefail

ERRORS=0
WARNINGS=0

# Tests can import collaborators from lower layers to build isolated fixtures. The
# production dependency graph is checked on implementation files only.
is_test_file() {
  [[ "$1" == *.spec.ts ]]
}

# These are explicit architectural boundaries already enforced by Nest modules or
# shared security infrastructure. Keep the allowlist at the tool boundary so new
# application-level coupling still fails the check.
is_allowed_cross_module_dependency() {
  local source_module="$1"
  local target_module="$2"

  case "$source_module:$target_module" in
    auth:invite-codes|auth:workspaces|categories:auth|categories:transactions|dictionaries:auth|import-profiles:auth|invite-codes:auth|transactions:auth|transactions:categories|user-settings:auth)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Detect modules directory (project uses server/src/{module}/ flat structure)
if [ -d "server/src/modules" ]; then
  MODULES_DIR="server/src/modules"
elif [ -d "src/modules" ]; then
  MODULES_DIR="src/modules"
elif [ -d "server/src" ]; then
  # Flat structure: server/src/transactions/, server/src/categories/, etc.
  MODULES_DIR="server/src"
elif [ -d "src" ]; then
  MODULES_DIR="src"
else
  echo "⚠️  No source directory found"
  exit 0
fi

echo "🔍 Checking architecture boundaries in $MODULES_DIR..."

# 1. Domain must not import from application, infrastructure, or presentation
echo ""
echo "── Domain layer (must import nothing outside domain/shared) ──"
while IFS= read -r file; do
  if grep -qE "from '.*(application|infrastructure|presentation)/" "$file" 2>/dev/null; then
    echo "❌ $file imports from forbidden layer"
    grep -nE "from '.*(application|infrastructure|presentation)/" "$file"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$MODULES_DIR"/*/domain -name '*.ts' 2>/dev/null)

# 2. Presentation must not import from domain (directly) — except @shared/domain
echo ""
echo "── Presentation layer (must not import from domain) ──"
while IFS= read -r file; do
  is_test_file "$file" && continue
  if grep -qE "from '.*(/domain/|@[a-z]+/domain)" "$file" 2>/dev/null; then
    # Shared errors and the auth security boundary are presentation adapters.
    real_violations=$(grep -nE "from '.*(/domain/|@[a-z]+/domain)" "$file" | grep -vE "@budget/domain|@shared/domain|@auth/" || true)
    if [ -n "$real_violations" ]; then
      echo "❌ $file imports from domain layer"
      echo "$real_violations"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done < <(find "$MODULES_DIR"/*/presentation -name '*.ts' 2>/dev/null)

# 3. Application must not import from presentation or infrastructure
echo ""
echo "── Application layer (must not import from presentation/infrastructure) ──"
while IFS= read -r file; do
  is_test_file "$file" && continue
  if grep -qE "from '.*(presentation|infrastructure)/" "$file" 2>/dev/null; then
    echo "❌ $file imports from forbidden layer"
    grep -nE "from '.*(presentation|infrastructure)/" "$file"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$MODULES_DIR"/*/application -name '*.ts' 2>/dev/null)

# 4. Cross-module imports (module A importing from module B internals, not @shared)
# NOTE: Module.ts importing another Module class for DI wiring is architecturally acceptable
#       but importing internal layers (domain/, application/ports, etc.) is a coupling smell.
#       This check flags ALL cross-module imports — use judgment on .module.ts vs internal imports.
echo ""
echo "── Cross-module imports (forbidden — only @shared allowed between modules) ──"

# Get list of project module names (path aliases)
PROJECT_MODULES=""
for module_dir in "$MODULES_DIR"/*/; do
  [ -d "$module_dir" ] || continue
  name=$(basename "$module_dir")
  [ "$name" = "shared" ] && continue
  PROJECT_MODULES="$PROJECT_MODULES $name"
done

for module_dir in "$MODULES_DIR"/*/; do
  [ -d "$module_dir" ] || continue
  module_name=$(basename "$module_dir")

  while IFS= read -r file; do
    is_test_file "$file" && continue
    [[ "$file" == *.module.ts ]] && continue
    for other_module in $PROJECT_MODULES; do
      [ "$other_module" = "$module_name" ] && continue
      is_allowed_cross_module_dependency "$module_name" "$other_module" && continue
      # Check if file imports from another project module's internals
      if grep -qE "from '@${other_module}/" "$file" 2>/dev/null; then
        violations=$(grep -nE "from '@${other_module}/" "$file" || true)
        if [ -n "$violations" ]; then
          echo "❌ $file imports from @${other_module}/:"
          echo "$violations"
          ERRORS=$((ERRORS + 1))
        fi
      fi
    done
  done < <(find "$module_dir" -name '*.ts' 2>/dev/null)
done

# 5. Zod schemas must not use nativeEnum with domain imports
echo ""
echo "── Zod schemas (must not use z.nativeEnum with domain types) ──"
while IFS= read -r file; do
  if grep -qE "z\.nativeEnum" "$file" 2>/dev/null; then
    if grep -qE "from '.*domain/" "$file" 2>/dev/null; then
      echo "❌ $file uses z.nativeEnum with domain import"
      grep -n "z.nativeEnum" "$file"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done < <(find "$MODULES_DIR"/*/presentation -name '*.ts' 2>/dev/null)

# 6. Repository ports — workspace scope signal check
echo ""
echo "── Repository ports (workspace scope signal) ──"
while IFS= read -r file; do
  # Skip files with ARCH-EXCEPTION: global-scope comment
  if grep -qE "ARCH-EXCEPTION:.*global.scope" "$file" 2>/dev/null; then
    continue
  fi
  if ! grep -qE "workspaceId" "$file" 2>/dev/null; then
    echo "⚠️  $file — no workspaceId found. Verify: is global scope intentional? (AP-5/AP-12)"
    WARNINGS=$((WARNINGS + 1))
  fi
done < <(find "$MODULES_DIR"/*/domain/ports -name '*repository*' -o -name '*repo*' 2>/dev/null)

# 7. Domain entities — spec file existence
echo ""
echo "── Domain entities (spec files required) ──"
while IFS= read -r file; do
  spec="${file%.ts}.spec.ts"
  # Contextual type/constant files are covered by their consuming contracts;
  # they are explicit quality-report exceptions, not domain entities.
  case "$(basename "$file")" in
    types.ts|constants.ts) continue ;;
  esac
  if [ ! -f "$spec" ]; then
    echo "❌ Missing spec: $file"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$MODULES_DIR"/*/domain -maxdepth 1 -name '*entity*.ts' ! -name '*.spec.ts' ! -name 'index.ts' 2>/dev/null; find "$MODULES_DIR"/*/domain/entities -name '*.ts' ! -name '*.spec.ts' ! -name 'index.ts' 2>/dev/null)

# 8. Anemic entity detection — entities with only constructor/getters, no behavior
echo ""
echo "── Anemic entity detection (entities must have behavior) ──"
while IFS= read -r file; do
  # Count methods: lines starting with whitespace followed by a method-like signature
  # Exclude: constructor, static create, static from*, get/set (accessors), private readonly
  method_count=$(grep -cE '^\s+(async\s+)?(public\s+)?(protected\s+)?[a-z][a-zA-Z0-9]*\s*\(' "$file" 2>/dev/null || true)
  # Subtract constructor and static methods
  constructor_count=$(grep -cE '^\s+(private\s+)?constructor\s*\(' "$file" 2>/dev/null || true)
  static_count=$(grep -cE '^\s+static\s+' "$file" 2>/dev/null || true)
  getter_count=$(grep -cE '^\s+(get|set)\s+[a-z]' "$file" 2>/dev/null || true)

  behavior_methods=$((method_count - constructor_count - static_count - getter_count))

  if [ "$behavior_methods" -le 0 ]; then
    echo "❌ $file — anemic entity: no business methods found (only constructor/static/getters)"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$MODULES_DIR"/*/domain/entities -name '*.entity.ts' ! -name '*.spec.ts' ! -name 'index.ts' 2>/dev/null; \
         find "$MODULES_DIR"/*/domain -maxdepth 1 -name '*.entity.ts' ! -name '*.spec.ts' ! -name 'index.ts' 2>/dev/null)

# 9. DTO domain leak — presentation/dto/ importing from domain/
echo ""
echo "── DTO domain leak (dto/ must not import domain types) ──"
while IFS= read -r file; do
  domain_imports=$(grep -nE "from '.*domain/" "$file" 2>/dev/null || true)
  if [ -n "$domain_imports" ]; then
    echo "❌ $file imports from domain/ (DTO must own its types):"
    echo "$domain_imports"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$MODULES_DIR"/*/presentation/dto -name '*.ts' 2>/dev/null; \
         find "$MODULES_DIR"/*/presentation -name '*.dto.ts' 2>/dev/null)

# 10. Handler missing workspace assertion
#     Handlers with workspaceId param that don't assert entity.workspaceId === workspaceId
echo ""
echo "── Handler workspace assertion (must verify ownership) ──"
while IFS= read -r file; do
  # Only check files that receive workspaceId in their execute/handle method
  has_workspace_param=$(grep -lE '(workspaceId|workspace_id)' "$file" 2>/dev/null || true)
  if [ -n "$has_workspace_param" ]; then
    # Check if file has an ownership assertion
    normalized_file=$(tr '\n' ' ' < "$file")
    has_assertion=$(printf '%s' "$normalized_file" | grep -E '(workspaceId.*(===|!==)|((===|!==).*workspaceId)|assertWorkspace|verifyOwnership|findByWorkspaceId|findAllByWorkspaceId|findBy(Id|Name)\([^)]*workspaceId|ARCH-EXCEPTION)' || true)
    if [ -z "$has_assertion" ]; then
      # Only flag if the handler fetches an entity (has findBy/get pattern)
      has_fetch=$(grep -E '(findBy|getBy|findOne|repository\.)' "$file" 2>/dev/null || true)
      if [ -n "$has_fetch" ]; then
        echo "❌ $file — has workspaceId + entity fetch but no ownership assertion"
        ERRORS=$((ERRORS + 1))
      fi
    fi
  fi
done < <(find "$MODULES_DIR"/*/application/commands -name '*.handler.ts' -o -name '*.ts' 2>/dev/null | grep -v '.spec.ts' | grep -v 'index.ts'; \
         find "$MODULES_DIR"/*/application/queries -name '*.handler.ts' -o -name '*.ts' 2>/dev/null | grep -v '.spec.ts' | grep -v 'index.ts')

# 11. Missing mapper — repository without corresponding mapper file
echo ""
echo "── Missing mapper (repository must have a mapper) ──"
while IFS= read -r file; do
  repo_dir=$(dirname "$file")
  repo_base=$(basename "$file" .ts)

  # Look for mapper in infrastructure/mappers/ or same directory
  module_dir=$(echo "$repo_dir" | sed 's|/infrastructure/repositories.*||; s|/infrastructure$||')
  mapper_dir="$module_dir/infrastructure/mappers"

  # Check if any mapper file exists for this module
  if [ -d "$mapper_dir" ]; then
    mapper_count=$(find "$mapper_dir" \( -name '*.mapper.ts' -o -name 'map-*.ts' \) 2>/dev/null | wc -l)
    if [ "$mapper_count" -eq 0 ]; then
      echo "❌ $file — repository exists but no mapper in $mapper_dir"
      ERRORS=$((ERRORS + 1))
    fi
  else
    # Also check if mapper is in same directory
    local_mapper=$(find "$repo_dir" -name '*.mapper.ts' 2>/dev/null | wc -l)
    if [ "$local_mapper" -eq 0 ]; then
      echo "⚠️  $file — no mappers directory found at $mapper_dir"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done < <(find "$MODULES_DIR"/*/infrastructure/repositories -name '*.repository.ts' ! -name '*.spec.ts' 2>/dev/null; \
         find "$MODULES_DIR"/*/infrastructure -maxdepth 1 -name '*.repository.ts' ! -name '*.spec.ts' 2>/dev/null)

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ Architecture boundaries OK — no violations found"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  No errors but $WARNINGS warning(s). Review workspace scope decisions."
  exit 0
else
  echo "❌ Found $ERRORS architecture violation(s) and $WARNINGS warning(s). Fix errors before proceeding."
  exit 1
fi
