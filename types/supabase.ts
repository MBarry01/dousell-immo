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
      document_listing_usage: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_listing_usage_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_text: string | null
          id: string
          resend_response: Json | null
          status: string
          subject: string | null
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_text?: string | null
          id?: string
          resend_response?: Json | null
          status: string
          subject?: string | null
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_text?: string | null
          id?: string
          resend_response?: Json | null
          status?: string
          subject?: string | null
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          expense_date: string
          id: string
          lease_id: string | null
          maintenance_request_id: string | null
          owner_id: string
          property_id: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          expense_date?: string
          id?: string
          lease_id?: string | null
          maintenance_request_id?: string | null
          owner_id: string
          property_id?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          lease_id?: string | null
          maintenance_request_id?: string | null
          owner_id?: string
          property_id?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      external_listings: {
        Row: {
          category: string | null
          city: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          id: string
          image_url: string | null
          last_seen_at: string | null
          location: string | null
          price: string | null
          source_site: string | null
          source_url: string
          title: string
          type: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_seen_at?: string | null
          location?: string | null
          price?: string | null
          source_site?: string | null
          source_url: string
          title: string
          type?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_seen_at?: string | null
          location?: string | null
          price?: string | null
          source_site?: string | null
          source_url?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      gestion_locative_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          id_document_url: string | null
          identity_document_url: string | null
          property_proof_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          id_document_url?: string | null
          identity_document_url?: string | null
          property_proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          id_document_url?: string | null
          identity_document_url?: string | null
          property_proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_reports: {
        Row: {
          created_at: string | null
          general_comments: string | null
          id: string
          lease_id: string
          meter_readings: Json | null
          owner_id: string
          owner_signature: string | null
          pdf_url: string | null
          report_date: string | null
          rooms: Json | null
          signed_at: string | null
          status: string | null
          tenant_signature: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          general_comments?: string | null
          id?: string
          lease_id: string
          meter_readings?: Json | null
          owner_id: string
          owner_signature?: string | null
          pdf_url?: string | null
          report_date?: string | null
          rooms?: Json | null
          signed_at?: string | null
          status?: string | null
          tenant_signature?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          general_comments?: string | null
          id?: string
          lease_id?: string
          meter_readings?: Json | null
          owner_id?: string
          owner_signature?: string | null
          pdf_url?: string | null
          report_date?: string | null
          rooms?: Json | null
          signed_at?: string | null
          status?: string | null
          tenant_signature?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reports_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          name: string
          phone: string
          property_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          property_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          property_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_decisions: {
        Row: {
          created_at: string | null
          decided_by: string | null
          decision_type: string
          id: string
          lease_id: string | null
          new_rent_amount: number | null
          termination_reason: string | null
        }
        Insert: {
          created_at?: string | null
          decided_by?: string | null
          decision_type: string
          id?: string
          lease_id?: string | null
          new_rent_amount?: number | null
          termination_reason?: string | null
        }
        Update: {
          created_at?: string | null
          decided_by?: string | null
          decision_type?: string
          id?: string
          lease_id?: string | null
          new_rent_amount?: number | null
          termination_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_decisions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          billing_day: number | null
          created_at: string | null
          currency: string | null
          custom_data: Json | null
          end_date: string | null
          id: string
          lease_pdf_url: string | null
          monthly_amount: number
          owner_id: string | null
          property_address: string | null
          property_id: string | null
          start_date: string
          status: string | null
          team_id: string | null
          tenant_email: string | null
          tenant_name: string
          tenant_phone: string | null
          updated_at: string | null
        }
        Insert: {
          billing_day?: number | null
          created_at?: string | null
          currency?: string | null
          custom_data?: Json | null
          end_date?: string | null
          id?: string
          lease_pdf_url?: string | null
          monthly_amount: number
          owner_id?: string | null
          property_address?: string | null
          property_id?: string | null
          start_date: string
          status?: string | null
          team_id?: string | null
          tenant_email?: string | null
          tenant_name: string
          tenant_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_day?: number | null
          created_at?: string | null
          currency?: string | null
          custom_data?: Json | null
          end_date?: string | null
          id?: string
          lease_pdf_url?: string | null
          monthly_amount?: number
          owner_id?: string | null
          property_address?: string | null
          property_id?: string | null
          start_date?: string
          status?: string | null
          team_id?: string | null
          tenant_email?: string | null
          tenant_name?: string
          tenant_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          artisan_address: string | null
          artisan_name: string | null
          artisan_phone: string | null
          artisan_rating: number | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string
          id: string
          intervention_date: string | null
          lease_id: string | null
          owner_approved: boolean | null
          photo_urls: string[] | null
          quote_amount: number | null
          quote_url: string | null
          quoted_price: number | null
          status: string | null
        }
        Insert: {
          artisan_address?: string | null
          artisan_name?: string | null
          artisan_phone?: string | null
          artisan_rating?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          intervention_date?: string | null
          lease_id?: string | null
          owner_approved?: boolean | null
          photo_urls?: string[] | null
          quote_amount?: number | null
          quote_url?: string | null
          quoted_price?: number | null
          status?: string | null
        }
        Update: {
          artisan_address?: string | null
          artisan_name?: string | null
          artisan_phone?: string | null
          artisan_rating?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          intervention_date?: string | null
          lease_id?: string | null
          owner_approved?: boolean | null
          photo_urls?: string[] | null
          quote_amount?: number | null
          quote_url?: string | null
          quoted_price?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lease_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lease_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lease_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          message: string
          resource_path: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          resource_path?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          resource_path?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_document_url: string | null
          avatar_url: string | null
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_ninea: string | null
          company_phone: string | null
          display_name: string | null
          email: string | null
          email_verification_expires: string | null
          email_verification_token: string | null
          full_name: string | null
          gestion_locative_enabled: boolean | null
          gestion_locative_status: string | null
          id: string
          identity_card_url: string | null
          identity_document_url: string | null
          is_identity_verified: boolean | null
          kyc_status: string | null
          logo_url: string | null
          phone: string | null
          residence_proof_url: string | null
          role: string | null
          signature_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_document_url?: string | null
          avatar_url?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_ninea?: string | null
          company_phone?: string | null
          display_name?: string | null
          email?: string | null
          email_verification_expires?: string | null
          email_verification_token?: string | null
          full_name?: string | null
          gestion_locative_enabled?: boolean | null
          gestion_locative_status?: string | null
          id: string
          identity_card_url?: string | null
          identity_document_url?: string | null
          is_identity_verified?: boolean | null
          kyc_status?: string | null
          logo_url?: string | null
          phone?: string | null
          residence_proof_url?: string | null
          role?: string | null
          signature_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_document_url?: string | null
          avatar_url?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_ninea?: string | null
          company_phone?: string | null
          display_name?: string | null
          email?: string | null
          email_verification_expires?: string | null
          email_verification_token?: string | null
          full_name?: string | null
          gestion_locative_enabled?: boolean | null
          gestion_locative_status?: string | null
          id?: string
          identity_card_url?: string | null
          identity_document_url?: string | null
          is_identity_verified?: boolean | null
          kyc_status?: string | null
          logo_url?: string | null
          phone?: string | null
          residence_proof_url?: string | null
          role?: string | null
          signature_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent: Json | null
          category: string
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          details: Json | null
          features: Json | null
          id: string
          images: string[] | null
          is_agency_listing: boolean | null
          location: Json
          owner_id: string | null
          payment_amount: number | null
          payment_ref: string | null
          price: number
          proof_document_url: string | null
          property_type: string | null
          rejection_reason: string | null
          scheduled_publish_at: string | null
          service_name: string | null
          service_type: string | null
          specs: Json
          status: string
          team_id: string | null
          title: string
          validation_status: string | null
          verification_date: string | null
          verification_note: string | null
          verification_rejection_reason: string | null
          verification_requested_at: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          view_count: number
          views_count: number | null
          virtual_tour_url: string | null
        }
        Insert: {
          agent?: Json | null
          category: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          details?: Json | null
          features?: Json | null
          id?: string
          images?: string[] | null
          is_agency_listing?: boolean | null
          location?: Json
          owner_id?: string | null
          payment_amount?: number | null
          payment_ref?: string | null
          price?: number
          proof_document_url?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          scheduled_publish_at?: string | null
          service_name?: string | null
          service_type?: string | null
          specs?: Json
          status?: string
          team_id?: string | null
          title: string
          validation_status?: string | null
          verification_date?: string | null
          verification_note?: string | null
          verification_rejection_reason?: string | null
          verification_requested_at?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          view_count?: number
          views_count?: number | null
          virtual_tour_url?: string | null
        }
        Update: {
          agent?: Json | null
          category?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          details?: Json | null
          features?: Json | null
          id?: string
          images?: string[] | null
          is_agency_listing?: boolean | null
          location?: Json
          owner_id?: string | null
          payment_amount?: number | null
          payment_ref?: string | null
          price?: number
          proof_document_url?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          scheduled_publish_at?: string | null
          service_name?: string | null
          service_type?: string | null
          specs?: Json
          status?: string
          team_id?: string | null
          title?: string
          validation_status?: string | null
          verification_date?: string | null
          verification_note?: string | null
          verification_rejection_reason?: string | null
          verification_requested_at?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          view_count?: number
          views_count?: number | null
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      property_stats: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          property_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          property_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_stats_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_leads: {
        Row: {
          created_at: string | null
          description: string | null
          detected_phone: string | null
          external_id: string | null
          external_url: string | null
          gps_lat: number | null
          gps_long: number | null
          id: string
          photo_url: string | null
          source: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          detected_phone?: string | null
          external_id?: string | null
          external_url?: string | null
          gps_lat?: number | null
          gps_long?: number | null
          id?: string
          photo_url?: string | null
          source: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          detected_phone?: string | null
          external_id?: string | null
          external_url?: string | null
          gps_lat?: number | null
          gps_long?: number | null
          id?: string
          photo_url?: string | null
          source?: string
          status?: string | null
        }
        Relationships: []
      }
      rental_transactions: {
        Row: {
          amount_due: number
          created_at: string | null
          id: string
          lease_id: string | null
          notice_url: string | null
          paid_at: string | null
          period_end: string | null
          period_month: number
          period_start: string | null
          period_year: number
          receipt_url: string | null
          reminder_sent: boolean | null
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          amount_due: number
          created_at?: string | null
          id?: string
          lease_id?: string | null
          notice_url?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_month: number
          period_start?: string | null
          period_year: number
          receipt_url?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          amount_due?: number
          created_at?: string | null
          id?: string
          lease_id?: string | null
          notice_url?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_month?: number
          period_start?: string | null
          period_year?: number
          receipt_url?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reactions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          property_id: string
          rating: number
          updated_at: string | null
          user_id: string
          user_name: string
          user_photo: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          property_id: string
          rating: number
          updated_at?: string | null
          user_id: string
          user_name: string
          user_photo?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          property_id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
          user_name?: string
          user_photo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_alerts: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      team_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_audit_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          message: string | null
          role: string
          status: string | null
          team_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          message?: string | null
          role?: string
          status?: string | null
          team_id: string
          token?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          message?: string | null
          role?: string
          status?: string | null
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          billing_email: string | null
          company_address: string | null
          company_email: string | null
          company_ninea: string | null
          company_phone: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          default_billing_day: number | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          signature_url: string | null
          slug: string
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          company_address?: string | null
          company_email?: string | null
          company_ninea?: string | null
          company_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          default_billing_day?: number | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          signature_url?: string | null
          slug: string
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          company_address?: string | null
          company_email?: string | null
          company_ninea?: string | null
          company_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          default_billing_day?: number | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          signature_url?: string | null
          slug?: string
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          category: string | null
          certification_scope: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_certified: boolean | null
          lease_id: string | null
          mime_type: string
          property_id: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          certification_scope?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_certified?: boolean | null
          lease_id?: string | null
          mime_type: string
          property_id?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          certification_scope?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_certified?: boolean | null
          lease_id?: string | null
          mime_type?: string
          property_id?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles_audit: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_at: string | null
          performed_by: string | null
          role: string
          target_user: string
          user_role_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          role: string
          target_user: string
          user_role_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          role?: string
          target_user?: string
          user_role_id?: string | null
        }
        Relationships: []
      }
      visit_requests: {
        Row: {
          availability: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string
          phone: string
          project_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          availability: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message: string
          phone: string
          project_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          availability?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string
          phone?: string
          project_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: { Args: { p_token: string }; Returns: Json }
      create_notification: {
        Args: {
          p_message: string
          p_resource_path?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_active_cities_and_types: {
        Args: { min_count?: number }
        Returns: {
          city: string
          count: number
          type: string
        }[]
      }
      get_admin_user_id: { Args: { admin_email: string }; Returns: string }
      get_property_average_rating: {
        Args: { property_uuid: string }
        Returns: number
      }
      get_property_owner_id: { Args: { property_id: string }; Returns: string }
      get_property_reviews_count: {
        Args: { property_uuid: string }
        Returns: number
      }
      get_team_properties: {
        Args: { p_team_id: string }
        Returns: {
          agent: Json | null
          category: string
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          details: Json | null
          features: Json | null
          id: string
          images: string[] | null
          is_agency_listing: boolean | null
          location: Json
          owner_id: string | null
          payment_amount: number | null
          payment_ref: string | null
          price: number
          proof_document_url: string | null
          property_type: string | null
          rejection_reason: string | null
          scheduled_publish_at: string | null
          service_name: string | null
          service_type: string | null
          specs: Json
          status: string
          team_id: string | null
          title: string
          validation_status: string | null
          verification_date: string | null
          verification_note: string | null
          verification_rejection_reason: string | null
          verification_requested_at: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          view_count: number
          views_count: number | null
          virtual_tour_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_total_users: { Args: never; Returns: number }
      get_unread_notifications_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_metadata: { Args: { user_id: string }; Returns: Json }
      get_user_role_in_team: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: string
      }
      get_user_roles: { Args: { target_user_id: string }; Returns: string[] }
      get_user_team: {
        Args: { p_user_id: string }
        Returns: {
          team_id: string
          team_name: string
          team_slug: string
          user_role: string
        }[]
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          roles: string[]
        }[]
      }
      grant_role: {
        Args: { p_role: string; target_user: string }
        Returns: undefined
      }
      has_team_permission: {
        Args: { p_permission: string; p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      increment_view_count: {
        Args: { property_id_param: string }
        Returns: number
      }
      is_superadmin: { Args: { u: string }; Returns: boolean }
      is_superadmin_or_admin: { Args: { u: string }; Returns: boolean }
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      publish_scheduled_properties: { Args: never; Returns: number }
      revoke_role: {
        Args: { p_role: string; target_user: string }
        Returns: undefined
      }
      user_has_admin_role: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { role_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      lead_status: "nouveau" | "contact├®" | "visite_programm├®e" | "clos"
      notification_type: "info" | "success" | "warning" | "error"
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
      lead_status: ["nouveau", "contact├®", "visite_programm├®e", "clos"],
      notification_type: ["info", "success", "warning", "error"],
    },
  },
} as const
