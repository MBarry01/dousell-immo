import { redirect, notFound } from "next/navigation";
import { getUserTeamContext } from "@/lib/team-context";
import { hasTeamPermission } from "@/lib/team-permissions.server";
import { getTeamPropertyById } from "../../actions";
import { EditBienClient } from "../edit-client";

type PageProps = {
    params: Promise<{ id: string }>;
};

export const metadata = {
    title: "Modifier un bien | Gestion - Dousel",
};

export default async function EditBienPage({ params }: PageProps) {
    const { id } = await params;
    const teamContext = await getUserTeamContext();

    if (!teamContext) {
        redirect("/compte?message=no_team");
    }

    const canEdit = await hasTeamPermission(teamContext.team_id, "properties.edit");
    if (!canEdit) {
        redirect("/gestion/biens?error=permission_denied");
    }

    const { property, error } = await getTeamPropertyById(teamContext.team_id, id);

    if (error || !property) {
        notFound();
    }

    return (
        <EditBienClient
            teamId={teamContext.team_id}
            teamName={teamContext.team_name}
            property={property}
        />
    );
}
