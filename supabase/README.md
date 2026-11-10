# Database Schema Documentation

## Overview

The AI Marketing LMS uses Supabase PostgreSQL with Row Level Security (RLS) to ensure data security and proper authorization.

## Tables

### profiles
Extends Supabase auth.users with additional profile information.

**Columns:**
- `id` (UUID, PK) - References auth.users(id)
- `email` (TEXT, UNIQUE) - User email
- `full_name` (TEXT) - User's full name
- `role` (user_role) - Either 'student' or 'admin'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view and update their own profile
- Admins can view and update all profiles

### courses
Main course catalog.

**Columns:**
- `id` (UUID, PK)
- `title` (TEXT) - Course title
- `slug` (TEXT, UNIQUE) - URL-friendly identifier
- `description` (TEXT) - Course description
- `thumbnail_url` (TEXT) - Course thumbnail image
- `price` (DECIMAL) - Course price
- `access_duration_days` (INTEGER) - How long students have access
- `is_published` (BOOLEAN) - Visibility control
- `display_order` (INTEGER) - Sort order
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Anyone can view published courses
- Admins can view and manage all courses

### course_modules
Optional grouping of lessons within a course.

**Columns:**
- `id` (UUID, PK)
- `course_id` (UUID, FK) - References courses(id)
- `title` (TEXT) - Module title
- `description` (TEXT) - Module description
- `display_order` (INTEGER) - Sort order
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### lessons
Individual video lessons.

**Columns:**
- `id` (UUID, PK)
- `course_id` (UUID, FK) - References courses(id)
- `module_id` (UUID, FK) - References course_modules(id), nullable
- `title` (TEXT) - Lesson title
- `description` (TEXT) - Lesson description
- `video_url` (TEXT) - Video URL
- `duration_seconds` (INTEGER) - Video length
- `display_order` (INTEGER) - Sort order
- `is_published` (BOOLEAN) - Visibility control
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view published lessons of published courses
- Admins can manage all lessons

### enrollments
Tracks student course enrollments.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles(id)
- `course_id` (UUID, FK) - References courses(id)
- `status` (enrollment_status) - 'pending_payment', 'active', 'expired', 'cancelled'
- `enrolled_at` (TIMESTAMPTZ) - When enrollment became active
- `expires_at` (TIMESTAMPTZ) - When access expires
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, course_id) - One enrollment per user per course

**RLS Policies:**
- Users can view and create their own enrollments
- Admins can view and manage all enrollments

### lesson_progress
Tracks individual lesson progress and watch time.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles(id)
- `lesson_id` (UUID, FK) - References lessons(id)
- `enrollment_id` (UUID, FK) - References enrollments(id)
- `watched_seconds` (INTEGER) - Total watched time
- `is_completed` (BOOLEAN) - Completion status
- `last_watched_at` (TIMESTAMPTZ) - Last viewing timestamp
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, lesson_id, enrollment_id)

**RLS Policies:**
- Users can view and update their own progress
- Admins can view all progress

### manual_payments
Manual payment submissions for course enrollment.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles(id)
- `course_id` (UUID, FK) - References courses(id)
- `enrollment_id` (UUID, FK) - References enrollments(id), nullable
- `amount` (DECIMAL) - Payment amount
- `payment_proof_url` (TEXT) - Receipt/proof image
- `payment_notes` (TEXT) - Student notes
- `status` (payment_status) - 'pending', 'approved', 'rejected'
- `submitted_at` (TIMESTAMPTZ) - Submission timestamp
- `reviewed_at` (TIMESTAMPTZ) - Review timestamp
- `reviewed_by` (UUID, FK) - Admin who reviewed
- `admin_notes` (TEXT) - Admin review notes
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own payments and submit new ones
- Admins can view and manage all payments

### redeem_codes
Promotional codes for course enrollment.

**Columns:**
- `id` (UUID, PK)
- `code` (TEXT, UNIQUE) - The redemption code
- `course_id` (UUID, FK) - References courses(id)
- `max_uses` (INTEGER) - Maximum redemptions
- `current_uses` (INTEGER) - Current redemption count
- `expires_at` (TIMESTAMPTZ) - Expiration date
- `is_active` (BOOLEAN) - Active status
- `created_by` (UUID, FK) - Admin who created it
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- CHECK(current_uses <= max_uses)

**RLS Policies:**
- Users can view active, non-expired codes
- Admins can manage all codes

### redeem_code_usages
Tracks code redemptions.

**Columns:**
- `id` (UUID, PK)
- `redeem_code_id` (UUID, FK) - References redeem_codes(id)
- `user_id` (UUID, FK) - References profiles(id)
- `enrollment_id` (UUID, FK) - References enrollments(id)
- `redeemed_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(redeem_code_id, user_id) - One use per user per code

### registered_devices
Device tracking for two-device limit.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles(id)
- `device_fingerprint` (TEXT) - Unique device identifier
- `device_name` (TEXT) - User-friendly device name
- `user_agent` (TEXT) - Browser user agent
- `ip_address` (TEXT) - IP address
- `last_used_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, device_fingerprint)
- Trigger enforces max 2 devices per user

**RLS Policies:**
- Users can view, register, and remove their own devices
- Admins can view and manage all devices

### user_sessions
Active session tracking.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles(id)
- `device_id` (UUID, FK) - References registered_devices(id)
- `session_token` (TEXT, UNIQUE) - Session identifier
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### homepage_banners
Promotional carousel slides.

**Columns:**
- `id` (UUID, PK)
- `title` (TEXT) - Banner title
- `description` (TEXT) - Banner description
- `image_url` (TEXT) - Banner image
- `link_url` (TEXT) - Optional link
- `display_order` (INTEGER) - Sort order
- `is_active` (BOOLEAN) - Active status
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Anyone can view active banners
- Admins can manage all banners

### admin_audit_logs
Audit trail for admin actions.

**Columns:**
- `id` (UUID, PK)
- `admin_id` (UUID, FK) - References profiles(id)
- `action` (TEXT) - Action description
- `entity_type` (TEXT) - Type of entity modified
- `entity_id` (UUID) - ID of modified entity
- `old_values` (JSONB) - Previous state
- `new_values` (JSONB) - New state
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Only admins can view and create audit logs

## Helper Functions

### redeem_code(p_code TEXT, p_user_id UUID)
Atomically redeems a code and creates/updates enrollment.

**Returns:** UUID (enrollment_id)

**Exceptions:**
- Invalid redeem code
- Redeem code is inactive
- Redeem code has expired
- Redeem code has reached maximum usage
- You have already used this redeem code

### approve_manual_payment(p_payment_id UUID, p_admin_id UUID, p_admin_notes TEXT)
Approves a payment and creates/updates enrollment.

**Returns:** UUID (enrollment_id)

**Exceptions:**
- Payment not found
- Payment has already been reviewed

### check_expired_enrollments()
Marks expired enrollments. Should be run periodically (e.g., daily).

### cleanup_expired_sessions()
Removes expired sessions. Should be run periodically.

### log_admin_action(...)
Creates an audit log entry.

**Returns:** UUID (log_id)

## Maintenance

### Periodic Tasks
These should be scheduled via application or pg_cron:

1. **Daily:** Run `check_expired_enrollments()` to mark expired courses
2. **Hourly:** Run `cleanup_expired_sessions()` to clean up old sessions
3. **Monitor:** Check redeem code usage and device registrations

### Indexes
All foreign keys, status fields, and commonly queried columns have indexes for optimal performance.

### Security
- All tables have RLS enabled
- Students can only access their own data
- Admins have full access
- All sensitive operations are server-side only
