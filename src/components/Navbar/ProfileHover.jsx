import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { countriesFlags } from "../../data/flags";
import { authAPI, dataAPI } from "../../api";
import { BadgeCheck, LogOut } from "lucide-react";
import CustomSelect from "../Ui/CustomSelect/CustomSelect";

const ProfileHover = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser, isAuthenticated } = useAuth(); 
  const navigate = useNavigate();
  const [promoted, setpromoted] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  const userCountryId = user?.country?.id;
  const trustStatus = user?.trust_status;
  const isVerified = trustStatus === "active";

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
      ? user?.country?.name_ar
      : user?.country?.name_en;

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const countriesRes = await dataAPI.getCountries();
        const countriesData =
          countriesRes.data?.data?.countries ||
          countriesRes.data?.countries ||
          [];
        setCountries(Array.isArray(countriesData) ? countriesData : []);
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    if (isAuthenticated) {
      fetchCountries();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authAPI.logout();
      logout();
      if (onClose) onClose();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      if (onClose) onClose();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    i18n.changeLanguage(newLanguage);
  };

  const handleCountryChange = async (newCountryId) => {
    try {
      const selectedCountry = countries.find(c => c.id === parseInt(newCountryId));
      if (selectedCountry && updateUser) {
        const updatedUser = {
          ...user,
          country: selectedCountry,
          country_id: selectedCountry.id
        };
        updateUser(updatedUser);
        localStorage.setItem("userData", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error updating country:", error);
    }
  };

  const getCountryFlag = (country) => {
    const flagData = countriesFlags.find(f => 
      f.name_ar === country.name_ar || 
      f.name_en === country.name_en ||
      f.code?.toLowerCase() === country.code?.toLowerCase() ||
      f.id === country.id
    );
    return flagData?.flag;
  };

  const menuItems = [
    { key: "favorite ads", icon: "favorite", route: "/favorites" },
    { key: "subscriptions", icon: "article", route: "/packages" },
    { key: "contact us", icon: "call", route: "/contact" },
    { key: "share the app", icon: "share" },
    { key: "my ads", icon: "add_ad", route: "/ads" },
    { key: "notification", icon: "notifications", route: "/notifications" },
    {
      key: "subscriptions and invoices",
      icon: "receipt",
      route: "/invoices",
    },
    { key: "today's meat price", icon: "payments", route: "/prices", verifiedOnly: true },
    { key: "about us", icon: "info", route: "/about-us" },
    {
      key: "privacy, terms, and conditions",
      icon: "policy",
      route: "/terms-and-conditions",
    },
  ];

  const handleMenuClick = (item) => {
    if (item.route) {
      navigate(item.route);
      if (onClose) onClose();
    }
  };

  const handleNavigation = (route) => {
    navigate(route);
    if (onClose) onClose();
  };

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "ar", label: "عربي" }
  ];

  const countryOptions = countries.map(country => {
    const flagImg = getCountryFlag(country);
    return {
      value: country.id.toString(),
      label: i18n.language === "ar" ? country.name_ar : country.name_en,
      icon: flagImg ? (
        <img src={flagImg} alt={country.name_en} className="w-6 h-6 object-cover rounded" />
      ) : (
        <span className="text-xl">🌍</span>
      )
    };
  });

  const filteredMenuItems = menuItems.filter(item => {
    if (item.verifiedOnly && !isVerified) {
      return false;
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div
        className={`w-[300px] sm:w-[340px] cursor-default flex flex-col rounded-xl shadow-2xl px-5 py-5 bg-white z-100 border border-gray-100 absolute top-12 ${
          i18n.language === "ar" ? "left-0" : "right-0"
        }`}
        dir={i18n.language === "ar" ? "rtl" : "ltr"}
      >
        <div className="flex flex-col items-center gap-4 pb-5 border-b border-gray-100">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-md">
            <svg
              className="w-12 h-12 text-main"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <button
            onClick={() => handleNavigation("/login")}
            className="w-full cursor-pointer bg-gradient-to-r from-main to-green-700 text-white py-2.5 px-4 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-sm font-semibold"
          >
            {t("log in")}
          </button>

          <button
            onClick={() => handleNavigation("/register")}
            className="w-full cursor-pointer border-2 border-main text-main py-2.5 px-4 rounded-xl hover:bg-green-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 text-sm font-medium"
          >
            {t("create account")}
          </button>
        </div>

        <div className="flex flex-col mt-4 gap-1">
          {menuItems
            .filter(item => ["about us", "privacy, terms, and conditions"].includes(item.key))
            .map((item) => (
              <div
                key={item.key}
                onClick={() => handleMenuClick(item)}
                className="flex justify-between items-center text-gray-700 hover:bg-green-50 hover:text-main p-3 rounded-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex gap-3 text-sm sm:text-base items-center">
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-medium">{t(item.key)}</span>
                </div>
                <span className="material-symbols-outlined text-xl text-gray-400 group-hover:text-main group-hover:translate-x-1 transition-all">
                  {i18n.language === "ar"
                    ? "keyboard_arrow_left"
                    : "keyboard_arrow_right"}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`max-h-[520px] w-[300px] sm:w-[340px] cursor-default flex flex-col overflow-y-auto overflow-x-hidden rounded-xl shadow-2xl px-5 pt-5 pb-4 bg-white z-100 border border-gray-100 absolute top-12 ${
        i18n.language === "ar" ? "left-0" : "right-0"
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col justify-center items-center">
        <div className="relative">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 border-3 ${
              promoted
                ? "border-main shadow-lg shadow-green-200"
                : "border-[#BF9300] border-r-transparent"
            } rounded-full relative overflow-hidden`}
          >
            {user?.image ? (
              <img
                src={user.image}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 text-main"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          {flagImage && (
            <img
              src={flagImage}
              className="absolute w-7 h-7 sm:w-10 sm:h-10 border-2 border-white rounded-full shadow-lg bottom-0 right-0"
              alt="Flag"
            />
          )}
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="text-base sm:text-lg font-bold text-gray-800">
            {user?.name}
          </div>
          {isVerified && (
            <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          )}
        </div>

        <button
          onClick={() => handleNavigation("/profile")}
          className="rounded-xl text-xs sm:text-sm cursor-pointer text-white bg-gradient-to-r from-main to-green-700 px-6 py-2 mt-3 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 w-full max-w-[200px] font-semibold"
        >
          {t("viewProfile")}
        </button>

        <div
          dir={i18n.language === "en" ? "ltr" : "rtl"}
          className="w-full text-sm sm:text-base border border-gray-200 bg-gray-50 rounded-xl flex justify-between items-center p-3 mt-4 hover:border-main transition-colors"
        >
          <span className="font-medium text-gray-700">{t("country")}</span>
          <div className="w-50">
            <CustomSelect
              options={countryOptions}
              value={userCountryId?.toString()}
              onChange={handleCountryChange}
              placeholder={isLoadingCountries ? "..." : countryName}
              isRTL={i18n.language === "ar"}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>

      <div className="flex flex-col gap-1">
        {filteredMenuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => handleMenuClick(item)}
            className="flex justify-between items-center text-gray-700 hover:bg-green-50 hover:text-main p-3 rounded-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="flex gap-3 text-sm sm:text-base items-center">
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span className="font-medium">{t(item.key)}</span>
            </div>
            <span className="material-symbols-outlined text-xl text-gray-400 group-hover:text-main group-hover:translate-x-1 transition-all">
              {i18n.language === "ar"
                ? "keyboard_arrow_left"
                : "keyboard_arrow_right"}
            </span>
          </div>
        ))}

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          dir={i18n.language === "en" ? "ltr" : "rtl"}
          className="self-center w-full max-w-[180px] border-2 border-red-500 rounded-xl text-sm sm:text-base text-red-500 bg-white px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 mt-3 font-semibold flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? t("auth.login.loggingOut") : t("log out")}
        </button>
      </div>
    </div>
  );
};

export default ProfileHover;