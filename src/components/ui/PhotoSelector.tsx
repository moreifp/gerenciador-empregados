import { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

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

    // Show selection options
    if (showOptions && !disabled) {
        return (
            <div className="space-y-3">
                <div className="text-center">
                    <p className="text-sm font-medium mb-3">Escolha como adicionar a foto:</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Upload from Gallery */}
                    <div
                        className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer relative h-40"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-xs font-medium">Escolher da Galeria</p>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Take Photo with Camera */}
                    <div
                        className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer relative h-40"
                        onClick={startCamera}
                    >
                        <Camera className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-xs font-medium">Tirar Foto Agora</p>
                    </div>
                </div>
                <div className="text-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOptions(false)}
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        );
    }

    // Initial state - show "Add Photo" button
    return (
        <div
            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer relative h-48 bg-muted/10"
            onClick={() => !disabled && setShowOptions(true)}
        >
            <ImageIcon className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">Adicionar Foto</p>
            <p className="text-xs text-muted-foreground mt-1 text-center">
                Clique para escolher da galeria ou tirar uma foto
            </p>
        </div>
    );
}
