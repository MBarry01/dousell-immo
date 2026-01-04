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

        if (user) {
            console.log("🔍 CheckStatus found user:", {
                email: user.email,
                confirmed_at: user.email_confirmed_at,
                id: user.id
            })

            if (user.email_confirmed_at) {
                return true
            }
        } else {
            console.log("🔍 CheckStatus: User not found for email", email)
        }


        return false
    } catch (error) {
        console.error("Unexpected error:", error)
        return false
    }
}

import { createClient } from "@/utils/supabase/server"

export async function verifySignupOtp(email: string, token: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup'
        })

        if (error) {
            console.error("Erreur vérification OTP:", error)
            return { error: error.message }
        }

        // Force a session refresh to ensure cookies are set
        await supabase.auth.refreshSession()

        return { success: true, session: data.session }
    } catch (error) {
        console.error("Erreur inattendue OTP:", error)
        return { error: "Une erreur inattendue s'est produite" }
    }
}
