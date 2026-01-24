export interface Employee {
    id: string;
    name: string;
    role: string;
    photoUrl?: string; // Optional for now
    address: string;
    phone: string;
    admissionDate: string;
    bankDetails: {
        bank: string;
        agency: string;
        account: string;
        pix?: string;
    };
    documents: {
        cpf: string;
        rg: string;
    };
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskType = 'routine' | 'one_off';

export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string; // Employee ID
    type: TaskType;
    dueDate: string; // ISO Date String
    status: TaskStatus;
    recurrence?: 'daily' | 'weekly' | 'monthly';
    proof?: {
        photoUrl?: string;
        audioUrl?: string;
        comment?: string;
        completedAt: string;
    };
    createdAt: string;
}
