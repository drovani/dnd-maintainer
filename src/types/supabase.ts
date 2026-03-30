export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          dm_notes: string | null
          id: string
          image_url: string | null
          name: string
          setting: string | null
          status: string | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          dm_notes?: string | null
          id?: string
          image_url?: string | null
          name: string
          setting?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          dm_notes?: string | null
          id?: string
          image_url?: string | null
          name?: string
          setting?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      character_build_levels: {
        Row: {
          ability_method: string | null
          asi_allocation: Json | null
          base_abilities: Json | null
          character_id: string
          choices: Json
          class_id: string | null
          class_level: number | null
          created_at: string
          deleted_at: string | null
          feat_id: string | null
          hp_roll: number | null
          id: string
          sequence: number
          subclass_id: string | null
        }
        Insert: {
          ability_method?: string | null
          asi_allocation?: Json | null
          base_abilities?: Json | null
          character_id: string
          choices?: Json
          class_id?: string | null
          class_level?: number | null
          created_at?: string
          deleted_at?: string | null
          feat_id?: string | null
          hp_roll?: number | null
          id?: string
          sequence: number
          subclass_id?: string | null
        }
        Update: {
          ability_method?: string | null
          asi_allocation?: Json | null
          base_abilities?: Json | null
          character_id?: string
          choices?: Json
          class_id?: string | null
          class_level?: number | null
          created_at?: string
          deleted_at?: string | null
          feat_id?: string | null
          hp_roll?: number | null
          id?: string
          sequence?: number
          subclass_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_build_levels_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_items: {
        Row: {
          attuned: boolean
          character_id: string
          created_at: string
          equipped: boolean
          id: string
          item_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          attuned?: boolean
          character_id: string
          created_at?: string
          equipped?: boolean
          id?: string
          item_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          attuned?: boolean
          character_id?: string
          created_at?: string
          equipped?: boolean
          id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: string | null
          alignment: string
          appearance: string | null
          armor_class: number | null
          background: string | null
          backstory: string | null
          bonds: string | null
          campaign_id: string
          character_type: string
          class: string | null
          created_at: string
          eye_color: string | null
          flaws: string | null
          gender: string | null
          hair_color: string | null
          height: string | null
          hit_points_max: number | null
          id: string
          ideals: string | null
          is_active: boolean
          level: number
          name: string
          notes: string | null
          personality_traits: string | null
          player_name: string | null
          portrait_url: string | null
          proficiency_bonus: number | null
          race: string | null
          size: string | null
          skin_color: string | null
          speed: number | null
          status: string
          subclass: string | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          age?: string | null
          alignment?: string
          appearance?: string | null
          armor_class?: number | null
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          campaign_id: string
          character_type: string
          class?: string | null
          created_at?: string
          eye_color?: string | null
          flaws?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          hit_points_max?: number | null
          id?: string
          ideals?: string | null
          is_active?: boolean
          level?: number
          name: string
          notes?: string | null
          personality_traits?: string | null
          player_name?: string | null
          portrait_url?: string | null
          proficiency_bonus?: number | null
          race?: string | null
          size?: string | null
          skin_color?: string | null
          speed?: number | null
          status?: string
          subclass?: string | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          age?: string | null
          alignment?: string
          appearance?: string | null
          armor_class?: number | null
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          campaign_id?: string
          character_type?: string
          class?: string | null
          created_at?: string
          eye_color?: string | null
          flaws?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          hit_points_max?: number | null
          id?: string
          ideals?: string | null
          is_active?: boolean
          level?: number
          name?: string
          notes?: string | null
          personality_traits?: string | null
          player_name?: string | null
          portrait_url?: string | null
          proficiency_bonus?: number | null
          race?: string | null
          size?: string | null
          skin_color?: string | null
          speed?: number | null
          status?: string
          subclass?: string | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          campaign_id: string
          combatants: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          round: number
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          combatants?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          round?: number
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          combatants?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          round?: number
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          campaign_id: string
          category: string | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          campaign_id: string
          created_at: string
          date: string | null
          experience_awarded: number
          id: string
          loot: Json | null
          notes: string | null
          session_number: number
          summary: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          date?: string | null
          experience_awarded?: number
          id?: string
          loot?: Json | null
          notes?: string | null
          session_number: number
          summary?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          date?: string | null
          experience_awarded?: number
          id?: string
          loot?: Json | null
          notes?: string | null
          session_number?: number
          summary?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

