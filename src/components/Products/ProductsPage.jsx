import React, { useState, useEffect } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../../api';
import Loader from '../Ui/Loader/Loader';

const PlaceholderSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
        <rect width="400" height="300" fill="#f0fdf4"/>
        <circle cx="200" cy="150" r="60" fill="#86efac" opacity="0.3"/>
        <g transform="translate(200, 150)">
            <path d="M-40,20 L-20,-10 L0,10 L20,-20 L40,20 Z" fill="#22c55e" opacity="0.6"/>
            <circle cx="-25" cy="-15" r="8" fill="#16a34a"/>
            <rect x="-45" y="-25" width="90" height="50" fill="none" stroke="#16a34a" strokeWidth="3" rx="4"/>
        </g>
        <text x="200" y="235" fontFamily="Arial, sans-serif" fontSize="14" fill="#16a34a" textAnchor="middle" fontWeight="600">
            No Image Available
        </text>
        <text x="200" y="255" fontFamily="Arial, sans-serif" fontSize="12" fill="#16a34a" textAnchor="middle" opacity="0.7">
            لا توجد صورة
        </text>
    </svg>
);

const ProductsPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [isRTL, setIsRTL] = useState(true);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const [toast, setToast] = useState(null);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedGovernorate, setSelectedGovernorate] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showDelivery, setShowDelivery] = useState(false);
    const [freeDelivery, setFreeDelivery] = useState(false);
    const [genderMale, setGenderMale] = useState(false);
    const [genderFemale, setGenderFemale] = useState(false);
    const [age0to6, setAge0to6] = useState(false);
    const [age6to12, setAge6to12] = useState(false);
    const [age12Plus, setAge12Plus] = useState(false);
    const [typeLocal, setTypeLocal] = useState(false);
    const [typeImported, setTypeImported] = useState(false);
    const [vaccinations, setVaccinations] = useState(false);
    const [contactPhone, setContactPhone] = useState(false);
    const [contactWhatsapp, setContactWhatsapp] = useState(false);

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
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, selectedGovernorate, minPrice, maxPrice]);

    const fetchCategories = async () => {
        try {
            const response = await userAPI.get('/categories');
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
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedGovernorate) params.append('governorate_id', selectedGovernorate);
            if (minPrice) params.append('min_price', minPrice);
            if (maxPrice) params.append('max_price', maxPrice);

            const url = `/products${params.toString() ? '?' + params.toString() : ''}`;
            const response = await userAPI.get(url);
            const data = response.data;

            let productsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];
            setProducts(productsArray);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            showToast(isRTL ? 'حدث خطأ في تحميل المنتجات' : 'Error loading products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (productId) => {
        try {
            await userAPI.post(`/favorites/${productId}`);
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                if (newFavorites.has(productId)) {
                    newFavorites.delete(productId);
                    showToast(isRTL ? 'تم إزالة المنتج من المفضلة' : 'Product removed from favorites');
                } else {
                    newFavorites.add(productId);
                    showToast(isRTL ? 'تم إضافة المنتج للمفضلة' : 'Product added to favorites');
                }
                return newFavorites;
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
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
        const productCategoryId = product.category?.id || product.category_id;
        const matchesCategory = !selectedCategory || String(productCategoryId) === String(selectedCategory);

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

        const matchesAge = (() => {
            if (!age0to6 && !age6to12 && !age12Plus) return true;
            const age = parseInt(product.age);
            if (age0to6 && age >= 0 && age <= 6) return true;
            if (age6to12 && age > 6 && age <= 12) return true;
            if (age12Plus && age > 12) return true;
            return false;
        })();

        const matchesType = (() => {
            if (!typeLocal && !typeImported) return true;
            if (typeLocal && product.type === 'بلدي') return true;
            if (typeImported && product.type === 'مستورد') return true;
            return false;
        })();

        const matchesVaccinations = !vaccinations || product.needs_vaccinations === true;

        const matchesContactMethod = (() => {
            if (!contactPhone && !contactWhatsapp) return true;
            if (contactPhone && (product.contact_method === 'phone' || product.contact_method === 'both')) return true;
            if (contactWhatsapp && (product.contact_method === 'whatsapp' || product.contact_method === 'both')) return true;
            return false;
        })();

        const matchesDelivery = !showDelivery || product.delivery_available === true;
        const matchesFreeDelivery = !freeDelivery || product.free_delivery === true;

        return matchesCategory && matchesGovernorate && matchesMinPrice && matchesMaxPrice &&
            matchesGender && matchesAge && matchesType && matchesVaccinations &&
            matchesContactMethod && matchesDelivery && matchesFreeDelivery;
    });

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedGovernorate('');
        setMinPrice('');
        setMaxPrice('');
        setGenderMale(false);
        setGenderFemale(false);
        setAge0to6(false);
        setAge6to12(false);
        setAge12Plus(false);
        setTypeLocal(false);
        setTypeImported(false);
        setVaccinations(false);
        setContactPhone(false);
        setContactWhatsapp(false);
        setShowDelivery(false);
        setFreeDelivery(false);
        navigate('/products');
    };

    const currentCategory = categories.find(c => c?.id && String(c.id) === String(selectedCategory)) || null;

    if (loading) {
        return <Loader />;
    }

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

            <div className="flex">
                {/* Sidebar Filters */}
                <div className="w-64 bg-white min-h-screen shadow-sm p-6 sticky top-0 overflow-y-auto max-h-screen">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-green-700">
                            {isRTL ? 'الفلاتر' : 'Filters'}
                        </h2>
                        {(selectedCategory || selectedGovernorate || minPrice || maxPrice || genderMale || genderFemale || age0to6 || age6to12 || age12Plus || typeLocal || typeImported || vaccinations || contactPhone || contactWhatsapp) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
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
                                        className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500 cursor-pointer"
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
                                        className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
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

                    {/* Gender Filter */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'الجنس' : 'Gender'}
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={genderMale}
                                    onChange={() => setGenderMale(!genderMale)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'ذكر' : 'Male'}
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={genderFemale}
                                    onChange={() => setGenderFemale(!genderFemale)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'أنثى' : 'Female'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Age Range Filter */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'العمر' : 'Age'}
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={age0to6}
                                    onChange={() => setAge0to6(!age0to6)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'من 0 إلى 6 أشهر' : '0-6 months'}
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={age6to12}
                                    onChange={() => setAge6to12(!age6to12)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'من 6 إلى 12 شهر' : '6-12 months'}
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={age12Plus}
                                    onChange={() => setAge12Plus(!age12Plus)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'أكثر من 12 شهر' : 'More than 12 months'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'النوع' : 'Type'}
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={typeLocal}
                                    onChange={() => setTypeLocal(!typeLocal)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'بلدي' : 'Local'}
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={typeImported}
                                    onChange={() => setTypeImported(!typeImported)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'مستورد' : 'Imported'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Vaccinations Filter */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'التطعيمات' : 'Vaccinations'}
                        </h3>
                        <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={vaccinations}
                                onChange={() => setVaccinations(!vaccinations)}
                                className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                            />
                            <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                {isRTL ? 'مطعم' : 'Vaccinated'}
                            </span>
                        </label>
                    </div>

                    {/* Contact Method Filter */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">
                            {isRTL ? 'طرق التواصل' : 'Contact Method'}
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={contactPhone}
                                    onChange={() => setContactPhone(!contactPhone)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'هاتف' : 'Phone'}
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={contactWhatsapp}
                                    onChange={() => setContactWhatsapp(!contactWhatsapp)}
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
                                    {isRTL ? 'واتساب' : 'WhatsApp'}
                                </span>
                            </label>
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
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded cursor-pointer"
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
                                    className="w-4 h-4 text-green-700 border-gray-300 rounded cursor-pointer"
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
                        className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-medium transition cursor-pointer"
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
                            {filteredProducts.map((product) => {
                                const imageUrl = product.image || product.images?.[0];
                                
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
                                                className="absolute top-3 left-3 cursor-pointer bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform z-10"
                                            >
                                                <Heart
                                                    size={20}
                                                    className={favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                                                />
                                            </button>
                                        </div>

                                        <div className="p-4">
                                            <h3
                                                className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-green-700 transition line-clamp-2 min-h-[3.5rem]"
                                                onClick={() => handleProductClick(product.id)}
                                            >
                                                {isRTL ? product.name_ar : product.name_en}
                                            </h3>

                                            {product.governorate && (
                                                <div className="flex items-center text-sm text-green-700 mb-3">
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
                                                <div className="text-2xl font-bold text-green-700">
                                                    {product.price} <span className="text-sm">{isRTL ? 'جنيه' : 'EGP'}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleProductClick(product.id)}
                                                    className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md cursor-pointer"
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