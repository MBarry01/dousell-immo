'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { checkEmailVerificationStatus } from './actions'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (!email) return

    const checkStatus = async () => {
      try {
        const isVerified = await checkEmailVerificationStatus(email)
        if (isVerified) {
          toast.success("Email vérifié avec succès !", {
            description: "Vous pouvez maintenant vous connecter.",
          })
          router.push('/login')
        }
      } catch (error) {
        console.error("Erreur vérification auto:", error)
      }
    }

    // Premier check immédiat
    checkStatus()

    // Puis toutes les 3 secondes
    const interval = setInterval(checkStatus, 3000)

    return () => clearInterval(interval)
  }, [email, router])

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        toast.error("Erreur", {
          description: "Impossible de renvoyer l'email. Veuillez réessayer dans quelques minutes.",
        })
      } else {
        toast.success("Email renvoyé !", {
          description: "Vérifiez votre boîte de réception.",
        })
      }
    } catch (err) {
      toast.error("Une erreur s'est produite")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-black px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="mb-4 text-2xl font-bold text-white">
            Vérifiez votre email
          </h1>

          {/* Description */}
          <div className="mb-6 space-y-3 text-white/70">
            <p>
              Un email de confirmation a été envoyé à :
            </p>
            <p className="font-semibold text-primary">
              {email}
            </p>
            <p>
              Cliquez sur le lien dans l&apos;email pour activer votre compte et vous connecter automatiquement.
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-6 rounded-xl bg-primary/10 p-4 text-left">
            <p className="text-sm text-white/70">
              <strong className="text-white">💡 Astuce :</strong> Vérifiez aussi votre dossier spam si vous ne voyez pas l&apos;email dans votre boîte de réception.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Resend Email Button */}
            <Button
              variant="outline"
              className="w-full rounded-xl border-white/20 text-white hover:bg-white/10"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renvoyer l&apos;email
                </>
              )}
            </Button>

            {/* Back to Login */}
            <Button
              variant="ghost"
              className="w-full rounded-xl text-white/70 hover:bg-white/5 hover:text-white"
              asChild
            >
              <Link href="/login">
                Retour à la connexion
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-xs text-white/50">
            Vous avez des problèmes ?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contactez le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  )
}
