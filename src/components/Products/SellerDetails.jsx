import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { topSellersAPI, userAPI, chatAPI } from "../../api";
import { MessageCircle, Phone } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard";
import Loader from "../Ui/Loader/Loader";
import SellerRatingModal from "../../components/SellerRating/SellerRating";
import SellerReportModal from "../../components/SellerRating/SellerReport";

const SellerDetails = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const { sellerId } = useParams();
    const scrollRef = useRef(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const [sellerData, setSellerData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [isContacting, setIsContacting] = useState(false);
    const [toast, setToast] = useState(null);
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [expandedReviews, setExpandedReviews] = useState({});
    const [showSellerOptions, setShowSellerOptions] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const sellerOptionsRef = useRef(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchSellerData();
        fetchSellerProducts();
    }, [sellerId]);

    const toggleExpand = (reviewId) => {
        setExpandedReviews(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

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

    const fetchSellerData = async () => {
        try {
            setLoading(true);
            setReviewsLoading(true);
            const response = await topSellersAPI.getSellerReviews(sellerId, { page: 1 });
            const data = response.data?.data;
            console.log("Fetched seller data:", data);
            setSellerData(data?.seller);
            setReviews(data?.reviews || []);

        } catch (error) {
            console.error("Error fetching seller data:", error);
        } finally {
            setLoading(false);
            setReviewsLoading(false);
        }
    };

    const fetchSellerProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await userAPI.get(`/products?seller_id=${sellerId}`);

            let productsData = [];
            if (Array.isArray(response.data)) {
                productsData = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                productsData = response.data.data;
            } else if (response.data?.products && Array.isArray(response.data.products)) {
                productsData = response.data.products;
            }

            setSellerProducts(productsData);
        } catch (error) {
            console.error("Error fetching seller products:", error);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleChat = async (e) => {
        if (e) e.stopPropagation();

        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login', { state: { from: `/seller/${sellerId}` } });
            return;
        }

        try {
            setIsContacting(true);

            const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
            if (currentUser.id === parseInt(sellerId)) {
                showToast(isRTL ? 'لا يمكنك إرسال رسالة لنفسك' : 'You cannot message yourself', 'error');
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
                    showToast(isRTL ? 'حدث خطأ أثناء إنشاء المحادثة' : 'Error creating conversation', 'error');
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

            showToast(isRTL
                ? `حدث خطأ: ${errorMessage}`
                : `Error: ${errorMessage}`
                , 'error'
            );
        } finally {
            setIsContacting(false);
        }
    };

    const handleCall = () => {
        if (sellerData?.phone) {
            const phoneNumber = sellerData.phone;
            window.location.href = `tel:${phoneNumber}`;
        } else {
            showToast(isRTL ? 'رقم الهاتف غير متوفر' : 'Phone number not available', 'error');
        }
    };

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

    const handleRateSeller = () => {
        setShowSellerOptions(false);
        setShowRatingModal(true);
    };

    const handleReportSeller = () => {
        setShowSellerOptions(false);
        setShowReportModal(true);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sellerOptionsRef.current && !sellerOptionsRef.current.contains(event.target)) {
                setShowSellerOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const calculateAverageRatings = () => {
        if (reviews.length === 0) {
            return {
                honest: 0,
                easyToDeal: 0,
                productQuality: 0
            };
        }

        const totals = reviews.reduce((acc, review) => ({
            honest: acc.honest + (review.rating_honest || 0),
            easyToDeal: acc.easyToDeal + (review.rating_easy_to_deal_with || 0),
            productQuality: acc.productQuality + (review.rating_product_quality || 0)
        }), { honest: 0, easyToDeal: 0, productQuality: 0 });

        return {
            honest: totals.honest / reviews.length,
            easyToDeal: totals.easyToDeal / reviews.length,
            productQuality: totals.productQuality / reviews.length
        };
    };

    const averageRatings = calculateAverageRatings();

    if (loading) {
        return (
            <Loader />
        );
    }

    if (!sellerData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">{isRTL ? "لم يتم العثور على التاجر" : "Seller not found"}</p>
            </div>
        );
    }

    const indexOfLastProduct = currentProductPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sellerProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(sellerProducts.length / productsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentProductPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center items-center gap-2 mt-6">
                <button
                    onClick={() => handlePageChange(currentProductPage - 1)}
                    disabled={currentProductPage === 1}
                    className={`p-2 rounded-lg font-medium text-sm transition ${currentProductPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-main text-white hover:bg-main/90 cursor-pointer'
                        }`}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex gap-2">
                    {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;

                        if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentProductPage - 1 && pageNumber <= currentProductPage + 1)
                        ) {
                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition cursor-pointer ${currentProductPage === pageNumber
                                        ? 'bg-main text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            );
                        } else if (
                            pageNumber === currentProductPage - 2 ||
                            pageNumber === currentProductPage + 2
                        ) {
                            return (
                                <span key={pageNumber} className="px-2 py-2 text-gray-500">
                                    ...
                                </span>
                            );
                        }
                        return null;
                    })}
                </div>

                <button
                    onClick={() => handlePageChange(currentProductPage + 1)}
                    disabled={currentProductPage === totalPages}
                    className={`p-2 rounded-lg font-medium text-sm transition ${currentProductPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-main text-white hover:bg-main/90 cursor-pointer'
                        }`}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-6" dir={isRTL ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-3 ${isRTL ? "left-3" : "right-3"} z-50 animate-slide-in max-w-[90%]`}>
                    <div className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium break-words text-xs">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-main">
                        {isRTL ? "معلومات عن التاجر" : "Seller Details"}
                    </h1>
                    <div className="relative" ref={sellerOptionsRef}>
                        <button
                            onClick={() => setShowSellerOptions(!showSellerOptions)}
                            className="p-2 rounded-xl cursor-pointer text-gray-600 hover:bg-green-50 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>

                        {showSellerOptions && (
                            <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden`}>
                                <button
                                    onClick={handleRateSeller}
                                    className="w-full cursor-pointer px-4 py-3 hover:bg-green-50 flex items-center gap-2 transition text-gray-700 text-sm border-b border-gray-100"
                                >
                                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="font-medium">{isRTL ? 'تقييم البائع' : 'Rate Seller'}</span>
                                </button>

                                <button
                                    onClick={handleReportSeller}
                                    className="w-full cursor-pointer px-4 py-3 hover:bg-red-50 flex items-center gap-2 transition text-red-600 text-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="font-medium">
                                        {isRTL ? 'الإبلاغ عن البائع' : 'Report Seller'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border-2 border-main rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                            <div className="flex-shrink-0">
                                {sellerData.avatar || sellerData.profile_image || sellerData.image ? (
                                    <img
                                        src={sellerData.avatar || sellerData.profile_image || sellerData.image}
                                        alt={sellerData.name}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-main"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`${sellerData.avatar || sellerData.profile_image || sellerData.image ? 'hidden' : 'flex'} w-20 h-20 rounded-full bg-main/10 items-center justify-center border-2 border-main`}>
                                    <svg className="w-10 h-10 text-main" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {sellerData.name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={sellerData.reviews_summary?.rating_avg || 0} />
                                        <span className="text-lg font-bold text-gray-900">
                                            {sellerData.reviews_summary?.rating_avg?.toFixed(1) || "0.0"}
                                        </span>
                                    </div>
                                    <span className="text-sm text-main">
                                        ({sellerData.reviews_summary?.reviews_count || 0} {isRTL ? "تقييم" : "reviews"})
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {sellerData.reviews_summary?.reviews_count >= 3 && sellerData.reviews_summary?.rating_avg >= 4.5 && (
                                        <div className="bg-main text-white rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                            {isRTL ? "افضل التجار" : "Top Seller"}
                                        </div>
                                    )}

                                    {averageRatings.honest >= 4 && reviews.length > 0 && (
                                        <div className="bg-main text-white rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                            {isRTL ? "امين" : "Honest"}
                                        </div>
                                    )}

                                    {averageRatings.easyToDeal >= 4 && reviews.length > 0 && (
                                        <div className="bg-main text-white rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                            {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                        </div>
                                    )}

                                    {averageRatings.productQuality >= 4 && reviews.length > 0 && (
                                        <div className="bg-main text-white rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                            {isRTL ? "بضاعة ممتازة" : "Great Product Quality"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleChat}
                                disabled={isContacting}
                                className="p-2.5 cursor-pointer bg-blue-500 hover:bg-blue-600 rounded-full text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isContacting ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <MessageCircle size={18} />
                                )}
                            </button>
                            {sellerData.phone && (
                                <button
                                    onClick={handleCall}
                                    className="p-2.5 cursor-pointer bg-green-500 hover:bg-green-600 rounded-full text-white transition"
                                >
                                    <Phone size={18} />
                                </button>
                            )}
                        </div>

                    </div>


                </div>

                {reviews.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-main">
                                {isRTL ? "تقييمات العملاء" : "Customer Reviews"}
                            </h3>
                            <span className="text-sm text-main font-semibold bg-main/10 px-3 py-1 rounded-lg">
                                {reviews.length} {isRTL ? "تقييم" : "reviews"}
                            </span>
                        </div>

                        {reviewsLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
                            </div>
                        ) : (
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
                                                className={`relative min-w-[320px] max-w-[320px] snap-start rounded-xl shadow-md bg-white shrink-0 hover:shadow-xl transition-all select-none overflow-hidden border border-gray-100 ${isExpanded ? 'h-auto' : 'h-[380px]'
                                                    }`}
                                            >
                                                <div className="bg-gradient-to-br from-main to-main/80 p-4 pb-16">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                                            {review.reviewer?.image ? (
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
                                                                className={`${review.reviewer?.image ? 'hidden' : 'block'} w-6 h-6 text-main`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-white truncate">
                                                                {review.reviewer?.name}
                                                            </p>
                                                            <p className="text-xs text-white/80">
                                                                {formatDate(review.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="absolute top-[85px] left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3 border-4 border-white">
                                                    <StarRating rating={review.rating} />
                                                    <span className="font-bold text-2xl text-main">
                                                        {review.rating.toFixed(1)}
                                                    </span>
                                                </div>

                                                <div className="p-4 pt-12">
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

                                                    {review.comment && (
                                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                                                            <p
                                                                className={`text-gray-700 text-xs leading-relaxed whitespace-pre-wrap break-words ${!isExpanded ? 'line-clamp-1' : ''
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
                        )}
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-main">
                            {isRTL ? "إعلانات التاجر" : "Seller's Ads"}
                        </h3>
                        {sellerProducts.length > 0 && (
                            <span className="text-sm text-main font-semibold bg-main/10 px-3 py-1 rounded-lg">
                                {isRTL
                                    ? `${sellerProducts.length} إعلان`
                                    : `${sellerProducts.length} ads`
                                }
                            </span>
                        )}
                    </div>

                    {productsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
                        </div>
                    ) : sellerProducts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl">
                            <p className="text-gray-500">{isRTL ? "لا توجد إعلانات" : "No ads yet"}</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {currentProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {renderPagination()}
                        </>
                    )}
                </div>
            </div>

            <SellerRatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                sellerId={sellerData?.id}
                sellerName={sellerData?.name}
            />

            <SellerReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                sellerId={sellerData?.id}
                sellerName={sellerData?.name}
            />
        </div>
    );
};

export default SellerDetails;