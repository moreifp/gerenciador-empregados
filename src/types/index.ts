export interface Employee {
    id: string;
    name: string;
    role: string;
    photo?: string; // Base64 or URL
    photoUrl?: string; // Legacy
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
    assignedTo?: string; // Employee ID - optional for shared tasks
    isShared?: boolean; // True if task is for all employees
    type: TaskType;
    dueDate: string; // ISO Date String
    status: TaskStatus;
    recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrenceDay?: number; // 0-6 for weekly, 1-31 for monthly
    proof?: {
        photoUrl?: string;
        audioUrl?: string;
        comment?: string;
        completedAt: string;
    };
    createdAt: string;
}
