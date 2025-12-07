import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { topSellersAPI } from "../../api";

const SellerReviews = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const { sellerId } = useParams();

    // Top Seller Badge Component
    const TopSellerBadge = () => (
        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-yellow-700 whitespace-nowrap">
                {isRTL ? "توب سيلر" : "Top Seller"}
            </span>
        </div>
    );
    
    const [sellerData, setSellerData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [sellerId]);

    const fetchReviews = async (pageNum = 1) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await topSellersAPI.getSellerReviews(sellerId, { page: pageNum });
            const data = response.data?.data;
            
            if (pageNum === 1) {
                setSellerData(data?.seller);
                setReviews(data?.reviews || []);
            } else {
                setReviews(prev => [...prev, ...(data?.reviews || [])]);
            }
            
            setHasMore(data?.pagination?.current_page < data?.pagination?.total_pages);
            setPage(pageNum);
            
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchReviews(page + 1);
        }
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
                            className="w-4 h-4"
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
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
            </div>
        );
    }

    if (!sellerData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">{isRTL ? "لم يتم العثور على التاجر" : "Seller not found"}</p>
            </div>
        );
    }

    const getRatingBadges = () => {
        const badges = [];
        
        if (sellerData.summary?.honest_rating_avg >= 4) {
            badges.push({
                label: isRTL ? "امين" : "Honest",
                icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )
            });
        }
        
        if (sellerData.summary?.easy_to_deal_rating_avg >= 4) {
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

    const badges = getRatingBadges();

    return (
        <div className="min-h-screen bg-gray-50 py-8" dir={isRTL ? "rtl" : "ltr"}>
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <svg 
                            className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isRTL ? "تقييمات التاجر" : "Seller Reviews"}
                    </h1>
                </div>

                {/* Seller Card */}
                <div className="bg-white border-2 border-main rounded-2xl p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {isRTL ? sellerData.name_ar : sellerData.name}
                            </h2>
                            <div className="flex items-center gap-3 mb-3">
                                <TopSellerBadge size="md" showText={true} />
                                <div className="flex items-center gap-2">
                                    <StarRating rating={sellerData.summary?.overall_rating_avg || 0} />
                                    <span className="text-lg font-bold text-gray-900">
                                        {sellerData.summary?.overall_rating_avg?.toFixed(1) || "0.0"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rating Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-main" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-bold text-gray-700">
                                    {isRTL ? "امين" : "Honest"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <StarRating rating={sellerData.summary?.honest_rating_avg || 0} />
                                <span className="font-bold text-gray-900">
                                    {sellerData.summary?.honest_rating_avg?.toFixed(1) || "0.0"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-main" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span className="text-sm font-bold text-gray-700">
                                    {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <StarRating rating={sellerData.summary?.easy_to_deal_rating_avg || 0} />
                                <span className="font-bold text-gray-900">
                                    {sellerData.summary?.easy_to_deal_rating_avg?.toFixed(1) || "0.0"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {badges.map((badge, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1 bg-main/10 border border-main text-main rounded-full px-3 py-2"
                            >
                                {badge.icon}
                                <span className="text-sm font-bold">{badge.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="text-sm text-gray-500">
                        {sellerData.summary?.total_reviews || 0} {isRTL ? "تقييم" : "reviews"}
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {isRTL ? "التقييمات" : "Reviews"}
                    </h3>

                    {reviews.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl">
                            <p className="text-gray-500">{isRTL ? "لا توجد تقييمات" : "No reviews yet"}</p>
                        </div>
                    ) : (
                        <>
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                                    {/* Reviewer Info */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-main/10 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-main" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {isRTL ? review.reviewer.name_ar : review.reviewer.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(review.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ratings */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-main" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <StarRating rating={review.honest_rating} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-main" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                            </svg>
                                            <StarRating rating={review.easy_to_deal_rating} />
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    {review.comment && (
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Load More */}
                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="w-full py-3 bg-main text-white font-bold rounded-xl hover:bg-main/90 transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            {isRTL ? "جاري التحميل..." : "Loading..."}
                                        </span>
                                    ) : (
                                        isRTL ? "عرض المزيد" : "Load More"
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerReviews;