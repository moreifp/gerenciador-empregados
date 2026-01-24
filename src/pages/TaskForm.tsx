import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TaskType, TaskStatus } from '@/types';

// Mock Employees for assignment
const employees = [
    { id: '1', name: 'Maria Silva' },
    { id: '2', name: 'João Santos' }
];

export default function TaskForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        type: 'routine' as TaskType,
        dueDate: '',
        recurrence: 'daily'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Saved Task:', formData);
        navigate('/tasks');
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
                    </h2>
                    <p className="text-muted-foreground">
                        Defina o que precisa ser feito e quem fará.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes da Tarefa</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-2 block">Título</label>
                                <Input name="title" placeholder="Ex: Limpar a piscina" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-2 block">Descrição</label>
                                <textarea
                                    name="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Detelhes do que deve ser feito..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Atribuir a</label>
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
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Prazo / Data</label>
                                <Input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tipo e Recorrência</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Tipo</label>
                                <select
                                    name="type"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <option value="routine">Rotina (Fixo)</option>
                                    <option value="one_off">Pontual</option>
                                </select>
                            </div>

                            {formData.type === 'routine' && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Repetir</label>
                                    <select
                                        name="recurrence"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={formData.recurrence}
                                        onChange={handleChange}
                                    >
                                        <option value="daily">Diariamente</option>
                                        <option value="weekly">Semanalmente</option>
                                        <option value="monthly">Mensalmente</option>
                                    </select>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/tasks')}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Tarefa
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
