import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';

export default function Login() {
    const [adminPass, setAdminPass] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const { loginAdmin, loginEmployee, loginKiosk } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployees = async () => {
            const { data } = await supabase.from('employees').select('*').eq('active', true);
            if (data) setEmployees(data as any);
            setLoading(false);
        };
        fetchEmployees();
    }, []);

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (loginAdmin(adminPass)) {
            navigate('/');
        } else {
            alert('Senha incorreta!');
        }
    };

    const handleEmployeeLogin = (emp: Employee) => {
        loginEmployee(emp.id, emp.name, emp.photo);
        navigate('/tasks'); // Employees go straight to tasks
    };

    const handleKioskLogin = () => {
        loginKiosk();
        navigate('/'); // Kiosk goes to Dashboard
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Gerenciador Diário</CardTitle>
                    <CardDescription>Identifique-se para continuar</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="employee">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="employee">Funcionário</TabsTrigger>
                            <TabsTrigger value="admin">Admin</TabsTrigger>
                            <TabsTrigger value="kiosk">Painel</TabsTrigger>
                        </TabsList>

                        <TabsContent value="employee" className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">Carregando equipe...</div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Nenhum funcionário encontrado. Entre como Admin para cadastrar.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {employees.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleEmployeeLogin(emp)}
                                            className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-secondary/50 transition-colors gap-3"
                                        >
                                            <div className="h-16 w-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                                {emp.photo ? (
                                                    <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-8 w-8 m-auto mt-3 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-sm leading-tight">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{emp.role}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="admin">
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Senha de Administrador</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            className="pl-9"
                                            placeholder="••••••••"
                                            value={adminPass}
                                            onChange={(e) => setAdminPass(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Entrar como Admin</Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="kiosk" className="space-y-4">
                            <div className="text-center space-y-4 py-4">
                                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                                    <Monitor className="h-10 w-10" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Modo Dashboard Central</h3>
                                    <p className="text-sm text-muted-foreground px-4">
                                        Use este modo na tela da cozinha/sala. Acesso apenas visualização.
                                    </p>
                                </div>
                                <Button onClick={handleKioskLogin} className="w-full" variant="outline">
                                    Ativar Modo Painel
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
