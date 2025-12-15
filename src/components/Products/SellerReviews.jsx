import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { topSellersAPI } from "../../api";

const SellerReviewsCarousel = ({ sellerId }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const scrollRef = useRef(null);
    
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedReviews, setExpandedReviews] = useState({});
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    useEffect(() => {
        fetchReviews();
    }, [sellerId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await topSellersAPI.getSellerReviews(sellerId, { page: 1 });
            const data = response.data?.data;
            setReviews(data?.reviews || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError(isRTL ? 'فشل تحميل التقييمات' : 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (reviewId) => {
        setExpandedReviews(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    // Auto-scroll effect
    useEffect(() => {
        if (reviews.length === 0) return;

        const interval = setInterval(() => {
            if (scrollRef.current && !isDragging.current) {
                const container = scrollRef.current;
                const cardWidth = 320;
                const gap = 16;
                const scrollAmount = cardWidth + gap;

                if (isRTL) {
                    const currentScroll = Math.abs(container.scrollLeft);
                    const maxScroll = container.scrollWidth - container.clientWidth;

                    if (currentScroll >= maxScroll - 10) {
                        container.scrollTo({ left: 0, behavior: "smooth" });
                    } else {
                        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                    }
                } else {
                    const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;

                    if (atEnd) {
                        container.scrollTo({ left: 0, behavior: "smooth" });
                    } else {
                        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
                    }
                }
            }
        }, 4000);
        
        return () => clearInterval(interval);
    }, [isRTL, reviews]);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const StarRating = ({ rating }) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.floor(rating);
                    const isHalfFilled = star === Math.ceil(rating) && rating % 1 !== 0;
                    
                    return (
                        <svg
                            key={star}
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                        >
                            {(isFilled || isHalfFilled) && (
                                <>
                                    {isHalfFilled && (
                                        <defs>
                                            <linearGradient 
                                                id={`half-${star}-${rating}`} 
                                                x1={isRTL ? "100%" : "0%"} 
                                                y1="0%" 
                                                x2={isRTL ? "0%" : "100%"} 
                                                y2="0%"
                                            >
                                                <stop offset="0%" stopColor="#F59E0B" />
                                                <stop offset="50%" stopColor="#F59E0B" />
                                                <stop offset="50%" stopColor="#E5E7EB" />
                                                <stop offset="100%" stopColor="#E5E7EB" />
                                            </linearGradient>
                                        </defs>
                                    )}
                                    <path
                                        fill={isFilled ? "#F59E0B" : `url(#half-${star}-${rating})`}
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
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return isRTL ? 'اليوم' : 'Today';
        } else if (diffDays === 1) {
            return isRTL ? 'أمس' : 'Yesterday';
        } else if (diffDays < 7) {
            return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    if (loading) {
        return (
            <div className="w-full py-6">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full py-6">
                <div className="text-center text-red-600">{error}</div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return null;
    }

    return (
        <div dir={isRTL ? "rtl" : "ltr"} className="w-full select-none mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
                {isRTL ? "تقييمات العملاء" : "Customer Reviews"}
            </h3>

            <div className="py-3">
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto py-2 scroll-smooth snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    {reviews.map((review) => {
                        const isExpanded = expandedReviews[review.id];
                        
                        return (
                            <div
                                draggable={false}
                                key={review.id}
                                className="relative min-w-[320px] max-w-[320px] h-[380px] snap-start rounded-xl shadow-md bg-white shrink-0 hover:shadow-xl transition-shadow select-none overflow-hidden border border-gray-100"
                            >
                                {/* Header with gradient */}
                                <div className="bg-gradient-to-br from-main to-main/80 p-4 pb-16">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                            {review.reviewer.image ? (
                                                <img
                                                    src={review.reviewer.image}
                                                    alt={review.reviewer.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <svg 
                                                className={`${review.reviewer.image ? 'hidden' : 'block'} w-6 h-6 text-main`}
                                                fill="currentColor" 
                                                viewBox="0 0 20 20"
                                            >
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">
                                                {review.reviewer.name}
                                            </p>
                                            <p className="text-xs text-white/80">
                                                {formatDate(review.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating Badge - Overlapping */}
                                <div className="absolute top-[85px] left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3 border-4 border-white">
                                    <StarRating rating={review.rating} />
                                    <span className="font-bold text-2xl text-main">
                                        {review.rating.toFixed(1)}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4 pt-12">
                                    {/* Ratings Details */}
                                    <div className="space-y-2.5 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700 font-medium text-sm">
                                                    {isRTL ? "الأمانة" : "Honesty"}
                                                </span>
                                            </div>
                                            <StarRating rating={review.rating_honest} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700 font-medium text-sm">
                                                    {isRTL ? "سهولة التعامل" : "Easy Deal"}
                                                </span>
                                            </div>
                                            <StarRating rating={review.rating_easy_to_deal_with} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700 font-medium text-sm">
                                                    {isRTL ? "الجودة" : "Quality"}
                                                </span>
                                            </div>
                                            <StarRating rating={review.rating_product_quality} />
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    {review.comment && (
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                                            <p 
                                                className={`text-gray-700 text-xs leading-relaxed ${
                                                    !isExpanded ? 'line-clamp-1' : ''
                                                }`}
                                            >
                                                {review.comment}
                                            </p>
                                            {review.comment.length > 50 && (
                                                <button
                                                    onClick={() => toggleExpand(review.id)}
                                                    className="text-main text-[10px] font-semibold mt-1 hover:text-main/80 transition-colors"
                                                >
                                                    {isExpanded 
                                                        ? (isRTL ? 'أقل ▲' : 'Less ▲')
                                                        : (isRTL ? 'المزيد ▼' : 'More ▼')
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SellerReviewsCarousel;