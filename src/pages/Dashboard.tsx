import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Task } from '@/types';
import { useState, useEffect } from 'react';

// Mock Data (duplicated for now, ideally in a context)
const initialTasks: Task[] = [
    {
        id: '1',
        title: 'Limpar Piscina',
        description: 'Aspirar o fundo e medir o pH.',
        assignedTo: '2',
        type: 'routine',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        createdAt: '2023-11-19'
    },
    {
        id: '2',
        title: 'Preparar almoço',
        description: 'Churrasco.',
        assignedTo: '1',
        type: 'one_off',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        createdAt: '2023-11-19'
    },
    {
        id: '4',
        title: 'Limpeza dos quartos',
        description: 'Trocar roupa de cama.',
        assignedTo: '1',
        type: 'routine',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'completed',
        proof: { completedAt: '2023-11-19T10:00:00' },
        createdAt: '2023-11-19'
    }
];

export default function Dashboard() {
    const [tasks] = useState<Task[]>(initialTasks);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const stats = {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
    };

    const todayStr = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end border-b pb-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Painel do Dia
                    </h2>
                    <p className="text-xl text-muted-foreground capitalize mt-2">
                        {todayStr}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold font-mono">
                        {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-400">A Fazer</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</div>
                        <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">Tarefas pendentes</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">Em Andamento</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{stats.in_progress}</div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Em execução agora</p>
                    </CardContent>
                </Card>

                <Card className="bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 dark:text-green-400">Concluídas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-700 dark:text-green-300">{stats.completed}</div>
                        <p className="text-xs text-green-600/80 dark:text-green-400/80">Finalizadas hoje</p>
                    </CardContent>
                </Card>

                <Card className="bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800 dark:text-red-400">Problemas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-red-700 dark:text-red-300">{stats.blocked}</div>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80">Requer atenção</p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Feed or List */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Atividades Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold text-white
                                    ${task.status === 'completed' ? 'bg-green-500' :
                                            task.status === 'in_progress' ? 'bg-blue-500' :
                                                task.status === 'blocked' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}>
                                        {task.status === 'completed' ? 'Concluído' :
                                            task.status === 'in_progress' ? 'Executando' :
                                                task.status === 'blocked' ? 'Travado' : 'Pendente'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
