"use client";

import { useEffect, useState } from "react";
import Turnstile from "react-turnstile";

interface CaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function Captcha({ onVerify, onExpire }: CaptchaProps) {
  const [mounted, setMounted] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !siteKey) return null;

  return (
    <div className="my-4 flex flex-col items-center gap-2">
      <Turnstile
        sitekey={siteKey}
        onVerify={onVerify}
        onExpire={onExpire}
        theme="auto"
      />
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              id="bypass-captcha-btn"
              onClick={() => onVerify("dev-token")}
              className="text-xs text-amber-400 hover:text-amber-300 underline p-2 border border-amber-400/30 rounded"
            >
              [DEV] Bypass Captcha
            </button>
          )}
    </div>
  );
}
