import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Ui/Loader/Loader";

export const ProtectedRoute = ({ children, allowGuest = false }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (allowGuest) {
        return children ? children : <Outlet />;
    }

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

export const VerifiedRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isVerified = user?.verified_account === 1 || user?.verified_account === "1";

    if (!isVerified) {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};