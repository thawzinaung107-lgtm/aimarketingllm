# AI Marketing LMS

A production-ready Learning Management System built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL
- **Authentication**: Email/password via Supabase Auth
- **Deployment**: Docker

## Status

Not production-ready. See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for verified status and open gaps.
The homepage is a placeholder: it has **not** been built from the Figma Option 2 V3 design.

## Getting Started

### Prerequisites

- Node.js 22+ (`.nvmrc`)
- Docker (for the local Supabase stack)
- Supabase CLI

### Local setup

```bash
npm install
cp .env.example .env.local      # fill in values from `supabase status`
supabase start -x vector,logflare,imgproxy,studio,mailpit,edge-runtime,realtime,storage-api,supavisor,postgres-meta
supabase db reset               # applies all migrations to the LOCAL database
npm run dev
```

Google sign-in needs credentials: see [SETUP_GOOGLE_OAUTH.md](SETUP_GOOGLE_OAUTH.md).

### Tests

```bash
npm run test:db           # pgTAP RLS/security tests + concurrency tests (local DB)
npm run typecheck
npm run lint
npm test                  # unit tests
npm run test:integration  # production build + auth/API tests against local Supabase
```

## Project Structure

```
ai-marketing-lms/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (student)/         # Student-facing pages
│   ├── (admin)/           # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── supabase/             # Database migrations and types
└── public/               # Static assets
```

## Planned Features (most not built yet — see SECURITY_AUDIT.md for what exists)

### Student Features
- Browse courses and view details
- Enroll via payment or redeem code
- Watch video lessons with progress tracking
- Resume watching from last position
- Track learning progress
- Device management (max 2 devices)
- Time-limited course access

### Admin Features
- Dashboard with analytics
- Course and lesson management
- Manual payment approval
- Redeem code generation and management
- Student and enrollment management
- Device management
- Homepage banner management
- Audit logs

## Security

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## Documentation

- [Implementation Plan](IMPLEMENTATION_PLAN.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Google OAuth Setup](SETUP_GOOGLE_OAUTH.md)
- [Database Schema](supabase/README.md)

## License

Private - All Rights Reserved
