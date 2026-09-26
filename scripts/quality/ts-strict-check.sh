#!/bin/bash
# The AST scan applies the same report rules to production sources and tests.
set -euo pipefail
SCOPE="${1:-all}"
case "$SCOPE" in
  be|fe|all) node scripts/quality/ts-strict-ast-check.cjs "$SCOPE" ;;
  *) echo 'Usage: ts-strict-check.sh [be|fe|all]' >&2; exit 1 ;;
esac
