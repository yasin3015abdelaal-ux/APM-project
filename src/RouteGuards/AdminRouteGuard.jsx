import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "./AdminContext";

export const ProtectedAdminRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAdminAuth();
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }
    return children ? children : <Outlet />;
};
