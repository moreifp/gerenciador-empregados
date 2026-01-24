import { Calendar, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

// Helper for status colors (Monday.com style)
const statusConfig: Record<TaskStatus, { color: string; label: string; icon: any }> = {
    pending: { color: 'bg-yellow-400', label: 'Pendente', icon: Clock },
    in_progress: { color: 'bg-blue-500', label: 'Em Andamento', icon: Clock },
    completed: { color: 'bg-green-500', label: 'Feito', icon: CheckCircle2 },
    blocked: { color: 'bg-red-500', label: 'Travado', icon: AlertCircle },
};

interface TaskCardProps {
    task: Task;
    onStatusChange?: (id: string, status: TaskStatus) => void;
}

export function TaskCard({ task }: TaskCardProps) {
    const config = statusConfig[task.status];
    const Icon = config.icon;

    return (
        <Card className="hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: task.status === 'completed' ? '#22c55e' : task.status === 'blocked' ? '#ef4444' : '#eab308' }}>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold line-clamp-2">{task.title}</CardTitle>
                    <div className={cn("h-3 w-3 rounded-full", config.color)} title={config.label} />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {task.description}
                </p>

                {task.proof?.photoUrl && (
                    <div className="rounded-md overflow-hidden h-24 w-full bg-slate-100 mt-2">
                        <img src={task.proof.photoUrl} alt="Prova" className="w-full h-full object-cover" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>

                <div className={cn("px-2 py-1 rounded-full text-white flex items-center gap-1 font-medium", config.color)}>
                    <Icon className="h-3 w-3" />
                    <span>{config.label}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
