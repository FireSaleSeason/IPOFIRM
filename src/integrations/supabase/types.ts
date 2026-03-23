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
      audit_log: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      callback_inbox: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_id: string
          payload: Json
          processing_completed_at: string | null
          processing_started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id: string
          payload: Json
          processing_completed_at?: string | null
          processing_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          payload?: Json
          processing_completed_at?: string | null
          processing_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "callback_inbox_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraping_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      company_actions: {
        Row: {
          action_type: string
          actor: string | null
          created_at: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action_type: string
          actor?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          actor?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_actions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          alert_preferences: Json | null
          alternative_investments: string | null
          annual_income: string | null
          best_time_to_reach: string | null
          capital_available: string | null
          created_at: string
          curated_deals: boolean | null
          decision_maker: boolean | null
          email: string
          experience: string | null
          has_advisor: boolean | null
          id: string
          interested_sectors: string[] | null
          kyc_ready: string | null
          last_alert_sent: string | null
          liquidity_comfort: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          phone_verified: boolean | null
          portfolio_size: string | null
          subscribed_at: string
          subscription_status: string | null
          survey_completed: boolean | null
          survey_completed_at: string | null
          timeframe: string | null
          updated_at: string
        }
        Insert: {
          alert_preferences?: Json | null
          alternative_investments?: string | null
          annual_income?: string | null
          best_time_to_reach?: string | null
          capital_available?: string | null
          created_at?: string
          curated_deals?: boolean | null
          decision_maker?: boolean | null
          email: string
          experience?: string | null
          has_advisor?: boolean | null
          id?: string
          interested_sectors?: string[] | null
          kyc_ready?: string | null
          last_alert_sent?: string | null
          liquidity_comfort?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          portfolio_size?: string | null
          subscribed_at?: string
          subscription_status?: string | null
          survey_completed?: boolean | null
          survey_completed_at?: string | null
          timeframe?: string | null
          updated_at?: string
        }
        Update: {
          alert_preferences?: Json | null
          alternative_investments?: string | null
          annual_income?: string | null
          best_time_to_reach?: string | null
          capital_available?: string | null
          created_at?: string
          curated_deals?: boolean | null
          decision_maker?: boolean | null
          email?: string
          experience?: string | null
          has_advisor?: boolean | null
          id?: string
          interested_sectors?: string[] | null
          kyc_ready?: string | null
          last_alert_sent?: string | null
          liquidity_comfort?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          portfolio_size?: string | null
          subscribed_at?: string
          subscription_status?: string | null
          survey_completed?: boolean | null
          survey_completed_at?: string | null
          timeframe?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          address: Json | null
          company_type: string | null
          country: string
          created_at: string | null
          data_quality_score: number | null
          dismissed_at: string | null
          dismissed_by: string | null
          domain_available: boolean | null
          domain_status: Json | null
          email_contacts: Json | null
          exported_at: string | null
          filings: Json | null
          filter_checked_at: string | null
          filter_notes: string[] | null
          filter_status: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          incorporation_date: string | null
          is_saved: boolean | null
          jurisdiction: string | null
          last_seen: string | null
          legal_name: string
          merged_from: Json | null
          negative_press_flag: boolean | null
          news_mentions: Json | null
          officers: Json | null
          officers_data: Json | null
          psc: Json | null
          raw_payload: Json | null
          registry_id: string
          registry_source: string
          score: number | null
          sic_codes: string[] | null
          social_media_presence: Json | null
          status: string | null
          trading_name: string | null
          updated_at: string | null
          web_presence_score: number | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          company_type?: string | null
          country: string
          created_at?: string | null
          data_quality_score?: number | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          domain_available?: boolean | null
          domain_status?: Json | null
          email_contacts?: Json | null
          exported_at?: string | null
          filings?: Json | null
          filter_checked_at?: string | null
          filter_notes?: string[] | null
          filter_status?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          incorporation_date?: string | null
          is_saved?: boolean | null
          jurisdiction?: string | null
          last_seen?: string | null
          legal_name: string
          merged_from?: Json | null
          negative_press_flag?: boolean | null
          news_mentions?: Json | null
          officers?: Json | null
          officers_data?: Json | null
          psc?: Json | null
          raw_payload?: Json | null
          registry_id: string
          registry_source: string
          score?: number | null
          sic_codes?: string[] | null
          social_media_presence?: Json | null
          status?: string | null
          trading_name?: string | null
          updated_at?: string | null
          web_presence_score?: number | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          company_type?: string | null
          country?: string
          created_at?: string | null
          data_quality_score?: number | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          domain_available?: boolean | null
          domain_status?: Json | null
          email_contacts?: Json | null
          exported_at?: string | null
          filings?: Json | null
          filter_checked_at?: string | null
          filter_notes?: string[] | null
          filter_status?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          incorporation_date?: string | null
          is_saved?: boolean | null
          jurisdiction?: string | null
          last_seen?: string | null
          legal_name?: string
          merged_from?: Json | null
          negative_press_flag?: boolean | null
          news_mentions?: Json | null
          officers?: Json | null
          officers_data?: Json | null
          psc?: Json | null
          raw_payload?: Json | null
          registry_id?: string
          registry_source?: string
          score?: number | null
          sic_codes?: string[] | null
          social_media_presence?: Json | null
          status?: string | null
          trading_name?: string | null
          updated_at?: string | null
          web_presence_score?: number | null
          website?: string | null
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          columns: string[] | null
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          expires_at: string | null
          filter_json: Json | null
          format: string | null
          id: string
          row_count: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          columns?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          filter_json?: Json | null
          format?: string | null
          id?: string
          row_count?: number | null
          status?: string | null
          user_id?: string
        }
        Update: {
          columns?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          filter_json?: Json | null
          format?: string | null
          id?: string
          row_count?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      filter_checks: {
        Row: {
          check_type: string
          checked_at: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          error_message: string | null
          id: string
          passed: boolean
        }
        Insert: {
          check_type: string
          checked_at?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          error_message?: string | null
          id?: string
          passed: boolean
        }
        Update: {
          check_type?: string
          checked_at?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          error_message?: string | null
          id?: string
          passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "filter_checks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_rules: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          label: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          label?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          label?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      filtering_audit: {
        Row: {
          articles_found: number | null
          blocked: boolean
          company_name: string
          created_at: string
          decision_details: Json | null
          filter_type: string
          id: string
          scraping_job_id: string | null
          sentiment_score: number | null
          top_article_title: string | null
          top_article_url: string | null
        }
        Insert: {
          articles_found?: number | null
          blocked: boolean
          company_name: string
          created_at?: string
          decision_details?: Json | null
          filter_type: string
          id?: string
          scraping_job_id?: string | null
          sentiment_score?: number | null
          top_article_title?: string | null
          top_article_url?: string | null
        }
        Update: {
          articles_found?: number | null
          blocked?: boolean
          company_name?: string
          created_at?: string
          decision_details?: Json | null
          filter_type?: string
          id?: string
          scraping_job_id?: string | null
          sentiment_score?: number | null
          top_article_title?: string | null
          top_article_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filtering_audit_scraping_job_id_fkey"
            columns: ["scraping_job_id"]
            isOneToOne: false
            referencedRelation: "scraping_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_alerts: {
        Row: {
          alert_data: Json | null
          alert_type: string
          company_name: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          published_at: string
          sent_to_subscribers: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_data?: Json | null
          alert_type: string
          company_name?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string
          sent_to_subscribers?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_data?: Json | null
          alert_type?: string
          company_name?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string
          sent_to_subscribers?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_preferences: Json | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed_at: string | null
          subscription_status: string | null
          subscription_tier: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          alert_preferences?: Json | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          alert_preferences?: Json | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          columns: string[] | null
          created_at: string | null
          filters: Json
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          columns?: string[] | null
          created_at?: string | null
          filters: Json
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          columns?: string[] | null
          created_at?: string | null
          filters?: Json
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          sort_order: number
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          filters: Json | null
          id: string
          records_fetched: number | null
          records_processed: number | null
          search_term: string | null
          source: string
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          filters?: Json | null
          id?: string
          records_fetched?: number | null
          records_processed?: number | null
          search_term?: string | null
          source: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          filters?: Json | null
          id?: string
          records_fetched?: number | null
          records_processed?: number | null
          search_term?: string | null
          source?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppression_list: {
        Row: {
          canonical_name: string
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
        }
        Insert: {
          canonical_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          canonical_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_data: Json | null
          alert_message: string
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          alert_data?: Json | null
          alert_message: string
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          alert_data?: Json | null
          alert_message?: string
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlist"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          alert_enabled: boolean | null
          alert_price_above: number | null
          alert_price_below: number | null
          alert_volume_threshold: number | null
          asset_id: string
          asset_name: string
          asset_symbol: string | null
          asset_type: string
          created_at: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean | null
          alert_price_above?: number | null
          alert_price_below?: number | null
          alert_volume_threshold?: number | null
          asset_id: string
          asset_name: string
          asset_symbol?: string | null
          asset_type: string
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_enabled?: boolean | null
          alert_price_above?: number | null
          alert_price_below?: number | null
          alert_volume_threshold?: number | null
          asset_id?: string
          asset_name?: string
          asset_symbol?: string | null
          asset_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      canonical_name: { Args: { name: string }; Returns: string }
      get_latest_filter_checks: {
        Args: { p_entity_id: string }
        Returns: {
          check_type: string
          checked_at: string
          details: Json
          passed: boolean
        }[]
      }
      has_premium_access: { Args: { user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
