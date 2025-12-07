import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import { useCart } from "../../contexts/CartContext";

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
    
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
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
            console.log(err);
            showToast(
                isRTL ? "فشل في تحميل الفئات" : "Failed to load categories",
                "error"
            );
        }
        setLoading(false);
    };

    const fetchPackages = async (categoryId) => {
        // Check cache first
        if (packagesCache[categoryId]) {
            setPackages(packagesCache[categoryId]);
            setSelectedCategory(categoryId);
            return;
        }

        setLoading(true);
        try {
            const res = await userAPI.get(`/packages/category/${categoryId}`);
            const packagesData = res.data?.data || [];
            
            // Cache the results
            setPackagesCache(prev => ({
                ...prev,
                [categoryId]: packagesData
            }));
            
            setPackages(packagesData);
            setSelectedCategory(categoryId);
        } catch (err) {
            console.log(err);
            showToast(
                isRTL ? "فشل في تحميل الباقات" : "Failed to load packages",
                "error"
            );
        }
        setLoading(false);
    };

    const addPackageToCart = async (packageId) => {
        setAddingToCart(prev => ({ ...prev, [packageId]: true }));
        const result = await addToCartContext(packageId, 1);
        
        if (result.success) {
            showToast(
                isRTL ? "تم إضافة الباقة إلى السلة" : "Package added to cart",
                "success"
            );
        } else {
            showToast(
                isRTL ? "حدث خطأ أثناء الإضافة" : "Error adding package",
                "error"
            );
        }
        setAddingToCart(prev => ({ ...prev, [packageId]: false }));
    };

    const handleCategoryClick = (categoryId) => {
        if (selectedCategory !== categoryId) {
            fetchPackages(categoryId);
        }
    };

    if (loading && categories.length === 0) {
        return <Loader />;
    }

    return (
        <div className={`w-full max-w-6xl mx-auto bg-white ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
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

            <div className="text-main text-center py-3 rounded-t-lg">
                <h1 className="text-xl md:text-2xl font-bold">
                    {isRTL ? "شراء الباقات" : "Purchase Packages"}
                </h1>
            </div>

            <div className="p-4 md:p-6 space-y-4">
                {/* Categories Tabs */}
                <div className="border-b-2 border-gray-200">
                    <div className="flex overflow-x-auto">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`flex-1 min-w-fit px-4 py-2.5 cursor-pointer font-semibold text-xs md:text-sm whitespace-nowrap transition-all relative ${
                                    selectedCategory === category.id
                                        ? "text-main"
                                        : "text-gray-600 hover:text-main"
                                }`}
                            >
                                {isRTL ? category.name_ar : category.name}
                                {selectedCategory === category.id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-main"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Packages Display */}
                {selectedCategory && (
                    <div className="pt-3">
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <Loader />
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <p className="text-sm">
                                    {isRTL ? "لا توجد باقات متاحة في هذه الفئة" : "No packages available in this category"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="mb-3">
                                            <h3 className="font-bold text-base text-main mb-1.5">
                                                {isRTL ? pkg.name_ar || pkg.name : pkg.name}
                                            </h3>
                                            <p className="text-gray-600 text-xs min-h-[2.5rem] leading-relaxed">
                                                {pkg.description}
                                            </p>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-lg font-bold text-main">
                                                    {pkg.price}
                                                </span>
                                                <span className="text-main text-xs">
                                                    {isRTL ? "جنيه" : "EGP"}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => addPackageToCart(pkg.id)}
                                            disabled={addingToCart[pkg.id]}
                                            className="w-full cursor-pointer bg-main hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                                        >
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