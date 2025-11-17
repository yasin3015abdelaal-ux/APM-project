import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { countriesFlags } from "../../data/flags";
import { authAPI } from "../../api";

const ProfileHover = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [promoted, setpromoted] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData"));
  const userCountryId = userData?.country?.id;

  const userCountry = countriesFlags.find((c) => c.id === userCountryId);
  let flagImage;
  if (userCountry?.flag) {
    flagImage =
      typeof userCountry.flag === "string"
        ? userCountry.flag
        : userCountry.flag[Object.keys(userCountry.flag)[0]];
  }
  const countryName =
    i18n.language === "ar"
      ? userData?.country?.name_ar
      : userData?.country?.name_en;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authAPI.logout();
      logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };
  const menuItems = [
    { key: "favorite ads", icon: "favorite", route: "/favorites" },
    { key: "subscriptions", icon: "article", route: "/subscriptions" },
    { key: "contact us", icon: "call", route: "/contact-us" },
    { key: "share the app", icon: "share" },
    { key: "my ads", icon: "add_ad", route: "/ads" },
    { key: "notification", icon: "notifications", route: "/notifications" },
    {
      key: "subscriptions and invoices",
      icon: "receipt",
      route: "/subscriptions-invoices",
    },
    { key: "today's meat price", icon: "payments", route: "/meat-prices" },
    { key: "about us", icon: "info", route: "/about-us" },
    {
      key: "privacy, terms, and conditions",
      icon: "policy",
      route: "/privacy-policy",
    },
  ];
  const handleMenuClick = (item) => {
    if (item.route) {
      navigate(item.route);
    }
  };
  return (
    <div
      className={`h-auto max-h-[450px] w-[280px] sm:w-[320px] cursor-default flex flex-col overflow-auto border-2 rounded-lg px-3 pt-4 pb-2 bg-white z-10 border-main absolute top-10 ${i18n.language === "ar" ? "left-0" : "right-0"
        }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Account photo or make account button */}
      {isAuthenticated ? (
        <div className="flex flex-col justify-center items-center">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 border-2 ${promoted ? "border-main" : "border-[#BF9300] border-r-transparent"
              } rounded-full relative`}
          >
            {userData?.image ? (
              <img
                src={userData.image}
                className="w-full h-full object-cover rounded-full"
                alt="Profile"
              />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
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
            <img
              src={flagImage}
              className="absolute w-5 h-5 sm:w-9 sm:h-9 border rounded-full top-[60%] left-[60%]"
              alt="Flag"
            />
          </div>
          <div className="text-base sm:text-lg font-semibold mt-2">
            {userData?.name}
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="border rounded-lg text-xs sm:text-base cursor-pointer text-white bg-main px-4 py-1.5 mt-2 sm:mt-3 hover:bg-green-700 transition w-full max-w-[180px]"
          >
            {t("viewProfile")}
          </button>

          <div
            dir={i18n.language === "en" ? "ltr" : "rtl"}
            className="w-full text-sm sm:text-base border border-main rounded-lg flex justify-between items-center p-2 mt-2 sm:mt-3"
          >
            {t("country")}
            <div className="bg-main text-white border rounded-lg px-2 py-1 text-xs sm:text-sm">
              {countryName}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center mt-2">
          <button
            onClick={() => navigate("/register")}
            className="w-full max-w-[160px] cursor-pointer border rounded-lg text-sm sm:text-base text-white bg-main px-4 py-1.5 mb-2 whitespace-nowrap hover:bg-green-700 transition"
          >
            {t("create account")}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full max-w-[160px] cursor-pointer border-2 border-main rounded-lg text-sm sm:text-base text-main bg-white px-4 py-1.5 whitespace-nowrap hover:bg-green-50 transition"
          >
            {t("log in")}
          </button>
        </div>
      )}

      {/* Language Selector */}
      <div
        dir={i18n.language === "en" ? "ltr" : "rtl"}
        className="w-full text-sm sm:text-base border border-main rounded-lg flex justify-between items-center p-1.5 mt-2"
      >
        {t("language")}
        <div className="bg-main text-white border rounded-lg pr-1 flex items-center">
          <span className="material-symbols-outlined text-xl sm:text-2xl p-0 m-0">
            arrow_drop_down
          </span>
          <select
            className="cursor-pointer bg-main px-1 text-white appearance-none outline-none focus:outline-none text-xs sm:text-sm"
            name="selectedOption"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="ar">عربي</option>
          </select>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col mt-2">
        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => handleMenuClick(item)}
            className="flex justify-between my-1 text-main hover:bg-green-50 p-1.5 rounded-lg transition cursor-pointer"
          >
            <div className="flex gap-2 text-sm sm:text-base items-center">
              <span className="material-symbols-outlined text-lg sm:text-xl">
                {item.icon}
              </span>
              {t(item.key)}
            </div>
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {i18n.language === "ar"
                ? "keyboard_arrow_left"
                : "keyboard_arrow_right"}
            </span>
          </div>
        ))}

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="self-center w-full max-w-[160px] border-2 border-main rounded-lg text-sm sm:text-base text-main bg-white px-4 py-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 transition mt-2"
          >
            {isLoggingOut
              ? t("logging out...") || "جاري تسجيل الخروج..."
              : t("log out")}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHover;
