class APICache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
    }
    set(key, data, ttl = 5 * 60 * 1000) {
        this.cache.set(key, data);
        this.timestamps.set(key, {
            createdAt: Date.now(),
            ttl: ttl
        });

        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ تم حفظ ${key} في الكاش لمدة ${ttl / 1000} ثانية`);
        }
    }

    get(key) {
        if (!this.cache.has(key)) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`❌ ${key} غير موجود في الكاش`);
            }
            return null;
        }

        const timestamp = this.timestamps.get(key);
        const now = Date.now();

        if (now - timestamp.createdAt > timestamp.ttl) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`⏰ ${key} منتهي الصلاحية - تم حذفه`);
            }
            this.delete(key);
            return null;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ تم استرجاع ${key} من الكاش`);
        }
        return this.cache.get(key);
    }

    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);

        if (process.env.NODE_ENV === 'development') {
            console.log(`🗑️ تم حذف ${key} من الكاش`);
        }
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();

        if (process.env.NODE_ENV === 'development') {
            console.log('🗑️ تم مسح كل الكاش');
        }
    }

    has(key) {
        const data = this.get(key);
        return data !== null;
    }

    size() {
        return this.cache.size;
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    getInfo(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const timestamp = this.timestamps.get(key);
        const now = Date.now();
        const age = now - timestamp.createdAt;
        const remainingTime = timestamp.ttl - age;

        return {
            key,
            createdAt: new Date(timestamp.createdAt),
            age: Math.floor(age / 1000), 
            ttl: Math.floor(timestamp.ttl / 1000), 
            remainingTime: Math.floor(remainingTime / 1000), 
            isExpired: remainingTime <= 0
        };
    }
}

export const apiCache = new APICache();


export const cachedAPICall = async (cacheKey, apiCallFunction, options = {}) => {
    const {
        ttl = 5 * 60 * 1000,      
        forceRefresh = false       
    } = options;

    if (forceRefresh) {
        apiCache.delete(cacheKey);
    }

    const cachedData = apiCache.get(cacheKey);
    if (cachedData !== null) {
        return {
            data: cachedData,
            fromCache: true
        };
    }

    try {
        const data = await apiCallFunction();
        apiCache.set(cacheKey, data, ttl);
        return {
            data: data,
            fromCache: false
        };
    } catch (error) {
        throw error;
    }
};

export const createCacheKey = (base, params = {}) => {
    if (Object.keys(params).length === 0) {
        return base;
    }

    const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    return `${base}?${paramString}`;
};


export const clearCacheByPrefix = (prefix) => {
    const keys = apiCache.keys();
    const keysToDelete = keys.filter(key => key.startsWith(prefix));

    keysToDelete.forEach(key => {
        apiCache.delete(key);
    });

    if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ تم حذف ${keysToDelete.length} عنصر بالبادئة ${prefix}`);
    }
};

export const clearExpiredCache = () => {
    const keys = apiCache.keys();
    let deletedCount = 0;

    keys.forEach(key => {
        const info = apiCache.getInfo(key);
        if (info && info.isExpired) {
            apiCache.delete(key);
            deletedCount++;
        }
    });

    if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ تم حذف ${deletedCount} عنصر منتهي الصلاحية`);
    }
};

export const debugCache = () => {
    const keys = apiCache.keys();

    console.log('=== معلومات الكاش ===');
    console.log(`إجمالي العناصر: ${apiCache.size()}`);
    console.log('\nتفاصيل العناصر:');

    keys.forEach(key => {
        const info = apiCache.getInfo(key);
        if (info) {
            console.log(`\n🔑 ${key}`);
            console.log(`   ⏰ العمر: ${info.age} ثانية`);
            console.log(`   ⏳ الوقت المتبقي: ${info.remainingTime} ثانية`);
            console.log(`   ${info.isExpired ? '❌ منتهي' : '✅ صالح'}`);
        }
    });

    console.log('\n===================');
};

// Export default object
export default {
    apiCache,
    cachedAPICall,
    createCacheKey,
    clearCacheByPrefix,
    clearExpiredCache,
    debugCache
};