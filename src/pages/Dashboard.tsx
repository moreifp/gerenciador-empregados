import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, User } from 'lucide-react';
import { Employee } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
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

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex justify-between items-center border-b pb-3 sm:pb-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Minha Equipe
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground mt-1 sm:mt-2">
                        Gerencie os funcionários da casa
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* Add New Employee Card */}
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

                {/* Employee List */}
                {loading ? (
                    <div className="md:col-span-3 text-center py-10 text-muted-foreground">Carregando...</div>
                ) : employees.map((employee) => (
                    <Card
                        key={employee.id}
                        className="relative group overflow-hidden hover:shadow-lg transition-all min-h-[250px] flex flex-col"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-sm"
                                onClick={(e) => handleDelete(employee.id, e)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <CardContent className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                            <div
                                className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-blue-200 flex items-center justify-center mb-4 ring-4 ring-background shadow-md cursor-pointer hover:scale-105 hover:ring-primary transition-all duration-300"
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
                            <p className="text-sm font-medium text-primary/80 mb-2">{employee.role}</p>

                            <div className="mt-4 w-full pt-4 border-t text-sm text-muted-foreground flex flex-col gap-1">
                                <span className="truncate">{employee.phone}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

