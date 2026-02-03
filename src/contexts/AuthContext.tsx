import { createContext, useContext, useState, ReactNode } from 'react';

// Administrator employee ID from Supabase employees table
export const ADMIN_EMPLOYEE_ID = '940f117c-c854-4450-a1fa-caaa28d3a5f0';

type UserRole = 'admin' | 'employee' | 'kiosk' | null;

interface User {
    id: string;
    name: string;
    role: UserRole;
    photo?: string;
}

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loginAdmin: (password: string) => boolean;
    loginEmployee: (employeeId: string, name: string, photo?: string) => void;
    loginKiosk: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isLoading] = useState(false);
    // const navigate = useNavigate(); // Can't use navigate here if AuthProvider is outside Router

    const loginAdmin = (password: string) => {
        if (password === '2408') { // Simple hardcoded check
            const adminUser: User = { id: ADMIN_EMPLOYEE_ID, name: 'Administrador', role: 'admin' };
            setUser(adminUser);
            localStorage.setItem('user', JSON.stringify(adminUser));
            return true;
        }
        return false;
    };

    const loginEmployee = (employeeId: string, name: string, photo?: string) => {
        const empUser: User = { id: employeeId, name, role: 'employee', photo };
        setUser(empUser);
        localStorage.setItem('user', JSON.stringify(empUser));
    };

    const loginKiosk = () => {
        const kioskUser: User = { id: 'kiosk', name: 'Painel Central', role: 'kiosk' };
        setUser(kioskUser);
        localStorage.setItem('user', JSON.stringify(kioskUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            role: user?.role || null,
            loginAdmin,
            loginEmployee,
            loginKiosk,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
