import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter, User, ArrowLeft } from 'lucide-react';
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

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const [filter, setFilter] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const employeeId = searchParams.get('employeeId');

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Employees
            const { data: empData } = await supabase.from('employees').select('*').eq('active', true);
            if (empData) setEmployees(empData as any);

            // Fetch Tasks with Assignees
            const { data: taskData } = await supabase
                .from('tasks')
                .select('*, task_assignees(employee_id)');

            if (taskData) {
                let mappedTasks: Task[] = taskData.map((t: any) => {
                    // Check if current user is in assignees list
                    const assigneeIds = t.task_assignees?.map((a: any) => a.employee_id) || [];

                    return {
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        assignedTo: t.assigned_to,
                        assigneeIds: assigneeIds, // Add this to Task type if needed, or just use for filtering locally
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
                        createdAt: t.created_at
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
        };
        fetchData();
    }, [user, role]); // Depend on user/role to re-fetch/filter

    // If employee login, force selectedEmployeeId (visual filter) to be themselves initially? 
    // Actually, "My Tasks" view implies we show tasks assigned TO THEM. 
    // The visual filter `selectedEmployeeId` is for admins to filter BY employee.
    // We should probably hide the employee filter dropdown for regular employees.


    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        if (error) {
            console.error('Error updating task:', error);
            return;
        }
        setBaseTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    const handleEdit = (taskId: string) => {
        navigate(`/tasks/${taskId}`);
    };

    const isEmployeeView = role === 'employee';
    const canCreateTask = role === 'admin'; // Only admin can create tasks
    const canEditTask = role === 'admin'; // Only admin can edit tasks

    // Get task count per employee
    const getEmployeeTaskCount = (empId: string) => {
        return baseTasks.filter(t => (t.assignedTo === empId || t.isShared) && t.status !== 'completed').length;
    };

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
                t.title.toLowerCase().includes(filter.toLowerCase()) ||
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
                        onClick={() => setSelectedEmployeeId(null)}
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
                t.title.toLowerCase().includes(filter.toLowerCase()) ||
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
                        <p className="text-sm sm:text-base text-muted-foreground mt-1">
                            Aqui estão suas tarefas.
                        </p>
                    </div>
                </div>

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
                                <p className="text-xs text-muted-foreground mt-1">{emp.role}</p>
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
