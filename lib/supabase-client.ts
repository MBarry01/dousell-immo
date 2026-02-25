"use client";

import { createClient } from "@/utils/supabase/client";

// Re-export the singleton instance from our official utility
export const supabase = createClient();
export const getSupabaseClient = () => supabase;

