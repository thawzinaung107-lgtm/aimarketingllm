#!/usr/bin/env bash
# Builds the app and runs integration tests against the LOCAL Supabase stack.
set -euo pipefail
cd "$(dirname "$0")/.."
STATUS=$(supabase status -o json 2>/dev/null)
export TEST_SUPABASE_PUBLISHABLE_KEY=$(python3 -Ic "import sys,json;print(json.load(sys.stdin)['PUBLISHABLE_KEY'])" <<<"$STATUS")
export TEST_SUPABASE_SECRET_KEY=$(python3 -Ic "import sys,json;print(json.load(sys.stdin)['SECRET_KEY'])" <<<"$STATUS")
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$TEST_SUPABASE_PUBLISHABLE_KEY
export NEXT_PUBLIC_APP_URL=http://localhost:3100
npx next build
npx vitest run --project integration "$@"
