export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          audio_prompt: string | null
          correct_answer: number
          created_at: string
          difficulty: number
          exam_type: string
          explanation: string | null
          id: string
          image_prompt: string | null
          is_active: boolean
          level: string
          options: Json
          question_text: string
          section: string
          tags: string[] | null
          transcript: string | null
        }
        Insert: {
          audio_prompt?: string | null
          correct_answer: number
          created_at?: string
          difficulty?: number
          exam_type?: string
          explanation?: string | null
          id?: string
          image_prompt?: string | null
          is_active?: boolean
          level: string
          options: Json
          question_text: string
          section: string
          tags?: string[] | null
          transcript?: string | null
        }
        Update: {
          audio_prompt?: string | null
          correct_answer?: number
          created_at?: string
          difficulty?: number
          exam_type?: string
          explanation?: string | null
          id?: string
          image_prompt?: string | null
          is_active?: boolean
          level?: string
          options?: Json
          question_text?: string
          section?: string
          tags?: string[] | null
          transcript?: string | null
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          answers: Json
          created_at: string
          exam_type: string
          id: string
          level: string
          score: number
          time_taken_seconds: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          exam_type: string
          id?: string
          level: string
          score: number
          time_taken_seconds: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_type?: string
          id?: string
          level?: string
          score?: number
          time_taken_seconds?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: Database["public"]["Enums"]["material_category"]
          content: Json | null
          created_at: string
          cultural_note: string | null
          grammar_notes: Json | null
          id: string
          is_favorite: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          vocabulary: Json | null
        }
        Insert: {
          category: Database["public"]["Enums"]["material_category"]
          content?: Json | null
          created_at?: string
          cultural_note?: string | null
          grammar_notes?: Json | null
          id?: string
          is_favorite?: boolean
          level?: Database["public"]["Enums"]["jlpt_level"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          vocabulary?: Json | null
        }
        Update: {
          category?: Database["public"]["Enums"]["material_category"]
          content?: Json | null
          created_at?: string
          cultural_note?: string | null
          grammar_notes?: Json | null
          id?: string
          is_favorite?: boolean
          level?: Database["public"]["Enums"]["jlpt_level"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          vocabulary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_path: Database["public"]["Enums"]["learning_path"]
          daily_goal_xp: number
          display_name: string | null
          id: string
          theme_preference: string
        }
        Insert: {
          created_at?: string
          current_path?: Database["public"]["Enums"]["learning_path"]
          daily_goal_xp?: number
          display_name?: string | null
          id: string
          theme_preference?: string
        }
        Update: {
          created_at?: string
          current_path?: Database["public"]["Enums"]["learning_path"]
          daily_goal_xp?: number
          display_name?: string | null
          id?: string
          theme_preference?: string
        }
        Relationships: []
      }
      srs_logs: {
        Row: {
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_date: string
          repetitions: number
          status: Database["public"]["Enums"]["srs_status"]
          user_id: string
          vocab_id: string
        }
        Insert: {
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string
          repetitions?: number
          status?: Database["public"]["Enums"]["srs_status"]
          user_id: string
          vocab_id: string
        }
        Update: {
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string
          repetitions?: number
          status?: Database["public"]["Enums"]["srs_status"]
          user_id?: string
          vocab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "srs_logs_vocab_id_fkey"
            columns: ["vocab_id"]
            isOneToOne: false
            referencedRelation: "vocab_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vocab_bank: {
        Row: {
          audio_url: string | null
          created_at: string
          example_sentence: string | null
          id: string
          jlpt_level: Database["public"]["Enums"]["jlpt_level"] | null
          kana: string
          kanji: string | null
          meaning: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          example_sentence?: string | null
          id?: string
          jlpt_level?: Database["public"]["Enums"]["jlpt_level"] | null
          kana: string
          kanji?: string | null
          meaning: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          example_sentence?: string | null
          id?: string
          jlpt_level?: Database["public"]["Enums"]["jlpt_level"] | null
          kana?: string
          kanji?: string | null
          meaning?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_bank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      jlpt_level: "n5" | "n4" | "n3" | "n2" | "n1" | "none"
      learning_path: "jlpt_academic" | "jft_practical"
      material_category: "grammar" | "reading" | "conversation" | "vocabulary"
      srs_status: "new" | "learning" | "review" | "mastered"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      jlpt_level: ["n5", "n4", "n3", "n2", "n1", "none"],
      learning_path: ["jlpt_academic", "jft_practical"],
      material_category: ["grammar", "reading", "conversation", "vocabulary"],
      srs_status: ["new", "learning", "review", "mastered"],
    },
  },
} as const
