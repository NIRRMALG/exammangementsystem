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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      classrooms: {
        Row: {
          capacity: number
          columns: number
          created_at: string
          id: string
          name: string
          rows: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          capacity: number
          columns: number
          created_at?: string
          id?: string
          name: string
          rows: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          capacity?: number
          columns?: number
          created_at?: string
          id?: string
          name?: string
          rows?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string
          id: string
          paper_code: string
          paper_title: string
          session_duration: number
          session_time: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          exam_date: string
          id?: string
          paper_code: string
          paper_title: string
          session_duration: number
          session_time: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          exam_date?: string
          id?: string
          paper_code?: string
          paper_title?: string
          session_duration?: number
          session_time?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invigilator_assignments: {
        Row: {
          classroom_id: string
          created_at: string
          exam_id: string
          id: string
          invigilator_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          exam_id: string
          id?: string
          invigilator_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          exam_id?: string
          id?: string
          invigilator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invigilator_assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invigilator_assignments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invigilator_assignments_invigilator_id_fkey"
            columns: ["invigilator_id"]
            isOneToOne: false
            referencedRelation: "invigilators"
            referencedColumns: ["id"]
          },
        ]
      }
      invigilators: {
        Row: {
          available_dates: string[]
          created_at: string
          id: string
          invigilator_id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available_dates?: string[]
          created_at?: string
          id?: string
          invigilator_id: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available_dates?: string[]
          created_at?: string
          id?: string
          invigilator_id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          institution_name: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          institution_name: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_name?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      seating_allocations: {
        Row: {
          classroom_id: string
          created_at: string
          exam_id: string
          id: string
          seat_column: number
          seat_row: number
          student_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          exam_id: string
          id?: string
          seat_column: number
          seat_row: number
          student_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          exam_id?: string
          id?: string
          seat_column?: number
          seat_row?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seating_allocations_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_allocations_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          id: string
          name: string
          paper_code: string
          student_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          paper_code: string
          student_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          paper_code?: string
          student_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
