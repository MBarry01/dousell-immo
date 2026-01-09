"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { ShootingStars } from "@/components/ui/shooting-stars";
import CompareSection from "@/components/landing/CompareSection";
import PricingSection from "@/components/landing/PricingSection";
import DousellNavbar from "@/components/landing/DousellNavbar";
import Image from "next/image";
import Link from "next/link";
import { Building2, Shield, BarChart3, Users, Sparkles, Clock, FileText, Calendar, CheckCircle, Phone, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppointmentScheduler } from "@/components/ui/appointment-scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Captcha } from "@/components/ui/captcha";
import { createVisitRequest, createAppointment } from "@/app/(vitrine)/planifier-visite/actions";
import { sendGTMEvent } from "@/lib/gtm";
import { visitRequestSchema, type VisitRequestFormValues } from "@/lib/schemas/visit-request";

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

const features = [
  {
    icon: Building2,
    title: "Gestion des Biens",
    description: "Centralisez tous vos biens immobiliers en un seul endroit avec une vue d'ensemble intuitive.",
  },
  {
    icon: Users,
    title: "Suivi Locataires",
    description: "Gérez vos locataires, leurs contrats et historiques de paiements sans effort.",
  },
  {
    icon: BarChart3,
    title: "Analyses Financières",
    description: "Tableaux de bord détaillés pour suivre vos revenus et optimiser votre rentabilité.",
  },
  {
    icon: Shield,
    title: "Documents Sécurisés",
    description: "Stockage sécurisé de tous vos documents : baux, quittances, états des lieux.",
  },
  {
    icon: Clock,
    title: "Rappels Automatiques",
    description: "Ne manquez plus aucune échéance grâce aux notifications intelligentes.",
  },
  {
    icon: Sparkles,
    title: "Interface Intuitive",
    description: "Design moderne et élégant pensé pour une expérience utilisateur optimale.",
  },
];

export default function LandingPage() {
  const availableDates = getAvailableDates();

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
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {/* Static stars background */}
        <div className="absolute inset-0 w-full h-full">
          <div className="stars absolute inset-0" />
        </div>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.08)_0%,_transparent_70%)]" />

        {/* Navigation Ace Navbar */}
        <DousellNavbar />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pointer-events-none mt-10">
          {/* Main Title */}
          <h1 className="animate-fade-in-up delay-200 mb-6 max-w-5xl text-5xl font-bold leading-tight md:text-7xl lg:text-8xl text-white">
            <span className="font-display text-gray-200">L'immobilier de</span>{" "}
            <span className="font-display gradient-text-animated gold-glow-text">
              prestige
            </span>
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-gray-300">
              au Sénégal
            </span>
          </h1>

          {/* Description */}
          <p className="animate-fade-in-up delay-300 mb-12 max-w-2xl text-lg text-gray-400 md:text-xl font-light leading-relaxed">
            La plateforme de gestion immobilière de référence.
            <span className="text-gray-300"> Simplifiez la gestion de vos biens, contrats et locataires </span>
            avec élégance.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-400 flex flex-col gap-4 sm:flex-row pointer-events-auto">
            <Link
              href="/auth/signup"
              className="btn-shimmer rounded-full px-10 py-4 font-semibold text-black transition-all duration-300 hover:scale-105 gold-glow"
            >
              Essayer gratuitement
            </Link>
            <a
              href="#demo"
              className="group rounded-full border border-white/20 bg-white/5 px-10 py-4 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-[#F4C430]/30"
            >
              <span className="flex items-center gap-2">
                Voir la démo
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up delay-500 mt-16 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100+ Propriétaires actifs</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F4C430]" />
              <span>500+ Biens gérés</span>
            </div>
          </div>
        </div>

        {/* Animated Shooting Stars - Gold theme */}
        <ShootingStars
          starColor="#F4C430"
          trailColor="#FFD700"
          minSpeed={15}
          maxSpeed={40}
          starWidth={20}
          starHeight={2}
          minDelay={500}
          maxDelay={2000}
        />
        <ShootingStars
          starColor="#FFD700"
          trailColor="#F4C430"
          minSpeed={12}
          maxSpeed={35}
          starWidth={18}
          starHeight={2}
          minDelay={700}
          maxDelay={2500}
        />
        <ShootingStars
          starColor="#FFFFFF"
          trailColor="#F4C430"
          minSpeed={20}
          maxSpeed={45}
          starWidth={15}
          starHeight={1.5}
          minDelay={600}
          maxDelay={2200}
        />
      </section>

      {/* Container Scroll Section */}
      <section id="demo" className="flex flex-col overflow-hidden w-full bg-zinc-950 -mt-20 md:-mt-64">
        <ContainerScroll
          titleComponent={
            <div className="h-0"></div>
          }
        >
          <Image
            src="/couv.png"
            alt="Dashboard Dousell Immo"
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

      {/* Features Section */}
      <section id="features" className="relative py-32 bg-black">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,196,48,0.05)_0%,_transparent_50%)]" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
              Fonctionnalités
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              Tout ce dont vous avez{" "}
              <span className="gradient-text-animated">besoin</span>
            </h2>
            <div className="gold-divider w-24 mx-auto mb-6" />
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Une suite complète d'outils conçus pour simplifier la gestion de votre patrimoine immobilier.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="luxury-card rounded-2xl p-8 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#F4C430]/10 flex items-center justify-center mb-6 group-hover:bg-[#F4C430]/20 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-[#F4C430]" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#F4C430] transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare Section - Avant/Après */}
      <CompareSection />

      {/* Pricing Section - Tarifs */}
      <PricingSection />

      {/* CTA Section */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F4C430]/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
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
                href="/auth/signup"
                className="btn-shimmer rounded-full px-12 py-5 font-semibold text-black text-lg transition-all duration-300 hover:scale-105 gold-glow animate-pulse-gold"
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
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              Nous <span className="gradient-text-animated">contacter</span>
            </h2>
            <div className="gold-divider w-24 mx-auto mb-6" />
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-4">
              Nos experts sont à votre écoute pour concrétiser vos projets.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#F4C430]" />
                <span>Sacré-Cœur 3, VDN, Dakar</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F4C430]" />
                <span>+221 33 860 00 00</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4C430]" />
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
              <FileText className="w-4 h-4" />
              Formulaire rapide
            </button>
            <button
              onClick={() => setContactMode("scheduler")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${contactMode === "scheduler"
                ? "bg-[#F4C430] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Calendar className="w-4 h-4" />
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
                    <Calendar className="w-4 h-4" />
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
                    placeholder="Ex: Amy Ndiaye"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
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
                    placeholder="77 000 00 00"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
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
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition focus:border-white/30 appearance-none"
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
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition focus:border-white/30 appearance-none"
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
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40 resize-none"
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
                <li><a href="#features" className="text-gray-500 hover:text-[#F4C430] transition-colors">Fonctionnalités</a></li>
                <li><a href="#demo" className="text-gray-500 hover:text-[#F4C430] transition-colors">Démo</a></li>
                <li><a href="#pricing" className="text-gray-500 hover:text-[#F4C430] transition-colors">Tarifs</a></li>
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
              <a href="#" className="text-gray-600 hover:text-[#F4C430] transition-colors text-sm">Mentions légales</a>
              <a href="#" className="text-gray-600 hover:text-[#F4C430] transition-colors text-sm">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </main >
  );
}
