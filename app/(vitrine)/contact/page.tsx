"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, Calendar, CheckCircle, Building2, Phone, Mail } from "lucide-react";

import { createVisitRequest, createAppointment } from "@/app/(vitrine)/planifier-visite/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Captcha } from "@/components/ui/captcha";
import { AppointmentScheduler } from "@/components/ui/appointment-scheduler";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { sendGTMEvent } from "@/lib/gtm";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

const faq = [
  {
    question: "Quels documents fournir pour louer ?",
    answer:
      "Pièce d'identité, 3 derniers bulletins de salaire ou attestations de revenus, et garant si nécessaire.",
  },
  {
    question: "Faites-vous de la gestion locative ?",
    answer:
      "Oui, nous gérons vos biens de A à Z : mise en location, perception loyers, suivi technique.",
  },
  {
    question: "Accompagnez-vous les expatriés ?",
    answer:
      "Bien sûr, nous offrons un service conciergerie pour les expatriés (visites vidéo, signature à distance).",
  },
];

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

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [mode, setMode] = useState<"form" | "scheduler">("form");

  // States pour le scheduler
  const [isSchedulerSubmitting, setIsSchedulerSubmitting] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);
  const [selectedMeetingType, setSelectedMeetingType] = useState<"visite" | "consultation">("consultation");
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

  const onSubmit = async (values: VisitRequestFormValues) => {
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

      sendGTMEvent("generate_lead", {
        source: "formulaire_contact",
        location: "page_contact",
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

  // Handler pour confirmer le RDV
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
        toast.error(result.error || "Impossible de créer le rendez-vous.");
        return;
      }

      const formattedDate = data.date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setConfirmedAppointment({
        date: formattedDate,
        time: data.time,
        userName: result.data?.userName || "",
        meetingType: selectedMeetingType === "visite" ? "Visite immobilière" : "Consultation",
        meetingMode: selectedMeetingMode === "online" ? "En ligne (Visio)" : "En présentiel",
        googleCalendarUrl: result.data?.googleCalendarUrl,
        meetLink: result.data?.meetLink,
      });

      setShowConfirmationSuccess(true);

      sendGTMEvent("generate_lead", {
        source: "scheduler_contact",
        location: "page_contact",
        meeting_type: selectedMeetingType
      });
    } catch (error) {
      console.error("Erreur scheduler:", error);
      toast.error("Une erreur est survenue, merci de réessayer.");
    } finally {
      setIsSchedulerSubmitting(false);
    }
  };

  const availableDates = getAvailableDates();

  // Écran de confirmation de succès
  if (showConfirmationSuccess && confirmedAppointment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
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
    <div className="space-y-10 py-10">
      {/* Header avec infos de contact */}
      <section className="text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Contact</p>
        <h1 className="text-4xl font-semibold text-white">Nous contacter</h1>
        <p className="text-white/60 max-w-xl mx-auto">
          Parlez directement à un expert Dousel pour vos projets immobiliers.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-white/70">
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
            <span>contact@dousel.com</span>
          </div>
        </div>
      </section>

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
        /* ========== FORMULAIRE ========== */
        <div className="mx-auto w-full max-w-lg rounded-[32px] border border-white/10 bg-background/5 px-6 py-10 shadow-[0_20px_80px_rgba(5,8,12,0.55)] backdrop-blur">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Demande de contact
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Laissez-nous vos coordonnées
            </h2>
            <p className="mt-2 text-white/60">
              Un conseiller Dousel vous recontacte sous 30 minutes.
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
                className="border-white/10 bg-background/5 text-base text-white placeholder:text-white/40 min-h-[44px]"
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
                className="border-white/10 bg-background/5 text-base text-white placeholder:text-white/40 min-h-[44px]"
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
                <Controller
                  name="projectType"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="border-white/10 bg-background/5 text-white">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-white/20">
                        <SelectItem value="achat">Achat</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Disponibilité</label>
                <Controller
                  name="availability"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="border-white/10 bg-background/5 text-white">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-white/20">
                        <SelectItem value="semaine-matin">En semaine (Matin)</SelectItem>
                        <SelectItem value="semaine-apres-midi">En semaine (Après-midi)</SelectItem>
                        <SelectItem value="weekend">Le week-end</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">
                Votre message (optionnel)
              </label>
              <Textarea
                placeholder="Décrivez votre projet, budget, quartiers souhaités..."
                rows={4}
                className="border-white/10 bg-background/5 text-base text-white placeholder:text-white/40 resize-none min-h-[44px]"
                {...form.register("message")}
              />
            </div>
            <div className="flex justify-center">
              <Captcha
                key={captchaResetKey}
                onVerify={(token: string) => setCaptchaToken(token)}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="w-full rounded-full bg-[#F4C430] py-5 text-lg font-medium text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </Button>
          </form>
        </div>
      ) : (
        /* ========== SCHEDULER ========== */
        <div className="rounded-[36px] border border-[#F4C430]/10 bg-background/5 p-6 md:p-8 text-white max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]/60 mb-2">
              Rendez-vous
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Planifiez votre consultation
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Réservez un créneau avec nos experts pour discuter de votre projet immobilier.
              Consultation gratuite et sans engagement.
            </p>
          </div>

          {/* Options de type et mode de meeting */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMeetingType("consultation")}
                className={`px-4 py-2 rounded-full text-sm transition-all ${selectedMeetingType === "consultation"
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/50 hover:text-white/80"
                  }`}
              >
                💬 Consultation
              </button>
              <button
                onClick={() => setSelectedMeetingType("visite")}
                className={`px-4 py-2 rounded-full text-sm transition-all ${selectedMeetingType === "visite"
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/50 hover:text-white/80"
                  }`}
              >
                🏠 Visite
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMeetingMode("in_person")}
                className={`px-4 py-2 rounded-full text-sm transition-all ${selectedMeetingMode === "in_person"
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/50 hover:text-white/80"
                  }`}
              >
                📍 Présentiel
              </button>
              <button
                onClick={() => setSelectedMeetingMode("online")}
                className={`px-4 py-2 rounded-full text-sm transition-all ${selectedMeetingMode === "online"
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/50 hover:text-white/80"
                  }`}
              >
                💻 En ligne (Visio)
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <AppointmentScheduler
              userName="Équipe Dousel"
              userAvatar="/Logo.svg"
              meetingTitle={selectedMeetingType === "visite" ? "Visite immobilière" : "Consultation Immobilière"}
              meetingType={selectedMeetingMode === "online" ? "Visio (Google Meet)" : "Présentiel (Bureau Dakar)"}
              duration="30 Minutes"
              timezone="Afrique/Dakar (GMT)"
              availableDates={availableDates}
              timeSlots={timeSlots}
              onDateSelect={(date) => console.log("Date choisie:", date)}
              onTimeSelect={(time) => console.log("Heure choisie:", time)}
              onConfirm={handleSchedulerConfirm}
              isSubmitting={isSchedulerSubmitting}
              brandName="Dousel Agenda"
            />
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <section className="rounded-[32px] border border-white/10 bg-background/5 p-6 text-white max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">FAQ</p>
        <h2 className="mt-2 text-2xl font-semibold">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-4">
          {faq.map((item) => (
            <AccordionItem value={item.question} key={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
