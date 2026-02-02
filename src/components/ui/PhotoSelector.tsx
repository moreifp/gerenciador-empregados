import { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './button';

interface PhotoSelectorProps {
    photoPreview: string | null;
    onPhotoChange: (photoData: string | null) => void;
    disabled?: boolean;
}

export function PhotoSelector({ photoPreview, onPhotoChange, disabled = false }: PhotoSelectorProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCameraOpen && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onPhotoChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        setShowOptions(false);
    };

    const openGallery = () => {
        fileInputRef.current?.click();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            streamRef.current = stream;
            setIsCameraOpen(true);
            setShowOptions(false);
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Não foi possível acessar a câmera.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const photoData = canvas.toDataURL('image/jpeg');
                onPhotoChange(photoData);
                stopCamera();
            }
        }
    };

    const removePhoto = () => {
        onPhotoChange(null);
        setIsCameraOpen(false);
        setShowOptions(false);
    };

    // If camera is open, show camera view
    if (isCameraOpen) {
        return (
            <div className="relative rounded-lg overflow-hidden border bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover"></video>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button variant="secondary" onClick={stopCamera} type="button">
                        Cancelar
                    </Button>
                    <Button onClick={capturePhoto} type="button" className="bg-white text-black hover:bg-gray-200">
                        <Camera className="mr-2 h-4 w-4" /> Capturar
                    </Button>
                </div>
            </div>
        );
    }

    // If photo is already selected, show preview with remove button
    if (photoPreview) {
        return (
            <div className="relative rounded-lg overflow-hidden border w-full max-w-xs mx-auto">
                <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                {!disabled && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={removePhoto}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    // Show selection options modal
    if (showOptions && !disabled) {
        return (
            <div className="space-y-4 p-4 border-2 rounded-lg bg-background">
                <div className="text-center">
                    <p className="text-sm font-semibold mb-4">Como deseja adicionar a foto?</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {/* Camera Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={startCamera}
                        className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-accent"
                    >
                        <Camera className="h-6 w-6" />
                        <span className="text-sm font-medium">Tirar Foto Agora</span>
                    </Button>

                    {/* Gallery Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={openGallery}
                        className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-accent"
                    >
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-sm font-medium">Escolher da Galeria</span>
                    </Button>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
                <div className="text-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOptions(false)}
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        );
    }

    // Initial state - show single \"Add Photo\" button
    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => !disabled && setShowOptions(true)}
            disabled={disabled}
            className="w-full h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:bg-accent/50 transition-colors"
        >
            <ImageIcon className="h-10 w-10 opacity-50" />
            <div className="flex flex-col items-center">
                <span className="font-semibold">Adicionar Foto</span>
                <span className="text-xs text-muted-foreground mt-1">
                    Toque para escolher
                </span>
            </div>
        </Button>
    );
}
