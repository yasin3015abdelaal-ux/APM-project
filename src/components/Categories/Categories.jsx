import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import Loader from "../Ui/Loader/Loader";

const Categories = ({ mode = "products" }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await userAPI.get("/categories");
            setCategories(response.data.data.product_categories || []);
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
        return (
            <Loader />
        );
    }

    return (
        <div className="min-h-screen p-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-main">{titleText}</h1>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {categories.map((item) => {
                    const isHovered = hoveredId === item.id;
                    const hasImageError = imageErrors[item.id];

                    return (
                        <div
                            key={item.id}
                            onMouseEnter={() => item.is_active && setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => handleCategoryClick(item.id, item.is_active)}
                            className={`rounded-lg p-3 md:p-4 shadow-sm border-2 transition-all duration-300 relative ${!item.is_active
                                    ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300"
                                    : isHovered
                                        ? "bg-main border-main text-white transform scale-105 shadow-lg cursor-pointer"
                                        : "bg-white border-main text-main hover:shadow-md cursor-pointer"
                                }`}
                        >
                            {!item.is_active && (
                                <div className={`absolute top-1.5 ${isRTL ? 'left-1.5' : 'right-1.5'} bg-red-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded`}>
                                    {t("home.categories.inactive")}
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center gap-2 md:gap-3">
                                <div
                                    className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center ${!item.is_active && "grayscale"
                                        }`}
                                >
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

                                <h3
                                    className={`font-semibold text-xs md:text-sm leading-tight line-clamp-2 ${!item.is_active && "text-gray-500"
                                        }`}
                                >
                                    {isRTL ? item.name_ar : item.name_en}
                                </h3>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Categories;