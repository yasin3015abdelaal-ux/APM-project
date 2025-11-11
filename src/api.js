import axios from "axios";

// USER API
const USER_BASE = "https://api.world-apm.com/api";

export const userAPI = axios.create({
    baseURL: USER_BASE,
    headers: { "Content-Type": "application/json" },
});

// Add token for user
userAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle user logout on 401
userAPI.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

// ADMIN API
const ADMIN_BASE = "https://api.world-apm.com/admin";

export const adminAPI = axios.create({
    baseURL: ADMIN_BASE,
    headers: { "Content-Type": "application/json" },
});

// Add token for admin
adminAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle admin logout on 401
adminAPI.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminData");
            window.location.href = "/admin/login";
        }
        return Promise.reject(err);
    }
);

// ENDPOINTS

// User Auth
export const authAPI = {
    login: (data) => userAPI.post("/login", data),
    register: (data) => userAPI.post("/register", data),
    logout: () => userAPI.post("/logout"),
};

// Admin Auth
export const adminAuthAPI = {
    login: (data) => adminAPI.post("/login", data),
    logout: () => adminAPI.post("/logout"),
};

// Shared Data (Countries, Cities, etc)
export const dataAPI = {
    getCountries: () => userAPI.get("/countries"),
    getCities: (id) => userAPI.get(`/countries/${id}/cities`),
};