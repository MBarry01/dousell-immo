import { NextResponse } from "next/server";
import { logoutTenant } from "@/app/locataire/actions";

export async function POST() {
  await logoutTenant();
  return NextResponse.json({ success: true });
}
