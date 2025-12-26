import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { dataAPI } from "../../api";
import logo from "../../assets/images/logo.png";
import { useAdminAuth } from "../../contexts/AdminContext";
import { adminAuthAPI } from "../../api";
import { countriesFlags } from "../../data/flags";
import { adminAPI } from "../../api";

const Sidebar = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAdminAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [isOpen, setIsOpen] = useState(false);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [stats, setStats] = useState({});
    const [loadingStats, setLoadingStats] = useState(false);

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
                
                // Set initial selected country from localStorage, user data, or first country
                const savedCountryId = localStorage.getItem("adminSelectedCountryId");
                if (savedCountryId) {
                    setSelectedCountry(savedCountryId);
                } else if (userCountryId) {
                    setSelectedCountry(userCountryId.toString());
                    localStorage.setItem("adminSelectedCountryId", userCountryId.toString());
                } else if (data.length > 0) {
                    setSelectedCountry(data[0].id.toString());
                    localStorage.setItem("adminSelectedCountryId", data[0].id.toString());
                }
            })
            .catch((err) => {
                console.error("Error fetching countries:", err);
                setCountries([]);
                
                // Fallback to user country if API fails
                const savedCountryId = localStorage.getItem("adminSelectedCountryId");
                if (savedCountryId) {
                    setSelectedCountry(savedCountryId);
                } else if (userCountryId) {
                    setSelectedCountry(userCountryId.toString());
                    localStorage.setItem("adminSelectedCountryId", userCountryId.toString());
                }
            });
    }, [userCountryId]);

    // Fetch sidebar statistics
    const fetchSidebarStats = async (countryId) => {
        if (!countryId) return;
        
        try {
            setLoadingStats(true);
            const response = await adminAPI.get('/sidebar-stats', {
                headers: {
                    'country_id': countryId
                }
            });
            
            const data = response.data?.data || response.data;
            setStats(data);
        } catch (error) {
            console.error("Error fetching sidebar stats:", error);
            setStats({});
        } finally {
            setLoadingStats(false);
        }
    };

    // Fetch stats when country changes
    useEffect(() => {
        if (selectedCountry) {
            fetchSidebarStats(selectedCountry);
        }
    }, [selectedCountry]);

    // Menu items with their stat keys
    const menuItems = [
        { 
            label: t("dashboard.sidebar.accounts"), 
            path: "/dashboard/accounts",
            statKey: "users_count"
        },
        { 
            label: t("dashboard.sidebar.auctions"), 
            path: "/dashboard/auctions",
            statKey: "auctions_count"
        },
        { 
            label: t("dashboard.sidebar.additions"), 
            path: "/dashboard/additions",
            statKey: "additions_count"
        },
        { 
            label: t("dashboard.sidebar.products"), 
            path: "/dashboard/products",
            statKey: "products_count"
        },
        { 
            label: t("dashboard.sidebar.packages"), 
            path: "/dashboard/packages",
            statKey: "packages_count"
        },
        { 
            label: t("dashboard.sidebar.contactUs"), 
            path: "/dashboard/contact-us",
            statKey: "reports_count"
        },
        { 
            label: t("dashboard.sidebar.sellersReviews"), 
            path: "/dashboard/sellers-reviews",
            statKey: null
        },
        { 
            label: t("dashboard.sidebar.sellersReports"), 
            path: "/dashboard/sellers-reports",
            statKey: null
        },
        { 
            label: t("dashboard.sidebar.verification"), 
            path: "/dashboard/verification",
            statKey: "verifications_count"
        },
        { 
            label: t("dashboard.sidebar.messages"), 
            path: "/dashboard/messages",
            statKey: "contact_messages_count"
        },
        { 
            label: t("dashboard.sidebar.articles"), 
            path: "/dashboard/articles",
            statKey: "articles_count"
        },
        { 
            label: t("dashboard.sidebar.ads"), 
            path: "/dashboard/ads",
            statKey: null
        },
        { 
            label: t("dashboard.sidebar.admins"), 
            path: "/dashboard/admins",
            statKey: "admins_count"
        },
        { 
            label: t("dashboard.sidebar.subscriptions"), 
            path: "/dashboard/subscriptions",
            statKey: null
        },
        { 
            label: t("dashboard.sidebar.invoices"), 
            path: "/dashboard/invoices",
            statKey: "invoices_count"
        },
        { 
            label: t("dashboard.sidebar.notifications"), 
            path: "/dashboard/notifications",
            statKey: "notifications_count"
        },
        { 
            label: t("dashboard.sidebar.todayPrice"), 
            path: "/dashboard/today-price",
            statKey: null
        },
    ];

    const toggleLanguage = () => {
        const newLang = i18n.language === "ar" ? "en" : "ar";
        i18n.changeLanguage(newLang);
    };

    const handleCountryChange = (e) => {
        const countryId = e.target.value;
        setSelectedCountry(countryId);
        // Save selected country ID to localStorage for API headers
        localStorage.setItem("adminSelectedCountryId", countryId);
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent("adminCountryChanged", { detail: { countryId } }));
    };

    const handleMenuClick = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await adminAuthAPI.logout();
            logout();
            navigate("/admin/login");
        } catch (error) {
            console.error("Logout error:", error);
            logout();
            navigate("/admin/login");
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Check if menu item is active (supports nested routes)
    const isMenuItemActive = (path) => {
        if (path === "/dashboard/additions") {
            return location.pathname.startsWith("/dashboard/additions");
        }
        if (path === "/dashboard/accounts") {
            return location.pathname.startsWith("/dashboard/accounts");
        }
        if (path === "/dashboard/auctions") {
            return location.pathname.startsWith("/dashboard/auctions");
        }
        if (path === "/dashboard/verification") {
            return location.pathname.startsWith("/dashboard/verification");
        }
        if (path === "/dashboard/messages") {
            return location.pathname.startsWith("/dashboard/messages");
        }
        if (path === "/dashboard/packages") {
            return location.pathname.startsWith("/dashboard/packages");
        }
        if (path === "/dashboard/articles") {
            return location.pathname.startsWith("/dashboard/articles");
        }
        if (path === "/dashboard/contact-us") {
            return location.pathname.startsWith("/dashboard/contact-us");
        }
        if (path === "/dashboard/sellers-reviews") {
            return location.pathname.startsWith("/dashboard/sellers-reviews");
        }
        if (path === "/dashboard/sellers-reports") {
            return location.pathname.startsWith("/dashboard/sellers-reports");
        }
        if (path === "/dashboard/notifications") {
            return location.pathname.startsWith("/dashboard/notifications");
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
                    className="lg:hidden fixed inset-0 bg-black/70 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed
                    ${isRTL ? "right-0" : "left-0"}
                    top-0 
                    h-screen
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
                    <div className="flex justify-center py-4 cursor-pointer" onClick={() => navigate("/dashboard")}>
                        <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                    </div>

                    {/* Menu Items */}
                    <ul className="flex flex-col px-4 mt-2 space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleMenuClick(item.path)}
                                    className={`w-full text-base font-medium rounded-md px-3 py-1.5 transition cursor-pointer flex items-center justify-between
                                    ${isMenuItemActive(item.path)
                                        ? "bg-main text-white"
                                        : "text-main hover:translate-x-[-5px]"
                                    }`}
                                >
                                    <span style={{ textAlign: isRTL ? "right" : "left" }}>
                                        {item.label}
                                    </span>
                                    
                                    {/* Statistics Badge */}
                                    {item.statKey && stats[item.statKey] !== undefined && (
                                        <span className={`flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                                            isMenuItemActive(item.path)
                                                ? "bg-white text-main"
                                                : "bg-main text-white"
                                        }`}>
                                            {loadingStats ? "..." : stats[item.statKey]}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Logout Button */}
                <div className="p-4">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full cursor-pointer bg-main text-white py-1.5 rounded-md text-md hover:bg-green-700 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoLogOutOutline size={18} />
                        {isLoggingOut 
                            ? (t("dashboard.sidebar.loggingOut") || "جاري تسجيل الخروج...")
                            : t("dashboard.sidebar.logout")}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;