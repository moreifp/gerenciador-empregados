import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Mic, Square, Image as ImageIcon, X, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskType } from '@/types';
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
    const [isCameraOpen, setIsCameraOpen] = useState(false);
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

    const [employees, setEmployees] = useState<{ id: string, name: string, photo?: string, role?: string }[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set(preAssignedEmployeeId ? [preAssignedEmployeeId] : []));
    const [selectionMode, setSelectionMode] = useState<'single' | 'multiple' | 'all'>('single');

    useEffect(() => {
        const fetchEmployees = async () => {
            const { data } = await supabase.from('employees').select('id, name, photo, role').eq('active', true).order('name');
            if (data) setEmployees(data);
        };
        fetchEmployees();

        // Load task if editing
        if (isEditing && id) {
            fetchTask();
        }

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

        // Cleanup on unmount
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [id, isEditing]);

    const fetchTask = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    assignedTo: data.assigned_to || '',
                    type: data.type || 'routine',
                    dueDate: data.due_date || new Date().toISOString().split('T')[0],
                    recurrenceType: data.recurrence_type || 'none',
                    recurrenceDay: data.recurrence_day || new Date().getDay(),
                    photoPreview: null // Tasks don't have reference photos in current schema
                });
            }
        } catch (error) {
            console.error('Error loading task:', error);
            alert('Erro ao carregar tarefa.');
        }
    };

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

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            streamRef.current = stream;
            setIsCameraOpen(true);
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
                setFormData(prev => ({ ...prev, photoPreview: photoData }));
                stopCamera();
            }
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

        const isSharedTask = selectionMode === 'all';
        const isMultiAssignee = selectionMode === 'multiple' && selectedEmployees.size > 1;

        const payload = {
            title: finalTitle,
            description: formData.description,
            assigned_to: (isSharedTask || isMultiAssignee) ? null : formData.assignedTo,
            is_shared: isSharedTask,
            type: formData.type,
            due_date: formData.dueDate,
            recurrence_type: formData.recurrenceType,
            recurrence_day: formData.recurrenceDay,
            ...(isEditing ? {} : { status: 'pending' }) // Only set status on create
            // reference_photo: formData.photoPreview // TODO: Add to schema if needed
        };

        try {
            let taskId = id;
            let error;

            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update(payload)
                    .eq('id', id);
                error = updateError;

                // Delete existing assignees if in multiple mode
                if (isMultiAssignee) {
                    await supabase.from('task_assignees').delete().eq('task_id', id);
                }
            } else {
                const { data, error: insertError } = await supabase
                    .from('tasks')
                    .insert([payload])
                    .select()
                    .single();
                error = insertError;
                if (data) taskId = data.id;
            }

            if (error) throw error;

            // If multiple assignees, insert into task_assignees table
            if (isMultiAssignee && taskId) {
                const assignees = Array.from(selectedEmployees).map(employeeId => ({
                    task_id: taskId,
                    employee_id: employeeId
                }));

                const { error: assigneesError } = await supabase
                    .from('task_assignees')
                    .insert(assignees);

                if (assigneesError) throw assigneesError;
            }

            navigate('/tasks');
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Erro ao salvar tarefa.');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-10 px-4 sm:px-0">
            <div className="flex items-center gap-3 sm:gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                        {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Preencha os detalhes abaixo
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
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

                        {/* Photo Upload & Camera */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Foto de Referência</label>

                            {!formData.photoPreview && !isCameraOpen ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <div className="relative rounded-lg overflow-hidden border">
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

                {/* Details Side-by-Side */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Responsável</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Selection Mode Buttons */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Modo de Atribuição</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={selectionMode === 'single' ? 'default' : 'outline'}
                                        className="text-xs"
                                        onClick={() => {
                                            setSelectionMode('single');
                                            if (selectedEmployees.size > 0) {
                                                const first = Array.from(selectedEmployees)[0];
                                                setSelectedEmployees(new Set([first]));
                                                setFormData(prev => ({ ...prev, assignedTo: first }));
                                            }
                                        }}
                                    >
                                        Um
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={selectionMode === 'multiple' ? 'default' : 'outline'}
                                        className="text-xs"
                                        onClick={() => setSelectionMode('multiple')}
                                    >
                                        Vários
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={selectionMode === 'all' ? 'default' : 'outline'}
                                        className="text-xs"
                                        onClick={() => {
                                            setSelectionMode('all');
                                            setSelectedEmployees(new Set());
                                        }}
                                    >
                                        Todos
                                    </Button>
                                </div>
                            </div>

                            {/* Employee Selection */}
                            {selectionMode !== 'all' && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        {selectionMode === 'single' ? 'Selecione um funcionário' : `Funcionários Selecionados (${selectedEmployees.size})`}
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                                        {employees.map((employee) => {
                                            const isSelected = selectedEmployees.has(employee.id);
                                            return (
                                                <button
                                                    key={employee.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (selectionMode === 'single') {
                                                            setSelectedEmployees(new Set([employee.id]));
                                                            setFormData(prev => ({ ...prev, assignedTo: employee.id }));
                                                        } else {
                                                            const newSet = new Set(selectedEmployees);
                                                            if (isSelected) {
                                                                newSet.delete(employee.id);
                                                            } else {
                                                                newSet.add(employee.id);
                                                            }
                                                            setSelectedEmployees(newSet);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all text-left ${isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-blue-200 flex items-center justify-center shrink-0">
                                                        {employee.photo ? (
                                                            <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-primary/60">{employee.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{employee.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Info Messages */}
                            {selectionMode === 'all' && (
                                <p className="text-xs text-muted-foreground">
                                    ℹ️ Esta tarefa aparecerá para todos os funcionários. Quando qualquer um concluir, será marcada como concluída para todos.
                                </p>
                            )}
                            {selectionMode === 'multiple' && selectedEmployees.size > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    ℹ️ Esta tarefa aparecerá para os {selectedEmployees.size} funcionários selecionados. Quando qualquer um concluir, será marcada como concluída para todos.
                                </p>
                            )}
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

                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => navigate('/tasks')} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button type="submit" size="lg" className="w-full sm:w-auto sm:px-8">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Tarefa
                    </Button>
                </div>
            </form >
        </div >
    );
}
