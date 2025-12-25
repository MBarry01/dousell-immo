drop extension if exists "pg_net";

create type "public"."lead_status" as enum ('nouveau', 'contacté', 'visite_programmée', 'clos');

create type "public"."notification_type" as enum ('info', 'success', 'warning', 'error');


  create table "public"."document_listing_usage" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "listing_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."document_listing_usage" enable row level security;


  create table "public"."email_logs" (
    "id" uuid not null default gen_random_uuid(),
    "to_email" text not null,
    "subject" text,
    "status" text not null,
    "resend_response" jsonb,
    "error_text" text,
    "user_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."email_logs" enable row level security;


  create table "public"."leads" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "property_id" uuid,
    "user_id" uuid,
    "name" text not null,
    "phone" text not null,
    "message" text,
    "type" text default 'visite'::text,
    "status" public.lead_status default 'nouveau'::public.lead_status,
    "source" text
      );


alter table "public"."leads" enable row level security;


  create table "public"."notification_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "preferences" jsonb not null default '{"price_drops": true, "new_properties": true, "matching_alerts": true, "property_updates": true}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."notification_preferences" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" public.notification_type not null default 'info'::public.notification_type,
    "title" text not null,
    "message" text not null,
    "resource_path" text,
    "is_read" boolean not null default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text,
    "display_name" text,
    "avatar_url" text,
    "website" text,
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "phone" text,
    "role" text default 'particulier'::text,
    "identity_card_url" text,
    "residence_proof_url" text,
    "identity_document_url" text,
    "address_document_url" text,
    "kyc_status" text default 'NONE'::text
      );


alter table "public"."profiles" enable row level security;


  create table "public"."properties" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "price" numeric not null default 0,
    "currency" text not null default 'FCFA'::text,
    "category" text not null,
    "status" text not null default 'disponible'::text,
    "location" jsonb not null default '{}'::jsonb,
    "specs" jsonb not null default '{}'::jsonb,
    "features" jsonb default '{}'::jsonb,
    "details" jsonb default '{}'::jsonb,
    "images" text[] default '{}'::text[],
    "agent" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "owner_id" uuid,
    "is_agency_listing" boolean default true,
    "validation_status" text default 'approved'::text,
    "service_type" text,
    "payment_ref" text,
    "views_count" integer default 0,
    "rejection_reason" text,
    "property_type" text,
    "contact_phone" text,
    "view_count" integer not null default 0,
    "payment_amount" numeric(10,2),
    "service_name" text,
    "proof_document_url" text,
    "verification_status" text default 'pending'::text,
    "verification_note" text,
    "verification_date" timestamp with time zone,
    "verification_requested_at" timestamp with time zone,
    "verification_reviewed_at" timestamp with time zone,
    "verification_rejection_reason" text
      );


alter table "public"."properties" enable row level security;


  create table "public"."property_stats" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "action_type" text not null,
    "user_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."property_stats" enable row level security;


  create table "public"."review_reactions" (
    "id" uuid not null default gen_random_uuid(),
    "review_id" uuid not null,
    "user_id" uuid not null,
    "reaction_type" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."review_reactions" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "user_id" uuid not null,
    "rating" integer not null,
    "comment" text,
    "user_name" text not null,
    "user_photo" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."reviews" enable row level security;


  create table "public"."search_alerts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "filters" jsonb not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."search_alerts" enable row level security;


  create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "price" integer not null default 0,
    "description" text,
    "features" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."services" enable row level security;


  create table "public"."user_documents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "name" text not null,
    "url" text not null,
    "status" text default 'PENDING'::text,
    "rejection_reason" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "source" text not null default 'manual'::text
      );


alter table "public"."user_documents" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" text not null,
    "granted_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_roles" enable row level security;


  create table "public"."user_roles_audit" (
    "id" uuid not null default gen_random_uuid(),
    "user_role_id" uuid,
    "target_user" uuid not null,
    "role" text not null,
    "action" text not null,
    "performed_by" uuid,
    "performed_at" timestamp with time zone default now(),
    "details" jsonb default '{}'::jsonb
      );


alter table "public"."user_roles_audit" enable row level security;


  create table "public"."visit_requests" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "phone" text not null,
    "project_type" text not null,
    "availability" text not null,
    "message" text not null,
    "status" text not null default 'nouveau'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."visit_requests" enable row level security;

CREATE UNIQUE INDEX document_listing_usage_document_id_listing_id_key ON public.document_listing_usage USING btree (document_id, listing_id);

CREATE UNIQUE INDEX document_listing_usage_pkey ON public.document_listing_usage USING btree (id);

CREATE UNIQUE INDEX email_logs_pkey ON public.email_logs USING btree (id);

CREATE INDEX idx_document_listing_usage_document_id ON public.document_listing_usage USING btree (document_id);

CREATE INDEX idx_document_listing_usage_listing_id ON public.document_listing_usage USING btree (listing_id);

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);

CREATE INDEX idx_leads_property_id ON public.leads USING btree (property_id);

CREATE INDEX idx_leads_status ON public.leads USING btree (status);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read) WHERE (is_read = false);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_notifications_user_id_is_read ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_profiles_kyc_status ON public.profiles USING btree (kyc_status);

CREATE INDEX idx_profiles_updated_at ON public.profiles USING btree (updated_at);

CREATE INDEX idx_properties_is_agency_listing ON public.properties USING btree (is_agency_listing);

CREATE INDEX idx_properties_owner_id ON public.properties USING btree (owner_id);

CREATE INDEX idx_properties_validation_status ON public.properties USING btree (validation_status);

CREATE INDEX idx_properties_verification_status ON public.properties USING btree (verification_status) WHERE (verification_status <> 'none'::text);

CREATE INDEX idx_properties_view_count ON public.properties USING btree (view_count) WHERE (view_count > 0);

CREATE INDEX idx_property_stats_action_type ON public.property_stats USING btree (action_type);

CREATE INDEX idx_property_stats_created_at ON public.property_stats USING btree (created_at DESC);

CREATE INDEX idx_property_stats_property_action ON public.property_stats USING btree (property_id, action_type);

CREATE INDEX idx_property_stats_property_id ON public.property_stats USING btree (property_id);

CREATE INDEX idx_property_stats_user_id ON public.property_stats USING btree (user_id);

CREATE INDEX idx_review_reactions_review_id ON public.review_reactions USING btree (review_id);

CREATE INDEX idx_review_reactions_type ON public.review_reactions USING btree (reaction_type);

CREATE INDEX idx_review_reactions_user_id ON public.review_reactions USING btree (user_id);

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);

CREATE INDEX idx_reviews_property_id ON public.reviews USING btree (property_id);

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);

CREATE INDEX idx_search_alerts_created_at ON public.search_alerts USING btree (created_at DESC);

CREATE INDEX idx_search_alerts_user_active ON public.search_alerts USING btree (user_id, is_active);

CREATE INDEX idx_search_alerts_user_id ON public.search_alerts USING btree (user_id);

CREATE INDEX idx_user_documents_source ON public.user_documents USING btree (source);

CREATE INDEX idx_user_documents_status ON public.user_documents USING btree (status);

CREATE INDEX idx_user_documents_type ON public.user_documents USING btree (type);

CREATE INDEX idx_user_documents_user_id ON public.user_documents USING btree (user_id);

CREATE INDEX idx_user_roles_audit_performed_at ON public.user_roles_audit USING btree (performed_at DESC);

CREATE INDEX idx_user_roles_audit_target_user ON public.user_roles_audit USING btree (target_user);

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE INDEX idx_user_roles_user_role ON public.user_roles USING btree (user_id, role);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id);

CREATE UNIQUE INDEX notification_preferences_user_id_unique ON public.notification_preferences USING btree (user_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX properties_category_idx ON public.properties USING btree (category);

CREATE INDEX properties_city_idx ON public.properties USING btree (((location ->> 'city'::text)));

CREATE INDEX properties_district_idx ON public.properties USING btree (((location ->> 'district'::text)));

CREATE UNIQUE INDEX properties_pkey ON public.properties USING btree (id);

CREATE INDEX properties_status_idx ON public.properties USING btree (status);

CREATE UNIQUE INDEX property_stats_pkey ON public.property_stats USING btree (id);

CREATE UNIQUE INDEX review_reactions_pkey ON public.review_reactions USING btree (id);

CREATE UNIQUE INDEX review_reactions_review_id_user_id_key ON public.review_reactions USING btree (review_id, user_id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX reviews_property_id_user_id_key ON public.reviews USING btree (property_id, user_id);

CREATE UNIQUE INDEX search_alerts_pkey ON public.search_alerts USING btree (id);

CREATE UNIQUE INDEX services_code_key ON public.services USING btree (code);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX user_documents_pkey ON public.user_documents USING btree (id);

CREATE UNIQUE INDEX user_roles_audit_pkey ON public.user_roles_audit USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

CREATE UNIQUE INDEX visit_requests_pkey ON public.visit_requests USING btree (id);

alter table "public"."document_listing_usage" add constraint "document_listing_usage_pkey" PRIMARY KEY using index "document_listing_usage_pkey";

alter table "public"."email_logs" add constraint "email_logs_pkey" PRIMARY KEY using index "email_logs_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_pkey" PRIMARY KEY using index "notification_preferences_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."properties" add constraint "properties_pkey" PRIMARY KEY using index "properties_pkey";

alter table "public"."property_stats" add constraint "property_stats_pkey" PRIMARY KEY using index "property_stats_pkey";

alter table "public"."review_reactions" add constraint "review_reactions_pkey" PRIMARY KEY using index "review_reactions_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."search_alerts" add constraint "search_alerts_pkey" PRIMARY KEY using index "search_alerts_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."user_documents" add constraint "user_documents_pkey" PRIMARY KEY using index "user_documents_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."user_roles_audit" add constraint "user_roles_audit_pkey" PRIMARY KEY using index "user_roles_audit_pkey";

alter table "public"."visit_requests" add constraint "visit_requests_pkey" PRIMARY KEY using index "visit_requests_pkey";

alter table "public"."document_listing_usage" add constraint "document_listing_usage_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.user_documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_listing_usage" validate constraint "document_listing_usage_document_id_fkey";

alter table "public"."document_listing_usage" add constraint "document_listing_usage_document_id_listing_id_key" UNIQUE using index "document_listing_usage_document_id_listing_id_key";

alter table "public"."document_listing_usage" add constraint "document_listing_usage_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."document_listing_usage" validate constraint "document_listing_usage_listing_id_fkey";

alter table "public"."leads" add constraint "leads_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) not valid;

alter table "public"."leads" validate constraint "leads_property_id_fkey";

alter table "public"."leads" add constraint "leads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."leads" validate constraint "leads_user_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notification_preferences" validate constraint "notification_preferences_user_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_user_id_unique" UNIQUE using index "notification_preferences_user_id_unique";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_kyc_status_check" CHECK ((kyc_status = ANY (ARRAY['NONE'::text, 'PENDING'::text, 'VERIFIED'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_kyc_status_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['particulier'::text, 'agent'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."properties" add constraint "properties_category_check" CHECK ((category = ANY (ARRAY['vente'::text, 'location'::text]))) not valid;

alter table "public"."properties" validate constraint "properties_category_check";

alter table "public"."properties" add constraint "properties_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."properties" validate constraint "properties_owner_id_fkey";

alter table "public"."properties" add constraint "properties_service_type_check" CHECK ((service_type = ANY (ARRAY['mandat_confort'::text, 'boost_visibilite'::text]))) not valid;

alter table "public"."properties" validate constraint "properties_service_type_check";

alter table "public"."properties" add constraint "properties_status_check" CHECK ((status = ANY (ARRAY['disponible'::text, 'sous-offre'::text, 'vendu'::text]))) not valid;

alter table "public"."properties" validate constraint "properties_status_check";

alter table "public"."properties" add constraint "properties_validation_status_check" CHECK ((validation_status = ANY (ARRAY['pending'::text, 'payment_pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."properties" validate constraint "properties_validation_status_check";

alter table "public"."properties" add constraint "properties_verification_status_check" CHECK ((verification_status = ANY (ARRAY['none'::text, 'pending'::text, 'verified'::text, 'rejected'::text]))) not valid;

alter table "public"."properties" validate constraint "properties_verification_status_check";

alter table "public"."property_stats" add constraint "property_stats_action_type_check" CHECK ((action_type = ANY (ARRAY['view'::text, 'whatsapp_click'::text, 'phone_click'::text]))) not valid;

alter table "public"."property_stats" validate constraint "property_stats_action_type_check";

alter table "public"."property_stats" add constraint "property_stats_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_stats" validate constraint "property_stats_property_id_fkey";

alter table "public"."property_stats" add constraint "property_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."property_stats" validate constraint "property_stats_user_id_fkey";

alter table "public"."review_reactions" add constraint "review_reactions_reaction_type_check" CHECK ((reaction_type = ANY (ARRAY['like'::text, 'dislike'::text]))) not valid;

alter table "public"."review_reactions" validate constraint "review_reactions_reaction_type_check";

alter table "public"."review_reactions" add constraint "review_reactions_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE not valid;

alter table "public"."review_reactions" validate constraint "review_reactions_review_id_fkey";

alter table "public"."review_reactions" add constraint "review_reactions_review_id_user_id_key" UNIQUE using index "review_reactions_review_id_user_id_key";

alter table "public"."review_reactions" add constraint "review_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."review_reactions" validate constraint "review_reactions_user_id_fkey";

alter table "public"."reviews" add constraint "reviews_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_property_id_fkey";

alter table "public"."reviews" add constraint "reviews_property_id_user_id_key" UNIQUE using index "reviews_property_id_user_id_key";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."search_alerts" add constraint "search_alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."search_alerts" validate constraint "search_alerts_user_id_fkey";

alter table "public"."services" add constraint "services_code_key" UNIQUE using index "services_code_key";

alter table "public"."user_documents" add constraint "user_documents_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'verification'::text]))) not valid;

alter table "public"."user_documents" validate constraint "user_documents_source_check";

alter table "public"."user_documents" add constraint "user_documents_status_check" CHECK ((status = ANY (ARRAY['PENDING'::text, 'VALID'::text, 'REJECTED'::text]))) not valid;

alter table "public"."user_documents" validate constraint "user_documents_status_check";

alter table "public"."user_documents" add constraint "user_documents_type_check" CHECK ((type = ANY (ARRAY['IDENTITY'::text, 'TAX'::text, 'COMPANY'::text, 'ADDRESS'::text, 'OTHER'::text]))) not valid;

alter table "public"."user_documents" validate constraint "user_documents_type_check";

alter table "public"."user_documents" add constraint "user_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_documents" validate constraint "user_documents_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."user_roles" validate constraint "user_roles_granted_by_fkey";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'moderateur'::text, 'agent'::text, 'superadmin'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_resource_path text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Insérer la notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    resource_path,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_type::text,
    p_title,
    p_message,
    p_resource_path,
    false,
    now()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_user_id(admin_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = LOWER(admin_email)
  LIMIT 1;
  RETURN admin_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_property_average_rating(property_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
    FROM public.reviews
    WHERE property_id = property_uuid
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_property_owner_id(property_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT owner_id FROM properties WHERE id = property_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_property_reviews_count(property_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.reviews
    WHERE property_id = property_uuid
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_users()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT COUNT(*)::integer
  FROM auth.users
  WHERE deleted_at IS NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = user_uuid AND is_read = false
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_metadata(user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  user_metadata JSON;
BEGIN
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = user_id;
  RETURN COALESCE(user_metadata, '{}'::JSON);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT role::TEXT
    FROM public.user_roles
    WHERE user_id = target_user_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
 RETURNS TABLE(id uuid, email text, full_name text, phone text, roles text[], created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND LOWER(auth.users.email) = 'barrymohamadou98@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE((u.raw_user_meta_data->>'full_name')::TEXT, NULL) as full_name,
    COALESCE((u.raw_user_meta_data->>'phone')::TEXT, NULL) as phone,
    COALESCE(
      ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as roles,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  GROUP BY u.id, u.email, u.raw_user_meta_data, u.created_at
  ORDER BY u.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_role(target_user uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  caller uuid;
BEGIN
  -- Vérifier que l'appelant est admin ou superadmin
  SELECT (auth.uid())::uuid INTO caller;

  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin or admin';
  END IF;

  INSERT INTO public.user_roles(user_id, role, granted_by)
  VALUES (target_user, p_role, caller)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_documents_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_view_count(property_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = property_id_param
  RETURNING view_count INTO new_count;
  
  -- Si la propriété n'existe pas, retourner 0
  IF new_count IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN new_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_superadmin(u uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u AND ur.role = 'superadmin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_superadmin_or_admin(u uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u AND ur.role IN ('superadmin', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = u AND LOWER(email) = 'barrymohamadou98@gmail.com'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.revoke_role(target_user uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  caller uuid;
  ur_id uuid;
BEGIN
  SELECT (auth.uid())::uuid INTO caller;

  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin or admin';
  END IF;

  SELECT id INTO ur_id
  FROM public.user_roles
  WHERE user_id = target_user AND role = p_role
  LIMIT 1;

  IF ur_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE id = ur_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_search_alerts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_admin_role(check_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('admin', 'moderateur', 'superadmin')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_role(user_id_param uuid, role_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = user_id_param
    AND user_roles.role = role_param
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_roles_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles_audit(user_role_id, target_user, role, action, performed_by, details)
    VALUES (NEW.id, NEW.user_id, NEW.role, 'grant', NEW.granted_by, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_roles_audit(user_role_id, target_user, role, action, performed_by, details)
    VALUES (OLD.id, OLD.user_id, OLD.role, 'revoke', OLD.granted_by, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_roles_audit(user_role_id, target_user, role, action, performed_by, details)
    VALUES (NEW.id, NEW.user_id, NEW.role, 'update', NEW.granted_by, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
END;
$function$
;

grant delete on table "public"."document_listing_usage" to "anon";

grant insert on table "public"."document_listing_usage" to "anon";

grant references on table "public"."document_listing_usage" to "anon";

grant select on table "public"."document_listing_usage" to "anon";

grant trigger on table "public"."document_listing_usage" to "anon";

grant truncate on table "public"."document_listing_usage" to "anon";

grant update on table "public"."document_listing_usage" to "anon";

grant delete on table "public"."document_listing_usage" to "authenticated";

grant insert on table "public"."document_listing_usage" to "authenticated";

grant references on table "public"."document_listing_usage" to "authenticated";

grant select on table "public"."document_listing_usage" to "authenticated";

grant trigger on table "public"."document_listing_usage" to "authenticated";

grant truncate on table "public"."document_listing_usage" to "authenticated";

grant update on table "public"."document_listing_usage" to "authenticated";

grant delete on table "public"."document_listing_usage" to "service_role";

grant insert on table "public"."document_listing_usage" to "service_role";

grant references on table "public"."document_listing_usage" to "service_role";

grant select on table "public"."document_listing_usage" to "service_role";

grant trigger on table "public"."document_listing_usage" to "service_role";

grant truncate on table "public"."document_listing_usage" to "service_role";

grant update on table "public"."document_listing_usage" to "service_role";

grant delete on table "public"."email_logs" to "anon";

grant insert on table "public"."email_logs" to "anon";

grant references on table "public"."email_logs" to "anon";

grant select on table "public"."email_logs" to "anon";

grant trigger on table "public"."email_logs" to "anon";

grant truncate on table "public"."email_logs" to "anon";

grant update on table "public"."email_logs" to "anon";

grant delete on table "public"."email_logs" to "authenticated";

grant insert on table "public"."email_logs" to "authenticated";

grant references on table "public"."email_logs" to "authenticated";

grant select on table "public"."email_logs" to "authenticated";

grant trigger on table "public"."email_logs" to "authenticated";

grant truncate on table "public"."email_logs" to "authenticated";

grant update on table "public"."email_logs" to "authenticated";

grant delete on table "public"."email_logs" to "service_role";

grant insert on table "public"."email_logs" to "service_role";

grant references on table "public"."email_logs" to "service_role";

grant select on table "public"."email_logs" to "service_role";

grant trigger on table "public"."email_logs" to "service_role";

grant truncate on table "public"."email_logs" to "service_role";

grant update on table "public"."email_logs" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant references on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant trigger on table "public"."leads" to "anon";

grant truncate on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant references on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant trigger on table "public"."leads" to "authenticated";

grant truncate on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant references on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant trigger on table "public"."leads" to "service_role";

grant truncate on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."notification_preferences" to "anon";

grant insert on table "public"."notification_preferences" to "anon";

grant references on table "public"."notification_preferences" to "anon";

grant select on table "public"."notification_preferences" to "anon";

grant trigger on table "public"."notification_preferences" to "anon";

grant truncate on table "public"."notification_preferences" to "anon";

grant update on table "public"."notification_preferences" to "anon";

grant delete on table "public"."notification_preferences" to "authenticated";

grant insert on table "public"."notification_preferences" to "authenticated";

grant references on table "public"."notification_preferences" to "authenticated";

grant select on table "public"."notification_preferences" to "authenticated";

grant trigger on table "public"."notification_preferences" to "authenticated";

grant truncate on table "public"."notification_preferences" to "authenticated";

grant update on table "public"."notification_preferences" to "authenticated";

grant delete on table "public"."notification_preferences" to "service_role";

grant insert on table "public"."notification_preferences" to "service_role";

grant references on table "public"."notification_preferences" to "service_role";

grant select on table "public"."notification_preferences" to "service_role";

grant trigger on table "public"."notification_preferences" to "service_role";

grant truncate on table "public"."notification_preferences" to "service_role";

grant update on table "public"."notification_preferences" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."properties" to "anon";

grant insert on table "public"."properties" to "anon";

grant references on table "public"."properties" to "anon";

grant select on table "public"."properties" to "anon";

grant trigger on table "public"."properties" to "anon";

grant truncate on table "public"."properties" to "anon";

grant update on table "public"."properties" to "anon";

grant delete on table "public"."properties" to "authenticated";

grant insert on table "public"."properties" to "authenticated";

grant references on table "public"."properties" to "authenticated";

grant select on table "public"."properties" to "authenticated";

grant trigger on table "public"."properties" to "authenticated";

grant truncate on table "public"."properties" to "authenticated";

grant update on table "public"."properties" to "authenticated";

grant delete on table "public"."properties" to "service_role";

grant insert on table "public"."properties" to "service_role";

grant references on table "public"."properties" to "service_role";

grant select on table "public"."properties" to "service_role";

grant trigger on table "public"."properties" to "service_role";

grant truncate on table "public"."properties" to "service_role";

grant update on table "public"."properties" to "service_role";

grant delete on table "public"."property_stats" to "anon";

grant insert on table "public"."property_stats" to "anon";

grant references on table "public"."property_stats" to "anon";

grant select on table "public"."property_stats" to "anon";

grant trigger on table "public"."property_stats" to "anon";

grant truncate on table "public"."property_stats" to "anon";

grant update on table "public"."property_stats" to "anon";

grant delete on table "public"."property_stats" to "authenticated";

grant insert on table "public"."property_stats" to "authenticated";

grant references on table "public"."property_stats" to "authenticated";

grant select on table "public"."property_stats" to "authenticated";

grant trigger on table "public"."property_stats" to "authenticated";

grant truncate on table "public"."property_stats" to "authenticated";

grant update on table "public"."property_stats" to "authenticated";

grant delete on table "public"."property_stats" to "service_role";

grant insert on table "public"."property_stats" to "service_role";

grant references on table "public"."property_stats" to "service_role";

grant select on table "public"."property_stats" to "service_role";

grant trigger on table "public"."property_stats" to "service_role";

grant truncate on table "public"."property_stats" to "service_role";

grant update on table "public"."property_stats" to "service_role";

grant delete on table "public"."review_reactions" to "anon";

grant insert on table "public"."review_reactions" to "anon";

grant references on table "public"."review_reactions" to "anon";

grant select on table "public"."review_reactions" to "anon";

grant trigger on table "public"."review_reactions" to "anon";

grant truncate on table "public"."review_reactions" to "anon";

grant update on table "public"."review_reactions" to "anon";

grant delete on table "public"."review_reactions" to "authenticated";

grant insert on table "public"."review_reactions" to "authenticated";

grant references on table "public"."review_reactions" to "authenticated";

grant select on table "public"."review_reactions" to "authenticated";

grant trigger on table "public"."review_reactions" to "authenticated";

grant truncate on table "public"."review_reactions" to "authenticated";

grant update on table "public"."review_reactions" to "authenticated";

grant delete on table "public"."review_reactions" to "service_role";

grant insert on table "public"."review_reactions" to "service_role";

grant references on table "public"."review_reactions" to "service_role";

grant select on table "public"."review_reactions" to "service_role";

grant trigger on table "public"."review_reactions" to "service_role";

grant truncate on table "public"."review_reactions" to "service_role";

grant update on table "public"."review_reactions" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."search_alerts" to "anon";

grant insert on table "public"."search_alerts" to "anon";

grant references on table "public"."search_alerts" to "anon";

grant select on table "public"."search_alerts" to "anon";

grant trigger on table "public"."search_alerts" to "anon";

grant truncate on table "public"."search_alerts" to "anon";

grant update on table "public"."search_alerts" to "anon";

grant delete on table "public"."search_alerts" to "authenticated";

grant insert on table "public"."search_alerts" to "authenticated";

grant references on table "public"."search_alerts" to "authenticated";

grant select on table "public"."search_alerts" to "authenticated";

grant trigger on table "public"."search_alerts" to "authenticated";

grant truncate on table "public"."search_alerts" to "authenticated";

grant update on table "public"."search_alerts" to "authenticated";

grant delete on table "public"."search_alerts" to "service_role";

grant insert on table "public"."search_alerts" to "service_role";

grant references on table "public"."search_alerts" to "service_role";

grant select on table "public"."search_alerts" to "service_role";

grant trigger on table "public"."search_alerts" to "service_role";

grant truncate on table "public"."search_alerts" to "service_role";

grant update on table "public"."search_alerts" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant delete on table "public"."user_documents" to "anon";

grant insert on table "public"."user_documents" to "anon";

grant references on table "public"."user_documents" to "anon";

grant select on table "public"."user_documents" to "anon";

grant trigger on table "public"."user_documents" to "anon";

grant truncate on table "public"."user_documents" to "anon";

grant update on table "public"."user_documents" to "anon";

grant delete on table "public"."user_documents" to "authenticated";

grant insert on table "public"."user_documents" to "authenticated";

grant references on table "public"."user_documents" to "authenticated";

grant select on table "public"."user_documents" to "authenticated";

grant trigger on table "public"."user_documents" to "authenticated";

grant truncate on table "public"."user_documents" to "authenticated";

grant update on table "public"."user_documents" to "authenticated";

grant delete on table "public"."user_documents" to "service_role";

grant insert on table "public"."user_documents" to "service_role";

grant references on table "public"."user_documents" to "service_role";

grant select on table "public"."user_documents" to "service_role";

grant trigger on table "public"."user_documents" to "service_role";

grant truncate on table "public"."user_documents" to "service_role";

grant update on table "public"."user_documents" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."user_roles_audit" to "anon";

grant insert on table "public"."user_roles_audit" to "anon";

grant references on table "public"."user_roles_audit" to "anon";

grant select on table "public"."user_roles_audit" to "anon";

grant trigger on table "public"."user_roles_audit" to "anon";

grant truncate on table "public"."user_roles_audit" to "anon";

grant update on table "public"."user_roles_audit" to "anon";

grant delete on table "public"."user_roles_audit" to "authenticated";

grant insert on table "public"."user_roles_audit" to "authenticated";

grant references on table "public"."user_roles_audit" to "authenticated";

grant select on table "public"."user_roles_audit" to "authenticated";

grant trigger on table "public"."user_roles_audit" to "authenticated";

grant truncate on table "public"."user_roles_audit" to "authenticated";

grant update on table "public"."user_roles_audit" to "authenticated";

grant delete on table "public"."user_roles_audit" to "service_role";

grant insert on table "public"."user_roles_audit" to "service_role";

grant references on table "public"."user_roles_audit" to "service_role";

grant select on table "public"."user_roles_audit" to "service_role";

grant trigger on table "public"."user_roles_audit" to "service_role";

grant truncate on table "public"."user_roles_audit" to "service_role";

grant update on table "public"."user_roles_audit" to "service_role";

grant delete on table "public"."visit_requests" to "anon";

grant insert on table "public"."visit_requests" to "anon";

grant references on table "public"."visit_requests" to "anon";

grant select on table "public"."visit_requests" to "anon";

grant trigger on table "public"."visit_requests" to "anon";

grant truncate on table "public"."visit_requests" to "anon";

grant update on table "public"."visit_requests" to "anon";

grant delete on table "public"."visit_requests" to "authenticated";

grant insert on table "public"."visit_requests" to "authenticated";

grant references on table "public"."visit_requests" to "authenticated";

grant select on table "public"."visit_requests" to "authenticated";

grant trigger on table "public"."visit_requests" to "authenticated";

grant truncate on table "public"."visit_requests" to "authenticated";

grant update on table "public"."visit_requests" to "authenticated";

grant delete on table "public"."visit_requests" to "service_role";

grant insert on table "public"."visit_requests" to "service_role";

grant references on table "public"."visit_requests" to "service_role";

grant select on table "public"."visit_requests" to "service_role";

grant trigger on table "public"."visit_requests" to "service_role";

grant truncate on table "public"."visit_requests" to "service_role";

grant update on table "public"."visit_requests" to "service_role";


  create policy "Admins can manage all document usages"
  on "public"."document_listing_usage"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can create own document usages"
  on "public"."document_listing_usage"
  as permissive
  for insert
  to public
with check (((EXISTS ( SELECT 1
   FROM public.user_documents
  WHERE ((user_documents.id = document_listing_usage.document_id) AND (user_documents.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = document_listing_usage.listing_id) AND (properties.owner_id = auth.uid()))))));



  create policy "Users can read own document usages"
  on "public"."document_listing_usage"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_documents
  WHERE ((user_documents.id = document_listing_usage.document_id) AND (user_documents.user_id = auth.uid())))));



  create policy "email_logs_admin_select"
  on "public"."email_logs"
  as permissive
  for select
  to authenticated
using ((((auth.jwt() ->> 'role'::text) = 'admin'::text) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "owners_only"
  on "public"."email_logs"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "admins_can_manage_all_leads"
  on "public"."leads"
  as permissive
  for all
  to authenticated
using (public.user_has_admin_role(auth.uid()))
with check (public.user_has_admin_role(auth.uid()));



  create policy "admins_can_view_leads"
  on "public"."leads"
  as permissive
  for select
  to authenticated
using (public.user_has_admin_role(auth.uid()));



  create policy "leads_admins_manage"
  on "public"."leads"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));



  create policy "Users can create their own notification preferences"
  on "public"."notification_preferences"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete their own notification preferences"
  on "public"."notification_preferences"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own notification preferences"
  on "public"."notification_preferences"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own notification preferences"
  on "public"."notification_preferences"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Service can insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "Service role full access"
  on "public"."notifications"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can read their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can update their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "service_insert_notifications"
  on "public"."notifications"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "users_create_own_notifications"
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "profiles_delete_own"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "profiles_insert_own"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "service_manage_profiles"
  on "public"."profiles"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Owners can update their own properties"
  on "public"."properties"
  as permissive
  for update
  to authenticated
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));



  create policy "Public properties are viewable by everyone"
  on "public"."properties"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Users can delete their own properties"
  on "public"."properties"
  as permissive
  for delete
  to authenticated
using ((owner_id = auth.uid()));



  create policy "Users can insert their own properties"
  on "public"."properties"
  as permissive
  for insert
  to authenticated
with check ((owner_id = auth.uid()));



  create policy "Users can request verification"
  on "public"."properties"
  as permissive
  for update
  to authenticated
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));



  create policy "Users can update their own properties"
  on "public"."properties"
  as permissive
  for update
  to authenticated
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));



  create policy "Users can view their own properties"
  on "public"."properties"
  as permissive
  for select
  to authenticated
using ((owner_id = auth.uid()));



  create policy "admins_can_manage_all_properties"
  on "public"."properties"
  as permissive
  for all
  to authenticated
using (public.user_has_admin_role(auth.uid()))
with check (public.user_has_admin_role(auth.uid()));



  create policy "admins_can_view_properties"
  on "public"."properties"
  as permissive
  for select
  to authenticated
using (public.user_has_admin_role(auth.uid()));



  create policy "Allow insert for all"
  on "public"."property_stats"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow insert property_stats"
  on "public"."property_stats"
  as permissive
  for insert
  to authenticated, anon
with check (true);



  create policy "Allow read for admins"
  on "public"."property_stats"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderator'::text, 'superadmin'::text, 'agent'::text]))))));



  create policy "Allow read own property_stats"
  on "public"."property_stats"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Allow read property_stats for admins"
  on "public"."property_stats"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));



  create policy "Review reactions are viewable by everyone"
  on "public"."review_reactions"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create their own reactions"
  on "public"."review_reactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete their own reactions"
  on "public"."review_reactions"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own reactions"
  on "public"."review_reactions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Reviews are viewable by everyone"
  on "public"."reviews"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create their own reviews"
  on "public"."reviews"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete their own reviews"
  on "public"."reviews"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own reviews"
  on "public"."reviews"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can create their own search alerts"
  on "public"."search_alerts"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete their own search alerts"
  on "public"."search_alerts"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own search alerts"
  on "public"."search_alerts"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own search alerts"
  on "public"."search_alerts"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Allow public read access to services"
  on "public"."services"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can manage all documents"
  on "public"."user_documents"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can delete own documents"
  on "public"."user_documents"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete own manual documents"
  on "public"."user_documents"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) AND (source = 'manual'::text)));



  create policy "Users can insert own documents"
  on "public"."user_documents"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (source = 'manual'::text)));



  create policy "Users can read own documents"
  on "public"."user_documents"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own documents"
  on "public"."user_documents"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "users_view_own_roles"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "user_roles_audit_insert_service"
  on "public"."user_roles_audit"
  as permissive
  for insert
  to authenticated
with check (((auth.jwt() ->> 'role'::text) = 'service'::text));



  create policy "user_roles_audit_select_admins"
  on "public"."user_roles_audit"
  as permissive
  for select
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "visit_requests_admin_delete"
  on "public"."visit_requests"
  as permissive
  for delete
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "visit_requests_admin_select"
  on "public"."visit_requests"
  as permissive
  for select
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "visit_requests_admin_update"
  on "public"."visit_requests"
  as permissive
  for update
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text))
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "visit_requests_delete_policy"
  on "public"."visit_requests"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));



  create policy "visit_requests_insert_policy"
  on "public"."visit_requests"
  as permissive
  for insert
  to public
with check (true);



  create policy "visit_requests_insert_public"
  on "public"."visit_requests"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "visit_requests_select_policy"
  on "public"."visit_requests"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderateur'::text, 'superadmin'::text, 'agent'::text]))))));



  create policy "visit_requests_update_policy"
  on "public"."visit_requests"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderateur'::text, 'superadmin'::text, 'agent'::text]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderateur'::text, 'superadmin'::text, 'agent'::text]))))));


CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_notification_preferences_updated_at();

CREATE TRIGGER trigger_update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_reviews_updated_at();

CREATE TRIGGER update_search_alerts_updated_at BEFORE UPDATE ON public.search_alerts FOR EACH ROW EXECUTE FUNCTION public.update_search_alerts_updated_at();

CREATE TRIGGER set_user_documents_updated_at BEFORE UPDATE ON public.user_documents FOR EACH ROW EXECUTE FUNCTION public.handle_user_documents_updated_at();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_user_roles_updated_at();

CREATE TRIGGER user_roles_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.user_roles_audit_trigger();

CREATE TRIGGER user_roles_set_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();


  create policy "Allow authenticated upload 1jpriur_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'properties'::text));



  create policy "Allow authenticated upload 1jpriur_1"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'properties'::text));



  create policy "Allow authenticated upload 1jpriur_2"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'properties'::text));



  create policy "Allow public read access 1jpriur_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'properties'::text));



  create policy "Authenticated users can upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'properties'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'properties'::text));



  create policy "Public can view certifications"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'certifications'::text));



  create policy "User can read own objects"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "User uploads to own folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "Users can view their own certifications"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'certifications'::text) AND (owner = auth.uid())));



  create policy "Verification: Delete own file"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'verification-docs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Verification: Upload own folder"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'verification-docs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Verification: View own or Admin"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'verification-docs'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'moderateur'::text]))))))));



  create policy "user_objects_insert_own_folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "user_objects_select_own_folder"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



