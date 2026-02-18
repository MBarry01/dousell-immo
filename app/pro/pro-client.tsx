"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { ShootingStars } from "@/components/ui/shooting-stars";
import CompareSection from "@/components/landing/CompareSection";
import MagicTransformation from "@/components/landing/MagicTransformation";
import PricingSection from "@/components/landing/PricingSection";
import { createClient } from "@/utils/supabase/client";

import Image from "next/image";
import Link from "next/link";
import { Buildings, ShieldCheck, ChartLineUp, UsersThree, MagicWand, BellRinging, FileText, CalendarDots, CheckCircle, Phone, Envelope } from "@phosphor-icons/react";
import { SoftwareIcon } from "@/components/ui/software-icon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppointmentScheduler } from "@/components/ui/appointment-scheduler";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Captcha } from "@/components/ui/captcha";
import { createVisitRequest, createAppointment } from "@/app/(vitrine)/planifier-visite/actions";
import { sendGTMEvent } from "@/lib/gtm";
import { visitRequestSchema, type VisitRequestFormValues } from "@/lib/schemas/visit-request";
import VideoTestimonials from "@/components/landing/VideoTestimonials";
import FeaturesBento from "@/components/landing/FeaturesBento";

// Saasable Integration
import SaasableSectionWrapper from "@/components/saasable/SaasableSectionWrapper";
import Feature18 from "@/components/saasable/blocks/Feature18";

// Tenant Sections (Je suis locataire / Je veux un bien)
import TenantHeroSearch from "@/components/landing/tenant/TenantHeroSearch";
import PropertyCategories from "@/components/landing/tenant/PropertyCategories";
import TenantSteps from "@/components/landing/tenant/TenantSteps";
import TenantTestimonials from "@/components/landing/tenant/TenantTestimonials";
import FeaturedPropertiesHero from "@/components/landing/tenant/FeaturedPropertiesHero";
import TrustSection from "@/components/landing/tenant/TrustSection";
import TenantBentoGrid from "@/components/landing/tenant/TenantBentoGrid";
import HeroIllustration from "@/components/landing/HeroIllustration";
import HeroOwnerIllustration from "@/components/landing/HeroOwnerIllustration";

const faq = [
  {
    question: "Quels documents fournir pour louer ?",
    answer: "Pièce d'identité, 3 derniers bulletins de salaire ou attestations de revenus, et garant si nécessaire.",
  },
  {
    question: "Faites-vous de la gestion locative ?",
    answer: "Oui, nous gérons vos biens de A à Z : mise en location, perception loyers, suivi technique.",
  },
  {
    question: "Accompagnez-vous les expatriés ?",
    answer: "Bien sûr, nous offrons un service conciergerie pour les expatriés (visites vidéo, signature à distance).",
  },
];

const getAvailableDates = () => {
  const now = new Date();
  const currentDay = now.getDate();
  const dates = [];
  for (let i = 1; i <= 20; i++) {
    const futureDate = new Date(now);
    futureDate.setDate(currentDay + i);
    const dayOfWeek = futureDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push({ date: futureDate.getDate(), hasSlots: true });
    }
  }
  return dates;
};

const timeSlots = [
  { time: "09:00", available: true },
  { time: "09:30", available: true },
  { time: "10:00", available: true },
  { time: "10:30", available: true },
  { time: "11:00", available: true },
  { time: "14:00", available: true },
  { time: "14:30", available: true },
  { time: "15:00", available: true },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "16:30", available: true },
  { time: "17:00", available: true },
];

// Data for Feature18 (Saasable Tabbed Features)
const featuresDataSaasable = [
  {
    title: "Gestion Complète",
    title2: "Centralisez votre patrimoine",
    description: "Une vue à 360° sur vos biens, locataires et finances.",
    isCoverImage: true,
    image: "/Gif/Dasboard1.gif",
    bgImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", // Immobilier
    icon: "tabler-building",
    list: [
      { primary: "Tableau de bord intuitif" },
      { primary: "Suivi des loyers en temps réel" },
      { primary: "Gestion des documents" }
    ]
  },
  {
    title: "Automatisation",
    title2: "Gagnez du temps",
    description: "Laissez l'IA gérer les tâches répétitives.",
    isCoverImage: true,
    image: "/Gif/Generer.gif",
    bgImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80", // Robot/AI
    icon: "tabler-sparkles",
    list: [
      { primary: "Rappels automatiques" },
      { primary: "Génération de contrats" },
      { primary: "Quittances digitalisées" }
    ]
  },
  {
    title: "Sérénité",
    title2: "Sécurité & Conformité",
    description: "Vos données et vos biens sont protégés.",
    isCoverImage: true,
    image: "/Gif/security.gif",
    bgImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80", // Sécurité/Lock
    icon: "tabler-shield",
    list: [
      { primary: "Stockage sécurisé" },
      { primary: "Conformité juridique" },
      { primary: "Support dédié 7j/7" }
    ]
  }
];

const features = [
  {
    icon: Buildings,
    title: "Gestion des Biens",
    description: "Centralisez tous vos biens immobiliers en un seul endroit avec une vue d'ensemble intuitive.",
  },
  {
    icon: UsersThree,
    title: "Suivi Locataires",
    description: "Gérez vos locataires, leurs contrats et historiques de paiements sans effort.",
  },
  {
    icon: ChartLineUp,
    title: "Analyses Financières",
    description: "Tableaux de bord détaillés pour suivre vos revenus et optimiser votre rentabilité.",
  },
  {
    icon: ShieldCheck,
    title: "Documents Sécurisés",
    description: "Stockage sécurisé de tous vos documents : baux, quittances, états des lieux.",
  },
  {
    icon: BellRinging,
    title: "Rappels Automatiques",
    description: "Ne manquez plus aucune échéance grâce aux notifications intelligentes.",
  },
  {
    icon: MagicWand,
    title: "Interface Intuitive",
    description: "Design moderne et élégant pensé pour une expérience utilisateur optimale.",
  },
];

function LandingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const availableDates = getAvailableDates();

  // Mode Propriétaire / Locataire
  // Priorité : URL > Default "owner" (localStorage géré dans useEffect plus bas)
  const urlMode = searchParams.get("mode");
  const initialMode = (urlMode === "tenant" || urlMode === "owner") ? urlMode : "owner";

  const [userMode, setUserMode] = useState<"owner" | "tenant">(initialMode);

  // Sync URL changes to state
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "tenant" || mode === "owner") {
      setUserMode(mode);
    }
  }, [searchParams]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Charger le mode depuis localStorage après hydratation
  useEffect(() => {
    const saved = localStorage.getItem("dousell_user_mode");
    if (saved === "owner" || saved === "tenant") {
      setUserMode(saved);
    }
    setIsHydrated(true);
  }, []);

  // Vérifier si l'utilisateur est connecté (client-side)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  // Sauvegarder le choix et mettre à jour l'URL pour synchroniser le header
  const handleModeChange = (mode: "owner" | "tenant") => {
    setUserMode(mode);
    localStorage.setItem("dousell_user_mode", mode);
    // Mettre à jour l'URL pour que le header (Server Component) se synchronise
    router.push(`/pro?mode=${mode}`, { scroll: false });
  };

  // Contenu dynamique selon le mode
  const contentMap = {
    owner: {
      h1Line1: "Gérez vos biens.",
      h1Highlight: "Encaissez sans effort.",
      h1Line2: "",
      desc: "Loyers automatiques, contrats générés, quittances envoyées. La gestion locative premium enfin accessible aux propriétaires sénégalais.",
      ctaPrimary: isLoggedIn
        ? { text: "Accéder à mon espace", href: "/gestion" }
        : { text: "Commencer gratuitement", href: "/pro/start" },
      ctaSecondary: { text: "Voir la démo", href: "#demo" },
    },
    tenant: {
      h1Line1: "Trouvez le",
      h1Highlight: "bien idéal",
      h1Line2: "au cœur du Sénégal",
      desc: "Accédez à une sélection exclusive de villas et appartements. Payez votre loyer en ligne et retrouvez tous vos documents en un clic.",
      ctaPrimary: { text: "Voir les annonces", href: "/recherche" },
      ctaSecondary: { text: "Espace Locataire", href: "/locataire" },
    },
  };

  const currentContent = contentMap[userMode];

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [contactMode, setContactMode] = useState<"form" | "scheduler">("form");

  // Scheduler states
  const [isSchedulerSubmitting, setIsSchedulerSubmitting] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);
  const [selectedMeetingMode, setSelectedMeetingMode] = useState<"in_person" | "online">("online");
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    date: string;
    time: string;
    userName: string;
    meetingType: string;
    googleCalendarUrl?: string;
    meetLink?: string | null;
  } | null>(null);

  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const form = useForm<VisitRequestFormValues>({
    resolver: zodResolver(visitRequestSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      projectType: "achat",
      availability: "semaine-matin",
      message: "",
    },
    mode: "onTouched",
  });

  const onSubmitForm = async (values: VisitRequestFormValues) => {
    if (!captchaToken) {
      toast.error("Veuillez compléter la vérification anti-robot");
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await createVisitRequest(values, captchaToken);
      if (!result.success) {
        toast.error(result.error || "Impossible d'envoyer la demande.");
        return;
      }
      toast.success("Demande envoyée !", {
        description: `${values.fullName}, un conseiller vous rappelle sous 30 min.`,
      });
      sendGTMEvent("generate_lead", { source: "landing_form", location: "landing_contact", project_type: values.projectType });
      form.reset();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast.error("Une erreur est survenue, merci de réessayer.");
    } finally {
      setIsSubmitting(false);
      setCaptchaToken(null);
      setCaptchaResetKey((prev) => prev + 1);
    }
  };

  const handleSchedulerConfirm = async (data: { date: Date; time: string; month: number; year: number }) => {
    setIsSchedulerSubmitting(true);
    try {
      const result = await createAppointment({
        date: data.date.toISOString(),
        time: data.time,
        meetingType: "consultation",
        meetingMode: selectedMeetingMode,
      });
      if (!result.success) {
        toast.error(result.error || "Impossible de créer le rendez-vous.");
        return;
      }
      const formattedDate = data.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      setConfirmedAppointment({
        date: formattedDate,
        time: data.time,
        userName: result.data?.userName || "",
        meetingType: "Consultation Immobilière",
        googleCalendarUrl: result.data?.googleCalendarUrl,
        meetLink: result.data?.meetLink,
      });
      setShowConfirmationSuccess(true);
      sendGTMEvent("generate_lead", { source: "landing_scheduler", location: "landing_contact" });
    } catch (error) {
      console.error("Erreur scheduler:", error);
      toast.error("Une erreur est survenue, merci de réessayer.");
    } finally {
      setIsSchedulerSubmitting(false);
    }
  };

  return (
    <main className="bg-black overflow-hidden">
      {/* Noise Overlay for texture */}
      <div className="noise-overlay" />

      {/* Hero Section avec Shooting Stars */}
      <section id="hero" className="relative min-h-[100svh] w-full overflow-hidden bg-black">
        {/* Background Image with fade effect - Optimized LCP */}
        <div className="absolute inset-0 w-full h-full will-change-transform">
          <Image
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
            alt="Villa de luxe au Sénégal - Immobilier Dakar"
            fill
            priority
            fetchPriority="high"
            className="object-cover object-center opacity-30"
            sizes="100vw"
            quality={85}
          />
          {/* Gradient overlay for fade effect - Smoother transition */}
          {/* Desktop: subtle gradient | Mobile: strong gradient from bottom (70%) for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent md:bg-gradient-to-b md:from-black/60 md:via-black/40 md:to-black" />
        </div>

        {/* Static stars background - GPU accelerated */}
        <div className="absolute inset-0 w-full h-full will-change-opacity">
          <div className="stars absolute inset-0" />
        </div>

        {/* Radial gradient overlay - Enhanced glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.12)_0%,_transparent_60%)]" />



        {/* Hero Content - Two column layout on desktop */}
        <div className={cn(
          "relative z-10 min-h-[100svh] px-4 sm:px-6 md:px-8 pt-20 pb-safe-nav md:pt-28 md:pb-16",
          "flex flex-col md:flex-row items-center justify-center md:justify-between max-w-7xl mx-auto gap-6 md:gap-8 lg:gap-12"
        )}>
          {/* Left side - Text content */}
          <div className={cn(
            "pointer-events-none md:flex-1 text-center md:text-left max-w-2xl md:max-w-xl w-full pt-16 md:pt-0"
          )}>
            {/* ========== TABS: Je suis Propriétaire / Je cherche un bien ========== */}
            {/* MOBILE: Big tactile buttons side by side */}
            <div className="animate-fade-in-up delay-100 mb-15 pointer-events-auto flex md:hidden w-full gap-2.5">
              <button
                onClick={() => handleModeChange("owner")}
                className={cn(
                  "relative flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 overflow-hidden",
                  userMode === "owner"
                    ? "text-black shadow-lg shadow-[#F4C430]/30"
                    : "bg-black/50 backdrop-blur-md border border-white/10 text-white/70 active:scale-[0.98]"
                )}
              >
                {/* Active state background with shimmer */}
                {userMode === "owner" && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F4C430] to-[#E5B82A]" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)",
                        backgroundSize: "250% 100%",
                        animation: "shimmer 2.5s ease-in-out infinite"
                      }}
                    />
                  </>
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <svg className={cn("w-4 h-4", userMode === "owner" ? "text-black" : "text-[#F4C430]")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Propriétaire
                </span>
              </button>
              <button
                onClick={() => handleModeChange("tenant")}
                className={cn(
                  "relative flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 overflow-hidden",
                  userMode === "tenant"
                    ? "text-black shadow-lg shadow-[#F4C430]/30"
                    : "bg-black/50 backdrop-blur-md border border-white/10 text-white/70 active:scale-[0.98]"
                )}
              >
                {/* Active state background with shimmer */}
                {userMode === "tenant" && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F4C430] to-[#E5B82A]" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)",
                        backgroundSize: "250% 100%",
                        animation: "shimmer 2.5s ease-in-out infinite"
                      }}
                    />
                  </>
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <svg className={cn("w-4 h-4", userMode === "tenant" ? "text-black" : "text-[#F4C430]")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Chercher un bien
                </span>
              </button>
            </div>

            {/* DESKTOP: Original pill toggle with animation */}
            <div className="animate-fade-in-up delay-100 mb-8 pointer-events-auto hidden md:flex justify-center md:justify-start">
              <div className="relative inline-flex items-center">
                {/* Glow effect behind tabs */}
                <div className="absolute inset-0 bg-[#F4C430]/10 blur-2xl rounded-full scale-110 opacity-50" />

                <div className="relative inline-flex bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-full p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">

                  {/* Animated Background Indicator with Shimmer */}
                  <motion.div
                    className="absolute inset-y-1.5 rounded-full overflow-hidden shadow-[0_2px_16px_rgba(244,196,48,0.5)]"
                    initial={false}
                    animate={{
                      left: userMode === "owner" ? "6px" : "calc(50% + 2px)",
                      width: "calc(50% - 8px)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  >
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F4C430] to-[#E5B82A]" />

                    {/* Shimmer wave effect - same as btn-shimmer */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)",
                        backgroundSize: "250% 100%",
                        animation: "shimmer 2.5s ease-in-out infinite"
                      }}
                    />
                  </motion.div>

                  <button
                    onClick={() => handleModeChange("owner")}
                    className={cn(
                      "relative z-10 px-7 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[160px]",
                      userMode === "owner"
                        ? "text-black font-semibold"
                        : "text-white/60 hover:text-white/90"
                    )}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className={cn("w-4 h-4 transition-colors", userMode === "owner" ? "text-black" : "text-white/40")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Propriétaire
                    </span>
                  </button>
                  <button
                    onClick={() => handleModeChange("tenant")}
                    className={cn(
                      "relative z-10 px-7 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[160px]",
                      userMode === "tenant"
                        ? "text-black font-semibold"
                        : "text-white/60 hover:text-white/90"
                    )}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className={cn("w-4 h-4 transition-colors", userMode === "tenant" ? "text-black" : "text-white/40")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Chercher un bien
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Title - Optimized typography */}
            <h1 className="animate-fade-in-up delay-200 mb-4 md:mb-6 font-bold leading-[1.1] text-white will-change-transform text-[clamp(1.875rem,5vw,3.75rem)] max-w-lg lg:max-w-xl">
              <span className="font-display text-white/90 block">{currentContent.h1Line1}</span>
              <span className="font-display gradient-text-animated gold-glow-text block mt-1 md:mt-2">
                {currentContent.h1Highlight}
              </span>
              {currentContent.h1Line2 && (
                <span className="block mt-2 md:mt-3 font-light tracking-wide text-white/70 text-[clamp(1.25rem,2.5vw,1.875rem)]">
                  {currentContent.h1Line2}
                </span>
              )}
            </h1>

            {/* Description - Better readability */}
            <p className="animate-fade-in-up delay-300 mb-12 md:mb-10 text-white/70 md:text-white/60 font-light leading-relaxed text-[clamp(0.9375rem,1.5vw,1.125rem)] max-w-[320px] sm:max-w-md md:max-w-lg mx-auto md:mx-0">
              {currentContent.desc}
            </p>

            {/* CTAs - Enhanced interaction */}
            <div className="animate-fade-in-up delay-400 flex flex-col gap-3 sm:flex-row pointer-events-auto justify-center md:justify-start">
              <Link
                href={currentContent.ctaPrimary.href}
                className="btn-shimmer rounded-full w-full sm:w-auto px-8 sm:px-10 py-4 font-semibold text-black transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] gold-glow text-[clamp(0.875rem,1.2vw,1rem)] text-center whitespace-nowrap"
              >
                {currentContent.ctaPrimary.text}
              </Link>
              <a
                href={currentContent.ctaSecondary.href}
                onClick={(e) => {
                  if (currentContent.ctaSecondary.href === "#demo") {
                    e.preventDefault();
                    setIsVideoOpen(true);
                  }
                }}
                className="group rounded-full w-full sm:w-auto border border-white/20 bg-white/5 px-8 sm:px-10 py-4 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-[#F4C430]/40 active:scale-[0.97] text-[clamp(0.875rem,1.2vw,1rem)] cursor-pointer whitespace-nowrap"
              >
                <span className="flex items-center justify-center gap-2">
                  {currentContent.ctaSecondary.text}
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>
            </div>

            {/* Lien connexion pour utilisateurs existants (mode propriétaire uniquement, non-connectés) */}
            {userMode === "owner" && !isLoggedIn && (
              <div className="animate-fade-in-up delay-450 mt-2 text-center md:text-left pointer-events-auto">
                <span className="text-white/50 text-sm">
                  Déjà un compte gestion ?{" "}
                  <Link
                    href="/login?redirect=/pro"
                    className="text-[#F4C430] hover:text-[#FFD700] underline underline-offset-2 transition-colors"
                  >
                    Se connecter
                  </Link>
                </span>
              </div>
            )}

            {/* Trust indicators - Inline on mobile */}
            <div className="animate-fade-in-up delay-500 mt-8 md:mt-14 flex flex-row items-center justify-center md:justify-start gap-4 sm:gap-6 text-white/50 text-[11px] sm:text-sm relative z-20">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span>100+ Propriétaires</span>
              </div>
              <div className="w-px h-3 sm:h-4 bg-white/20" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#F4C430] shadow-[0_0_8px_rgba(244,196,48,0.5)]" />
                <span>500+ Biens gérés</span>
              </div>
            </div>
          </div>

          {/* Right side - Illustration (different for each mode) */}
          <motion.div
            key={userMode}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:flex flex-1 items-center justify-center max-w-sm lg:max-w-md xl:max-w-[580px]"
          >
            {userMode === "tenant" ? <HeroIllustration /> : <HeroOwnerIllustration />}
          </motion.div>
        </div>

        {/* Animated Shooting Stars - Optimized single instance */}
        <ShootingStars
          starColor="#F4C430"
          trailColor="#FFD700"
          minSpeed={15}
          maxSpeed={35}
          starWidth={24}
          starHeight={2}
          minDelay={1500}
          maxDelay={4000}
          className="opacity-80"
        />
      </section>

      {/* ============================================
          SECTION LOCATAIRES - "Je cherche un bien"
          ============================================ */}

      {/* Barre de recherche Hero pour locataires */}
      {userMode === "tenant" && (
        <section id="locataire-section" className="relative py-10 md:py-16 bg-zinc-950 z-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.05)_0%,_transparent_70%)]" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-6 md:mb-8">
              <span className="inline-block text-[#F4C430] text-[11px] md:text-sm font-medium tracking-widest uppercase mb-2 md:mb-4">
                Je suis locataire
              </span>
              <h2 className="font-display text-[clamp(1.5rem,4vw,3rem)] text-white mb-3 md:mb-4">
                Trouvez votre <span className="gradient-text-animated">prochain chez-vous</span>
              </h2>
              <p className="text-gray-400 text-[clamp(0.875rem,1.5vw,1.125rem)] max-w-xs md:max-w-xl mx-auto">
                Appartements, villas, studios... Des biens vérifiés à Dakar et Saly.
              </p>
            </div>
            <TenantHeroSearch />
          </div>
        </section>
      )}

      {/* Biens en Vedette - Coups de coeur */}
      {userMode === "tenant" && <FeaturedPropertiesHero />}

      {/* Catégories de biens */}
      {userMode === "tenant" && <PropertyCategories />}

      {/* Section Sécurité & Confiance */}
      {userMode === "tenant" && <TrustSection />}

      {/* Bento Grid - Espace Locataire */}
      {userMode === "tenant" && <TenantBentoGrid />}

      {/* 3 étapes pour locataires */}
      {userMode === "tenant" && <TenantSteps />}

      {/* Témoignages locataires (Video Carousel) */}
      {userMode === "tenant" && (
        <VideoTestimonials mode="tenant" />
      )}

      {/* ============================================
          SECTION PROPRIETAIRES - "Je suis Propriétaire"
          ============================================ */}

      {/* Magic Transformation Section (SaaS -> Vitrine) */}
      {userMode === "owner" && <MagicTransformation />}

      {/* Container Scroll Section */}
      {userMode === "owner" && (
        <section id="proprietaire-section" className="flex flex-col overflow-hidden w-full bg-zinc-950 -mt-20 md:-mt-40">
          <ContainerScroll
            titleComponent={
              <div className="h-0"></div>
            }
          >
            <Image
              src="/couv.png"
              alt="Dashboard de gestion locative Dousell Immo - Interface propriétaire Sénégal"
              height={2160}
              width={1400}
              className="mx-auto rounded-2xl w-full block"
              style={{
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'top',
                margin: 0,
                padding: 0,
              }}
              draggable={false}
              unoptimized
            />
          </ContainerScroll>
        </section>
      )}

      {/* Laptop Mockup Section - Dashboard Gestion Locative */}
      {userMode === "owner" && (
        <>
          <section id="demo" className="relative py-12 md:py-20 bg-black overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.06)_0%,_transparent_70%)]" />

            <div className="container mx-auto px-6 relative z-10">
              {/* Section Header */}
              <div className="text-center mb-12 md:mb-16">
                <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                  Tout en un seul endroit
                </span>
                <h2 className="font-display text-[clamp(1.875rem,5vw,3.75rem)] text-white mb-6">
                  Pilotez tout depuis{" "}
                  <span className="gradient-text-animated">un seul écran</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Loyers, contrats, quittances, alertes; plus besoin de jongler entre 10 outils.
                </p>
              </div>

              {/* Laptop Mockup */}
              <div className="relative max-w-5xl mx-auto">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-[#F4C430]/10 rounded-full blur-[120px]" />

                {/* Floating Stats Badges - Premium Glassmorphism */}
                <div className="hidden md:block absolute -left-14 lg:-left-24 top-12 lg:top-20 z-20 animate-float-slow">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">100%</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-widest mt-0.5">Automatisé</div>
                  </div>
                </div>

                <div className="hidden md:block absolute -right-14 lg:-right-24 top-20 lg:top-28 z-20 animate-float-delayed-1">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">24/7</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-widest mt-0.5">Accessible</div>
                  </div>
                </div>

                <div className="hidden md:block absolute -left-12 lg:-left-20 bottom-24 lg:bottom-32 z-20 animate-float-delayed-2">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">2x</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-widest mt-0.5">Plus rapide</div>
                  </div>
                </div>

                <div className="hidden md:block absolute -right-12 lg:-right-20 bottom-32 lg:bottom-40 z-20 animate-float-delayed-3">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">0</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-widest mt-0.5">Paperasse</div>
                  </div>
                </div>

                {/* Laptop Frame */}
                <div className="relative">
                  {/* Screen bezel */}
                  <div className="relative bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-t-xl md:rounded-t-2xl p-2 md:p-3 pt-4 md:pt-6 shadow-2xl">
                    {/* Camera & Sensors */}
                    <div className="absolute top-1.5 md:top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-600 rounded-full" />
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-zinc-800 rounded-full border border-zinc-600" />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-600 rounded-full" />
                    </div>

                    {/* Screen Content */}
                    <div className="relative bg-zinc-900 rounded-lg md:rounded-xl overflow-hidden">
                      <Image
                        src="/images/dasboard.webp"
                        alt="Tableau de bord gestion locative - Suivi loyers et locataires Dakar Sénégal"
                        width={1200}
                        height={750}
                        className="w-full h-auto"
                        draggable={false}
                      />
                      {/* Screen reflection */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>

                  {/* Laptop Base/Keyboard */}
                  <div className="relative">
                    {/* Hinge */}
                    <div className="h-3 md:h-4 bg-gradient-to-b from-zinc-800 to-zinc-700 rounded-b-lg" />
                    {/* Base */}
                    <div className="h-4 md:h-6 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-b-xl mx-[5%] shadow-lg" />
                    {/* Bottom edge */}
                    <div className="h-1 md:h-1.5 bg-zinc-800 rounded-b-xl mx-[10%]" />
                  </div>
                </div>

                {/* Label - Clickable Button with Shimmer */}
                <Link
                  href="/gestion"
                  className="relative mt-6 mx-auto w-fit block md:absolute md:mt-0 md:-bottom-8 md:left-1/2 md:-translate-x-1/2 rounded-full px-5 py-2 shadow-lg shadow-[#F4C430]/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#F4C430]/30 overflow-hidden"
                >
                  {/* Base gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F4C430] to-[#E5B82A]" />
                  {/* Shimmer wave effect */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)",
                      backgroundSize: "250% 100%",
                      animation: "shimmer 2.5s ease-in-out infinite"
                    }}
                  />
                  <span className="relative z-10 text-sm font-semibold text-black">Dashboard Gestion Locative</span>
                </Link>
              </div>
            </div>
          </section>

          <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
            <DialogContent className="sm:max-w-[70vw] w-full p-0 bg-black border-zinc-800 overflow-hidden shadow-2xl">
              <DialogTitle className="sr-only">Démonstration vidéo de Dousell Immo</DialogTitle>
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/Ydn8c3trfho?autoplay=1&rel=0"
                  title="Dousell Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Saasable Feature18 - Tabbed Features (Propriétaire uniquement) */}
      {
        userMode === "owner" && (
          <SaasableSectionWrapper>
            <Feature18
              heading=""
              caption=""
              topics={featuresDataSaasable}
            />
          </SaasableSectionWrapper>
        )
      }

      {/* Features Section (Propriétaire uniquement) */}
      {userMode === "owner" && <FeaturesBento />}
      {/* Start Testimonials Section (Propriétaire uniquement) */}
      {userMode === "owner" && <VideoTestimonials mode="owner" />}

      {/* Compare Section - Avant/Après (Propriétaire uniquement) */}
      {userMode === "owner" && <CompareSection />}

      {/* Pricing Section - Tarifs (Propriétaire uniquement) */}
      {userMode === "owner" && <PricingSection />}

      {/* CTA Section */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F4C430]/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] text-white mb-6">
              Prêt à{" "}
              <span className="gradient-text-animated">transformer</span>
              <br />
              votre gestion immobilière ?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Rejoignez les propriétaires qui ont déjà simplifié leur quotidien avec Dousell Immo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pro/signup"
                className="btn-shimmer rounded-full px-8 sm:px-12 py-4 sm:py-5 font-semibold text-black text-[clamp(0.9375rem,1.5vw,1.125rem)] transition-all duration-300 hover:scale-105 gold-glow animate-pulse-gold whitespace-nowrap"
              >
                Commencer maintenant
              </Link>
            </div>
            <p className="mt-6 text-gray-500 text-sm">
              Essai gratuit • Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-32 bg-zinc-950">
        <div className="noise-overlay opacity-50" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
              Contact
            </span>
            <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] text-white mb-6">
              Nous <span className="gradient-text-animated">contacter</span>
            </h2>
            <div className="gold-divider w-24 mx-auto mb-6" />
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-4">
              Nos experts sont à votre écoute pour concrétiser vos projets.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Buildings size={16} className="text-[#F4C430]" />
                <span>Sacré-Cœur 3, VDN, Dakar</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-[#F4C430]" />
                <span>+221 33 860 00 00</span>
              </div>
              <div className="flex items-center gap-2">
                <Envelope size={16} className="text-[#F4C430]" />
                <span>contact@dousell.immo</span>
              </div>
            </div>
          </div>

          {/* Toggle Mode */}
          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => setContactMode("form")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${contactMode === "form"
                ? "bg-[#F4C430] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              <FileText size={16} />
              Formulaire rapide
            </button>
            <button
              onClick={() => setContactMode("scheduler")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${contactMode === "scheduler"
                ? "bg-[#F4C430] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              <CalendarDots size={16} />
              Prendre rendez-vous
            </button>
          </div>

          {/* Confirmation Success Modal */}
          {showConfirmationSuccess && confirmedAppointment ? (
            <div className="max-w-md mx-auto">
              <div className="luxury-card rounded-[32px] p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F4C430]/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[#F4C430]" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Rendez-vous confirmé !</h3>
                  {confirmedAppointment.userName && (
                    <p className="text-white/60 mb-2">Merci {confirmedAppointment.userName}</p>
                  )}
                  <p className="text-white/60">Votre rendez-vous est enregistré pour le</p>
                  <p className="text-[#F4C430] font-semibold text-lg mt-2">
                    {confirmedAppointment.date} à {confirmedAppointment.time}
                  </p>
                </div>
                <p className="text-white/50 text-sm">
                  Un email de confirmation vous a été envoyé.
                </p>
                {confirmedAppointment.googleCalendarUrl && (
                  <a
                    href={confirmedAppointment.googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 rounded-full py-3 px-4 font-medium transition-colors"
                  >
                    <CalendarDots size={16} />
                    Ajouter à Google Agenda
                  </a>
                )}
                <Button
                  onClick={() => { setShowConfirmationSuccess(false); setConfirmedAppointment(null); }}
                  className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 rounded-full"
                >
                  Prendre un autre rendez-vous
                </Button>
              </div>
            </div>
          ) : contactMode === "form" ? (
            /* ========== FORMULAIRE ========== */
            <div className="mx-auto w-full max-w-lg luxury-card rounded-[32px] p-8">
              <div className="mb-8 text-center">
                <h3 className="text-xl font-semibold text-white">Laissez-nous vos coordonnées</h3>
                <p className="mt-2 text-gray-400 text-sm">Un conseiller vous rappelle sous 30 min.</p>
              </div>
              <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Nom complet</label>
                  <Input
                    type="text"
                    placeholder="Nom complet"
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40 focus:border-[#F4C430]/50 focus:ring-[#F4C430]/20"
                    {...form.register("fullName")}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-amber-300">{form.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Téléphone</label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="Téléphone"
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40 focus:border-[#F4C430]/50 focus:ring-[#F4C430]/20"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-amber-300">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">Type de projet</label>
                    <select
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-white/30 appearance-none"
                      style={{
                        backgroundImage: "url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1.5em 1.5em",
                        backgroundRepeat: "no-repeat"
                      }}
                      {...form.register("projectType")}
                    >
                      <option value="achat" className="bg-[#121212]">Achat</option>
                      <option value="location" className="bg-[#121212]">Location</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">Disponibilité</label>
                    <select
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-white/30 appearance-none"
                      style={{
                        backgroundImage: "url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1.5em 1.5em",
                        backgroundRepeat: "no-repeat"
                      }}
                      {...form.register("availability")}
                    >
                      <option value="semaine-matin" className="bg-[#121212]">En semaine (Matin)</option>
                      <option value="semaine-apres-midi" className="bg-[#121212]">En semaine (Après-midi)</option>
                      <option value="weekend" className="bg-[#121212]">Le week-end</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Votre message (optionnel)</label>
                  <Textarea
                    placeholder="Décrivez votre projet..."
                    rows={3}
                    className="border-white/10 bg-white/5 text-base text-white placeholder:text-white/40 resize-none"
                    {...form.register("message")}
                  />
                </div>
                <div className="flex justify-center">
                  <Captcha key={captchaResetKey} onVerify={(token: string) => setCaptchaToken(token)} />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !captchaToken}
                  className="w-full rounded-full bg-[#F4C430] py-5 text-lg font-medium text-black hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
                </Button>
              </form>
            </div>
          ) : (
            /* ========== SCHEDULER ========== */
            <div className="max-w-4xl mx-auto">
              <div className="luxury-card rounded-[36px] p-6 md:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Planifiez votre consultation</h3>
                  <p className="text-gray-400 text-sm">Consultation gratuite de 30 min</p>
                </div>
                <div className="flex justify-center gap-3 mb-6">
                  <button
                    onClick={() => setSelectedMeetingMode("in_person")}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${selectedMeetingMode === "in_person"
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/50 hover:text-white/80"
                      }`}
                  >
                    Présentiel
                  </button>
                  <button
                    onClick={() => setSelectedMeetingMode("online")}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${selectedMeetingMode === "online"
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/50 hover:text-white/80"
                      }`}
                  >
                    En ligne (Visio)
                  </button>
                </div>
                <div className="flex justify-center">
                  <AppointmentScheduler
                    userName="Équipe Dousell"
                    userAvatar="/Logo.svg"
                    meetingTitle="Consultation Immobilière"
                    meetingType={selectedMeetingMode === "online" ? "Visio (Google Meet)" : "Présentiel (Bureau Dakar)"}
                    duration="30 Minutes"
                    timezone="Afrique/Dakar (GMT)"
                    availableDates={availableDates}
                    timeSlots={timeSlots}
                    onDateSelect={(date) => console.log("Date choisie:", date)}
                    onTimeSelect={(time) => console.log("Heure choisie:", time)}
                    onConfirm={handleSchedulerConfirm}
                    isSubmitting={isSchedulerSubmitting}
                    brandName="Dousell Agenda"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 bg-black">
        <div className="container mx-auto px-6 relative z-10 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white">Questions fréquentes</h2>
          </div>
          <div className="luxury-card rounded-[32px] p-8">
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, i) => (
                <AccordionItem value={`item-${i}`} key={i} className="border-b border-white/10 last:border-0">
                  <AccordionTrigger className="text-left text-white hover:text-[#F4C430] hover:no-underline py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <span className="font-display text-2xl gradient-text-animated">
                Dousell Immo
              </span>
              <p className="mt-4 text-gray-500 max-w-md">
                La plateforme de gestion immobilière de référence au Sénégal.
                Simplifiez votre quotidien avec des outils modernes et élégants.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-3">
                <li><Link href="/pro?mode=owner#features" className="text-gray-500 hover:text-[#F4C430] transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/pro?mode=owner#demo" className="text-gray-500 hover:text-[#F4C430] transition-colors">Démo</Link></li>
                {/* Si la section Tarifs n'existe pas encore ou est masquée, on peut rediriger vers /pro/start ou laisser #pricing si on l'ajoute */}
                <li><Link href="/pro?mode=owner#pricing" className="text-gray-500 hover:text-[#F4C430] transition-colors">Tarifs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-3">
                <li><span className="text-gray-500">Dakar, Sénégal</span></li>
                <li><a href="mailto:contact@dousell.com" className="text-gray-500 hover:text-[#F4C430] transition-colors">contact@dousell.com</a></li>
              </ul>
            </div>
          </div>

          <div className="gold-divider mt-12 mb-8" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2026 Dousell Immo. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <a href="/legal/cgu" className="text-gray-600 hover:text-[#F4C430] transition-colors text-sm">Mentions légales</a>
              <a href="/legal/privacy" className="text-gray-600 hover:text-[#F4C430] transition-colors text-sm">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </main >
  );
}

export default LandingPageContent;
