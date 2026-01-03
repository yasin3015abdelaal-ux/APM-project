import { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { MapPin, Filter, X, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw, Check } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, chatAPI, getCachedGovernorates, userAPI } from '../../api';
import Loader from '../Ui/Loader/Loader';
import ProductCard from '../ProductCard/ProductCard';

const filterReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CATEGORIES': return { ...state, selectedCategories: action.payload };
        case 'TOGGLE_CATEGORY':
            return { 
                ...state, 
                selectedCategories: state.selectedCategories.includes(action.payload)
                    ? state.selectedCategories.filter(id => id !== action.payload) 
                    : [...state.selectedCategories, action.payload] 
            };
        case 'SET_GOVERNORATES': return { ...state, selectedGovernorates: action.payload };
        case 'SET_WEIGHT_RANGE': return { ...state, weightRange: action.payload };
        case 'SET_CONTACT_METHOD': return { ...state, contactMethod: action.payload };
        case 'SET_PRICE_RANGE': return { ...state, priceRange: action.payload };
        case 'SET_QUANTITY_RANGE': return { ...state, quantityRange: action.payload };
        case 'SET_DELIVERY_OPTIONS': return { ...state, selectedDeliveryOptions: action.payload };
        case 'SET_FARM_PREP': return { ...state, farmPrep: action.payload };
        case 'CLEAR_FILTERS':
            return { 
                selectedCategories: [], selectedGovernorates: [], weightRange: [1, 1000], 
                contactMethod: null, priceRange: [100, 100000], quantityRange: [1, 10000], 
                selectedDeliveryOptions: [], farmPrep: null 
            };
        default: return state;
    }
};

const ProductsPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const isViewAllPage = location.pathname === '/products';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const [toast, setToast] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total: 0 });
    
    const [filterState, dispatchFilter] = useReducer(filterReducer, {
        selectedCategories: [], selectedGovernorates: [], weightRange: [1, 1000], 
        contactMethod: null, priceRange: [100, 100000], quantityRange: [1, 10000], 
        selectedDeliveryOptions: [], farmPrep: null
    });
    
    const [appliedFilters, setAppliedFilters] = useState({
        selectedCategories: [], selectedGovernorates: [], weightRange: [1, 1000], 
        contactMethod: null, priceRange: [100, 100000], quantityRange: [1, 10000], 
        selectedDeliveryOptions: [], farmPrep: null
    });
    
    const [openSection, setOpenSection] = useState(null);

    const filterSidebarRef = useRef(null);
    const scrollPositionRef = useRef(0);

    const countryId = userData?.country?.id;

    const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

    const dispatchFilterWithScroll = useCallback((action) => {
        if (filterSidebarRef.current) {
            scrollPositionRef.current = filterSidebarRef.current.scrollTop;
        }
        
        dispatchFilter(action);
        
        requestAnimationFrame(() => {
            if (filterSidebarRef.current) {
                filterSidebarRef.current.scrollTop = scrollPositionRef.current;
            }
        });
    }, []);

    const buildFilterURL = useCallback((page = 1) => {
        const params = new URLSearchParams({ page: page.toString(), per_page: '12' });
        if (categoryId && !isViewAllPage) params.append('category_id', categoryId);
        if (appliedFilters.selectedCategories.length > 0) params.append('sub_category_id', appliedFilters.selectedCategories.join(','));
        if (appliedFilters.selectedGovernorates.length > 0) params.append('governorate_id', appliedFilters.selectedGovernorates.join(','));
        if (appliedFilters.weightRange[0] > 1 || appliedFilters.weightRange[1] < 1000) {
            params.append('min_weight', appliedFilters.weightRange[0]);
            params.append('max_weight', appliedFilters.weightRange[1]);
        }
        if (appliedFilters.contactMethod) params.append('contact_method', appliedFilters.contactMethod);
        if (appliedFilters.priceRange[0] > 100 || appliedFilters.priceRange[1] < 100000) {
            params.append('min_price', appliedFilters.priceRange[0]);
            params.append('max_price', appliedFilters.priceRange[1]);
        }
        if (appliedFilters.quantityRange[0] > 1 || appliedFilters.quantityRange[1] < 10000) {
            params.append('min_quantity', appliedFilters.quantityRange[0]);
            params.append('max_quantity', appliedFilters.quantityRange[1]);
        }
        if (appliedFilters.selectedDeliveryOptions.length > 0) {
            if (appliedFilters.selectedDeliveryOptions.includes('available')) params.append('delivery_available', '1');
            if (appliedFilters.selectedDeliveryOptions.includes('not_available')) params.append('delivery_available', '0');
            const deliveryTextOptions = appliedFilters.selectedDeliveryOptions.filter(opt => !['available', 'not_available'].includes(opt));
            if (deliveryTextOptions.length > 0) params.append('delivery_text', deliveryTextOptions.join(','));
        }
        if (appliedFilters.farmPrep !== null) params.append('farm_preparation_available', appliedFilters.farmPrep ? '1' : '0');
        return `/products?${params.toString()}`;
    }, [categoryId, isViewAllPage, appliedFilters]);

    const fetchProducts = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await userAPI.get(buildFilterURL(page));
            const data = response.data;
            const productsArray = Array.isArray(data) ? data : (data.data || data.products || []);
            setProducts(productsArray);
            setPagination(data.pagination || { current_page: page, last_page: 1, per_page: 12, total: productsArray.length });
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            showToast(t('common.error'), 'error');
        } finally {
            setLoading(false);
        }
    }, [buildFilterURL, t, showToast]);

    const applyFilters = () => {
        setAppliedFilters(filterState);
        setCurrentPage(1);
        setIsFilterOpen(false);
    };

    const clearFilters = () => {
        dispatchFilterWithScroll({ type: 'CLEAR_FILTERS' });
        setAppliedFilters({
            selectedCategories: [], selectedGovernorates: [], weightRange: [1, 1000], 
            contactMethod: null, priceRange: [100, 100000], quantityRange: [1, 10000], 
            selectedDeliveryOptions: [], farmPrep: null
        });
    };

    const hasActiveFilters = filterState.selectedCategories.length > 0 || filterState.selectedGovernorates.length > 0 ||
        filterState.weightRange[0] > 1 || filterState.weightRange[1] < 1000 || filterState.contactMethod !== null ||
        filterState.priceRange[0] > 100 || filterState.priceRange[1] < 100000 || filterState.quantityRange[0] > 1 ||
        filterState.quantityRange[1] < 10000 || filterState.selectedDeliveryOptions.length > 0 || filterState.farmPrep !== null;

    useEffect(() => {
        const data = localStorage.getItem('userData');
        if (data) setUserData(JSON.parse(data));
        
        const fetchInitialData = async () => {
            try {
                const govs = await getCachedGovernorates(data ? JSON.parse(data).country?.id : null);
                setGovernorates(govs.data || []);
            } catch {
                setGovernorates([]);
            }
        };
        
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!isViewAllPage && categoryId) {
            adminAPI.get(`/subcategories?category_id=${categoryId}`)
                .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data.data || [])))
                .catch(() => setCategories([]));
            
            adminAPI.get('/categories')
                .then(res => {
                    const allCategories = Array.isArray(res.data) ? res.data : (res.data.data || []);
                    const current = allCategories.find(cat => cat.id === parseInt(categoryId));
                    setCurrentCategory(current);
                })
                .catch(() => {});
        }
        
        userAPI.get('/favorites').then(res => {
            const favs = Array.isArray(res.data) ? res.data : (res.data.data || res.data.favorites || []);
            setFavorites(new Set(favs.map(fav => (fav.product || fav).id)));
        }).catch(() => {});
    }, [isViewAllPage, categoryId]);
    
    useEffect(() => {
        fetchProducts(1);
    }, [appliedFilters, categoryId, isViewAllPage]);

    useEffect(() => { 
        if (currentPage > 1) fetchProducts(currentPage); 
    }, [currentPage]);
    
    useEffect(() => {
        if (categoryId) {
            dispatchFilterWithScroll({ type: 'CLEAR_FILTERS' });
            setAppliedFilters({
                selectedCategories: [], selectedGovernorates: [], weightRange: [1, 1000], 
                contactMethod: null, priceRange: [100, 100000], quantityRange: [1, 10000], 
                selectedDeliveryOptions: [], farmPrep: null
            });
        }
    }, [categoryId]);
    
    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') setIsFilterOpen(false); };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const toggleFavorite = async (productId) => {
        const isFavorite = favorites.has(productId);
        try {
            if (isFavorite) {
                await userAPI.delete(`/favorites/${productId}`);
                setFavorites(prev => { const newFavs = new Set(prev); newFavs.delete(productId); return newFavs; });
                showToast(isRTL ? 'تم إزالة المنتج من المفضلة' : 'Product removed from favorites');
            } else {
                await userAPI.post(`/favorites/${productId}`);
                setFavorites(prev => new Set([...prev, productId]));
                showToast(isRTL ? 'تم إضافة المنتج للمفضلة' : 'Product added to favorites');
            }
        } catch (error) {
            showToast(t('common.error'), 'error');
        }
    };

    const handleContactSeller = async (product) => {
        const sellerId = product.user_id || product.seller_id;
        if (!sellerId) return showToast(isRTL ? 'لا يمكن التواصل مع البائع' : 'Cannot contact seller', 'error');
        try {
            const response = await chatAPI.createConversation({ user_id: sellerId, type: "auction" });
            const conversationId = response.data.id || response.data.data?.id;
            navigate(`/chat/${conversationId}`);
        } catch (error) {
            if (error.response?.status === 409 || error.response?.data?.conversation_id) {
                navigate(`/chat/${error.response.data.conversation_id}`);
            } else {
                showToast(isRTL ? 'حدث خطأ' : 'Error occurred', 'error');
            }
        }
    };

    const handleContactMethodChange = (method) => {
        let newMethod = null;
        if (method === 'chat') {
            if (filterState.contactMethod === 'chat') newMethod = null;
            else if (filterState.contactMethod === 'phone') newMethod = 'both';
            else if (filterState.contactMethod === 'both') newMethod = 'phone';
            else newMethod = 'chat';
        } else if (method === 'phone') {
            if (filterState.contactMethod === 'phone') newMethod = null;
            else if (filterState.contactMethod === 'chat') newMethod = 'both';
            else if (filterState.contactMethod === 'both') newMethod = 'chat';
            else newMethod = 'phone';
        }
        dispatchFilterWithScroll({ type: 'SET_CONTACT_METHOD', payload: newMethod });
    };

    const RangeFilter = ({ min, max, value, onChange, step = 1 }) => {
        const [localMin, setLocalMin] = useState(value[0]);
        const [localMax, setLocalMax] = useState(value[1]);
        const isDragging = useRef(false);

        useEffect(() => {
            if (!isDragging.current) {
                setLocalMin(value[0]);
                setLocalMax(value[1]);
            }
        }, [value]);

        const getPercent = (val) => ((val - min) / (max - min)) * 100;

        return (
            <div className="space-y-4 mt-3" dir="ltr">
                <div className="flex items-center gap-2 justify-center">
                    <input type="number" value={localMin} onChange={(e) => setLocalMin(Number(e.target.value) || min)}
                        onBlur={() => onChange([Math.max(min, Math.min(localMin, localMax - step)), localMax])}
                        className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-main text-sm text-center" />
                    <span className="text-gray-400 font-bold">—</span>
                    <input type="number" value={localMax} onChange={(e) => setLocalMax(Number(e.target.value) || max)}
                        onBlur={() => onChange([localMin, Math.min(max, Math.max(localMax, localMin + step))])}
                        className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-main text-sm text-center" />
                </div>
                <div className="relative pt-2 pb-6">
                    <div className="relative h-2 bg-gray-200 rounded-full">
                        <div className="absolute h-full bg-gradient-to-r from-main to-green-600 rounded-full" 
                            style={{ left: `${getPercent(localMin)}%`, width: `${getPercent(localMax) - getPercent(localMin)}%` }} />
                    </div>
                    <div className="relative">
                        <input type="range" min={min} max={max} step={step} value={localMin}
                            onMouseDown={() => isDragging.current = true}
                            onMouseUp={() => { isDragging.current = false; onChange([localMin, localMax]); }}
                            onTouchStart={() => isDragging.current = true}
                            onTouchEnd={() => { isDragging.current = false; onChange([localMin, localMax]); }}
                            onChange={(e) => { const val = Number(e.target.value); if (val < localMax - step) setLocalMin(val); }}
                            className="range-thumb absolute w-full -top-1.5" style={{ zIndex: localMin > max - (max - min) / 4 ? 5 : 3 }} />
                        <input type="range" min={min} max={max} step={step} value={localMax}
                            onMouseDown={() => isDragging.current = true}
                            onMouseUp={() => { isDragging.current = false; onChange([localMin, localMax]); }}
                            onTouchStart={() => isDragging.current = true}
                            onTouchEnd={() => { isDragging.current = false; onChange([localMin, localMax]); }}
                            onChange={(e) => { const val = Number(e.target.value); if (val > localMin + step) setLocalMax(val); }}
                            className="range-thumb absolute w-full -top-1.5" style={{ zIndex: 4 }} />
                    </div>
                    <style>{`
                        .range-thumb {
                            -webkit-appearance: none; appearance: none; background: transparent;
                            pointer-events: all; height: 0; width: 100%; position: absolute; top: -15px; direction: ltr;
                        }
                        .range-thumb::-webkit-slider-thumb {
                            -webkit-appearance: none; appearance: none; width: 20px; height: 20px;
                            border-radius: 50%; background: white; border: 3px solid #16a34a;
                            cursor: grab; pointer-events: all; box-shadow: 0 2px 8px rgba(0,0,0,0.25); transition: all 0.2s;
                        }
                        .range-thumb:active::-webkit-slider-thumb { cursor: grabbing; }
                        .range-thumb::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 3px 12px rgba(22, 163, 74, 0.4); }
                        .range-thumb::-moz-range-thumb {
                            width: 20px; height: 20px; border-radius: 50%; background: white; border: 3px solid #16a34a;
                            cursor: grab; pointer-events: all; box-shadow: 0 2px 8px rgba(0,0,0,0.25); transition: all 0.2s;
                        }
                        .range-thumb:active::-moz-range-thumb { cursor: grabbing; }
                        .range-thumb::-moz-range-thumb:hover { transform: scale(1.15); box-shadow: 0 3px 12px rgba(22, 163, 74, 0.4); }
                        .range-thumb::-webkit-slider-runnable-track { background: transparent; height: 0; }
                        .range-thumb::-moz-range-track { background: transparent; height: 0; }
                    `}</style>
                </div>
            </div>
        );
    };

    const FilterSection = ({ title, sectionKey, children }) => (
        <div className="mb-3.5 pb-3.5 border-b border-gray-100">
            <button onClick={() => setOpenSection(openSection === sectionKey ? null : sectionKey)} 
                className="flex cursor-pointer items-center justify-between w-full font-bold text-sm hover:text-main group">
                <span className="flex items-center gap-2">{title}</span>
                <ChevronDown size={20} className={`transition-transform ${openSection === sectionKey ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all ${openSection === sectionKey ? 'max-h-[300px] mt-3 overflow-y-auto' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );

    const FilterSidebar = () => (
        <div className="flex flex-col max-h-full">
            <div className="p-5 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SlidersHorizontal size={22} className="text-main" />
                        <h2 className="text-xl font-bold text-main">{isRTL ? 'الفلاتر' : 'Filters'}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button onClick={clearFilters}
                                className="flex cursor-pointer items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs transition-all">
                                <RefreshCw size={14} />
                                {isRTL ? 'حذف الكل' : 'Clear All'}
                            </button>
                        )}
                        <button onClick={() => setIsFilterOpen(false)} className="lg:hidden text-white">
                            <X size={22} />
                        </button>
                    </div>
                </div>
            </div>
            
            <div ref={filterSidebarRef} className="flex-1 overflow-y-auto p-5" style={{scrollBehavior: 'auto', overscrollBehavior: 'contain'}}>
                <style>{`
                    input[type="checkbox"] {
                        appearance: none; width: 18px; height: 18px; border: 2px solid #d1d5db;
                        border-radius: 4px; cursor: pointer; position: relative; flex-shrink: 0;
                    }
                    input[type="checkbox"]:checked {
                        background: #16a34a; border-color: #16a34a;
                    }
                    input[type="checkbox"]:checked::before {
                        content: '✓'; position: absolute; color: white; font-size: 14px;
                        top: 50%; left: 50%; transform: translate(-50%, -50%);
                    }
                `}</style>

                {!isViewAllPage && categories.length > 0 && (
                    <FilterSection title={isRTL ? 'النوع' : 'Type'} sectionKey="categories">
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <label key={cat.id} className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-sm">
                                    <input type="checkbox" checked={filterState.selectedCategories.includes(String(cat.id))}
                                        onChange={() => dispatchFilterWithScroll({ type: 'TOGGLE_CATEGORY', payload: String(cat.id) })} />
                                    <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                                        {isRTL ? cat.name_ar : cat.name_en}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                )}

                <FilterSection title={isRTL ? 'المحافظة' : 'Governorate'} sectionKey="governorates">
                    <div className="space-y-2">
                        {governorates.map(gov => (
                            <label key={gov.id} className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-sm">
                                <input type="checkbox" checked={filterState.selectedGovernorates.includes(String(gov.id))}
                                    onChange={() => {
                                        const newGovs = filterState.selectedGovernorates.includes(String(gov.id))
                                            ? filterState.selectedGovernorates.filter(id => id !== String(gov.id))
                                            : [...filterState.selectedGovernorates, String(gov.id)];
                                        dispatchFilterWithScroll({ type: 'SET_GOVERNORATES', payload: newGovs });
                                    }} />
                                <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                                    {isRTL ? gov.name_ar : gov.name_en}
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title={isRTL ? 'الوزن' : 'Weight'} sectionKey="weight">
                    <RangeFilter min={1} max={1000} value={filterState.weightRange}
                        onChange={(val) => dispatchFilterWithScroll({ type: 'SET_WEIGHT_RANGE', payload: val })} step={10} />
                </FilterSection>

                <FilterSection title={isRTL ? 'التواصل عن طريق' : 'Contact Via'} sectionKey="contactMethod">
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-sm">
                            <input type="checkbox" checked={filterState.contactMethod === 'chat' || filterState.contactMethod === 'both'}
                                onChange={() => handleContactMethodChange('chat')} />
                            <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>{isRTL ? 'محادثة' : 'Chat'}</span>
                        </label>
                        <label className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-sm">
                            <input type="checkbox" checked={filterState.contactMethod === 'phone' || filterState.contactMethod === 'both'}
                                onChange={() => handleContactMethodChange('phone')} />
                            <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>{isRTL ? 'مكالمة' : 'Phone'}</span>
                        </label>
                    </div>
                </FilterSection>

                <FilterSection title={isRTL ? 'السعر' : 'Price'} sectionKey="price">
                    <RangeFilter min={100} max={100000} value={filterState.priceRange}
                        onChange={(val) => dispatchFilterWithScroll({ type: 'SET_PRICE_RANGE', payload: val })} step={500} />
                </FilterSection>

                <FilterSection title={isRTL ? 'الكمية' : 'Quantity'} sectionKey="quantity">
                    <RangeFilter min={1} max={10000} value={filterState.quantityRange}
                        onChange={(val) => dispatchFilterWithScroll({ type: 'SET_QUANTITY_RANGE', payload: val })} step={50} />
                </FilterSection>

                <FilterSection title={isRTL ? 'التوصيل' : 'Delivery'} sectionKey="delivery">
                    <div className="space-y-2">
                        {[
                            { value: 'available', label: isRTL ? 'متاح' : 'Available' },
                            { value: 'not_available', label: isRTL ? 'غير متاح' : 'Not Available' },
                            { value: '50_governorate', label: isRTL ? '50ج داخل المحافظة' : '50 EGP within gov' },
                            { value: '50_governorate_cairo_giza', label: isRTL ? '50ج (المحافظة، القاهرة، الجيزة)' : '50 EGP (Gov, Cairo, Giza)' },
                            { value: '50_all', label: isRTL ? '50ج لجميع المحافظات' : '50 EGP to all' },
                            { value: '25_governorate', label: isRTL ? '25ج داخل المحافظة' : '25 EGP within gov' },
                            { value: '25_governorate_cairo_giza', label: isRTL ? '25ج (المحافظة، القاهرة، الجيزة)' : '25 EGP (Gov, Cairo, Giza)' },
                            { value: '25_all', label: isRTL ? '25ج لجميع المحافظات' : '25 EGP to all' },
                            { value: 'free_all', label: isRTL ? 'مجانًا لجميع المحافظات' : 'Free to all' }
                        ].map(opt => (
                            <label key={opt.value} className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-xs">
                                <input type="checkbox" checked={filterState.selectedDeliveryOptions.includes(opt.value)}
                                    onChange={() => {
                                        const newOpts = filterState.selectedDeliveryOptions.includes(opt.value)
                                            ? filterState.selectedDeliveryOptions.filter(o => o !== opt.value)
                                            : [...filterState.selectedDeliveryOptions, opt.value];
                                        dispatchFilterWithScroll({ type: 'SET_DELIVERY_OPTIONS', payload: newOpts });
                                    }} />
                                <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title={isRTL ? 'متاح تجهيز مزارع' : 'Farm Preparation'} sectionKey="farmPreparation">
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-sm">
                            <input type="checkbox" checked={filterState.farmPrep === true}
                                onChange={() => dispatchFilterWithScroll({ type: 'SET_FARM_PREP', payload: filterState.farmPrep === true ? null : true })} />
                            <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>{isRTL ? 'نعم' : 'Yes'}</span>
                        </label>
                        <label className="flex items-center cursor-pointer hover:bg-green-50 p-2.5 rounded-xl text-sm">
                            <input type="checkbox" checked={filterState.farmPrep === false}
                                onChange={() => dispatchFilterWithScroll({ type: 'SET_FARM_PREP', payload: filterState.farmPrep === false ? null : false })} />
                            <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>{isRTL ? 'لا' : 'No'}</span>
                        </label>
                    </div>
                </FilterSection>
            </div>

            <div className="p-5 border-t border-gray-200 bg-white flex-shrink-0">
                <button onClick={applyFilters}
                    className="w-full bg-gradient-to-r from-main to-green-600 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl">
                    <Check size={20} />
                    {isRTL ? 'تطبيق الفلاتر' : 'Apply Filters'}
                </button>
            </div>
        </div>
    );

    if (loading && currentPage === 1) return <Loader />;

    return (
        <div className="bg-gray-50 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {toast && (
                <div className={`fixed top-6 ${isRTL ? "left-6" : "right-6"} z-50`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl ${toast.type === "success" ? "bg-gradient-to-r from-main to-green-600 text-white" : "bg-red-500 text-white"}`}>
                        {toast.message}
                    </div>
                </div>
            )}

            <div className="flex min-h-screen">
                {!isViewAllPage && (
                    <div className={`hidden lg:block ${isRTL ? 'border-l' : 'border-r'} border-gray-200 bg-white`} style={{width: '320px', minWidth: '320px', height: '100vh', position: 'sticky', top: 0}}>
                        <FilterSidebar />
                    </div>
                )}

                {!isViewAllPage && isFilterOpen && (
                    <>
                        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsFilterOpen(false)} />
                        <div className={`lg:hidden fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 bg-white z-50 transform transition-transform ${
                            isFilterOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
                        }`}>
                            <FilterSidebar />
                        </div>
                    </>
                )}

                <div className={`flex-1 min-w-0 ${!isViewAllPage ? 'h-screen overflow-auto' : ''}`}>
                    <div className="w-full px-4 py-6">
                        <div className="flex items-center justify-between mb-6 gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-main">
                                {isViewAllPage 
                                    ? (isRTL ? 'جميع المنتجات' : 'All Products')
                                    : (isRTL 
                                        ? `منتجات ${currentCategory ? currentCategory.name_ar : ''}`
                                        : `${currentCategory ? currentCategory.name_en : ''} Products`
                                    )
                                }
                            </h1>
                            
                            <div className="flex items-center gap-3">
                                {isViewAllPage && (
                                    <div className="bg-white px-4 py-2 rounded-xl shadow-md">
                                        <span className="text-sm text-gray-600">
                                            {isRTL ? `${pagination.total} منتج` : `${pagination.total} products`}
                                        </span>
                                    </div>
                                )}
                                
                                {!isViewAllPage && (
                                    <button onClick={() => setIsFilterOpen(true)}
                                        className="lg:hidden flex items-center gap-3 bg-gradient-to-r from-main to-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex-shrink-0">
                                        <Filter size={20} />
                                        <span>{isRTL ? 'الفلاتر' : 'Filters'}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {products.length === 0 && !loading ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                                <div className="bg-gray-100 w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                                    {isRTL ? 'لا توجد منتجات' : 'No products found'}
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {isRTL ? 'جرب تعديل الفلاتر' : 'Try adjusting filters'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {loading && currentPage > 1 && (
                                    <div className="mb-4 text-center">
                                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md">
                                            <RefreshCw size={18} className="animate-spin text-main" />
                                            <span className="text-gray-600">{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} isFavorite={favorites.has(product.id)}
                                            onToggleFavorite={toggleFavorite} onProductClick={(id) => navigate(`/product-details/${id}`)}
                                            onContactSeller={handleContactSeller} />
                                    ))}
                                </div>

                                {pagination.last_page > 1 && (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} 
                                                disabled={currentPage === 1}
                                                className={`p-3 rounded-xl ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white border-2 border-gray-200 hover:border-main shadow-md'}`}>
                                                {isRTL ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                                            </button>

                                            <div className="flex gap-2">
                                                {Array.from({length: Math.min(5, pagination.last_page)}, (_, i) => i + 1).map(page => (
                                                    <button key={page} onClick={() => setCurrentPage(page)}
                                                        className={`min-w-[48px] h-[48px] px-4 rounded-xl font-bold ${
                                                            currentPage === page 
                                                                ? 'bg-gradient-to-r from-main to-green-600 text-white shadow-lg' 
                                                                : 'bg-white border-2 border-gray-200 hover:border-main shadow-md'
                                                        }`}>
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>

                                            <button onClick={() => currentPage < pagination.last_page && setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === pagination.last_page}
                                                className={`p-3 rounded-xl ${currentPage === pagination.last_page ? 'bg-gray-100 text-gray-400' : 'bg-white border-2 border-gray-200 hover:border-main shadow-md'}`}>
                                                {isRTL ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
                                            </button>
                                        </div>

                                        <div className="bg-white px-6 py-3 rounded-xl shadow-md">
                                            <p className="text-gray-600 text-sm">
                                                {isRTL 
                                                    ? `الصفحة ${pagination.current_page} من ${pagination.last_page}` 
                                                    : `Page ${pagination.current_page} of ${pagination.last_page}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;