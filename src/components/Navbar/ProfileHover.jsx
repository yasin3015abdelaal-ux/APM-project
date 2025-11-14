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

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("userData"));
  const userCountryId = userData?.country?.id;

  // Find user's country
  const userCountry = countriesFlags.find((c) => c.id === userCountryId);
  // Check if flag is an object or string
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

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authAPI.logout();
      logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API fails, logout locally
      logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className="h-[450px] w-[345px] max-[450px]:w-[200px] cursor-default flex flex-col overflow-auto justify-top border-2 rounded-lg px-2 pt-5 pb-1 bg-white z-10 border-main absolute top-[110%]"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Account photo or make account button */}
      {isAuthenticated ? (
        <div className="flex flex-col justify-center items-center">
          <div
            className={`w-26 h-26 max-[450px]:w-18 max-[450px]:h-18 bg-gray-300 border-2 ${
              promoted ? "border-main" : "border-[#BF9300] border-r-transparent"
            } rounded-full relative`}
          >
            {userData?.image ? (
              <img
                src={userData.image}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
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
              className="absolute w-8 max-[450px]:w-6 border rounded-full h-8 max-[450px]:h-6 top-[70%] left-[70%]"
            />
          </div>
          <div className="text-2xl font-semibold max-[450px]:text-[18px]">
            {userData?.name}
          </div>
          <button onClick={() => navigate("/profile")} 
          className="border rounded-lg text-xl cursor-pointer max-[450px]:text-[18px] text-white bg-main px-7 max-[450px]:px-2 py-2 mt-5">
            {t("viewProfile")}
          </button>

          <div
            dir={i18n.language === "en" ? "ltr" : "rtl"}
            className="w-full text-xl max-[450px]:text-[18px] border border-main rounded-lg flex justify-between items-center p-2 mt-4"
          >
            {t("country")}
            <div className="bg-main text-white border rounded-lg px-3 py-1">
              {countryName}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center mt-3">
          <button
            onClick={() => navigate("/register")}
            className="w-40 max-[450px]:w-25 cursor-pointer border rounded-4xl max-[450px]:rounded-lg text-[18px] text-white bg-main px-7 max-[450px]:p-1 py-2 mb-2 whitespace-nowrap"
          >
            {t("create account")}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-40 max-[450px]:w-15 cursor-pointer border rounded-4xl max-[450px]:rounded-lg text-[18px] text-main bg-white px-7 max-[450px]:p-1 py-2 whitespace-nowrap"
          >
            {t("log in")}
          </button>
        </div>
      )}

      {/* Language Selector */}
      <div
        dir={i18n.language === "en" ? "ltr" : "rtl"}
        className="w-full text-xl max-[450px]:text-[18px] border border-main rounded-lg flex justify-between items-center p-0.5 mt-1"
      >
        {t("language")}
        <div className="bg-main text-white border rounded-lg pr-2">
          <span className="material-symbols-outlined text-[40px]! max-[450px]:text-[20px]! p-0! m-0!">
            arrow_drop_down
          </span>
          <select
            className="cursor-pointer bg-main px-1 text-white appearance-none outline-none focus:outline-none"
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
      <div className="flex flex-col">
        <div className="flex justify-between my-2 text-main">
          <div className="flex gap-2 text-[20px]">
            {t("favorite ads")}
            <span className="material-symbols-outlined">favorite</span>
          </div>
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main">
          <div className="flex gap-2 text-[20px]">
            {t("subscriptions")}
            <span className="material-symbols-outlined">article</span>
          </div>
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main">
          <div className="flex gap-2 text-[20px]">
            {t("contact us")}
            <span className="material-symbols-outlined">call</span>
          </div>
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main">
          <div className="flex gap-2 text-[20px]">
            {t("share the app")}
            <span className="material-symbols-outlined">share</span>
          </div>
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main">
          <div className="flex gap-2 text-[20px]">
            {t("my ads")}
            <span className="material-symbols-outlined">add_ad</span>
          </div>
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main text-[20px]">
          {t("notifications")}
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main text-[20px]">
          {t("subscriptions and invoices")}
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main text-[20px]">
          {t("today's meat price")}
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main text-[20px]">
          {t("about us")}
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        <div className="flex justify-between my-2 text-main text-[20px]">
          {t("privacy, terms, and conditions")}
          <span className="material-symbols-outlined">
            {i18n.language === "ar"
              ? "keyboard_arrow_left"
              : "keyboard_arrow_right"}
          </span>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="self-center w-40 max-[450px]:w-20 border rounded-lg text-[18px] text-main bg-white px-7 max-[450px]:p-1 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
