# AI Marketing LMS

A production-ready Learning Management System built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL
- **Authentication**: Google OAuth via Supabase Auth
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Configure your Supabase project:
   - Create a project at https://app.supabase.com
   - Get your project URL and anon key from Settings > API
   - Update `.env.local` with your credentials

3. Configure Google OAuth:
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable Google provider
   - Follow the setup instructions for Google Cloud Console
   - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
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

## Features

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

- Server-side role-based authorization
- Row Level Security (RLS) policies
- Google OAuth only (no password authentication)
- Device limit enforcement
- Secure payment approval workflow

## Documentation

- [Implementation Plan](IMPLEMENTATION_PLAN.md)
- [Database Schema](supabase/README.md)

## License

Private - All Rights Reserved
