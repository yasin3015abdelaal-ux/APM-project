import axios from "axios";
import { cachedAPICall, apiCache } from './utils/apiCache';
import { withCacheInvalidation, invalidateCacheById } from './utils/cacheInvalidation';

const BASE_URL = "https://api.world-apm.com";

const USER_BASE = `${BASE_URL}/api`;
const ADMIN_BASE = `${BASE_URL}/admin`;
const ADMIN_CHAT_BASE = `${BASE_URL}/api/admin/chat`;

export const userAPI = axios.create({
    baseURL: USER_BASE,
    headers: { "Content-Type": "application/json" },
});

export const adminAPI = axios.create({
    baseURL: ADMIN_BASE,
    headers: { "Content-Type": "application/json" },
});

export const adminChatAPI = axios.create({
    baseURL: ADMIN_CHAT_BASE,
    headers: { "Content-Type": "application/json" },
});

export const adminChatMessagesAPI = axios.create({
    baseURL: `${BASE_URL}/admin/chat`,
    headers: { "Content-Type": "application/json" },
});

export const chatMessagesAPI = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { "Content-Type": "application/json" },
});

userAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

userAPI.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const isAuthRequest = err.config?.url?.includes('/login') ||
                err.config?.url?.includes('/register');
            const hasToken = localStorage.getItem("authToken");

            if (!isAuthRequest && hasToken) {
                localStorage.removeItem("authToken");
                localStorage.removeItem("userData");
                window.location.href = "/login";
            }
        }
        return Promise.reject(err);
    }
);

adminAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

adminAPI.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const isAuthRequest = err.config?.url?.includes('/login');
            const isInDashboard = window.location.pathname.startsWith('/dashboard');

            if (!isAuthRequest && isInDashboard) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminData");
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(err);
    }
);

adminChatAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

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

adminChatMessagesAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

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

chatMessagesAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

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

export const authAPI = {
    login: (data) => userAPI.post("/login", data),
    register: (data) => userAPI.post("/register", data),
    logout: () => userAPI.post("/logout"),
};

export const adminAuthAPI = {
    login: (data) => adminAPI.post("/login", data),
    logout: () => adminAPI.post("/logout"),
};

export const dataAPI = {
    getCountries: () => userAPI.get("/countries"),
    getGovernorates: (country_id) => userAPI.get(`/governorates?country_id=${country_id}`),
    getActivityTypes: () => userAPI.get(`/activity_types`),
    getAboutUs: () => userAPI.get('/about-us'),
    getTerms: () => userAPI.get('/terms-and-conditions'),
    getAnnouncement: () => userAPI.get('/announcements'),
};

export const auctionAPI = {
    getAllAuctions: () => userAPI.get('/auctions'),
    participate: (date, role) =>
        withCacheInvalidation(
            () => userAPI.post(`/auctions/participate`, { date, role }),
            ['auctions']
        ),
    role: (auctionId) =>
        userAPI.get(`/auctions/${auctionId}/my-role`),
    getProducts: (auctionId) =>
        userAPI.get(`/auctions/${auctionId}/products`),
    getMyProducts: (auctionId) =>
        userAPI.get(`/auctions/${auctionId}/my-products`),
    getMyPrevProducts: (auctionId, userId) =>
        userAPI.get(`/auctions/${auctionId}/products?by_user=${userId}`),
    addProductToAuction: (auctionId, data) =>
        withCacheInvalidation(
            () => userAPI.post(`/auctions/${auctionId}/products`, data),
            ['auctions', 'auction_products']
        ).then(response => {
            invalidateCacheById('auction_products', auctionId);
            invalidateCacheById('my_auction_products', auctionId);
            return response;
        }),
};

export const chatAPI = {
    getConversations: (params = {}) =>
        userAPI.get('/conversations', { params }),
    createConversation: (data) =>
        withCacheInvalidation(
            () => userAPI.post('/conversations', data),
            ['conversations']
        ),
    getConversation: (conversationId) =>
        userAPI.get(`/conversations/${conversationId}`),
    getMessages: (conversationId, params = { page: 1, limit: 50 }) =>
        userAPI.get(`/conversations/${conversationId}/messages`, { params }),
    sendMessage: (conversationId, message) =>
        withCacheInvalidation(
            () => userAPI.post(`/conversations/${conversationId}/messages`, { message }),
            ['conversations', 'messages']
        ),
    markAsRead: (conversationId) =>
        withCacheInvalidation(
            () => userAPI.post(`/conversations/${conversationId}/mark-read`),
            ['conversations']
        ),
    getUnreadCount: () =>
        userAPI.get('/messages/unread-count'),
};

export const reviewAPI = {
    createReview: (data) =>
        withCacheInvalidation(
            () => userAPI.post('/seller-reviews', data),
            ['reviews']
        ),
    updateReview: (reviewId, data) =>
        withCacheInvalidation(
            () => userAPI.put(`/seller-reviews/${reviewId}`, data),
            ['reviews']
        ),
    deleteReview: (reviewId) =>
        withCacheInvalidation(
            () => userAPI.delete(`/seller-reviews/${reviewId}`),
            ['reviews']
        ),
    getMyReview: (sellerId) =>
        userAPI.get(`/seller-reviews/my-review/${sellerId}`),
};

export const articlesAPI = {
    getAllArticles: (params = {}) => 
        userAPI.get('/articles', { params }),
    getArticleDetails: (articleId) => 
        userAPI.get(`/articles/${articleId}`),
};

export const topSellersAPI = {
    getTopSellers: (params = { limit: 10, min_reviews: 5 }) =>
        userAPI.get('/top-sellers', { params }),
    getSellerReviews: (sellerId, params = { page: 1 }) =>
        userAPI.get(`/seller-reviews/${sellerId}`, { params }),
};

export const getCachedAdvertisements = async () => {
    return await cachedAPICall(
        'advertisements',
        async () => {
            const response = await userAPI.get('/advertisements');
            return response.data.data || response.data || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedProducts = async () => {
    return await cachedAPICall(
        'products',
        async () => {
            const response = await userAPI.get('/products');
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedGovernorates = async (country_id = 1) => {
    return await cachedAPICall(
        `governorates_${country_id}`,
        async () => {
            const response = await userAPI.get(`/governorates?country_id=${country_id}`);
            return response.data.data?.governorates || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedLivestockPrices = async (params) => {
    const { product_type, governorate_id, year } = params;
    const cacheKey = `livestock_${product_type}_${governorate_id}_${year}`;

    return await cachedAPICall(
        cacheKey,
        async () => {
            const response = await userAPI.get("/livestock-prices/averages", { params });
            return response.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedCountries = async () => {
    return await cachedAPICall(
        'countries',
        async () => {
            const response = await dataAPI.getCountries();
            return response.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedActivityTypes = async () => {
    return await cachedAPICall(
        'activity_types',
        async () => {
            const response = await dataAPI.getActivityTypes();
            return response.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedAboutUs = async () => {
    return await cachedAPICall(
        'about_us',
        async () => {
            const response = await dataAPI.getAboutUs();
            return response.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedTerms = async () => {
    return await cachedAPICall(
        'terms',
        async () => {
            const response = await dataAPI.getTerms();
            return response.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedConversations = async (params = {}) => {
    const paramsKey = JSON.stringify(params);
    return await cachedAPICall(
        `conversations_${paramsKey}`,
        async () => {
            const response = await chatAPI.getConversations(params);
            return response.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedCategories = async () => {
    return await cachedAPICall(
        'categories',
        async () => {
            const response = await userAPI.get('/categories');
            return response.data.data.product_categories || [];
        },
        { ttl: 60 * 60 * 1000 } 
    );
};

export const getCachedMyProducts = async () => {
    return await cachedAPICall(
        'my_products',
        async () => {
            const response = await userAPI.get('/products/my-products');
            return response.data.data || [];
        },
        { ttl: 60 * 60 * 1000 } 
    );
};

export const getCachedAuctionProducts = async (auctionId) => {
    return await cachedAPICall(
        `auction_products_${auctionId}`,
        async () => {
            const response = await auctionAPI.getProducts(auctionId);
            return response.data?.data || response.data || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedAuctionRole = async (auctionId) => {
    return await cachedAPICall(
        `auction_role_${auctionId}`,
        async () => {
            const response = await auctionAPI.role(auctionId);
            return response.data;
        },
        { ttl: 60 * 60 * 1000 } 
    );
};

export const getCachedAuctions = async () => {
    return await cachedAPICall(
        'auctions',
        async () => {
            const response = await auctionAPI.getAllAuctions();
            return response.data?.data || [];
        },
        { ttl: 60 * 60 * 1000 } 
    );
};

export const getCachedMyAuctionProducts = async (auctionId) => {
    return await cachedAPICall(
        `my_auction_products_${auctionId}`,
        async () => {
            const response = await auctionAPI.getMyProducts(auctionId);
            return response.data.data || [];
        },
        { ttl: 60 * 60 * 1000 } 
    );
};

export const getCachedMyPrevProducts = async (auctionId, userId) => {
    return await cachedAPICall(
        `prev_auction_products_${auctionId}_${userId}`,
        async () => {
            const response = await auctionAPI.getMyPrevProducts(auctionId, userId);
            return response.data?.data || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedArticles = async (params = {}) => {
    const paramsKey = JSON.stringify(params);
    return await cachedAPICall(
        `articles_${paramsKey}`,
        async () => {
            const response = await articlesAPI.getAllArticles(params);
            return response.data.data?.articles || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedArticleDetails = async (articleId) => {
    return await cachedAPICall(
        `article_${articleId}`,
        async () => {
            const response = await articlesAPI.getArticleDetails(articleId);
            return response.data.data;
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const getCachedTopSellers = async (params = { limit: 10, min_reviews: 5 }) => {
    const paramsKey = JSON.stringify(params);
    return await cachedAPICall(
        `top_sellers_${paramsKey}`,
        async () => {
            const response = await topSellersAPI.getTopSellers(params);
            return response.data?.data || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};

export const clearCache = (key) => {
    apiCache.delete(key);
};

export const clearAllCache = () => {
    apiCache.clear();
};

export const refreshCachedData = async (cacheKey, apiCallFunction, ttl) => {
    return await cachedAPICall(cacheKey, apiCallFunction, { ttl, forceRefresh: true });
};