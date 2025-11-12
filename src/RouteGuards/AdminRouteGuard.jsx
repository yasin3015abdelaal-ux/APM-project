import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "./AdminContext";
import Loader from "../components/Ui/Loader/Loader";

export const ProtectedAdminRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAdminAuth();
    if (loading) return <Loader />;
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }
    return children ? children : <Outlet />;
};
