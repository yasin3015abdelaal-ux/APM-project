import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";

const SearchPage = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
      setSelectedIndex(-1);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchSearchResults = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await userAPI.get('/get_products', {
        params: { search: trimmedQuery }
      });
      
      const products = response.data?.data || response.data || [];
      setSearchResults(products);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      setSearchResults([]);
      setHasSearched(false);
      setSelectedIndex(-1);
      return;
    }

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setHasSearched(true);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSearchResults]);

  const handleKeyDown = (e) => {
    if (!hasSearched || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleProductClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const gridItems = resultsRef.current.querySelectorAll('.product-card');
      const selectedElement = gridItems[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  const handleProductClick = (product) => {
    onClose();
    navigate(`/product-details/${product.id}`);
  };

  const getProductName = (product) => {
    if (i18n.language === "ar") {
      return product.name_ar || product.name || product.title || "بدون اسم";
    }
    return product.name_en || product.name || product.title || "No name";
  };

  const getProductDescription = (product) => {
    if (i18n.language === "ar") {
      return product.description_ar || product.description;
    }
    return product.description_en || product.description;
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    try {
      const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() 
          ? <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
          : part
      );
    } catch {
      return text;
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-white z-50 transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : '-translate-y-full'
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 border-b-2 border-main bg-green-50">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-main text-2xl">close</span>
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("search")}
                className={`w-full px-4 py-2.5 md:py-3 ${
                  i18n.language === "ar" ? "pr-12" : "pl-4 pr-12"
                } border-2 border-main rounded-lg outline-none focus:ring-2 focus:ring-green-400 text-base md:text-lg text-main`}
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                autoFocus
              />
              <button 
                className={`absolute top-1/2 -translate-y-1/2 ${
                  i18n.language === "ar" ? "left-3" : "right-3"
                } p-1 hover:scale-110 transition`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-main border-t-transparent"></div>
                ) : (
                  <i className="fa-solid fa-magnifying-glass text-main text-xl md:text-2xl"></i>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
            /* Minimum Characters Message */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-keyboard text-4xl text-blue-500"></i>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                {i18n.language === "ar" 
                  ? "استمر في الكتابة..."
                  : "Keep typing..."}
              </h3>
              <p className="text-base text-gray-600">
                {i18n.language === "ar"
                  ? "يرجى إدخال حرفين على الأقل للبحث"
                  : "Please enter at least 2 characters to search"}
              </p>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-main border-t-transparent mb-4"></div>
              <div className="text-base md:text-lg text-gray-600">
                {i18n.language === "ar" ? "جاري البحث..." : "Searching..."}
              </div>
            </div>
          ) : hasSearched && searchQuery.trim().length >= 2 ? (
            <div className="space-y-3">
              <div className="text-base md:text-lg font-semibold text-main mb-4">
                {i18n.language === "ar" 
                  ? `نتائج البحث عن: "${searchQuery}" (${searchResults.length})`
                  : `Search results for: "${searchQuery}" (${searchResults.length})`}
              </div>
              
              {searchResults.length > 0 ? (
                <div ref={resultsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product, index) => (
                    <div 
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`product-card border-2 rounded-lg hover:border-main transition cursor-pointer overflow-hidden group ${
                        index === selectedIndex ? 'border-main ring-2 ring-green-200' : 'border-gray-200'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={getProductName(product)}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full flex items-center justify-center bg-gray-200"
                          style={{ display: product.image ? 'none' : 'flex' }}
                        >
                          <i className="fa-solid fa-image text-4xl text-gray-400"></i>
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="p-3 md:p-4">
                        <div className="text-sm md:text-base font-semibold text-gray-800 mb-2 line-clamp-2">
                          {highlightMatch(getProductName(product), searchQuery)}
                        </div>
                        
                        {getProductDescription(product) && (
                          <div className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
                            {getProductDescription(product)}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          {product.price && (
                            <div className="text-main font-bold text-base md:text-lg">
                              {parseFloat(product.price).toLocaleString()} 
                              <span className="text-sm"> {i18n.language === "ar" ? "ج.م" : "EGP"}</span>
                            </div>
                          )}
                          
                          {product.category && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {product.category}
                            </div>
                          )}
                        </div>
                        
                        {product.governorate && (
                          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <i className="fa-solid fa-location-dot text-main"></i>
                            {product.governorate}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* No Results UI */
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-magnifying-glass text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                    {i18n.language === "ar" 
                      ? "لم نجد أي نتائج"
                      : "No results found"}
                  </h3>
                  <p className="text-base text-gray-600 mb-4 text-center px-4">
                    {i18n.language === "ar"
                      ? `لم نتمكن من العثور على منتجات تطابق "${searchQuery}"`
                      : `We couldn't find any products matching "${searchQuery}"`}
                  </p>
                  <div className="text-sm text-gray-500">
                    {i18n.language === "ar" ? (
                      <ul className="space-y-1">
                        <li>• تحقق من الإملاء</li>
                        <li>• جرب كلمات مفتاحية مختلفة</li>
                        <li>• استخدم مصطلحات أكثر عمومية</li>
                      </ul>
                    ) : (
                      <ul className="space-y-1">
                        <li>• Check your spelling</li>
                        <li>• Try different keywords</li>
                        <li>• Use more general terms</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Initial State */
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-5xl md:text-6xl mb-4 text-main opacity-30"></i>
              <div className="text-base md:text-lg text-center px-4">
                {i18n.language === "ar" 
                  ? "ابدأ البحث عن المنتجات..."
                  : "Start searching for products..."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;