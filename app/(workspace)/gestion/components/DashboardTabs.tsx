'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useTheme } from "@/components/theme-provider";
import { Users, TrendingUp } from 'lucide-react';
import { cn } from "@/lib/utils";

type TabId = 'overview' | 'performance';

interface Tab {
    id: TabId;
    label: string;
    icon: typeof Users;
}

const tabs: Tab[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
];

interface DashboardTabsProps {
    overviewContent: ReactNode;
    performanceContent: ReactNode;
}

export function DashboardTabs({
    overviewContent,
    performanceContent,
}: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const { isDark } = useTheme();

    const content: Record<TabId, ReactNode> = {
        overview: overviewContent,
        performance: performanceContent,
    };

    // Reset to overview tab whenever component mounts/remounts
    useEffect(() => {
        setActiveTab('overview');
    }, []);

    // Support for programmatic tab switching (e.g., from the tour)
    useEffect(() => {
        const handleSwitchTab = (event: any) => {
            const detail = event.detail;
            if (detail && (detail === 'overview' || detail === 'performance')) {
                setActiveTab(detail as TabId);
            }
        };

        window.addEventListener('dousell-tour-switch-tab', handleSwitchTab);
        return () => window.removeEventListener('dousell-tour-switch-tab', handleSwitchTab);
    }, []);

    return (
        <div>
            {/* Tab Navigation */}
            <div className={`flex items-center gap-1 p-1 rounded-xl mb-6 w-fit no-select border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-gray-100 border-gray-200'
                }`}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 h-9 sm:h-11 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em]
                                transition-all duration-300 active:scale-95
                                ${isActive
                                    ? isDark
                                        ? 'bg-slate-700 text-white shadow-lg'
                                        : 'bg-white text-slate-900 shadow-sm border border-gray-200/50'
                                    : isDark
                                        ? 'text-slate-500 hover:text-slate-200'
                                        : 'text-slate-600 hover:text-slate-900'
                                }
                            `}
                        >
                            <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white dark:text-white" : "text-slate-400")} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>{content[activeTab]}</div>
        </div>
    );
}
