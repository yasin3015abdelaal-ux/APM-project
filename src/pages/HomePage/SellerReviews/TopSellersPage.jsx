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
                        className="w-5 h-5"
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
            <span className="text-sm font-semibold text-gray-700 mx-1">
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
        // <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8" dir={isRTL ? "rtl" : "ltr"}>
        //     <style>{`
        //         @keyframes float {
        //             0%, 100% { transform: translateY(0px); }
        //             50% { transform: translateY(-20px); }
        //         }
        //         @keyframes pulse-glow {
        //             0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3); }
        //             50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.9), 0 0 100px rgba(255, 215, 0, 0.5); }
        //         }
        //         @keyframes shine {
        //             0% { background-position: -200% center; }
        //             100% { background-position: 200% center; }
        //         }
        //         @keyframes rotate {
        //             from { transform: rotate(0deg); }
        //             to { transform: rotate(360deg); }
        //         }
        //         @keyframes bounce-in {
        //             0% { transform: scale(0.3); opacity: 0; }
        //             50% { transform: scale(1.05); }
        //             70% { transform: scale(0.9); }
        //             100% { transform: scale(1); opacity: 1; }
        //         }
        //         @keyframes sparkle {
        //             0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
        //             50% { opacity: 1; transform: scale(1) rotate(180deg); }
        //         }
        //         @keyframes gradient-shift {
        //             0%, 100% { background-position: 0% 50%; }
        //             50% { background-position: 100% 50%; }
        //         }
        //         @keyframes slide-up {
        //             from { opacity: 0; transform: translateY(30px); }
        //             to { opacity: 1; transform: translateY(0); }
        //         }
        //         .animate-float {
        //             animation: float 3s ease-in-out infinite;
        //         }
        //         .animate-pulse-glow {
        //             animation: pulse-glow 2s ease-in-out infinite;
        //         }
        //         .animate-shine {
        //             background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
        //             background-size: 200% 100%;
        //             animation: shine 2s infinite;
        //         }
        //         .animate-rotate {
        //             animation: rotate 20s linear infinite;
        //         }
        //         .animate-bounce-in {
        //             animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        //         }
        //         .animate-sparkle {
        //             animation: sparkle 2s ease-in-out infinite;
        //         }
        //         .animate-gradient {
        //             background-size: 200% 200%;
        //             animation: gradient-shift 3s ease infinite;
        //         }
        //         .animate-slide-up {
        //             animation: slide-up 0.5s ease-out forwards;
        //         }
        //         .glass-effect {
        //             background: rgba(255, 255, 255, 0.9);
        //             backdrop-filter: blur(10px);
        //             border: 1px solid rgba(255, 255, 255, 0.3);
        //         }
        //     `}</style>

        //     <div className="container mx-auto px-4">
        //         {/* Header */}
        //         <div className="text-center mb-12 relative">
        //             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    
        //             <button
        //                 onClick={() => navigate(-1)}
        //                 className="mb-6 inline-flex items-center gap-2 text-main hover:text-main/80 transition-all duration-300 hover:scale-110 relative z-10"
        //             >
        //                 <svg className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        //                 </svg>
        //                 <span className="font-semibold">{isRTL ? "رجوع" : "Back"}</span>
        //             </button>
                    
        //             <div className="relative inline-block">
        //                 <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3 animate-gradient relative z-10">
        //                     {isRTL ? "🏆 افضل التجار" : "🏆 Top Sellers"}
        //                 </h1>
        //                 <div className="absolute -top-4 -right-4 text-4xl animate-sparkle">✨</div>
        //                 <div className="absolute -bottom-2 -left-4 text-3xl animate-sparkle" style={{animationDelay: '1s'}}>⭐</div>
        //             </div>
                    
        //             <p className="text-gray-700 text-lg font-medium relative z-10 mt-2">
        //                 {isRTL ? "تعرف على أفضل التجار المميزين في المنصة" : "Meet our most trusted and top-rated sellers"}
        //             </p>
        //         </div>

        //         {sellers.length === 0 ? (
        //             <div className="text-center py-20">
        //                 <div className="text-gray-400 mb-4">
        //                     <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        //                     </svg>
        //                 </div>
        //                 <p className="text-2xl font-medium text-gray-600">
        //                     {isRTL ? "لا يوجد تجار متاحين حالياً" : "No sellers available at the moment"}
        //                 </p>
        //             </div>
        //         ) : (
        //             <>
        //                 {/* Top 3 Podium */}
        //                 <div className="mb-16">
        //                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        //                         {/* Second Place */}
        //                         <div className="md:order-1 order-2 animate-bounce-in" style={{animationDelay: '0.2s'}}>
        //                             {topThree[1] && (
        //                                 <div
        //                                     onClick={() => navigate(`/seller/${topThree[1].id}`)}
        //                                     className="glass-effect border-4 border-gray-400 rounded-3xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden h-72 group"
        //                                 >
        //                                     <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 via-gray-300/30 to-gray-400/20 group-hover:from-gray-300/60 group-hover:via-gray-400/40 group-hover:to-gray-500/30 transition-all duration-300"></div>
        //                                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-shine"></div>
                                            
        //                                     <div className="text-7xl mb-4 text-center animate-float relative z-10" style={{animationDelay: '0.5s'}}>
        //                                         🥈
        //                                     </div>

        //                                     <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
        //                                         {topThree[1].image ? (
        //                                             <img src={topThree[1].image} alt={topThree[1].name} className="w-full h-full object-cover" />
        //                                         ) : (
        //                                             <span className="text-white font-bold text-4xl">
        //                                                 {topThree[1].name?.charAt(0).toUpperCase()}
        //                                             </span>
        //                                         )}
        //                                     </div>

        //                                     <h3 className="text-xl font-bold text-gray-800 text-center mb-2 truncate relative z-10">
        //                                         {topThree[1].name}
        //                                     </h3>
        //                                     <div className="relative z-10">
        //                                         <StarRating rating={topThree[1].rating_avg || 0} />
        //                                     </div>
                                            
        //                                     <div className="mt-3 flex justify-center relative z-10">
        //                                         <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full px-5 py-2 text-sm font-bold shadow-lg">
        //                                             {isRTL ? "المركز الثاني" : "2nd Place"}
        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                             )}
        //                         </div>

        //                         {/* First Place - Larger and elevated */}
        //                         <div className="md:order-2 order-1 animate-bounce-in">
        //                             {topThree[0] && (
        //                                 <div
        //                                     onClick={() => navigate(`/seller/${topThree[0].id}`)}
        //                                     className="glass-effect border-4 border-yellow-500 rounded-3xl p-8 cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden transform md:scale-110 md:-mt-8 h-96 animate-pulse-glow group"
        //                                 >
        //                                     <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/60 via-yellow-300/40 to-yellow-400/30 group-hover:from-yellow-300/70 group-hover:via-yellow-400/50 group-hover:to-yellow-500/40 transition-all duration-300"></div>
        //                                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shine"></div>
        //                                     <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 to-transparent animate-rotate opacity-40"></div>
                                            
        //                                     <div className="text-8xl mb-4 text-center animate-float relative z-10">
        //                                         🥇
        //                                     </div>

        //                                     <div className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
        //                                         {topThree[0].image ? (
        //                                             <img src={topThree[0].image} alt={topThree[0].name} className="w-full h-full object-cover" />
        //                                         ) : (
        //                                             <span className="text-white font-bold text-5xl">
        //                                                 {topThree[0].name?.charAt(0).toUpperCase()}
        //                                             </span>
        //                                         )}
        //                                     </div>

        //                                     <h3 className="text-2xl font-bold text-yellow-900 text-center mb-3 truncate relative z-10">
        //                                         {topThree[0].name}
        //                                     </h3>
        //                                     <div className="relative z-10">
        //                                         <StarRating rating={topThree[0].rating_avg || 0} />
        //                                     </div>
                                            
        //                                     <div className="mt-4 flex justify-center relative z-10">
        //                                         <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full px-6 py-2.5 text-base font-bold shadow-xl">
        //                                             {isRTL ? "👑 المركز الأول" : "👑 1st Place"}
        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                             )}
        //                         </div>

        //                         {/* Third Place */}
        //                         <div className="md:order-3 order-3 animate-bounce-in" style={{animationDelay: '0.4s'}}>
        //                             {topThree[2] && (
        //                                 <div
        //                                     onClick={() => navigate(`/seller/${topThree[2].id}`)}
        //                                     className="glass-effect border-4 border-orange-400 rounded-3xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden h-72 group"
        //                                 >
        //                                     <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 via-orange-300/30 to-orange-400/20 group-hover:from-orange-300/60 group-hover:via-orange-400/40 group-hover:to-orange-500/30 transition-all duration-300"></div>
        //                                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent animate-shine"></div>
                                            
        //                                     <div className="text-7xl mb-4 text-center animate-float relative z-10" style={{animationDelay: '1s'}}>
        //                                         🥉
        //                                     </div>

        //                                     <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
        //                                         {topThree[2].image ? (
        //                                             <img src={topThree[2].image} alt={topThree[2].name} className="w-full h-full object-cover" />
        //                                         ) : (
        //                                             <span className="text-white font-bold text-4xl">
        //                                                 {topThree[2].name?.charAt(0).toUpperCase()}
        //                                             </span>
        //                                         )}
        //                                     </div>

        //                                     <h3 className="text-xl font-bold text-orange-800 text-center mb-2 truncate relative z-10">
        //                                         {topThree[2].name}
        //                                     </h3>
        //                                     <div className="relative z-10">
        //                                         <StarRating rating={topThree[2].rating_avg || 0} />
        //                                     </div>
                                            
        //                                     <div className="mt-3 flex justify-center relative z-10">
        //                                         <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-full px-5 py-2 text-sm font-bold shadow-lg">
        //                                             {isRTL ? "المركز الثالث" : "3rd Place"}
        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                             )}
        //                         </div>
        //                     </div>
        //                 </div>

        //                 {/* Rest of Sellers */}
        //                 {restSellers.length > 0 && (
        //                     <div className="max-w-5xl mx-auto">
        //                         <div className="text-center mb-8 relative">
        //                             <div className="inline-block relative">
        //                                 <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        //                                     {isRTL ? "⭐ باقي التجار المميزين" : "⭐ Other Top Sellers"}
        //                                 </h2>
        //                                 <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
        //                             </div>
        //                         </div>

        //                         <div className="space-y-4 mb-8">
        //                             {displayedSellers.map((seller, index) => (
        //                                 <div
        //                                     key={seller.id}
        //                                     onClick={() => navigate(`/seller/${seller.id}`)}
        //                                     className="glass-effect border-2 border-main/30 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-main group animate-slide-up"
        //                                     style={{animationDelay: `${index * 0.1}s`}}
        //                                 >
        //                                     <div className="flex items-center gap-4">
        //                                         <div className="flex-shrink-0 relative">
        //                                             <div className="absolute inset-0 bg-gradient-to-r from-main/20 to-pink-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        //                                             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-main/20 to-main/10 flex items-center justify-center border-3 border-main/40 overflow-hidden shadow-lg relative z-10 group-hover:scale-110 group-hover:border-main transition-all duration-300">
        //                                                 {seller.image ? (
        //                                                     <img src={seller.image} alt={seller.name} className="w-full h-full object-cover" />
        //                                                 ) : (
        //                                                     <span className="text-main font-bold text-3xl">
        //                                                         {seller.name?.charAt(0).toUpperCase()}
        //                                                     </span>
        //                                                 )}
        //                                             </div>
        //                                         </div>

        //                                         <div className="flex-1 min-w-0">
        //                                             <h3 className="text-xl font-bold text-gray-900 truncate mb-2 group-hover:text-main transition-colors duration-300">
        //                                                 {seller.name}
        //                                             </h3>
        //                                             <StarRating rating={seller.rating_avg || 0} />
        //                                         </div>

        //                                         <div className="flex flex-wrap gap-2 justify-end items-center">
        //                                             <div className="flex items-center gap-1 bg-gradient-to-r from-main to-pink-500 text-white rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap shadow-md group-hover:shadow-lg transition-shadow duration-300">
        //                                                 <span>⭐</span>
        //                                                 <span>{isRTL ? "تاجر مميز" : "Top Seller"}</span>
        //                                             </div>
        //                                             {seller.rating_avg >= 4 && (
        //                                                 <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap shadow-md">
        //                                                     <span>✓</span>
        //                                                     <span>{isRTL ? "امين" : "Trusted"}</span>
        //                                                 </div>
        //                                             )}
        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                             ))}
        //                         </div>

        //                         {/* Load More / Show Less Buttons */}
        //                         <div className="flex justify-center gap-4 mt-10">
        //                             {displayCount < sellers.length && (
        //                                 <button
        //                                     onClick={handleLoadMore}
        //                                     className="bg-gradient-to-r from-main to-pink-500 text-white px-10 py-4 rounded-2xl font-bold hover:from-main/90 hover:to-pink-500/90 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2 group"
        //                                 >
        //                                     <span>{isRTL ? "عرض المزيد" : "Load More"}</span>
        //                                     <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        //                                     </svg>
        //                                 </button>
        //                             )}
                                    
        //                             {displayCount > 8 && (
        //                                 <button
        //                                     onClick={handleShowLess}
        //                                     className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-10 py-4 rounded-2xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2 group"
        //                                 >
        //                                     <span>{isRTL ? "عرض أقل" : "Show Less"}</span>
        //                                     <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        //                                     </svg>
        //                                 </button>
        //                             )}
        //                         </div>
        //                     </div>
        //                 )}
        //             </>
        //         )}
        //     </div>
        // </div>
        <>
        </>
    );
};

export default TopSellersPage;