import { useState, useEffect } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import ProductCard from '../../components/ProductCard/ProductCard';

const FavoritesPage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    
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
            setError(t('common.error'));
            showToast(t('common.error'), 'error');
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
            showToast(t('common.error'), 'error');
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product-details/${productId}`);
    };

    const handleToggleFavorite = (productId) => {
        removeFavorite(productId);
    };

    const handleContactSeller = (productId) => {
        console.log('Contact seller for product:', productId);
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {isRTL ? 'حدث خطأ' : 'Error Occurred'}
                    </h3>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                        onClick={fetchFavorites}
                        className="bg-main hover:bg-green-800 cursor-pointer text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50" dir={isRTL ? 'rtl' : 'ltr'}>
            {toast && (
                <div className={`fixed top-4 sm:top-6 ${isRTL ? "left-4 sm:left-6" : "right-4 sm:right-6"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm ${toast.type === "success" ? "bg-gradient-to-r from-green-600 to-green-700 text-white" : "bg-gradient-to-r from-red-500 to-red-600 text-white"}`}>
                        {toast.type === "success" ? (
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}
            
            <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
                {/* Header Section */}
<div className="mb-10">
                    <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-main to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                                <Heart className="text-white" size={20} fill="white" />
                            </div>
                            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-main to-green-700 bg-clip-text text-transparent">
                                {isRTL ? 'الإعلانات المفضلة' : 'Favorite Ads'}
                            </h1>
                        </div>
                        <span className="text-xs sm:text-sm text-main font-semibold bg-main/10 px-2 py-1 sm:px-3 rounded-lg whitespace-nowrap">
                            {favorites.length} {isRTL ? "منتج" : "products"}
                        </span>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-16 text-center border border-gray-100">
                        <div className="max-w-md mx-auto">
                            <div className="relative mb-8">
                                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                                    <Heart size={64} className="text-gray-300" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                                {isRTL ? 'لا توجد منتجات مفضلة' : 'No favorite products'}
                            </h3>
                            <p className="text-gray-500 text-base sm:text-lg mb-8 leading-relaxed">
                                {isRTL 
                                    ? 'ابدأ بإضافة منتجات إلى المفضلة لتظهر هنا وتتمكن من الوصول إليها بسهولة' 
                                    : 'Start adding products to favorites to see them here and access them easily'}
                            </p>
                            <button
                                onClick={() => navigate('/products')}
                                className="bg-gradient-to-r from-main to-green-700 hover:from-green-700 hover:to-green-800 cursor-pointer text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <ShoppingCart size={22} />
                                <span className="text-lg">{isRTL ? 'تصفح المنتجات' : 'Browse Products'}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                            {favorites.map((favorite) => {
                                const product = favorite.product || favorite;
                                
                                const productData = {
                                    ...product,
                                    id: product.id,
                                    name_ar: product.name_ar,
                                    name_en: product.name_en,
                                    price: product.price,
                                    image: product.image || product.images?.[0],
                                    governorate: product.governorate,
                                    created_at: product.created_at,
                                    user_id: product.user_id || product.seller_id
                                };

                                return (
                                    <ProductCard
                                        key={product.id}
                                        product={productData}
                                        isFavorite={true}
                                        onToggleFavorite={handleToggleFavorite}
                                        onProductClick={handleProductClick}
                                        onContactSeller={handleContactSeller}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;