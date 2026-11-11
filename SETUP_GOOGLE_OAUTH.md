# Google OAuth setup (requires the project owner)

I can't do these steps; they need your Google Cloud and Supabase accounts.

## 1. Google Cloud Console
1. Go to **APIs & Services → OAuth consent screen**. Choose External, enter the app name and support email, and add the scopes `openid`, `email`, and `profile`.
2. Go to **Credentials → Create credentials → OAuth client ID**, and choose **Web application**.
3. Add these **Authorized redirect URIs**, one per environment:
   - Local: `http://127.0.0.1:54321/auth/v1/callback`
   - Staging/production: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client secret.

## 2. Supabase (hosted, for each environment)
1. Go to **Authentication → Providers → Google**. Enable it, then paste the Client ID and secret.
2. Go to **Authentication → Providers → Email** and **disable** it (Google-only sign-in).
3. Go to **Authentication → URL Configuration**:
   - Site URL: the app URL for that environment.
   - Redirect URLs: `<app-url>/auth/callback` only.

## 3. Local development
Put these in `.env.local` (never commit it), then restart the stack with `supabase stop && supabase start`:
```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
```

## 4. Not yet done
- Configure the production domain (`onlinelearning.ccone.app`). **This needs your approval.**
- Test a real Google sign-in end to end once credentials exist.
