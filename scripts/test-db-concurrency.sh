#!/usr/bin/env bash
# Concurrency tests against the LOCAL Supabase DB. Creates throwaway fixtures,
# runs N parallel sessions, asserts invariants, then deletes the fixtures.
set -uo pipefail
C="${SUPABASE_DB_CONTAINER:-supabase_db_ai-marketing-lms}"
q() { docker exec -i "$C" psql -U postgres -d postgres -X -qAt -v ON_ERROR_STOP=1 -c "$1"; }
N=20; fail=0
RUN=$(date +%s%N)

course=$(q "select tests.create_course('conc-$RUN', 30)")
code_id=$(q "select tests.create_code('$course', 'CONC-$RUN', 1)")
users=(); for i in $(seq 1 $N); do users+=("$(q "select tests.create_user('conc$i-$RUN@example.com')")"); done

# 1) N different users race for a single-use code.
for u in "${users[@]}"; do
  docker exec -i "$C" psql -U postgres -d postgres -X -qAt -c "begin; select tests.login_as('$u'); select public.redeem_code('CONC-$RUN'); commit;" >/dev/null 2>&1 &
done; wait
uses=$(q "select current_uses from public.redeem_codes where id='$code_id'")
usages=$(q "select count(*) from public.redeem_code_usages where redeem_code_id='$code_id'")
enr=$(q "select count(*) from public.enrollments where course_id='$course'")
if [ "$uses" = 1 ] && [ "$usages" = 1 ] && [ "$enr" = 1 ]; then echo "ok - concurrent single-use redemption: exactly 1 of $N succeeded"
else echo "not ok - concurrent redemption: uses=$uses usages=$usages enrollments=$enr"; fail=1; fi

# 2) Same user registers 10 different devices in parallel.
u=${users[0]}
for i in $(seq 1 10); do
  docker exec -i "$C" psql -U postgres -d postgres -X -qAt -c "begin; select tests.login_as('$u', tests.create_session('$u')); select public.register_current_device(repeat('$i', 40) || '$RUN', 'dev$i'); commit;" >/dev/null 2>&1 &
done; wait
devs=$(q "select count(*) from public.registered_devices where user_id='$u'")
if [ "$devs" = 2 ]; then echo "ok - concurrent device registration capped at 2 (10 attempts)"
else echo "not ok - concurrent device registration produced $devs devices"; fail=1; fi

# 3) Two admins approve the same payment concurrently.
a1=$(q "select tests.create_user('ca1-$RUN@example.com')"); a2=$(q "select tests.create_user('ca2-$RUN@example.com')")
q "select tests.make_admin('$a1'); select tests.make_admin('$a2');" >/dev/null
s=${users[1]}
pay=$(docker exec -i "$C" psql -U postgres -d postgres -X -qAt -c "begin; select tests.login_as('$s'); select public.submit_manual_payment('$course', 1000); commit;" 2>/dev/null | grep -E '^[0-9a-f-]{36}$')
for a in "$a1" "$a2" "$a1" "$a2"; do
  docker exec -i "$C" psql -U postgres -d postgres -X -qAt -c "begin; select tests.login_as('$a'); select public.approve_manual_payment('$pay'); commit;" >/dev/null 2>&1 &
done; wait
audits=$(q "select count(*) from public.admin_audit_logs where action='approve_payment' and entity_id='$pay'")
if [ "$audits" = 1 ]; then echo "ok - concurrent payment approval applied exactly once"
else echo "not ok - payment approved $audits times"; fail=1; fi

# Cleanup fixtures (local DB only).
q "delete from auth.users where email like '%-$RUN@example.com'; delete from public.courses where id='$course';" >/dev/null
exit $fail
