'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useTheme } from "@/components/theme-provider";
import { Users, TrendingUp } from 'lucide-react';

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
            <div className={`flex items-center gap-1 p-1 rounded-lg mb-6 w-fit ${isDark ? 'bg-slate-900/80' : 'bg-gray-100'
                }`}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                                transition-all duration-200
                                ${isActive
                                    ? isDark
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'bg-white text-gray-900 shadow-sm'
                                    : isDark
                                        ? 'text-slate-400 hover:text-slate-200'
                                        : 'text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>{content[activeTab]}</div>
        </div>
    );
}
