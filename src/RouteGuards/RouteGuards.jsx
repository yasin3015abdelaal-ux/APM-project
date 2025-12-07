import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Ui/Loader/Loader";

export const ProtectedRoute = ({ children, allowGuest = false }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    // If route allows guest access, render content
    if (allowGuest) {
        return children ? children : <Outlet />;
    }

    // If user not authenticated and route doesn't allow guest, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children ? children : <Outlet />;
};

export const PublicRoute = ({ children, restricted = false }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (restricted && isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};