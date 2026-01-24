
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
    ];

    return (
        <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Gerenciador
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-muted-foreground hover:text-destructive transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export const DashboardLayout = () => {
    const { role } = useAuth();
    const isKiosk = role === 'kiosk';

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Only show sidebar for admin and employee */}
            {!isKiosk && <Sidebar />}

            <main className="flex-1 overflow-auto">
                <div className={cn(
                    "max-w-7xl mx-auto",
                    isKiosk ? "p-6 sm:p-8 md:p-12" : "p-8"
                )}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
