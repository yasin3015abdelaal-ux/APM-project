import { useTranslation } from "react-i18next";
import logo from "../../assets/images/logo.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileHover from "./ProfileHover";
import { useState } from "react";
import { countriesFlags } from "../../data/flags";
import { HeartIcon } from "lucide-react";

const Navbar = ({
  onMenuClick,
  onSearchClick,
  showProfileHover,
  setShowProfileHover,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData"));
  const userCountryId = userData?.country?.id;
  const userCountry = countriesFlags.find((c) => c.id === userCountryId);
  const flagImage = userCountry?.flag || "";

  const [unreadMessages, setUnreadMessages] = useState(3);
  const [unreadNotifications, setUnreadNotifications] = useState(5);

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
  };

  const handleMessagesClick = () => {
    navigate("/messages");
  };
  const handleFavClick = () => {
    navigate("/favorites");
  };

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 md:py-3 border-2 border-main rounded-lg bg-white">
      <div className="container">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={logo}
              alt="logo"
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 cursor-pointer object-cover"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-md mx-4 relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              className={`w-full px-3 py-1.5 ${
                i18n.language === "ar" ? "pr-10" : "pl-3 pr-10"
              } border-2 border-main rounded-lg outline-none focus:ring-2 focus:ring-green-400 text-sm`}
              dir={i18n.language === "ar" ? "rtl" : "ltr"}
            />
            <button
              type="submit"
              className={`absolute cursor-pointer top-1/2 -translate-y-1/2 ${
                i18n.language === "ar" ? "left-2" : "right-2"
              } p-1 hover:bg-gray-100 rounded transition`}
            >
              <i className="fa-solid fa-magnifying-glass text-main text-base"></i>
            </button>
          </form>

          {/* Desktop Menu Items */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/auction")}
              className="px-3 py-1.5 border-2 cursor-pointer border-main rounded-lg text-main hover:bg-green-50 transition whitespace-nowrap text-sm"
            >
              {t("auctions")}
            </button>
            <button
              onClick={() => navigate("/ads")}
              className="px-3 py-1.5 bg-main text-white cursor-pointer rounded-lg hover:bg-green-700 transition whitespace-nowrap text-sm"
            >
              {t("shareAdv")}
            </button>
          </div>

          {/* Mobile Search Icon */}
          <button
            onClick={onSearchClick}
            className="lg:hidden p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition flex-shrink-0"
            aria-label="Search"
          >
            <i className="fa-solid fa-magnifying-glass text-main text-lg sm:text-xl"></i>
          </button>

          {/* Fav Icon */}
          <button
            onClick={handleFavClick}
            className={`relative p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${
              location.pathname === "/favorites"
                ? "bg-green-100"
                : "hover:bg-gray-100"
            }`}
            aria-label="Favorites"
          >
            <HeartIcon className="text-main" />
          </button>

          {/* Messages Icon */}
          <button
            onClick={handleMessagesClick}
            className={`relative p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${
              location.pathname === "/messages"
                ? "bg-green-100"
                : "hover:bg-gray-100"
            }`}
            aria-label="Messages"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z"
                fill="#4CAF50"
              />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </button>

          {/* Notifications Icon */}
          <button
            onClick={handleNotificationsClick}
            className={`relative p-2 rounded-lg transition flex-shrink-0 cursor-pointer ${
              location.pathname === "/notifications"
                ? "bg-green-100"
                : "hover:bg-gray-100"
            }`}
            aria-label="Notifications"
          >
            <svg
              width="21"
              height="24"
              viewBox="0 0 43 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z"
                fill="#4CAF50"
              />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 bg-main text-white cursor-pointer rounded-lg hover:bg-green-700 transition font-semibold text-xs md:text-sm flex-shrink-0"
          >
            {i18n.language === "ar" ? "EN" : "ع"}
          </button>

          {/* Profile */}
          <div
            className="relative flex-shrink-0 hidden lg:block"
            onMouseEnter={() =>
              window.innerWidth >= 1024 && setShowProfileHover(true)
            }
            onMouseLeave={() =>
              window.innerWidth >= 1024 && setShowProfileHover(false)
            }
          >
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-300 border-2 border-main rounded-full relative cursor-pointer overflow-hidden">
              {userData?.image ? (
                <img
                  src={userData.image}
                  className="w-full h-full object-cover rounded-full"
                  alt="Profile"
                />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 lg:w-9 lg:h-9 text-gray-400"
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
            <img
              src={flagImage}
              className="absolute w-5 h-5 lg:w-6 lg:h-6 border rounded-full top-[60%] left-[60%]"
              alt="Flag"
            />
            {/* Bridge div to prevent hover gap */}
            <div className="absolute h-4 w-full bg-transparent top-full left-0"></div>
            {showProfileHover && <ProfileHover />}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-main text-xl sm:text-2xl">
              menu
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
