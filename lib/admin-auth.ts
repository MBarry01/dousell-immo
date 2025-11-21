import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Authorized admin email
 */
const AUTHORIZED_ADMIN_EMAIL = "barrymohamadou98@gmail.com";

/**
 * Check if the current user is authorized to access admin routes
 * Redirects to /compte if not authorized
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/dashboard");
  }

  if (user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    redirect("/compte");
  }

  return user;
}

/**
 * Check if the current user is an admin (without redirecting)
 * Useful for conditional rendering
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

