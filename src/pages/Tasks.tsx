import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter, User, ArrowLeft, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task, Employee } from '@/types';
import { useAuth, ADMIN_EMPLOYEE_ID } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loading } from '@/components/ui/loading';

export default function Tasks() {
    const { user, role } = useAuth();
    const [baseTasks, setBaseTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const [filter, setFilter] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);

    // Change Password State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const employeeId = searchParams.get('employeeId');

    useEffect(() => {
        if (employeeId) {
            setSelectedEmployeeId(employeeId);
        }
    }, [employeeId]);


    useEffect(() => {
        const fetchData = async () => {
            // Fetch Employees and Tasks in PARALLEL for faster loading
            const [empResult, taskResult] = await Promise.all([
                supabase
                    .from('employees')
                    .select('*')
                    .eq('active', true)
                    .order('name'),
                supabase
                    .from('tasks')
                    .select('*, task_assignees(employee_id), created_by_employee:employees!tasks_created_by_fkey(name)')
                    .order('created_at', { ascending: false })
                    .limit(200)
            ]);

            const empData = empResult.data;
            const taskData = taskResult.data;

            if (empData) {
                // Ordenar: admin primeiro, depois outros alfabeticamente
                const sortedData = (empData as any[]).sort((a, b) => {
                    const aIsAdmin = a.role === 'admin' || a.id === ADMIN_EMPLOYEE_ID;
                    const bIsAdmin = b.role === 'admin' || b.id === ADMIN_EMPLOYEE_ID;

                    if (aIsAdmin) return -1;
                    if (bIsAdmin) return 1;
                    return a.name.localeCompare(b.name);
                });
                setEmployees(sortedData as any);
            }

            if (taskData) {
                let mappedTasks: Task[] = taskData.map((t: any) => {
                    // Check if current user is in assignees list
                    const assigneeIds = t.task_assignees?.map((a: any) => a.employee_id) || [];
                    const creatorName = t.created_by_employee?.name;

                    return {
                        id: t.id,
                        description: t.description,
                        assignedTo: t.assigned_to,
                        assigneeIds: assigneeIds,
                        isShared: t.is_shared,
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
                        response: t.response,
                        createdAt: t.created_at,
                        createdBy: t.created_by,
                        createdByName: creatorName
                    };
                });

                // Filter for Employee Role
                if (role === 'employee' && user) {
                    mappedTasks = mappedTasks.filter(t =>
                        t.isShared ||
                        t.assignedTo === user.id ||
                        (t as any).assigneeIds.includes(user.id)
                    );
                }

                setBaseTasks(mappedTasks);
            }
            setLoading(false);
        };
        fetchData();
    }, [user, role]); // Depend on user/role to re-fetch/filter

    // If employee login, force selectedEmployeeId (visual filter) to be themselves initially? 
    // Actually, "My Tasks" view implies we show tasks assigned TO THEM. 
    // The visual filter `selectedEmployeeId` is for admins to filter BY employee.
    // We should probably hide the employee filter dropdown for regular employees.


    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        try {
            // First, update the task status
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (updateError) {
                console.error('Error updating task:', updateError);
                return;
            }

            // Update local state immediately for better UX
            setBaseTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

            // If task is being marked as completed, check if it's recurring
            if (newStatus === 'completed') {
                // Find the task that was just completed
                const completedTask = baseTasks.find(t => t.id === taskId);

                if (completedTask && completedTask.recurrenceType && completedTask.recurrenceType !== 'none') {
                    // Fetch full task data from database to ensure we have all fields
                    const { data: taskData, error: fetchError } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('id', taskId)
                        .single();

                    if (fetchError || !taskData) {
                        console.error('Error fetching task for recreation:', fetchError);
                        return;
                    }

                    // Calculate next occurrence date
                    const { getNextRecurrenceDate } = await import('@/utils/recurrence');
                    const nextDate = getNextRecurrenceDate(
                        taskData.due_date,
                        taskData.recurrence_type,
                        taskData.recurrence_day,
                        taskData.recurrence_days
                    );

                    if (nextDate) {
                        // Create new task with same data but new due date and pending status
                        const newTaskData = {
                            description: taskData.description,
                            assigned_to: taskData.assigned_to,
                            is_shared: taskData.is_shared,
                            status: 'pending',
                            type: taskData.type,
                            due_date: nextDate,
                            recurrence_type: taskData.recurrence_type,
                            recurrence_day: taskData.recurrence_day,
                            recurrence_days: taskData.recurrence_days,
                            response: taskData.response,
                            created_by: taskData.created_by
                        };

                        const { data: newTask, error: createError } = await supabase
                            .from('tasks')
                            .insert([newTaskData])
                            .select()
                            .single();

                        if (createError) {
                            console.error('Error recreating recurring task:', createError);
                            return;
                        }

                        // If task has multiple assignees, recreate those too
                        if (newTask) {
                            const { data: assignees } = await supabase
                                .from('task_assignees')
                                .select('employee_id')
                                .eq('task_id', taskId);

                            if (assignees && assignees.length > 0) {
                                const newAssignees = assignees.map(a => ({
                                    task_id: newTask.id,
                                    employee_id: a.employee_id
                                }));

                                await supabase.from('task_assignees').insert(newAssignees);
                            }

                            // Add new task to local state
                            const mappedNewTask: Task = {
                                id: newTask.id,
                                description: newTask.description,
                                assignedTo: newTask.assigned_to,
                                assigneeIds: assignees?.map(a => a.employee_id) || [],
                                isShared: newTask.is_shared,
                                status: newTask.status,
                                type: newTask.type,
                                dueDate: newTask.due_date,
                                recurrenceType: newTask.recurrence_type,
                                recurrenceDay: newTask.recurrence_day,
                                proof: {
                                    photoUrl: undefined,
                                    audioUrl: undefined,
                                    comment: undefined,
                                    completedAt: undefined
                                },
                                response: newTask.response,
                                createdAt: newTask.created_at,
                                createdBy: newTask.created_by,
                                createdByName: completedTask.createdByName
                            };

                            setBaseTasks(prev => [mappedNewTask, ...prev]);

                            console.log(`✅ Recurring task recreated for ${nextDate}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in handleStatusChange:', error);
        }
    };

    const handleEdit = (taskId: string) => {
        navigate(`/tasks/${taskId}`);
    };

    const handleDelete = async (taskId: string) => {
        try {
            // Delete task assignees first (if any)
            await supabase.from('task_assignees').delete().eq('task_id', taskId);

            // Delete the task
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);

            if (error) throw error;

            // Update local state
            setBaseTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Erro ao deletar tarefa.');
        }
    };


    const handleSaveResponse = async (taskId: string, response: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ response })
                .eq('id', taskId);

            if (error) throw error;

            // Update local state
            setBaseTasks(prev => prev.map(t => t.id === taskId ? { ...t, response } : t));
        } catch (error) {
            console.error('Error saving response:', error);
            alert('Erro ao salvar resposta.');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword.length < 4 || newPassword.length > 6) {
            alert('A senha deve ter entre 4 e 6 dígitos.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        try {
            const { error } = await supabase
                .from('employees')
                .update({ custom_password: newPassword })
                .eq('id', user.id);

            if (error) throw error;

            alert('Senha alterada com sucesso!');
            setIsChangingPassword(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Erro ao alterar senha.');
        }
    };

    const isEmployeeView = role === 'employee';
    const canCreateTask = role === 'admin' || role === 'employee'; // Admin and employees can create tasks
    const canEditTask = role === 'admin'; // Only admin can edit tasks
    const canDeleteTask = role === 'admin'; // Only admin can delete tasks

    // Get task count per employee
    const getEmployeeTaskCount = (empId: string) => {
        return baseTasks.filter(t => (t.assignedTo === empId || t.isShared) && t.status !== 'completed').length;
    };

    if (loading) {
        return <Loading text="Carregando tarefas..." fullScreen />;
    }

    // If an employee is selected (mobile view), show their tasks
    if (selectedEmployeeId) {
        const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
        // Include tasks assigned to this employee OR shared tasks
        let tasks = baseTasks.filter(t => t.assignedTo === selectedEmployeeId || t.isShared);

        // For kiosk, filter tasks to show only today + next 7 days
        if (role === 'kiosk') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            tasks = tasks.filter(t => {
                const taskDate = new Date(t.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate >= today && taskDate <= nextWeek;
            });
        }

        // Apply text filter
        if (filter) {
            tasks = tasks.filter(t =>
                t.description.toLowerCase().includes(filter.toLowerCase())
            );
        }

        // Apply completed filter
        if (!showCompleted) {
            tasks = tasks.filter(t => t.status !== 'completed');
        }

        return (
            <div className="space-y-4 h-full flex flex-col px-4 sm:px-0">
                {/* Header with back button */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3 flex-1">
                        {selectedEmployee?.photo && (
                            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                                <img src={selectedEmployee.photo} alt={selectedEmployee.name} className="h-full w-full object-cover" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">{selectedEmployee?.name}</h2>
                            <p className="text-sm text-muted-foreground">{tasks.length} tarefas</p>
                        </div>
                    </div>
                    {canCreateTask && (
                        <Button
                            size="icon"
                            onClick={() => navigate(`/tasks/new?employeeId=${selectedEmployeeId}`)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Search */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar tarefas..."
                            className="pl-8"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Show completed toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showCompleted"
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="showCompleted" className="text-sm text-muted-foreground">
                        Mostrar concluídas
                    </label>
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-auto pb-6 space-y-3">
                    {tasks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Nenhuma tarefa encontrada</p>
                    ) : (
                        tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onStatusChange={handleStatusChange}
                                onEdit={canEditTask ? handleEdit : undefined}
                                onDelete={canDeleteTask ? handleDelete : undefined}
                            />
                        ))
                    )}
                </div>
            </div>
        );
    }

    // For employee view, auto-select their tasks
    if (isEmployeeView && user) {
        let tasks = baseTasks.filter(t => t.assignedTo === user.id || t.isShared);

        // Apply text filter
        if (filter) {
            tasks = tasks.filter(t =>
                t.description.toLowerCase().includes(filter.toLowerCase())
            );
        }

        // Apply completed filter
        if (!showCompleted) {
            tasks = tasks.filter(t => t.status !== 'completed');
        }

        return (
            <div className="space-y-4 sm:space-y-6 h-full flex flex-col px-4 sm:px-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                            Olá, {user?.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm sm:text-base text-muted-foreground">
                                Aqui estão suas tarefas.
                            </p>
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary ml-2"
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                            >
                                <Lock className="h-3 w-3 mr-1" />
                                {isChangingPassword ? 'Cancelar' : 'Trocar Senha'}
                            </Button>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/tasks/new')}
                        size="sm"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa para Admin
                    </Button>
                </div>

                {isChangingPassword && (
                    <div className="bg-slate-50 border rounded-lg p-4 animate-in slide-in-from-top-2">
                        <form onSubmit={handleChangePassword} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-sm">Nova Senha (4-6 dígitos)</h3>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsChangingPassword(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex gap-3 items-end">
                                <div className="space-y-1 flex-1">
                                    <Input
                                        type="password"
                                        placeholder="Nova senha"
                                        maxLength={6}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value.replace(/\D/g, ''))}
                                        required
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Input
                                        type="password"
                                        placeholder="Confirmar"
                                        maxLength={6}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
                                        required
                                    />
                                </div>
                                <Button type="submit">Salvar</Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar tarefas..."
                            className="pl-8"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="showCompleted"
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="showCompleted" className="text-sm text-muted-foreground">
                            Mostrar concluídas
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-auto pb-6 space-y-3">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={handleStatusChange}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSaveResponse={canEditTask ? handleSaveResponse : undefined}
                        />
                    ))}
                    {tasks.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Nenhuma tarefa</p>
                    )}
                </div>
            </div>
        );
    }

    // Default view (Admin/Kiosk) - Employee Grid
    return (
        <div className="space-y-6 h-full flex flex-col px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Quadro de Tarefas</h2>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Selecione um funcionário para ver suas tarefas.
                    </p>
                </div>
                {canCreateTask && (
                    <Button
                        onClick={() => navigate(`/tasks/new${employeeId ? `?employeeId=${employeeId}` : ''}`)}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                    </Button>
                )}
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {employees.map(emp => {
                    const taskCount = getEmployeeTaskCount(emp.id);
                    return (
                        <button
                            key={emp.id}
                            onClick={() => setSelectedEmployeeId(emp.id)}
                            className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                            <div className="relative">
                                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform">
                                    {emp.photo ? (
                                        <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-blue-200 flex items-center justify-center">
                                            <User className="h-10 w-10 text-primary/60" />
                                        </div>
                                    )}
                                </div>
                                {taskCount > 0 && (
                                    <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                                        {taskCount}
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm leading-tight">{emp.name}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {employees.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                    Nenhum funcionário cadastrado. Vá para Dashboard para adicionar.
                </p>
            )}
        </div>
    );
}
