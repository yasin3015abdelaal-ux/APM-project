import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCachedTopSellers } from "../../../api";

const TopSellersSkeleton = ({ isRTL }) => (
    <div className="mb-4" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-2 px-3">
            <div className="h-8 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
            <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
        </div>

        {/* Sellers Cards Skeleton */}
        <div className="space-y-3 sm:space-y-4 px-3 sm:px-4">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="bg-white border-2 border-gray-200 rounded-2xl sm:rounded-3xl p-3 sm:p-4"
                >
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-3 sm:hidden">
                        <div className="flex items-center gap-2.5">
                            {/* Avatar Skeleton */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse flex-shrink-0"
                                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>

                            {/* Name Skeleton */}
                            <div className="flex-1 min-w-0">
                                <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-1"
                                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '60%' }}></div>
                            </div>

                            {/* Stars Skeleton */}
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <div key={star} className="w-4 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                                        style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                                ))}
                            </div>
                        </div>

                        {/* Badges Skeleton */}
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {[1, 2, 3, 4].map((badge) => (
                                <div key={badge} className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"
                                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Avatar Skeleton */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse flex-shrink-0"
                                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>

                            <div className="flex-1 min-w-0">
                                {/* Name Skeleton */}
                                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-2"
                                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '50%' }}></div>

                                {/* Stars Skeleton */}
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <div key={star} className="w-5 h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                                            style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Badges Skeleton */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex flex-wrap gap-2 justify-end">
                                {[1, 2, 3, 4].map((badge) => (
                                    <div key={badge} className="h-7 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"
                                        style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                                ))}
                            </div>
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

const TopSellers = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current) {
            fetchTopSellers();
            hasFetched.current = true;
        }
    }, []);

    const fetchTopSellers = async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, fromCache } = await getCachedTopSellers({ limit: 10, min_reviews: 1 });

            console.log(fromCache ? '📦 Top Sellers from cache' : '🌐 Top Sellers from API');
            console.log('Fetched sellers:', data);

            if (Array.isArray(data)) {
                setSellers(data);
            } else if (data && Array.isArray(data.sellers)) {
                setSellers(data.sellers);
            } else {
                console.warn("Unexpected data format:", data);
                setSellers([]);
            }
        } catch (error) {
            console.error("Error fetching top sellers:", error);
            setError(true);
            setSellers([]);
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ rating }) => {
        const { i18n } = useTranslation();
        const isRTL = i18n.language === 'ar';

        const uniqueId = `star-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="flex items-center gap-1">
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        <linearGradient
                            id={`half-gradient-${uniqueId}`}
                            x1={isRTL ? "100%" : "0%"}
                            y1="0%"
                            x2={isRTL ? "0%" : "100%"}
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#FBBF24" />
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="50%" stopColor="transparent" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                </svg>

                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.floor(rating);
                    const isHalfFilled = star === Math.ceil(rating) && rating % 1 !== 0;

                    return (
                        <svg
                            key={star}
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                        >
                            {/* Empty star background */}
                            <path
                                className="stroke-gray-300"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />

                            {/* Filled star */}
                            {(isFilled || isHalfFilled) && (
                                <path
                                    fill={isFilled ? "#FBBF24" : `url(#half-gradient-${uniqueId})`}
                                    stroke="#F59E0B"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                            )}
                        </svg>
                    );
                })}
                <span className="text-xs sm:text-sm font-semibold text-gray-700 mx-0.5 sm:mx-1">
                    {(rating || 0).toFixed(1)}
                </span>
            </div>
        );
    };

    if (loading) {
        return <TopSellersSkeleton isRTL={isRTL} />;
    }

    const displayedSellers = sellers.slice(0, 3);

    return (
        <div className="mb-4" dir={isRTL ? "rtl" : "ltr"}>
            <style>{`
                @keyframes swing {
                    0%, 100% { 
                        transform: rotate(-4deg);
                    }
                    50% { 
                        transform: rotate(4deg);
                    }
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-3">
                <h2 className="text-xl sm:text-2xl font-bold text-main">
                    {isRTL ? "افضل التجار" : "Top Sellers"}
                </h2>
                <button
                    onClick={() => navigate('/top-sellers')}
                    className="text-main hover:text-main/80 cursor-pointer font-medium text-xs sm:text-sm flex items-center gap-1 transition-colors"
                >
                    {isRTL ? "عرض المزيد" : "View More"}
                    <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {sellers.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 mx-3 sm:mx-4">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-base sm:text-lg font-medium text-gray-600 px-4">
                        {isRTL ? "لا يوجد تجار متاحين حالياً" : "No sellers available at the moment"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {isRTL ? "تحقق مرة أخرى لاحقاً" : "Check back later"}
                    </p>
                    {error && (
                        <button
                            onClick={() => {
                                hasFetched.current = false;
                                fetchTopSellers();
                            }}
                            className="mt-4 px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90 transition-colors text-sm"
                        >
                            {isRTL ? "حاول مرة أخرى" : "Try Again"}
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4 px-3 sm:px-4">
                    {displayedSellers.map((seller, index) => {
                        const showMedal = index < 3;

                        return (
                            <div
                                key={seller.id}
                                onClick={() => navigate(`/seller/${seller.id}`)}
                                className="bg-white border-2 border-main rounded-2xl sm:rounded-3xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                            >
                                {showMedal && (
                                    <div
                                        className="absolute flex-shrink-0 z-10 left-1/2 -translate-x-1/2"
                                        style={{
                                            top: '-3px',
                                            animation: 'swing 2.5s ease-in-out infinite',
                                            animationDelay: `${index * 0.3}s`,
                                            transformOrigin: 'top center'
                                        }}
                                    >
                                        {/* Medal */}
                                        <div
                                            className="text-3xl sm:text-5xl relative"
                                            style={{
                                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                                                lineHeight: '1',
                                            }}
                                        >
                                            {index === 0 && "🥇"}
                                            {index === 1 && "🥈"}
                                            {index === 2 && "🥉"}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 sm:hidden">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center border-2 border-main/20 overflow-hidden flex-shrink-0">
                                            {seller.image ? (
                                                <img src={seller.image} alt={seller.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-main font-bold text-xl">
                                                    {seller.name?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-gray-900 truncate">
                                                {seller.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <StarRating rating={seller.rating_avg || 0} />
                                        </div>
                                    </div>


                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        <div className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                            {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                        </div>

                                        {seller.rating_avg >= 4 && (
                                            <div className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                {isRTL ? "امين" : "Honest"}
                                            </div>
                                        )}

                                        {seller.rating_avg >= 4 && (
                                            <div className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                            </div>
                                        )}
                                        {seller.rating_avg >= 4 && (
                                            <div className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                {isRTL ? "بضاعة ممتازة" : "Great Product Quality"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center border-2 border-main/20 overflow-hidden flex-shrink-0">
                                            {seller.image ? (
                                                <img src={seller.image} alt={seller.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-main font-bold text-2xl">
                                                    {seller.name?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">
                                                {seller.name}
                                            </h3>
                                            <StarRating rating={seller.rating_avg || 0} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <div className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                            </div>
                                            {seller.rating_avg >= 4 && (
                                                <div className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                    {isRTL ? "امين" : "Honest"}
                                                </div>
                                            )}
                                            {seller.rating_avg >= 4 && (
                                                <div className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                    {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                                </div>
                                            )}
                                            {seller.rating_avg >= 4 && (
                                                <div className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                    {isRTL ? "بضاعة ممتازة" : "Great Product Quality"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default TopSellers;