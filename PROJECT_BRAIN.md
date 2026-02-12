# 🧠 PROJECT BRAIN (Context for AI)

---
## 1. DATA STRUCTURE
Utilise ces définitions pour comprendre la base de données (Tables, Colonnes, Relations).

```typescript
﻿export type Json =
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
      favorites: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          }
        ]
      }
      favorites_sync_logs: {
        Row: {
          id: string
          user_id: string
          attempted_count: number
          synced_count: number
          trimmed_to: number | null
          is_suspicious: boolean
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          attempted_count: number
          synced_count: number
          trimmed_to?: number | null
          is_suspicious?: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          attempted_count?: number
          synced_count?: number
          trimmed_to?: number | null
          is_suspicious?: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          // Added by migration 20260201100001 - Tenant Magic Link fields
          tenant_access_token: string | null
          tenant_token_expires_at: string | null
          tenant_token_verified: boolean | null
          tenant_last_access_at: string | null
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
          // Added by migration 20260201100001 - Tenant Magic Link fields
          tenant_access_token?: string | null
          tenant_token_expires_at?: string | null
          tenant_token_verified?: boolean | null
          tenant_last_access_at?: string | null
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
          // Added by migration 20260201100001 - Tenant Magic Link fields
          tenant_access_token?: string | null
          tenant_token_expires_at?: string | null
          tenant_token_verified?: boolean | null
          tenant_last_access_at?: string | null
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
          // Added by migration 20260201100000 - Pro status fields
          pro_status: string | null
          pro_trial_ends_at: string | null
          first_login: boolean | null
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
          // Added by migration 20260201100000 - Pro status fields
          pro_status?: string | null
          pro_trial_ends_at?: string | null
          first_login?: boolean | null
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
          // Added by migration 20260201100000 - Pro status fields
          pro_status?: string | null
          pro_trial_ends_at?: string | null
          first_login?: boolean | null
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
      tenant_access_logs: {
        Row: {
          id: string
          lease_id: string | null
          action: string
          ip_address: string | null
          user_agent: string | null
          failure_reason: string | null
          attempt_count: number
          created_at: string | null
        }
        Insert: {
          id?: string
          lease_id?: string | null
          action: string
          ip_address?: string | null
          user_agent?: string | null
          failure_reason?: string | null
          attempt_count?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          lease_id?: string | null
          action?: string
          ip_address?: string | null
          user_agent?: string | null
          failure_reason?: string | null
          attempt_count?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_access_logs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          }
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

```

---
## 2. UI COMPONENTS (Existing)
Utilise ces composants pour construire l'interface.
# 🗺️ MAP DES COMPOSANTS (242)

Utilise ces composants existants avant d'en créer de nouveaux :

- **<admin-sidebar-client />** (Path: `components\admin\admin-sidebar-client.tsx`)
- **<admin-sidebar />** (Path: `components\admin\admin-sidebar.tsx`)
- **<admin-topbar />** (Path: `components\admin\admin-topbar.tsx`)
- **<dashboard-chart />** (Path: `components\admin\dashboard-chart.tsx`)
- **<dashboard-view />** (Path: `components\admin\dashboard-view.tsx`)
- **<performance-chart />** (Path: `components\admin\performance-chart.tsx`)
- **<top-properties-table />** (Path: `components\admin\top-properties-table.tsx`)
- **<verification-queue />** (Path: `components\admin\verification-queue.tsx`)
- **<conditional-google-analytics />** (Path: `components\analytics\conditional-google-analytics.tsx`)
- **<google-consent-mode />** (Path: `components\analytics\google-consent-mode.tsx`)
- **<lazy-analytics />** (Path: `components\analytics\lazy-analytics.tsx`)
- **<lazy-speed-insights />** (Path: `components\analytics\lazy-speed-insights.tsx`)
- **<microsoft-clarity />** (Path: `components\analytics\microsoft-clarity.tsx`)
- **<update-consent-on-load />** (Path: `components\analytics\update-consent-on-load.tsx`)
- **<phone-missing-dialog />** (Path: `components\auth\phone-missing-dialog.tsx`)
- **<verification-success-toast />** (Path: `components\auth\verification-success-toast.tsx`)
- **<ContractPreview />** (Path: `components\contracts\ContractPreview.tsx`)
- **<GenerateContractButton />** (Path: `components\contracts\GenerateContractButton.tsx`)
- **<GenerateContractModal />** (Path: `components\contracts\GenerateContractModal.tsx`)
- **<ad-certification-upload />** (Path: `components\dashboard\ad-certification-upload.tsx`)
- **<verification-status-badge />** (Path: `components\dashboard\verification-status-badge.tsx`)
- **<verification-upload-form />** (Path: `components\dashboard\verification-upload-form.tsx`)
- **<document-selector />** (Path: `components\document\document-selector.tsx`)
- **<ErrorBoundary />** (Path: `components\ErrorBoundary.tsx`)
- **<address-autocomplete />** (Path: `components\forms\address-autocomplete.tsx`)
- **<address-input-with-map />** (Path: `components\forms\address-input-with-map.tsx`)
- **<AssociateTenantDialog />** (Path: `components\gestion\AssociateTenantDialog.tsx`)
- **<FeatureLockedState />** (Path: `components\gestion\FeatureLockedState.tsx`)
- **<GestionTour />** (Path: `components\gestion\GestionTour.tsx`)
- **<OwnerSelector />** (Path: `components\gestion\OwnerSelector.tsx`)
- **<SubscriptionManager />** (Path: `components\gestion\SubscriptionManager.tsx`)
- **<TeamPropertyCard />** (Path: `components\gestion\TeamPropertyCard.tsx`)
- **<TenantSelector />** (Path: `components\gestion\TenantSelector.tsx`)
- **<BiensTour />** (Path: `components\gestion\tours\BiensTour.tsx`)
- **<ComptabiliteTour />** (Path: `components\gestion\tours\ComptabiliteTour.tsx`)
- **<ConfigTour />** (Path: `components\gestion\tours\ConfigTour.tsx`)
- **<DocumentsTour />** (Path: `components\gestion\tours\DocumentsTour.tsx`)
- **<EquipeTour />** (Path: `components\gestion\tours\EquipeTour.tsx`)
- **<EtatsLieuxTour />** (Path: `components\gestion\tours\EtatsLieuxTour.tsx`)
- **<InterventionsTour />** (Path: `components\gestion\tours\InterventionsTour.tsx`)
- **<LegalTour />** (Path: `components\gestion\tours\LegalTour.tsx`)
- **<MessagesTour />** (Path: `components\gestion\tours\MessagesTour.tsx`)
- **<UpgradeCTA />** (Path: `components\gestion\UpgradeCTA.tsx`)
- **<UpgradeModal />** (Path: `components\gestion\UpgradeModal.tsx`)
- **<HomeTour />** (Path: `components\home\HomeTour.tsx`)
- **<SocialProof />** (Path: `components\home\SocialProof.tsx`)
- **<InfoBox />** (Path: `components\InfoBox.tsx`)
- **<KPICard />** (Path: `components\KPICard.tsx`)
- **<CompareSection />** (Path: `components\landing\CompareSection.tsx`)
- **<ComparisonTable />** (Path: `components\landing\ComparisonTable.tsx`)
- **<DousellNavbar />** (Path: `components\landing\DousellNavbar.tsx`)
- **<DousellNavbarClient />** (Path: `components\landing\DousellNavbarClient.tsx`)
- **<FeaturesBento />** (Path: `components\landing\FeaturesBento.tsx`)
- **<HeroIllustration />** (Path: `components\landing\HeroIllustration.tsx`)
- **<HeroOwnerIllustration />** (Path: `components\landing\HeroOwnerIllustration.tsx`)
- **<Landing3DOverlay />** (Path: `components\landing\Landing3DOverlay.tsx`)
- **<MagicSection />** (Path: `components\landing\MagicSection.tsx`)
- **<MagicTransformation />** (Path: `components\landing\MagicTransformation.tsx`)
- **<PricingCard />** (Path: `components\landing\PricingCard.tsx`)
- **<PricingSection />** (Path: `components\landing\PricingSection.tsx`)
- **<cta-section />** (Path: `components\landing\sections\cta-section.tsx`)
- **<faq-section />** (Path: `components\landing\sections\faq-section.tsx`)
- **<features-section />** (Path: `components\landing\sections\features-section.tsx`)
- **<hero-section />** (Path: `components\landing\sections\hero-section.tsx`)
- **<pricing-section />** (Path: `components\landing\sections\pricing-section.tsx`)
- **<testimonials-section />** (Path: `components\landing\sections\testimonials-section.tsx`)
- **<FeaturedProperties />** (Path: `components\landing\tenant\FeaturedProperties.tsx`)
- **<FeaturedPropertiesHero />** (Path: `components\landing\tenant\FeaturedPropertiesHero.tsx`)
- **<PropertyCategories />** (Path: `components\landing\tenant\PropertyCategories.tsx`)
- **<SearchDropdown />** (Path: `components\landing\tenant\SearchDropdown.tsx`)
- **<TenantBentoGrid />** (Path: `components\landing\tenant\TenantBentoGrid.tsx`)
- **<TenantHeroSearch />** (Path: `components\landing\tenant\TenantHeroSearch.tsx`)
- **<TenantSteps />** (Path: `components\landing\tenant\TenantSteps.tsx`)
- **<TenantTestimonials />** (Path: `components\landing\tenant\TenantTestimonials.tsx`)
- **<TrustSection />** (Path: `components\landing\tenant\TrustSection.tsx`)
- **<VideoTestimonials />** (Path: `components\landing\VideoTestimonials.tsx`)
- **<app-shell />** (Path: `components\layout\app-shell.tsx`)
- **<footer />** (Path: `components\layout\footer.tsx`)
- **<notification-bell />** (Path: `components\layout\notification-bell.tsx`)
- **<scroll-to-top />** (Path: `components\layout\scroll-to-top.tsx`)
- **<user-nav />** (Path: `components\layout\user-nav.tsx`)
- **<LoadingSkeleton />** (Path: `components\LoadingSkeleton.tsx`)
- **<location-picker-dialog />** (Path: `components\maps\location-picker-dialog.tsx`)
- **<AccessRequestModal />** (Path: `components\modals\AccessRequestModal.tsx`)
- **<bottom-nav />** (Path: `components\navigation\bottom-nav.tsx`)
- **<header />** (Path: `components\navigation\header.tsx`)
- **<OnboardingTour />** (Path: `components\onboarding\OnboardingTour.tsx`)
- **<WizardForm />** (Path: `components\onboarding\WizardForm.tsx`)
- **<KKiaPayWidget />** (Path: `components\payment\KKiaPayWidget.tsx`)
- **<paydunya-iframe-payment />** (Path: `components\payment\paydunya-iframe-payment.tsx`)
- **<paydunya-onsite-form />** (Path: `components\payment\paydunya-onsite-form.tsx`)
- **<paydunya-popup-payment />** (Path: `components\payment\paydunya-popup-payment.tsx`)
- **<paydunya-psr-button />** (Path: `components\payment\paydunya-psr-button.tsx`)
- **<paydunya-sdk-form />** (Path: `components\payment\paydunya-sdk-form.tsx`)
- **<StripeRentButton />** (Path: `components\payment\StripeRentButton.tsx`)
- **<DepositReceiptPDF />** (Path: `components\pdf\DepositReceiptPDF.tsx`)
- **<PaymentHistoryPDF />** (Path: `components\pdf\PaymentHistoryPDF.tsx`)
- **<PreavisPDF />** (Path: `components\pdf\PreavisPDF.tsx`)
- **<QuittancePDF />** (Path: `components\pdf\QuittancePDF.tsx`)
- **<QuittancePDF_v2 />** (Path: `components\pdf\QuittancePDF_v2.tsx`)
- **<agent-card />** (Path: `components\property\agent-card.tsx`)
- **<booking-card />** (Path: `components\property\booking-card.tsx`)
- **<contact-bar />** (Path: `components\property\contact-bar.tsx`)
- **<cost-simulator />** (Path: `components\property\cost-simulator.tsx`)
- **<gallery-grid />** (Path: `components\property\gallery-grid.tsx`)
- **<listing-image-carousel />** (Path: `components\property\listing-image-carousel.tsx`)
- **<OwnerCTA />** (Path: `components\property\OwnerCTA.tsx`)
- **<property-card-unified />** (Path: `components\property\property-card-unified.tsx`)
- **<property-card />** (Path: `components\property\property-card.tsx`)
- **<property-detail-view />** (Path: `components\property\property-detail-view.tsx`)
- **<property-gallery />** (Path: `components\property\property-gallery.tsx`)
- **<property-info />** (Path: `components\property\property-info.tsx`)
- **<property-lightbox />** (Path: `components\property\property-lightbox.tsx`)
- **<proximities-section />** (Path: `components\property\proximities-section.tsx`)
- **<review-form />** (Path: `components\property\review-form.tsx`)
- **<review-item />** (Path: `components\property\review-item.tsx`)
- **<share-button />** (Path: `components\property\share-button.tsx`)
- **<similar-properties />** (Path: `components\property\similar-properties.tsx`)
- **<static-map />** (Path: `components\property\static-map.tsx`)
- **<splash-provider />** (Path: `components\providers\splash-provider.tsx`)
- **<suppress-hydration-warning />** (Path: `components\providers\suppress-hydration-warning.tsx`)
- **<install-prompt />** (Path: `components\pwa\install-prompt.tsx`)
- **<push-notifications />** (Path: `components\pwa\push-notifications.tsx`)
- **<service-worker-register />** (Path: `components\pwa\service-worker-register.tsx`)
- **<Faq6 />** (Path: `components\saasable\blocks\Faq6.tsx`)
- **<Feature18 />** (Path: `components\saasable\blocks\Feature18.tsx`)
- **<Footer7 />** (Path: `components\saasable\blocks\Footer7.tsx`)
- **<Hero17 />** (Path: `components\saasable\blocks\Hero17.tsx`)
- **<Pricing9 />** (Path: `components\saasable\blocks\Pricing9.tsx`)
- **<FaqDetails />** (Path: `components\saasable\components\faq\FaqDetails.tsx`)
- **<Copyright />** (Path: `components\saasable\components\footer\Copyright.tsx`)
- **<FollowUS />** (Path: `components\saasable\components\footer\FollowUS.tsx`)
- **<Sitemap />** (Path: `components\saasable\components\footer\Sitemap.tsx`)
- **<LogoSection />** (Path: `components\saasable\components\logo\LogoSection.tsx`)
- **<Typeset />** (Path: `components\saasable\components\Typeset.tsx`)
- **<ConfigContext />** (Path: `components\saasable\contexts\ConfigContext.tsx`)
- **<Wave />** (Path: `components\saasable\images\graphics\Wave.tsx`)
- **<SaasableProvider />** (Path: `components\saasable\SaasableProvider.tsx`)
- **<SaasableSectionWrapper />** (Path: `components\saasable\SaasableSectionWrapper.tsx`)
- **<index />** (Path: `components\saasable\theme\index.tsx`)
- **<ButtonAnimationWrapper />** (Path: `components\saasable\ui\ButtonAnimationWrapper.tsx`)
- **<GraphicsCard />** (Path: `components\saasable\ui\cards\GraphicsCard.tsx`)
- **<ContainerWrapper />** (Path: `components\saasable\ui\ContainerWrapper.tsx`)
- **<GraphicsImage />** (Path: `components\saasable\ui\GraphicsImage.tsx`)
- **<Loader />** (Path: `components\saasable\ui\Loader.tsx`)
- **<SvgIcon />** (Path: `components\saasable\ui\SvgIcon.tsx`)
- **<create-alert-dialog />** (Path: `components\search\create-alert-dialog.tsx`)
- **<filter-drawer />** (Path: `components\search\filter-drawer.tsx`)
- **<GlobalSearch />** (Path: `components\search\GlobalSearch.tsx`)
- **<map-view />** (Path: `components\search\map-view.tsx`)
- **<quick-search />** (Path: `components\search\quick-search.tsx`)
- **<search-experience />** (Path: `components\search\search-experience.tsx`)
- **<hero-premium />** (Path: `components\sections\hero-premium.tsx`)
- **<hero />** (Path: `components\sections\hero.tsx`)
- **<home-seo-content />** (Path: `components\sections\home-seo-content.tsx`)
- **<landing-sections />** (Path: `components\sections\landing-sections.tsx`)
- **<metrics-section />** (Path: `components\sections\metrics-section.tsx`)
- **<new-properties />** (Path: `components\sections\new-properties.tsx`)
- **<property-section />** (Path: `components\sections\property-section.tsx`)
- **<json-ld />** (Path: `components\seo\json-ld.tsx`)
- **<JsonLd />** (Path: `components\seo\JsonLd.tsx`)
- **<ProgrammaticPageTemplate />** (Path: `components\seo\ProgrammaticPageTemplate.tsx`)
- **<ProgrammaticSectionFAQ />** (Path: `components\seo\ProgrammaticSectionFAQ.tsx`)
- **<SimilarListingsSection />** (Path: `components\seo\SimilarListingsSection.tsx`)
- **<MemberQuotaProgress />** (Path: `components\team\MemberQuotaProgress.tsx`)
- **<theme-provider />** (Path: `components\theme-provider.tsx`)
- **<accordion />** (Path: `components\ui\accordion.tsx`)
- **<ace-compare />** (Path: `components\ui\ace-compare.tsx`)
- **<ace-navbar />** (Path: `components\ui\ace-navbar.tsx`)
- **<alert />** (Path: `components\ui\alert.tsx`)
- **<animated-counter />** (Path: `components\ui\animated-counter.tsx`)
- **<appointment-scheduler />** (Path: `components\ui\appointment-scheduler.tsx`)
- **<avatar />** (Path: `components\ui\avatar.tsx`)
- **<badge />** (Path: `components\ui\badge.tsx`)
- **<breadcrumbs />** (Path: `components\ui\breadcrumbs.tsx`)
- **<button />** (Path: `components\ui\button.tsx`)
- **<captcha />** (Path: `components\ui\captcha.tsx`)
- **<card />** (Path: `components\ui\card.tsx`)
- **<combobox />** (Path: `components\ui\combobox.tsx`)
- **<command />** (Path: `components\ui\command.tsx`)
- **<container-scroll-animation />** (Path: `components\ui\container-scroll-animation.tsx`)
- **<cookie-consent />** (Path: `components\ui\cookie-consent.tsx`)
- **<cta-section />** (Path: `components\ui\cta-section.tsx`)
- **<dialog />** (Path: `components\ui\dialog.tsx`)
- **<display-cards />** (Path: `components\ui\display-cards.tsx`)
- **<dropdown-menu />** (Path: `components\ui\dropdown-menu.tsx`)
- **<empty-state />** (Path: `components\ui\empty-state.tsx`)
- **<fade-in />** (Path: `components\ui\fade-in.tsx`)
- **<faq-accordion />** (Path: `components\ui\faq-accordion.tsx`)
- **<feature-grid />** (Path: `components\ui\feature-grid.tsx`)
- **<floating-help-button />** (Path: `components\ui\floating-help-button.tsx`)
- **<glow-effect />** (Path: `components\ui\glow-effect.tsx`)
- **<gold-particles />** (Path: `components\ui\gold-particles.tsx`)
- **<hero-1 />** (Path: `components\ui\hero-1.tsx`)
- **<info-tooltip />** (Path: `components\ui\info-tooltip.tsx`)
- **<input-otp />** (Path: `components\ui\input-otp.tsx`)
- **<input />** (Path: `components\ui\input.tsx`)
- **<label />** (Path: `components\ui\label.tsx`)
- **<loader-blueprint />** (Path: `components\ui\loader-blueprint.tsx`)
- **<motion-wrapper />** (Path: `components\ui\motion-wrapper.tsx`)
- **<optimized-image />** (Path: `components\ui\optimized-image.tsx`)
- **<otp-input />** (Path: `components\ui\otp-input.tsx`)
- **<pagination />** (Path: `components\ui\pagination.tsx`)
- **<parallax-video />** (Path: `components\ui\parallax-video.tsx`)
- **<phone-input />** (Path: `components\ui\phone-input.tsx`)
- **<popover />** (Path: `components\ui\popover.tsx`)
- **<progress />** (Path: `components\ui\progress.tsx`)
- **<radio-group />** (Path: `components\ui\radio-group.tsx`)
- **<scroll-area />** (Path: `components\ui\scroll-area.tsx`)
- **<select />** (Path: `components\ui\select.tsx`)
- **<separator />** (Path: `components\ui\separator.tsx`)
- **<sheet />** (Path: `components\ui\sheet.tsx`)
- **<shimmer-effect />** (Path: `components\ui\shimmer-effect.tsx`)
- **<shooting-stars />** (Path: `components\ui\shooting-stars.tsx`)
- **<skeleton />** (Path: `components\ui\skeleton.tsx`)
- **<slider />** (Path: `components\ui\slider.tsx`)
- **<software-icon />** (Path: `components\ui\software-icon.tsx`)
- **<sonner />** (Path: `components\ui\sonner.tsx`)
- **<splash-screen />** (Path: `components\ui\splash-screen.tsx`)
- **<stagger-list />** (Path: `components\ui\stagger-list.tsx`)
- **<switch />** (Path: `components\ui\switch.tsx`)
- **<table />** (Path: `components\ui\table.tsx`)
- **<tabs />** (Path: `components\ui\tabs.tsx`)
- **<testimonial-cards />** (Path: `components\ui\testimonial-cards.tsx`)
- **<testimonial-masonry />** (Path: `components\ui\testimonial-masonry.tsx`)
- **<textarea />** (Path: `components\ui\textarea.tsx`)
- **<toggle-group />** (Path: `components\ui\toggle-group.tsx`)
- **<tooltip />** (Path: `components\ui\tooltip.tsx`)
- **<touchable />** (Path: `components\ui\touchable.tsx`)
- **<verified-badge />** (Path: `components\ui\verified-badge.tsx`)
- **<workspace-switch />** (Path: `components\ui\workspace-switch.tsx`)
- **<welcome-modal-client />** (Path: `components\welcome-modal-client.tsx`)
- **<welcome-modal />** (Path: `components\welcome-modal.tsx`)
- **<estimation-wizard />** (Path: `components\wizard\estimation-wizard.tsx`)
- **<LockedSidebarItem />** (Path: `components\workspace\LockedSidebarItem.tsx`)
- **<OwnerRoleSwitcher />** (Path: `components\workspace\OwnerRoleSwitcher.tsx`)
- **<TeamSwitcher />** (Path: `components\workspace\TeamSwitcher.tsx`)
- **<TemporaryAccessWidget />** (Path: `components\workspace\TemporaryAccessWidget.tsx`)
- **<TemporaryPermissionsWidget />** (Path: `components\workspace\TemporaryPermissionsWidget.tsx`)
- **<workspace-bottom-nav />** (Path: `components\workspace\workspace-bottom-nav.tsx`)
- **<workspace-header />** (Path: `components\workspace\workspace-header.tsx`)
- **<workspace-sidebar />** (Path: `components\workspace\workspace-sidebar.tsx`)
