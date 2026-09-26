#!/bin/bash
# Backend quality gate — single entry point for all BE checks.
# Run: bash scripts/quality/be-quality-gate.sh
#
# Executes in order:
#   1. TypeScript compilation (tsc --noEmit)
#   2. ESLint
#   3. Architecture boundary lint (arch-lint.sh)
#   4. TypeScript strict patterns (ts-strict-check.sh be)
#   5. Jest unit tests (PostgreSQL integration is a separate provisioned gate)
#
# Exits with 1 if ANY step fails. Reports all failures (doesn't stop at first).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0
TOTAL_STEPS=5

# Detect BE root directory
if [ -d "server" ]; then
  BE_ROOT="server"
  SRC_DIR="server/src"
elif [ -d "src/modules" ]; then
  BE_ROOT="."
  SRC_DIR="src"
else
  echo "⚠️  No backend source directory found (expected server/ or src/modules/)"
  exit 0
fi

echo "═══════════════════════════════════════════════════════"
echo "  Backend Quality Gate"
echo "  Root: $BE_ROOT | Source: $SRC_DIR"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── Step 1: TypeScript compilation ───────────────────────────
echo "── [1/$TOTAL_STEPS] TypeScript compilation ──"
if (cd "$BE_ROOT" && npx tsc --noEmit 2>&1); then
  echo "✅ tsc --noEmit PASSED"
else
  echo "❌ tsc --noEmit FAILED"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# ─── Step 2: ESLint ──────────────────────────────────────────
echo "── [2/$TOTAL_STEPS] ESLint ──"
if (cd "$BE_ROOT" && npx eslint src/ 2>&1); then
  echo "✅ ESLint PASSED"
else
  echo "❌ ESLint FAILED"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# ─── Step 3: Architecture boundary lint ─────────────────────
echo "── [3/$TOTAL_STEPS] Architecture boundaries (arch-lint.sh) ──"
if bash "$SCRIPT_DIR/arch-lint.sh" 2>&1; then
  echo "✅ arch-lint PASSED"
else
  echo "❌ arch-lint FAILED"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# ─── Step 4: TypeScript strict patterns ─────────────────────
echo "── [4/$TOTAL_STEPS] TypeScript strict patterns (ts-strict-check.sh be) ──"
if bash "$SCRIPT_DIR/ts-strict-check.sh" be 2>&1; then
  echo "✅ ts-strict-check PASSED"
else
  echo "❌ ts-strict-check FAILED"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# ─── Step 5: Jest tests ──────────────────────────────────────
echo "── [5/$TOTAL_STEPS] Jest tests ──"
# Keep the gate deterministic in clean environments. These fallback values are
# test-only secrets and are overridden when the caller supplies real test config.
if (cd "$BE_ROOT" && JWT_SECRET="${JWT_SECRET:-ci-test-secret-with-at-least-32-characters}" JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-ci-refresh-secret-with-at-least-32-characters}" npm run test -- --runInBand --passWithNoTests --silent 2>&1); then
  echo "✅ Jest unit gate PASSED"
else
  echo "❌ Jest unit gate FAILED"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# ─── Summary ─────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════"
PASSED=$((TOTAL_STEPS - FAILURES))
if [ $FAILURES -eq 0 ]; then
  echo "✅ Backend quality gate PASSED — $PASSED/$TOTAL_STEPS steps clean"
  exit 0
else
  echo "❌ Backend quality gate FAILED — $PASSED/$TOTAL_STEPS passed, $FAILURES failed"
  exit 1
fi
