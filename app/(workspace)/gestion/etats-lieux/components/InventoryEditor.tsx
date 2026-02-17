'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Check, ChevronDown, ChevronUp, Camera, Trash2, Plus, Loader2, Zap, Droplets, Flame, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getInventoryReportById, updateInventoryReport, uploadInventoryPhoto } from '../actions';
import { type Room, type RoomItem, type MeterReadings } from '../types';
import { useTheme } from "@/components/theme-provider";

const CONDITION_OPTIONS = [
    { value: 'bon', label: 'Bon', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50' },
    { value: 'moyen', label: 'Moyen', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50' },
    { value: 'mauvais', label: 'Mauvais', color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50' },
    { value: 'absent', label: 'Absent', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/50' },
];

interface InventoryEditorProps {
    reportId: string;
}

export function InventoryEditor({ reportId }: InventoryEditorProps) {
    const { isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [report, setReport] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ roomIndex: number, itemIndex: number } | null>(null);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [meterReadings, setMeterReadings] = useState<MeterReadings>({});
    const [generalComments, setGeneralComments] = useState('');
    const [expandedRoom, setExpandedRoom] = useState<number | null>(0);

    useEffect(() => {
        loadReport();
    }, [reportId]);

    const loadReport = async () => {
        const result = await getInventoryReportById(reportId);
        if (result.error) {
            toast.error(result.error);
            router.push('/etats-lieux');
            return;
        }

        setReport(result.data);
        setRooms(result.data?.rooms || []);
        setMeterReadings(result.data?.meter_readings || {});
        setGeneralComments(result.data?.general_comments || '');
        setLoading(false);
    };

    const handleSave = async (markComplete = false) => {
        setSaving(true);

        const result = await updateInventoryReport(reportId, {
            rooms,
            meter_readings: meterReadings,
            general_comments: generalComments,
            status: markComplete ? 'completed' : 'draft'
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(markComplete ? 'État des lieux complété !' : 'Enregistré');
            if (markComplete) {
                router.push('/etats-lieux');
            }
        }

        setSaving(false);
    };

    const handlePhotoClick = (roomIndex: number, itemIndex: number) => {
        setUploadTarget({ roomIndex, itemIndex });
        fileInputRef.current?.click();
    };

    const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        setUploadingPhoto(true);
        const { roomIndex, itemIndex } = uploadTarget;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadInventoryPhoto(file, reportId);

            if (result.error || !result.url) {
                toast.error(result.error || "Erreur upload");
            } else {
                const newRooms = [...rooms];
                const currentPhotos = newRooms[roomIndex].items[itemIndex].photos || [];
                newRooms[roomIndex].items[itemIndex].photos = [...currentPhotos, result.url];
                setRooms(newRooms);
                toast.success("Photo ajoutée");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur technique lors de l'upload");
        } finally {
            setUploadingPhoto(false);
            setUploadTarget(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removePhoto = (roomIndex: number, itemIndex: number, photoIndex: number) => {
        const newRooms = [...rooms];
        const photos = [...(newRooms[roomIndex].items[itemIndex].photos || [])];
        photos.splice(photoIndex, 1);
        newRooms[roomIndex].items[itemIndex].photos = photos;
        setRooms(newRooms);
    };

    const updateItemCondition = (roomIndex: number, itemIndex: number, condition: string) => {
        const newRooms = [...rooms];
        newRooms[roomIndex].items[itemIndex].condition = condition as RoomItem['condition'];
        setRooms(newRooms);
    };

    const updateItemComment = (roomIndex: number, itemIndex: number, comment: string) => {
        const newRooms = [...rooms];
        newRooms[roomIndex].items[itemIndex].comment = comment;
        setRooms(newRooms);
    };

    const addRoom = () => {
        const newRoom: Room = {
            name: `Pièce ${rooms.length + 1}`,
            items: [
                { name: 'Sol', condition: '', comment: '', photos: [] },
                { name: 'Murs', condition: '', comment: '', photos: [] },
                { name: 'Plafond', condition: '', comment: '', photos: [] },
            ]
        };
        setRooms([...rooms, newRoom]);
        setExpandedRoom(rooms.length);
    };

    const removeRoom = (roomIndex: number) => {
        const newRooms = rooms.filter((_, i) => i !== roomIndex);
        setRooms(newRooms);
        setExpandedRoom(null);
    };

    const addItemToRoom = (roomIndex: number) => {
        const newRooms = [...rooms];
        newRooms[roomIndex].items.push({
            name: 'Nouvel élément',
            condition: '',
            comment: '',
            photos: []
        });
        setRooms(newRooms);
    };

    const updateRoomName = (roomIndex: number, name: string) => {
        const newRooms = [...rooms];
        newRooms[roomIndex].name = name;
        setRooms(newRooms);
    };

    const updateItemName = (roomIndex: number, itemIndex: number, name: string) => {
        const newRooms = [...rooms];
        newRooms[roomIndex].items[itemIndex].name = name;
        setRooms(newRooms);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const completedItems = rooms.reduce((acc, room) =>
        acc + room.items.filter(item => item.condition).length, 0
    );
    const totalItems = rooms.reduce((acc, room) => acc + room.items.length, 0);
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/etats-lieux" className={`transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            État des lieux {report?.type === 'entry' ? "d'entrée" : 'de sortie'}
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                            {report?.lease?.property_address} • {report?.lease?.tenant_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* On-site Instructions */}
            <div className={`border rounded-xl p-4 ${isDark
                ? 'bg-primary/10 border-primary/30'
                : 'bg-muted border-border'
                }`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-primary' : 'text-foreground'}`}>
                    📋 Mode Contradictoire Recommandé
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    Ce constat doit être rempli <strong>sur place</strong> avec le locataire présent.
                    Visitez chaque pièce ensemble et convenez de l'état avant de noter.
                </p>
            </div>

            {/* Progress Bar */}
            <div className={`border rounded-xl p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Progression</span>
                    <span className={`text-sm font-medium ${isDark ? 'text-[#F4C430]' : 'text-slate-900'}`}>{progress}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                    <div
                        className={`h-full transition-all duration-300 ${isDark ? 'bg-[#F4C430]' : 'bg-slate-900'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{completedItems}/{totalItems} éléments évalués</p>
            </div>

            {/* Meter Readings */}
            <div className={`border rounded-xl p-4 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h2 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Relevés de compteurs</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className={`flex items-center gap-1 text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <Zap className="w-3 h-3" /> Électricité
                        </label>
                        <Input
                            type="number"
                            value={meterReadings.electricity || ''}
                            onChange={(e) => setMeterReadings({ ...meterReadings, electricity: parseInt(e.target.value) || undefined })}
                            placeholder="kWh"
                            className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 shadow-sm text-gray-900'}
                        />
                    </div>
                    <div>
                        <label className={`flex items-center gap-1 text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <Droplets className="w-3 h-3" /> Eau
                        </label>
                        <Input
                            type="number"
                            value={meterReadings.water || ''}
                            onChange={(e) => setMeterReadings({ ...meterReadings, water: parseInt(e.target.value) || undefined })}
                            placeholder="m³"
                            className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 shadow-sm text-gray-900'}
                        />
                    </div>
                    <div>
                        <label className={`flex items-center gap-1 text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <Flame className="w-3 h-3" /> Gaz
                        </label>
                        <Input
                            type="number"
                            value={meterReadings.gas || ''}
                            onChange={(e) => setMeterReadings({ ...meterReadings, gas: parseInt(e.target.value) || undefined })}
                            placeholder="m³"
                            className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 shadow-sm text-gray-900'}
                        />
                    </div>
                </div>
            </div>

            {/* Rooms */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Pièces</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={addRoom}
                        className={isDark ? "text-[#F4C430] hover:text-[#F4C430]" : "text-slate-900 hover:text-slate-700"}
                    >
                        <Plus className="w-4 h-4 mr-1" /> Ajouter
                    </Button>
                </div>

                {rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className={`border rounded-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                        {/* Room Header */}
                        <button
                            onClick={() => setExpandedRoom(expandedRoom === roomIndex ? null : roomIndex)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${isDark ? 'bg-[#F4C430]/20 text-[#F4C430]' : 'bg-slate-100 text-slate-900'}`}>
                                    {roomIndex + 1}
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{room.name}</p>
                                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {room.items.filter(i => i.condition).length}/{room.items.length} éléments
                                    </p>
                                </div>
                            </div>
                            {expandedRoom === roomIndex ? (
                                <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                            ) : (
                                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                            )}
                        </button>

                        {/* Room Content */}
                        {expandedRoom === roomIndex && (
                            <div className={`border-t p-4 space-y-4 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                                {/* Room Name Edit */}
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={room.name}
                                        onChange={(e) => updateRoomName(roomIndex, e.target.value)}
                                        className={`text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-400 shadow-sm text-gray-900'}`}
                                        placeholder="Nom de la pièce"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRoom(roomIndex)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Items */}
                                {room.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className={`rounded-lg p-3 space-y-2 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50 border border-gray-200'}`}>
                                        <Input
                                            value={item.name}
                                            onChange={(e) => updateItemName(roomIndex, itemIndex, e.target.value)}
                                            className={`border-none p-0 font-medium text-sm h-auto focus-visible:ring-0 ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'}`}
                                        />

                                        {/* Condition Buttons */}
                                        <div className="flex gap-1 items-center">
                                            {CONDITION_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => updateItemCondition(roomIndex, itemIndex, option.value)}
                                                    className={`px-2 py-1 rounded text-xs font-medium border transition-all ${item.condition === option.value
                                                        ? option.color
                                                        : isDark
                                                            ? 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500'
                                                            : 'bg-gray-200 text-gray-600 border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePhotoClick(roomIndex, itemIndex)}
                                                disabled={uploadingPhoto}
                                                className={`ml-1 p-1.5 rounded transition-all border ${(item.photos?.length || 0) > 0
                                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                                                    : isDark
                                                        ? 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white'
                                                        : 'bg-gray-200 text-gray-500 border-gray-300 hover:text-gray-700'
                                                    }`}
                                                title="Ajouter une photo"
                                            >
                                                {uploadingPhoto && uploadTarget?.roomIndex === roomIndex && uploadTarget?.itemIndex === itemIndex ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Camera className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Photos Preview */}
                                        {item.photos && item.photos.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto py-1">
                                                {item.photos.map((photo, pIndex) => (
                                                    <div key={pIndex} className="relative group shrink-0">
                                                        <img
                                                            src={photo}
                                                            alt="État"
                                                            className="h-12 w-12 object-cover rounded border border-slate-600"
                                                        />
                                                        <button
                                                            onClick={() => removePhoto(roomIndex, itemIndex, pIndex)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-2 h-2" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Comment */}
                                        <Input
                                            value={item.comment}
                                            onChange={(e) => updateItemComment(roomIndex, itemIndex, e.target.value)}
                                            placeholder="Commentaire (optionnel)"
                                            className={`text-xs h-8 ${isDark ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-white border-gray-400 shadow-sm text-gray-900'}`}
                                        />
                                    </div>
                                ))}

                                {/* Add Item */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addItemToRoom(roomIndex)}
                                    className={`w-full border border-dashed ${isDark ? 'text-slate-400 hover:text-white border-slate-700' : 'text-gray-500 hover:text-gray-700 border-gray-300'}`}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Ajouter un élément
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* General Comments */}
            <div className={`border rounded-xl p-4 space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h2 className={`font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Pen className={`w-4 h-4 ${isDark ? 'text-[#F4C430]' : 'text-slate-900'}`} />
                    Observations générales
                </h2>
                <Textarea
                    value={generalComments}
                    onChange={(e) => setGeneralComments(e.target.value)}
                    placeholder="Remarques générales sur l'état du logement..."
                    className={`min-h-[100px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-400 shadow-sm text-gray-900'}`}
                />
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 transform transition-all bg-transparent">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className={isDark ? 'flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white' : 'flex-1 border-gray-400 bg-white shadow-sm hover:bg-gray-50 text-gray-900'}
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Enregistrer
                    </Button>

                    {report?.status === 'completed' || report?.status === 'signed' ? (
                        <Button
                            asChild
                            className={`flex-1 ${isDark ? 'bg-[#F4C430] hover:bg-[#D4A420] text-black' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            <Link href={`/gestion/etats-lieux/${reportId}/sign`}>
                                <Check className="w-4 h-4 mr-2" />
                                Signatures
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saving || progress < 100}
                            className={`flex-1 ${isDark ? 'bg-[#F4C430] hover:bg-[#D4A420] text-black' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            {progress < 100 ? `Terminer (${progress}%)` : 'Terminer'}
                        </Button>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoFileChange}
            />
        </div>
    );
}
