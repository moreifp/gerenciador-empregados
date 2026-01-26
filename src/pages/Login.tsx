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

    // Employee auth states
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [employeePass, setEmployeePass] = useState('');
    const [error, setError] = useState('');

    const { loginAdmin, loginEmployee, loginKiosk, user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role === 'employee') {
                navigate('/tasks');
            } else {
                navigate('/');
            }
        }
    }, [user, isLoading, navigate]);

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

    const handleEmployeeLoginSubmit = () => {
        if (!selectedEmployee) return;

        // Validation logic: last 4 digits of phone
        const cleanPhone = selectedEmployee.phone?.replace(/\D/g, '') || '';
        const last4 = cleanPhone.slice(-4);

        if (!selectedEmployee.phone || cleanPhone.length < 4) {
            // Fallback for employees without valid phone: ask admin to set it up
            setError('Este funcionário não tem telefone cadastrado. Contate o suporte.');
            return;
        }

        if (employeePass === last4) {
            loginEmployee(selectedEmployee.id, selectedEmployee.name, selectedEmployee.photo);
            navigate('/tasks');
        } else {
            setError('Senha incorreta. Use os últimos 4 dígitos do seu telefone.');
        }
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
                            ) : selectedEmployee ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                                        <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                                            {selectedEmployee.photo ? (
                                                <img src={selectedEmployee.photo} alt={selectedEmployee.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-6 w-6 m-auto mt-2 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{selectedEmployee.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedEmployee.role}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-auto"
                                            onClick={() => {
                                                setSelectedEmployee(null);
                                                setEmployeePass('');
                                                setError('');
                                            }}
                                        >
                                            Trocar
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Senha de Acesso</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                placeholder="Últimos 4 dígitos do telefone"
                                                value={employeePass}
                                                onChange={(e) => {
                                                    setEmployeePass(e.target.value);
                                                    setError('');
                                                }}
                                                maxLength={4}
                                            />
                                        </div>
                                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            Senha inicial: Últimos 4 dígitos do seu celular cadastrado.
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleEmployeeLoginSubmit}
                                        disabled={!employeePass}
                                    >
                                        Entrar
                                    </Button>
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Nenhum funcionário encontrado. Entre como Admin para cadastrar.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {employees.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => setSelectedEmployee(emp)}
                                            className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-secondary/50 transition-colors gap-3 bg-white"
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
