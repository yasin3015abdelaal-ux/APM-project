import React, { useState, useEffect } from 'react';
import { Heart, MapPin, ChevronDown } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../../api';

const ProductsPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [isRTL, setIsRTL] = useState(true);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    
    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedGovernorate, setSelectedGovernorate] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showDelivery, setShowDelivery] = useState(false);
    const [freeDelivery, setFreeDelivery] = useState(false);
    
    // Get country from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    const countryId = userData?.country?.id;

    useEffect(() => {
        if (categoryId) {
            setSelectedCategory(categoryId);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchCategories();
        fetchGovernorates();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, selectedGovernorate, minPrice, maxPrice]);

    const fetchCategories = async () => {
        try {
            const response = await userAPI.get('/categories');
            const data = response.data;
            
            let categoriesArray = [];
            if (Array.isArray(data)) {
                categoriesArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                categoriesArray = data.data;
            } else if (typeof data === 'object' && data !== null) {
                categoriesArray = [data];
            }
            
            setCategories(categoriesArray);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    const fetchGovernorates = async () => {
        try {
            const response = await userAPI.get(`/governorates?country_id=${countryId}`);
            const data = response.data;
            
            let governoratesArray = [];
            if (Array.isArray(data)) {
                governoratesArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                governoratesArray = data.data;
            } else if (typeof data === 'object' && data !== null) {
                governoratesArray = [data];
            }
            
            setGovernorates(governoratesArray);
        } catch (error) {
            console.error('Error fetching governorates:', error);
            setGovernorates([]);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category_id', selectedCategory);
            if (selectedGovernorate) params.append('governorate_id', selectedGovernorate);
            if (minPrice) params.append('min_price', minPrice);
            if (maxPrice) params.append('max_price', maxPrice);
            
            const url = `/products/my-products${params.toString() ? '?' + params.toString() : ''}`;
            const response = await userAPI.get(url);
            const data = response.data;
            
            let productsArray = [];
            if (Array.isArray(data)) {
                productsArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                productsArray = data.data;
            } else if (data.data && typeof data.data === 'object') {
                productsArray = [data.data];
            } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
                productsArray = [data];
            }
            
            setProducts(productsArray);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (productId) => {
        try {
            await userAPI.post(`/products/${productId}/favorite`);
            
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                if (newFavorites.has(productId)) {
                    newFavorites.delete(productId);
                } else {
                    newFavorites.add(productId);
                }
                return newFavorites;
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product-details/${productId}`);
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        if (categoryId) {
            navigate(`/products/${categoryId}`);
        } else {
            navigate('/products');
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = !selectedCategory || String(product.category_id) === String(selectedCategory);
        const matchesGovernorate = !selectedGovernorate || String(product.governorate_id) === String(selectedGovernorate);
        const matchesMinPrice = !minPrice || (product.price && product.price >= parseFloat(minPrice));
        const matchesMaxPrice = !maxPrice || (product.price && product.price <= parseFloat(maxPrice));
        
        return matchesCategory && matchesGovernorate && matchesMinPrice && matchesMaxPrice;
    });

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedGovernorate('');
        setSelectedSubCategory('');
        setMinPrice('');
        setMaxPrice('');
        setShowDelivery(false);
        setFreeDelivery(false);
        navigate('/products');
    };

    const currentCategory = categories.find(c => c?.id && String(c.id) === String(selectedCategory)) || null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-green-700 font-bold">
                    {isRTL ? 'جاري التحميل...' : 'Loading...'}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex">
                {/* Sidebar Filters */}
                <div className="w-64 bg-white min-h-screen shadow-sm p-6 sticky top-0 overflow-y-auto max-h-screen">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-green-700">
                            {isRTL ? 'الفلاتر' : 'Filters'}
                        </h2>
                        {(selectedCategory || selectedGovernorate || minPrice || maxPrice) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700"
                            >
                                {isRTL ? 'مسح الكل' : 'Clear All'}
                            </button>
                        )}
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'الفئات' : 'Categories'}
                        </h3>
                        <div className="space-y-2">
                            {categories.filter(cat => cat?.is_active).map(category => (
                                <label key={category.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={String(selectedCategory) === String(category.id)}
                                        onChange={() => handleCategoryChange(String(category.id))}
                                        className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500"
                                    />
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                        {isRTL ? category.name_ar : category.name_en}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Governorates */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'المحافظات' : 'Governorates'}
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {governorates.map(gov => (
                                <label key={gov.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={String(selectedGovernorate) === String(gov.id)}
                                        onChange={() => setSelectedGovernorate(
                                            String(selectedGovernorate) === String(gov.id) ? '' : String(gov.id)
                                        )}
                                        className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                        {isRTL ? gov.name_ar : gov.name_en}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'السعر' : 'Price'}
                        </h3>
                        <div className="space-y-2">
                            <input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder={isRTL ? 'من' : 'Min'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder={isRTL ? 'إلى' : 'Max'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'التوصيل' : 'Delivery'}
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={showDelivery}
                                    onChange={() => setShowDelivery(!showDelivery)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'يتوفر توصيل' : 'Delivery Available'}
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={freeDelivery}
                                    onChange={() => setFreeDelivery(!freeDelivery)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'توصيل مجاني' : 'Free Delivery'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <button 
                        onClick={fetchProducts}
                        className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-medium transition"
                    >
                        {isRTL ? 'تطبيق' : 'Apply'}
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-green-700">
                            {currentCategory 
                                ? (isRTL ? currentCategory.name_ar : currentCategory.name_en)
                                : (isRTL ? 'جميع المنتجات' : 'All Products')
                            }
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {isRTL ? `${filteredProducts.length} منتج` : `${filteredProducts.length} products`}
                        </p>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {isRTL ? 'لا توجد منتجات' : 'No products found'}
                            </h3>
                            <p className="text-gray-500">
                                {isRTL ? 'جرب تعديل الفلاتر للحصول على نتائج' : 'Try adjusting filters to get results'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100"
                                >
                                    {/* Image Container */}
                                    <div 
                                        className="relative h-56 bg-gray-100 cursor-pointer group"
                                        onClick={() => handleProductClick(product.id)}
                                    >
                                        <img
                                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                                            alt={isRTL ? product.name_ar : product.name_en}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                            }}
                                        />
                                        
                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(product.id);
                                            }}
                                            className="absolute top-3 left-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform z-10"
                                        >
                                            <Heart
                                                size={20}
                                                className={favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                                            />
                                        </button>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        {/* Product Name */}
                                        <h3 
                                            className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-green-700 transition line-clamp-2 min-h-[3.5rem]"
                                            onClick={() => handleProductClick(product.id)}
                                        >
                                            {isRTL ? product.name_ar : product.name_en}
                                        </h3>

                                        {/* Location */}
                                        {product.governorate && (
                                            <div className="flex items-center text-sm text-green-700 mb-3">
                                                <MapPin size={16} className={isRTL ? 'ml-1' : 'mr-1'} />
                                                <span className="font-medium">
                                                    {isRTL ? product.governorate.name_ar : product.governorate.name_en}
                                                </span>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {product.description && (
                                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                {isRTL ? product.description_ar : product.description_en}
                                            </p>
                                        )}

                                        {/* Price and Button */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="text-2xl font-bold text-green-700">
                                                {product.price} <span className="text-sm">{isRTL ? 'جنيه' : 'EGP'}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleProductClick(product.id)}
                                                className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                                            >
                                                {isRTL ? 'اطلب الان' : 'Order Now'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Language Toggle */}
            <button
                onClick={() => setIsRTL(!isRTL)}
                className="fixed bottom-6 right-6 bg-green-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-800 transition z-50"
            >
                {isRTL ? 'EN' : 'عربي'}
            </button>
        </div>
    );
};

export default ProductsPage;