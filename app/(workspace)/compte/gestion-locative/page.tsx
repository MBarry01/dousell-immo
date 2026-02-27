import { redirect } from "next/navigation";

/**
 * Redirection automatique de l'ancien chemin vers le nouveau
 * Ancien : /compte/gestion-locative
 * Nouveau : /gestion
 */
export default function GestionLocativeOldPage() {
  redirect("/gestion");
}
