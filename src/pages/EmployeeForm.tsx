import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function EmployeeForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id && id !== 'new';

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        photoPreview: '' as string | null
    });
    // const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchEmployee();
        }
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    role: data.role,
                    phone: data.phone,
                    photoPreview: data.photo
                });
            }
        } catch (error) {
            console.error('Error loading employee:', error);
            alert('Erro ao carregar funcionário.');
        }
    };

    useEffect(() => {
        if (isCameraOpen && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Não foi possível acessar a câmera.");
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
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setFormData(prev => ({ ...prev, photoPreview: dataUrl }));
            stopCamera();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoPreview: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setFormData(prev => ({ ...prev, photoPreview: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // setLoading(true);

        const payload = {
            name: formData.name,
            role: formData.role,
            phone: formData.phone,
            photo: formData.photoPreview,
            active: true
        };

        try {
            let error;
            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('employees')
                    .update(payload)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('employees')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;
            navigate('/');
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Erro ao salvar funcionário. Verifique o console.');
        } finally {
            // setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEditing ? 'Atualize os dados do funcionário' : 'Cadastre um novo membro da equipe'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados do Funcionário</CardTitle>
                            <CardDescription>Informações básicas e foto de identificação.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium mb-2 block">Nome Completo</label>
                                    <Input name="name" placeholder="Ex: Maria da Silva" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Cargo / Função</label>
                                    <Input name="role" placeholder="Ex: Cozinheira" value={formData.role} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Telefone</label>
                                    <Input name="phone" placeholder="(11) 99999-9999" value={formData.phone} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Photo Upload & Camera */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Foto do Funcionário</label>

                                {!formData.photoPreview && !isCameraOpen ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Upload Box */}
                                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer relative h-40">
                                            <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-xs font-medium">Enviar Foto</p>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handlePhotoChange}
                                            />
                                        </div>

                                        {/* Camera Box */}
                                        <div
                                            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer relative h-40"
                                            onClick={startCamera}
                                        >
                                            <Camera className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-xs font-medium">Tirar Foto Agora</p>
                                        </div>
                                    </div>
                                ) : isCameraOpen ? (
                                    <div className="relative rounded-lg overflow-hidden border bg-black">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover"></video>
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                            <Button variant="secondary" onClick={stopCamera} type="button">Cancelar</Button>
                                            <Button onClick={capturePhoto} type="button" className="bg-white text-black hover:bg-gray-200">
                                                <Camera className="mr-2 h-4 w-4" /> Capturar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border w-full max-w-xs mx-auto">
                                        <img src={formData.photoPreview!} alt="Preview" className="w-full h-64 object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                            onClick={removePhoto}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/')}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Funcionário
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
