
import { createClient } from "@/utils/supabase/server";

export default async function DebugPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Not logged in</div>;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="p-8 font-mono text-sm bg-black text-white min-h-screen">
            <h1 className="text-xl font-bold mb-4">Debug Profile: {user.email}</h1>
            <h2 className="text-lg font-bold mt-4 mb-2">Supabase Profile Data:</h2>
            <pre className="bg-zinc-900 p-4 rounded overflow-auto border border-zinc-800">
                {JSON.stringify({ profile, error }, null, 2)}
            </pre>

            <h2 className="text-lg font-bold mt-4 mb-2">Auth User Data:</h2>
            <pre className="bg-zinc-900 p-4 rounded overflow-auto border border-zinc-800">
                {JSON.stringify(user, null, 2)}
            </pre>
        </div>
    );
}
