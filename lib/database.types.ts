// Database types generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'admin'
export type EnrollmentStatus = 'pending_payment' | 'active' | 'expired' | 'cancelled'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          thumbnail_url: string | null
          price: number | null
          access_duration_days: number
          is_published: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number | null
          access_duration_days?: number
          is_published?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number | null
          access_duration_days?: number
          is_published?: boolean
          display_order?: number
          updated_at?: string
        }
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          display_order?: number
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          module_id: string | null
          title: string
          description: string | null
          video_url: string
          duration_seconds: number | null
          display_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          module_id?: string | null
          title: string
          description?: string | null
          video_url: string
          duration_seconds?: number | null
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          module_id?: string | null
          title?: string
          description?: string | null
          video_url?: string
          duration_seconds?: number | null
          display_order?: number
          is_published?: boolean
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: EnrollmentStatus
          enrolled_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: EnrollmentStatus
          enrolled_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: EnrollmentStatus
          enrolled_at?: string | null
          expires_at?: string | null
          updated_at?: string
        }
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          enrollment_id: string
          watched_seconds: number
          is_completed: boolean
          last_watched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          enrollment_id: string
          watched_seconds?: number
          is_completed?: boolean
          last_watched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          enrollment_id?: string
          watched_seconds?: number
          is_completed?: boolean
          last_watched_at?: string | null
          updated_at?: string
        }
      }
      manual_payments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrollment_id: string | null
          amount: number
          payment_proof_url: string | null
          payment_notes: string | null
          status: PaymentStatus
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrollment_id?: string | null
          amount: number
          payment_proof_url?: string | null
          payment_notes?: string | null
          status?: PaymentStatus
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrollment_id?: string | null
          amount?: number
          payment_proof_url?: string | null
          payment_notes?: string | null
          status?: PaymentStatus
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
          updated_at?: string
        }
      }
      redeem_codes: {
        Row: {
          id: string
          code: string
          course_id: string
          max_uses: number
          current_uses: number
          expires_at: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          course_id: string
          max_uses?: number
          current_uses?: number
          expires_at?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          course_id?: string
          max_uses?: number
          current_uses?: number
          expires_at?: string | null
          is_active?: boolean
          created_by?: string
          updated_at?: string
        }
      }
      redeem_code_usages: {
        Row: {
          id: string
          redeem_code_id: string
          user_id: string
          enrollment_id: string
          redeemed_at: string
        }
        Insert: {
          id?: string
          redeem_code_id: string
          user_id: string
          enrollment_id: string
          redeemed_at?: string
        }
        Update: {
          id?: string
          redeem_code_id?: string
          user_id?: string
          enrollment_id?: string
          redeemed_at?: string
        }
      }
      registered_devices: {
        Row: {
          id: string
          user_id: string
          device_fingerprint: string
          device_name: string | null
          user_agent: string | null
          ip_address: string | null
          last_used_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_fingerprint: string
          device_name?: string | null
          user_agent?: string | null
          ip_address?: string | null
          last_used_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_fingerprint?: string
          device_name?: string | null
          user_agent?: string | null
          ip_address?: string | null
          last_used_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          device_id: string
          session_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          session_token: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          session_token?: string
          expires_at?: string
          updated_at?: string
        }
      }
      homepage_banners: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          link_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Functions: {
      redeem_code: {
        Args: {
          p_code: string
          p_user_id: string
        }
        Returns: string
      }
      approve_manual_payment: {
        Args: {
          p_payment_id: string
          p_admin_id: string
          p_admin_notes?: string
        }
        Returns: string
      }
      check_expired_enrollments: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      log_admin_action: {
        Args: {
          p_admin_id: string
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: string
      }
    }
  }
}
