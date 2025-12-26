import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Permission } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermissions?: Permission[];
    requireAny?: boolean; // If true, user needs ANY of the permissions. If false, needs ALL
    allowedRoles?: string[];
}

const ProtectedRoute = ({
    children,
    requiredPermissions = [],
    requireAny = false,
    allowedRoles = [],
}: ProtectedRouteProps) => {
    const { currentUser, isAuthenticated, isLoading, hasPermission, hasAnyPermission } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check permission-based access
    if (requiredPermissions.length > 0) {
        const hasAccess = requireAny
            ? hasAnyPermission(requiredPermissions)
            : requiredPermissions.every(p => hasPermission(p));

        if (!hasAccess) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
