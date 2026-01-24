import React, { useState } from 'react';
import { Plus, Search, User, MapPin, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Employee } from '@/types';

// Mock Initial Data
const initialEmployees: Employee[] = [
    {
        id: '1',
        name: 'Maria Silva',
        role: 'Cozinheira',
        address: 'Rua das Flores, 123',
        phone: '(11) 99999-9999',
        admissionDate: '2023-01-15',
        bankDetails: {
            bank: 'Nubank',
            agency: '0001',
            account: '123456-7'
        },
        documents: { cpf: '123.456.789-00', rg: '12.345.678-9' }
    },
    {
        id: '2',
        name: 'João Santos',
        role: 'Jardineiro',
        address: 'Av. Brasil, 456',
        phone: '(11) 98888-8888',
        admissionDate: '2023-03-20',
        bankDetails: {
            bank: 'Itaú',
            agency: '1234',
            account: '54321-0'
        },
        documents: { cpf: '987.654.321-00', rg: '98.765.432-1' }
    }
];

export default function Employees() {
    const [employees] = useState<Employee[]>(initialEmployees);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Funcionários</h2>
                    <p className="text-muted-foreground">Gerencie sua equipe doméstica</p>
                </div>
                <Button className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou cargo..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEmployees.map((employee) => (
                    <Card key={employee.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {employee.photoUrl ? (
                                    <img src={employee.photoUrl} alt={employee.name} className="h-12 w-12 rounded-full object-cover" />
                                ) : (
                                    employee.name.charAt(0)
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-base">{employee.name}</CardTitle>
                                <CardDescription>{employee.role}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{employee.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{employee.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{employee.bankDetails.bank} • Ag {employee.bankDetails.agency}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Adm: {new Date(employee.admissionDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
