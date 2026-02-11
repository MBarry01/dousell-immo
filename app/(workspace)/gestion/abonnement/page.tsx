import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}

export default async function SubscriptionRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Relay checkout result to config page (subscription tab)
  if (params.success) {
    redirect(`/gestion/config?tab=subscription&checkout=success`);
  }
  if (params.canceled) {
    redirect(`/gestion/config?tab=subscription&checkout=canceled`);
  }

  // Default redirect
  redirect("/gestion/config?tab=subscription");
}
