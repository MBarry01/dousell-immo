"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

import { createVisitRequest } from "@/app/(vitrine)/planifier-visite/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Captcha } from "@/components/ui/captcha";
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

function PlanifierVisitePageContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0); // Clé pour forcer le reset du widget

  // Récupérer les paramètres de l'URL pour pré-remplir le formulaire
  const propertyId = searchParams?.get("propertyId");
  const propertyTitle = searchParams?.get("propertyTitle");
  const propertyPrice = searchParams?.get("propertyPrice");
  const propertyLocation = searchParams?.get("propertyLocation");
  const projectTypeParam = searchParams?.get("projectType");
  const messageParam = searchParams?.get("message");

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

  // Pré-remplir le formulaire si des paramètres sont présents
  useEffect(() => {
    if (messageParam) {
      form.setValue("message", messageParam);
    }
    if (projectTypeParam === "location" || projectTypeParam === "achat") {
      form.setValue("projectType", projectTypeParam);
    }
  }, [messageParam, projectTypeParam, form]);

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

      // GTM Tracking - Generate Lead
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

  return (
    <div className="space-y-10 py-6">
      <div className="mx-auto w-full max-w-lg rounded-[32px] border border-white/10 bg-background/5 px-6 py-10 shadow-[0_20px_80px_rgba(5,8,12,0.55)] backdrop-blur">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Conciergerie
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Confiez-nous votre visite
          </h1>
          <p className="mt-2 text-white/60">
            Remplissez ce formulaire et un conseiller Dousell vous recontacte
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
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-background/5 px-4 text-white outline-none transition focus:border-white/30 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em"
                }}
                {...form.register("projectType")}
              >
                <option value="achat" className="bg-[#121212] text-white py-2">
                  Achat
                </option>
                <option value="location" className="bg-[#121212] text-white py-2">
                  Location
                </option>
              </select>
              {form.formState.errors.projectType && (
                <p className="text-sm text-amber-300">
                  {form.formState.errors.projectType.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Disponibilité</label>
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-background/5 px-4 text-white outline-none transition focus:border-white/30 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em"
                }}
                {...form.register("availability")}
              >
                {Object.entries(availabilityLabels).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    className="bg-[#121212] text-white py-2"
                  >
                    {label}
                  </option>
                ))}
              </select>
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
            key={captchaResetKey} // Force le remontage pour un nouveau challenge
            onVerify={(token) => {
              setCaptchaToken(token);
            }}
            onExpire={() => {
              setCaptchaToken(null);
              // Le widget se réinitialise automatiquement
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

