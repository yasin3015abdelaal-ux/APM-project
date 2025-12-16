import { createContext, useContext, useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

const AdminContext = createContext();

export const useAdminAuth = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if admin is logged in
    useEffect(() => {
        const storedToken = localStorage.getItem("adminToken");
        const storedAdmin = localStorage.getItem("adminData");

        if (storedToken && storedAdmin) {
            setToken(storedToken);
            setAdmin(JSON.parse(storedAdmin));
        }
        setLoading(false);
    }, []);

    const login = (token, adminData) => {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminData", JSON.stringify(adminData));
        setToken(token);
        setAdmin(adminData);
    };

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminSelectedCountryId");
        setAdmin(null);
        setToken(null);
    };

    return (
        <AdminContext.Provider 
            value={{ 
                admin, 
                token, 
                loading, 
                isAuthenticated: !!token,
                login, 
                logout 
            }}
        >
            {children}
        </AdminContext.Provider>
    );
};

// Protected Route for Admin
export const ProtectedAdminRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAdminAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }
    
    return children || <Outlet />;
};