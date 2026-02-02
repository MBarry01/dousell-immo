import React, { ReactNode } from 'react';

interface InfoBoxProps {
    type: 'info' | 'warning' | 'danger' | 'success';
    icon?: string;
    title?: string;
    message: ReactNode;
}

export function InfoBox({ type, icon, title, message }: InfoBoxProps) {
    const bgColor = {
        info: 'bg-blue-500/10 border-blue-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        danger: 'bg-red-500/10 border-red-500/20',
        success: 'bg-green-500/10 border-green-500/20',
    }[type];

    const textColor = {
        info: 'text-blue-300',
        warning: 'text-yellow-300',
        danger: 'text-red-300',
        success: 'text-green-300',
    }[type];

    return (
        <div className={`border ${bgColor} rounded-xl p-5 ${textColor} backdrop-blur-sm`}>
            <div className="flex items-start gap-4">
                {icon && <span className="text-2xl shrink-0 drop-shadow-sm">{icon}</span>}
                <div className="space-y-1">
                    {title && <h3 className="font-bold text-base tracking-tight">{title}</h3>}
                    <div className="text-sm opacity-90 leading-relaxed font-medium">{message}</div>
                </div>
            </div>
        </div>
    );
}
