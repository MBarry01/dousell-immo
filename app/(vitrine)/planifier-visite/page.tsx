"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageCircle, Calendar, FileText, CheckCircle } from "lucide-react";

import { createVisitRequest, createAppointment } from "@/app/(vitrine)/planifier-visite/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Captcha } from "@/components/ui/captcha";
import { AppointmentScheduler } from "@/components/ui/appointment-scheduler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendGTMEvent } from "@/lib/gtm";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";

const availabilityLabels: Record<VisitRequestFormValues["availability"], string> = {
  "semaine-matin": "En semaine (Matin)",
  "semaine-apres-midi": "En semaine (Après-midi)",
  weekend: "Le week-end",
};

// Générer les dates disponibles (jours ouvrés des 3 prochaines semaines)
const getAvailableDates = () => {
  const now = new Date();
  const currentDay = now.getDate();
  const dates = [];

  for (let i = 1; i <= 21; i++) {
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
  { time: "11:30", available: false },
  { time: "14:00", available: true },
  { time: "14:30", available: true },
  { time: "15:00", available: true },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "16:30", available: true },
  { time: "17:00", available: true },
];

function PlanifierVisitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [mode, setMode] = useState<"form" | "scheduler">("form");

  // States pour le scheduler
  const [isSchedulerSubmitting, setIsSchedulerSubmitting] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);
  const [selectedMeetingType, setSelectedMeetingType] = useState<"visite" | "consultation">("visite");
  const [selectedMeetingMode, setSelectedMeetingMode] = useState<"in_person" | "online">("in_person");
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    date: string;
    time: string;
    userName: string;
    meetingType: string;
    meetingMode?: string;
    googleCalendarUrl?: string;
    meetLink?: string | null;
  } | null>(null);

  // Infos du publieur (équipe ou propriétaire) — chargées dynamiquement
  const [publisher, setPublisher] = useState<{
    name: string;
    avatar: string | null;
  }>({ name: "Équipe Dousel", avatar: "/icons/icon-192.png" });

  const projectTypeParam = searchParams?.get("projectType");
  const messageParam = searchParams?.get("message");
  const propertyIdParam = searchParams?.get("propertyId");
  const propertyTitleParam = searchParams?.get("propertyTitle");

  const form = useForm<VisitRequestFormValues>({
    resolver: zodResolver(visitRequestSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      projectType: (projectTypeParam === "location" ? "location" : "achat") as "achat" | "location",
      availability: "semaine-matin",
      message: messageParam || "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (messageParam) {
      form.setValue("message", messageParam);
    }
    if (projectTypeParam === "location" || projectTypeParam === "achat") {
      form.setValue("projectType", projectTypeParam);
    }
  }, [messageParam, projectTypeParam, form]);

  // Charger les infos du publieur depuis l'API
  useEffect(() => {
    if (!propertyIdParam) return;
    fetch(`/api/publisher-info?propertyId=${propertyIdParam}`)
      .then((res) => res.json())
      .then((data) => {
        setPublisher({
          name: data.name || "Équipe Dousel",
          avatar: data.avatar || "/icons/icon-192.png",
        });
      })
      .catch(() => { /* garder le fallback */ });
  }, [propertyIdParam]);

  const onSubmit = async (values: VisitRequestFormValues) => {
    if (!captchaToken) {
      toast.error("Veuillez compléter la vérification anti-robot");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createVisitRequest(
        {
          ...values,
          propertyId: propertyIdParam || undefined,
          propertyTitle: propertyTitleParam || undefined,
        },
        captchaToken
      );

      if (!result.success) {
        toast.error(result.error || "Impossible d'envoyer la demande.");
        return;
      }

      toast.success("Demande envoyée !", {
        description: `${values.fullName}, un conseiller vous rappelle sous 30 min.`,
      });

      sendGTMEvent("generate_lead", {
        source: "formulaire_visite",
        location: "page_planifier",
        project_type: values.projectType
      });

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

  // Handler pour confirmer le RDV (utilisateur connecté)
  const handleSchedulerConfirm = async (data: { date: Date; time: string; month: number; year: number }) => {
    setIsSchedulerSubmitting(true);

    try {
      const result = await createAppointment({
        date: data.date.toISOString(),
        time: data.time,
        meetingType: selectedMeetingType,
        meetingMode: selectedMeetingMode,
      });

      if (!result.success) {
        // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
        if ('requiresAuth' in result && result.requiresAuth) {
          toast.error("Connexion requise", {
            description: "Veuillez vous connecter pour prendre rendez-vous.",
          });
          router.push(`/auth?redirect=/planifier-visite`);
          return;
        }
        toast.error(result.error || "Impossible de confirmer le rendez-vous.");
        return;
      }

      // Succès !
      setConfirmedAppointment({
        date: result.data?.date || "",
        time: result.data?.time || data.time,
        userName: result.data?.userName || "",
        meetingType: result.data?.meetingType || (selectedMeetingType === "visite" ? "Visite immobilière" : "Consultation"),
        meetingMode: result.data?.meetingMode,
        googleCalendarUrl: result.data?.googleCalendarUrl,
        meetLink: result.data?.meetLink,
      });
      setShowConfirmationSuccess(true);

      toast.success("Rendez-vous confirmé !", {
        description: "Un email de confirmation vous a été envoyé.",
      });

      sendGTMEvent("generate_lead", {
        source: "scheduler_visite",
        location: "page_planifier",
        date: data.date.toISOString(),
        time: data.time,
        meetingType: selectedMeetingType,
      });

    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue, merci de réessayer.");
    } finally {
      setIsSchedulerSubmitting(false);
    }
  };

  const availableDates = getAvailableDates();

  // Écran de confirmation de succès
  if (showConfirmationSuccess && confirmedAppointment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-[32px] border border-[#F4C430]/20 bg-black/60 backdrop-blur-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F4C430]/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#F4C430]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Rendez-vous confirmé !</h2>
            {confirmedAppointment.userName && (
              <p className="text-white/60 mb-2">
                Merci {confirmedAppointment.userName}
              </p>
            )}
            <p className="text-white/60">
              Votre rendez-vous est enregistré pour le
            </p>
            <p className="text-[#F4C430] font-semibold text-lg mt-2">
              {confirmedAppointment.date} à {confirmedAppointment.time}
            </p>
            <p className="text-white/50 text-sm mt-1">
              {confirmedAppointment.meetingType}
            </p>
          </div>
          <p className="text-white/50 text-sm">
            Un email de confirmation vous a été envoyé. Un conseiller Dousel vous contactera pour confirmer les détails.
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
            onClick={() => {
              setShowConfirmationSuccess(false);
              setConfirmedAppointment(null);
            }}
            className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 rounded-full"
          >
            Prendre un autre rendez-vous
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      {/* Toggle Mode */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setMode("form")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === "form"
            ? "bg-[#F4C430] text-black"
            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
        >
          <FileText className="w-4 h-4" />
          Formulaire rapide
        </button>
        <button
          onClick={() => setMode("scheduler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === "scheduler"
            ? "bg-[#F4C430] text-black"
            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
        >
          <Calendar className="w-4 h-4" />
          Prendre rendez-vous
        </button>
      </div>

      {mode === "form" ? (
        /* ========== FORMULAIRE ORIGINAL ========== */
        <div className="mx-auto w-full max-w-lg rounded-[32px] border border-white/10 bg-background/5 px-6 py-10 shadow-[0_20px_80px_rgba(5,8,12,0.55)] backdrop-blur">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Conciergerie
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Confiez-nous votre visite
            </h1>
            <p className="mt-2 text-white/60">
              Remplissez ce formulaire et un conseiller Dousel vous recontacte
              sous 30 minutes pour organiser la visite idéale.
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <label className="text-sm text-white/70">Nom complet</label>
              <Input
                type="text"
                placeholder="Ex: Amy Ndiaye"
                className="border-white/10 bg-background/5 text-white placeholder:text-white/40"
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-amber-300">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Téléphone</label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="77 000 00 00"
                className="border-white/10 bg-background/5 text-white placeholder:text-white/40"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-amber-300">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Type de projet</label>
                <Select
                  value={form.watch("projectType")}
                  onValueChange={(v) => form.setValue("projectType", v as any)}
                >
                  <SelectTrigger className="h-12 w-full rounded-2xl border border-white/10 bg-background/5 px-4 text-white outline-none transition focus:border-white/30">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="achat">
                      Achat
                    </SelectItem>
                    <SelectItem value="location">
                      Location
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.projectType && (
                  <p className="text-sm text-amber-300">
                    {form.formState.errors.projectType.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Disponibilité</label>
                <Select
                  value={form.watch("availability")}
                  onValueChange={(v) => form.setValue("availability", v as any)}
                >
                  <SelectTrigger className="h-12 w-full rounded-2xl border border-white/10 bg-background/5 px-4 text-white outline-none transition focus:border-white/30">
                    <SelectValue placeholder="Vos disponibilités" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availabilityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.availability && (
                  <p className="text-sm text-amber-300">
                    {form.formState.errors.availability.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">
                Votre brief (quartier, budget…)
              </label>
              <Textarea
                placeholder="Je cherche un T3 à Mermoz, budget 800 000 FCFA/mois..."
                className="min-h-[140px] border-white/10 bg-background/5 text-white placeholder:text-white/40"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-sm text-amber-300">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>

            <Captcha
              key={captchaResetKey}
              onVerify={(token) => {
                setCaptchaToken(token);
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
            />

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !captchaToken}
              className="w-full rounded-full bg-primary text-black hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-white/40">Ou discutez directement</p>
            <Link
              href="https://wa.me/221770000000"
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                sendGTMEvent("contact_click", {
                  method: "whatsapp",
                  value: "page_planifier_bottom"
                });
              }}
              className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-emerald-500 transition hover:text-emerald-600"
            >
              <MessageCircle className="h-5 w-5" />
              Discuter directement sur WhatsApp
            </Link>
          </div>
        </div>
      ) : (
        /* ========== SCHEDULER RENDEZ-VOUS ========== */
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto px-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]/60 mb-2">
              Conciergerie
            </p>
            <h1 className="text-3xl font-semibold text-white mb-3">
              Choisissez votre créneau
            </h1>
            <p className="text-white/60">
              Sélectionnez le type de rendez-vous, une date et un horaire.
            </p>
          </div>

          {/* Sélecteurs simples */}
          <div className="flex flex-wrap justify-center items-center gap-2 px-4">
            <button
              onClick={() => setSelectedMeetingType("visite")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedMeetingType === "visite"
                ? "bg-[#F4C430] text-black"
                : "text-white/60 hover:text-white"
                }`}
            >
              Visite
            </button>
            <button
              onClick={() => setSelectedMeetingType("consultation")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedMeetingType === "consultation"
                ? "bg-[#F4C430] text-black"
                : "text-white/60 hover:text-white"
                }`}
            >
              Consultation
            </button>
            <span className="text-white/20 mx-1">•</span>
            <button
              onClick={() => setSelectedMeetingMode("in_person")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedMeetingMode === "in_person"
                ? "bg-[#F4C430] text-black"
                : "text-white/60 hover:text-white"
                }`}
            >
              En personne
            </button>
            <button
              onClick={() => setSelectedMeetingMode("online")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedMeetingMode === "online"
                ? "bg-[#F4C430] text-black"
                : "text-white/60 hover:text-white"
                }`}
            >
              En ligne
            </button>
          </div>

          <div className="flex justify-center px-4">
            <AppointmentScheduler
              userName={publisher.name}
              userAvatar={publisher.avatar || "/icons/icon-192.png"}
              meetingTitle={selectedMeetingType === "visite" ? "Visite Immobilière" : "Consultation"}
              meetingType={selectedMeetingMode === "in_person" ? "En personne" : "Visioconférence Zoom"}
              duration="30 Minutes"
              timezone="Afrique/Dakar (GMT)"
              availableDates={availableDates}
              timeSlots={timeSlots}
              onConfirm={handleSchedulerConfirm}
              isSubmitting={isSchedulerSubmitting}
              brandName={publisher.name}
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-white/40">Ou discutez directement</p>
            <Link
              href="https://wa.me/221770000000"
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                sendGTMEvent("contact_click", {
                  method: "whatsapp",
                  value: "page_planifier_scheduler"
                });
              }}
              className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-emerald-500 transition hover:text-emerald-600"
            >
              <MessageCircle className="h-5 w-5" />
              Discuter directement sur WhatsApp
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanifierVisitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    }>
      <PlanifierVisitePageContent />
    </Suspense>
  );
}
