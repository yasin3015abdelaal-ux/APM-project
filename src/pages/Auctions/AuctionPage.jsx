import { useState, useEffect, useCallback, useRef } from "react";
import { HeartIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { auctionAPI, chatAPI, clearCache, getCachedAuctionProducts, getCachedAuctionRole, getCachedAuctions } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import PlaceholderSVG from "../../assets/PlaceholderSVG";
import { IoLocationOutline } from "react-icons/io5";

const AuctionPage = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.language === "ar";
    const [isParticipating, setIsParticipating] = useState(false);
    const [participantRole, setParticipantRole] = useState(null);
    const [showParticipateModal, setShowParticipateModal] = useState(false);
    const [participateRole, setParticipateRole] = useState(null);
    const [toast, setToast] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState({});
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buyersCount, setBuyersCount] = useState(0);
    const [sellersCount, setSellersCount] = useState(0);
    const [maxBuyers, setMaxBuyers] = useState(null);
    const [maxSellers, setMaxSellers] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [currentAuctionId, setCurrentAuctionId] = useState(null);
    const [currentAuctionStatus, setCurrentAuctionStatus] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(8);

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const handleProductClick = useCallback((productId) => {
        navigate(`/product-details/${productId}`);
    }, [navigate]);

const handleContactSeller = useCallback(async (product) => {
    if (!timeRemaining.isOpen) {
        showToast(
            isRTL ? "المزاد لم يُفتح بعد" : "Auction has not opened yet",
            "error"
        );
        return;
    }

    // if (participantRole === 'seller') {
    //     showToast(
    //         isRTL ? "لا يمكنك التواصل كبائع" : "You cannot contact as a seller",
    //         "error"
    //     );
    //     return;
    // }

    const token = localStorage.getItem('authToken');
    if (!token) {
        navigate('/login', { state: { from: `/auction` } });
        return;
    }

    try {
        const sellerId = product.user_id || product.seller_id || product.owner_id || product.user?.id;
        
        if (!sellerId) {
            showToast(
                isRTL ? 'لا يمكن العثور على معرف البائع' : 'Cannot find seller ID',
                'error'
            );
            return;
        }
        
        const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
        if (currentUser.id === sellerId) {
            showToast(
                isRTL ? 'لا يمكنك إرسال رسالة لنفسك' : 'You cannot message yourself',
                'error'
            );
            return;
        }
        
        const conversationData = {
            user_id: parseInt(sellerId),
            type: 'auction'
        };
        
        const response = await chatAPI.createConversation(conversationData);

        if (response.data.success) {
            const conversationId = response.data.conversation?.id || response.data.data?.id;
            
            if (conversationId) {
                navigate('/chats', { 
                    state: { conversationId } 
                });
            } else {
                showToast(
                    isRTL ? 'حدث خطأ أثناء إنشاء المحادثة' : 'Error creating conversation',
                    'error'
                );
            }
        }
    } catch (error) {
        if (error.response?.status === 409 || error.response?.data?.conversation) {
            const existingConvId = error.response.data.conversation?.id || error.response.data.data?.id;
            if (existingConvId) {
                navigate('/chats', { state: { conversationId: existingConvId } });
                return;
            }
        }
        
        const errorMessage = error.response?.data?.message 
            || error.response?.data?.error 
            || error.message 
            || 'Unknown error';
        
        showToast(
            isRTL 
                ? `حدث خطأ: ${errorMessage}` 
                : `Error: ${errorMessage}`,
            'error'
        );
    }
}, [timeRemaining.isOpen, participantRole, showToast, isRTL, navigate]);

    const checkParticipationStatus = useCallback(async (auctionId) => {
        if (!auctionId) return null;

        try {
            const { data, fromCache } = await getCachedAuctionRole(auctionId);
            console.log(fromCache ? '📦 Auction role من الكاش' : '🌐 Auction role من API');

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
        const currentMinute = now.getMinutes();

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

        const registrationOpen = !(currentDay === 5 && currentHour >= 7 && currentHour < 22);

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
    const fetchProducts = useCallback(async (auctionId = currentAuctionId) => {
        if (!auctionId) return;

        try {
            const { data, fromCache } = await getCachedAuctionProducts(auctionId);
            console.log(fromCache ? '📦 Products من الكاش' : '🌐 Products من API');

            setProducts(data);
            setCurrentPage(1);
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
            const { data: auctionsArray, fromCache: auctionsFromCache } = await getCachedAuctions();
            console.log(auctionsFromCache ? '📦 Auctions من الكاش' : '🌐 Auctions من API');

            const sortedAuctions = auctionsArray.sort((a, b) =>
                new Date(b.start_time) - new Date(a.start_time)
            );

            setAuctions(sortedAuctions);

            const now = new Date();
            const currentAuction = sortedAuctions.find(auction =>
                new Date(auction.start_time) > now
            ) || sortedAuctions[0];

            if (currentAuction) {
                setCurrentAuctionId(currentAuction.id);
                setCurrentAuctionStatus(currentAuction.status);
                setBuyersCount(currentAuction.buyers_count || 0);
                setSellersCount(currentAuction.sellers_count || 0);
                setMaxBuyers(currentAuction.max_buyers);
                setMaxSellers(currentAuction.max_sellers);

                const role = await checkParticipationStatus(currentAuction.id);

                if (role) {
                    await fetchProducts(currentAuction.id);
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

            clearCache(`auction_role_${currentAuctionId}`);
            clearCache(`auction_products_${currentAuctionId}`);
            clearCache('auctions');

            const newRole = await checkParticipationStatus(currentAuctionId);

            setShowParticipateModal(false);

            if (role === 'buyer') {
                setBuyersCount(prev => prev + 1);
            } else {
                setSellersCount(prev => prev + 1);
            }

            await fetchProducts(currentAuctionId);

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

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(products.length / productsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const canRegisterAsBuyer = maxBuyers === null || buyersCount < maxBuyers;
    const canRegisterAsSeller = maxSellers === null || sellersCount < maxSellers;

    const shouldShowProducts = isParticipating && currentAuctionId;

    const prepareProductData = (auctionProduct) => {
        const product = auctionProduct.product || auctionProduct;
        return {
            ...product,
            id: product.id,
            name_ar: product.name_ar,
            name_en: product.name_en,
            description: product.description,
            description_ar: product.description_ar,
            description_en: product.description_en,
            price: auctionProduct.auction_price || product.price,
            original_price: product.price,
            auction_price: auctionProduct.auction_price,
            image: product.image || product.images?.[0],
            governorate: product.governorate,
            created_at: product.created_at || auctionProduct.added_at
        };
    };

    function ProductCard({ product, onProductClick, onContactSeller, isAuctionOpen }) {
        const { i18n } = useTranslation();
        const isRTL = i18n.language === 'ar';
        const [currentImageIndex, setCurrentImageIndex] = useState(0);

        const {
            id,
            images,
            image,
            name_ar,
            name_en,
            governorate,
            price,
            original_price,
            auction_price
        } = product;

        // Get all images
        const allImages = images && images.length > 0
            ? images
            : (image ? [image] : []);

        const hasMultipleImages = allImages.length > 1;

        // Auto-slide effect
        useEffect(() => {
            if (!hasMultipleImages) return;

            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
            }, 3000);

            return () => clearInterval(interval);
        }, [hasMultipleImages, allImages.length]);

        const goToImage = (e, index) => {
            e.stopPropagation();
            setCurrentImageIndex(index);
        };

        const displayName = isRTL ? name_ar : name_en;
        const displayPrice = auction_price || price;

        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Product Image with Auto Slider */}
                <div
                    className="h-32 bg-gray-100 relative cursor-pointer group"
                    onClick={() => onProductClick(id)}
                >
                    {allImages.length > 0 && allImages[currentImageIndex] ? (
                        <>
                            <img
                                src={allImages[currentImageIndex]}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                            <div className="hidden w-full h-full items-center justify-center bg-gray-100 absolute top-0 left-0">
                                <PlaceholderSVG />
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PlaceholderSVG />
                        </div>
                    )}

                    {/* Image Indicators (Dots) */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                            {allImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => goToImage(e, index)}
                                    className={`transition-all rounded-full cursor-pointer ${index === currentImageIndex
                                        ? 'bg-white w-4 h-2'
                                        : 'bg-white/50 hover:bg-white/75 w-2 h-2'
                                        }`}
                                    aria-label={`Go to image ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="p-2">
                    <h3 className="font-bold text-xs mb-1 line-clamp-1 text-main">
                        {displayName}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-0.5 mb-1.5">
                        <IoLocationOutline className="text-main" size={12} />
                        <p className="font-medium text-xs text-gray-700">
                            {isRTL ? governorate?.name_ar : governorate?.name_en}
                        </p>
                    </div>

                    {/* Watchers and Interested */}
                    <div className="flex items-center gap-2 mb-1.5 text-[10px] text-gray-600">
                        <div className="flex items-center gap-0.5">
                            <svg className="w-3 h-3 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{product.watchers_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <HeartIcon className="w-3 h-3 text-red-600" />
                            <span>{product.interested_count || 0}</span>
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-center justify-between mb-1.5">
                        <div>
                            <h6 className="font-bold text-xs text-main">
                                {displayPrice} {isRTL ? "جنيه" : "EGP"}
                            </h6>
                            {auction_price && original_price && auction_price !== original_price && (
                                <p className="text-[10px] text-gray-500 line-through">
                                    {original_price} {isRTL ? "جنيه" : "EGP"}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => onContactSeller(product)}
                        disabled={!isAuctionOpen}
                        className={`w-full py-1.5 px-2 rounded-lg transition text-xs font-medium ${isAuctionOpen
                            ? "bg-main hover:bg-green-700 text-white cursor-pointer"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                            }`}
                    >
                        {isRTL ? "تواصل مع البائع" : "Contact Seller"}
                    </button>
                </div>
            </div>
        );
    }


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
                        <span className="font-semibold text-sm">{toast.message}</span>
                    </div>
                </div>
            )}

            {showParticipateModal && (
                <div className="fixed inset-0 bg-[#00000062] bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-main">
                        <button
                            onClick={() => setShowParticipateModal(false)}
                            className="float-left cursor-pointer text-gray-400 hover:text-gray-600 transition mb-4"
                        >
                            <X size={20} />
                        </button>

                        <div className="clear-both text-center">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">
                                {isRTL ? "هل أنت متأكد من الاشتراك في المزاد ك" : "Are you sure you want to participate as"}
                            </h3>

                            <p className="text-xl font-bold text-main mb-6">
                                {participateRole === "seller" ? (isRTL ? "بائع" : "Seller") : (isRTL ? "مشتري" : "Buyer")}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleParticipate(participateRole)}
                                    className="flex-1 cursor-pointer bg-main hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition text-base"
                                >
                                    {isRTL ? "نعم" : "Yes"}
                                </button>
                                <button
                                    onClick={() => setShowParticipateModal(false)}
                                    className="flex-1 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-bold transition text-base"
                                >
                                    {isRTL ? "لا" : "No"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold text-main mb-1">
                        {isRTL ? "مزاد تخفيض الاسعار الاسبوعي" : "Weekly Price Reduction Auction"}
                    </h1>
                    <p className="text-gray-600 text-xs">
                        {isRTL ? "تفتح المزادات كل جمعة من الساعة 7 صباحاً حتى 10 مساءً بتوقيت القاهرة" : "Auctions open every Friday from 7 AM to 10 PM Cairo time"}
                    </p>
                </div>

                <div className="bg-main rounded-2xl shadow-xl p-4 mb-4 text-white">
                    <div className="text-center mb-3">
                        <h2 className="text-base font-bold mb-1">
                            {timeRemaining.isOpen
                                ? (isRTL ? "الوقت المتبقي لإغلاق المزاد" : "Time Until Auction Closes")
                                : timeRemaining.registrationOpen
                                    ? (isRTL ? "الوقت المتبقي على فتح المزاد" : "Time Remaining Until Auction Opens")
                                    : (isRTL ? "المزاد نشط حالياً" : "Auction is currently active")
                            }
                        </h2>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2 max-w-xl mx-auto">
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.days || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "أيام" : "Days"}</div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-2xl sm:text-4xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.hours || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "ساعات" : "Hours"}</div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-2xl sm:text-4xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.minutes || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "دقائق" : "Minutes"}</div>
                        </div>
                        <div className="text-center flex items-center justify-center">
                            <span className="text-2xl sm:text-4xl font-bold mb-6">:</span>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl font-bold mb-1">
                                {String(timeRemaining.seconds || 0).padStart(2, "0")}
                            </div>
                            <div className="text-xs opacity-80">{isRTL ? "ثواني" : "Seconds"}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white border border-gray-200 text-center rounded-xl p-3 hover:border-main transition-all">
                        <h3 className="text-xs font-bold text-gray-800 mb-1">
                            {isRTL ? "التجار المسجلين في المزاد حتي الان" : "Sellers registered in the auction so far"}
                        </h3>
                        <div className="text-xl font-bold text-main">{sellersCount}</div>
                    </div>

                    <div className="bg-white border border-gray-200 text-center rounded-xl p-3 hover:border-main transition-all">
                        <h3 className="text-xs font-bold text-gray-800 mb-1">
                            {isRTL ? "المشترين المسجلين في المزاد حتي الان" : "Buyers registered in the auction so far"}
                        </h3>
                        <div className="text-xl font-bold text-main">{buyersCount}</div>
                    </div>

                    {!loading && !isParticipating && (
                        <div className="bg-white border border-gray-200 text-center rounded-xl p-3 hover:border-main transition-all">
                            <h3 className="text-xs font-bold text-gray-800 mb-1">
                                {isRTL ? (
                                    <>
                                        احجز <span style={{ color: "red" }}>ك</span>تاجر في المزاد القادم <br />
                                        {(!maxSellers || maxSellers - sellersCount <= 0)
                                            ? "∞"
                                            : maxSellers - sellersCount}{" "}
                                        تجار
                                    </>
                                ) : (
                                    <>
                                        Book as a seller in the upcoming auction <br />
                                        {(!maxSellers || maxSellers - sellersCount <= 0)
                                            ? "∞"
                                            : maxSellers - sellersCount}{" "}
                                        sellers remaining
                                    </>
                                )}
                            </h3>
                        </div>
                    )}
                    {!loading && !isParticipating && (
                        <div className="bg-white border border-gray-200 text-center rounded-xl p-3 hover:border-main transition-all">
                            <h3 className="text-xs font-bold text-gray-800 mb-1">
                                {isRTL ? (
                                    <>
                                        احجز <span style={{ color: "red" }}>ك</span>مشتري في المزاد القادم <br />
                                        متبقي{" "}
                                        {(!maxBuyers || maxBuyers - buyersCount <= 0)
                                            ? "∞"
                                            : maxBuyers - buyersCount}{" "}
                                        مشترين
                                    </>
                                ) : (
                                    <>
                                        Book as a buyer in the upcoming auction <br />
                                        متبقي{" "}
                                        {(!maxBuyers || maxBuyers - buyersCount <= 0)
                                            ? "∞"
                                            : maxBuyers - buyersCount}{" "}
                                        buyers remaining
                                    </>
                                )}
                            </h3>
                        </div>
                    )}
                </div>

                {loading ? (
                    <Loader />
                ) : !isParticipating ? (
                    <>
{timeRemaining.registrationOpen ? (
            <>
                <p className="text-center text-main mb-3 text-xl mt-8 font-bold">
                    {isRTL ? "يمكنك التسجيل المسبق للمزاد القادم والاستفادة من تخفيضات الاسعار" : "You can pre-register for the upcoming auction and benefit from price reductions"}
                </p>
                <div className="absolute bottom-0 left-0 right-0 py-3 z-40">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                className={`w-full ${canRegisterAsBuyer ? "bg-main hover:bg-green-700 cursor-pointer" : "bg-gray-400 cursor-not-allowed"} text-white px-6 py-3 rounded-xl font-bold transition text-base`}
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
                                className={`w-full ${canRegisterAsSeller ? "bg-main hover:bg-green-700 cursor-pointer" : "bg-gray-400 cursor-not-allowed"} text-white px-6 py-3 rounded-xl font-bold transition text-base`}
                            >
                                {isRTL ? "احجز كتاجر" : "Register as Seller"}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {isRTL ? "التسجيل مغلق حاليًا" : "Registration is currently closed"}
                </h3>
                <p className="text-gray-600 text-sm">
                    {isRTL ? "سيتم فتح الحجز بعد المزاد لتتمكن من التسجيل في المزاد القادم" : "Registration will open after the auction to register for the next auction"}
                </p>
            </div>
        )}
                    </>
                ) : (
                    <div className="mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
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

                        {shouldShowProducts && (
                            <div >
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">
                                        {isRTL ? "منتجات المزاد" : "Auction Products"}
                                    </h2>
                                </div>

                                {products.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-base font-medium text-gray-600">
                                            {isRTL ? "لا توجد منتجات متاحة حالياً في المزاد" : "No products available in the auction yet"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {isRTL ? "سيتم إضافة المنتجات قريباً" : "Products will be added soon"}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                            {currentProducts.map((auctionProduct) => {
                                                const productData = prepareProductData(auctionProduct);
                                                return (
                                                    <ProductCard
                                                        key={auctionProduct.id}
                                                        product={productData}
                                                        onProductClick={handleProductClick}
                                                        onContactSeller={handleContactSeller}
                                                        isAuctionOpen={timeRemaining.isOpen}
                                                    />
                                                );
                                            })}
                                        </div>
                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex justify-center mt-6">
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => paginate(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === 1
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-main text-white hover:bg-green-700 cursor-pointer'
                                                            }`}
                                                    >
                                                        {isRTL ? "السابق" : "Previous"}
                                                    </button>

                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                        <button
                                                            key={page}
                                                            onClick={() => paginate(page)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === page
                                                                ? 'bg-main text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                } cursor-pointer`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}

                                                    <button
                                                        onClick={() => paginate(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === totalPages
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-main text-white hover:bg-green-700 cursor-pointer'
                                                            }`}
                                                    >
                                                        {isRTL ? "التالي" : "Next"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isParticipating && (
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-40 shadow-lg">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className={`grid ${participantRole === 'buyer' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                            {participantRole !== 'buyer' && (
                                <button
                                    onClick={() => navigate('/my-auctions')}
                                    className="w-full cursor-pointer bg-white border-2 border-main text-main hover:bg-main hover:text-white active:scale-95 transition-all duration-200 px-3 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>{isRTL ? "مزاداتي" : "My Auctions"}</span>
                                </button>
                            )}

                            <button
                                onClick={() => navigate('/previous-auctions')}
                                className="w-full cursor-pointer bg-white border-2 border-gray-300 text-gray-700 hover:border-main hover:text-main active:scale-95 transition-all duration-200 px-3 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{isRTL ? "المزادات السابقة" : "Previous Auctions"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionPage;