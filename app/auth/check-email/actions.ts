'use server'

import { createAdminClient } from "@/utils/supabase/admin"

export async function checkEmailVerificationStatus(email: string) {
    if (!email) return false

    try {
        const supabase = createAdminClient()

        // On récupère les utilisateurs pour trouver celui qui correspond à l'email
        // Note: listUsers est paginé, on prend une marge de sécurité
        const { data, error } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 100
        })

        if (error) {
            console.error("Error checking verification:", error)
            return false
        }

        const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (user && user.email_confirmed_at) {
            return true
        }

        return false
    } catch (error) {
        console.error("Unexpected error:", error)
        return false
    }
}
