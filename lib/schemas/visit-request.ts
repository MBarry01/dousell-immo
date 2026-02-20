import { z } from "zod";

export const visitRequestSchema = z.object({
  fullName: z
    .string()
    .min(2, "Merci d'indiquer votre nom complet.")
    .max(80),
  phone: z
    .string()
    .min(8, "Numéro requis.")
    .regex(/^[0-9+\s]{8,}$/, "Format de numéro invalide."),
  projectType: z.enum(["achat", "location"]),
  availability: z.enum(["semaine-matin", "semaine-apres-midi", "weekend"]),
  message: z.string().min(10, "Décrivez brièvement votre recherche."),
  // Optionnel : identifiant du bien concerné (passé via l'URL)
  propertyId: z.string().uuid().optional(),
  propertyTitle: z.string().optional(),
});

export type VisitRequestFormValues = z.infer<typeof visitRequestSchema>;
