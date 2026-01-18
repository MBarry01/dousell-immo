// Le layout workspace parent gère déjà le header et la sidebar
// Ce layout peut ajouter des éléments spécifiques au contexte locataire si nécessaire

export default function LocataireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
