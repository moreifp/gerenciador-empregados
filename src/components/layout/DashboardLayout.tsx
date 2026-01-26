
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
    const { logout } = useAuth();
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
    ];

    return (
        <aside className="w-64 bg-card h-full flex flex-col">
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
                        onClick={onClose}
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isKiosk = role === 'kiosk';

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Mobile Hamburger - Only for Admin */}
            {!isKiosk && role === 'admin' && (
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden fixed top-4 right-4 z-50 p-2 bg-card border rounded-md shadow-sm"
                >
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            )}

            {/* Sidebar - Responsive */}
            {!isKiosk && (
                <div className={cn(
                    "fixed inset-y-0 left-0 z-40 bg-background transition-transform duration-300 transform md:relative md:translate-x-0 border-r border-border",
                    isSidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full md:shadow-none"
                    // If not admin, maybe we shouldn't hide it on mobile? Or should we?
                    // User request specifically mentions "hamburger visible ONLY for admin".
                    // This implies employees might NOT have a way to toggle it on mobile if we hide it?
                    // Or maybe employees should always see it?
                    // Let's assume employees see the sidebar normally on desktop, but on mobile...
                    // if hamburger is ONLY for admin, employees on mobile might be stuck without nav?
                    // "no mobile, implemente o "aside" com um hhamburguer visivel somente para o admin"
                    // If I'm an employee on mobile, I see... nothing? Or always open?
                    // Usually "hamburger only for admin" implies valid navigation control.
                    // But if employee has no hamburger, how do they navigate?
                    // Maybe the user implies the employee view is simpler and doesn't need the sidebar on mobile (just tasks list)?
                    // Or maybe the menu should always be there but only Admin gets the toggler?
                    // Let's follow "hamburger ONLY for admin" literally.
                )}>
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </div>
            )}

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && !isKiosk && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

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
