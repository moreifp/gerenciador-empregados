import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
    task: Task;
    onStatusChange?: (id: string, newStatus: TaskStatus) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
    const isCompleted = task.status === 'completed';

    const handleToggle = () => {
        if (onStatusChange) {
            onStatusChange(task.id, isCompleted ? 'pending' : 'completed');
        }
    };

    return (
        <Card className={cn("transition-all border-l-4", isCompleted ? "border-green-500 bg-green-50/50" : "border-gray-300")}>
            <CardContent className="p-4 flex gap-4">
                {/* Check Action - Make it big and easy to hit */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-full hover:bg-transparent"
                    onClick={handleToggle}
                >
                    {isCompleted ? (
                        <CheckCircle2 className="h-10 w-10 text-green-500 fill-green-100" />
                    ) : (
                        <Circle className="h-10 w-10 text-gray-300 hover:text-gray-400" />
                    )}
                </Button>

                <div className="space-y-2 flex-1 min-w-0">
                    <div>
                        <h4 className={cn("font-semibold text-base leading-tight", isCompleted && "text-muted-foreground line-through")}>
                            {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>

                    {task.proof?.photoUrl && (
                        <div className="rounded-md overflow-hidden h-20 w-32 bg-slate-100 border">
                            <img src={task.proof.photoUrl} alt="Prova" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
