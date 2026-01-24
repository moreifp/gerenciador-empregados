import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Mic, Square, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskType } from '@/types';
// import { initialEmployees } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

export default function TaskForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const preAssignedEmployeeId = searchParams.get('employeeId');
    const isEditing = !!id;

    // Recognition State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Camera State
    const [isCameraOpen] = useState(false);
    // const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: preAssignedEmployeeId || '',
        type: 'routine' as TaskType,
        dueDate: new Date().toISOString().split('T')[0], // Default to today
        recurrenceType: 'none',
        recurrenceDay: new Date().getDay(),
        photoPreview: '' as string | null
    });

    const [employees, setEmployees] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchEmployees = async () => {
            const { data } = await supabase.from('employees').select('id, name').eq('active', true);
            if (data) setEmployees(data);
        };
        fetchEmployees();

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'pt-BR';

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    const cleanText = finalTranscript.trim();
                    setFormData(prev => ({
                        ...prev,
                        description: (prev.description + ' ' + cleanText).trim()
                    }));
                }
            };
        }
    }, []);

    useEffect(() => {
        if (isCameraOpen && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

        // Auto-generate title if empty from description
        const finalTitle = formData.title || (formData.description.length > 50
            ? formData.description.substring(0, 50) + '...'
            : formData.description) || 'Nova Tarefa';

        const payload = {
            title: finalTitle,
            description: formData.description,
            assigned_to: formData.assignedTo,
            type: formData.type,
            due_date: formData.dueDate,
            recurrence_type: formData.recurrenceType,
            recurrence_day: formData.recurrenceDay,
            status: 'pending'
            // reference_photo: formData.photoPreview // TODO: Add to schema if needed
        };

        try {
            const { error } = await supabase.from('tasks').insert([payload]);
            if (error) throw error;
            navigate('/tasks');
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Erro ao salvar tarefa.');
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
                    </h2>
                    <p className="text-muted-foreground">
                        Preencha os detalhes abaixo
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Main Content */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>O que precisa ser feito?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Description & Audio */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium">Descrição / Instruções</label>
                                <Button
                                    type="button"
                                    variant={isRecording ? "destructive" : "secondary"}
                                    size="sm"
                                    onClick={toggleRecording}
                                    className="flex items-center gap-2 animate-in fade-in"
                                >
                                    {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                                    {isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
                                </Button>
                            </div>
                            <div className="relative">
                                <textarea
                                    name="description"
                                    className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isRecording ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    placeholder={isRecording ? "Ouvindo... vá falando..." : "Descreva os detalhes ou use o microfone para ditar..."}
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                                {isRecording && (
                                    <span className="absolute bottom-2 right-2 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Photo Upload */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Foto de Referência</label>

                            {!formData.photoPreview ? (
                                <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer relative">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm">Clique para adicionar uma foto</p>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden border">
                                    <img src={formData.photoPreview} alt="Preview" className="w-full h-64 object-cover" />
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

                {/* Details Side-by-Side */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Responsável</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <label className="text-sm font-medium mb-2 block">Quem fará essa tarefa?</label>
                            <select
                                name="assignedTo"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione um funcionário</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Agendamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data de Início</label>
                                <Input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Repetição</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.recurrenceType}
                                    onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as any })}
                                >
                                    <option value="none">Não repete (Apenas uma vez)</option>
                                    <option value="daily">Diário (Todo dia)</option>
                                    <option value="weekly">Semanal (Toda semana)</option>
                                    <option value="monthly">Mensal (Todo mês)</option>
                                </select>
                            </div>

                            {formData.recurrenceType === 'weekly' && (
                                <div className="space-y-2 pt-2 border-t">
                                    <label className="text-sm font-medium block text-center">Dia da Semana</label>
                                    <div className="flex gap-1 justify-center">
                                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, recurrenceDay: index })}
                                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${formData.recurrenceDay === index
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-transparent hover:bg-secondary'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Toda {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][formData.recurrenceDay || 0]}
                                    </p>
                                </div>
                            )}

                            {formData.recurrenceType === 'monthly' && (
                                <div className="space-y-2 pt-2 border-t">
                                    <label className="text-sm font-medium">Dia do Mês</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.recurrenceDay || 1}
                                        onChange={(e) => setFormData({ ...formData, recurrenceDay: parseInt(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Todo dia {formData.recurrenceDay || 1}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => navigate('/tasks')}>
                        Cancelar
                    </Button>
                    <Button type="submit" size="lg" className="px-8">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Tarefa
                    </Button>
                </div>
            </form >
        </div >
    );
}
