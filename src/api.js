import axios from "axios";
import { cachedAPICall, apiCache } from './utils/apiCache';
import { withCacheInvalidation, invalidateCacheById } from './utils/cacheInvalidation';

const BASE_URL = "https://api.world-apm.com";

const USER_BASE = `${BASE_URL}/api`;
const ADMIN_BASE = `${BASE_URL}/admin`;
const ADMIN_CHAT_BASE = `${BASE_URL}/admin`;

export const userAPI = axios.create({
    baseURL: USER_BASE,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

export const adminAPI = axios.create({
    baseURL: ADMIN_BASE,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

export const adminChatAPI = axios.create({
    baseURL: ADMIN_CHAT_BASE,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    paramsSerializer: (params) => {
        // Custom serializer to include empty string params
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== null && value !== undefined) {
                searchParams.append(key, value === '' ? '' : String(value));
            }
        });
        return searchParams.toString();
    },
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

export const adminChatMessagesAPI = axios.create({
    baseURL: `${BASE_URL}/admin/chat`,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

export const chatMessagesAPI = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

// ====== Helper Function to get Country ID ======
const getCurrentCountryId = () => {
    try {
        const userData = localStorage.getItem("userData");
        if (userData) {
            const user = JSON.parse(userData);
            return user?.country?.id || user?.country_id || null;
        }
    } catch (error) {
        console.error("Error getting country_id:", error);
    }
    return 1;
};

// ====== Interceptors ======
userAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const countryId = getCurrentCountryId();
    config.headers['X-Country-Id'] = countryId;

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
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

    // Add country ID to headers if available
    const countryId = localStorage.getItem("adminSelectedCountryId");
    if (countryId) {
        config.headers["country_id"] = countryId;
        // Also add as X-country_id if backend expects that format
        config.headers["X-country_id"] = countryId;
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

    // Add country ID to headers if available
    const countryId = localStorage.getItem("adminSelectedCountryId");
    if (countryId) {
        config.headers["country_id"] = countryId;
        config.headers["X-country_id"] = countryId;
    }

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    // Log the exact URL being requested for debugging
    const fullUrl = `${config.baseURL}${config.url}${config.params ? '?' + (typeof config.paramsSerializer === 'function' ? config.paramsSerializer(config.params) : new URLSearchParams(config.params).toString()) : ''}`;
    console.log('Admin Chat API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: fullUrl,
        params: config.params,
        headers: config.headers
    });
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

    // Add country ID to headers if available
    const countryId = localStorage.getItem("adminSelectedCountryId");
    if (countryId) {
        config.headers["country_id"] = countryId;
        config.headers["X-country_id"] = countryId;
    }

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

// ====== Auth APIs ======
export const authAPI = {
    login: (data) => userAPI.post("/login", data),
    register: (data) => userAPI.post("/register", data),
    logout: () => userAPI.post("/logout"),
};

export const adminAuthAPI = {
    login: (data) => adminAPI.post("/login", data),
    logout: () => adminAPI.post("/logout"),
};

// ====== Data APIs ======
export const dataAPI = {
    getCountries: () => userAPI.get("/countries"),
    getGovernorates: (country_id) => userAPI.get(`/governorates?country_id=${country_id}`),
    getActivityTypes: () => userAPI.get(`/activity_types`),
    getAboutUs: () => userAPI.get('/about-us'),
    getTerms: () => userAPI.get('/terms-and-conditions'),
    getAnnouncement: () => userAPI.get('/announcements'),
    getSubCategories: (categoryId) => userAPI.get(`/categories/${categoryId}/subcategories`),
};

// ====== Auction APIs ======
export const auctionAPI = {
    getAllAuctions: () => userAPI.get('/auctions'),

    participate: async (date, role) => {
        const response = await withCacheInvalidation(
            () => userAPI.post(`/auctions/participate`, { date, role }),
            ['auctions']
        );
        return response;
    },

    role: (auctionId) => userAPI.get(`/auctions/${auctionId}/my-role`),

    getProducts: (auctionId) => userAPI.get(`/auctions/${auctionId}/products`),

    getMyProducts: (auctionId) => userAPI.get(`/auctions/${auctionId}/my-products`),

    addProductToAuction: async (auctionId, data) => {
        const response = await withCacheInvalidation(
            () => userAPI.post(`/auctions/${auctionId}/products`, data),
            ['auction_products', 'auctions']
        );

        invalidateCacheById('auction_products', auctionId);
        invalidateCacheById('my_auction_products', auctionId);

        return response;
    },
};

// ====== Delete profile API ======
export const profileAPI = {
    deleteAccount: async () => {
        const response = await withCacheInvalidation(
            () => userAPI.delete('/profile/delete-account'),
            ['profile', 'user']
        );
        return response;
    },
};

// ====== Chat APIs ======
export const chatAPI = {
    getConversations: (params = {}) => userAPI.get('/conversations', { params }),

    createConversation: async (data) => {
        const response = await withCacheInvalidation(
            () => userAPI.post('/conversations', data),
            ['conversations']
        );
        return response;
    },

    getConversation: (conversationId) =>
        userAPI.get(`/conversations/${conversationId}`),

    getMessages: (conversationId, params = { page: 1, limit: 50 }) =>
        userAPI.get(`/conversations/${conversationId}/messages`, { params }),

    sendMessage: async (conversationId, message) => {
        const response = await withCacheInvalidation(
            () => userAPI.post(`/conversations/${conversationId}/messages`, { message }),
            ['conversations', 'messages']
        );
        return response;
    },

    markAsRead: async (conversationId) => {
        const response = await withCacheInvalidation(
            () => userAPI.post(`/conversations/${conversationId}/mark-read`),
            ['conversations']
        );
        return response;
    },

    getUnreadCount: () => userAPI.get('/messages/unread-count'),
};

// ====== Review APIs ======
export const reviewAPI = {
    getAllReviews: (params = { page: 1, per_page: 15 }) =>
        userAPI.get('/seller-reviews', { params }),

    createReview: async (data) => {
        const response = await withCacheInvalidation(
            () => userAPI.post('/seller-reviews', data),
            ['reviews', 'all_reviews']
        );
        return response;
    },

    deleteReview: async (reviewId) => {
        const response = await withCacheInvalidation(
            () => userAPI.delete(`/seller-reviews/${reviewId}`),
            ['reviews', 'all_reviews']
        );
        return response;
    },
};

// ====== Report APIs ======
export const reportAPI = {
    getReportReasons: () => userAPI.get('/report-reasons'),

    createSellerReport: async (data) => {
        const response = await withCacheInvalidation(
            () => userAPI.post('/seller-reports', data),
            ['reports']
        );
        return response;
    },
};

// ====== Articles APIs ======
export const articlesAPI = {
    getAllArticles: (params = {}) => userAPI.get('/articles', { params }),

    getArticleDetails: (articleId) => userAPI.get(`/articles/${articleId}`),

    createArticle: async (data) => {
        const response = await withCacheInvalidation(
            () => userAPI.post('/articles', data),
            ['articles']
        );
        return response;
    },

    updateArticle: async (articleId, data) => {
        const response = await withCacheInvalidation(
            () => userAPI.put(`/articles/${articleId}`, data),
            ['articles']
        );

        invalidateCacheById('article', articleId);

        return response;
    },

    deleteArticle: async (articleId) => {
        const response = await withCacheInvalidation(
            () => userAPI.delete(`/articles/${articleId}`),
            ['articles']
        );
        return response;
    },
};

// ====== Top Sellers APIs ======
export const topSellersAPI = {
    getTopSellers: (params = { limit: 10, min_reviews: 5 }) =>
        userAPI.get('/top-sellers', { params }),

    getSellerReviews: (sellerId, params = { page: 1 }) =>
        userAPI.get(`/seller-reviews/${sellerId}`, { params }),
};

// ====== Product APIs ======
export const productAPI = {
    getAllProducts: () => userAPI.get('/products'),

    getMyProducts: () => userAPI.get('/products/my-products'),

    createProduct: async (data) => {
        const response = await withCacheInvalidation(
            () => userAPI.post('/products', data),
            ['products', 'my_products']
        );
        return response;
    },

    updateProduct: async (productId, data) => {
        const response = await withCacheInvalidation(
            () => userAPI.put(`/products/${productId}`, data),
            ['products', 'my_products']
        );
        return response;
    },

    deleteProduct: async (productId, reason = "product_sold") => {
        const response = await withCacheInvalidation(
            () => userAPI.delete(`/products/${productId}`, {
                data: { reason }
            }),
            ['products', 'my_products']
        );
        return response;
    },
};

// ====== Notification APIs ======
export const notificationAPI = {
    getNotifications: (params = { status: 'all', per_page: 15, type: '' }) =>
        userAPI.get('/notifications', { params }),

    markAsRead: async (notificationId) => {
        const response = await withCacheInvalidation(
            () => userAPI.post(`/notifications/${notificationId}/mark-read`),
            ['notifications', 'unread_count']
        );
        return response;
    },

    markAllAsRead: async () => {
        const response = await withCacheInvalidation(
            () => userAPI.post('/notifications/mark-all-read'),
            ['notifications', 'unread_count']
        );
        return response;
    },

    deleteNotification: async (notificationId) => {
        const response = await withCacheInvalidation(
            () => userAPI.delete(`/notifications/${notificationId}`),
            ['notifications', 'unread_count']
        );
        return response;
    },

    getUnreadCount: () => userAPI.get('/notifications/unread-count'),

    registerDeviceToken: (data) =>
        userAPI.post('/device-tokens', data),
};

export const searchAPI = {
    searchProducts: (query) => userAPI.get('/get_products', {
        params: { search: query }
    }),
};
// ====== Cached APIs ======
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
    const { product_type, governorate_id, year, month } = params;
    const cacheKey = `livestock_${product_type}_${governorate_id}_${year}_${month || 'all'}`;

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

export const getCachedSubCategories = async (categoryId) => {
    return await cachedAPICall(
        `subcategories_${categoryId}`,
        async () => {
            const response = await dataAPI.getSubCategories(categoryId);
            return response.data?.data || response.data?.subcategories || response.data || [];
        },
        { ttl: 60 * 60 * 1000 }
    );
};
export const getCachedMyProducts = async () => {
    return await cachedAPICall(
        'my_products',
        async () => {
            const response = await userAPI.get('/products/my-products');
            const products = response.data.data || [];
            
            const productsWithDetails = await Promise.all(
                products.map(async (product) => {
                    try {
                        const detailResponse = await userAPI.get(`/products/${product.id}`);
                        const detailData = detailResponse.data?.data || detailResponse.data;
                        
                        return {
                            ...product,
                            ...detailData, 
                            images: detailData.images || [],
                            image: detailData.image || product.image
                        };
                    } catch (error) {
                        console.error(`Error fetching details for product ${product.id}:`, error);
                        return product;
                    }
                })
            );
            
            return productsWithDetails;
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
            return response.data?.data || response.data;
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

// ====== Admin Management APIs ======
export const adminManagementAPI = {
    // Get all permissions
    getPermissions: () => adminAPI.get("/permissions"),

    // Get all admins
    getAdmins: (params = {}) => adminAPI.get("/admins", { params }),

    // Get single admin by ID
    getAdmin: (adminId) => adminAPI.get(`/admins/${adminId}`),

    // Create new admin
    createAdmin: async (data) => {
        const response = await withCacheInvalidation(
            () => adminAPI.post("/admins", data),
            ['admins']
        );
        return response;
    },

    // Update admin
    updateAdmin: async (adminId, data) => {
        const response = await withCacheInvalidation(
            () => adminAPI.put(`/admins/${adminId}`, data),
            ['admins']
        );
        invalidateCacheById('admin', adminId);
        return response;
    },

    // Delete admin
    deleteAdmin: async (adminId) => {
        const response = await withCacheInvalidation(
            () => adminAPI.delete(`/admins/${adminId}`),
            ['admins']
        );
        return response;
    },
};

// ====== Admin Notifications APIs ======
export const adminNotificationsAPI = {
    // Get notifications list with filters
    getNotifications: (params = {}) => {
        const queryParams = {
            per_page: params.per_page || 20,
            ...(params.user_id && { user_id: params.user_id }),
            ...(params.type && { type: params.type }),
            ...(params.status && { status: params.status }),
            ...(params.all && { all: params.all }),
            ...(params.page && { page: params.page }),
        };
        return adminAPI.get("/notifications", { params: queryParams });
    },

    // Get notification details
    getNotification: (notificationId) => adminAPI.get(`/notifications/${notificationId}`),

    // Send notification to specific users
    sendNotification: (data) => adminAPI.post("/notifications/send", data),

    // Broadcast notification by country
    broadcastNotification: (data) => adminAPI.post("/notifications/broadcast", data),

    // Get notification statistics
    getStatistics: (params = {}) => {
        const queryParams = {};
        if (params.user_id) {
            queryParams.user_id = params.user_id;
        }
        return adminAPI.get("/notifications/statistics", { params: queryParams });
    },
};

export const getCachedAllReviews = async (params = { page: 1, per_page: 50 }) => {
    const paramsKey = JSON.stringify(params);
    return await cachedAPICall(
        `all_reviews_${paramsKey}`,
        async () => {
            const response = await reviewAPI.getAllReviews(params);
            return response.data?.data || { reviews: [], pagination: {} };
        },
        { ttl: 30 * 60 * 1000 }
    );
};

export const getCachedNotifications = async (params = { status: 'all', per_page: 15 }) => {
    const paramsKey = JSON.stringify(params);
    return await cachedAPICall(
        `notifications_${paramsKey}`,
        async () => {
            const response = await notificationAPI.getNotifications(params);
            return response.data?.data || response.data || [];
        },
        { ttl: 5 * 60 * 1000 }
    );
};

export const getCachedUnreadCount = async () => {
    return await cachedAPICall(
        'unread_count',
        async () => {
            const response = await notificationAPI.getUnreadCount();
            return response.data?.unread_count || response.data?.count || 0;
        },
        { ttl: 2 * 60 * 1000 }
    );
};

// ====== Cache Management ======
export const clearCache = (key) => {
    apiCache.delete(key);
};

export const clearAllCache = () => {
    apiCache.clear();
};

export const refreshCachedData = async (cacheKey, apiCallFunction, ttl) => {
    return await cachedAPICall(cacheKey, apiCallFunction, { ttl, forceRefresh: true });
};