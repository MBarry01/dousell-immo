"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Buildings, MagnifyingGlass, ArrowRight, Sparkle } from "@phosphor-icons/react";

/**
 * Page /bienvenue - Post-registration welcome screen
 *
 * Displayed ONLY when:
 * - first_login === true
 * - user_type === "prospect" (registered via /register, not /pro/start)
 *
 * Per WORKFLOW_PROPOSAL.md section 4.1.1
 */
export default function BienvenuePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in, redirect to login
        router.replace("/login");
        return;
      }

      // Get profile to check first_login
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_login, full_name, pro_status")
        .eq("id", user.id)
        .single();

      // If not first login or already pro, redirect appropriately
      if (profile && !profile.first_login) {
        if (profile.pro_status === "trial" || profile.pro_status === "active") {
          router.replace("/gestion");
        } else {
          router.replace("/");
        }
        return;
      }

      // Mark first_login as false
      await supabase
        .from("profiles")
        .update({ first_login: false })
        .eq("id", user.id);

      setUserName(profile?.full_name?.split(" ")[0] || "");
      setIsLoading(false);
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F4C430]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#F4C430]/20 flex items-center justify-center">
              <Sparkle size={40} weight="fill" className="text-[#F4C430]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Welcome text */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Bienvenue{userName ? `, ${userName}` : ""} !
        </h1>

        <p className="text-white/60 text-lg mb-10">
          Votre compte a été créé avec succès.<br />
          Que souhaitez-vous faire ?
        </p>

        {/* Action cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {/* Search for property */}
          <Link
            href="/"
            className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/15 transition-colors">
              <MagnifyingGlass size={24} className="text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Chercher un bien</h3>
            <p className="text-white/50 text-sm mb-4">
              Explorez notre catalogue de biens immobiliers au Sénégal
            </p>
            <span className="text-[#F4C430] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Voir les annonces
              <ArrowRight size={16} />
            </span>
          </Link>

          {/* Manage properties (Pro) */}
          <Link
            href="/pro/start"
            className="group p-6 rounded-2xl bg-gradient-to-br from-[#F4C430]/10 to-[#F4C430]/5 border border-[#F4C430]/30 hover:border-[#F4C430]/50 transition-all duration-300 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F4C430]/20 flex items-center justify-center mb-4 group-hover:bg-[#F4C430]/30 transition-colors">
              <Buildings size={24} className="text-[#F4C430]" />
            </div>
            <h3 className="text-white font-semibold mb-2">Gérer mes biens</h3>
            <p className="text-white/50 text-sm mb-4">
              Accédez à la gestion locative professionnelle
            </p>
            <span className="text-[#F4C430] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Essai gratuit 14 jours
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>

        {/* Additional info */}
        <p className="text-white/40 text-sm">
          Vous pouvez changer d&apos;avis à tout moment depuis votre compte.
        </p>
      </div>
    </main>
  );
}
