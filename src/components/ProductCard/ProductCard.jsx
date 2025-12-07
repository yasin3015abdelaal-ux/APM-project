import { Heart, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { chatAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import PlaceholderSVG from '../../assets/PlaceholderSVG';

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
    const [error, setError] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    const imageUrl = product.image || product.images?.[0];

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
        
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        if (!token) {
            // Redirect to login
            navigate('/login', { state: { from: `/product-details/${product.id}` } });
            return;
        }

        try {
            setIsContacting(true);
            
            // Get seller ID
            const sellerId = product.user_id || product.seller_id || product.owner_id || product.user?.id;
            
            console.log('=== Contact Seller Debug ===');
            console.log('Product:', product);
            console.log('Seller ID:', sellerId);
            console.log('Current User:', JSON.parse(localStorage.getItem('userData') || '{}'));
            
            if (!sellerId) {
                console.error('No seller ID found in product:', product);
                showToast(isRTL ? 'لا يمكن العثور على معرف البائع' : 'Cannot find seller ID',error);
                return;
            }
            
            // Check if trying to message yourself
            const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
            if (currentUser.id === sellerId) {
                showToast(isRTL ? 'لا يمكنك إرسال رسالة لنفسك' : 'You cannot message yourself', error);
                return;
            }
            
            // Prepare data for API
            const conversationData = {
                user_id: parseInt(sellerId),
                type: 'auction'
            };
            
            console.log('Sending conversation data:', conversationData);
            
            // Create conversation with seller
            const response = await chatAPI.createConversation(conversationData);
            
            console.log('API Response:', response.data);

            if (response.data.success) {
                // Navigate to messages page with the conversation
                const conversationId = response.data.conversation?.id || response.data.data?.id;
                
                if (conversationId) {
                    navigate('/chats', { 
                        state: { conversationId } 
                    });
                } else {
                    console.error('No conversation ID in response:', response.data);
                    showToast(isRTL ? 'حدث خطأ أثناء إنشاء المحادثة' : 'Error creating conversation', error);
                }
            }
        } catch (error) {
            console.error('=== Error Details ===');
            console.error('Full Error:', error);
            console.error('Error Response:', error.response);
            console.error('Error Data:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            
            // If conversation already exists, try to navigate anyway
            if (error.response?.status === 409 || error.response?.data?.conversation) {
                const existingConvId = error.response.data.conversation?.id || error.response.data.data?.id;
                if (existingConvId) {
                    console.log('Conversation exists, navigating to:', existingConvId);
                    navigate('/chats', { state: { conversationId: existingConvId } });
                    return;
                }
            }
            
            // Show error details
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.error 
                || error.message 
                || 'Unknown error';
                
            const errorDetails = error.response?.data?.errors 
                ? JSON.stringify(error.response.data.errors) 
                : '';
            
            showToast(isRTL 
                ? `حدث خطأ: ${errorMessage}\n${errorDetails}` 
                : `Error: ${errorMessage}\n${errorDetails}`
                ,error
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
                className="relative h-40 bg-gray-100 cursor-pointer group"
                onClick={() => onProductClick(product.id)}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={isRTL ? product.name_ar : product.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'block';
                        }}
                    />
                ) : null}
                <div 
                    className={`${imageUrl ? 'hidden' : 'block'} w-full h-full`}
                    style={{ display: imageUrl ? 'none' : 'block' }}
                >
                    <PlaceholderSVG />
                </div>

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