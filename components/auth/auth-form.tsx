'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { checkPasswordHIBPServer } from '@/app/actions/check-hibp'

interface AuthFormProps {
  view?: 'sign_in' | 'sign_up'
}

export function AuthForm({ view = 'sign_in' }: AuthFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Redirection si déjà connecté
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Hook pour intercepter le formulaire et valider HIBP avant l'envoi
  useEffect(() => {
    const form = document.querySelector('form')
    if (!form) return

    const handleSubmit = async (e: Event) => {
      const target = e.target as HTMLFormElement
      const formData = new FormData(target)
      const password = formData.get('password') as string
      const email = formData.get('email') as string

      // Vérification HIBP uniquement pour l'inscription
      const isSignUp = target.querySelector('button[type="submit"]')?.textContent?.toLowerCase().includes('sign up') ||
                       target.querySelector('button[type="submit"]')?.textContent?.toLowerCase().includes('inscription')

      if (isSignUp && password) {
        e.preventDefault()
        setIsChecking(true)
        setError(null)

        try {
          const result = await checkPasswordHIBPServer(password)

          if (!result.success) {
            console.warn("HIBP check failed:", result.error)
            // Soft-fail : on continue l'inscription même si la vérification échoue
          } else if (result.breached) {
            setError(result.error || "Ce mot de passe a été compromis dans une fuite de données. Choisissez-en un autre plus sécurisé.")
            setIsChecking(false)
            return
          }

          // Si la validation HIBP passe, soumettre le formulaire
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          })

          if (signUpError) {
            setError(signUpError.message)
          }
        } catch (err) {
          console.error("Error during HIBP check:", err)
          // En cas d'erreur, on continue quand même (soft-fail)
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          })
          if (signUpError) {
            setError(signUpError.message)
          }
        } finally {
          setIsChecking(false)
        }
      }
    }

    form.addEventListener('submit', handleSubmit)
    return () => form.removeEventListener('submit', handleSubmit)
  }, [supabase])

  return (
    <div className="w-full max-w-md">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <Auth
        supabaseClient={supabase}
        view={view}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#F4C430', // Or (Dousell Immo)
                brandAccent: '#D4A028',
                inputBackground: '#121212',
                inputText: 'white',
                inputPlaceholder: '#6b7280',
                defaultButtonBackground: '#121212',
                defaultButtonBackgroundHover: '#1a1a1a',
                defaultButtonBorder: '#333333',
                defaultButtonText: 'white',
                dividerBackground: '#333333',
                anchorTextColor: '#F4C430',
                anchorTextHoverColor: '#D4A028',
              },
              borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
              },
              radii: {
                borderRadiusButton: '0.5rem',
                buttonBorderRadius: '0.5rem',
                inputBorderRadius: '0.5rem',
              },
            },
          },
          className: {
            button: 'font-medium transition-all duration-200',
            input: 'transition-all duration-200',
            label: 'text-gray-300 font-medium',
            message: 'text-sm',
            container: 'space-y-4',
          },
        }}
        providers={['google']}
        redirectTo={`${window.location.origin}/auth/callback`}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Mot de passe',
              email_input_placeholder: 'votre.email@exemple.com',
              password_input_placeholder: 'Votre mot de passe',
              button_label: 'Connexion',
              loading_button_label: 'Connexion en cours...',
              social_provider_text: 'Connexion avec {{provider}}',
              link_text: "Vous avez déjà un compte ? Connectez-vous",
            },
            sign_up: {
              email_label: 'Email',
              password_label: 'Mot de passe',
              email_input_placeholder: 'votre.email@exemple.com',
              password_input_placeholder: 'Créez un mot de passe sécurisé',
              button_label: isChecking ? 'Vérification en cours...' : 'Créer un compte',
              loading_button_label: 'Création en cours...',
              social_provider_text: 'Inscription avec {{provider}}',
              link_text: "Pas encore de compte ? Inscrivez-vous",
            },
            forgotten_password: {
              email_label: 'Email',
              password_label: 'Mot de passe',
              email_input_placeholder: 'votre.email@exemple.com',
              button_label: 'Réinitialiser le mot de passe',
              loading_button_label: 'Envoi en cours...',
              link_text: 'Mot de passe oublié ?',
            },
            magic_link: {
              email_input_label: 'Email',
              email_input_placeholder: 'votre.email@exemple.com',
              button_label: 'Envoyer le lien magique',
              loading_button_label: 'Envoi en cours...',
            },
          },
        }}
        magicLink={true}
        showLinks={true}
        theme="dark"
      />
    </div>
  )
}
