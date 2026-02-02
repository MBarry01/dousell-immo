"use server";

import { setActiveTeam } from "@/lib/team-switching";
import { revalidatePath } from "next/cache";

export async function switchTeam(teamId: string) {
    await setActiveTeam(teamId);
    revalidatePath("/", "layout"); // Revalidate everything
}
