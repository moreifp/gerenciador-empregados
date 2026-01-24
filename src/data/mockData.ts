import { Employee } from '@/types';

export const initialEmployees: Employee[] = [
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
