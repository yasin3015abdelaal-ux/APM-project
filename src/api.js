import axios from "axios";

// Base URL 
export const API_BASE_URL = "https://api.world-apm.com/api";

// axios instance 
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor 
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/login');
        
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// API Endpoints
export const authAPI = {
    login: (credentials) => api.post("/login", credentials),

    register: (data) => api.post("/register", data),

    logout: () => api.post("/logout"),

    // getProfile: () => api.get("/profile"),

    // updateProfile: (data) => api.put("/profile", data),
};

export const dataAPI = {
    getCountries: () => api.get("/countries"),

    getGovernorates: (countryId) =>
        api.get("/governorates", { params: { country_id: countryId } }),

    getActivityTypes: () => api.get("/activity_types"),
};

export default api;