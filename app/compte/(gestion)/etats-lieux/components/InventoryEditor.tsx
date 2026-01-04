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

const CONDITION_OPTIONS = [
    { value: 'bon', label: 'Bon', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500' },
    { value: 'moyen', label: 'Moyen', color: 'bg-amber-500/20 text-amber-400 border-amber-500' },
    { value: 'mauvais', label: 'Mauvais', color: 'bg-red-500/20 text-red-400 border-red-500' },
    { value: 'absent', label: 'Absent', color: 'bg-slate-500/20 text-slate-400 border-slate-500' },
];

interface InventoryEditorProps {
    reportId: string;
}

export function InventoryEditor({ reportId }: InventoryEditorProps) {
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
            router.push('/compte/etats-lieux');
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
                router.push('/compte/etats-lieux');
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
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
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
                    <Link href="/compte/etats-lieux" className="text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-white">
                            État des lieux {report?.type === 'entry' ? "d'entrée" : 'de sortie'}
                        </h1>
                        <p className="text-sm text-white/60">
                            {report?.lease?.property_address} • {report?.lease?.tenant_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* On-site Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-sm text-blue-400 font-medium mb-1">
                    📋 Mode Contradictoire Recommandé
                </p>
                <p className="text-xs text-blue-300/80">
                    Ce constat doit être rempli <strong>sur place</strong> avec le locataire présent.
                    Visitez chaque pièce ensemble et convenez de l'état avant de noter.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Progression</span>
                    <span className="text-sm text-[#F4C430] font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#F4C430] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-slate-500 mt-2">{completedItems}/{totalItems} éléments évalués</p>
            </div>

            {/* Meter Readings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <h2 className="text-white font-medium">Relevés de compteurs</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                            <Zap className="w-3 h-3" /> Électricité
                        </label>
                        <Input
                            type="number"
                            value={meterReadings.electricity || ''}
                            onChange={(e) => setMeterReadings({ ...meterReadings, electricity: parseInt(e.target.value) || undefined })}
                            placeholder="kWh"
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                            <Droplets className="w-3 h-3" /> Eau
                        </label>
                        <Input
                            type="number"
                            value={meterReadings.water || ''}
                            onChange={(e) => setMeterReadings({ ...meterReadings, water: parseInt(e.target.value) || undefined })}
                            placeholder="m³"
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                            <Flame className="w-3 h-3" /> Gaz
                        </label>
                        <Input
                            type="number"
                            value={meterReadings.gas || ''}
                            onChange={(e) => setMeterReadings({ ...meterReadings, gas: parseInt(e.target.value) || undefined })}
                            placeholder="m³"
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Rooms */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-medium">Pièces</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={addRoom}
                        className="text-[#F4C430] hover:text-[#F4C430]"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Ajouter
                    </Button>
                </div>

                {rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        {/* Room Header */}
                        <button
                            onClick={() => setExpandedRoom(expandedRoom === roomIndex ? null : roomIndex)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#F4C430]/20 rounded-lg flex items-center justify-center text-[#F4C430] text-sm font-medium">
                                    {roomIndex + 1}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{room.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {room.items.filter(i => i.condition).length}/{room.items.length} éléments
                                    </p>
                                </div>
                            </div>
                            {expandedRoom === roomIndex ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </button>

                        {/* Room Content */}
                        {expandedRoom === roomIndex && (
                            <div className="border-t border-slate-800 p-4 space-y-4">
                                {/* Room Name Edit */}
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={room.name}
                                        onChange={(e) => updateRoomName(roomIndex, e.target.value)}
                                        className="bg-slate-800 border-slate-700 text-sm"
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
                                    <div key={itemIndex} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                        <Input
                                            value={item.name}
                                            onChange={(e) => updateItemName(roomIndex, itemIndex, e.target.value)}
                                            className="bg-transparent border-none p-0 text-white font-medium text-sm h-auto focus-visible:ring-0"
                                        />

                                        {/* Condition Buttons */}
                                        <div className="flex gap-1 items-center">
                                            {CONDITION_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => updateItemCondition(roomIndex, itemIndex, option.value)}
                                                    className={`px-2 py-1 rounded text-xs font-medium border transition-all ${item.condition === option.value
                                                        ? option.color
                                                        : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500'
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
                                                    : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white'
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
                                            className="bg-slate-700/50 border-slate-600 text-xs h-8"
                                        />
                                    </div>
                                ))}

                                {/* Add Item */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addItemToRoom(roomIndex)}
                                    className="w-full text-slate-400 hover:text-white border border-dashed border-slate-700"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Ajouter un élément
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* General Comments */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h2 className="text-white font-medium flex items-center gap-2">
                    <Pen className="w-4 h-4 text-[#F4C430]" />
                    Observations générales
                </h2>
                <Textarea
                    value={generalComments}
                    onChange={(e) => setGeneralComments(e.target.value)}
                    placeholder="Remarques générales sur l'état du logement..."
                    className="bg-slate-800 border-slate-700 min-h-[100px]"
                />
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="flex-1 border-slate-700"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Enregistrer
                    </Button>

                    {report?.status === 'completed' || report?.status === 'signed' ? (
                        <Button
                            asChild
                            className="flex-1 bg-[#F4C430] hover:bg-[#D4A420] text-black"
                        >
                            <Link href={`/compte/etats-lieux/${reportId}/sign`}>
                                <Check className="w-4 h-4 mr-2" />
                                Signatures
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saving || progress < 100}
                            className="flex-1 bg-[#F4C430] hover:bg-[#D4A420] text-black"
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
