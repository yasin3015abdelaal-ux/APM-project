import { apiCache, clearCacheByPrefix } from './apiCache';

const CACHE_DEPENDENCIES = {
    'products': ['products', 'my_products', 'categories'],
    'my_products': ['my_products', 'products'],
    'auctions': ['auctions', 'auction_products_', 'my_auction_products_', 'prev_auction_products_'],
    'auction_products': ['auction_products_', 'my_auction_products_'],
    'conversations': ['conversations_'],
    'messages': ['conversations_'],
    'reviews': ['top_sellers_'],
    'articles': ['articles_', 'article_'],
    'countries': ['countries'],
    'governorates': ['governorates_'],
    'activity_types': ['activity_types'],
    'categories': ['categories'],
};

export const invalidateCache = (cacheType) => {
    const dependencies = CACHE_DEPENDENCIES[cacheType] || [];
    dependencies.forEach(prefix => {
        if (prefix.endsWith('_')) {
            clearCacheByPrefix(prefix);
        } else {
            apiCache.delete(prefix);
        }
    });
};

export const invalidateCacheById = (cacheType, id) => {
    const cacheKey = `${cacheType}_${id}`;
    apiCache.delete(cacheKey);
};

export const withCacheInvalidation = async (apiCall, cacheTypes = []) => {
    try {
        const response = await apiCall();
        cacheTypes.forEach(type => {
            invalidateCache(type);
        });
        return response;
    } catch (error) {
        throw error;
    }
};