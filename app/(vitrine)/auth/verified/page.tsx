'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EmailVerifiedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Décompte avant redirection automatique
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/compte')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icône de succès avec animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <CheckCircle2 className="relative h-20 w-20 text-primary animate-in zoom-in duration-500" />
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
            Email vérifié avec succès !
          </h1>
          <p className="text-lg text-gray-400 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Votre compte Dousell Immo est maintenant actif
          </p>
        </div>

        {/* Message de redirection */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirection dans {countdown}s...</span>
          </div>

          <Button
            onClick={() => router.push('/compte')}
            className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
          >
            Accéder à mon compte
          </Button>
        </div>

        {/* Decoration */}
        <div className="pt-8 border-t border-gray-800 space-y-2 animate-in fade-in duration-700 delay-300">
          <p className="text-sm text-gray-500">
            Bienvenue dans la communauté Dousell Immo
          </p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-primary text-2xl">✨</span>
            <span className="text-gray-400 text-sm">Votre aventure immobilière commence ici</span>
            <span className="text-primary text-2xl">✨</span>
          </div>
        </div>
      </div>
    </div>
  )
}
