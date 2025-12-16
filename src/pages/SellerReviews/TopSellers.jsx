import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCachedTopSellers } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const TopSellers = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    // Top Seller Badge Component
    const TopSellerBadge = () => (
        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-yellow-700 whitespace-nowrap">
                {isRTL ? "أفضل التجار" : "Top Seller"}
            </span>
        </div>
    );
    
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopSellers();
    }, []);

    const fetchTopSellers = async () => {
        try {
            setLoading(true);
            const data = await getCachedTopSellers({ limit: 3, min_reviews: 5 });

            setSellers(data.data.sellers);
        } catch (error) {
            console.error("Error fetching top sellers:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRatingBadges = (seller) => {
        const badges = [];
        
        if (seller.honest_rating_avg >= 4) {
            badges.push({
                label: isRTL ? "امين" : "Honest",
                icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )
            });
        }
        
        if (seller.easy_to_deal_rating_avg >= 4) {
            badges.push({
                label: isRTL ? "سهل التعامل" : "Easy to Deal",
                icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                )
            });
        }
        
        return badges;
    };

    const StarRating = ({ rating }) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.floor(rating);
                    const isHalfFilled = star === Math.ceil(rating) && rating % 1 !== 0;
                    
                    return (
                        <svg
                            key={star}
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                        >
                            {(isFilled || isHalfFilled) && (
                                <>
                                    {isHalfFilled && (
                                        <defs>
                                            <linearGradient 
                                                id={`half-${star}-${rating}`} 
                                                x1="0%" 
                                                y1="0%" 
                                                x2="100%" 
                                                y2="0%"
                                            >
                                                <stop offset="0%" stopColor="#FBBF24" />
                                                <stop offset="50%" stopColor="#FBBF24" />
                                                <stop offset="50%" stopColor="#E5E7EB" />
                                                <stop offset="100%" stopColor="#E5E7EB" />
                                            </linearGradient>
                                        </defs>
                                    )}
                                    <path
                                        fill={isFilled ? "#FBBF24" : `url(#half-${star}-${rating})`}
                                        stroke="#F59E0B"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                    />
                                </>
                            )}
                            {!isFilled && !isHalfFilled && (
                                <path
                                    fill="#E5E7EB"
                                    stroke="#D1D5DB"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                            )}
                        </svg>
                    );
                })}
                <span className="text-sm text-gray-600 mr-1">
                    {rating?.toFixed(1) || "0.0"}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <div className="py-8" dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {isRTL ? "أفضل التجار" : "Top Sellers"}
                </h2>
                <button
                    onClick={() => navigate('/sellers-reviews')}
                    className="text-main hover:text-main/80 font-bold text-sm flex items-center gap-1"
                >
                    {isRTL ? "عرض المزيد" : "View More"}
                    <svg className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {sellers?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-600">
                        {isRTL ? "لا يوجد تجار متاحين حالياً" : "No sellers available at the moment"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {isRTL ? "تحقق مرة أخرى لاحقاً" : "Check back later"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sellers.map((seller, index) => {
                        const badges = getRatingBadges(seller);
                        
                        return (
                            <div
                                key={seller.id}
                                onClick={() => navigate(`/seller/${seller.id}/reviews`)}
                                className="bg-white border-2 border-main rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all relative"
                            >
                                {/* Top Seller Badge & Rank */}
                                <div className="flex items-center justify-between mb-3">
                                    <TopSellerBadge size="md" showText={true} />
                                    <div className="flex items-center gap-1">
                                        {index === 0 && (
                                            <span className="text-2xl">🥇</span>
                                        )}
                                        {index === 1 && (
                                            <span className="text-2xl">🥈</span>
                                        )}
                                        {index === 2 && (
                                            <span className="text-2xl">🥉</span>
                                        )}
                                    </div>
                                </div>

                                {/* Seller Name */}
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {isRTL ? seller.name_ar : seller.name}
                                </h3>

                                {/* Overall Rating */}
                                <div className="mb-3">
                                    <StarRating rating={seller.overall_rating_avg} />
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {badges.map((badge, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1 bg-main/10 border border-main text-main rounded-full px-3 py-1"
                                        >
                                            {badge.icon}
                                            <span className="text-xs font-bold">{badge.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Review Count */}
                                <div className="text-sm text-gray-500">
                                    {seller.total_reviews} {isRTL ? "تقييم" : "reviews"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TopSellers;