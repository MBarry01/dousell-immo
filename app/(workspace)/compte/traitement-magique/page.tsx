"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { submitUserListing } from "../deposer/actions";
import { smartGeocode } from "@/lib/geocoding";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TraitementMagiquePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [status, setStatus] = useState("Vérification de votre compte...");
    const [needsPhone, setNeedsPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");
    const [isSavingPhone, setIsSavingPhone] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/login?redirect=/compte/traitement-magique");
            return;
        }

        // Intercept users signing up via Google Auth missing a phone number
        if (!user.user_metadata?.phone && !user.phone) {
            setNeedsPhone(true);
            return;
        }

        const processDraft = async () => {
            setStatus("Récupération de votre annonce magique...");
            const draft = localStorage.getItem("pending_property_draft");

            if (!draft) {
                router.push("/compte/deposer");
                return;
            }

            try {
                const parsed = JSON.parse(draft);
                const { title, price, surface, city, bedrooms, imageBase64 } = parsed;

                // Remove draft to avoid loop
                localStorage.removeItem("pending_property_draft");

                let uploadedUrl = "";
                if (imageBase64) {
                    setStatus("Configuration de la photo vitrine...");
                    const supabase = createClient();

                    // Convert base64 back to file (manual conversion to avoid fetch data uri limits)
                    const base64Data = imageBase64.split(",")[1];
                    const mimeType = imageBase64.split(",")[0].match(/:(.*?);/)?.[1] || "image/jpeg";
                    const byteString = atob(base64Data);
                    const arrayBuffer = new ArrayBuffer(byteString.length);
                    const uint8Array = new Uint8Array(arrayBuffer);
                    for (let i = 0; i < byteString.length; i++) {
                        uint8Array[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([arrayBuffer], { type: mimeType });
                    const file = new File([blob], `magic-${Date.now()}.jpg`, { type: mimeType });

                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                    const { error: uploadError } = await supabase.storage
                        .from("properties")
                        .upload(fileName, file, { cacheControl: "3600", upsert: false });

                    if (!uploadError) {
                        const { data } = supabase.storage.from("properties").getPublicUrl(fileName);
                        uploadedUrl = data.publicUrl;
                    } else {
                        console.error("Erreur uplaod image: ", uploadError);
                    }
                }

                setStatus("Création finale de l'annonce...");

                // Geocode for lat/lng based on city
                let coordinates = { lat: 14.7167, lng: -17.4677 };
                try {
                    if (city) {
                        coordinates = await smartGeocode(city, "", city);
                    }
                } catch { }

                const result = await submitUserListing({
                    type: "appartement",
                    category: "location",
                    title: title || "Mon annonce vitrine",
                    price: price ? (parseInt(price.replace(/\D/g, "")) || 1) : 1, // must be > 0
                    city: city || "Non spécifiée",
                    district: city || "Général", // district is required (.min(1))
                    address: city || "Non spécifiée",
                    landmark: "",
                    surface: surface ? parseInt(surface) : undefined,
                    rooms: bedrooms ? parseInt(bedrooms) : undefined,
                    bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
                    bathrooms: undefined,
                    description: (() => {
                        const parts: string[] = [];
                        const typeLabel = "logement";
                        const cityLabel = city ? `à ${city}` : "au Sénégal";

                        parts.push(`${title || "Beau logement"} ${cityLabel}.`);

                        if (surface && bedrooms) {
                            parts.push(`D'une superficie de ${surface} m² avec ${bedrooms} chambre${parseInt(bedrooms) > 1 ? "s" : ""}, ce bien offre un espace de vie confortable et fonctionnel.`);
                        } else if (surface) {
                            parts.push(`D'une superficie de ${surface} m², ce ${typeLabel} offre un espace de vie confortable.`);
                        } else if (bedrooms) {
                            parts.push(`Avec ses ${bedrooms} chambre${parseInt(bedrooms) > 1 ? "s" : ""}, ce ${typeLabel} est idéal pour une famille ou des colocataires.`);
                        }

                        if (price) {
                            const priceNum = parseInt(price.replace(/\D/g, ""));
                            if (priceNum > 0) {
                                const formatted = priceNum.toLocaleString("fr-FR");
                                parts.push(`Loyer mensuel : ${formatted} FCFA.`);
                            }
                        }

                        parts.push(`Situé dans un quartier prisé ${cityLabel}, ce bien bénéficie d'une localisation stratégique, à proximité des commodités essentielles (commerces, transports, écoles).`);
                        parts.push(`Contactez-nous pour organiser une visite ou obtenir plus d'informations sur ce logement.`);

                        return parts.join(" ");
                    })(),
                    virtual_tour_url: "",
                    contact_phone: user?.user_metadata?.phone || user?.phone || "",
                    images: uploadedUrl ? [uploadedUrl] : ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop"], // must have min 1 image

                    lat: coordinates.lat,
                    lon: coordinates.lng,
                    location: {
                        city: city || "Non spécifiée",
                        district: city || "Général",
                        region: "",
                        address: city || "Non spécifiée",
                        landmark: "",
                        coords: {
                            lat: coordinates.lat,
                            lng: coordinates.lng
                        }
                    }
                });

                if (result?.error) {
                    throw new Error(result.error);
                }

                toast.success("Bien soumis ! En attente de validation.");
                router.push("/compte/mes-biens?success=true");

            } catch (error) {
                console.error("Traitement magique échoué:", error);
                toast.error("Nous avons besoin de quelques infos de plus pour finaliser l'annonce.");
                // Redirecting to deposer form as fallback
                router.push("/compte/deposer");
            }
        };

        processDraft();

    }, [user, loading, router]);


    const handleSavePhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneInput || phoneInput.length < 8) {
            toast.error("Veuillez saisir un numéro de téléphone valide.");
            return;
        }

        setIsSavingPhone(true);
        const supabase = createClient();
        try {
            // Update Auth Metadata
            await supabase.auth.updateUser({
                data: { phone: phoneInput }
            });

            // Update Profiles Table directly just in case triggers missed it
            if (user?.id) {
                await supabase.from("profiles").update({ phone: phoneInput }).eq("id", user.id);
            }

            toast.success("Numéro enregistré. Publication en cours...");
            // Refresh session so the updated metadata is in the local JWT before reload
            await supabase.auth.refreshSession();
            window.location.reload();
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de l'enregistrement du numéro.");
            setIsSavingPhone(false);
        }
    };

    if (needsPhone) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#121212] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4C430]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-[#F4C430]/20 rounded-2xl flex items-center justify-center border border-[#F4C430]/30 shrink-0">
                            <Phone className="w-7 h-7 text-[#F4C430]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Dernière étape...</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">
                        Puisque vous vous êtes connecté via Google, nous avons besoin de votre numéro de téléphone pour que les futurs clients puissent vous contacter.
                    </p>

                    <form onSubmit={handleSavePhone} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Numéro de téléphone</label>
                            <Input
                                type="tel"
                                placeholder="Ex: +221 77 123 45 67"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                className="bg-black border-white/10 h-12 text-white text-lg placeholder:text-slate-600 focus-visible:ring-[#F4C430]/50"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSavingPhone}
                            className="w-full h-12 bg-[#F4C430] hover:bg-[#F4C430]/90 text-black font-bold text-base rounded-xl transition-all shine-effect"
                        >
                            {isSavingPhone ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer et publier"}
                            {!isSavingPhone && <ArrowRight className="w-5 h-5 ml-2" />}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 bg-[#F4C430]/20 rounded-full animate-ping delay-75" />
                <div className="relative z-10 w-full h-full bg-[#121212] flex items-center justify-center rounded-full border border-[#F4C430]/30 shadow-[0_0_30px_rgba(244,196,48,0.2)]">
                    <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
                </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
                Un instant magique... 🪄
            </h1>
            <p className="text-slate-400 text-lg text-center max-w-sm">
                {status}
            </p>
        </div>
    );
}
