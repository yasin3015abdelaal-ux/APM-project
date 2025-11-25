import { useState, useEffect, memo, useCallback } from "react";
import { MapPin, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auctionAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import PlaceholderSVG from "../../assets/PlaceholderSVG";

const BuyerProductCard = memo(({ item, isRTL, onContactSeller }) => {
    const { product, auction_price, seller } = item;

    if (!product) return null;

    const { id, image, name_ar, name_en, governorate } = product;

    const imageUrl = image;
    const displayName = isRTL ? name_ar : name_en;

    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleClick = useCallback(() => {
        onContactSeller(seller, product);
    }, [seller, product, onContactSeller]);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
            <div className="relative">
                {imageUrl && !imageError ? (
                    <img
                        src={imageUrl}
                        alt={displayName}
                        className="w-full h-48 object-cover"
                        onError={handleImageError}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                        <PlaceholderSVG />
                    </div>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1">
                    {displayName}
                </h3>

                {governorate && (
                    <div className="flex items-center text-main text-sm mb-3">
                        <MapPin size={14} className={isRTL ? "ml-1" : "mr-1"} />
                        <span className="font-medium">
                            {isRTL ? governorate.name_ar : governorate.name_en}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-main">
                            {auction_price} {isRTL ? "جنيه" : "EGP"}
                        </div>
                    </div>
                    <button
                        onClick={handleClick}
                        className="bg-main hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer"
                    >
                        {isRTL ? "تواصل مع البائع" : "Contact Seller"}
                    </button>
                </div>
            </div>
        </div>
    );
});

BuyerProductCard.displayName = 'BuyerProductCard';

const AuctionPage = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [isParticipating, setIsParticipating] = useState(false);
    const [participantRole, setParticipantRole] = useState(null);
    const [showParticipateModal, setShowParticipateModal] = useState(false);
    const [participateRole, setParticipateRole] = useState(null);
    const [toast, setToast] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState({});
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [buyersCount, setBuyersCount] = useState(0);
    const [sellersCount, setSellersCount] = useState(0);
    const [maxBuyers, setMaxBuyers] = useState(null);
    const [maxSellers, setMaxSellers] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [currentAuctionId, setCurrentAuctionId] = useState(null);
    const [currentAuctionStatus, setCurrentAuctionStatus] = useState(null);

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const checkParticipationStatus = useCallback(async (auctionId) => {
        if (!auctionId) return;

        try {
            const response = await auctionAPI.role(auctionId);
            const roleData = response.data.data;

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

        let daysUntilFriday = (5 - currentDay + 7) % 7;
        if (currentDay === 5 && currentHour < 7) {
            daysUntilFriday = 0;
        }

        const nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + daysUntilFriday);
        nextFriday.setHours(7, 0, 0, 0);

        return calculateTimeDiff(now, nextFriday, false, true);
    }, []);

    const calculateTimeDiff = (start, end, isOpen, registrationOpen) => {
        const diff = end - start;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isOpen, registrationOpen };
    };

    const fetchProducts = useCallback(async (auctionId = currentAuctionId) => {
        if (!auctionId) return;

        try {
            const response = await auctionAPI.getProducts(auctionId);
            const productsData = response.data?.data || response.data || [];
            setProducts(productsData);
        } catch (error) {
            console.error("Error fetching products:", error);
            showToast(
                isRTL ? "حدث خطأ في تحميل المنتجات" : "Error loading products",
                "error"
            );
        }
    }, [currentAuctionId, showToast, isRTL]);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [auctionsResponse] = await Promise.all([
                auctionAPI.getAllAuctions()
            ]);

            const auctionsArray = auctionsResponse.data?.data || auctionsResponse.data || [];

            const sortedAuctions = auctionsArray.sort((a, b) => {
                return new Date(b.start_time) - new Date(a.start_time);
            });

            setAuctions(sortedAuctions);

            const now = new Date();
            const currentAuction = sortedAuctions.find(auction => {
                const auctionDate = new Date(auction.start_time);
                return auctionDate > now;
            }) || sortedAuctions[0];

            if (currentAuction) {
                setCurrentAuctionId(currentAuction.id);
                setCurrentAuctionStatus(currentAuction.status);
                setBuyersCount(currentAuction.buyers_count || 0);
                setSellersCount(currentAuction.sellers_count || 0);
                setMaxBuyers(currentAuction.max_buyers);
                setMaxSellers(currentAuction.max_sellers);

                const role = await checkParticipationStatus(currentAuction.id);

                if (role === 'buyer') {
                    fetchProducts(currentAuction.id);
                }
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
            showToast(
                isRTL ? "حدث خطأ في تحميل البيانات" : "Error loading data",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [checkParticipationStatus, fetchProducts, showToast, isRTL]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (isParticipating && participantRole === 'buyer' && currentAuctionId) {
            fetchProducts();
        }
    }, [isParticipating, participantRole, currentAuctionId, fetchProducts]);

    useEffect(() => {
        setTimeRemaining(calculateTimeRemaining());
        const timer = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeRemaining]);

    const handleParticipate = async (role) => {
        if (!currentAuctionId) {
            showToast(
                isRTL ? "لم يتم تحديد مزاد" : "No auction selected",
                "error"
            );
            return;
        }

        if (!timeRemaining.registrationOpen) {
            showToast(
                isRTL ? "سيتم فتح الحجز بعد المزاد لتتمكن من التسجيل في المزاد القادم" : "Registration will open after the auction to register for the next auction",
                "error"
            );
            return;
        }

        try {
            const currentAuction = auctions.find(auction => auction.id === currentAuctionId);
            if (!currentAuction) {
                showToast(
                    isRTL ? "لم يتم العثور على بيانات المزاد" : "Auction data not found",
                    "error"
                );
                return;
            }

            const auctionDate = new Date(currentAuction.start_time);
            const formattedDate = auctionDate.toISOString().split('T')[0];

            await auctionAPI.participate(formattedDate, role);

            const newRole = await checkParticipationStatus(currentAuctionId);

            setShowParticipateModal(false);

            if (role === 'buyer') {
                setBuyersCount(prev => prev + 1);
                await fetchProducts();
            } else {
                setSellersCount(prev => prev + 1);
            }

            showToast(
                isRTL ? `تم الاشتراك في المزاد بنجاح ك${role === 'buyer' ? 'مشتري' : 'تاجر'}` : `Successfully registered as ${role}`,
                "success"
            );

        } catch (error) {
            console.error("Error participating in auction:", error);

            let errorMessage = isRTL ? "حدث خطأ في التسجيل" : "Registration failed";

            if (error.response?.status === 400) {
                errorMessage = isRTL ? "بيانات التسجيل غير صحيحة" : "Invalid registration data";
            } else if (error.response?.status === 404) {
                errorMessage = isRTL ? "المزاد غير موجود" : "Auction not found";
            } else if (error.response?.status === 409) {
                errorMessage = isRTL ? "أنت مسجل بالفعل في هذا المزاد" : "You are already registered in this auction";
            }

            showToast(errorMessage, "error");
        }
    };

    const handleContactSeller = useCallback((seller, product) => {
        console.log("Contacting seller:", seller);
        console.log("Product:", product);
    }, []);

    const canRegisterAsBuyer = maxBuyers === null || buyersCount < maxBuyers;
    const canRegisterAsSeller = maxSellers === null || sellersCount < maxSellers;

    const shouldShowProducts = isParticipating && participantRole === 'buyer' && currentAuctionId;

    return (
        <div className="min-h-screen bg-white" dir={isRTL ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-20" : "right-4"} z-50 animate-fade-in`}>
                    <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"
                        }`}>
                        {toast.type === "success" ? (
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            {showParticipateModal && (
                <div className="fixed inset-0 bg-[#00000062] bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-main">
                        <button
                            onClick={() => setShowParticipateModal(false)}
                            className="float-left cursor-pointer text-gray-400 hover:text-gray-600 transition mb-4"
                        >
                            <X size={24} />
                        </button>

                        <div className="clear-both text-center">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                {isRTL ? "هل أنت متأكد من الاشتراك في المزاد ك" : "Are you sure you want to participate as"}
                            </h3>

                            <p className="text-2xl font-bold text-main mb-8">
                                {participateRole === "seller" ? (isRTL ? "بائع" : "Seller") : (isRTL ? "مشتري" : "Buyer")}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleParticipate(participateRole)}
                                    className="flex-1 cursor-pointer bg-main hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition text-lg"
                                >
                                    {isRTL ? "نعم" : "Yes"}
                                </button>
                                <button
                                    onClick={() => setShowParticipateModal(false)}
                                    className="flex-1 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-bold transition text-lg"
                                >
                                    {isRTL ? "لا" : "No"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-main mb-2">
                        {isRTL ? "مزاد تخفيض الاسعار الاسبوعي" : "Weekly Price Reduction Auction"}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {isRTL ? "تفتح المزادات كل جمعة من الساعة 7 صباحاً حتى 10 مساءً بتوقيت القاهرة" : "Auctions open every Friday from 7 AM to 10 PM Cairo time"}
                    </p>
                </div>

                <div className="bg-main rounded-3xl shadow-xl p-6 mb-6 text-white">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold mb-1">
                            {timeRemaining.isOpen
                                ? (isRTL ? "الوقت المتبقي لإغلاق المزاد" : "Time Until Auction Closes")
                                : timeRemaining.registrationOpen
                                    ? (isRTL ? "الوقت المتبقي على فتح المزاد" : "Time Remaining Until Auction Opens")
                                    : (isRTL ? "المزاد نشط حالياً" : "Auction is currently active")
                            }
                        </h2>
                    </div>

                    <div className="grid grid-cols-7 gap-2 sm:gap-3 max-w-xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl sm:text-5xl font-bold mb-1">
                                {String(timeRemaining.days || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "أيام" : "Days"}</div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-3xl sm:text-5xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-5xl font-bold mb-1">
                                {String(timeRemaining.hours || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "ساعات" : "Hours"}</div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-3xl sm:text-5xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-5xl font-bold mb-1">
                                {String(timeRemaining.minutes || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "دقائق" : "Minutes"}</div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-3xl sm:text-5xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-5xl font-bold mb-1">
                                {String(timeRemaining.seconds || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "ثواني" : "Seconds"}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border-2 border-gray-200 text-center rounded-2xl p-4 hover:border-main transition-all">
                        <h3 className="text-sm font-bold text-gray-800 mb-2">
                            {isRTL ? "أقصى عدد للتجار" : "Max Sellers"}
                        </h3>
                        <div className="text-2xl font-bold text-main">{maxSellers || "∞"}</div>
                    </div>

                    <div className="bg-white border-2 border-gray-200 text-center rounded-2xl p-4 hover:border-main transition-all">
                        <h3 className="text-sm font-bold text-gray-800 mb-2">
                            {isRTL ? "أقصى عدد للمشترين" : "Max Buyers"}
                        </h3>
                        <div className="text-2xl font-bold text-main">{maxBuyers || "∞"}</div>
                    </div>

                    <div className="bg-white border-2 border-gray-200 text-center rounded-2xl p-4 hover:border-main transition-all">
                        <h3 className="text-sm font-bold text-gray-800 mb-2">
                            {isRTL ? "التجار الحاليين" : "Current Sellers"}
                        </h3>
                        <div className="text-2xl font-bold text-main">{sellersCount}</div>
                    </div>

                    <div className="bg-white border-2 border-gray-200 text-center rounded-2xl p-4 hover:border-main transition-all">
                        <h3 className="text-sm font-bold text-gray-800 mb-2">
                            {isRTL ? "المشترين الحاليين" : "Current Buyers"}
                        </h3>
                        <div className="text-2xl font-bold text-main">{buyersCount}</div>
                    </div>
                </div>

                {loading ? (
                    <Loader />
                ) : !isParticipating ? (
                    <>
                        {timeRemaining.registrationOpen ? (
                            <>
                                <p className="text-center text-main mb-4">
                                    {isRTL ? "يمكنك التسجيل المسبق للمزاد القادم والاستفادة من تخفيضات الاسعار" : "You can pre-register for the upcoming auction and benefit from price reductions"}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            if (!canRegisterAsBuyer) {
                                                showToast(isRTL ? "تم الوصول للحد الأقصى من المشترين" : "Maximum buyers reached", "error");
                                                return;
                                            }
                                            setParticipateRole("buyer");
                                            setShowParticipateModal(true);
                                        }}
                                        disabled={!canRegisterAsBuyer}
                                        className={`${canRegisterAsBuyer ? "bg-main hover:bg-green-700 cursor-pointer" : "bg-gray-400 cursor-not-allowed"} text-white px-6 py-4 rounded-xl font-bold transition text-lg`}
                                    >
                                        {isRTL ? "احجز كمشتري" : "Register as Buyer"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!canRegisterAsSeller) {
                                                showToast(isRTL ? "تم الوصول للحد الأقصى من التجار" : "Maximum sellers reached", "error");
                                                return;
                                            }
                                            setParticipateRole("seller");
                                            setShowParticipateModal(true);
                                        }}
                                        disabled={!canRegisterAsSeller}
                                        className={`${canRegisterAsSeller ? "bg-main hover:bg-green-700 cursor-pointer" : "bg-gray-400 cursor-not-allowed"} text-white px-6 py-4 rounded-xl font-bold transition text-lg`}
                                    >
                                        {isRTL ? "احجز كتاجر" : "Register as Seller"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-2xl">
                                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    {isRTL ? "التسجيل مغلق حاليًا" : "Registration is currently closed"}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {isRTL ? "سيتم فتح الحجز بعد المزاد لتتمكن من التسجيل في المزاد القادم" : "Registration will open after the auction to register for the next auction"}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-green-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">
                                    {isRTL
                                        ? `أنت مسجل في المزاد ك${participantRole === 'buyer' ? 'مشتري' : 'تاجر'}`
                                        : `You are registered in the auction as ${participantRole}`
                                    }
                                </span>
                            </div>
                        </div>

                        {shouldShowProducts && (
                            <div className="mb-6">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {isRTL ? "منتجات المزاد" : "Auction Products"}
                                    </h2>
                                </div>

                                {products.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-lg font-medium text-gray-600">
                                            {isRTL ? "لا توجد منتجات متاحة حالياً في المزاد" : "No products available in the auction yet"}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {isRTL ? "سيتم إضافة المنتجات قريباً" : "Products will be added soon"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {products.map((product) => (
                                            <BuyerProductCard
                                                key={product.id}
                                                item={product}
                                                isRTL={isRTL}
                                                onContactSeller={handleContactSeller}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {participantRole !== 'buyer' && (
                            <div className="mt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { window.location.href = '/my-auctions'; }}
                                        className="bg-white border-2 border-main text-main cursor-pointer hover:bg-main hover:text-white px-6 py-4 rounded-xl font-bold transition text-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {isRTL ? "مزاداتي" : "My Auctions"}
                                    </button>
                                    <button
                                        onClick={() => { window.location.href = '/previous-auctions'; }}
                                        className="bg-white border-2 border-gray-300 text-gray-700 cursor-pointer hover:border-main hover:text-main px-6 py-4 rounded-xl font-bold transition text-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {isRTL ? "المزادات السابقة" : "Previous Auctions"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default AuctionPage;