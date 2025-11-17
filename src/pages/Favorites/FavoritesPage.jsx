import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Trash2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import PlaceholderSVG from '../../assets/PlaceholderSVG';



const FavoritesPage = () => {
    const navigate = useNavigate();
    const [isRTL, setIsRTL] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userAPI.get('/favorites');
            console.log('Favorites response:', response.data);
            
            let favoritesArray = [];
            if (Array.isArray(response.data)) {
                favoritesArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                favoritesArray = response.data.data;
            } else if (response.data.favorites && Array.isArray(response.data.favorites)) {
                favoritesArray = response.data.favorites;
            }
            
            setFavorites(favoritesArray);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setError(isRTL ? 'حدث خطأ في تحميل المفضلات' : 'Error loading favorites');
            showToast(isRTL ? 'حدث خطأ في تحميل المفضلات' : 'Error loading favorites', 'error');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (productId) => {
        try {
            await userAPI.delete(`/favorites/${productId}`);
            
            setFavorites(prev => prev.filter(item => {
                const id = item.product?.id || item.id;
                return id !== productId;
            }));
            
            showToast(isRTL ? 'تم إزالة المنتج من المفضلة بنجاح' : 'Product removed from favorites successfully');
        } catch (error) {
            console.error('Error removing favorite:', error);
            showToast(isRTL ? 'حدث خطأ في إزالة المنتج' : 'Error removing product', 'error');
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product-details/${productId}`);
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg mb-4">{error}</p>
                    <button
                        onClick={fetchFavorites}
                        className="bg-main hover:bg-green-800 cursor-pointer text-white px-6 py-2 rounded-lg transition"
                    >
                        {isRTL ? 'إعادة المحاولة' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

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
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-main mb-2">
                        {isRTL ? 'الإعلانات المفضلة' : 'Favorite Ads'}
                    </h1>
                    <p className="text-gray-600">
                        {isRTL 
                            ? `لديك ${favorites.length} منتج في المفضلة` 
                            : `You have ${favorites.length} products in favorites`}
                    </p>
                </div>

                {/* Empty State */}
                {favorites.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-6">
                            <Heart size={80} className="mx-auto" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-600 mb-3">
                            {isRTL ? 'لا توجد منتجات مفضلة' : 'No favorite products'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {isRTL 
                                ? 'ابدأ بإضافة منتجات إلى المفضلة لتظهر هنا' 
                                : 'Start adding products to favorites to see them here'}
                        </p>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-main hover:bg-green-800 cursor-pointer text-white px-6 py-3 rounded-lg font-medium transition inline-flex items-center gap-2"
                        >
                            <ShoppingCart size={20} />
                            <span>{isRTL ? 'تصفح المنتجات' : 'Browse Products'}</span>
                        </button>
                    </div>
                ) : (
                    /* Products Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map((favorite) => {
                            const product = favorite.product || favorite;
                            const productId = product.id;
                            const imageUrl = product.image || product.images?.[0];
                            
                            return (
                                <div
                                    key={productId}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100 group"
                                >
                                    {/* Image Container */}
                                    <div
                                        className="relative h-56 bg-gray-100 cursor-pointer"
                                        onClick={() => handleProductClick(productId)}
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

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(isRTL ? 'هل تريد إزالة هذا المنتج من المفضلة؟' : 'Remove this product from favorites?')) {
                                                    removeFavorite(productId);
                                                }
                                            }}
                                            className="absolute top-3 left-3 cursor-pointer bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-all z-10 group/btn"
                                        >
                                            <Trash2
                                                size={20}
                                                className="text-red-500 group-hover/btn:scale-110 transition-transform"
                                            />
                                        </button>

                                        {/* Favorite Badge */}
                                        <div className="absolute top-3 right-3 cursor-pointer bg-red-500 text-white rounded-full p-2 shadow-md">
                                            <Heart size={20} className="fill-white" />
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        {/* Product Name */}
                                        <h3
                                            className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-main transition line-clamp-2 min-h-[3.5rem]"
                                            onClick={() => handleProductClick(productId)}
                                        >
                                            {isRTL ? product.name_ar : product.name_en}
                                        </h3>

                                        {/* Location */}
                                        {product.governorate && (
                                            <div className="flex items-center text-sm text-main mb-3">
                                                <MapPin size={16} className={isRTL ? 'ml-1' : 'mr-1'} />
                                                <span className="font-medium">
                                                    {isRTL ? product.governorate.name_ar : product.governorate.name_en}
                                                </span>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {(product.description || product.description_ar || product.description_en) && (
                                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                {isRTL 
                                                    ? (product.description_ar || product.description) 
                                                    : (product.description_en || product.description)}
                                            </p>
                                        )}

                                        {/* Price and Button */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="text-2xl font-bold text-main">
                                                {product.price} <span className="text-sm">{isRTL ? 'جنيه' : 'EGP'}</span>
                                            </div>
                                            <button
                                                onClick={() => handleProductClick(productId)}
                                                className="bg-main hover:bg-green-800 cursor-pointer text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                                            >
                                                {isRTL ? 'عرض التفاصيل' : 'View Details'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;