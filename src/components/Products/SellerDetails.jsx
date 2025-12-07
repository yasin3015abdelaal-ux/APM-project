import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { topSellersAPI, userAPI, chatAPI } from "../../api";
import { MessageCircle, Phone } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard"; // استيراد الكومبوننت

const SellerDetails = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const { sellerId } = useParams();

    const [sellerData, setSellerData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isContacting, setIsContacting] = useState(false);
    const [toast, setToast] = useState(null);
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const [productsPerPage] = useState(10);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchReviews();
        fetchSellerProducts();
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

    const fetchSellerProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await userAPI.get(`/products?by_user=${sellerId}`);
            
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

    // Pagination calculations
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
                {/* Previous Button */}
                <button
                    onClick={() => handlePageChange(currentProductPage - 1)}
                    disabled={currentProductPage === 1}
                    className={`p-2 rounded-lg font-medium text-sm transition ${
                        currentProductPage === 1
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

                {/* Page Numbers */}
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
                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition cursor-pointer ${
                                        currentProductPage === pageNumber
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

                {/* Next Button */}
                <button
                    onClick={() => handlePageChange(currentProductPage + 1)}
                    disabled={currentProductPage === totalPages}
                    className={`p-2 rounded-lg font-medium text-sm transition ${
                        currentProductPage === totalPages
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
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-main">
                        {isRTL ? "معلومات عن التاجر" : "Seller Details"}
                    </h1>
                </div>

                {/* Seller Card */}
                <div className="bg-white border-2 border-main rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                            {/* Seller Avatar */}
                            <div className="flex-shrink-0">
                                {sellerData.avatar || sellerData.profile_image ? (
                                    <img
                                        src={sellerData.avatar || sellerData.profile_image}
                                        alt={isRTL ? sellerData.name_ar : sellerData.name}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-main"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`${sellerData.avatar || sellerData.profile_image ? 'hidden' : 'flex'} w-20 h-20 rounded-full bg-main/10 items-center justify-center border-2 border-main`}>
                                    <svg className="w-10 h-10 text-main" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {sellerData.name}
                                </h2>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={sellerData.summary?.overall_rating_avg || 0} />
                                        <span className="text-lg font-bold text-gray-900">
                                            {sellerData.summary?.overall_rating_avg?.toFixed(1) || "0.0"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Buttons (All Screens) */}
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
                            <button
                                onClick={handleCall}
                                className="p-2.5 cursor-pointer bg-green-500 hover:bg-green-600 rounded-full text-white transition"
                            >
                                <Phone size={18} />
                            </button>
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
                    {badges.length > 0 && (
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
                    )}
                </div>

                {/* Seller Products */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            {isRTL ? "إعلانات التاجر" : "Seller's Ads"}
                        </h3>
                        {sellerProducts.length > 0 && (
                            <span className="text-sm text-gray-600">
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
        </div>
    );
};

export default SellerDetails;