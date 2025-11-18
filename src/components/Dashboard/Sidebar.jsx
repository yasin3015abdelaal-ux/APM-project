import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { dataAPI } from "../../api";
import logo from "../../assets/images/logo.jpg";
import { useAuth } from "../../contexts/AuthContext";
import { countriesFlags } from "../../data/flags";

const Sidebar = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState("");

    const isRTL = i18n.language === "ar";

    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("userData"));
    const userCountryId = userData?.country?.id;

    // Get flag for selected country
    const selectedCountryData = countriesFlags.find((c) => c.id === parseInt(selectedCountry));
    const flagImage = selectedCountryData?.flag || "";

    // Fetch countries on component mount
    useEffect(() => {
        dataAPI
            .getCountries()
            .then((res) => {
                const data = res.data?.data?.countries || res.data?.countries || res.data?.data || [];
                setCountries(Array.isArray(data) ? data : []);
                
                // Set initial selected country from user data or first country
                if (userCountryId) {
                    setSelectedCountry(userCountryId.toString());
                } else if (data.length > 0) {
                    setSelectedCountry(data[0].id.toString());
                }
            })
            .catch((err) => {
                console.error("Error fetching countries:", err);
                setCountries([]);
                
                // Fallback to user country if API fails
                if (userCountryId) {
                    setSelectedCountry(userCountryId.toString());
                }
            });
    }, [userCountryId]);

    const menuItems = [
        { label: t("dashboard.sidebar.accounts"), path: "/dashboard/accounts" },
        { label: t("dashboard.sidebar.posts"), path: "/dashboard/posts" },
        { label: t("dashboard.sidebar.auctionsss"), path: "/dashboard/auctionss" },
        { label: t("dashboard.sidebar.additions"), path: "/dashboard/additions" },
        { label: t("dashboard.sidebar.products"), path: "/dashboard/products" },
        { label: t("dashboard.sidebar.packages"), path: "/dashboard/packages" },
        { label: t("dashboard.sidebar.reports"), path: "/dashboard/reports" },
        { label: t("dashboard.sidebar.verification"), path: "/dashboard/verification" },
        { label: t("dashboard.sidebar.logos"), path: "/dashboard/logos" },
        { label: t("dashboard.sidebar.articles"), path: "/dashboard/articles" },
        { label: t("dashboard.sidebar.ads"), path: "/dashboard/ads" },
        { label: t("dashboard.sidebar.admins"), path: "/dashboard/admins" },
        { label: t("dashboard.sidebar.invoices"), path: "/dashboard/invoices" },
        { label: t("dashboard.sidebar.todayPrice"), path: "/dashboard/today-price" },
    ];

    const toggleLanguage = () => {
        const newLang = i18n.language === "ar" ? "en" : "ar";
        i18n.changeLanguage(newLang);
    };

    const handleCountryChange = (e) => {
        const countryId = e.target.value;
        setSelectedCountry(countryId);
        // يمكنك إضافة logic إضافي هنا مثل تحديث localStorage أو إرسال request للسيرفر
    };

    const handleMenuClick = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    // Check if menu item is active (supports nested routes)
    const isMenuItemActive = (path) => {
        if (path === "/dashboard/additions") {
            return location.pathname.startsWith("/dashboard/additions");
        }
        if (path === "/dashboard/accounts") {
            return location.pathname.startsWith("/dashboard/accounts");
        }
        return location.pathname === path;
    };

    return (
        <>
            {/* Button for Mobile - Fixed at top */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`lg:hidden cursor-pointer fixed top-4 z-50 p-2 bg-main text-white rounded-md shadow-lg hover:bg-green-700 transition ${
                    isRTL ? "left-4" : "right-4"
                }`}
            >
                {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-[#00000062] z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky
                    ${isRTL ? "right-0" : "left-0"}
                    top-0 h-screen
                    w-64 lg:w-60
                    bg-white border-2 border-main rounded-xl
                    flex flex-col justify-between
                    ${isRTL ? "text-right" : "text-left"}
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    z-40
                    overflow-y-auto
                    scrollbar-hide
                `}
                dir={isRTL ? "rtl" : "ltr"}
            >
                <div>
                    {/* Header with Country Select and Language Toggle */}
                    <div className={`flex justify-between items-center px-3 py-2 gap-2 ${isRTL ? "flex-row" : "flex-row-reverse"}`}>
                        {/* Country Select with Flag */}
                        <div className="relative flex-1">
                            <select
                                value={selectedCountry}
                                onChange={handleCountryChange}
                                className={`w-full appearance-none flex items-center px-3 py-1.5 rounded-md bg-main text-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600 ${
                                    isRTL ? "pr-8 pl-8" : "pl-8 pr-8"
                                }`}
                            >
                                {countries.length === 0 ? (
                                    <option value="">{t("dashboard.sidebar.Egypt") || "مصر"}</option>
                                ) : (
                                    countries.map((country) => (
                                        <option key={country.id} value={country.id}>
                                            {i18n.language === "ar" ? country.name_ar : country.name_en}
                                        </option>
                                    ))
                                )}
                            </select>
                            
                            {/* Flag Image */}
                            {flagImage && (
                                <img
                                    src={flagImage}
                                    alt="Country flag"
                                    className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full pointer-events-none ${
                                        isRTL ? "right-2" : "left-2"
                                    }`}
                                />
                            )}
                            
                            {/* Dropdown Arrow */}
                            <div
                                className={`absolute top-1/2 transform -translate-y-1/2 pointer-events-none ${
                                    isRTL ? "left-2" : "right-2"
                                }`}
                            >
                                <FaChevronDown size={10} className="text-white" />
                            </div>
                        </div>

                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="border px-3 py-1.5 rounded-md text-sm bg-main text-white cursor-pointer hover:bg-green-700 transition font-medium"
                        >
                            {i18n.language === "ar" ? "EN" : "ع"}
                        </button>
                    </div>

                    {/* Logo */}
                    <div className="flex justify-center py-4">
                        <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                    </div>

                    {/* Menu Items */}
                    <ul className="flex flex-col px-4 mt-2 space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleMenuClick(item.path)}
                                    className={`w-full text-base font-medium rounded-md px-3 py-1.5 transition text-right cursor-pointer
                                    ${isMenuItemActive(item.path)
                                        ? "bg-main text-white"
                                        : "text-main hover:translate-x-[-5px]"
                                    }`}
                                    style={{ textAlign: isRTL ? "right" : "left" }}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Logout Button */}
                <div className="p-4">
                    <button
                        onClick={logout}
                        className="w-full cursor-pointer bg-main text-white py-1.5 rounded-md text-md hover:bg-green-700 flex items-center justify-center gap-2 transition"
                    >
                        <IoLogOutOutline size={18} />
                        {t("dashboard.sidebar.logout")}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;