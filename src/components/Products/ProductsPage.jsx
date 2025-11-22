import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Filter, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, userAPI } from '../../api';
import Loader from '../Ui/Loader/Loader';
import PlaceholderSVG from '../../assets/PlaceholderSVG';

const ProductsPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const [toast, setToast] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedGovernorate, setSelectedGovernorate] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [genderMale, setGenderMale] = useState(false);
    const [genderFemale, setGenderFemale] = useState(false);
    const [deliveryAvailable, setDeliveryAvailable] = useState(false);
    const [retailSaleAvailable, setRetailSaleAvailable] = useState(false);
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [needsVaccinations, setNeedsVaccinations] = useState(false);
    const [contactPhone, setContactPhone] = useState(false);
    const [contactChat, setContactChat] = useState(false);
    const [contactBoth, setContactBoth] = useState(false);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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
        fetchFavorites();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, selectedGovernorate]);

    // إغلاق الفيلتر عند الضغط على Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsFilterOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const fetchFavorites = async () => {
        try {
            const response = await userAPI.get('/favorites');
            let favoritesArray = [];
            
            if (Array.isArray(response.data)) {
                favoritesArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                favoritesArray = response.data.data;
            } else if (response.data.favorites && Array.isArray(response.data.favorites)) {
                favoritesArray = response.data.favorites;
            }

            const favoriteIds = new Set(
                favoritesArray.map(fav => {
                    const product = fav.product || fav;
                    return product.id;
                })
            );
            
            setFavorites(favoriteIds);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await adminAPI.get(`/subcategories?category_id=${categoryId}`);
            const data = response.data;
            let categoriesArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];
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
            let governoratesArray = Array.isArray(data) ? data : (data.data?.governorates) || (data.data) || [];
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
            
            if (selectedCategory) params.append('subcategory_id', selectedCategory);
            if (selectedGovernorate) params.append('governorate_id', selectedGovernorate);
    
            const url = `/products${params.toString() ? '?' + params.toString() : ''}`;
            console.log('Fetching products with URL:', url);
            
            const response = await userAPI.get(url);
            const data = response.data;
    
            let productsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];
            console.log('Products fetched:', productsArray.length);
            setProducts(productsArray);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            showToast(t('common.error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (productId) => {
        const isFavorite = favorites.has(productId);
        
        try {
            if (isFavorite) {
                await userAPI.delete(`/favorites/${productId}`);
                setFavorites(prev => {
                    const newFavorites = new Set(prev);
                    newFavorites.delete(productId);
                    return newFavorites;
                });
                showToast(isRTL ? 'تم إزالة المنتج من المفضلة' : 'Product removed from favorites');
            } else {
                await userAPI.post(`/favorites/${productId}`);
                setFavorites(prev => {
                    const newFavorites = new Set(prev);
                    newFavorites.add(productId);
                    return newFavorites;
                });
                showToast(isRTL ? 'تم إضافة المنتج للمفضلة' : 'Product added to favorites');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast(t('common.error'), 'error');
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product-details/${productId}`);
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const filteredProducts = products.filter(product => {
        const productSubCategoryId = product.sub_category?.id || product.subcategory_id || product.sub_category_id;
        const matchesCategory = !selectedCategory || String(productSubCategoryId) === String(selectedCategory);
    
        const productGovernorateId = product.governorate?.id || product.governorate_id;
        const matchesGovernorate = !selectedGovernorate || String(productGovernorateId) === String(selectedGovernorate);
    
        const matchesMinPrice = !minPrice || (product.price && parseFloat(product.price) >= parseFloat(minPrice));
        const matchesMaxPrice = !maxPrice || (product.price && parseFloat(product.price) <= parseFloat(maxPrice));
    
        const matchesGender = (() => {
            if (!genderMale && !genderFemale) return true;
            if (genderMale && product.gender === 'male') return true;
            if (genderFemale && product.gender === 'female') return true;
            return false;
        })();
    
        const matchesDelivery = !deliveryAvailable || product.delivery_available === true;
        const matchesRetailSale = !retailSaleAvailable || product.retail_sale_available === true;
        const matchesPriceNegotiable = !priceNegotiable || product.price_negotiable === true;
        const matchesVaccinations = !needsVaccinations || product.needs_vaccinations === true;
    
        const matchesContactMethod = (() => {
            if (!contactPhone && !contactChat && !contactBoth) return true;
            if (contactPhone && product.contact_method === 'phone') return true;
            if (contactChat && product.contact_method === 'chat') return true;
            if (contactBoth && product.contact_method === 'both') return true;
            return false;
        })();
    
        return matchesCategory && matchesGovernorate && matchesMinPrice && matchesMaxPrice &&
            matchesGender && matchesDelivery && matchesRetailSale && matchesPriceNegotiable &&
            matchesVaccinations && matchesContactMethod;
    });

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedGovernorate('');
        setMinPrice('');
        setMaxPrice('');
        setGenderMale(false);
        setGenderFemale(false);
        setDeliveryAvailable(false);
        setRetailSaleAvailable(false);
        setPriceNegotiable(false);
        setNeedsVaccinations(false);
        setContactPhone(false);
        setContactChat(false);
        setContactBoth(false);
        navigate('/products');
    };

    const applyFilters = () => {
        showToast(isRTL ? 'تم تطبيق الفلاتر' : 'Filters applied', 'success');
        setIsFilterOpen(false);
    };

    const currentCategory = categories.find(c => c?.id && String(c.id) === String(selectedCategory)) || null;

    const hasActiveFilters = selectedCategory || selectedGovernorate || minPrice || maxPrice || genderMale || genderFemale || 
        deliveryAvailable || retailSaleAvailable || priceNegotiable || needsVaccinations || 
        contactPhone || contactChat || contactBoth;

    if (loading) {
        return <Loader />;
    }

    // مكون الفيلتر
    const FilterSidebar = () => (
        <div className="bg-white h-full shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-main">
                    {isRTL ? 'الفلاتر' : 'Filters'}
                </h2>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
                        >
                            {isRTL ? 'مسح الكل' : 'Clear All'}
                        </button>
                    )}
                    <button
                        onClick={() => setIsFilterOpen(false)}
                        className="lg:hidden p-1 hover:bg-gray-100 rounded-full cursor-pointer"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                    {isRTL ? 'الفئات' : 'Categories'}
                </h3>
                <div className="space-y-2">
                    {categories.map(category => (
                        <label 
                            key={category.id} 
                            className={`flex items-center cursor-pointer p-3 rounded-lg transition-all ${
                                String(selectedCategory) === String(category.id)
                                    ? 'bg-main text-white shadow-md scale-[1.02]' 
                                    : 'hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <input
                                type="radio"
                                name="category"
                                checked={String(selectedCategory) === String(category.id)}
                                onChange={() => handleCategoryChange(String(category.id))}
                                className="w-4 h-4 cursor-pointer accent-white"
                            />
                            <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm font-medium`}>
                                {isRTL ? category.name_ar : category.name_en}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

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
                                className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                            />
                            <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                {isRTL ? gov.name_ar : gov.name_en}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                    {t('ads.price')}
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

            <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                    {t('ads.gender')}
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={genderMale}
                            onChange={() => setGenderMale(!genderMale)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.male')}
                        </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={genderFemale}
                            onChange={() => setGenderFemale(!genderFemale)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.female')}
                        </span>
                    </label>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                    {isRTL ? 'خيارات البيع' : 'Sale Options'}
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={deliveryAvailable}
                            onChange={() => setDeliveryAvailable(!deliveryAvailable)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.deliveryAvailable')}
                        </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={retailSaleAvailable}
                            onChange={() => setRetailSaleAvailable(!retailSaleAvailable)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.retailSaleAvailable')}
                        </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={priceNegotiable}
                            onChange={() => setPriceNegotiable(!priceNegotiable)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.priceNegotiable')}
                        </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={needsVaccinations}
                            onChange={() => setNeedsVaccinations(!needsVaccinations)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.needsVaccinations')}
                        </span>
                    </label>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                    {t('ads.contactMethod')}
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={contactPhone}
                            onChange={() => setContactPhone(!contactPhone)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.call')}
                        </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={contactChat}
                            onChange={() => setContactChat(!contactChat)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.chat')}
                        </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={contactBoth}
                            onChange={() => setContactBoth(!contactBoth)}
                            className="w-4 h-4 text-main border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                            {t('ads.both')}
                        </span>
                    </label>
                </div>
            </div>

            <button
                onClick={applyFilters}
                className="w-full bg-main hover:bg-green-800 text-white py-2.5 rounded-lg font-medium transition cursor-pointer"
            >
                {isRTL ? 'تطبيق' : 'Apply'}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="flex relative">
                {/* Sidebar للشاشات الكبيرة */}
                <div className="hidden lg:block w-64 min-h-screen sticky top-0 max-h-screen">
                    <FilterSidebar />
                </div>

                {/* Overlay للشاشات الصغيرة */}
                {isFilterOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                        onClick={() => setIsFilterOpen(false)}
                    />
                )}

                {/* Sidebar للشاشات الصغيرة (منبثق من الجانب) */}
                <div
                    className={`lg:hidden fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
                        isFilterOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
                    }`}
                >
                    <FilterSidebar />
                </div>

                {/* المحتوى الرئيسي */}
                <div className="flex-1 p-4 lg:p-6">
                    {/* زر الفيلتر للشاشات الصغيرة */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 bg-main hover:bg-green-800 text-white px-4 py-2.5 rounded-lg font-medium transition cursor-pointer shadow-md"
                        >
                            <Filter size={20} />
                            <span>{isRTL ? 'الفلاتر' : 'Filters'}</span>
                            {hasActiveFilters && (
                                <span className="bg-white text-main rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {[selectedCategory, selectedGovernorate, minPrice, maxPrice, genderMale, genderFemale,
                                        deliveryAvailable, retailSaleAvailable, priceNegotiable, needsVaccinations,
                                        contactPhone, contactChat, contactBoth].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-bold text-main">
                            {currentCategory
                                ? (isRTL ? currentCategory.name_ar : currentCategory.name_en)
                                : (isRTL ? 'جميع المنتجات' : 'All Products')
                            }
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {isRTL ? `${filteredProducts.length} منتج` : `${filteredProducts.length} products`}
                        </p>
                    </div>

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {filteredProducts.map((product) => {
                                const imageUrl = product.image || product.images?.[0];
                                const isFavorite = favorites.has(product.id);
                                
                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100"
                                    >
                                        <div
                                            className="relative h-56 bg-gray-100 cursor-pointer group"
                                            onClick={() => handleProductClick(product.id)}
                                        >
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={isRTL ? product.name_ar : product.name_en}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <div 
                                                className={`${imageUrl ? 'hidden' : 'block'} w-full h-full`}
                                                style={{ display: imageUrl ? 'none' : 'block' }}
                                            >
                                                <PlaceholderSVG />
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(product.id);
                                                }}
                                                className={`absolute top-3 right-3 cursor-pointer rounded-full p-2 shadow-md hover:scale-110 transition-all z-10 ${
                                                    isFavorite 
                                                        ? 'bg-red-500 hover:bg-red-600' 
                                                        : 'bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <Heart
                                                    size={20}
                                                    className={isFavorite ? 'fill-white text-white' : 'text-gray-400'}
                                                />
                                            </button>
                                        </div>

                                        <div className="p-4">
                                            <h3
                                                className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-main transition line-clamp-2 min-h-[3.5rem]"
                                                onClick={() => handleProductClick(product.id)}
                                            >
                                                {isRTL ? product.name_ar : product.name_en}
                                            </h3>

                                            {product.governorate && (
                                                <div className="flex items-center text-sm text-main mb-3">
                                                    <MapPin size={16} className={isRTL ? 'ml-1' : 'mr-1'} />
                                                    <span className="font-medium">
                                                        {isRTL ? product.governorate.name_ar : product.governorate.name_en}
                                                    </span>
                                                </div>
                                            )}

                                            {product.description && (
                                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                    {isRTL ? product.description_ar : product.description_en}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <div className="text-2xl font-bold text-main">
                                                    {product.price} <span className="text-sm">{t('ads.concurrency')}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleProductClick(product.id)}
                                                    className="bg-main hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md cursor-pointer"
                                                >
                                                    {isRTL ? 'اطلب الان' : 'Order Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;