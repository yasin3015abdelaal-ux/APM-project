import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";

const SearchPage = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset search when closing
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-search when user types (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await userAPI.get('/get_products', {
        params: { search: searchQuery.trim() }
      });
      
      const products = response.data?.data || response.data || [];
      setSearchResults(products);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product) => {
    console.log("Product clicked:", product);
    // Navigate to product details or perform other actions
    onClose(); // Close search page
    // navigate(`/products/${product.id}`);
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
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className={`w-full px-4 py-2.5 md:py-3 ${
                  i18n.language === "ar" ? "pr-12" : "pl-4 pr-12"
                } border-2 border-main rounded-lg outline-none focus:ring-2 focus:ring-green-400 text-base md:text-lg text-main`}
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                autoFocus
              />
              <button 
                onClick={handleSearch}
                className={`absolute top-1/2 -translate-y-1/2 ${
                  i18n.language === "ar" ? "left-3" : "right-3"
                } p-1 hover:scale-110 transition`}
              >
                <i className="fa-solid fa-magnifying-glass text-main text-xl md:text-2xl"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mb-4"></div>
              <div className="text-base text-gray-600">
                {i18n.language === "ar" ? "جاري البحث..." : "Searching..."}
              </div>
            </div>
          ) : hasSearched && searchQuery ? (
            <div className="space-y-3">
              <div className="text-base md:text-lg font-semibold text-main mb-4">
                {i18n.language === "ar" 
                  ? `نتائج البحث عن: "${searchQuery}" (${searchResults.length})`
                  : `Search results for: "${searchQuery}" (${searchResults.length})`}
              </div>
              
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product) => (
                    <div 
                      key={product.id} 
                      onClick={() => handleProductClick(product)}
                      className="border-2 border-gray-200 rounded-lg hover:border-main transition cursor-pointer overflow-hidden group"
                    >
                      {/* Product Image */}
                      {product.image && (
                        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}
                      
                      {/* Product Details */}
                      <div className="p-3 md:p-4">
                        <div className="text-sm md:text-base font-semibold text-gray-800 mb-2 line-clamp-2">
                          {product.name || product.title}
                        </div>
                        
                        {product.description && (
                          <div className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          {product.price && (
                            <div className="text-main font-bold text-base md:text-lg">
                              {product.price} {i18n.language === "ar" ? "ج.م" : "EGP"}
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
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="fa-solid fa-box-open text-5xl text-gray-300 mb-4"></i>
                  <div className="text-base md:text-lg text-gray-600 text-center">
                    {i18n.language === "ar" 
                      ? "لا توجد نتائج للبحث"
                      : "No results found"}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {i18n.language === "ar"
                      ? "حاول استخدام كلمات بحث مختلفة"
                      : "Try using different search terms"}
                  </div>
                </div>
              )}
            </div>
          ) : (
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