import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task, Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Tasks() {
    const { user, role } = useAuth();
    const [baseTasks, setBaseTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    // const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const employeeId = searchParams.get('employeeId');

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Employees
            const { data: empData } = await supabase.from('employees').select('*');
            if (empData) setEmployees(empData as any);

            // Fetch Tasks
            const { data: taskData } = await supabase.from('tasks').select('*');
            if (taskData) {
                // Map snake_case to camelCase if needed, or update types. 
                // For MVP, if schema matches types, great. 
                // Schema uses: due_date, recurrence_type. Types use: dueDate, recurrenceType.
                // We need to map it.
                const mappedTasks: Task[] = taskData.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    assignedTo: t.assigned_to,
                    status: t.status,
                    type: t.type,
                    dueDate: t.due_date,
                    recurrenceType: t.recurrence_type,
                    recurrenceDay: t.recurrence_day,
                    proof: {
                        photoUrl: t.proof_photo_url,
                        audioUrl: t.proof_audio_url,
                        comment: t.proof_comment,
                        completedAt: t.completed_at
                    },
                    createdAt: t.created_at
                }));
                setBaseTasks(mappedTasks);
            }
            // setLoading(false);
        };
        fetchData();
    }, []);


    // Generate Recurring Instances
    const generateRecurringInstances = (originalTasks: Task[]) => {
        const generatedTasks: Task[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lookAheadDays = 14;

        originalTasks.forEach(task => {
            if (task.recurrenceType === 'none' || !task.recurrenceType) {
                generatedTasks.push(task);
                return;
            }

            const startDate = new Date(task.dueDate);
            startDate.setHours(0, 0, 0, 0);

            for (let i = 0; i <= lookAheadDays; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);

                if (currentDate < startDate) continue;

                let shouldAdd = false;
                if (task.recurrenceType === 'daily') shouldAdd = true;
                else if (task.recurrenceType === 'weekly') {
                    const expectedDay = task.recurrenceDay !== undefined ? task.recurrenceDay : startDate.getDay();
                    if (currentDate.getDay() === expectedDay) shouldAdd = true;
                } else if (task.recurrenceType === 'monthly') {
                    const expectedDate = task.recurrenceDay || startDate.getDate();
                    if (currentDate.getDate() === expectedDate) shouldAdd = true;
                }

                if (shouldAdd) {
                    generatedTasks.push({
                        ...task,
                        id: `${task.id}_${currentDate.toISOString().split('T')[0]}`,
                        dueDate: currentDate.toISOString().split('T')[0],
                        status: 'pending',
                        title: task.title,
                    });
                }
            }
        });
        return generatedTasks;
    };

    const tasks = generateRecurringInstances(baseTasks);
    const [completedInstances, setCompletedInstances] = useState<Set<string>>(new Set());

    const handleToggle = (taskId: string, newStatus: any) => {
        if (newStatus === 'completed') {
            setCompletedInstances(prev => new Set(prev).add(taskId));
        } else {
            setCompletedInstances(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
            });
        }
    };

    // Apply completion status
    const displayedTasks = tasks.map(t => ({
        ...t,
        status: completedInstances.has(t.id) ? 'completed' : t.status === 'completed' ? 'completed' : 'pending'
    })) as Task[];

    // --- Permissions ---
    const canCreateTask = role === 'admin';
    const isEmployeeView = role === 'employee';

    // --- Filtering Logic ---
    let visibleTasks = displayedTasks.filter(t =>
        t.title.toLowerCase().includes(filter.toLowerCase()) ||
        t.description.toLowerCase().includes(filter.toLowerCase())
    );

    // Filter by Date for Employees (Next 7 Days)
    if (isEmployeeView && user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        visibleTasks = visibleTasks.filter(t => {
            const taskDate = new Date(t.dueDate);
            // Handle timezones loosely by comparing ISO strings prefix or using timestamps
            // Just basic comparison:
            return taskDate >= today && taskDate <= nextWeek;
        });
    }

    // --- Column Generation ---
    let columns = [];

    if (isEmployeeView && user) {
        // Employee sees ONLY their own column
        // We find the employee data matching the logged in user
        const empParams = employees.find(e => e.id === user.id);
        const columnLabel = empParams ? empParams.name : user.name;

        columns = [{
            id: user.id,
            label: columnLabel,
            photo: user.photo,
            role: 'Suas Tarefas',
            isUnassigned: false
        }];
    } else {
        // Admin/Kiosk sees everyone + unassigned
        const employeeColumns = employees.map(emp => ({
            id: emp.id,
            label: emp.name,
            photo: emp.photo,
            role: emp.role,
            isUnassigned: false
        }));

        columns = [
            ...employeeColumns,
            { id: 'unassigned', label: 'Sem Responsável', photo: null, role: 'Geral', isUnassigned: true }
        ];
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isEmployeeView ? `Olá, ${user?.name}` : 'Quadro de Tarefas'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEmployeeView
                            ? 'Aqui estão suas tarefas para os próximos 7 dias.'
                            : 'Visão geral do sistema.'}
                    </p>
                </div>
                {canCreateTask && (
                    <Button onClick={() => navigate(`/tasks/new${employeeId ? `?employeeId=${employeeId}` : ''}`)}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar tarefas..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className={`flex gap-6 h-full ${isEmployeeView ? 'w-full max-w-2xl mx-auto flex-col' : 'flex-col lg:flex-row lg:min-w-[1000px]'}`}>
                    {columns.map(col => {
                        // Filter tasks for this column
                        const columnTasks = visibleTasks.filter(task => {
                            if (col.isUnassigned) {
                                return !task.assignedTo;
                            }
                            return task.assignedTo === col.id;
                        });

                        const pendingTasks = columnTasks.filter(t => t.status !== 'completed');
                        const completedTasks = columnTasks.filter(t => t.status === 'completed');

                        return (
                            <div key={col.id} className="flex-1 flex flex-col w-full min-w-0 lg:min-w-[300px]">
                                <div className="flex items-center gap-3 mb-4 border-b pb-3 border-border">
                                    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                        {col.photo ? (
                                            <img src={col.photo} alt={col.label} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg leading-none">{col.label}</h3>
                                        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wide">{col.role}</p>
                                    </div>
                                    <span className="ml-auto text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                                        {pendingTasks.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {/* Pending Tasks */}
                                    {pendingTasks.length > 0 ? (
                                        pendingTasks.map(task => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                onStatusChange={handleToggle}
                                            />
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground text-sm italic border-2 border-dashed border-border/50 rounded-md">
                                            Tudo em dia! 🎉
                                        </div>
                                    )}

                                    {/* Completed Tasks Accordion */}
                                    {completedTasks.length > 0 && (
                                        <div className="pt-4 border-t mt-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-between mb-2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowCompleted(!showCompleted)}
                                            >
                                                <span>Concluídas ({completedTasks.length})</span>
                                                {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>

                                            {showCompleted && (
                                                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                                                    {completedTasks.map(task => (
                                                        <TaskCard
                                                            key={task.id}
                                                            task={task}
                                                            onStatusChange={handleToggle}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
