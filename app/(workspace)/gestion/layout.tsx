// Le layout workspace parent gère le header et la sidebar
// Ce layout peut ajouter des éléments spécifiques à la gestion si nécessaire

export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
