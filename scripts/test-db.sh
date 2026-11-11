#!/usr/bin/env bash
# Runs pgTAP tests against the LOCAL Supabase database only.
# Usage: scripts/test-db.sh            (assumes `supabase start` is running)
set -uo pipefail
CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_ai-marketing-lms}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/supabase/tests/database"
fail=0; total=0; failed=0
for f in "$DIR"/*.sql; do
  out=$(docker exec -i "$CONTAINER" psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 -At < "$f" 2>&1)
  rc=$?
  n_ok=$(grep -cE '^ok ' <<<"$out"); n_bad=$(grep -cE '^not ok ' <<<"$out")
  total=$((total + n_ok + n_bad)); failed=$((failed + n_bad))
  if [ $rc -ne 0 ] || [ "$n_bad" -gt 0 ] || grep -q '# Looks like' <<<"$out"; then
    fail=1; echo "FAIL $(basename "$f")"; echo "$out" | grep -vE '^ok ' | sed 's/^/    /'
  else
    echo "PASS $(basename "$f") ($n_ok assertions)"
  fi
done
if [ "$total" -eq 0 ]; then
  echo "BLOCKED: no database assertions executed (not a passing result)."
  fail=1
fi
echo "TOTAL: $total assertions, $failed failed; runner failure=$fail"
exit $fail
