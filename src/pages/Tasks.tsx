import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/types';

// Mock Data
const initialTasks: Task[] = [
    {
        id: '1',
        title: 'Limpar Piscina',
        description: 'Aspirar o fundo e medir o pH da água. Aplicar cloro se necessário.',
        assignedTo: '2',
        type: 'routine',
        dueDate: '2023-11-20',
        status: 'pending',
        createdAt: '2023-11-19'
    },
    {
        id: '2',
        title: 'Preparar almoço de domingo',
        description: 'Churrasco para 10 convidados. Comprar carnes e bebidas.',
        assignedTo: '1',
        type: 'one_off',
        dueDate: '2023-11-21',
        status: 'in_progress',
        createdAt: '2023-11-19'
    },
    {
        id: '3',
        title: 'Consertar vazamento pia',
        description: 'Torneira da cozinha está pingando muito.',
        assignedTo: '2',
        type: 'one_off',
        dueDate: '2023-11-18',
        status: 'blocked',
        createdAt: '2023-11-15'
    },
    {
        id: '4',
        title: 'Limpeza dos quartos',
        description: 'Trocar roupa de cama e limpar janelas.',
        assignedTo: '1',
        type: 'routine',
        dueDate: '2023-11-19',
        status: 'completed',
        proof: {
            completedAt: '2023-11-19T10:00:00',
        },
        createdAt: '2023-11-19'
    }
];

export default function Tasks() {
    const [tasks] = useState<Task[]>(initialTasks);
    const [filter, setFilter] = useState('');

    const columns = [
        { id: 'pending', label: 'A Fazer', color: 'border-yellow-400' },
        { id: 'in_progress', label: 'Fazendo', color: 'border-blue-500' },
        { id: 'completed', label: 'Feito', color: 'border-green-500' },
        { id: 'blocked', label: 'Travado', color: 'border-red-500' }
    ];

    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quadro de Tarefas</h2>
                    <p className="text-muted-foreground">Acompanhe o progresso das atividades doméstica</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrar tarefas..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-[1000px] h-full">
                    {columns.map(col => (
                        <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
                            <div className={`flex items-center justify-between mb-4 border-t-4 pt-2 ${col.color}`}>
                                <h3 className="font-semibold text-lg">{col.label}</h3>
                                <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-full">
                                    {filteredTasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>
                            <div className="flex-1 bg-secondary/20 rounded-lg p-2 space-y-3">
                                {filteredTasks
                                    .filter(t => t.status === col.id)
                                    .map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
