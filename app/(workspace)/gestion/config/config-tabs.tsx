"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigForm } from "./config-form";
import { SubscriptionManager } from "@/components/gestion/SubscriptionManager";
import { ApiSettings } from "./api-settings";
import { User, CreditCard, Code } from "lucide-react";

interface ConfigTabsProps {
    brandingData: any;
}

export function ConfigTabs({ brandingData }: ConfigTabsProps) {
    return (
        <Tabs defaultValue="branding" className="space-y-8">
            <TabsList className="bg-slate-100 dark:bg-gray-900/40 p-1 rounded-2xl border border-slate-200 dark:border-gray-800 h-14 w-full md:w-auto overflow-x-auto">
                <TabsTrigger
                    value="branding"
                    className="flex items-center gap-2 px-6 rounded-xl data-[state=active]:bg-[#F4C430] data-[state=active]:text-black h-full transition-all hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white data-[state=active]:hover:bg-[#F4C430] data-[state=active]:hover:text-black"
                >
                    <User className="w-4 h-4" />
                    Profil & Branding
                </TabsTrigger>
                <TabsTrigger
                    value="subscription"
                    className="flex items-center gap-2 px-6 rounded-xl data-[state=active]:bg-[#F4C430] data-[state=active]:text-black h-full transition-all hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white data-[state=active]:hover:bg-[#F4C430] data-[state=active]:hover:text-black"
                >
                    <CreditCard className="w-4 h-4" />
                    Abonnement
                </TabsTrigger>
                <TabsTrigger
                    value="api"
                    className="flex items-center gap-2 px-6 rounded-xl data-[state=active]:bg-[#F4C430] data-[state=active]:text-black h-full transition-all hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white data-[state=active]:hover:bg-[#F4C430] data-[state=active]:hover:text-black"
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
