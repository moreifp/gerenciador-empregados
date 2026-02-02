import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, User, Pencil, Crown } from 'lucide-react';
import { Employee } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth, ADMIN_EMPLOYEE_ID } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';

export default function Dashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { role } = useAuth();

    // Only admin can add/remove employees
    const canManageEmployees = role === 'admin';
    const isKiosk = role === 'kiosk';

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            if (data) {
                // Sort employees: admin first, then others alphabetically
                const sortedData = (data as any[]).sort((a, b) => {
                    // Admin always first
                    if (a.role === 'admin' || a.id === ADMIN_EMPLOYEE_ID) return -1;
                    if (b.role === 'admin' || b.id === ADMIN_EMPLOYEE_ID) return 1;
                    // Other employees alphabetically
                    return a.name.localeCompare(b.name);
                });
                setEmployees(sortedData as any);
            }

            // Fetch active tasks for counts
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('assigned_to, is_shared, task_assignees(employee_id)')
                .neq('status', 'completed');

            if (tasksData) {
                const counts: Record<string, number> = {};
                // Initialize counts
                if (data) data.forEach((emp: any) => counts[emp.id] = 0);

                tasksData.forEach((task: any) => {
                    if (task.is_shared) {
                        // Shared task counts for everyone
                        Object.keys(counts).forEach(empId => counts[empId]++);
                    } else if (task.assigned_to) {
                        if (counts[task.assigned_to] !== undefined) counts[task.assigned_to]++;
                    } else if (task.task_assignees && task.task_assignees.length > 0) {
                        // Multi-assignee support
                        task.task_assignees.forEach((assignee: any) => {
                            if (counts[assignee.employee_id] !== undefined) counts[assignee.employee_id]++;
                        });
                    }
                });
                setTaskCounts(counts);
            }

        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!canManageEmployees) return; // Extra safety check

        if (confirm('Tem certeza que deseja remover este funcionário?')) {
            try {
                const { error } = await supabase.from('employees').delete().eq('id', id);
                if (error) throw error;
                setEmployees(employees.filter(emp => emp.id !== id));
            } catch (err) {
                console.error('Error deleting:', err);
                alert('Erro ao deletar.');
            }
        }
    };



    // Kiosk View - Simple grid of employee photos
    if (isKiosk) {
        return (
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-3">
                        Gerenciador Diário
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground">
                        Selecione um funcionário para ver suas tarefas
                    </p>
                </div>

                {loading ? (
                    <Loading text="Carregando equipe..." className="py-20" />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
                        {employees.map((employee) => (
                            <button
                                key={employee.id}
                                onClick={() => navigate(`/tasks?employeeId=${employee.id}`)}
                                className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                                    {employee.photo ? (
                                        <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-blue-200 flex items-center justify-center">
                                            <User className="h-12 w-12 sm:h-16 sm:w-16 text-primary/60" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-base sm:text-lg leading-tight">{employee.name}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{employee.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && employees.length === 0 && (
                    <p className="text-center text-muted-foreground py-20 text-lg">
                        Nenhum funcionário cadastrado.
                    </p>
                )}
            </div>
        );
    }

    // Admin/Employee View - Full management interface
    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex justify-between items-center border-b pb-3 sm:pb-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Minha Equipe
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground mt-1 sm:mt-2">
                        {canManageEmployees ? 'Gerencie os funcionários da casa' : 'Visualize a equipe'}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* Add New Employee Card - Only for Admin */}
                {canManageEmployees && (
                    <Card
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group min-h-[250px]"
                        onClick={() => navigate('/employees/new')}
                    >
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                            <Plus className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">Adicionar Novo</h3>
                        <p className="text-sm text-muted-foreground text-center mt-2">Cadastrar um novo funcionário</p>
                    </Card>
                )}

                {/* Employee List */}
                {loading ? (
                    <div className="md:col-span-3">
                        <Loading text="Carregando equipe..." className="py-10" />
                    </div>
                ) : employees.map((employee) => {
                    const isAdmin = employee.role === 'admin' || employee.id === ADMIN_EMPLOYEE_ID;

                    return (
                        <Card
                            key={employee.id}
                            className={`relative group overflow-hidden hover:shadow-lg transition-all min-h-[250px] flex flex-col ${isAdmin
                                    ? 'border-2 border-amber-400 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10'
                                    : ''
                                }`}
                        >
                            {/* Admin Badge */}
                            {isAdmin && (
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                    <Crown className="h-3.5 w-3.5 fill-current" />
                                    Administrador
                                </div>
                            )}

                            {/* Edit and Delete Buttons - Only for Admin, but NOT for admin employee */}
                            {canManageEmployees && !isAdmin && (
                                <div className="hidden md:flex absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 gap-2">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/employees/${employee.id}`);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow-sm"
                                        onClick={(e) => handleDelete(employee.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <CardContent className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                                <div
                                    className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ring-4 shadow-md cursor-pointer md:hover:scale-105 transition-all duration-300 relative ${isAdmin
                                            ? 'bg-gradient-to-br from-amber-300/40 to-yellow-300/40 ring-amber-300 md:hover:ring-amber-400'
                                            : 'bg-gradient-to-br from-primary/20 to-blue-200 ring-background md:hover:ring-primary'
                                        }`}
                                    onClick={() => navigate(`/tasks?employeeId=${employee.id}`)}
                                    title="Ver tarefas deste funcionário"
                                >
                                    {employee.photo ? (
                                        <img src={employee.photo} alt={employee.name} className="h-24 w-24 rounded-full object-cover" />
                                    ) : (
                                        <User className="h-12 w-12 text-primary/60" />
                                    )}

                                    {taskCounts[employee.id] > 0 && (
                                        <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md animate-in zoom-in">
                                            {taskCounts[employee.id]}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold truncate w-full">{employee.name}</h3>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
