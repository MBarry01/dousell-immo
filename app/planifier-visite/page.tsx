"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

import { createVisitRequest } from "@/app/planifier-visite/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";

const availabilityLabels: Record<VisitRequestFormValues["availability"], string> = {
  "semaine-matin": "En semaine (Matin)",
  "semaine-apres-midi": "En semaine (Après-midi)",
  weekend: "Le week-end",
};

export default function PlanifierVisitePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    try {
      setIsSubmitting(true);
      const result = await createVisitRequest(values);
      if (!result.success) {
        toast.error(result.error || "Impossible d'envoyer la demande.");
        return;
      }
      toast.success("Demande envoyée !", {
        description: `${values.fullName}, un conseiller vous rappelle sous 30 min.`,
      });
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue, merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 py-6">
      <div className="mx-auto w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 px-6 py-10 shadow-[0_20px_80px_rgba(5,8,12,0.55)] backdrop-blur">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Conciergerie
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Confiez-nous votre visite
          </h1>
          <p className="mt-2 text-white/60">
            Remplissez ce formulaire et un conseiller Doussel vous recontacte
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
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
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
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
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
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition focus:border-white/30"
                {...form.register("projectType")}
              >
                <option value="achat" className="bg-[#05080c] text-white">
                  Achat
                </option>
                <option value="location" className="bg-[#05080c] text-white">
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
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition focus:border-white/30"
                {...form.register("availability")}
              >
                {Object.entries(availabilityLabels).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    className="bg-[#05080c] text-white"
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
              className="min-h-[140px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p className="text-sm text-amber-300">
                {form.formState.errors.message.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full rounded-full bg-white text-black hover:bg-white/90"
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
            className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-[#25D366] transition hover:text-[#1DA851]"
          >
            <MessageCircle className="h-5 w-5" />
            Discuter directement sur WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}

