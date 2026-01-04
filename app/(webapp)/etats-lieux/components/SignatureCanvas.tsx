'use client';

import { useRef, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignatureCanvasProps {
    onSave: (signatureData: string) => void;
    existingSignature?: string;
    label: string;
}

export function SignatureCanvas({ onSave, existingSignature, label }: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        // Style - Black for PDF readability
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Load existing signature if present
        if (existingSignature) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Calculate dimensions to fit image without stretching (contain)
                const imgRatio = img.width / img.height;
                const canvasRatio = rect.width / rect.height;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (imgRatio > canvasRatio) {
                    // Image is wider - fit to width
                    drawWidth = rect.width;
                    drawHeight = rect.width / imgRatio;
                    offsetX = 0;
                    offsetY = (rect.height - drawHeight) / 2;
                } else {
                    // Image is taller - fit to height
                    drawHeight = rect.height;
                    drawWidth = rect.height * imgRatio;
                    offsetX = (rect.width - drawWidth) / 2;
                    offsetY = 0;
                }

                // Clear canvas first with white/transparent background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, rect.width, rect.height);

                // Draw image centered and maintaining aspect ratio
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                setHasDrawn(true);
            };
            img.src = existingSignature;
        }
    }, [existingSignature]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        if (isDrawing && hasDrawn) {
            saveSignature();
        }
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        setHasDrawn(false);
        onSave('');
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                {hasDrawn && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCanvas}
                        className="text-slate-400 hover:text-red-400 h-7 px-2"
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Effacer
                    </Button>
                )}
            </div>
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-32 bg-slate-800 rounded-lg border border-slate-700 cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-slate-500 text-sm">Signez ici</p>
                    </div>
                )}
            </div>
        </div>
    );
}
