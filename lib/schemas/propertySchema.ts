import { z } from "zod";

/**
 * Schéma Zod conditionnel pour le formulaire d'ajout de bien
 * Les champs sont rendus optionnels et validés conditionnellement selon le type de bien
 */
export const propertySchema = z
  .object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
    price: z.number().min(0, "Le prix doit être positif"),
    category: z.enum(["vente", "location"]),
    type: z.enum(["villa", "appartement", "terrain", "immeuble"]),
    city: z.string().min(1, "La ville est requise"),
    district: z.string().min(1, "Le quartier est requis"),
    address: z.string().min(3, "L'adresse doit contenir au moins 3 caractères"),
    landmark: z.string().min(3, "Le point de repère doit contenir au moins 3 caractères"),
    
    // Champs conditionnels pour les terrains
    surface: z.number().min(10, "La surface doit être d'au moins 10 m²").optional(),
    surfaceTotale: z.number().min(10, "La surface totale doit être d'au moins 10 m²").optional(),
    juridique: z.enum(["titre-foncier", "bail", "deliberation", "nicad"]).optional(),
    
    // Champs conditionnels pour les biens construits
    rooms: z.number().min(1, "Le nombre de pièces doit être d'au moins 1").optional(),
    bedrooms: z.number().min(0, "Le nombre de chambres ne peut pas être négatif").optional(),
    bathrooms: z.number().min(0, "Le nombre de salles de bain ne peut pas être négatif").optional(),
    
    // Features (optionnels, masqués pour les terrains)
    hasGenerator: z.boolean().optional(),
    hasWaterTank: z.boolean().optional(),
    security: z.boolean().optional(),
    pool: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Si c'est un terrain
    if (data.type === "terrain") {
      // Surface totale est requise
      if (!data.surfaceTotale || data.surfaceTotale < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La surface totale est requise pour un terrain",
          path: ["surfaceTotale"],
        });
      }
      
      // Situation juridique est requise
      if (!data.juridique) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La situation juridique est requise pour un terrain",
          path: ["juridique"],
        });
      }
      
      // Les champs de construction ne doivent pas être remplis
      // (mais on ne bloque pas si ils sont vides, juste on les ignore)
    } else {
      // Si ce n'est PAS un terrain (Villa, Appartement, Immeuble)
      // Surface habitable est requise
      if (!data.surface || data.surface < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La surface habitable est requise",
          path: ["surface"],
        });
      }
      
      // Pièces est requis
      if (!data.rooms || data.rooms < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nombre de pièces est requis",
          path: ["rooms"],
        });
      }
      
      // Chambres est requis
      if (data.bedrooms === undefined || data.bedrooms < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nombre de chambres est requis",
          path: ["bedrooms"],
        });
      }
      
      // Salles de bain est requis
      if (data.bathrooms === undefined || data.bathrooms < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nombre de salles de bain est requis",
          path: ["bathrooms"],
        });
      }
    }
  });

export type PropertyFormValues = z.infer<typeof propertySchema>;

