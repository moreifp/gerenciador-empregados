import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, User, Pencil } from 'lucide-react';
import { Employee } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
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
            if (data) setEmployees(data as any);
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
                    <div className="text-center py-20 text-muted-foreground text-xl">Carregando...</div>
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
                    <div className="md:col-span-3 text-center py-10 text-muted-foreground">Carregando...</div>
                ) : employees.map((employee) => (
                    <Card
                        key={employee.id}
                        className="relative group overflow-hidden hover:shadow-lg transition-all min-h-[250px] flex flex-col"
                    >
                        {/* Edit and Delete Buttons - Only for Admin */}
                        {canManageEmployees && (
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
                                className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-blue-200 flex items-center justify-center mb-4 ring-4 ring-background shadow-md cursor-pointer md:hover:scale-105 md:hover:ring-primary transition-all duration-300"
                                onClick={() => navigate(`/tasks?employeeId=${employee.id}`)}
                                title="Ver tarefas deste funcionário"
                            >
                                {employee.photo ? (
                                    <img src={employee.photo} alt={employee.name} className="h-24 w-24 rounded-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-primary/60" />
                                )}
                            </div>

                            <h3 className="text-xl font-bold truncate w-full">{employee.name}</h3>


                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
