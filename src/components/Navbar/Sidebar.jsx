import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { countriesFlags } from "../../data/flags";
import { authAPI, dataAPI } from "../../api";
import CustomSelect from "../Ui/CustomSelect/CustomSelect";

const Sidebar = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, logout, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const [countries, setCountries] = useState([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);

    const userData = user || JSON.parse(localStorage.getItem("userData"));
    const userCountryId = userData?.country?.id;

    const userCountry = countriesFlags.find((c) => c.id === userCountryId);
    let flagImage;
    if (userCountry?.flag) {
        flagImage =
            typeof userCountry.flag === "string"
                ? userCountry.flag
                : userCountry.flag[Object.keys(userCountry.flag)[0]];
    }

    // Fetch countries on mount
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

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await authAPI.logout();
            logout();
            navigate("/");
            onClose();
        } catch (error) {
            console.error("Logout error:", error);
            logout();
            navigate("/");
            onClose();
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
                    ...userData,
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
        { key: "today's meat price", icon: "payments", route: "/prices" },
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
            onClose();
        }
    };

    // Prepare language options
    const languageOptions = [
        { value: "en", label: "English" },
        { value: "ar", label: "عربي" }
    ];

    // Prepare country options
    const countryOptions = countries.map(country => ({
        value: country.id.toString(),
        label: i18n.language === "ar" ? country.name_ar : country.name_en
    }));

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transition-all duration-300 lg:hidden ${i18n.language === "ar"
                    ? `right-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`
                    : `left-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`
                    }`}
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
            >
                <div className="h-full overflow-y-auto">
                    {/* Header */}
                    <div className="p-4 border-b-2 border-main flex justify-between items-center bg-green-50">
                        <div className="text-xl font-bold text-main">{t("menu")}</div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <span className="material-symbols-outlined text-main text-2xl">
                                close
                            </span>
                        </button>
                    </div>

                    {/* Profile Section */}
                    <div className="p-4 border-b border-gray-200">
                        {isAuthenticated ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative flex-shrink-0 order-1">
                                    <div className="w-20 h-20 bg-gray-300 border-2 border-main rounded-full relative cursor-pointer overflow-hidden">
                                        {userData?.image ? (
                                            <img
                                                src={userData.image}
                                                className="w-full h-full object-cover rounded-full"
                                                alt="Profile"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
                                                <svg
                                                    className="w-10 h-10 lg:w-16 lg:h-16 text-gray-400"
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
                                            className="absolute w-8 h-8 border rounded-full top-[60%] left-[60%]"
                                            alt="Flag"
                                        />
                                    )}
                                </div>
                                <div className="text-lg font-semibold text-center order-2">
                                    {userData?.name}
                                </div>
                                {/* Country Select */}
                                <div className="w-full border border-main rounded-lg p-2 flex justify-between items-center text-sm order-3">
                                    <span>{t("country")}</span>
                                    <div className="w-32">
                                        <CustomSelect
                                            options={countryOptions}
                                            value={userCountryId?.toString()}
                                            onChange={handleCountryChange}
                                            placeholder={isLoadingCountries ? "..." : (i18n.language === "ar" ? userData?.country?.name_ar : userData?.country?.name_en)}
                                            isRTL={i18n.language === "ar"}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        navigate("/profile");
                                        onClose();
                                    }}
                                    className="w-full bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm order-4"
                                >
                                    {t("viewProfile")}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full border-2 border-main text-main py-2 px-4 rounded-lg hover:bg-green-50 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed order-5"
                                >
                                    {isLoggingOut
                                        ? t("logging out...") || "جاري تسجيل الخروج..."
                                        : t("log out")}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full border-2 border-main bg-gray-100 flex items-center justify-center order-1">
                                    <svg
                                        className="w-10 h-10 text-gray-400"
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
                                <button
                                    onClick={() => {
                                        navigate("/register");
                                        onClose();
                                    }}
                                    className="w-full border-2 border-main text-main py-2 px-4 rounded-lg hover:bg-green-50 transition text-sm order-4"
                                >
                                    {t("create account")}
                                </button>
                                <button
                                    onClick={() => {
                                        navigate("/login");
                                        onClose();
                                    }}
                                    className="w-full bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm font-semibold order-3"
                                >
                                    {t("log in")}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Language Selector */}
                    {/* <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center p-2 border border-main rounded-lg">
                            <span className="text-sm font-medium">{t("language")}</span>
                            <div className="w-32">
                                <CustomSelect
                                    options={languageOptions}
                                    value={i18n.language}
                                    onChange={handleLanguageChange}
                                    placeholder={i18n.language === "ar" ? "عربي" : "English"}
                                    isRTL={i18n.language === "ar"}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div> */}

{/* Quick Actions */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    navigate("/auction");
                                    onClose();
                                }}
                                className={`flex-1 px-3 py-2 border-2 border-main rounded-lg text-main hover:bg-green-50 transition font-medium
                    ${i18n.language === "ar" ? "text-base" : "text-xs"}`}
                            >
                                {t("auctions")}
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/ads");
                                    onClose();
                                }}
                                className={`flex-1 px-3 py-2 bg-main text-white rounded-lg hover:bg-green-700 transition font-medium
                    ${i18n.language === "ar" ? "text-base" : "text-xs"}`}
                            >
                                {t("shareAdv")}
                            </button>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-4">
                        <div className="flex flex-col gap-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.key}
                                    className="flex items-center justify-between p-2.5 hover:bg-green-50 rounded-lg transition text-main"
                                    onClick={() => handleMenuClick(item)}
                                >
                                    <div className="flex items-center gap-2 text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-xl">
                                            {item.icon}
                                        </span>
                                        <span>{t(item.key)}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-xl">
                                        {i18n.language === "ar"
                                            ? "keyboard_arrow_left"
                                            : "keyboard_arrow_right"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;