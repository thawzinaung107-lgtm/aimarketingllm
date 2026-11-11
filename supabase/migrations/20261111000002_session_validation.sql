-- Server-side session validation.
-- auth.getClaims() verifies the JWT signature only, so a revoked session
-- (sign-out, device removal, admin revocation) keeps a valid-looking JWT until
-- it expires. The app calls current_session_is_active() on every
-- authenticated server request so revocation takes effect immediately.
create or replace function public.current_session_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.sessions s
    where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
      and s.user_id = auth.uid()
      and (s.not_after is null or s.not_after > now())
  );
$$;
revoke execute on function public.current_session_is_active() from public, anon;
grant execute on function public.current_session_is_active() to authenticated;

-- Playback and progress already require a session bound to a registered device;
-- bound sessions are deleted on device removal, so they are covered too.
