export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      broadcasts: {
        Row: {
          body: string
          created_at: string
          id: string
          is_ab_test: boolean | null
          recipient_filter: Json | null
          scheduled_for: string | null
          sent_at: string | null
          stats: Json | null
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | null
          subject: string
          subject_b: string | null
          test_size_percent: number | null
          updated_at: string
          user_id: string
          wait_time_hours: number | null
          winner_metric: 'open_rate' | 'click_rate' | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_ab_test?: boolean | null
          recipient_filter?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | null
          subject: string
          subject_b?: string | null
          test_size_percent?: number | null
          updated_at?: string
          user_id: string
          wait_time_hours?: number | null
          winner_metric?: 'open_rate' | 'click_rate' | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_ab_test?: boolean | null
          recipient_filter?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | null
          subject?: string
          subject_b?: string | null
          test_size_percent?: number | null
          updated_at?: string
          user_id?: string
          wait_time_hours?: number | null
          winner_metric?: 'open_rate' | 'click_rate' | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      email_events: {
        Row: {
          broadcast_id: string | null
          created_at: string
          event_type: 'sent' | 'opened' | 'clicked' | 'unsubscribed' | 'bounced'
          id: string
          ip_address: string | null
          link_url: string | null
          sequence_id: string | null
          step_id: string | null
          subscriber_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          broadcast_id?: string | null
          created_at?: string
          event_type: 'sent' | 'opened' | 'clicked' | 'unsubscribed' | 'bounced'
          id?: string
          ip_address?: string | null
          link_url?: string | null
          sequence_id?: string | null
          step_id?: string | null
          subscriber_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          broadcast_id?: string | null
          created_at?: string
          event_type?: 'sent' | 'opened' | 'clicked' | 'unsubscribed' | 'bounced'
          id?: string
          ip_address?: string | null
          link_url?: string | null
          sequence_id?: string | null
          step_id?: string | null
          subscriber_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sequence_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      landing_pages: {
        Row: {
          assign_sequence_id: string | null
          assign_tag: string | null
          button_text: string | null
          conversions: number | null
          created_at: string
          headline: string
          id: string
          image_url: string | null
          name: string
          redirect_url: string | null
          show_first_name: boolean | null
          slug: string
          status: 'draft' | 'published' | null
          subheadline: string | null
          success_message: string | null
          template: 'minimal' | 'side-by-side' | 'hero' | 'two-column' | 'video' | null
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          assign_sequence_id?: string | null
          assign_tag?: string | null
          button_text?: string | null
          conversions?: number | null
          created_at?: string
          headline: string
          id?: string
          image_url?: string | null
          name: string
          redirect_url?: string | null
          show_first_name?: boolean | null
          slug: string
          status?: 'draft' | 'published' | null
          subheadline?: string | null
          success_message?: string | null
          template?: 'minimal' | 'side-by-side' | 'hero' | 'two-column' | 'video' | null
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          assign_sequence_id?: string | null
          assign_tag?: string | null
          button_text?: string | null
          conversions?: number | null
          created_at?: string
          headline?: string
          id?: string
          image_url?: string | null
          name?: string
          redirect_url?: string | null
          show_first_name?: boolean | null
          slug?: string
          status?: 'draft' | 'published' | null
          subheadline?: string | null
          success_message?: string | null
          template?: 'minimal' | 'side-by-side' | 'hero' | 'two-column' | 'video' | null
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_assign_sequence_id_fkey"
            columns: ["assign_sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          plan: 'starter' | 'growth' | 'lifetime' | null
          subscriber_limit: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          plan?: 'starter' | 'growth' | 'lifetime' | null
          subscriber_limit?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          plan?: 'starter' | 'growth' | 'lifetime' | null
          subscriber_limit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sequence_steps: {
        Row: {
          body: string
          created_at: string
          delay_hours: number | null
          id: string
          order: number
          sequence_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          delay_hours?: number | null
          id?: string
          order: number
          sequence_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          delay_hours?: number | null
          id?: string
          order?: number
          sequence_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          }
        ]
      }
      sequences: {
        Row: {
          completed_count: number | null
          created_at: string
          enrolled_count: number | null
          id: string
          name: string
          status: 'draft' | 'active' | 'paused' | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number | null
          created_at?: string
          enrolled_count?: number | null
          id?: string
          name: string
          status?: 'draft' | 'active' | 'paused' | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number | null
          created_at?: string
          enrolled_count?: number | null
          id?: string
          name?: string
          status?: 'draft' | 'active' | 'paused' | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          current_sequence_id: string | null
          current_sequence_step: number | null
          email: string
          first_name: string | null
          id: string
          status: 'active' | 'unsubscribed' | 'bounced' | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_sequence_id?: string | null
          current_sequence_step?: number | null
          email: string
          first_name?: string | null
          id?: string
          status?: 'active' | 'unsubscribed' | 'bounced' | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_sequence_id?: string | null
          current_sequence_step?: number | null
          email?: string
          first_name?: string | null
          id?: string
          status?: 'active' | 'unsubscribed' | 'bounced' | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_user_id_fkey"
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
      increment_page_conversion: {
        Args: {
          page_id: string
        }
        Returns: undefined
      }
      increment_page_view: {
        Args: {
          page_slug: string
        }
        Returns: undefined
      }
      queue_due_broadcasts: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
