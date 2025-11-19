import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const SearchPage = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log("Opened")
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
                className={`w-full px-4 py-2.5 md:py-3 ${i18n.language === "ar" ? "pr-12" : "pl-4 pr-12"} border-2 border-main rounded-lg outline-none focus:ring-2 focus:ring-green-400 text-base md:text-lg text-main`}
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                autoFocus
              />
              <button className={`absolute top-1/2 -translate-y-1/2 ${i18n.language === "ar" ? "left-3" : "right-3"} p-1`}>
                <i className="fa-solid fa-magnifying-glass text-main text-xl md:text-2xl"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {searchQuery ? (
            <div className="space-y-3">
              <div className="text-base md:text-lg font-semibold text-main mb-4">
                {i18n.language === "ar" ? "نتائج البحث عن:" : "Search results for:"} "{searchQuery}"
              </div>
              {/* Example results */}
              {[1, 2, 3, 4, 5].map((item) => (
                <div 
                  key={item} 
                  className="p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:border-main transition cursor-pointer"
                >
                  <div className="text-sm md:text-base font-medium text-gray-800 mb-1">
                    {i18n.language === "ar" ? `نتيجة البحث ${item}` : `Search Result ${item}`}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {i18n.language === "ar" 
                      ? "وصف تفصيلي للنتيجة يظهر هنا مع معلومات إضافية..."
                      : "Detailed description of the result appears here with additional information..."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-5xl md:text-6xl mb-4 text-main opacity-30"></i>
              <div className="text-base md:text-lg text-center px-4">
                {i18n.language === "ar" ? "ابدأ البحث عن ما تريد..." : "Start searching for what you want..."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;