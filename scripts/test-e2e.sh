#!/usr/bin/env bash
# Local-only browser tests. Uses existing fixtures/helpers, never hosted data.
set -euo pipefail
cd "$(dirname "$0")/.."
if ! STATUS=$(supabase status -o json 2>/dev/null); then
  echo "BLOCKED: local Supabase status unavailable. Check Docker socket permissions and the local stack." >&2
  exit 1
fi
export TEST_SUPABASE_PUBLISHABLE_KEY=$(python3 -Ic "import sys,json;print(json.load(sys.stdin)['PUBLISHABLE_KEY'])" <<<"$STATUS")
export TEST_SUPABASE_SECRET_KEY=$(python3 -Ic "import sys,json;print(json.load(sys.stdin)['SECRET_KEY'])" <<<"$STATUS")
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$TEST_SUPABASE_PUBLISHABLE_KEY
export SUPABASE_SECRET_KEY=$TEST_SUPABASE_SECRET_KEY
export NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
export TEST_APP_URL=http://127.0.0.1:3100
export LMS_SECURITY_VERIFIED=false
npm run build
npx playwright test "$@"
