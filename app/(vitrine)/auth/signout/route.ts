import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
    const supabase = await createClient()

    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function POST(_request: NextRequest) {
    const supabase = await createClient()

    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}
