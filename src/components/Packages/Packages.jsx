import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import { useCart } from "../../contexts/CartContext";
import { Package, Sparkles, Zap, Star, Gem, ShoppingCart } from "lucide-react";

const Packages = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const { addToCart: addToCartContext } = useCart();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [toast, setToast] = useState(null);
    const [addingToCart, setAddingToCart] = useState({});
    const [packagesCache, setPackagesCache] = useState({});
    const [specialEffects, setSpecialEffects] = useState([]);
    
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const generateSpecialEffects = (categoryType) => {
        let effects = [];
        
        if (categoryType === 'offer') {
            effects = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                top: -50 - (Math.random() * 200), 
                delay: Math.random() * 0.3,
                duration: 1 + Math.random() * 1.5,
                color: [
                    '#ec4899', '#a855f7', '#3b82f6', '#f59e0b', '#10b981',
                    '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6',
                    '#f97316', '#84cc16', '#ef4444', '#22d3ee', '#a78bfa',
                    '#fb923c', '#34d399', '#f472b6', '#60a5fa', '#fbbf24'
                ][Math.floor(Math.random() * 20)],
                size: 6 + Math.random() * 12,
                shape: Math.random() > 0.5 ? 'circle' : 'square'
            }));
        }
        
        setSpecialEffects(effects);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0].id);
            fetchPackages(categories[0].id);
        }
    }, [categories]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await userAPI.get("/package-categories");
            setCategories(res.data?.data || []);
        } catch (err) {
            showToast(isRTL ? "فشل في تحميل الفئات" : "Failed to load categories", "error");
        }
        setLoading(false);
    };

    const isSpecialCategory = (category, type) => {
        const nameAr = category.name_ar?.toLowerCase() || '';
        const nameEn = category.name?.toLowerCase() || '';
        
        const keywords = {
            offer: ['عرض', 'offer', 'special'],
            auction: ['مزاد', 'auction'],
            premium: ['مميز', 'premium', 'featured']
        };
        
        return keywords[type]?.some(word => nameAr.includes(word) || nameEn.includes(word));
    };

    const getCategoryType = (category) => {
        if (isSpecialCategory(category, 'offer')) return 'offer';
        return null;
    };

    const fetchPackages = async (categoryId) => {
        if (packagesCache[categoryId]) {
            setPackages(packagesCache[categoryId]);
            setSelectedCategory(categoryId);
            
            const category = categories.find(c => c.id === categoryId);
            const categoryType = getCategoryType(category);
            if (categoryType) {
                generateSpecialEffects(categoryType);
            } else {
                setSpecialEffects([]);
            }
            return;
        }

        setLoading(true);
        try {
            const res = await userAPI.get(`/packages/category/${categoryId}`);
            const packagesData = res.data?.data || [];
            
            setPackagesCache(prev => ({ ...prev, [categoryId]: packagesData }));
            setPackages(packagesData);
            setSelectedCategory(categoryId);
            
            const category = categories.find(c => c.id === categoryId);
            const categoryType = getCategoryType(category);
            if (categoryType) {
                generateSpecialEffects(categoryType);
            } else {
                setSpecialEffects([]);
            }
        } catch (err) {
            showToast(isRTL ? "فشل في تحميل الباقات" : "Failed to load packages", "error");
        }
        setLoading(false);
    };

    const addPackageToCart = async (packageId) => {
        setAddingToCart(prev => ({ ...prev, [packageId]: true }));
        const result = await addToCartContext(packageId, 1);
        
        showToast(
            result.success 
                ? (isRTL ? "تم إضافة الباقة إلى السلة" : "Package added to cart")
                : (isRTL ? "حدث خطأ أثناء الإضافة" : "Error adding package"),
            result.success ? "success" : "error"
        );
        setAddingToCart(prev => ({ ...prev, [packageId]: false }));
    };

    const getCategoryStyle = (category, isSelected, index) => {
        if (index === 0) {
            return {
                bg: isSelected ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-white',
                text: isSelected ? 'text-white' : 'text-gray-700',
                border: isSelected ? 'border-emerald-500' : 'border-gray-300',
                shadow: isSelected ? 'shadow-lg shadow-emerald-500/30' : 'shadow-sm',
                icon: 'Package'
            };
        }
        
        if (isSpecialCategory(category, 'offer')) {
            return {
                bg: isSelected 
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' 
                    : 'bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50',
                text: isSelected ? 'text-white' : 'text-purple-700',
                border: 'border-purple-400',
                shadow: isSelected ? 'shadow-xl shadow-purple-500/40' : 'shadow-sm',
                icon: 'Sparkles',
                glow: isSelected
            };
        }
        
        if (isSpecialCategory(category, 'auction')) {
            return {
                bg: isSelected 
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500' 
                    : 'bg-gradient-to-r from-amber-50 via-orange-50 to-red-50',
                text: isSelected ? 'text-white' : 'text-amber-700',
                border: 'border-amber-400',
                shadow: isSelected ? 'shadow-xl shadow-amber-500/40' : 'shadow-sm',
                icon: 'Zap',
                glow: isSelected
            };
        }
        
        if (isSpecialCategory(category, 'premium')) {
            return {
                bg: isSelected 
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-red-500' 
                    : 'bg-gradient-to-r from-rose-50 via-pink-50 to-red-50',
                text: isSelected ? 'text-white' : 'text-rose-700',
                border: 'border-rose-400',
                shadow: isSelected ? 'shadow-xl shadow-rose-500/40' : 'shadow-sm',
                icon: 'Star',
                glow: isSelected
            };
        }
        
        return {
            bg: isSelected 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                : 'bg-gradient-to-r from-blue-50 to-cyan-50',
            text: isSelected ? 'text-white' : 'text-blue-700',
            border: 'border-blue-400',
            shadow: isSelected ? 'shadow-lg shadow-blue-500/30' : 'shadow-sm',
            icon: 'Gem'
        };
    };

    const getPackageCardStyle = (category) => {
        if (isSpecialCategory(category, 'offer')) {
            return {
                border: 'border-purple-400',
                shadow: 'hover:shadow-xl hover:shadow-purple-200',
                badge: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
                button: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600',
                price: 'text-purple-600',
                bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'
            };
        }
        
        if (isSpecialCategory(category, 'auction')) {
            return {
                border: 'border-amber-400',
                shadow: 'hover:shadow-xl hover:shadow-amber-200',
                badge: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
                button: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600',
                price: 'text-amber-600',
                bg: 'bg-amber-50'
            };
        }
        
        if (isSpecialCategory(category, 'premium')) {
            return {
                border: 'border-rose-400',
                shadow: 'hover:shadow-xl hover:shadow-rose-200',
                badge: 'bg-gradient-to-r from-rose-500 to-red-500 text-white',
                button: 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 hover:from-rose-600 hover:via-red-600 hover:to-pink-600',
                price: 'text-rose-600',
                bg: 'bg-rose-50'
            };
        }
        
        return {
            border: 'border-gray-300',
            shadow: 'hover:shadow-md',
            button: 'bg-main hover:bg-green-700',
            price: 'text-main',
            bg: 'bg-white'
        };
    };

    if (loading && categories.length === 0) {
        return <Loader />;
    }

    const selectedCategoryData = categories.find(c => c.id === selectedCategory);
    const cardStyle = selectedCategoryData ? getPackageCardStyle(selectedCategoryData) : {
        border: 'border-gray-300',
        shadow: 'hover:shadow-md',
        button: 'bg-main hover:bg-green-700',
        price: 'text-main',
        bg: 'bg-white'
    };

    return (
        <div className={`w-full max-w-7xl mx-auto bg-white ${isRTL ? "rtl" : "ltr"} relative overflow-hidden`} dir={isRTL ? "rtl" : "ltr"}>
            <style>{`
                @keyframes fall-effect {
                    to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .special-effect {
                    position: fixed;
                    animation: fall-effect linear forwards;
                    z-index: 9999;
                    pointer-events: none;
                    will-change: transform;
                }
                @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 15px currentColor; }
                    50% { box-shadow: 0 0 25px currentColor, 0 0 35px currentColor; }
                }
                .animate-glow {
                    animation: glow-pulse 2s ease-in-out infinite;
                }
                @keyframes badge-bounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-5px) rotate(-5deg); }
                    50% { transform: translateY(-10px) rotate(0deg); }
                    75% { transform: translateY(-5px) rotate(5deg); }
                }
                .group:hover .animate-badge-bounce {
                    animation: badge-bounce 0.6s ease-in-out;
                }
            `}</style>

            {specialEffects.map((effect) => (
                <div
                    key={effect.id}
                    className="special-effect"
                    style={{
                        left: `${effect.left}%`,
                        top: `${effect.top}px`,
                        backgroundColor: effect.color,
                        width: `${effect.size}px`,
                        height: `${effect.size}px`,
                        animationDelay: `${effect.delay}s`,
                        animationDuration: `${effect.duration}s`,
                        borderRadius: effect.shape === 'circle' ? '50%' : '0'
                    }}
                />
            ))}

            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 max-w-md`}>
                    <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d={toast.type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="text-main text-center py-4">
                <h1 className="text-3xl font-bold">
                    {isRTL ? "شراء الباقات" : "Purchase Packages"}
                </h1>
            </div>

            <div className="p-6 space-y-6">
                <div className={`grid gap-3 ${
                    categories.length <= 2 ? `grid-cols-${categories.length}` :
                    categories.length === 3 ? 'grid-cols-3' :
                    'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                }`}>
                    {categories.map((category, index) => {
                        const style = getCategoryStyle(category, selectedCategory === category.id, index);
                        const isSelected = selectedCategory === category.id;
                        const IconComponent = {
                            Package, Sparkles, Zap, Star, Gem
                        }[style.icon];
                        
                        return (
                            <button
                                key={category.id}
                                onClick={() => selectedCategory !== category.id && fetchPackages(category.id)}
                                className={`
                                    group relative px-3 py-3 rounded-xl font-bold text-sm
                                    transition-all duration-300 transform cursor-pointer
                                    ${style.bg} ${style.text} ${style.shadow}
                                    border-2 ${style.border}
                                    ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02]'}
                                    ${style.glow ? 'animate-glow' : ''}
                                    overflow-hidden
                                `}
                            >
                                <div className="relative z-10 flex flex-col items-center gap-1.5">
                                    <IconComponent className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                                    <span className="leading-tight text-xs">
                                        {isRTL ? category.name_ar : category.name}
                                    </span>
                                </div>
                                
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                            </button>
                        );
                    })}
                </div>

                {selectedCategory && (
                    <div className="pt-3">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader /></div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                {isRTL ? "لا توجد باقات متاحة في هذه الفئة" : "No packages available in this category"}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className={`
                                            group
                                            ${cardStyle.bg} border-2 ${cardStyle.border} rounded-xl p-5 
                                            shadow-md ${cardStyle.shadow} transition-all duration-300
                                            hover:scale-105 hover:-translate-y-2
                                        `}
                                    >
                                        {cardStyle.badge && (
                                            <div className="flex justify-end mb-2">
                                                <span className={`${cardStyle.badge} px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 animate-badge-bounce`}>
                                                    <Star className="w-3 h-3" />
                                                    {isRTL ? "مميز" : "Special"}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="mb-4">
                                            <h3 className={`font-bold text-lg ${cardStyle.price} mb-2`}>
                                                {isRTL ? pkg.name_ar || pkg.name : pkg.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm min-h-[3rem] leading-relaxed">
                                                {pkg.description}
                                            </p>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-2xl font-extrabold ${cardStyle.price}`}>
                                                    {pkg.price}
                                                </span>
                                                <span className={`${cardStyle.price} text-sm font-semibold`}>
                                                    {isRTL ? "جنيه" : "EGP"}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => addPackageToCart(pkg.id)}
                                            disabled={addingToCart[pkg.id]}
                                            className={`
                                                w-full ${cardStyle.button} text-white font-bold 
                                                py-3 px-4 rounded-lg transition-all duration-300
                                                disabled:bg-gray-400 disabled:cursor-not-allowed 
                                                hover:shadow-xl transform hover:scale-105
                                                cursor-pointer flex items-center justify-center gap-2
                                            `}
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            {addingToCart[pkg.id]
                                                ? (isRTL ? "جاري الإضافة..." : "Adding...")
                                                : (isRTL ? "أضف إلى السلة" : "Add to Cart")}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Packages;