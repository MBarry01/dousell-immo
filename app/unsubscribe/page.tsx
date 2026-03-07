import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

interface UnsubscribePageProps {
  searchParams: Promise<{ id?: string }>
}

export const metadata = {
  title: 'Désabonnement — Dousel Immo',
  robots: { index: false, follow: false },
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams
  const prospectId = params.id

  let success = false
  let alreadyUnsubscribed = false

  if (prospectId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check current status
    const { data: existing } = await supabase
      .from('b2b_prospects')
      .select('status')
      .eq('id', prospectId)
      .single()

    if (existing?.status === 'unsubscribed') {
      alreadyUnsubscribed = true
    } else if (existing) {
      const { error } = await supabase
        .from('b2b_prospects')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', prospectId)

      if (!error) success = true
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
        {alreadyUnsubscribed ? (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="text-2xl font-bold text-foreground">
              Déjà désabonné
            </h1>
            <p className="text-muted-foreground">
              Vous êtes déjà désabonné de nos communications commerciales.
            </p>
          </>
        ) : success ? (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="text-2xl font-bold text-foreground">
              Vous avez été désabonné
            </h1>
            <p className="text-muted-foreground">
              Vous ne recevrez plus d'emails de prospection de Dousel Immo.
              Cette décision est immédiatement prise en compte.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">
              Lien invalide
            </h1>
            <p className="text-muted-foreground">
              Ce lien de désabonnement est invalide ou a expiré.
              Si vous souhaitez ne plus recevoir nos emails, contactez-nous directement.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Retour au site
        </Link>
      </div>
    </div>
  )
}
