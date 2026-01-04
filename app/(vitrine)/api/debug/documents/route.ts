import { createClient } from "@/utils/supabase/server";
import { requireAnyRole } from "@/lib/permissions";

export async function GET() {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // Get ALL documents to see what's in the database
        const { data: allDocs, error: allError } = await supabase
            .from("user_documents")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

        // Get count of documents
        const { count, error: countError } = await supabase
            .from("user_documents")
            .select("*", { count: "exact", head: true });

        // Get table schema info (columns)
        const { data: columns, error: schemaError } = await supabase
            .from("user_documents")
            .select("*")
            .limit(1);

        return Response.json({
            success: true,
            totalDocuments: count,
            sampleDocuments: allDocs,
            tableColumns: columns && columns.length > 0 ? Object.keys(columns[0]) : [],
            errors: {
                allError,
                countError,
                schemaError
            }
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
