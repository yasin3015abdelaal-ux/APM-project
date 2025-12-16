import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCachedAuctions, getCachedAuctionRole } from "../../../api";

const AuctionSkeleton = ({ isRTL }) => (
    <div className="mx-auto p-2" dir={isRTL ? "rtl" : "ltr"}>
        <div className="overflow-hidden">
            {/* Header Skeleton */}
            <div className="mb-2">
                <div className="h-8 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                     style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%'}}></div>
            </div>

            {/* Timer Card Skeleton */}
            <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-3xl p-6 animate-pulse"
                 style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%'}}>
                <div className="text-center mb-4">
                    <div className="h-6 w-48 bg-white/30 rounded mx-auto"></div>
                </div>

                <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                        <div key={item} className="text-center">
                            {item % 2 === 0 ? (
                                <div className="flex items-center justify-center">
                                    <div className="h-10 w-4 bg-white/30 rounded"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-10 w-full bg-white/30 rounded mb-1"></div>
                                    <div className="h-3 w-full bg-white/20 rounded"></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Cards Skeleton */}
            <div className="py-6">
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((item) => (
                        <div key={item} className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                            <div className="space-y-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                                     style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%'}}></div>
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-3/4"
                                     style={{animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%'}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
);

const AuctionHomeWidget = ({ isRTL = false }) => {
    const [isParticipating, setIsParticipating] = useState(false);
    const [participantRole, setParticipantRole] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState({});
    const [buyersCount, setBuyersCount] = useState(0);
    const [sellersCount, setSellersCount] = useState(0);
    const [maxBuyers, setMaxBuyers] = useState(null);
    const [maxSellers, setMaxSellers] = useState(null);
    const [currentAuctionId, setCurrentAuctionId] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const checkParticipationStatus = useCallback(async (auctionId) => {
        if (!auctionId) return;

        try {
            const { data, fromCache } = await getCachedAuctionRole(auctionId);
            console.log(
                fromCache ? "📦 Auction role من الكاش" : "🌐 Auction role من API"
            );

            const roleData = data.data;

            if (roleData && roleData.role) {
                setIsParticipating(true);
                setParticipantRole(roleData.role);
                return roleData.role;
            } else {
                setIsParticipating(false);
                setParticipantRole(null);
                return null;
            }
        } catch (error) {
            console.error("Error checking participation status:", error);
            setIsParticipating(false);
            setParticipantRole(null);
            return null;
        }
    }, []);

    const calculateTimeRemaining = useCallback(() => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();

        if (currentDay === 5 && currentHour >= 7 && currentHour < 22) {
            const endTime = new Date(now);
            endTime.setHours(22, 0, 0, 0);
            return calculateTimeDiff(now, endTime, true, false);
        }

        let daysUntilFriday;

        if (currentDay === 5) {
            if (currentHour < 7) {
                daysUntilFriday = 0;
            } else {
                daysUntilFriday = 7;
            }
        } else if (currentDay === 6) {
            daysUntilFriday = 6;
        } else if (currentDay === 0) {
            daysUntilFriday = 5;
        } else {
            daysUntilFriday = 5 - currentDay;
        }

        const nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + daysUntilFriday);
        nextFriday.setHours(7, 0, 0, 0);

        const registrationOpen = !(
            currentDay === 5 &&
            currentHour >= 7 &&
            currentHour < 22
        );

        return calculateTimeDiff(now, nextFriday, false, registrationOpen);
    }, []);

    const calculateTimeDiff = (start, end, isOpen, registrationOpen) => {
        const diff = end - start;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isOpen, registrationOpen };
    };

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: auctionsArray, fromCache } = await getCachedAuctions();
            console.log(fromCache ? "📦 Auctions من الكاش" : "🌐 Auctions من API");

            const sortedAuctions = auctionsArray.sort((a, b) => {
                return new Date(b.start_time) - new Date(a.start_time);
            });

            const now = new Date();
            const currentAuction =
                sortedAuctions.find((auction) => {
                    const auctionDate = new Date(auction.start_time);
                    return auctionDate > now;
                }) || sortedAuctions[0];

            if (currentAuction) {
                setCurrentAuctionId(currentAuction.id);
                setBuyersCount(currentAuction.buyers_count || 0);
                setSellersCount(currentAuction.sellers_count || 0);
                setMaxBuyers(currentAuction.max_buyers);
                setMaxSellers(currentAuction.max_sellers);

                await checkParticipationStatus(currentAuction.id);
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    }, [checkParticipationStatus]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        setTimeRemaining(calculateTimeRemaining());
        const timer = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeRemaining]);

    if (loading) {
        return <AuctionSkeleton isRTL={isRTL} />;
    }

    return (
        <div className="mx-auto p-2" dir={isRTL ? "rtl" : "ltr"}>
            <div className="overflow-hidden">
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-main">
                        {isRTL
                            ? "مزاد تخفيض الأسعار الأسبوعي"
                            : "Weekly Price Reduction Auction"}
                    </h1>
                </div>

                <div className="bg-main rounded-3xl p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {timeRemaining.isOpen
                                ? isRTL
                                    ? "الوقت المتبقي لإغلاق المزاد"
                                    : "Time Until Auction Closes"
                                : timeRemaining.registrationOpen
                                    ? isRTL
                                        ? "الوقت المتبقي على فتح المزاد"
                                        : "Time Until Auction Opens"
                                    : isRTL
                                        ? "المزاد نشط حالياً"
                                        : "Auction is currently active"}
                        </h3>
                    </div>

                    <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto text-white">
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.days || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">
                                {isRTL ? "أيام" : "Days"}
                            </div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.hours || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">
                                {isRTL ? "ساعات" : "Hours"}
                            </div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.minutes || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">
                                {isRTL ? "دقائق" : "Minutes"}
                            </div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.seconds || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">
                                {isRTL ? "ثواني" : "Seconds"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-6">
                    {isParticipating ? (
                        <div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <div className="flex items-center justify-center gap-2 text-green-700">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold text-sm">
                                        {isRTL
                                            ? `أنت مسجل في المزاد ك${participantRole === 'buyer' ? 'مشتري' : 'تاجر'}`
                                            : `You are registered in the auction as ${participantRole}`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {timeRemaining.registrationOpen ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => navigate("/auction")}
                                        className="bg-white border-2 border-gray-200 text-center rounded-2xl py-4 hover:border-main transition-all cursor-pointer"
                                    >
                                        <h3 className="text-xs font-bold text-gray-800 mb-1">
                                            {isRTL ? (
                                                <>
                                                    احجز <span style={{ color: "red" }}>ك</span>تاجر في
                                                    المزاد القادم <br />
                                                    متبقي{" "}
                                                    {!maxSellers || maxSellers - sellersCount <= 0
                                                        ? "∞"
                                                        : maxSellers - sellersCount}{" "}
                                                    تجار
                                                </>
                                            ) : (
                                                <>
                                                    Book as a seller in the upcoming auction <br />
                                                    {!maxSellers || maxSellers - sellersCount <= 0
                                                        ? "∞"
                                                        : maxSellers - sellersCount}{" "}
                                                    sellers remaining
                                                </>
                                            )}
                                        </h3>
                                    </div>

                                    <div
                                        onClick={() => navigate("/auction")}
                                        className="bg-white border-2 border-gray-200 text-center rounded-2xl py-4 hover:border-main transition-all cursor-pointer"
                                    >
                                        <h3 className="text-xs font-bold text-gray-800 mb-1">
                                            {isRTL ? (
                                                <>
                                                    احجز <span style={{ color: "red" }}>ك</span>مشتري في
                                                    المزاد القادم <br />
                                                    متبقي{" "}
                                                    {!maxBuyers || maxBuyers - buyersCount <= 0
                                                        ? "∞"
                                                        : maxBuyers - buyersCount}{" "}
                                                    مشترين
                                                </>
                                            ) : (
                                                <>
                                                    Book as a buyer in the upcoming auction <br />
                                                    {!maxBuyers || maxBuyers - buyersCount <= 0
                                                        ? "∞"
                                                        : maxBuyers - buyersCount}{" "}
                                                    buyers remaining
                                                </>
                                            )}
                                        </h3>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <svg
                                        className="w-16 h-16 mx-auto text-gray-400 mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                                        {isRTL
                                            ? "التسجيل مغلق حالياً"
                                            : "Registration is currently closed"}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {isRTL
                                            ? "سيتم فتح التسجيل بعد انتهاء المزاد الحالي"
                                            : "Registration will open after the current auction ends"}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuctionHomeWidget;