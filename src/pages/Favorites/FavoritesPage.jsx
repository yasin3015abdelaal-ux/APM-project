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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg mb-4">{error}</p>
                    <button
                        onClick={fetchFavorites}
                        className="bg-main hover:bg-green-800 cursor-pointer text-white px-6 py-2 rounded-lg transition"
                    >
                        {t('common.retry')}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;