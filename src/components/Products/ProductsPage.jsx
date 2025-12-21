import { useState, useEffect } from 'react';
import { Heart, MapPin, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, chatAPI, getCachedGovernorates, userAPI } from '../../api';
import Loader from '../Ui/Loader/Loader';
import ProductCard from '../ProductCard/ProductCard';

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
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [genderMale, setGenderMale] = useState(false);
    const [genderFemale, setGenderFemale] = useState(false);
    const [deliveryAvailable, setDeliveryAvailable] = useState(false);
    const [retailSaleAvailable, setRetailSaleAvailable] = useState(false);
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [needsVaccinations, setNeedsVaccinations] = useState(false);
    const [contactPhone, setContactPhone] = useState(false);
    const [contactChat, setContactChat] = useState(false);
    const [contactBoth, setContactBoth] = useState(false);

    // Collapsible filter sections
    const [openSections, setOpenSections] = useState({
        categories: false,
        governorates: false,
        price: false,
        gender: false,
        saleOptions: false,
        contactMethod: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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
    }, [selectedCategory, selectedGovernorate, priceRange]);

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
        const { data, fromCache } = await getCachedGovernorates(countryId);
        console.log(fromCache ? '📦 Governorates من الكاش' : '🌐 Governorates من API');
        
        setGovernorates(data);
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

    const handleContactSeller = async (product) => {
        try {
            const sellerId = product.user_id || product.seller_id;

            if (!sellerId) {
                showToast(isRTL ? 'لا يمكن التواصل مع البائع' : 'Cannot contact seller', 'error');
                return;
            }

            const response = await chatAPI.createConversation({
                user_id: sellerId,
                type: "auction"
            });

            if (response.data) {
                const conversationId = response.data.id || response.data.data?.id;
                navigate(`/chat/${conversationId}`);
                showToast(isRTL ? 'جاري فتح المحادثة...' : 'Opening conversation...', 'success');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);

            if (error.response?.status === 409 || error.response?.data?.conversation_id) {
                const existingConversationId = error.response.data.conversation_id;
                navigate(`/chat/${existingConversationId}`);
                showToast(isRTL ? 'جاري فتح المحادثة...' : 'Opening conversation...', 'success');
            } else {
                showToast(isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Error occurred, try again', 'error');
            }
        }
    };
    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const handlePriceRangeChange = (newRange) => {
        setPriceRange(newRange);
    };

    const filteredProducts = products.filter(product => {
        const productSubCategoryId = product.sub_category?.id || product.subcategory_id || product.sub_category_id;
        const matchesCategory = !selectedCategory || String(productSubCategoryId) === String(selectedCategory);

        const productGovernorateId = product.governorate?.id || product.governorate_id;
        const matchesGovernorate = !selectedGovernorate || String(productGovernorateId) === String(selectedGovernorate);

        const productPrice = product.price ? parseFloat(product.price) : 0;
        const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];

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

        return matchesCategory && matchesGovernorate && matchesPrice &&
            matchesGender && matchesDelivery && matchesRetailSale && matchesPriceNegotiable &&
            matchesVaccinations && matchesContactMethod;
    });

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedGovernorate('');
        setPriceRange([0, 10000]);
        setGenderMale(false);
        setGenderFemale(false);
        setDeliveryAvailable(false);
        setRetailSaleAvailable(false);
        setPriceNegotiable(false);
        setNeedsVaccinations(false);
        setContactPhone(false);
        setContactChat(false);
        setContactBoth(false);
    };

    const currentCategory = categories.find(c => c?.id && String(c.id) === String(selectedCategory)) || null;

    const hasActiveFilters = selectedCategory || selectedGovernorate || priceRange[0] > 0 || priceRange[1] < 10000 || genderMale || genderFemale ||
        deliveryAvailable || retailSaleAvailable || priceNegotiable || needsVaccinations ||
        contactPhone || contactChat || contactBoth;

    const PriceRangeFilter = () => {
        const [minValue, setMinValue] = useState(priceRange[0]);
        const [maxValue, setMaxValue] = useState(priceRange[1]);
        const maxPrice = 10000;

        useEffect(() => {
            setMinValue(priceRange[0]);
            setMaxValue(priceRange[1]);
        }, [priceRange]);

        const handleMinChange = (e) => {
            const value = Math.min(Number(e.target.value), maxValue - 100);
            setMinValue(value);
            handlePriceRangeChange([value, maxValue]);
        };

        const handleMaxChange = (e) => {
            const value = Math.max(Number(e.target.value), minValue + 100);
            setMaxValue(value);
            handlePriceRangeChange([minValue, value]);
        };

        const minPosition = (minValue / maxPrice) * 100;
        const maxPosition = (maxValue / maxPrice) * 100;

        return (
            <div className="space-y-6 mt-4">
                <div className="relative h-2 bg-gray-200 rounded-full">
                    <div
                        className="absolute h-full bg-main rounded-full"
                        style={{
                            left: `${minPosition}%`,
                            right: `${100 - maxPosition}%`
                        }}
                    />

                    <input
                        type="range"
                        min="0"
                        max={maxPrice}
                        value={minValue}
                        onChange={handleMinChange}
                        className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
                    />
                    <div
                        className="absolute w-6 h-6 bg-white border-2 border-main rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform z-10"
                        style={{ left: `${minPosition}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                    />

                    <input
                        type="range"
                        min="0"
                        max={maxPrice}
                        value={maxValue}
                        onChange={handleMaxChange}
                        className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
                    />
                    <div
                        className="absolute w-6 h-6 bg-white border-2 border-main rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform z-10"
                        style={{ left: `${maxPosition}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                    />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{minValue} {t('ads.concurrency')}</span>
                    <span>-</span>
                    <span>{maxValue} {t('ads.concurrency')}</span>
                </div>
            </div>
        );
    };

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

            {/* Categories Section */}
            <div className="mb-4 border-b border-gray-200 pb-4">
                <button
                    onClick={() => toggleSection('categories')}
                    className="flex items-center justify-between w-full text-left font-bold text-gray-800 mb-2 cursor-pointer"
                >
                    <span>{isRTL ? 'الفئات' : 'Categories'}</span>
                    {openSections.categories ?
                        <ChevronUp size={20} className="text-gray-500" /> :
                        <ChevronDown size={20} className="text-gray-500" />
                    }
                </button>
                {openSections.categories && (
                    <div className="space-y-2 mt-3">
                        {categories.map(category => (
                            <label
                                key={category.id}
                                className={`flex items-center cursor-pointer p-3 rounded-lg transition-all ${String(selectedCategory) === String(category.id)
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
                )}
            </div>

            {/* Governorates Section */}
            <div className="mb-4 border-b border-gray-200 pb-4">
                <button
                    onClick={() => toggleSection('governorates')}
                    className="flex items-center justify-between w-full text-left font-bold text-gray-800 mb-2 cursor-pointer"
                >
                    <span>{isRTL ? 'المحافظات' : 'Governorates'}</span>
                    {openSections.governorates ?
                        <ChevronUp size={20} className="text-gray-500" /> :
                        <ChevronDown size={20} className="text-gray-500" />
                    }
                </button>
                {openSections.governorates && (
                    <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
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
                )}
            </div>

            {/* Price Section */}
            <div className="mb-4 border-b border-gray-200 pb-4">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full text-left font-bold text-gray-800 mb-2 cursor-pointer"
                >
                    <span>{t('ads.price')}</span>
                    {openSections.price ?
                        <ChevronUp size={20} className="text-gray-500" /> :
                        <ChevronDown size={20} className="text-gray-500" />
                    }
                </button>
                {openSections.price && (
                    <PriceRangeFilter />
                )}
            </div>

            {/* Gender Section */}
            <div className="mb-4 border-b border-gray-200 pb-4">
                <button
                    onClick={() => toggleSection('gender')}
                    className="flex items-center justify-between w-full text-left font-bold text-gray-800 mb-2 cursor-pointer"
                >
                    <span>{t('ads.gender')}</span>
                    {openSections.gender ?
                        <ChevronUp size={20} className="text-gray-500" /> :
                        <ChevronDown size={20} className="text-gray-500" />
                    }
                </button>
                {openSections.gender && (
                    <div className="space-y-2 mt-3">
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
                )}
            </div>

            {/* Sale Options Section */}
            <div className="mb-4 border-b border-gray-200 pb-4">
                <button
                    onClick={() => toggleSection('saleOptions')}
                    className="flex items-center justify-between w-full text-left font-bold text-gray-800 mb-2 cursor-pointer"
                >
                    <span>{isRTL ? 'خيارات البيع' : 'Sale Options'}</span>
                    {openSections.saleOptions ?
                        <ChevronUp size={20} className="text-gray-500" /> :
                        <ChevronDown size={20} className="text-gray-500" />
                    }
                </button>
                {openSections.saleOptions && (
                    <div className="space-y-2 mt-3">
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
                )}
            </div>

            {/* Contact Method Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('contactMethod')}
                    className="flex items-center justify-between w-full text-left font-bold text-gray-800 mb-2 cursor-pointer"
                >
                    <span>{t('ads.contactMethod')}</span>
                    {openSections.contactMethod ?
                        <ChevronUp size={20} className="text-gray-500" /> :
                        <ChevronDown size={20} className="text-gray-500" />
                    }
                </button>
                {openSections.contactMethod && (
                    <div className="space-y-2 mt-3">
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
                )}
            </div>
        </div>
    );

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

            <div className="flex relative">
                <div className="hidden lg:block w-64 min-h-screen sticky top-0 max-h-screen">
                    <FilterSidebar />
                </div>

                {isFilterOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/70 z-40 transition-opacity duration-300"
                        onClick={() => setIsFilterOpen(false)}
                    />
                )}

                <div
                    className={`lg:hidden fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out ${isFilterOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
                        }`}
                >
                    <FilterSidebar />
                </div>

                <div className="flex-1 p-4 lg:p-6">
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 bg-main hover:bg-green-800 text-white px-4 py-2.5 rounded-lg font-medium transition cursor-pointer shadow-md"
                        >
                            <Filter size={20} />
                            <span>{isRTL ? 'الفلاتر' : 'Filters'}</span>
                            {hasActiveFilters && (
                                <span className="bg-white text-main rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {[selectedCategory, selectedGovernorate, priceRange[0] > 0, priceRange[1] < 10000, genderMale, genderFemale,
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
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isFavorite={favorites.has(product.id)}
                                    onToggleFavorite={toggleFavorite}
                                    onProductClick={handleProductClick}
                                    onContactSeller={handleContactSeller} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;