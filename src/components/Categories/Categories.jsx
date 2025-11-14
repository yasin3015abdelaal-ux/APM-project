import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";

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
            setCategories(response.data.data || []);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-main">{titleText}</h1>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((item) => {
                    const isHovered = hoveredId === item.id;
                    const hasImageError = imageErrors[item.id];

                    return (
                        <div
                            key={item.id}
                            onMouseEnter={() => item.is_active && setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => handleCategoryClick(item.id, item.is_active)}
                            className={`rounded-lg p-6 shadow-sm border-2 transition-all duration-300 relative ${!item.is_active
                                    ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300"
                                    : isHovered
                                        ? "bg-main border-main text-white transform scale-105 shadow-lg cursor-pointer"
                                        : "bg-white border-main text-main hover:shadow-md cursor-pointer"
                                }`}
                        >
                            {!item.is_active && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                    {t("home.categories.inactive")}
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center gap-3">
                                <div
                                    className={`w-16 h-16 flex items-center justify-center ${!item.is_active && "grayscale"
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
                                    className={`font-semibold text-lg ${!item.is_active && "text-gray-500"
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
