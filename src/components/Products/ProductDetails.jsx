import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, AlertTriangle, MessageCircle, Phone, MoreVertical, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, chatAPI } from '../../api';
import PlaceholderSVG from '../../assets/PlaceholderSVG';
import Loader from '../../components/Ui/Loader/Loader';
import SellerReportModal from '../SellerRating/SellerReport';

const systemFields = [
    'id', 'country_id', 'user_id', 'created_at', 'updated_at',
    'status', 'watchers_count', 'interested_count', 'is_active',
    'is_favorited', 'is_in_last_auction', 'has_special_label',
    'category', 'sub_category', 'user', 'country', 'governorate',
    'image', 'images', 'attributes', 'name', 'description',
    'name_ar', 'name_en', 'description_ar', 'description_en', 'price'
];

const getFieldLabel = (fieldName, isRTL) => {
    const labels = {
        'age': { ar: 'العمر', en: 'Age' },
        'gender': { ar: 'النوع', en: 'Gender' },
        'quantity': { ar: 'الكمية', en: 'Quantity' },
        'location': { ar: 'الموقع', en: 'Location' },
        'governorate_id': { ar: 'المحافظة', en: 'Governorate' },
        'contact_method': { ar: 'طريقة التواصل', en: 'Contact Method' },
        'needs_vaccinations': { ar: 'التطعيمات', en: 'Vaccinations' },
        'delivery_available': { ar: 'التوصيل', en: 'Delivery' },
        'retail_sale_available': { ar: 'البيع بالقطعة', en: 'Retail Sale' },
        'price_negotiable': { ar: 'السعر قابل للتفاوض', en: 'Price Negotiable' },
        'has_iso_certification': { ar: 'شهادة ISO', en: 'ISO Certification' },
        'has_fracture_scan': { ar: 'فحص الكسور', en: 'Fracture Scan' },
        'client_slaughter_available': { ar: 'ذبح العميل متاح', en: 'Client Slaughter Available' },
        'farm_preparation_available': { ar: 'تجهيز المزرعة متاح', en: 'Farm Preparation Available' },
        'breed_type': { ar: 'نوع السلالة', en: 'Breed Type' },
        'color': { ar: 'اللون', en: 'Color' },
        'preparation_type': { ar: 'نوع التجهيز', en: 'Preparation Type' },
        'herd_price': { ar: 'سعر القطيع', en: 'Herd Price' },
        'type': { ar: 'النوع', en: 'Type' },
        'protein_percentage': { ar: 'نسبة البروتين', en: 'Protein Percentage' },
        'package_size': { ar: 'حجم العبوة', en: 'Package Size' },
        'weight': { ar: 'الوزن', en: 'Weight' },
        'height': { ar: 'الطول', en: 'Height' },
        'width': { ar: 'العرض', en: 'Width' },
    };

    if (labels[fieldName]) {
        return isRTL ? labels[fieldName].ar : labels[fieldName].en;
    }

    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const formatFieldValue = (fieldName, value, isRTL, product) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (typeof value === 'boolean') {
        return value ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No');
    }

    if (fieldName === 'gender') {
        return value === 'male' ? (isRTL ? 'ذكر' : 'Male') : (isRTL ? 'أنثى' : 'Female');
    }

    if (fieldName === 'age') {
        return `${value} ${isRTL ? 'شهر' : 'months'}`;
    }

    if (fieldName === 'contact_method') {
        const methods = {
            'chat': isRTL ? 'محادثة' : 'Chat',
            'phone': isRTL ? 'هاتف' : 'Phone',
            'both': isRTL ? 'كلاهما' : 'Both'
        };
        return methods[value] || value;
    }

    if (fieldName === 'governorate_id' && product.governorate) {
        return isRTL ? product.governorate.name_ar : product.governorate.name_en;
    }

    return value;
};

const extractProductDetails = (product, isRTL) => {
    if (!product) return [];

    const details = [];

    if (product.category) {
        details.push({
            label: isRTL ? 'الفئة' : 'Category',
            value: isRTL ? product.category.name_ar : product.category.name_en
        });
    }

    if (product.sub_category) {
        details.push({
            label: isRTL ? 'الفئة الفرعية' : 'Sub Category',
            value: isRTL ? product.sub_category.name_ar : product.sub_category.name_en
        });
    }

    Object.keys(product).forEach(key => {
        if (systemFields.includes(key)) {
            return;
        }

        const value = product[key];

        if (value === null || value === undefined || value === '') {
            return;
        }

        const label = getFieldLabel(key, isRTL);
        const formattedValue = formatFieldValue(key, value, isRTL, product);

        if (formattedValue !== null) {
            details.push({
                label,
                value: formattedValue
            });
        }
    });

    return details;
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { isAuthenticated } = useAuth();
    const isRTL = i18n.language === 'ar';

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [toast, setToast] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [isContacting, setIsContacting] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const optionsRef = useRef(null);
    const shareRef = useRef(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
            if (shareRef.current && !shareRef.current.contains(event.target)) {
                setShowShareMenu(false);
            }
        };

        if (showOptions || showShareMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions, showShareMenu]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await userAPI.get(`/products/${id}`);
                const data = response.data;
                let productData = null;

                if (data?.data) {
                    productData = data.data;
                } else if (data?.product) {
                    productData = data.product;
                } else if (data?.id) {
                    productData = data;
                }

                if (productData) {
                    setProduct(productData);
                    if (isAuthenticated) {
                        if (productData.is_favorited !== undefined) {
                            setIsFavorite(!!productData.is_favorited);
                        } else {
                            checkIfFavorite();
                        }
                    }
                }

            } catch (error) {
                console.error('Error fetching product:', error);
                showToast(t('common.error'), 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isAuthenticated]);

    const checkIfFavorite = async () => {
        if (!id || !isAuthenticated) return;

        try {
            const response = await userAPI.get('/favorites');
            let favoritesArray = [];

            if (Array.isArray(response.data)) {
                favoritesArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                favoritesArray = response.data.data;
            } else if (response.data.favorites && Array.isArray(response.data.favorites)) {
                favoritesArray = response.data.favorites;
            }

            const isFav = favoritesArray.some(fav => {
                const product = fav.product || fav;
                return String(product.id) === String(id);
            });

            setIsFavorite(isFav);
        } catch (error) {
            console.error('Error checking favorites:', error);
        }
    };

    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            showToast(isRTL ? 'يرجى تسجيل الدخول لإضافة المنتج للمفضلة' : 'Please login to add to favorites', 'error');
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        try {
            if (isFavorite) {
                await userAPI.delete(`/favorites/${id}`);
                setIsFavorite(false);
                showToast(isRTL ? 'تم إزالة المنتج من المفضلة' : 'Product removed from favorites');
            } else {
                await userAPI.post(`/favorites/${id}`);
                setIsFavorite(true);
                showToast(isRTL ? 'تم إضافة المنتج للمفضلة' : 'Product added to favorites');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast(t('common.error'), 'error');
        }
    };

    const handleShare = (platform) => {
        const productUrl = window.location.href;
        const productName = isRTL ? product?.name_ar : product?.name_en;
        const productPrice = `${product?.price} ${getCurrency()}`;
        const shareText = `${productName} - ${productPrice}`;

        let shareUrl = '';

        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + productUrl)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(productUrl);
                showToast(isRTL ? 'تم نسخ الرابط' : 'Link copied to clipboard');
                setShowShareMenu(false);
                return;
            default:
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank');
            setShowShareMenu(false);
        }
    };

    const handleReportAd = () => {
        setShowOptions(false);
        setShowReportModal(true);
    };

    const handleChat = async (e) => {
        if (e) e.stopPropagation();

        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login', { state: { from: `/product-details/${id}` } });
            return;
        }

        try {
            setIsContacting(true);

            const sellerId = product?.user?.id || product?.user_id;

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

    const handleCall = () => {
        if (product?.user?.phone) {
            const phoneNumber = product.user.phone;
            window.location.href = `tel:${phoneNumber}`;
        } else if (product?.seller_phone) {
            const phoneNumber = product.seller_phone;
            window.location.href = `tel:${phoneNumber}`;
        } else {
            showToast(isRTL ? 'رقم الهاتف غير متوفر' : 'Phone number not available', 'error');
        }
    };

    const handleSellerClick = () => {
        const sellerId = product?.user?.id || product?.user_id;
        if (sellerId) {
            navigate(`/seller/${sellerId}`);
        }
    };

    const StarRating = ({ rating }) => {
        const { i18n } = useTranslation();
        const isRTL = i18n.language === 'ar';

        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.floor(rating);
                    const isHalfFilled = star === Math.ceil(rating) && rating % 1 !== 0;

                    return (
                        <svg key={star} className="w-3.5 h-3.5" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path
                                className="stroke-gray-300"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />

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
                                                <stop offset="0%" stopColor="#FBBF24" />
                                                <stop offset="50%" stopColor="#FBBF24" />
                                                <stop offset="50%" stopColor="transparent" />
                                                <stop offset="100%" stopColor="transparent" />
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
                        </svg>
                    );
                })}
            </div>
        );
    };

    const renderContactButtons = () => {
        const contactMethod = product?.contact_method || 'both';

        const renderChatButton = () => (
            <button
                onClick={handleChat}
                disabled={isContacting}
                className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm ${contactMethod === 'chat' ? 'w-full' : 'flex-1'}`}
            >
                {isContacting ? (
                    <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{isRTL ? 'جاري...' : 'Loading...'}</span>
                    </>
                ) : (
                    <>
                        <MessageCircle size={20} />
                        <span>{isRTL ? 'محادثة' : 'Chat'}</span>
                    </>
                )}
            </button>
        );

        const renderCallButton = () => (
            <button
                onClick={handleCall}
                className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm ${contactMethod === 'phone' ? 'w-full' : 'flex-1'}`}
            >
                <Phone size={20} />
                <span>{isRTL ? 'اتصال' : 'Call'}</span>
            </button>
        );

        switch (contactMethod) {
            case 'chat':
                return renderChatButton();
            case 'phone':
                return renderCallButton();
            case 'both':
            default:
                return (
                    <div className="flex flex-col sm:flex-row gap-2">
                        {renderChatButton()}
                        {renderCallButton()}
                    </div>
                );
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <div className="text-base text-gray-600 mb-3">
                        {isRTL ? 'المنتج غير موجود' : 'Product not found'}
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-main text-white px-4 py-2 rounded-lg cursor-pointer text-sm"
                    >
                        {isRTL ? 'رجوع' : 'Go Back'}
                    </button>
                </div>
            </div>
        );
    }

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

const imageUrls = extractImageUrls(product.images);
const singleImage = typeof product.image === 'object' && product.image?.image_url 
    ? product.image.image_url 
    : product.image;

const images = imageUrls.length > 0 
    ? imageUrls 
    : (singleImage ? [singleImage] : []);

const productDetails = extractProductDetails(product, isRTL);    const getCurrency = () => {
        if (product.country?.currency) {
            return product.country.currency;
        }
        return isRTL ? 'جنيه' : 'EGP';
    };

    const seller = product?.user || {};
    const sellerName = isRTL ? (seller.name_ar || seller.name) : (seller.name || seller.name_ar);
    const sellerRating = seller?.rating_avg || 0;
    const sellerReviewsCount = seller.reviews_count || 0;
    const sellerAvatar = seller.avatar || seller.profile_image || seller.image;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'}>
            <SellerReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                sellerId={product?.user?.id || product?.user_id}
                sellerName={sellerName}
                productId={id}
            />

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

            <div className="max-w-6xl mx-auto px-3 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <div className="relative h-60 md:h-70">
                                <button
                                    onClick={toggleFavorite}
                                    disabled={!isAuthenticated}
                                    className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10 p-1.5 rounded-full shadow transition cursor-pointer text-xs ${!isAuthenticated ? 'bg-gray-300 cursor-not-allowed opacity-70' : isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-white/90 backdrop-blur-sm hover:bg-white'}`}
                                    title={!isAuthenticated ? (isRTL ? 'سجل دخول لإضافة للمفضلة' : 'Login to add to favorites') : ''}
                                >
                                    <Heart size={16} className={isFavorite ? 'fill-white text-white' : 'text-gray-600'} />
                                </button>

                                <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} z-10`} ref={optionsRef}>
                                    <button
                                        onClick={() => setShowOptions(!showOptions)}
                                        className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow transition cursor-pointer text-xs"
                                    >
                                        <MoreVertical size={16} className="text-gray-600" />
                                    </button>

                                    {showOptions && (
                                        <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20`}>
                                            <button
                                                onClick={() => {
                                                    setShowOptions(false);
                                                    setShowShareMenu(true);
                                                }}
                                                className="w-full px-3 py-2 hover:bg-blue-50 text-blue-600 flex items-center gap-1.5 transition cursor-pointer text-xs border-b border-gray-100"
                                            >
                                                <Share2 size={14} />
                                                <span className="font-medium">{isRTL ? 'مشاركة الإعلان' : 'Share Ad'}</span>
                                            </button>
                                            <button
                                                onClick={handleReportAd}
                                                className="w-full px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1.5 transition cursor-pointer text-xs"
                                            >
                                                <AlertTriangle size={14} />
                                                <span className="font-medium">{isRTL ? 'الإبلاغ عن الإعلان' : 'Report Ad'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {showShareMenu && (
                                    <div ref={shareRef} className={`absolute top-12 ${isRTL ? 'right-2' : 'left-2'} z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2`}>
                                        <div className="text-xs font-bold text-gray-700 px-2 py-1 mb-1">{isRTL ? 'مشاركة عبر' : 'Share via'}</div>
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="w-full px-3 py-2 hover:bg-green-50 text-green-600 flex items-center gap-2 transition cursor-pointer text-xs rounded"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            <span>WhatsApp</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare('facebook')}
                                            className="w-full px-3 py-2 hover:bg-blue-50 text-blue-600 flex items-center gap-2 transition cursor-pointer text-xs rounded"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                            <span>Facebook</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare('twitter')}
                                            className="w-full px-3 py-2 hover:bg-sky-50 text-sky-600 flex items-center gap-2 transition cursor-pointer text-xs rounded"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                            </svg>
                                            <span>Twitter</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare('telegram')}
                                            className="w-full px-3 py-2 hover:bg-blue-50 text-blue-500 flex items-center gap-2 transition cursor-pointer text-xs rounded"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.627z" />
                                            </svg>
                                            <span>Telegram</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare('copy')}
                                            className="w-full px-3 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2 transition cursor-pointer text-xs rounded"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>{isRTL ? 'نسخ الرابط' : 'Copy Link'}</span>
                                        </button>
                                    </div>
                                )}

                                {images.length > 0 && images[selectedImage] ? (
                                    <img
                                        src={images[selectedImage]}
                                        alt={isRTL ? product.name_ar : product.name_en}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`${images.length > 0 && images[selectedImage] ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gray-100`}>
                                    <PlaceholderSVG />
                                </div>
                            </div>

                            {images.length > 1 && (
                                <div className="flex gap-1 p-2 bg-gray-50 overflow-x-auto">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`flex-shrink-0 w-10 h-10 rounded transition cursor-pointer text-xs ${selectedImage === index ? 'border-2 border-main' : 'border border-gray-300 hover:border-gray-400'}`}
                                        >
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={`${index + 1}`}
                                                    className="w-full h-full object-cover rounded"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="hidden w-full h-full bg-gray-200 rounded" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div onClick={handleSellerClick} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-main transition cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    {sellerAvatar ? (
                                        <img
                                            src={sellerAvatar}
                                            alt={sellerName}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${sellerAvatar ? 'hidden' : 'flex'} w-14 h-14 rounded-full bg-main/10 items-center justify-center border-2 border-gray-200`}>
                                        <svg className="w-7 h-7 text-main" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-900 truncate mb-1">
                                        {sellerName || (isRTL ? 'البائع' : 'Seller')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={sellerRating} />
                                        <span className="text-sm font-bold text-gray-700">{sellerRating}</span>
                                        {sellerReviewsCount > 0 && (
                                            <span className="text-xs text-gray-500">
                                                ({sellerReviewsCount} {isRTL ? 'تقييم' : 'reviews'})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex sm:hidden items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleChat(e);
                                        }}
                                        className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCall();
                                        }}
                                        className="p-2.5 bg-green-500 hover:bg-green-600 rounded-full text-white transition"
                                    >
                                        <Phone size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <h1 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2" onClick={() => navigate(`/product-details/${product.id}`)}>
                                {isRTL ? product.name_ar : product.name_en}
                            </h1>

                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center text-gray-600 text-xs">
                                    <MapPin size={14} className={isRTL ? 'ml-1.5' : 'mr-1.5'} />
                                    <span>{isRTL ? product.governorate?.name_ar : product.governorate?.name_en}</span>
                                </div>
                                <div className="text-xl font-bold text-main">
                                    {product.price} <span className="text-sm">{getCurrency()}</span>
                                </div>
                            </div>

                            {(product.description_ar || product.description_en || product.description) && (
                                <div className="mb-3">
                                    <h2 className="text-base font-bold text-gray-800">{isRTL ? 'الوصف' : 'Description'}</h2>
                                    <p className="text-gray-600 text-xs leading-relaxed">
                                        {isRTL ? (product.description_ar || product.description) : (product.description_en || product.description)}
                                    </p>
                                </div>
                            )}
                            <div className="hidden sm:block">{renderContactButtons()}</div>
                        </div>
                    </div>

                    {productDetails.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3.5">
                            <h2 className="text-base font-bold text-gray-800 mb-3">{isRTL ? 'تفاصيل المنتج' : 'Product Details'}</h2>
                            <div className="space-y-3">
                                {productDetails.map((detail, index) => (
                                    <div key={index} className="flex justify-between items-center p-4 bg-white rounded-lg text-xs">
                                        <div className="text-gray-600 font-medium">{detail.label}</div>
                                        <div className="font-bold text-main">{detail.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-yellow-100 rounded-lg p-3 mt-4">
                    <div className="flex items-center text-center justify-center gap-2">
                        <div className="flex-1">
                            <h3 className="font-bold text-yellow-800 text-xs mb-1 cursor-pointer">
                                {isRTL ? 'تحذير هام' : 'Important Warning'}
                            </h3>
                            <p className="text-yellow-700 text-xs leading-relaxed cursor-pointer">
                                {isRTL ? 'لا تحول او تدفع اي اموال قبل الفحص والمعاينة في مكان عام' : 'Do not transfer or pay any money before inspection in a public place.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;