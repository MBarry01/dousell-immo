import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  // Pour l'instant, pas de page détail séparée, on redirige vers l'édition
  redirect(`/gestion/biens/${id}/edit`);
}
