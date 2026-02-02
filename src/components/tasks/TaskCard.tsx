import { Calendar, CheckCircle2, Circle, Pencil, Trash2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
    task: Task;
    onStatusChange?: (id: string, newStatus: TaskStatus) => void;
    onEdit?: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
    const isCompleted = task.status === 'completed';

    const handleToggle = () => {
        if (onStatusChange) {
            onStatusChange(task.id, isCompleted ? 'pending' : 'completed');
        }
    };

    return (
        <Card className={cn("transition-all border-l-4 relative group", isCompleted ? "border-green-500 bg-green-50/50" : "border-gray-300")}>
            {/* Edit & Delete Buttons - Only show if handlers are provided */}
            {(onEdit || onDelete) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                    {onEdit && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-sm"
                            onClick={() => onEdit(task.id)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-sm"
                            onClick={() => onDelete(task.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

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
                            {task.isShared && (
                                <span className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    <Users className="h-3 w-3" />
                                    Todos
                                </span>
                            )}
                        </div>
                    </div>

                    {task.description && task.description.trim() !== task.title.trim() && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {task.description}
                        </p>
                    )}

                    {task.response && (
                        <div className="mt-2 p-2 bg-secondary/30 rounded-md text-sm border-l-2 border-secondary">
                            <span className="font-medium text-xs block text-muted-foreground mb-0.5">Resposta:</span>
                            <p className="text-foreground">{task.response}</p>
                        </div>
                    )}

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
