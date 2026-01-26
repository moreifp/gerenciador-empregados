import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import EmployeeForm from '@/pages/EmployeeForm';
import Tasks from '@/pages/Tasks';
import TaskForm from '@/pages/TaskForm';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

import { Loading } from '@/components/ui/loading';

// Simple protection wrapper
function ProtectedLayout() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <Loading fullScreen />;
    if (!user) return <Navigate to="/login" replace />;
    return <DashboardLayout />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<ProtectedLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="employees/new" element={<EmployeeForm />} />
                        <Route path="employees/:id" element={<EmployeeForm />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="tasks/new" element={<TaskForm />} />
                        <Route path="tasks/:id" element={<TaskForm />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
