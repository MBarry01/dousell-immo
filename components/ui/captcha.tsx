"use client";

import { useEffect, useState } from "react";
import Turnstile from "react-turnstile";

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

export function Captcha({
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
  className = "",
}: CaptchaProps) {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [resetKey, setResetKey] = useState(0); // Key to force remount
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (key) {
      setSiteKey(key);
      setIsReady(true);
      setConfigError(false);
    } else {
      console.error("❌ NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas définie dans les variables d'environnement");
      setConfigError(true);
      setIsReady(true); // Set ready to show error message
    }
  }, []);

  const handleExpire = () => {
    console.warn("Turnstile token expired. Resetting widget.");
    setResetKey((prev) => prev + 1); // Increment key to force remount
    onExpire?.();
  };

  if (!isReady) {
    return null;
  }

  if (configError || !siteKey) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <p className="text-sm font-semibold text-red-400">
            ⚠️ Configuration manquante
          </p>
          <p className="mt-1 text-xs text-red-300/70">
            La clé Cloudflare Turnstile n'est pas configurée.
          </p>
          <p className="mt-2 text-xs text-red-300/50">
            Ajoutez <code className="rounded bg-red-500/20 px-1 py-0.5">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> dans vos variables d'environnement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <Turnstile
        key={resetKey} // Use key to force remount
        sitekey={siteKey}
        onSuccess={onVerify}
        onError={() => {
          console.error("Turnstile verification error");
          onError?.();
        }}
        onExpire={handleExpire} // Use custom handler
        theme={theme}
        size={size}
      />
    </div>
  );
}
