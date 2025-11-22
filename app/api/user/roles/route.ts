import { NextResponse } from "next/server";
import { getCurrentUserRoles } from "@/lib/permissions";

export async function GET() {
  try {
    const roles = await getCurrentUserRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json({ roles: [] }, { status: 200 });
  }
}

