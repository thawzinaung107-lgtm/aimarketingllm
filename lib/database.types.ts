
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit_logs": {
                  Row: {
                    "action": string,"admin_id": string | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": string,"ip_address": string | null,"new_values": Json | null,"old_values": Json | null,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: string,"ip_address"?: string | null,"new_values"?: Json | null,"old_values"?: Json | null,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"admin_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: string,"ip_address"?: string | null,"new_values"?: Json | null,"old_values"?: Json | null,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_logs_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"course_modules": {
                  Row: {
                    "course_id": string,"created_at": string,"description": string | null,"display_order": number,"id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"description"?: string | null,"display_order"?: number,"id"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"description"?: string | null,"display_order"?: number,"id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_modules_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "access_duration_days": number | null,"created_at": string,"currency": string | null,"description": string | null,"display_order": number,"id": string,"is_published": boolean,"price": number | null,"slug": string,"thumbnail_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access_duration_days"?: number | null,"created_at"?: string,"currency"?: string | null,"description"?: string | null,"display_order"?: number,"id"?: string,"is_published"?: boolean,"price"?: number | null,"slug": string,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "access_duration_days"?: number | null,"created_at"?: string,"currency"?: string | null,"description"?: string | null,"display_order"?: number,"id"?: string,"is_published"?: boolean,"price"?: number | null,"slug"?: string,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"device_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"device_id": string | null,"event": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"device_id"?: string | null,"event": string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"device_id"?: string | null,"event"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "device_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "device_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"enrollments": {
                  Row: {
                    "course_id": string,"created_at": string,"enrolled_at": string | null,"expires_at": string | null,"id": string,"source": string | null,"status": Database["public"]['Enums']["enrollment_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"enrolled_at"?: string | null,"expires_at"?: string | null,"id"?: string,"source"?: string | null,"status"?: Database["public"]['Enums']["enrollment_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"enrolled_at"?: string | null,"expires_at"?: string | null,"id"?: string,"source"?: string | null,"status"?: Database["public"]['Enums']["enrollment_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enrollments_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"homepage_banners": {
                  Row: {
                    "created_at": string,"description": string | null,"display_order": number,"id": string,"image_url": string,"is_active": boolean,"link_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"display_order"?: number,"id"?: string,"image_url": string,"is_active"?: boolean,"link_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"display_order"?: number,"id"?: string,"image_url"?: string,"is_active"?: boolean,"link_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"lesson_media": {
                  Row: {
                    "created_at": string,"lesson_id": string,"storage_path": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"lesson_id": string,"storage_path": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"lesson_id"?: string,"storage_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_media_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: true
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_progress": {
                  Row: {
                    "created_at": string,"enrollment_id": string,"id": string,"is_completed": boolean,"last_watched_at": string | null,"lesson_id": string,"updated_at": string,"user_id": string,"watched_seconds": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"enrollment_id": string,"id"?: string,"is_completed"?: boolean,"last_watched_at"?: string | null,"lesson_id": string,"updated_at"?: string,"user_id": string,"watched_seconds"?: number
                  }
                  Update: {
                    "created_at"?: string,"enrollment_id"?: string,"id"?: string,"is_completed"?: boolean,"last_watched_at"?: string | null,"lesson_id"?: string,"updated_at"?: string,"user_id"?: string,"watched_seconds"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_progress_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: false
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "course_id": string,"created_at": string,"description": string | null,"display_order": number,"duration_seconds": number | null,"id": string,"is_published": boolean,"module_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"description"?: string | null,"display_order"?: number,"duration_seconds"?: number | null,"id"?: string,"is_published"?: boolean,"module_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"description"?: string | null,"display_order"?: number,"duration_seconds"?: number | null,"id"?: string,"is_published"?: boolean,"module_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lessons_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "course_modules"
      referencedColumns: ["id"]
    }
                  ]
                },"manual_payments": {
                  Row: {
                    "admin_notes": string | null,"amount": number,"course_id": string,"created_at": string,"currency": string | null,"enrollment_id": string | null,"expected_amount": number | null,"id": string,"payment_notes": string | null,"payment_proof_url": string | null,"payment_reference": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["payment_status"],"submitted_at": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_notes"?: string | null,"amount": number,"course_id": string,"created_at"?: string,"currency"?: string | null,"enrollment_id"?: string | null,"expected_amount"?: number | null,"id"?: string,"payment_notes"?: string | null,"payment_proof_url"?: string | null,"payment_reference"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"submitted_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "admin_notes"?: string | null,"amount"?: number,"course_id"?: string,"created_at"?: string,"currency"?: string | null,"enrollment_id"?: string | null,"expected_amount"?: number | null,"id"?: string,"payment_notes"?: string | null,"payment_proof_url"?: string | null,"payment_reference"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"submitted_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "manual_payments_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "manual_payments_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: false
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "manual_payments_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "manual_payments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"redeem_code_usages": {
                  Row: {
                    "enrollment_id": string,"id": string,"redeem_code_id": string,"redeemed_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "enrollment_id": string,"id"?: string,"redeem_code_id": string,"redeemed_at"?: string,"user_id": string
                  }
                  Update: {
                    "enrollment_id"?: string,"id"?: string,"redeem_code_id"?: string,"redeemed_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "redeem_code_usages_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: false
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redeem_code_usages_redeem_code_id_fkey"
      columns: ["redeem_code_id"]
isOneToOne: false
      referencedRelation: "redeem_codes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redeem_code_usages_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"redeem_codes": {
                  Row: {
                    "code_hash": string,"code_hint": string | null,"course_id": string,"created_at": string,"created_by": string | null,"current_uses": number,"expires_at": string | null,"id": string,"is_active": boolean,"max_uses": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code_hash": string,"code_hint"?: string | null,"course_id": string,"created_at"?: string,"created_by"?: string | null,"current_uses"?: number,"expires_at"?: string | null,"id"?: string,"is_active"?: boolean,"max_uses"?: number,"updated_at"?: string
                  }
                  Update: {
                    "code_hash"?: string,"code_hint"?: string | null,"course_id"?: string,"created_at"?: string,"created_by"?: string | null,"current_uses"?: number,"expires_at"?: string | null,"id"?: string,"is_active"?: boolean,"max_uses"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "redeem_codes_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redeem_codes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"registered_devices": {
                  Row: {
                    "created_at": string,"device_key_hash": string,"device_name": string | null,"id": string,"ip_address": string | null,"last_used_at": string,"user_agent": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"device_key_hash": string,"device_name"?: string | null,"id"?: string,"ip_address"?: string | null,"last_used_at"?: string,"user_agent"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"device_key_hash"?: string,"device_name"?: string | null,"id"?: string,"ip_address"?: string | null,"last_used_at"?: string,"user_agent"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "registered_devices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_sessions": {
                  Row: {
                    "auth_session_id": string,"created_at": string,"device_id": string,"id": string,"last_seen_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth_session_id": string,"created_at"?: string,"device_id": string,"id"?: string,"last_seen_at"?: string,"user_id": string
                  }
                  Update: {
                    "auth_session_id"?: string,"created_at"?: string,"device_id"?: string,"id"?: string,"last_seen_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_sessions_device_id_fkey"
      columns: ["device_id"]
isOneToOne: false
      referencedRelation: "registered_devices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_sessions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_create_redeem_codes":
{ Args: { "p_count": number,"p_course_id": string,"p_expires_at"?: string,"p_max_uses"?: number }; Returns: {
              "code": string,"id": string
            }[]
                           },
"admin_grant_enrollment":
{ Args: { "p_course_id": string,"p_expires_at": string,"p_reason": string,"p_user_id": string }; Returns: string
                           },
"admin_remove_device":
{ Args: { "p_device_id": string,"p_reason": string }; Returns: undefined
                           },
"admin_revoke_enrollment":
{ Args: { "p_enrollment_id": string,"p_reason": string }; Returns: undefined
                           },
"admin_set_user_role":
{ Args: { "p_role": Database["public"]['Enums']["user_role"],"p_user_id": string }; Returns: undefined
                           },
"approve_manual_payment":
{ Args: { "p_admin_notes"?: string,"p_payment_id": string }; Returns: string
                           },
"check_expired_enrollments":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"cleanup_orphaned_sessions":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"current_session_is_active":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"get_lesson_playback":
{ Args: { "p_lesson_id": string }; Returns: string
                           },
"record_lesson_progress":
{ Args: { "p_completed"?: boolean,"p_lesson_id": string,"p_position_seconds": number }; Returns: undefined
                           },
"redeem_code":
{ Args: { "p_code": string }; Returns: string
                           },
"register_current_device":
{ Args: { "p_device_key": string,"p_device_name"?: string,"p_ip_address"?: string,"p_user_agent"?: string }; Returns: string
                           },
"reject_manual_payment":
{ Args: { "p_admin_notes"?: string,"p_payment_id": string }; Returns: undefined
                           },
"remove_my_device":
{ Args: { "p_device_id": string }; Returns: undefined
                           },
"submit_manual_payment":
{ Args: { "p_amount": number,"p_course_id": string,"p_notes"?: string,"p_payment_reference"?: string,"p_proof_path"?: string }; Returns: string
                           }
          }
          Enums: {
            "enrollment_status": "pending_payment"|"active"|"expired"|"cancelled","payment_status": "pending"|"approved"|"rejected","user_role": "student"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "enrollment_status": ["pending_payment", "active", "expired", "cancelled"],"payment_status": ["pending", "approved", "rejected"],"user_role": ["student", "admin"]
          }
        }
} as const
