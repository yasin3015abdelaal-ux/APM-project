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
            const isAuthRequest = err.config?.url?.includes('/login') ||
                err.config?.url?.includes('/register');

            if (!isAuthRequest) {
                localStorage.removeItem("authToken");
                localStorage.removeItem("userData");
                window.location.href = "/login";
            }
        }
        return Promise.reject(err);
    }
);

// ADMIN API
const ADMIN_BASE = "https://api.world-apm.com/admin";
const ADMIN_CHAT_BASE = "https://api.world-apm.com/api/admin/chat";

export const adminAPI = axios.create({
    baseURL: ADMIN_BASE,
    headers: { "Content-Type": "application/json" },
});

export const adminChatAPI = axios.create({
    baseURL: ADMIN_CHAT_BASE,
    headers: { "Content-Type": "application/json" },
});

// Admin Chat Messages API (different base URL for messages endpoints)
export const adminChatMessagesAPI = axios.create({
    baseURL: "https://api.world-apm.com/admin/chat",
    headers: { "Content-Type": "application/json" },
});

export const chatMessagesAPI = axios.create({
    baseURL: "https://api.world-apm.com/api",
    headers: { "Content-Type": "application/json" },
});

// Add token for chatMessagesAPI
chatMessagesAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

// Handle admin logout on 401 for chatMessagesAPI
chatMessagesAPI.interceptors.response.use(
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

// Add token for admin
adminAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

adminChatAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

adminChatMessagesAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

// Handle admin logout on 401
adminAPI.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const isAuthRequest = err.config?.url?.includes('/login');

            if (!isAuthRequest) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminData");
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(err);
    }
);

adminChatAPI.interceptors.response.use(
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

adminChatMessagesAPI.interceptors.response.use(
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

// Shared Data (Countries, governorates, activity_types)
export const dataAPI = {
    getCountries: () => userAPI.get("/countries"),
    getGovernorates: (country_id) => userAPI.get(`/governorates?country_id=${country_id}`),
    getActivityTypes: () => userAPI.get(`/activity_types`),
};

// Auction endpoints
export const auctionAPI = {
    getAllAuctions: () => userAPI.get('/auctions'),
    participate: (date, role) => 
        userAPI.post(`/auctions/participate`, { date, role }),
    role: (auctionId) => 
        userAPI.get(`/auctions/${auctionId}/my-role`),
    getProducts: (auctionId) => 
        userAPI.get(`/auctions/${auctionId}/products`),
    getMyProducts: (auctionId) => 
        userAPI.get(`/auctions/${auctionId}/my-products`),
    getPreviousProducts: () => 
        userAPI.get(`/auctions/my-previous-products`),
    addProductToAuction: (auctionId, data) =>
        userAPI.post(`/auctions/${auctionId}/products`, data),
};