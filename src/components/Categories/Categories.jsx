import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCachedCategories, userAPI } from "../../api";

const CategoriesSkeleton = ({ isRTL }) => (
    <div className="mx-auto p-2" dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-2">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                 style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%'}}></div>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {[...Array(8)].map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg p-2 md:p-3 shadow-sm border-2 border-gray-200 bg-white"
                >
                    <div className="flex flex-col items-center text-center gap-1.5 md:gap-2">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                             style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%'}}></div>

                        <div className="w-full space-y-1">
                            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mx-auto"
                                 style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '80%'}}></div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mx-auto"
                                 style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '60%'}}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
);

const Categories = ({ mode = "products" }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [articlesSection, setArticlesSection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredId, setHoveredId] = useState(null);
    const [imageErrors, setImageErrors] = useState({});

    const titleText =
        mode === "products"
            ? t("home.categories.title")
            : t("home.categories.publishTitle");

    const handleCategoryClick = (categoryId, isActive) => {
        if (!isActive) return;

        if (mode === "products") {
            navigate(`/products/${categoryId}`);
        } else if (mode === "create-ad") {
            navigate(`/ads/create?category=${categoryId}`);
        }
    };

    const handleArticlesClick = () => {
        navigate('/articles');
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCachedCategories();
            const { data, fromCache } = response;
            console.log(fromCache ? '📦 Categories من الكاش' : '🌐 Categories من API');
            setCategories(data);
            
            try {
                const fullResponse = await userAPI.get('/categories');
                if (fullResponse.data.data.articles_section) {
                    setArticlesSection(fullResponse.data.data.articles_section);
                }
            } catch (err) {
                console.log('Articles section not available');
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageError = (categoryId) => {
        setImageErrors((prev) => ({ ...prev, [categoryId]: true }));
    };

    if (loading) {
        return <CategoriesSkeleton isRTL={isRTL} />;
    }

    return (
        <div className="mx-auto p-2" dir={isRTL ? "rtl" : "ltr"}>
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-main">{titleText}</h1>
            </div>

            <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {categories.map((item, index) => {
                    const isHovered = hoveredId === item.id;
                    const hasImageError = imageErrors[item.id];
                    const isFirstCard = index === 0;

                    return (
                        <div
                            key={item.id}
                            onMouseEnter={() => item.is_active && setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => handleCategoryClick(item.id, item.is_active)}
                            className={`rounded-lg p-2 md:p-3 shadow-sm border-2 transition-all duration-300 relative ${
                                !item.is_active
                                    ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300"
                                    : isFirstCard
                                    ? "bg-main border-main text-white cursor-pointer"
                                    : "bg-white border-main text-main cursor-pointer"
                            } ${
                                item.is_active && isHovered
                                    ? "shadow-lg -translate-y-1"
                                    : ""
                            }`}
                        >
                            {!item.is_active && (
                                <div className={`absolute top-1.5 ${isRTL ? 'left-1.5' : 'right-1.5'} bg-red-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded z-100`}>
                                    {t("home.categories.inactive")}
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center gap-1.5 md:gap-2">
                                <div className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center ${!item.is_active && "grayscale"}`}>
                                    {item.image && !hasImageError ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="w-full h-full object-contain rounded"
                                            onError={() => handleImageError(item.id)}
                                        />
                                    ) : (
                                        ""
                                    )}
                                </div>

                                <h3 className={`font-semibold text-xs md:text-sm leading-tight line-clamp-2 ${!item.is_active && "text-gray-500"}`}>
                                    {isRTL ? item.name_ar : item.name_en}
                                </h3>
                            </div>
                        </div>
                    );
                })}

                {mode === "products" && articlesSection && (
                    <div
                        onMouseEnter={() => setHoveredId('articles')}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={handleArticlesClick}
                        className={`rounded-lg p-2 md:p-3 shadow-sm border-2 transition-all duration-300 cursor-pointer bg-white border-main text-main ${
                            hoveredId === 'articles'
                                ? "shadow-lg -translate-y-1"
                                : ""
                        }`}
                    >
                        <div className="flex flex-col items-center text-center gap-1.5 md:gap-2">
                            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center">
                                {articlesSection.image && !imageErrors['articles'] ? (
                                    <img
                                        src={articlesSection.image}
                                        alt=""
                                        className="w-full h-full object-contain rounded"
                                        onError={() => handleImageError('articles')}
                                    />
                                ) : (
                                    ""
                                )}
                            </div>

                            <h3 className="font-semibold text-xs md:text-sm leading-tight line-clamp-2">
                                {isRTL ? articlesSection.name_ar : articlesSection.name_en}
                            </h3>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;