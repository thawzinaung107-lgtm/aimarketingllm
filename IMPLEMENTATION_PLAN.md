# AI Marketing LMS - Implementation Plan

## Project Overview
Production-ready Learning Management System for onlinelearning.ccone.app
Based on Figma Design: Option 2 V3

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL
- **Authentication**: Google OAuth via Supabase Auth
- **Authorization**: Server-side role-based access control
- **Version Control**: GitHub
- **Deployment**: Docker

## Design Requirements
- English only, Inter typography
- Clean, premium, responsive layout
- White background with charcoal/black accents
- Reuse Figma images and design tokens
- Promotion banner above course cards
- 3-slide promotional carousel (6s autoplay, with pause/next/prev/indicators)
- Desktop and mobile responsive

---

## Phase 1: Project Foundation & Setup ✓

### 1.1 Initialize Project Structure
- [x] Next.js with TypeScript
- [x] Tailwind CSS configuration
- [x] shadcn/ui setup
- [x] Folder structure
- [ ] Environment variables template
- [ ] Git initialization

### 1.2 Database Schema Design
- [ ] Users table (synced with Supabase Auth)
- [ ] Courses table
- [ ] Lessons table
- [ ] Enrollments table
- [ ] Payments table (manual approval)
- [ ] Redeem codes table
- [ ] Progress tracking table
- [ ] Device registrations table
- [ ] Homepage banners table
- [ ] Audit logs table

### 1.3 Core Configuration
- [ ] Supabase client setup (server/client/middleware)
- [ ] Database migrations
- [ ] Row Level Security (RLS) policies
- [ ] TypeScript types generation

---

## Phase 2: Authentication & Authorization

### 2.1 Google OAuth Setup
- [ ] Supabase Auth configuration
- [ ] Google OAuth provider setup
- [ ] Login/logout flow
- [ ] Session management via middleware
- [ ] Protected route wrapper

### 2.2 Role-Based Authorization
- [ ] User roles: student, admin
- [ ] Server-side role checks
- [ ] Admin route protection
- [ ] Student route protection
- [ ] Authorization utilities

---

## Phase 3: Frontend Foundation

### 3.1 Layout & Navigation
- [ ] Root layout with Inter font
- [ ] Main navigation component
- [ ] Footer component
- [ ] Responsive mobile menu
- [ ] User profile dropdown

### 3.2 shadcn/ui Components
- [ ] Button, Input, Card components
- [ ] Dialog, Dropdown, Tabs components
- [ ] Table, Badge, Avatar components
- [ ] Toast notifications
- [ ] Loading states

### 3.3 Homepage
- [ ] Promotional carousel (3 slides, 6s autoplay)
  - Pause on hover
  - Next/Previous controls
  - Slide indicators
- [ ] Promotion banner above courses
- [ ] Course cards grid
- [ ] Responsive layout (desktop + mobile)

---

## Phase 4: Student Features

### 4.1 Browse & Discovery
- [ ] Course listing page
- [ ] Course filtering/search
- [ ] Course detail page
  - Course information
  - Lessons list
  - Enrollment CTA

### 4.2 Enrollment & Payment
- [ ] Manual payment submission form
- [ ] Payment status tracking
- [ ] Redeem code activation
- [ ] Enrollment confirmation

### 4.3 My Courses Dashboard
- [ ] Enrolled courses list
- [ ] Course progress indicators
- [ ] Continue learning CTAs
- [ ] Access expiration warnings

### 4.4 Video Lessons
- [ ] Protected video player
- [ ] Progress tracking (watch time)
- [ ] Resume watching functionality
- [ ] Lesson completion marking
- [ ] Next lesson navigation

### 4.5 Device Management
- [ ] Device registration on first login
- [ ] Maximum 2 devices per user
- [ ] Device list view
- [ ] Device removal (student-initiated)

---

## Phase 5: Admin Features

### 5.1 Admin Dashboard
- [ ] Overview statistics
  - Total students
  - Active enrollments
  - Pending payments
  - Revenue metrics
- [ ] Recent activity feed
- [ ] Quick actions panel

### 5.2 Course Management
- [ ] Course CRUD operations
- [ ] Course listing with filters
- [ ] Course form (title, description, image, price, duration)
- [ ] Lesson management
  - Lesson CRUD
  - Video upload/link
  - Lesson ordering
- [ ] Course publishing workflow

### 5.3 Payment Approval
- [ ] Pending payments queue
- [ ] Payment details view
- [ ] Approve/reject actions
- [ ] Payment history

### 5.4 Redeem Code Management
- [ ] Generate redeem codes
- [ ] Code configuration
  - Course assignment
  - Usage limit
  - Expiration date
- [ ] Code usage tracking
- [ ] Deactivate codes

### 5.5 Student Management
- [ ] Student listing with search
- [ ] Student profile view
- [ ] Enrollment history
- [ ] Manual enrollment creation
- [ ] Access extension/revocation

### 5.6 Device Management
- [ ] View all device registrations
- [ ] Force device removal (admin action)
- [ ] Device activity logs

### 5.7 Homepage Banner Management
- [ ] Banner CRUD operations
- [ ] Image upload
- [ ] Banner ordering
- [ ] Active/inactive status
- [ ] Link configuration

### 5.8 Audit Logs
- [ ] Activity logging
  - User actions
  - Admin actions
  - System events
- [ ] Log filtering/search
- [ ] Export functionality

---

## Phase 6: Security & Optimization

### 6.1 Security
- [ ] Row Level Security policies
- [ ] Server-side authorization checks
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens where needed
- [ ] Rate limiting

### 6.2 Performance
- [ ] Image optimization (next/image)
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Database query optimization
- [ ] Caching strategy
- [ ] CDN for static assets

### 6.3 Testing
- [ ] Unit tests (critical utilities)
- [ ] Integration tests (auth flow)
- [ ] E2E tests (user journeys)
- [ ] Database migration tests

---

## Phase 7: Deployment & DevOps

### 7.1 Docker Setup
- [ ] Dockerfile
- [ ] docker-compose.yml
- [ ] Environment configuration
- [ ] Build optimization

### 7.2 CI/CD
- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] Automated migrations
- [ ] Deployment pipeline

### 7.3 Monitoring
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Log aggregation

---

## Phase 8: Documentation & Handoff

### 8.1 Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Admin user guide

### 8.2 Production Readiness
- [ ] Environment variables configured
- [ ] Domain DNS configuration (requires approval)
- [ ] SSL certificates
- [ ] Backup strategy
- [ ] Disaster recovery plan

---

## Implementation Order

1. **Phase 1**: Foundation (current)
2. **Phase 2**: Authentication
3. **Phase 3**: Frontend Foundation (Homepage, Carousel, Layout)
4. **Phase 4**: Student Features (Browse → Enroll → Learn)
5. **Phase 5**: Admin Features (Dashboard → Course Management → Other Admin Tools)
6. **Phase 6**: Security & Optimization
7. **Phase 7**: Deployment
8. **Phase 8**: Documentation

---

## Important Constraints

- ❌ Do NOT deploy to production without approval
- ❌ Do NOT configure public domain (onlinelearning.ccone.app) without approval
- ❌ Do NOT invent prices, promotions, or access durations
- ✅ Use secure defaults
- ✅ Use database migrations
- ✅ Write automated tests
- ✅ Build reusable components
- ✅ Follow Figma design exactly

---

## Next Steps

1. Create environment variables template
2. Design database schema
3. Create database migrations
4. Set up Supabase connection
5. Implement authentication flow
6. Build homepage with carousel
7. Continue with student features
