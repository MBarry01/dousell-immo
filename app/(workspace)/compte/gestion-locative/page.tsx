import { redirect } from "next/navigation";

/**
 * Redirection automatique de l'ancien chemin vers le nouveau
 * Ancien : /compte/gestion-locative
 * Nouveau : /gestion-locative
 */
export default function GestionLocativeRedirect() {
  redirect("/gestion-locative");
}
