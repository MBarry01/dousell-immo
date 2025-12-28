import { checkPayDunyaInvoiceStatus } from "@/lib/paydunya";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return Response.json({ error: "Token requis" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    const invoice = await checkPayDunyaInvoiceStatus(token);
    
    // Log complet pour debugging
    console.log("🔍 Réponse PayDunya complète:", JSON.stringify(invoice, null, 2));
    
    // Essayer plusieurs chemins pour trouver le statut
    const invoiceData = invoice as unknown as Record<string, unknown>;
    const status =
      invoiceData?.status ||
      invoiceData?.invoice_status ||
      (invoiceData?.invoice as Record<string, unknown>)?.status ||
      invoiceData?.state ||
      (invoiceData?.response_code === "00" ? "completed" : null);

    console.log("📊 Statut extrait:", status);
    console.log("📊 Response code:", invoiceData?.response_code);
    console.log("📊 Response text:", invoiceData?.response_text);

    // Vérifier si le paiement est complété selon plusieurs critères
    const responseText = typeof invoiceData?.response_text === 'string' ? invoiceData.response_text : '';
    const isCompleted =
      status === "completed" ||
      status === "paid" ||
      invoiceData?.response_code === "00" ||
      responseText.toLowerCase().includes("success") ||
      responseText.toLowerCase().includes("completed");

    return Response.json({
      success: true,
      status: isCompleted ? "completed" : status || "pending",
      isCompleted,
      response: invoice,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification PayDunya:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la vérification du paiement",
      },
      { status: 500 }
    );
  }
}

