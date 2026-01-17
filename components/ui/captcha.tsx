"use client";

import { useState } from "react";
import Turnstile from "react-turnstile";

interface CaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function Captcha({ onVerify, onExpire }: CaptchaProps) {
  const [mounted] = useState(true); // Déjà monté si ce composant client s'exécute
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!mounted || !siteKey) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex justify-center bg-white/5 border border-white/10 rounded-xl p-3">
        <Turnstile
          sitekey={siteKey}
          onVerify={onVerify}
          onExpire={onExpire}
          theme="dark"
        />
      </div>
      {process.env.NODE_ENV === "development" && (
        <button
          type="button"
          id="bypass-captcha-btn"
          onClick={() => onVerify("dev-token")}
          className="text-xs text-amber-400 hover:text-amber-300 underline p-2 border border-amber-400/30 rounded self-center"
        >
          [DEV] Bypass Captcha
        </button>
      )}
    </div>
  );
}
