"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calculator,
  Building2,
  Home,
  Mountain,
  Store,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { analyticsEvents } from "@/lib/analytics";

const STORAGE_KEY = "dousell-immo-estimation";

const wizardSchema = z.object({
  type: z.enum(["appartement", "villa", "terrain", "commercial"]).refine((val) => val !== undefined, {
    message: "Choisis un type de bien",
  }),
  quartier: z.string().min(1, "Sélectionne un quartier"),
  landmark: z
    .string()
    .min(3, "Décris un point de repère")
    .max(120, "Un point de repère court suffit"),
  surface: z
    .string()
    .min(1, "Indique une surface")
    .regex(/^\d+$/, "Surface en m²"),
  rooms: z.number().min(1).max(10),
  condition: z.enum(["neuf", "bon", "renover"]).refine((val) => val !== undefined, {
    message: "Sélectionne l'état du bien",
  }),
  fullName: z.string().min(2, "Nom complet requis"),
  phone: z.string().min(6, "Numéro valide requis"),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Email invalide"
    ),
  consent: z.literal(true, {
    message: "L'acceptation est requise",
  }),
  includeTaxes: z.boolean(),
});

type WizardValues = z.infer<typeof wizardSchema>;

const defaultValues: WizardValues = {
  type: "appartement",
  quartier: "",
  landmark: "",
  surface: "",
  rooms: 3,
  condition: "bon",
  fullName: "",
  phone: "",
  email: "",
  consent: true,
  includeTaxes: false,
};

const propertyTypes = [
  { value: "appartement", label: "Appartement", icon: Building2 },
  { value: "villa", label: "Villa", icon: Home },
  { value: "terrain", label: "Terrain", icon: Mountain },
  { value: "commercial", label: "Immeuble / Commercial", icon: Store },
];

const quartiers = [
  "Almadies",
  "Plateau",
  "Mermoz",
  "Yoff",
  "Ngor",
  "Ouakam",
  "Sacre-Cœur",
  "Les Mamelles",
  "Fann",
  "HLM",
];

const conditions = [
  { value: "neuf", label: "Neuf / En construction" },
  { value: "bon", label: "Bon état" },
  { value: "renover", label: "À rénover" },
];

const steps = [
  { id: "type", title: "Type de bien", fields: ["type"] as (keyof WizardValues)[] },
  {
    id: "localisation",
    title: "Localisation",
    fields: ["quartier", "landmark"] as (keyof WizardValues)[],
  },
  { id: "surface", title: "Surface & pièces", fields: ["surface", "rooms"] as (keyof WizardValues)[] },
  { id: "etat", title: "État du bien", fields: ["condition"] as (keyof WizardValues)[] },
  {
    id: "contact",
    title: "Contact",
    fields: ["fullName", "phone", "email", "consent", "includeTaxes"] as (keyof WizardValues)[],
  },
];

export const EstimationWizard = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: "onTouched",
    defaultValues,
  });

  const values = useWatch({ control });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          values: WizardValues;
          step: number;
        };
        reset(parsed.values);
        startTransition(() => setStep(parsed.step ?? 0));
      } catch {
        // ignore
      }
    } else {
      // Track le démarrage du formulaire seulement si c'est la première fois
      analyticsEvents.estimateStart();
    }
  }, [reset]);

  useEffect(() => {
    const payload = JSON.stringify({ values, step });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [values, step]);

  const progress = ((step + 1) / steps.length) * 100;

  const surfaceValue = values.surface;
  const roomsValue = values.rooms;

  const handleNext = async () => {
    const fields = steps[step].fields;
    const valid = await trigger(fields, { shouldFocus: true });
    if (!valid) return;
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      const allValues = getValues();
      await onSubmit(allValues);
    }
  };

  const handlePrev = () => setStep((prev) => Math.max(0, prev - 1));

  const [submittedValues, setSubmittedValues] = useState<WizardValues | null>(
    null
  );

  const onSubmit = async (formValues: WizardValues) => {
    setIsSubmitting(true);

    // Track la complétion du formulaire
    analyticsEvents.estimateComplete(formValues.type, formValues.quartier);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setSubmittedValues(formValues);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalLocation = useMemo(() => {
    const monthly = Number(surfaceValue || 0) * 1000; // placeholder estimation
    const base = monthly * 4; // loyer + caution + avance + agence
    const taxes = values.includeTaxes ? monthly * 12 * 0.036 : 0;
    return base + taxes;
  }, [surfaceValue, values.includeTaxes]);

  if (submitted) {
    return (
      <div className="rounded-[32px] border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-white">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="text-2xl font-semibold">C&apos;est envoyé !</h2>
        <p className="mt-2 text-white/80">
          Oumar, notre expert secteur{" "}
          {submittedValues?.quartier || values.quartier || "Dakar"}, analyse votre
          dossier.
        </p>
        <Button className="mt-6 rounded-full" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#090c14]/80 p-6 text-white shadow-2xl">
      <div className="mb-6">
        <div className="text-sm uppercase tracking-[0.3em] text-white/40">
          Estimation express
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {step === 0 && (
              <div>
                <h3 className="text-2xl font-semibold">Quel type de bien ?</h3>
                <p className="text-white/60">Choisis la typologie principale</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {propertyTypes.map((type) => (
                    <button
                      type="button"
                      key={type.value}
                      className={`flex h-20 items-center gap-3 rounded-2xl border px-4 text-left ${values.type === type.value
                          ? "border-white bg-white/10"
                          : "border-white/10 bg-white/5 text-white/70"
                        }`}
                      onClick={() => setValue("type", type.value as "appartement" | "villa" | "terrain" | "commercial")}
                    >
                      <type.icon className="h-6 w-6" />
                      <span className="text-lg font-semibold">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-2 text-sm text-amber-300">
                    {errors.type.message}
                  </p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="quartier" className="text-sm text-white/70">Quartier</label>
                  <select
                    id="quartier"
                    {...register("quartier")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <option value="">Sélectionnez</option>
                    {quartiers.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  {errors.quartier && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.quartier.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="landmark" className="text-sm text-white/70">
                    Point de repère
                  </label>
                  <Textarea
                    id="landmark"
                    placeholder="Ex: Derrière la pharmacie des Mamelles..."
                    {...register("landmark")}
                  />
                  {errors.landmark && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.landmark.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-white/60">Surface estimée</p>
                  <div className="mt-2 flex items-center justify-center gap-2 text-5xl font-semibold">
                    <Input
                      id="surface"
                      {...register("surface")}
                      className="w-40 rounded-[40px] border-white/20 bg-white/10 text-center text-4xl tracking-wide"
                      placeholder="150"
                    />
                    <span className="text-3xl text-white/60">m²</span>
                  </div>
                  {errors.surface && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.surface.message}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/60">Nombre de pièces</p>
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 w-12 rounded-full"
                      onClick={() =>
                        setValue("rooms", Math.max(1, (roomsValue ?? 1) - 1))
                      }
                    >
                      –
                    </Button>
                    <span className="text-4xl font-semibold">{roomsValue}</span>
                    <Button
                      type="button"
                      className="h-12 w-12 rounded-full"
                      onClick={() =>
                        setValue("rooms", Math.min(10, (roomsValue ?? 1) + 1))
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">
                  Quel est l&apos;état du bien ?
                </h3>
                <div className="space-y-3">
                  {conditions.map((condition) => (
                    <button
                      key={condition.value}
                      type="button"
                      onClick={() => setValue("condition", condition.value as "neuf" | "bon" | "renover")}
                      className={`w-full rounded-2xl border px-4 py-4 text-left ${values.condition === condition.value
                          ? "border-white bg-white/10"
                          : "border-white/10 bg-white/5 text-white/70"
                        }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
                {errors.condition && (
                  <p className="text-sm text-amber-300">
                    {errors.condition.message}
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">
                  Recevez votre estimation par WhatsApp
                </h3>
                <div>
                  <label htmlFor="fullName" className="text-sm text-white/70">Prénom Nom</label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="Ex: Fatou Ndiaye"
                    className="mt-2"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-amber-300">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm text-white/70">Téléphone</label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    className="mt-2"
                  />
                  {errors.phone && (
                    <p className="text-sm text-amber-300">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="text-sm text-white/70">
                    Email (optionnel)
                  </label>
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="contact@exemple.com"
                    className="mt-2"
                  />
                  {errors.email && (
                    <p className="text-sm text-amber-300">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <label htmlFor="consent" className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <input
                    id="consent"
                    type="checkbox"
                    {...register("consent")}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent"
                  />
                  J&apos;accepte d&apos;être contacté(e) par Dousel pour
                  finaliser mon estimation.
                </label>
                {errors.consent && (
                  <p className="text-sm text-amber-300">
                    {errors.consent.message}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </form>

      {values.type !== "terrain" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <div className="mb-2 flex items-center gap-2 text-white">
            <Calculator className="h-4 w-4 text-amber-300" />
            Budget à prévoir pour l&apos;entrée
          </div>
          <ul className="space-y-1 text-white/70">
            <li>Loyer (1 mois)</li>
            <li>Caution (x2)</li>
            <li>Avance (1 mois)</li>
            <li>Frais d&apos;agence (1 mois)</li>
            <li>
              <label htmlFor="includeTaxes" className="mt-2 inline-flex items-center gap-2">
                <input
                  id="includeTaxes"
                  type="checkbox"
                  checked={values.includeTaxes}
                  onChange={(event) =>
                    setValue("includeTaxes", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/30 bg-transparent"
                />
                Enregistrement Impôts (3.6 %)
              </label>
            </li>
          </ul>
          <div className="mt-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Total à décaisser
            </p>
            <p className="text-3xl font-bold text-white">
              {new Intl.NumberFormat("fr-SN", {
                maximumFractionDigits: 0,
              }).format(totalLocation)}{" "}
              FCFA
            </p>
            <p className="mt-1 text-xs text-white/50">
              Estimation basée sur les standards du marché à Dakar.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {step > 0 && (
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full border border-white/30 bg-transparent text-white"
            onClick={handlePrev}
          >
            Précédent
          </Button>
        )}
        <Button
          type="button"
          className="w-full rounded-full"
          disabled={isSubmitting}
          onClick={handleNext}
        >
          {step === steps.length - 1 ? "Envoyer" : "Suivant"}
        </Button>
      </div>
    </div>
  );
};

