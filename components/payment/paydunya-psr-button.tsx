"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

interface PayDunyaPSRButtonProps {
    serviceType: string;
    description: string;
    amount: number;
    propertyId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    onSuccess?: (token: string, status: string) => void;
    onCancel?: () => void;
    onError?: (error: string) => void;
    buttonText?: string;
    className?: string;
}

declare global {
    interface Window {
        PayDunya?: {
            setup: (config: {
                selector: unknown;
                url: string;
                method: string;
                displayMode: string;
                beforeRequest?: () => void;
                onSuccess?: (token: string) => void;
                onTerminate?: (ref: string, token: string, status: string) => void;
                onError?: (error: Error) => void;
                onUnsuccessfulResponse?: (response: unknown) => void;
                onClose?: () => void;
            }) => { requestToken: () => void };
            DISPLAY_IN_POPUP: string;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $?: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jQuery?: any;
    }
}

// CDN URLs avec fallbacks
const JQUERY_CDNS = [
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js",
    "https://code.jquery.com/jquery-3.7.1.min.js",
    "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js",
];

const PAYDUNYA_JS = "https://paydunya.com/assets/psr/js/psr.paydunya.min.js";
const PAYDUNYA_CSS = "https://paydunya.com/assets/psr/css/psr.paydunya.min.css";

// Attendre qu'une condition soit vraie avec timeout
function waitFor(condition: () => boolean, timeout = 5000, interval = 100): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error("Timeout"));
            } else {
                setTimeout(check, interval);
            }
        };
        check();
    });
}

// Charger un script dynamiquement
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Échec: ${src}`));
        document.head.appendChild(script);
    });
}

// Charger jQuery avec fallbacks
async function loadjQuery(): Promise<void> {
    // Si jQuery est déjà chargé
    if (window.$ || window.jQuery) {
        return;
    }

    for (const cdn of JQUERY_CDNS) {
        try {
            await loadScript(cdn);
            // Attendre que jQuery soit réellement disponible
            await waitFor(() => !!(window.$ || window.jQuery), 3000);
            console.log("✅ jQuery chargé depuis:", cdn);
            return;
        } catch {
            console.warn("❌ Échec jQuery CDN:", cdn);
        }
    }

    throw new Error("Impossible de charger jQuery");
}

// Charger le CSS
function loadCSS(href: string): void {
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;
    document.head.appendChild(link);
}

export default function PayDunyaPSRButton({
    serviceType,
    description,
    amount,
    propertyId,
    fullName = "",
    email = "",
    phone = "",
    onSuccess,
    onCancel,
    onError,
    buttonText = "Payer maintenant",
    className = "",
}: PayDunyaPSRButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [loading, setLoading] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [scriptsError, setScriptsError] = useState<string | null>(null);
    const [useFallback, setUseFallback] = useState(false);

    // Charger les scripts au montage
    useEffect(() => {
        let mounted = true;

        async function loadPayDunyaScripts() {
            try {
                // Charger le CSS
                loadCSS(PAYDUNYA_CSS);

                // Charger jQuery
                await loadjQuery();

                // Charger PayDunya
                await loadScript(PAYDUNYA_JS);

                // Attendre que PayDunya soit disponible
                await waitFor(() => !!window.PayDunya, 3000);

                if (mounted) {
                    setScriptsLoaded(true);
                    console.log("✅ Scripts PayDunya PSR chargés");
                }
            } catch (err) {
                console.error("❌ Erreur chargement scripts:", err);
                if (mounted) {
                    setScriptsError(err instanceof Error ? err.message : "Erreur");
                    // Proposer le fallback (redirection)
                    setUseFallback(true);
                }
            }
        }

        loadPayDunyaScripts();

        return () => { mounted = false; };
    }, []);

    // Construire l'URL de l'API
    const buildApiUrl = useCallback(() => {
        const params = new URLSearchParams({
            serviceType,
            description,
            amount: amount.toString(),
        });
        if (propertyId) params.append("propertyId", propertyId);
        if (fullName) params.append("fullName", fullName);
        if (email) params.append("email", email);
        if (phone) params.append("phone", phone);

        return `/api/paydunya-api?${params.toString()}`;
    }, [serviceType, description, amount, propertyId, fullName, email, phone]);

    // Paiement via popup PSR
    const handlePayment = () => {
        if (!scriptsLoaded || !window.PayDunya || !window.$) {
            setUseFallback(true);
            return;
        }

        if (!buttonRef.current) return;

        setLoading(true);

        try {
            window.PayDunya.setup({
                selector: window.$(buttonRef.current),
                url: buildApiUrl(),
                method: "GET",
                displayMode: window.PayDunya.DISPLAY_IN_POPUP,
                beforeRequest: () => {
                    console.log("PayDunya: Récupération du token...");
                },
                onSuccess: (token) => {
                    console.log("PayDunya: Token reçu:", token);
                },
                onTerminate: (ref, token, status) => {
                    console.log("PayDunya: Terminé", { ref, token, status });
                    setLoading(false);

                    if (status === "completed") {
                        onSuccess?.(token, status);
                    } else if (status === "cancelled") {
                        onCancel?.();
                    } else {
                        onError?.(`Paiement ${status}`);
                    }
                },
                onError: (error) => {
                    console.error("PayDunya Error:", error);
                    setLoading(false);
                    onError?.(error.toString());
                },
                onUnsuccessfulResponse: (response) => {
                    console.error("PayDunya Unsuccessful:", response);
                    setLoading(false);
                    onError?.("Réponse non réussie");
                },
                onClose: () => {
                    console.log("PayDunya: Popup fermé");
                    setLoading(false);
                },
            }).requestToken();
        } catch (err) {
            setLoading(false);
            setUseFallback(true);
            onError?.(err instanceof Error ? err.message : "Erreur");
        }
    };

    // Paiement via redirection (fallback)
    const handleRedirectPayment = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/paydunya/create-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceType,
                    description,
                    amount,
                    propertyId,
                    returnUrl: window.location.href,
                    cancelUrl: window.location.href,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Erreur");
            }

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (err) {
            setLoading(false);
            onError?.(err instanceof Error ? err.message : "Erreur");
        }
    };

    return (
        <div className="space-y-4">
            {/* Affichage du montant */}
            <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <span>Montant à payer :</span>
                <span className="font-bold text-lg text-primary">
                    {amount.toLocaleString()} FCFA
                </span>
            </div>

            {/* Bouton principal ou fallback */}
            {!useFallback ? (
                <Button
                    ref={buttonRef}
                    className={`w-full pay ${className}`}
                    onClick={handlePayment}
                    disabled={loading || !scriptsLoaded}
                    data-ref={propertyId || "payment"}
                    data-fullname={fullName}
                    data-email={email}
                    data-phone={phone}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                        </>
                    ) : !scriptsLoaded && !scriptsError ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initialisation...
                        </>
                    ) : (
                        buttonText
                    )}
                </Button>
            ) : (
                <Button
                    className={`w-full bg-orange-500 hover:bg-orange-600 text-white ${className}`}
                    onClick={handleRedirectPayment}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirection...
                        </>
                    ) : (
                        <>
                            Payer via PayDunya
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            )}

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground">
                {useFallback
                    ? "Vous serez redirigé vers PayDunya pour finaliser le paiement"
                    : "Paiement sécurisé via PayDunya (Wave, Orange Money, Free Money)"
                }
            </p>
        </div>
    );
}
