import { useRef, useEffect, useState } from "react";
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCachedProducts, userAPI } from "../../../api";
import PlaceholderSVG from "../../../assets/PlaceholderSVG";

const AdsCarouselSkeleton = ({ isRTL }) => (
  <div className="mx-auto p-2 select-none" dir={isRTL ? "rtl" : "ltr"}>
    <div className="mb-3">
      <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
        style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
    </div>

    <div className="py-3">
      <div className="flex gap-4 overflow-hidden px-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="relative lg:w-1/4 xl:w-1/5 min-w-[180px] border border-gray-200 rounded-2xl shadow-sm bg-white shrink-0"
          >
            <div className="h-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-t-2xl animate-pulse"
              style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>

            <div className="p-2.5">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-2"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '80%' }}></div>

              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-2"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '60%' }}></div>

              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-2"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '40%' }}></div>

              <div className="flex items-center justify-between mt-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                  style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '70px' }}></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"
                  style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '90px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

function AdsCarousel() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, fromCache } = await getCachedProducts();
        console.log(fromCache ? '📦 Products من الكاش' : '🌐 Products من API');

        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(t('common.error') || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [t]);

  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current && !isDragging.current) {
        const container = scrollRef.current;
        const cardWidth = 220; 
        const gap = 16;
        const scrollAmount = cardWidth + gap; 

        if (dir === "rtl") {
          const currentScroll = Math.abs(container.scrollLeft);
          const maxScroll = container.scrollWidth - container.clientWidth;

          if (currentScroll >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
          }
        } else {
          const atEnd =
            container.scrollLeft + container.clientWidth >=
            container.scrollWidth - 10;

          if (atEnd) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
          }
        }
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [dir, products]);

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

  const toggleFavorite = async (productId, e) => {
    e.stopPropagation();

    try {
      const product = products.find(p => p.id === productId);

      if (product.is_favorited) {
        await userAPI.delete(`/favorites/${productId}`);
      } else {
        await userAPI.post(`/favorites/${productId}`);
      }

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, is_favorited: !p.is_favorited } : p
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const navigateToProduct = (productId) => {
    navigate(`/product-details/${productId}`);
  };

  const navigateToAllProducts = () => {
    navigate('/products');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return isRTL ? 'منذ دقائق' : 'Few minutes ago';
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return isRTL ? 'أمس' : 'Yesterday';
    } else if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return <AdsCarouselSkeleton isRTL={isRTL} />;
  }

  if (error) {
    return (
      <div dir={dir} className="w-full py-6 select-none">
        <h2 className="text-2xl font-bold text-main px-4">
          {t("home.adsSection.adsTitle")}
        </h2>
        <div className="text-center py-10 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div dir={dir} className="w-full py-6 select-none">
        <h2 className="text-2xl font-bold text-main px-4">
          {t("home.adsSection.adsTitle")}
        </h2>
        <div className="text-center py-10 text-gray-500">
          {isRTL ? "لا توجد منتجات متاحة حالياً" : "No products available"}
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="mx-auto p-2 select-none">
      <div className="flex items-center justify-between mb-3 px-2">
        <h2 className="text-2xl font-bold text-main">
          {t("home.adsSection.adsTitle")}
        </h2>
        <button
          onClick={navigateToAllProducts}
          className="text-main hover:text-main/80 cursor-pointer font-medium text-xs sm:text-sm flex items-center gap-1 transition-colors"
        >
          {isRTL ? "عرض المزيد" : "View More"}
          <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="py-3">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto py-2 scroll-smooth px-4 snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
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
          {products.map((product) => {
            const imageUrl = product.image || product.images?.[0];

            return (
              <div
                draggable={false}
                key={product.id}
                className="relative lg:w-1/4 xl:w-1/5 min-w-[180px] snap-start border border-gray-200 rounded-2xl shadow-sm bg-white shrink-0 hover:shadow-md transition-transform hover:scale-[1.02] select-none cursor-pointer"
                onClick={() => navigateToProduct(product.id)}
              >
                <button
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} cursor-pointer rounded-full p-1.5 shadow-sm hover:scale-110 transition-all z-10 ${product.is_favorited
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <Heart
                    size={18}
                    className={product.is_favorited ? 'fill-white text-white' : 'text-gray-400'}
                  />
                </button>

                <div className="flex justify-center border-b border-main h-40 bg-gray-100 rounded-t-2xl overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={isRTL ? product.name_ar : product.name_en}
                      className="w-full h-full object-cover rounded-t-2xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`${imageUrl ? 'hidden' : 'flex'} w-full h-full object-contain items-center justify-center`}
                    style={{ display: imageUrl ? 'none' : 'flex' }}
                  >
                    <PlaceholderSVG />
                  </div>
                </div>

                <div className="p-2.5 text-right">
                  <h3 className="font-bold text-sm mb-1 truncate">
                    {isRTL ? product.name_ar : product.name_en}
                  </h3>

                  <div className="flex items-center text-xs mb-1">
                    <HiOutlineLocationMarker size={16} className={`${isRTL ? 'ml-1' : 'mr-1'} text-main`} />
                    <span className="truncate">
                      {product.governorate
                        ? (isRTL ? product.governorate.name_ar : product.governorate.name_en)
                        : (isRTL ? 'غير محدد' : 'Not specified')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {formatDate(product.created_at)}
                  </p>

                  <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{product.watchers_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={14} className="text-red-500" />
                      <span>{product.interested_count || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="font-bold text-sm text-main">
                      {product.price} {isRTL ? "جنيه" : "EGP"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToProduct(product.id);
                      }}
                      className="bg-main cursor-pointer text-white text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition"
                    >
                      {isRTL ? "تفاصيل المنتج" : "Product Details"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdsCarousel;