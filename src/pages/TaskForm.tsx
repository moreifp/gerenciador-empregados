import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, ADMIN_EMPLOYEE_ID } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskType } from '@/types';
import { supabase } from '@/lib/supabase';
import { Loading } from '@/components/ui/loading';
import { PhotoSelector } from '@/components/ui/PhotoSelector';
import { TextToSpeech } from '@/components/ui/TextToSpeech';

export default function TaskForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { role } = useAuth();
    const canEditDetails = role === 'admin';
    const isEmployee = role === 'employee';
    const [searchParams] = useSearchParams();
    const preAssignedEmployeeId = searchParams.get('employeeId');
    const isEditing = !!id;

    // Recognition State
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingResponse, setIsRecordingResponse] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: isEmployee ? ADMIN_EMPLOYEE_ID : (preAssignedEmployeeId || ''),
        type: isEmployee ? 'one_off' as TaskType : 'routine' as TaskType,
        dueDate: new Date().toISOString().split('T')[0], // Default to today
        recurrenceType: 'none',
        recurrenceDay: new Date().getDay(),
        recurrenceDays: [] as number[], // For custom recurrence
        photoPreview: '' as string | null,
        response: '',
        responsePhotoPreview: '' as string | null
    });

    const [employees, setEmployees] = useState<{ id: string, name: string, photo?: string, role?: string }[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set(preAssignedEmployeeId ? [preAssignedEmployeeId] : []));
    const [selectionMode, setSelectionMode] = useState<'single' | 'multiple' | 'all'>('single');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await fetchEmployees();
            if (isEditing && id) {
                await fetchTask();
            }
            setLoading(false);
        };
        init();

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'pt-BR';
        }
    }, [id, isEditing]);

    const fetchEmployees = async () => {
        const { data } = await supabase.from('employees').select('id, name, photo, role').eq('active', true).order('name');
        if (data) setEmployees(data);
    };

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
                    recurrenceDays: data.recurrence_days || [],
                    photoPreview: null, // Tasks don't have reference photos in current schema
                    response: data.response || '',
                    responsePhotoPreview: null // Response photos will be added to schema later
                });
            }
        } catch (error) {
            console.error('Error loading task:', error);
            alert('Erro ao carregar tarefa.');
        }
    };


    // Active recording target ref to handle closure issues
    const activeRecordingTarget = useRef<'description' | 'response' | null>(null);

    // Update the onresult logic to use the ref
    useEffect(() => {
        if (!recognitionRef.current) return;

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                const cleanText = finalTranscript.trim();
                setFormData(prev => {
                    if (activeRecordingTarget.current === 'description') {
                        return { ...prev, description: (prev.description + ' ' + cleanText).trim() };
                    } else if (activeRecordingTarget.current === 'response') {
                        return { ...prev, response: (prev.response + ' ' + cleanText).trim() };
                    }
                    return prev;
                });
            }
        };
    }, []); // Run once to set up listener with ref access

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            activeRecordingTarget.current = null;
        } else {
            // Stop other if running
            if (isRecordingResponse) toggleRecordingResponse();

            activeRecordingTarget.current = 'description';
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const toggleRecordingResponse = () => {
        if (isRecordingResponse) {
            recognitionRef.current?.stop();
            setIsRecordingResponse(false);
            activeRecordingTarget.current = null;
        } else {
            // Stop other if running
            if (isRecording) toggleRecording();

            activeRecordingTarget.current = 'response';
            recognitionRef.current?.start();
            setIsRecordingResponse(true);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (photoData: string | null) => {
        setFormData(prev => ({ ...prev, photoPreview: photoData }));
    };

    const handleResponsePhotoChange = (photoData: string | null) => {
        setFormData(prev => ({ ...prev, responsePhotoPreview: photoData }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-generate title if empty from description
        const finalTitle = formData.title || (formData.description.length > 50
            ? formData.description.substring(0, 50) + '...'
            : formData.description) || 'Nova Tarefa';

        // Validate multiple selection mode
        if (selectionMode === 'multiple' && selectedEmployees.size < 2) {
            alert('No modo "Vários", você deve selecionar pelo menos 2 funcionários.');
            return;
        }

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
            recurrence_day: formData.recurrenceType === 'custom' ? null : formData.recurrenceDay,
            recurrence_days: formData.recurrenceType === 'custom' ? formData.recurrenceDays : null,
            response: formData.response, // Save response/observation
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

    if (loading) {
        return <Loading text="Carregando formulário..." fullScreen />;
    }

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
                {canEditDetails && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>O que precisa ser feito?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Description & Audio */}
                            <div>
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                    <label className="text-sm font-medium">Descrição / Instruções</label>
                                    <div className="flex gap-2">
                                        <TextToSpeech text={formData.description} />
                                        <Button
                                            type="button"
                                            variant={isRecording ? "destructive" : "secondary"}
                                            size="sm"
                                            onClick={toggleRecording}
                                            disabled={!canEditDetails}
                                            className="flex items-center gap-2 animate-in fade-in"
                                        >
                                            {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                                            {isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea
                                        name="description"
                                        className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isRecording ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        placeholder={isRecording ? "Ouvindo... vá falando..." : "Descreva os detalhes ou use o microfone para ditar..."}
                                        value={formData.description}
                                        onChange={handleChange}
                                        disabled={!canEditDetails}
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
                                {canEditDetails ? (
                                    <PhotoSelector
                                        photoPreview={formData.photoPreview}
                                        onPhotoChange={handlePhotoChange}
                                    />
                                ) : (
                                    formData.photoPreview ? (
                                        <div className="relative rounded-lg overflow-hidden border">
                                            <img src={formData.photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Nenhuma foto de referência fornecida.</p>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Details Side-by-Side - Only for Admin */}
                {canEditDetails && !isEmployee && (
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
                                            {selectionMode === 'single' ? 'Selecione um funcionário' : `Funcionários (${selectedEmployees.size} selecionados)`}
                                        </label>

                                        {selectionMode === 'single' ? (
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={formData.assignedTo}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, assignedTo: e.target.value }));
                                                    setSelectedEmployees(new Set([e.target.value]));
                                                }}
                                                required
                                            >
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="border border-input rounded-md p-2 sm:p-3 max-h-64 overflow-y-auto space-y-1">
                                                {employees.map(emp => {
                                                    const isSelected = selectedEmployees.has(emp.id);
                                                    const isLocked = emp.id === preAssignedEmployeeId;

                                                    return (
                                                        <label
                                                            key={emp.id}
                                                            className={`flex items-center gap-3 p-3 rounded min-h-[44px] hover:bg-accent cursor-pointer transition-colors ${isLocked ? 'opacity-75 cursor-not-allowed' : ''
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                disabled={isLocked}
                                                                onChange={(e) => {
                                                                    const newSet = new Set(selectedEmployees);
                                                                    if (e.target.checked) {
                                                                        newSet.add(emp.id);
                                                                    } else {
                                                                        newSet.delete(emp.id);
                                                                    }
                                                                    setSelectedEmployees(newSet);
                                                                }}
                                                                className="h-5 w-5 rounded border-gray-300 shrink-0"
                                                            />
                                                            <span className="text-sm sm:text-base flex-1">
                                                                {emp.name}
                                                                {isLocked && <span className="ml-2 text-amber-600">🔒</span>}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectionMode === 'all' && (
                                    <p className="text-xs text-muted-foreground mt-4">
                                        ℹ️ Esta é uma tarefa comum. Ao ser cumprida por qualquer funcionário, será marcada como concluída para todos.
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
                                        disabled={!canEditDetails}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Repetição</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.recurrenceType}
                                        onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as any })}
                                        disabled={!canEditDetails}
                                    >
                                        <option value="none">Não repete (Apenas uma vez)</option>
                                        <option value="daily">Diário (Todo dia)</option>
                                        <option value="weekly">Semanal (Toda semana)</option>
                                        <option value="monthly">Mensal (Todo mês)</option>
                                        <option value="custom">Personalizar (Dias da Semana)</option>
                                    </select>
                                </div>

                                {(formData.recurrenceType === 'weekly' || formData.recurrenceType === 'custom') && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <label className="text-sm font-medium block text-center">Dias da Semana</label>
                                        <div className="flex gap-1 justify-center">
                                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                                                // Logic for selection:
                                                // If weekly: single select.
                                                // If custom: multi select allowed?
                                                // Current schema likely supports only ONE day if it's integer.
                                                // I will implement "custom" to basically be "Weekly" but allow selecting the day?
                                                // Wait, "weekly" usually implies "Once a week on X day".
                                                // "Custom" with "click on DAYS" implies multiple days, e.g. Mon and Wed.
                                                // If my backend only supports one integer, I can't support multiple days easily.
                                                // I will assume for now I can interpret `recurrence_day` differently or just enable single select for now to avoid breaking backend if I can't check it.
                                                // User asked "clicar NOS DIAS" (plural).
                                                // I'll check schema first.

                                                const isSelected = formData.recurrenceType === 'custom'
                                                    ? formData.recurrenceDays.includes(index)
                                                    : formData.recurrenceDay === index;

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        disabled={!canEditDetails}
                                                        onClick={() => {
                                                            if (!canEditDetails) return;
                                                            if (formData.recurrenceType === 'custom') {
                                                                const currentDays = formData.recurrenceDays;
                                                                let newDays;
                                                                if (currentDays.includes(index)) {
                                                                    newDays = currentDays.filter(d => d !== index);
                                                                } else {
                                                                    newDays = [...currentDays, index];
                                                                }
                                                                setFormData({ ...formData, recurrenceDays: newDays });
                                                            } else {
                                                                setFormData({ ...formData, recurrenceDay: index });
                                                            }
                                                        }}
                                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${isSelected
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-transparent hover:bg-secondary'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            {formData.recurrenceType === 'weekly'
                                                ? `Toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][formData.recurrenceDay || 0]}`
                                                : `Repetir em: ${formData.recurrenceDays.length > 0
                                                    ? formData.recurrenceDays.sort().map(d => ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d]).join(', ')
                                                    : 'Nenhum dia selecionado'}`
                                            }
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
                                            disabled={!canEditDetails}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Todo dia {formData.recurrenceDay || 1}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Response / Observations Field */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Resposta / Observações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                <p className="text-sm text-muted-foreground">
                                </p>
                                <div className="flex gap-2">
                                    <TextToSpeech text={formData.response} />
                                    <Button
                                        type="button"
                                        variant={isRecordingResponse ? "destructive" : "secondary"}
                                        size="sm"
                                        onClick={toggleRecordingResponse}
                                        className="flex items-center gap-2 animate-in fade-in shrink-0"
                                    >
                                        {isRecordingResponse ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                                        {isRecordingResponse ? 'Parar' : 'Gravar'}
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <textarea
                                    name="response"
                                    className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isRecordingResponse ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    placeholder={isRecordingResponse ? "Ouvindo... pode falar..." : "Digite aqui qualquer observação sobre a tarefa..."}
                                    value={formData.response}
                                    onChange={handleChange}
                                />
                                {isRecordingResponse && (
                                    <span className="absolute bottom-2 right-2 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Photo for Response/Observations */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Foto da Observação</label>
                            <PhotoSelector
                                photoPreview={formData.responsePhotoPreview}
                                onPhotoChange={handleResponsePhotoChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => navigate('/tasks')} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button type="submit" size="lg" className="w-full sm:w-auto sm:px-8">
                        <Save className="mr-2 h-4 w-4" />
                        {isEmployee ? 'Enviar para Administrador' : (canEditDetails ? 'Salvar Tarefa' : 'Enviar Resposta')}
                    </Button>
                </div>
            </form >
        </div >
    );
}
