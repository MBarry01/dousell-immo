"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigForm } from "./config-form";
import { SubscriptionManager } from "@/components/gestion/SubscriptionManager";
import { ApiSettings } from "./api-settings";
import { User, CreditCard, Code } from "lucide-react";
import { toast } from "sonner";


interface ConfigTabsProps {
    brandingData: any;
}

export function ConfigTabs({ brandingData }: ConfigTabsProps) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const checkoutResult = searchParams.get("checkout");

    const [activeTab, setActiveTab] = useState(tabParam === "subscription" ? "subscription" : tabParam === "api" ? "api" : "branding");

    // Show checkout feedback toast
    useEffect(() => {
        if (checkoutResult === "success") {
            toast.success("Paiement réussi ! Votre abonnement est maintenant actif.", { duration: 6000 });
        } else if (checkoutResult === "canceled") {
            toast.info("Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.", { duration: 5000 });
        }
    }, [checkoutResult]);

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">

            <TabsList id="tour-config-tabs" className="h-14 w-full md:w-auto overflow-x-auto rounded-xl">
                <TabsTrigger
                    value="branding"
                    className="flex items-center gap-2 px-6 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all hover:scale-[1.02]"
                >
                    <User className="w-4 h-4" />
                    Profil & Branding
                </TabsTrigger>
                <TabsTrigger
                    id="tour-config-subscription"
                    value="subscription"
                    className="flex items-center gap-2 px-6 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all hover:scale-[1.02]"
                >
                    <CreditCard className="w-4 h-4" />
                    Abonnement
                </TabsTrigger>
                <TabsTrigger
                    id="tour-config-api"
                    value="api"
                    className="flex items-center gap-2 px-6 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all hover:scale-[1.02]"
                >
                    <Code className="w-4 h-4" />
                    API & Intégrations
                </TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="mt-0 focus-visible:ring-0">
                <ConfigForm initialData={brandingData} />
            </TabsContent>

            <TabsContent value="subscription" className="mt-0 focus-visible:ring-0">
                <SubscriptionManager />
            </TabsContent>

            <TabsContent value="api" className="mt-0 focus-visible:ring-0">
                <ApiSettings profile={brandingData} />
            </TabsContent>
        </Tabs>
    );
}
