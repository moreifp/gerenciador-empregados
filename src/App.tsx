import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Employees from '@/pages/Employees';
import EmployeeForm from '@/pages/EmployeeForm';
import Tasks from '@/pages/Tasks';
import TaskForm from '@/pages/TaskForm';
import Dashboard from '@/pages/Dashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="employees/new" element={<EmployeeForm />} />
                    <Route path="employees/:id" element={<EmployeeForm />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="tasks/new" element={<TaskForm />} />
                    <Route path="tasks/:id" element={<TaskForm />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
