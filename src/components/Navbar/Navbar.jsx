import { useTranslation } from "react-i18next";
import logo from "../../assets/images/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileHover from "./ProfileHover";
import { useState, useEffect, useCallback, useRef } from "react";
import { countriesFlags } from "../../data/flags";
import { HeartIcon, MessageCircleIcon, ShoppingCart } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useChat } from "../../contexts/ChatContext";
import { useNotification } from "../../contexts/NotificationContext";
import { userAPI } from "../../api";

const Navbar = ({
  onMenuClick,
  onSearchClick,
  showProfileHover,
  setShowProfileHover,
  isSidebarOpen,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount: chatUnreadCount } = useChat();
  const { unreadCount: notificationUnreadCount } = useNotification();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const userCountryId = user?.country?.id;
  const userCountry = countriesFlags.find((c) => c.id === userCountryId);
  const flagImage = userCountry?.flag || "";

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
  };

  const fetchSuggestions = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await userAPI.get('/get_products', {
        params: { search: trimmedQuery }
      });
      
      const products = response.data?.data || response.data || [];
      setSuggestions(products);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
      setShowSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleProductClick(suggestions[selectedIndex].id);
        } else if (suggestions.length > 0) {
          handleProductClick(suggestions[0].id);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current && suggestions.length > 0) {
      const items = suggestionsRef.current.querySelectorAll('[data-suggestion-item]');
      const selectedElement = items[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex, suggestions.length]);

  const handleProductClick = (productId) => {
    setShowSuggestions(false);
    setSearchQuery("");
    setSelectedIndex(-1);
    navigate(`/product-details/${productId}`);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleProductClick(suggestions[selectedIndex].id);
    } else if (searchQuery.trim() && suggestions.length > 0) {
      handleProductClick(suggestions[0].id);
    }
  };

  const handleMessagesClick = () => {
    navigate("/chats");
  };

  const handleFavClick = () => {
    navigate("/favorites");
  };

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  const handleCartClick = () => {
    navigate("/cart");
  };

  const NotificationBadge = ({ count }) => {
    if (!count || count === 0) return null;

    return (
      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
        {count > 9 ? "9+" : count}
      </span>
    );
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2 md:py-2.5 border-2 border-main rounded-lg bg-white">
      <div className="w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
          <div className="flex-shrink-0">
            <img
              src={logo}
              alt="logo"
              className="w-15 h-15 cursor-pointer object-cover"
              onClick={() => navigate("/")}
            />
          </div>

          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-md mx-4 relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={t("search")}
              className={`w-full px-3 py-2 ${i18n.language === "ar" ? "pr-10" : "pl-3 pr-10"
                } border-2 border-main rounded-lg outline-none focus:ring-2 focus:ring-green-400 text-sm`}
              dir={i18n.language === "ar" ? "rtl" : "ltr"}
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="search-suggestions"
              role="combobox"
            />
            <button
              type="submit"
              className={`absolute cursor-pointer top-1/2 -translate-y-1/2 ${i18n.language === "ar" ? "left-2" : "right-2"
                } p-1 hover:bg-gray-100 rounded transition`}
              aria-label={t("search")}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-main border-t-transparent"></div>
              ) : (
                <i className="fa-solid fa-magnifying-glass text-main text-base"></i>
              )}
            </button>

            {showSuggestions && (
              <div 
                ref={suggestionsRef}
                id="search-suggestions"
                role="listbox"
                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-[70vh] overflow-y-auto z-[100]"
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                style={{
                  animation: 'slideDown 0.2s ease-out'
                }}
              >
                {searchQuery.trim().length < 2 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <i className="fa-solid fa-keyboard text-3xl text-blue-500"></i>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                      {i18n.language === "ar" 
                        ? "استمر في الكتابة..."
                        : "Keep typing..."}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {i18n.language === "ar"
                        ? "يرجى إدخال حرفين على الأقل للبحث"
                        : "Please enter at least 2 characters to search"}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-main border-t-transparent mb-4"></div>
                    <p className="text-sm text-gray-600">
                      {i18n.language === "ar"
                        ? "جاري البحث..."
                        : "Searching..."}
                    </p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs text-gray-600 border-b border-gray-200 z-10">
                      {i18n.language === "ar" 
                        ? `${suggestions.length} نتيجة`
                        : `${suggestions.length} result${suggestions.length !== 1 ? 's' : ''}`}
                    </div>

                    {suggestions.map((product, index) => (
                      <div
                        key={product.id}
                        data-suggestion-item
                        onClick={() => handleProductClick(product.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        role="option"
                        aria-selected={index === selectedIndex}
                        className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-green-50 cursor-pointer transition-colors flex items-center gap-3 ${
                          index === selectedIndex ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={getProductName(product)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-200';
                                placeholder.innerHTML = '<i class="fa-solid fa-image text-lg text-gray-400"></i>';
                                e.target.parentElement.appendChild(placeholder);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <i className="fa-solid fa-image text-lg text-gray-400"></i>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">
                            {highlightMatch(getProductName(product), searchQuery)}
                          </div>
                          
                          {getProductDescription(product) && (
                            <div className="text-xs text-gray-600 mb-1 line-clamp-1">
                              {getProductDescription(product)}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {product.price && (
                              <span className="text-main font-bold text-sm">
                                {parseFloat(product.price).toLocaleString()} 
                                <span className="text-xs"> {i18n.language === "ar" ? "ج.م" : "EGP"}</span>
                              </span>
                            )}
                            
                            {product.governorate && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <i className="fa-solid fa-location-dot text-main text-xs"></i>
                                {product.governorate}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <i className={`fa-solid ${
                            i18n.language === "ar" ? "fa-chevron-left" : "fa-chevron-right"
                          } text-gray-400 text-sm`}></i>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <i className="fa-solid fa-magnifying-glass text-3xl text-gray-400"></i>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                      {i18n.language === "ar" 
                        ? "لم نجد أي نتائج"
                        : "No results found"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {i18n.language === "ar"
                        ? `لم نتمكن من العثور على منتجات تطابق "${searchQuery}"`
                        : `We couldn't find any products matching "${searchQuery}"`}
                    </p>
                    <div className="text-xs text-gray-500">
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
            )}
          </form>

          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate("/auction")}
                className="px-3 py-1 border-2 cursor-pointer border-main rounded-lg text-main hover:bg-green-50 transition whitespace-nowrap text-sm"
              >
                {t("auctions")}
              </button>
              <button
                onClick={() => navigate("/ads")}
                className="px-3 py-1 border-2 border-main bg-main text-white cursor-pointer rounded-lg hover:bg-green-700 hover:border-green-700 transition whitespace-nowrap text-sm"
              >
                {t("shareAdv")}
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            <button
              onClick={onSearchClick}
              className="lg:hidden p-1.5 sm:p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition flex-shrink-0"
              aria-label="Search"
            >
              <i className="fa-solid fa-magnifying-glass text-main text-base sm:text-lg"></i>
            </button>

            {isAuthenticated && (
              <button
                onClick={handleCartClick}
                className={`relative p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${location.pathname === "/cart"
                    ? "bg-green-100"
                    : "hover:bg-gray-100"
                  }`}
                aria-label="Cart"
              >
                <ShoppingCart className="text-main w-5 h-5 sm:w-6 sm:h-6" />
                <NotificationBadge count={cartCount} />
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={handleFavClick}
                className={`relative p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${location.pathname === "/favorites"
                    ? "bg-green-100"
                    : "hover:bg-gray-100"
                  }`}
                aria-label="Favorites"
              >
                <HeartIcon className="text-main w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={handleMessagesClick}
                className={`relative p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${location.pathname === "/chats"
                    ? "bg-green-100"
                    : "hover:bg-gray-100"
                  }`}
                aria-label="Messages"
              >
                <MessageCircleIcon className="text-main w-5 h-5 sm:w-6 sm:h-6" />
                <NotificationBadge count={chatUnreadCount} />
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={handleNotificationsClick}
                className={`relative p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${location.pathname === "/notifications"
                    ? "bg-green-100"
                    : "hover:bg-gray-100"
                  }`}
                aria-label="Notifications"
              >
                <svg
                  className="w-5 h-6 sm:w-6 sm:h-7 text-main"
                  viewBox="0 0 43 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z"
                    fill="currentColor"
                  />
                </svg>
                <NotificationBadge count={notificationUnreadCount} />
              </button>
            )}

            <button
              onClick={toggleLanguage}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-main text-white cursor-pointer rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-sm flex-shrink-0"
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </button>

              <div
                className="hidden lg:block relative flex-shrink-0"
                onMouseEnter={() => setShowProfileHover(true)}
                onMouseLeave={() => setShowProfileHover(false)}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-300 border-2 border-main rounded-full relative cursor-pointer overflow-hidden">
                  {user?.image ? (
                    <img
                      src={user.image}
                      className="w-full h-full object-cover rounded-full"
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {flagImage && (
                  <img
                    src={flagImage}
                    className="absolute w-4 h-4 md:w-5 md:h-5 border rounded-full top-[60%] left-[60%]"
                    alt="Flag"
                  />
                )}
                <div className="absolute h-4 w-full bg-transparent top-full left-0"></div>
                {showProfileHover && <ProfileHover />}
              </div>
          </div>

          <button
            onClick={onMenuClick}
            className="lg:hidden group relative w-7 h-6 flex flex-col justify-between cursor-pointer p-1"
            aria-label="Menu"
          >
            <span
              className={`block h-[3px] bg-main rounded-full transition-all duration-300 ${isSidebarOpen ? "opacity-0" : "w-full group-hover:w-full"
                }`}
            />
            <span
              className={`block h-[3px] bg-main rounded-full transition-all duration-300 origin-center ${isSidebarOpen
                  ? "rotate-45 w-full"
                  : "w-4/5 group-hover:w-full"
                }`}
            />
            <span
              className={`block h-[3px] bg-main rounded-full transition-all duration-300 origin-center ${isSidebarOpen
                  ? "-rotate-45 -translate-y-[6.5px] w-full"
                  : "w-1/2 group-hover:w-full"
                }`}
            />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Navbar;