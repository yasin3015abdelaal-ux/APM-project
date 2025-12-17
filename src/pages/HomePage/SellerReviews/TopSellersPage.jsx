import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCachedTopSellers } from "../../../api";
import Loader from "../../../components/Ui/Loader/Loader";

const StarRating = ({ rating }) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const uniqueId = `star-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="flex items-center gap-1 justify-center">
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
                        className="w-5 h-5 sm:w-5 sm:h-5"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                    >
                        <path
                            className="stroke-gray-300"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />

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

const TopSellersPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [displayCount, setDisplayCount] = useState(8);
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
            const { data, fromCache } = await getCachedTopSellers({ limit: 30, min_reviews: 1 });

            console.log(fromCache ? '📦 Top Sellers from cache' : '🌐 Top Sellers from API');

            if (Array.isArray(data)) {
                setSellers(data);
            } else if (data && Array.isArray(data.sellers)) {
                setSellers(data.sellers);
            } else {
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

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + 5);
    };

    const handleShowLess = () => {
        setDisplayCount(8);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return <Loader />;
    }

    const topThree = sellers.slice(0, 3);
    const restSellers = sellers.slice(3);
    const displayedSellers = restSellers.slice(0, displayCount - 3);

    return (
        <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes swing {
                    0%, 100% { transform: rotate(-4deg); }
                    50% { transform: rotate(4deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.6); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                @keyframes crownBounce {
                    0%, 100% { 
                        transform: translateY(0) scale(1) rotate(0deg);
                    }
                    25% { 
                        transform: translateY(-15px) scale(1.15) rotate(-5deg);
                    }
                    50% { 
                        transform: translateY(-8px) scale(1.1) rotate(0deg);
                    }
                    75% { 
                        transform: translateY(-12px) scale(1.12) rotate(5deg);
                    }
                }
                @keyframes crownSparkle {
                    0%, 100% { 
                        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)) brightness(1);
                    }
                    50% { 
                        filter: drop-shadow(0 6px 20px rgba(251, 191, 36, 0.8)) brightness(1.3);
                    }
                }
                @keyframes crownGlow {
                    0%, 100% { 
                        text-shadow: 0 0 10px rgba(251, 191, 36, 0.5),
                                    0 0 20px rgba(251, 191, 36, 0.3);
                    }
                    50% { 
                        text-shadow: 0 0 20px rgba(251, 191, 36, 0.8),
                                    0 0 30px rgba(251, 191, 36, 0.6),
                                    0 0 40px rgba(251, 191, 36, 0.4);
                    }
                }
                .animate-crown-bounce {
                    animation: crownBounce 2s ease-in-out infinite;
                }
                .animate-crown-sparkle {
                    animation: crownSparkle 2s ease-in-out infinite;
                }
                .animate-crown-glow {
                    animation: crownGlow 2s ease-in-out infinite;
                }
            `}</style>

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-main mb-3">
                        {isRTL ? "أفضل التجار" : "Top Sellers"}
                    </h1>
                </div>

                {sellers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-xl font-medium text-gray-900 mb-1">
                            {isRTL ? "لا يوجد تجار" : "No sellers found"}
                        </p>
                        <p className="text-gray-500">
                            {isRTL ? "تحقق مرة أخرى لاحقاً" : "Check back later"}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-16">
                            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto items-end">
                                {/* Second Place */}
                                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                    {topThree[1] && (
                                        <div
                                            onClick={() => navigate(`/seller/${topThree[1].id}`)}
                                            className="relative cursor-pointer group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-main"
                                        >
                                            <div
                                                className="absolute flex-shrink-0 z-10 left-1/2 -translate-x-1/2"
                                                style={{
                                                    top: '-3px',
                                                    animation: 'swing 2.5s ease-in-out infinite',
                                                    animationDelay: '0.3s',
                                                    transformOrigin: 'top center'
                                                }}
                                            >
                                                <div className="text-3xl sm:text-5xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
                                                    🥈
                                                </div>
                                            </div>

                                            <div className="text-center pt-7 sm:pt-12">
                                                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center overflow-hidden mb-2 sm:mb-4 border-2 border-main/30">
                                                    {topThree[1].image ? (
                                                        <img src={topThree[1].image} alt={topThree[1].name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-main font-black text-xl sm:text-3xl">
                                                            {topThree[1].name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 truncate px-1">
                                                    {topThree[1].name}
                                                </h3>
                                                <div className="scale-85 sm:scale-100">
                                                    <StarRating rating={topThree[1].rating_avg || 0} />
                                                </div>

                                                <div className="mt-2 sm:mt-4 hidden sm:flex flex-wrap gap-1.5 justify-center">
                                                    <span className="bg-main text-white rounded-full px-3 py-1 text-xs font-bold">
                                                        {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                                    </span>
                                                    {topThree[1].rating_avg >= 4 && (
                                                        <>
                                                            <span className="bg-main text-white rounded-full px-3 py-1 text-xs font-bold">
                                                                {isRTL ? "امين" : "Honest"}
                                                            </span>
                                                            <span className="bg-main text-white rounded-full px-3 py-1 text-xs font-bold">
                                                                {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* First Place */}
                                <div className="animate-fade-in">
                                    {topThree[0] && (
                                        <div
                                            onClick={() => navigate(`/seller/${topThree[0].id}`)}
                                            className="relative cursor-pointer group bg-gradient-to-br from-yellow-50 via-white to-yellow-50 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 sm:border-4 border-yellow-400 animate-pulse-glow"
                                            style={{
                                                boxShadow: '0 10px 40px rgba(251, 191, 36, 0.3), 0 0 0 3px rgba(251, 191, 36, 0.1)',
                                            }}
                                        >
                                            <div className="text-center">
                                                <div className="text-3xl sm:text-5xl animate-crown-bounce animate-crown-sparkle animate-crown-glow"
                                                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                                                    👑
                                                </div>
                                                <div className="relative w-18 h-18 sm:w-32 sm:h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-200 via-yellow-100 to-yellow-200 flex items-center justify-center overflow-hidden mb-2 sm:mb-5 border-2 sm:border-4 border-yellow-400 shadow-lg ring-2 sm:ring-4 ring-yellow-100"
                                                    style={{
                                                        boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.1)'
                                                    }}
                                                >
                                                    {topThree[0].image ? (
                                                        <img src={topThree[0].image} alt={topThree[0].name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-yellow-600 font-black text-2xl sm:text-5xl">
                                                            {topThree[0].name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-base sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 mb-1 sm:mb-3 truncate px-1 drop-shadow-sm">
                                                    {topThree[0].name}
                                                </h3>
                                                <div className="scale-90 sm:scale-100">
                                                    <StarRating rating={topThree[0].rating_avg || 0} />
                                                </div>

                                                <div className="mt-2 sm:mt-5 hidden sm:flex flex-wrap gap-1.5 justify-center">
                                                    <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-md">
                                                        {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                                    </span>
                                                    {topThree[0].rating_avg >= 4 && (
                                                        <>
                                                            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-md">
                                                                {isRTL ? "امين" : "Honest"}
                                                            </span>
                                                            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-md">
                                                                {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                                            </span>
                                                            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-md">
                                                                {isRTL ? "بضاعة ممتازة" : "Great Product Quality"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Third Place */}
                                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                    {topThree[2] && (
                                        <div
                                            onClick={() => navigate(`/seller/${topThree[2].id}`)}
                                            className="relative cursor-pointer group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-main"
                                        >
                                            
                                            <div
                                                className="absolute flex-shrink-0 z-10 left-1/2 -translate-x-1/2"
                                                style={{
                                                    top: '-3px',
                                                    animation: 'swing 2.5s ease-in-out infinite',
                                                    animationDelay: '0.6s',
                                                    transformOrigin: 'top center'
                                                }}
                                            >
                                                <div className="text-3xl sm:text-5xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
                                                    🥉
                                                </div>
                                            </div>

                                            <div className="text-center pt-6 sm:pt-12">
                                                <div className="w-14 h-14 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center overflow-hidden mb-2 sm:mb-4 border-2 border-main/30">
                                                    {topThree[2].image ? (
                                                        <img src={topThree[2].image} alt={topThree[2].name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-main font-black text-lg sm:text-3xl">
                                                            {topThree[2].name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-xs sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 truncate px-1">
                                                    {topThree[2].name}
                                                </h3>
                                                <div className="scale-75 sm:scale-100">
                                                    <StarRating rating={topThree[2].rating_avg || 0} />
                                                </div>

                                                <div className="mt-2 sm:mt-4 hidden sm:flex flex-wrap gap-1.5 justify-center">
                                                    <span className="bg-main text-white rounded-full px-3 py-1 text-xs font-bold">
                                                        {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                                    </span>
                                                    {topThree[2].rating_avg >= 4 && (
                                                        <>
                                                            <span className="bg-main text-white rounded-full px-3 py-1 text-xs font-bold">
                                                                {isRTL ? "امين" : "Honest"}
                                                            </span>
                                                            <span className="bg-main text-white rounded-full px-3 py-1 text-xs font-bold">
                                                                {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Other Sellers */}
                        {restSellers.length > 0 && (
                            <div className="max-w-5xl mx-auto">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-main">
                                        {isRTL ? "تجار آخرون مميزون" : "Other Top Sellers"}
                                    </h2>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {displayedSellers.map((seller, index) => (
                                        <div
                                            key={seller.id}
                                            onClick={() => navigate(`/seller/${seller.id}`)}
                                            className="bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-main group animate-fade-in"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            {/* Desktop Layout */}
                                            <div className="hidden sm:flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center overflow-hidden border-2 border-main/30 flex-shrink-0">
                                                        {seller.image ? (
                                                            <img src={seller.image} alt={seller.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-main font-black text-xl">
                                                                {seller.name?.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1.5 truncate group-hover:text-main transition-colors">
                                                            {seller.name}
                                                        </h3>
                                                        <StarRating rating={seller.rating_avg || 0} />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 justify-end flex-shrink-0">
                                                    <span className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                        {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                                    </span>
                                                    {seller.rating_avg >= 4 && (
                                                        <>
                                                            <span className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                                {isRTL ? "امين" : "Honest"}
                                                            </span>
                                                            <span className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                                {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                                            </span>
                                                            <span className="bg-main text-white rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                                                                {isRTL ? "بضاعة ممتازة" : "Great Product Quality"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mobile Layout */}
                                            <div className="flex flex-col gap-3 sm:hidden">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center border-2 border-main/30 overflow-hidden flex-shrink-0">
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
                                                    <span className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                        {isRTL ? "الاكثر مبيعا" : "Top Seller"}
                                                    </span>
                                                    {seller.rating_avg >= 4 && (
                                                        <>
                                                            <span className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                                {isRTL ? "امين" : "Honest"}
                                                            </span>
                                                            <span className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                                {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                                            </span>
                                                            <span className="bg-main text-white rounded-full px-2 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                                                {isRTL ? "بضاعة ممتازة" : "Great Product Quality"}
                                                                </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-center gap-3">
                                    {displayCount < sellers.length && (
                                        <button
                                            onClick={handleLoadMore}
                                            className="px-6 py-3 bg-main text-white rounded-xl font-semibold hover:bg-main/90 transition-colors shadow-sm hover:shadow-md"
                                        >
                                            {isRTL ? "عرض المزيد" : "Load More"}
                                        </button>
                                    )}

                                    {displayCount > 8 && (
                                        <button
                                            onClick={handleShowLess}
                                            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md border-2 border-gray-200"
                                        >
                                            {isRTL ? "عرض أقل" : "Show Less"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TopSellersPage;