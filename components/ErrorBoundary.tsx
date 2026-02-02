'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorBoundary({ message = "Une erreur est survenue", onRetry }: ErrorBoundaryProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-black border border-red-500/20 rounded-xl space-y-4 text-center">
            <div className="p-4 rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle size={48} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Oups !</h3>
                <p className="text-gray-400 max-w-md mx-auto">{message}</p>
            </div>
            {onRetry && (
                <Button
                    variant="outline"
                    onClick={onRetry}
                    className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réessayer
                </Button>
            )}
        </div>
    );
}
