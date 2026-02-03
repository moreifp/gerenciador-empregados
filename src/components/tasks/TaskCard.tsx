import { Calendar, CheckCircle2, Circle, Pencil, Trash2, Users, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface TaskCardProps {
    task: Task;
    onStatusChange?: (id: string, newStatus: TaskStatus) => void;
    onEdit?: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
    const isCompleted = task.status === 'completed';
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayingResponse, setIsPlayingResponse] = useState(false);

    const handleToggle = () => {
        if (onStatusChange) {
            onStatusChange(task.id, isCompleted ? 'pending' : 'completed');
        }
    };

    const handlePlayAudio = () => {
        if (isPlaying) {
            // Stop current speech
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            // Start text-to-speech
            const textToRead = task.description;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9; // Slightly slower for better comprehension

            utterance.onend = () => {
                setIsPlaying(false);
            };

            utterance.onerror = () => {
                setIsPlaying(false);
            };

            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    const handlePlayResponseAudio = () => {
        if (isPlayingResponse) {
            // Stop current speech
            window.speechSynthesis.cancel();
            setIsPlayingResponse(false);
        } else {
            // Start text-to-speech for response
            const textToRead = task.response || '';
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9; // Slightly slower for better comprehension

            utterance.onend = () => {
                setIsPlayingResponse(false);
            };

            utterance.onerror = () => {
                setIsPlayingResponse(false);
            };

            window.speechSynthesis.speak(utterance);
            setIsPlayingResponse(true);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

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
                        <p className={cn("font-medium text-base leading-tight", isCompleted && "text-muted-foreground line-through")}>
                            {task.description}
                        </p>
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

                    {/* Audio Button */}
                    {task.description && task.description.trim() && (
                        <div className="mt-2">
                            <Button
                                type="button"
                                variant={isPlaying ? "default" : "outline"}
                                size="sm"
                                onClick={handlePlayAudio}
                                className="flex items-center gap-2 h-8"
                            >
                                {isPlaying ? (
                                    <>
                                        <VolumeX className="h-4 w-4" />
                                        <span className="text-xs">Parar Áudio</span>
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="h-4 w-4" />
                                        <span className="text-xs">Ouvir Descrição</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {task.response && (
                        <div className="mt-2 p-2 bg-secondary/30 rounded-md text-sm border-l-2 border-secondary space-y-2">
                            <span className="font-medium text-xs block text-muted-foreground mb-0.5">Resposta:</span>
                            <p className="text-foreground">{task.response}</p>

                            {/* Audio Button for Response */}
                            <div className="pt-1">
                                <Button
                                    type="button"
                                    variant={isPlayingResponse ? "default" : "outline"}
                                    size="sm"
                                    onClick={handlePlayResponseAudio}
                                    className="flex items-center gap-2 h-7"
                                >
                                    {isPlayingResponse ? (
                                        <>
                                            <VolumeX className="h-3 w-3" />
                                            <span className="text-xs">Parar Áudio</span>
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="h-3 w-3" />
                                            <span className="text-xs">Ouvir Resposta</span>
                                        </>
                                    )}
                                </Button>
                            </div>
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
