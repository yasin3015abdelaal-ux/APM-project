import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { countriesFlags } from "../../data/flags";
import { authAPI, dataAPI } from "../../api";
import { BadgeCheck } from "lucide-react";
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
    const isVerified = userData?.verified_account === 1 || userData?.verified_account === "1";

    const userCountry = countriesFlags.find((c) => c.id === userCountryId);
    let flagImage;
    if (userCountry?.flag) {
        flagImage =
            typeof userCountry.flag === "string"
                ? userCountry.flag
                : userCountry.flag[Object.keys(userCountry.flag)[0]];
    }

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
            onClose();
        }
    };

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
        if (!isAuthenticated) {
            return ["about us", "privacy, terms, and conditions"].includes(item.key);
        }
        if (item.verifiedOnly && !isVerified) {
            return false;
        }
        return true;
    });

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            <div
                className={`fixed top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transition-all duration-300 lg:hidden ${i18n.language === "ar"
                    ? `right-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`
                    : `left-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`
                    }`}
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
            >
                <div className="h-full overflow-y-auto">
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
                                            <div className="w-full h-full rounded-full border-2 border-main bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                                                <svg
                                                    className="w-10 h-10 lg:w-12 lg:h-12 text-main"
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
                                            className="absolute w-8 h-8 border-2 border-white rounded-full shadow-lg top-[60%] left-[60%]"
                                            alt="Flag"
                                        />
                                    )}
                                </div>
                                <div className="flex items-center justify-center gap-2 order-2">
                                    <div className="text-lg font-semibold text-center text-gray-800">
                                        {userData?.name}
                                    </div>
                                    {isVerified && (
                                        <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2.5 flex justify-between items-center text-sm order-3 hover:border-main transition-colors">
                                    <span className="font-medium text-gray-700">{t("country")}</span>
                                    <div className="w-50">
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
                                    className="w-full bg-gradient-to-r from-main to-green-700 text-white py-2.5 px-4 rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-sm font-semibold order-4"
                                >
                                    {t("viewProfile")}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full border-2 border-red-500 text-red-500 py-2.5 px-4 rounded-lg hover:bg-red-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed order-5"
                                >
                                    {isLoggingOut
                                        ? t("auth.login.loggingOut") || t("logging out...") || "جاري تسجيل الخروج..."
                                        : t("log out")}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-md order-1">
                                    <svg
                                        className="w-10 h-10 text-main"
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
                                    onClick={() => {
                                        navigate("/login");
                                        onClose();
                                    }}
                                    className="w-full bg-gradient-to-r from-main to-green-700 text-white py-2.5 px-4 rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-sm font-semibold order-2"
                                >
                                    {t("log in")}
                                </button>
                                <button
                                    onClick={() => {
                                        navigate("/register");
                                        onClose();
                                    }}
                                    className="w-full border-2 border-main text-main py-2.5 px-4 rounded-lg hover:bg-green-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 text-sm font-medium order-3"
                                >
                                    {t("create account")}
                                </button>
                            </div>
                        )}
                    </div>

                    {isAuthenticated && (
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
                    )}

                    <div className="p-4">
                        <div className="flex flex-col gap-1">
                            {filteredMenuItems.map((item) => (
                                <button
                                    key={item.key}
                                    className="flex items-center justify-between p-2.5 hover:bg-green-50 rounded-lg transition text-gray-700 hover:text-main group"
                                    onClick={() => handleMenuClick(item)}
                                >
                                    <div className="flex items-center gap-2 text-sm sm:text-base">
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