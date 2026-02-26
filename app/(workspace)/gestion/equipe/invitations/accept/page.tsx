import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { AcceptInvitationClient } from "./AcceptInvitationClient";

export const metadata = {
  title: "Accepter l'invitation | Dousel",
  description: "Acceptez votre invitation à rejoindre une équipe",
};

interface AcceptInvitationPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/gestion/equipe?error=invalid_token");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si pas connecté, rediriger vers login avec retour
  if (!user) {
    redirect(`/login?redirect=/gestion/equipe/invitations/accept?token=${token}`);
  }

  // Récupérer l'invitation (admin client pour bypass RLS)
  const supabaseAdmin = createAdminClient();
  const { data: invitation, error } = await supabaseAdmin
    .from("team_invitations")
    .select(`
      id,
      team_id,
      email,
      role,
      status,
      expires_at,
      message,
      token,
      team:teams(id, name, slug, description)
    `)
    .eq("token", token)
    .single();

  if (error || !invitation) {
    redirect("/gestion/equipe?error=invitation_not_found");
  }

  // Transformer team de tableau en objet (Supabase renvoie les relations comme tableaux)
  const invitationData = {
    ...invitation,
    team: Array.isArray(invitation.team) ? invitation.team[0] : invitation.team,
  };

  // Vérifier si expirée
  const isExpired = new Date(invitationData.expires_at) < new Date();

  // Vérifier si déjà acceptée
  if (invitationData.status === "accepted") {
    redirect(`/gestion/equipe?error=invitation_already_accepted`);
  }

  // Vérifier si annulée
  if (invitationData.status === "cancelled") {
    redirect("/gestion/equipe?error=invitation_cancelled");
  }

  // Vérifier si l'email correspond
  const emailMatch = invitationData.email.toLowerCase() === user.email?.toLowerCase();

  return (
    <AcceptInvitationClient
      invitation={invitationData}
      token={token}
      isExpired={isExpired}
      emailMatch={emailMatch}
      userEmail={user.email || ""}
    />
  );
}
