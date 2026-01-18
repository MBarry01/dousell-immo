import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { WorkspaceLayoutClient } from "./workspace-layout-client";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protection côté serveur - redirection si non connecté
  if (!user) {
    redirect("/login");
  }

  return <WorkspaceLayoutClient user={user}>{children}</WorkspaceLayoutClient>;
}
