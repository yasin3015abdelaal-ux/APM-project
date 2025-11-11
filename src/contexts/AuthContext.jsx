import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("userData");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));

            // Set default axios authorization header
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        }

        setLoading(false);
    }, []);

    // Login function
    const login = (token, userData) => {
        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        setToken(token);
        setUser(userData);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
    };

    // Update user data
    const updateUser = (userData) => {
        localStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
