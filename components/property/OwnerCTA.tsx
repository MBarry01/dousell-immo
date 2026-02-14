"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface OwnerCTAProps {
    city: string;
    variant?: "banner" | "card";
}

export function OwnerCTA({ city, variant = "banner" }: OwnerCTAProps) {
    const formattedCity = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (variant === "card") {
        return (
            <div className="relative overflow-hidden rounded-2xl h-full min-h-[380px] flex flex-col justify-center text-center p-6 shadow-xl transform transition-all hover:scale-[1.02] border border-primary/20 bg-gradient-to-br from-background to-muted/20 group">
                {/* Premium Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/20 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px]"></div>

                <div className="relative z-10 flex flex-col items-center gap-6 pt-8">
                    {/* Icon Removed as requested */}

                    <div>
                        <h3 className="text-xl font-bold mb-3 text-foreground">
                            Propriétaire à <span className="text-primary">{formattedCity}</span> ?
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-[200px] mx-auto">
                            Rejoignez l&apos;élite des propriétaires. Publiez gratuitement et louez en 48h.
                        </p>
                    </div>

                    <Button
                        asChild
                        size="default"
                        className="font-bold w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        <Link href="/compte/deposer">
                            Publier mon bien
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="my-12 relative overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            {/* Background Pattern Elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8 text-center md:text-left">
                <div className="max-w-2xl">
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                        Vous êtes propriétaire à {formattedCity} ?
                    </h3>
                    <p className="text-primary-foreground/90 text-lg leading-relaxed">
                        Publiez votre annonce gratuitement et trouvez un locataire fiable ou un acheteur sérieux en moins de 48h.
                        Rejoignez les centaines de propriétaires qui nous font confiance.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <Button
                        asChild
                        size="lg"
                        variant="secondary"
                        className="font-bold text-base px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
                    >
                        <Link href="/publier-annonce">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Publier mon bien à {formattedCity}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
