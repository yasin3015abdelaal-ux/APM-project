import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Phone, MessageCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { userAPI } from '../../api';
import PlaceholderSVG from '../../assets/PlaceholderSVG';
import Loader from '../../components/Ui/Loader/Loader';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (id) {
            fetchProductDetails();
        }
    }, [id]);

    const fetchProductDetails = async () => {
        if (!id) {
            console.error('Product ID is missing');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching product with ID:', id);
            const response = await userAPI.get(`/products/${id}`);
            console.log('Product response:', response.data);
            const data = response.data;
            
            let productData = null;
            if (data.data) {
                productData = data.data;
            } else if (data.product) {
                productData = data.product;
            } else {
                productData = data;
            }
            
            console.log('Product data:', productData);
            setProduct(productData);
            
            if (productData.is_favorited !== undefined) {
                setIsFavorite(productData.is_favorited);
            } else {
                await checkIfFavorite();
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            showToast(t('common.error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkIfFavorite = async () => {
        if (!id) return;
        
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
            console.error('Error checking favorite status:', error);
        }
    };

    const toggleFavorite = async () => {
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

    if (loading) {
        return <Loader />;
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600">
                    {isRTL ? 'المنتج غير موجود' : 'Product not found'}
                </div>
            </div>
        );
    }

    const images = product.images || (product.image ? [product.image] : []);

    return (
        <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
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

            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-main hover:text-green-800 cursor-pointer"
                    >
                        {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                        <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-medium`}>
                            {isRTL ? 'رجوع' : 'Back'}
                        </span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleFavorite}
                            className={`p-2 rounded-full transition cursor-pointer ${
                                isFavorite 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            <Heart
                                size={24}
                                className={isFavorite ? 'fill-white text-white' : 'text-gray-400'}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="relative aspect-square max-w-sm mx-auto">
                            {images.length > 0 && images[selectedImage] ? (
                                <img
                                    src={images[selectedImage]}
                                    alt={isRTL ? product.name_ar : product.name_en}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className={`${images.length > 0 && images[selectedImage] ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
                                style={{ display: (images.length > 0 && images[selectedImage]) ? 'none' : 'flex' }}
                            >
                                <PlaceholderSVG />
                            </div>
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto p-3 justify-center bg-gray-50">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                                            selectedImage === index
                                                ? 'border-main'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={`${isRTL ? 'صورة' : 'Image'} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.style.display = 'block';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className={`${image ? 'hidden' : 'block'} w-full h-full`}
                                            style={{ display: image ? 'none' : 'block' }}
                                        >
                                            <PlaceholderSVG />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {isRTL ? product.name_ar : product.name_en}
                            </h1>
                            
                            <div className="text-3xl font-bold text-main whitespace-nowrap">
                                {product.price} <span className="text-lg">{product.country?.currency || t('ads.concurrency')}</span>
                            </div>
                        </div>

                        {product.governorate && (
                            <div className="flex items-center text-main">
                                <MapPin size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                                <span className="font-medium text-base">
                                    {isRTL ? product.governorate.name_ar : product.governorate.name_en}
                                </span>
                            </div>
                        )}
                    </div>

                    {(product.description_ar || product.description_en || product.description) && (
                        <div className="bg-white rounded-xl shadow-sm p-5">
                            <h2 className="text-xl font-bold text-gray-800 mb-3">
                                {t('ads.description')}
                            </h2>
                            <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                                {isRTL 
                                    ? (product.description_ar || product.description) 
                                    : (product.description_en || product.description)}
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            {isRTL ? 'تفاصيل المنتج' : 'Product Details'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.category && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{isRTL ? 'الفئة' : 'Category'}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {isRTL ? product.category.name_ar : product.category.name_en}
                                    </span>
                                </div>
                            )}
                            {product.sub_category && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{isRTL ? 'الفئة الفرعية' : 'Sub Category'}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {isRTL ? product.sub_category.name_ar : product.sub_category.name_en}
                                    </span>
                                </div>
                            )}
                            {product.gender && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{t('ads.gender')}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.gender === 'male' ? t('ads.male') : t('ads.female')}
                                    </span>
                                </div>
                            )}
                            {product.age && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{t('ads.age')}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.age} {isRTL ? 'شهر' : 'months'}
                                    </span>
                                </div>
                            )}
                            {product.type && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{t('ads.type')}</span>
                                    <span className="font-bold text-gray-800 text-lg">{product.type}</span>
                                </div>
                            )}
                            {product.quantity && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{t('ads.quantity')}</span>
                                    <span className="font-bold text-gray-800 text-lg">{product.quantity}</span>
                                </div>
                            )}
                            {product.needs_vaccinations !== undefined && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{isRTL ? 'التطعيمات' : 'Vaccinations'}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.needs_vaccinations ? (isRTL ? 'مطعم' : 'Vaccinated') : (isRTL ? 'غير مطعم' : 'Not Vaccinated')}
                                    </span>
                                </div>
                            )}
                            {product.delivery_available !== undefined && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{isRTL ? 'التوصيل' : 'Delivery'}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.delivery_available ? (isRTL ? 'متاح' : 'Available') : (isRTL ? 'غير متاح' : 'Not Available')}
                                    </span>
                                </div>
                            )}
                            {product.retail_sale_available !== undefined && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{isRTL ? 'البيع بالقطعة' : 'Retail Sale'}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.retail_sale_available ? (isRTL ? 'متاح' : 'Available') : (isRTL ? 'غير متاح' : 'Not Available')}
                                    </span>
                                </div>
                            )}
                            {product.price_negotiable !== undefined && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{t('ads.priceNegotiable')}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.price_negotiable ? t('ads.yes') : t('ads.no')}
                                    </span>
                                </div>
                            )}
                            {product.contact_method && (
                                <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 mb-1">{t('ads.contactMethod')}</span>
                                    <span className="font-bold text-gray-800 text-lg">
                                        {product.contact_method === 'phone' ? t('ads.call') : 
                                            product.contact_method === 'chat' ? t('ads.chat') : 
                                            t('ads.both')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start gap-4">
                        <AlertTriangle size={28} className="text-yellow-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-yellow-800 mb-2 text-lg">
                                {isRTL ? 'تحذير هام' : 'Important Warning'}
                            </h3>
                            <p className="text-yellow-700 leading-relaxed">
                                {isRTL 
                                    ? 'لا تحول او تدفع اي اموال لاحد قبل لفحص و المعاينة و احرص علي ان تكون المعاينة و الاستلام في مكان عام'
                                    : 'Do not transfer or pay any money to anyone before inspection and examination, and ensure that the inspection and receipt take place in a public place.'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductDetails;