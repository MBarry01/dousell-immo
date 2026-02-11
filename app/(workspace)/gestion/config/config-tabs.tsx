"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigForm } from "./config-form";
import { SubscriptionManager } from "@/components/gestion/SubscriptionManager";
import { ApiSettings } from "./api-settings";
import { User, CreditCard, Code } from "lucide-react";
import { toast } from "sonner";
import { ConfigTour } from '@/components/gestion/tours/ConfigTour';

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
            <ConfigTour />
            <TabsList id="tour-config-tabs" className="bg-slate-100 dark:bg-gray-900/40 p-1 rounded-2xl border border-slate-200 dark:border-gray-800 h-14 w-full md:w-auto overflow-x-auto">
                <TabsTrigger
                    value="branding"
                    className="flex items-center gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white data-[state=active]:hover:bg-primary/90 data-[state=active]:hover:text-primary-foreground"
                >
                    <User className="w-4 h-4" />
                    Profil & Branding
                </TabsTrigger>
                <TabsTrigger
                    id="tour-config-subscription"
                    value="subscription"
                    className="flex items-center gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white data-[state=active]:hover:bg-primary/90 data-[state=active]:hover:text-primary-foreground"
                >
                    <CreditCard className="w-4 h-4" />
                    Abonnement
                </TabsTrigger>
                <TabsTrigger
                    id="tour-config-api"
                    value="api"
                    className="flex items-center gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white data-[state=active]:hover:bg-primary/90 data-[state=active]:hover:text-primary-foreground"
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
