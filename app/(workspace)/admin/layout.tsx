import { requireAnyRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification des permissions - seuls les utilisateurs avec un rôle peuvent accéder
  await requireAnyRole();

  // Le workspace layout parent gère le shell (header + sidebar)
  // Ici on garde juste la vérification des permissions
  return <>{children}</>;
}
