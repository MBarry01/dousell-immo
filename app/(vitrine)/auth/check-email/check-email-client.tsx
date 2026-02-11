'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CheckEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Fonction pour gérer la soumission du code
  const handleVerify = async (token: string) => {
    // Supabase envoie parfois 6 ou 8 chiffres selon la config
    if (token.length < 6) return

    setIsVerifying(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      })

      console.log('🔐 verifyOtp result:', { data, error })

      if (!error && data.session) {
        // Confirmer que la session est bien établie
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('🔑 Session confirmée:', sessionData?.session?.user?.email)

        if (sessionData?.session) {
          toast.success("Email vérifié avec succès !", {
            description: "Redirection vers votre compte...",
          })

          // Attendre un peu pour que les cookies soient bien persistés
          await new Promise(resolve => setTimeout(resolve, 500))

          // Forcer un rechargement complet
          window.location.href = '/'
        } else {
          console.error('❌ Session non trouvée après verifyOtp')
          toast.error("Erreur de session", {
            description: "La session n'a pas pu être créée. Veuillez réessayer."
          })
        }
      } else {
        toast.error("Code invalide", {
          description: error?.message || "Le code saisi est incorrect ou expiré"
        })
      }
    } catch (error) {
      console.error('❌ Erreur verifyOtp:', error)
      toast.error("Une erreur s'est produite lors de la vérification")
    } finally {
      setIsVerifying(false)
    }
  }

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
        toast.success("Code renvoyé !", {
          description: "Vérifiez votre boîte de réception pour le nouveau code.",
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
          <div className="mb-8 space-y-3 text-white/70">
            <p>
              Un code de confirmation a été envoyé à :
            </p>
            <p className="font-semibold text-primary">
              {email}
            </p>
            <p>
              Saisissez le code reçu (6 ou 8 chiffres) ci-dessous.
            </p>
          </div>

          {/* Standard Input for OTP */}
          <div className="mb-6">
            <input
              type="text"
              name="otp"
              id="otp"
              className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 text-center text-2xl tracking-[1em] text-white placeholder:text-white/20 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="123456"
              maxLength={8}
              autoComplete="one-time-code"
              disabled={isVerifying}
              onChange={(e) => {
                // Auto-verify if 6 or 8 digits could be nice, but explicit button is safer for user experience with variable length
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value
                  if (val.length >= 6) handleVerify(val)
                }
              }}
            />
          </div>

          {isVerifying && (
            <p className="mb-6 text-sm text-primary animate-pulse">Vérification du code...</p>
          )}

          {/* Validate Button */}
          <Button
            className="mb-4 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              const input = document.getElementById('otp') as HTMLInputElement
              if (input && input.value.length >= 6) {
                handleVerify(input.value)
              } else {
                toast.error("Code trop court (minimum 6 chiffres)")
              }
            }}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              "Valider"
            )}
          </Button>

          {/* Info Box */}
          <div className="mb-6 rounded-xl bg-primary/10 p-4 text-left">
            <p className="text-sm text-white/70">
              <strong className="text-white">💡 Astuce :</strong> Vérifiez aussi votre dossier spam si vous ne voyez pas l&apos;email.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Resend Email Button */}
            <Button
              variant="outline"
              className="w-full rounded-xl border-white/20 text-white hover:bg-white/10"
              onClick={handleResendEmail}
              disabled={isResending || isVerifying}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renvoyer le code
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
