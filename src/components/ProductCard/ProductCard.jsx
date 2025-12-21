import { Heart, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import PlaceholderSVG from '../../assets/PlaceholderSVG';

const extractImageUrls = (images) => {
    if (!images) return [];
    
    if (Array.isArray(images)) {
        return images.map(img => {
            if (typeof img === 'object' && img !== null) {
                return img.image_url || img.url || img.path || '';
            }
            return img;
        }).filter(Boolean);
    }
    
    return [];
};

const ProductCard = ({ 
    product, 
    isFavorite = false, 
    onToggleFavorite, 
    onProductClick, 
    onContactSeller 
}) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const navigate = useNavigate();
    const [isContacting, setIsContacting] = useState(false);
    const [toast, setToast] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const autoSlideTimerRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const imageUrls = extractImageUrls(product.images);
    const singleImage = typeof product.image === 'object' && product.image?.image_url 
        ? product.image.image_url 
        : product.image;
    
    const allImages = imageUrls.length > 0 
        ? imageUrls 
        : (singleImage ? [singleImage] : []);
    
    const hasMultipleImages = allImages.length > 1;

    const clearAutoSlide = () => {
        if (autoSlideTimerRef.current) {
            clearInterval(autoSlideTimerRef.current);
        }
    };

    const startAutoSlide = () => {
        if (!hasMultipleImages || isPaused) return;
        
        clearAutoSlide();
        autoSlideTimerRef.current = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
        }, 3000);
    };

    useEffect(() => {
        startAutoSlide();
        return () => clearAutoSlide();
    }, [isPaused, hasMultipleImages, allImages.length]);

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const goToImage = (e, index) => {
        e.stopPropagation();
        setCurrentImageIndex(index);
    };

    const handleMouseEnter = () => {
        setIsPaused(true);
        clearAutoSlide();
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return isRTL ? 'اليوم' : 'Today';
        } else if (diffDays === 1) {
            return isRTL ? 'أمس' : 'Yesterday';
        } else if (diffDays < 7) {
            return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return isRTL ? `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}` : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else {
            return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const handleContactSeller = async (e) => {
        e.stopPropagation();
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login', { state: { from: `/product-details/${product.id}` } });
            return;
        }

        try {
            setIsContacting(true);
            
            const sellerId = product.user_id || product.seller_id || product.owner_id || product.user?.id;
            
            if (!sellerId) {
                showToast(isRTL ? 'لا يمكن العثور على معرف البائع' : 'Cannot find seller ID', 'error');
                return;
            }
            
            const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
            if (currentUser.id === sellerId) {
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

    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}
            
            <div
                className="relative h-40 bg-gray-100 cursor-pointer group overflow-hidden"
                onClick={() => onProductClick(product.id)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {allImages.length > 0 ? (
                    <div className="relative w-full h-full">
                        {allImages.map((img, index) => (
                            <div
                                key={index}
                                className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out"
                                style={{
                                    opacity: currentImageIndex === index ? 1 : 0,
                                    transform: currentImageIndex === index 
                                        ? 'translateX(0%) scale(1)' 
                                        : currentImageIndex > index 
                                            ? `translateX(${isRTL ? '100%' : '-100%'}) scale(0.95)` 
                                            : `translateX(${isRTL ? '-100%' : '100%'}) scale(0.95)`,
                                    zIndex: currentImageIndex === index ? 2 : 1
                                }}
                            >
                                <img
                                    src={img}
                                    alt={`${isRTL ? product.name_ar : product.name_en} - ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling?.style && (e.target.nextElementSibling.style.display = 'block');
                                    }}
                                />
                                <div 
                                    className="hidden w-full h-full"
                                    style={{ display: 'none' }}
                                >
                                    <PlaceholderSVG />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <PlaceholderSVG />
                    </div>
                )}

                {hasMultipleImages && (
                    <>
                        <button
                            onClick={prevImage}
                            className={`absolute cursor-pointer top-1/2 -translate-y-1/2 ${isRTL ? 'right-2' : 'left-2'} bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 backdrop-blur-sm`}
                        >
                            {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                        <button
                            onClick={nextImage}
                            className={`absolute cursor-pointer top-1/2 -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 backdrop-blur-sm`}
                        >
                            {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                            {allImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => goToImage(e, index)}
                                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                                        index === currentImageIndex 
                                            ? 'bg-white w-5 h-2' 
                                            : 'bg-white/50 hover:bg-white/75 w-2 h-2'
                                    }`}
                                    aria-label={`Go to image ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {onToggleFavorite && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(product.id);
                        }}
                        className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} cursor-pointer rounded-full p-1.5 shadow-sm hover:scale-110 transition-all z-10 ${
                            isFavorite 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-white hover:bg-gray-50'
                        }`}
                    >
                        <Heart
                            size={16}
                            className={isFavorite ? 'fill-white text-white' : 'text-gray-400'}
                        />
                    </button>
                )}
            </div>

            <div className="p-3">
                <h3
                    className="text-sm font-semibold cursor-pointer text-main transition line-clamp-2 mb-1"
                    onClick={() => onProductClick(product.id)}
                >
                    {isRTL ? product.name_ar : product.name_en}
                </h3>

                <div className="space-y-0.5 mb-2">
                    {product.governorate && (
                        <div className="flex items-center text-xs text-gray-600">
                            <MapPin size={12} className={`${isRTL ? 'ml-1' : 'mr-1'} text-main`} />
                            <span>
                                {isRTL ? product.governorate.name_ar : product.governorate.name_en}
                            </span>
                        </div>
                    )}

                    {product.created_at && (
                        <div className="flex items-center text-xs text-gray-500">
                            <Calendar size={12} className={`${isRTL ? 'ml-1' : 'mr-1'} text-gray-400`} />
                            <span>{formatDate(product.created_at)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 ${isRTL ? 'ml-0.5' : 'mr-0.5'} text-main`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{product.watchers_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Heart size={14} className={`${isRTL ? 'ml-0.5' : 'mr-0.5'} text-red-500`} />
                        <span>{product.interested_count || 0}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mb-2 sm:mb-0">
                    <div className="text-base font-bold text-main">
                        {product.price} 
                        <span className="text-xs font-normal text-main mr-1">
                            {t('ads.concurrency')}
                        </span>
                    </div>
                    {onContactSeller && (
                        <button
                            onClick={handleContactSeller}
                            disabled={isContacting}
                            className="hidden sm:flex items-center gap-1 bg-main hover:bg-green-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isContacting ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{isRTL ? 'جاري...' : 'Loading...'}</span>
                                </>
                            ) : (
                                <span>{isRTL ? 'تواصل مع البائع' : 'Contact Seller'}</span>
                            )}
                        </button>
                    )}
                </div>

                {onContactSeller && (
                    <button
                        onClick={handleContactSeller}
                        disabled={isContacting}
                        className="sm:hidden w-full flex items-center justify-center gap-2 bg-main hover:bg-green-800 text-white py-2 rounded-md text-sm font-medium transition shadow-sm hover:shadow-md cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isContacting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>{isRTL ? 'جاري...' : 'Loading...'}</span>
                            </>
                        ) : (
                            <span>{isRTL ? 'تواصل مع البائع' : 'Contact Seller'}</span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductCard;