import { useState, useEffect } from "react";
import {
    Calendar,
    Users,
    ShoppingCart,
    X,
    Edit2,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../../api";
import Loader from "../../Ui/Loader/Loader";
import * as XLSX from "xlsx";

const AuctionsManagement = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editType, setEditType] = useState(null);
    const [maxSellers, setMaxSellers] = useState("");
    const [maxBuyers, setMaxBuyers] = useState("");
    const [toast, setToast] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState({});
    const [participants, setParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        role: "",
        dateFrom: "",
        dateTo: "",
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.get("/auctions");
            const sortedAuctions = (response.data.data || []).sort((a, b) => {
                return new Date(b.start_time) - new Date(a.start_time);
            });
            setAuctions(sortedAuctions);
        } catch (error) {
            console.error("Error fetching auctions:", error);
            showToast(t("dashboard.auctions.errors.fetchError"), "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async (auctionId) => {
        setLoadingParticipants(true);
        try {
            const response = await adminAPI.get(
                `/auctions/${auctionId}/participants`
            );
            setParticipants(response.data.data || []);
        } catch (error) {
            console.error("Error fetching participants:", error);
            showToast(t("dashboard.auctions.errors.participantsError"), "error");
        } finally {
            setLoadingParticipants(false);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    useEffect(() => {
        if (selectedAuction) {
            fetchParticipants(selectedAuction.id);
        } else {
            setParticipants([]);
        }
    }, [selectedAuction]);

    const calculateTimeRemaining = () => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();

        if (currentDay === 5 && currentHour >= 7 && currentHour < 22) {
            const endTime = new Date(now);
            endTime.setHours(22, 0, 0, 0);
            return calculateTimeDiff(now, endTime, true);
        }

        let daysUntilFriday = (5 - currentDay + 7) % 7;
        if (daysUntilFriday === 0 && (currentHour >= 22 || currentHour < 7)) {
            daysUntilFriday = 7;
        }

        const nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + daysUntilFriday);
        nextFriday.setHours(7, 0, 0, 0);

        return calculateTimeDiff(now, nextFriday, false);
    };

    const calculateTimeDiff = (start, end, isOpen) => {
        const diff = end - start;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isOpen };
    };

    useEffect(() => {
        setTimeRemaining(calculateTimeRemaining());
        const timer = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(isRTL ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isAuctionPast = (endTime) => {
        return new Date(endTime) < new Date();
    };

    const handleUpdateLimits = async () => {
        if (!selectedAuction) return;

        try {
            const auctionDate = new Date(selectedAuction.start_time)
                .toISOString()
                .split("T")[0];

            await adminAPI.put("/auctions", {
                date: auctionDate,
                max_sellers: maxSellers ? parseInt(maxSellers) : null,
                max_buyers: maxBuyers ? parseInt(maxBuyers) : null,
            });

            showToast(t("dashboard.auctions.messages.updateSuccess"), "success");
            setShowEditModal(false);
            fetchAuctions();

            const updatedAuction = {
                ...selectedAuction,
                max_sellers: maxSellers ? parseInt(maxSellers) : null,
                max_buyers: maxBuyers ? parseInt(maxBuyers) : null,
            };
            setSelectedAuction(updatedAuction);
        } catch (error) {
            console.error("Error updating auction:", error);
            showToast(t("dashboard.auctions.errors.updateError"), "error");
        }
    };

    const openEditModal = (type) => {
        setEditType(type);
        setMaxSellers(selectedAuction?.max_sellers || "");
        setMaxBuyers(selectedAuction?.max_buyers || "");
        setShowEditModal(true);
    };

    const buyers = participants.filter((p) => p.role === "buyer");
    const sellers = participants.filter((p) => p.role === "seller");

    const exportToExcel = () => {
        try {
            let exportData = [];

            if (selectedAuction) {
                // Export participants of selected auction
                exportData = participants.map((participant) => ({
                    [isRTL ? "الاسم" : "Name"]: participant.user.name,
                    [isRTL ? "البريد الإلكتروني" : "Email"]: participant.user.email,
                    [isRTL ? "الهاتف" : "Phone"]: participant.user.phone,
                    [isRTL ? "النوع" : "Role"]: isRTL
                        ? participant.role === "buyer"
                            ? "مشتري"
                            : "بائع"
                        : participant.role,
                    [isRTL ? "تاريخ الانضمام" : "Joined At"]: formatDateTime(
                        participant.joined_at
                    ),
                }));
            } else {
                // Export auctions list
                exportData = auctions.map((auction) => ({
                    [isRTL ? "التاريخ" : "Date"]: formatDate(auction.start_time),
                    [isRTL ? "الحالة" : "Status"]: isAuctionPast(auction.end_time)
                        ? isRTL
                            ? "مغلق"
                            : "Closed"
                        : isRTL
                            ? "مفتوح"
                            : "Open",
                    [isRTL ? "عدد المشترين" : "Buyers Count"]: auction.buyers_count,
                    [isRTL ? "الحد الأقصى للمشترين" : "Max Buyers"]:
                        auction.max_buyers || (isRTL ? "غير محدود" : "Unlimited"),
                    [isRTL ? "عدد البائعين" : "Sellers Count"]: auction.sellers_count,
                    [isRTL ? "الحد الأقصى للبائعين" : "Max Sellers"]:
                        auction.max_sellers || (isRTL ? "غير محدود" : "Unlimited"),
                }));
            }

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, isRTL ? "المزادات" : "Auctions");

            const date = new Date().toISOString().split("T")[0];
            const fileName = `${isRTL ? "المزادات" : "Auctions"}_${date}.xlsx`;

            XLSX.writeFile(wb, fileName);
            showToast(isRTL ? "تم التصدير بنجاح" : "Export successful", "success");
        } catch (err) {
            console.error("Error exporting:", err);
            showToast(isRTL ? "فشل التصدير" : "Export failed", "error");
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters({
            role: "",
            dateFrom: "",
            dateTo: "",
        });
    };

    const getFilteredParticipants = () => {
        let filtered = [...participants];

        if (filters.role) {
            filtered = filtered.filter((p) => p.role === filters.role);
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(
                (p) => new Date(p.joined_at) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            filtered = filtered.filter(
                (p) => new Date(p.joined_at) <= new Date(filters.dateTo)
            );
        }

        return filtered;
    };

    const filteredParticipants = selectedAuction ? getFilteredParticipants() : [];
    const filteredBuyers = filteredParticipants.filter((p) => p.role === "buyer");
    const filteredSellers = filteredParticipants.filter(
        (p) => p.role === "seller"
    );

    return (
        <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 ${isRTL ? "left-20" : "right-4"
                        } z-50 animate-fade-in`}
                >
                    <div
                        className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success"
                                ? "bg-main text-white"
                                : "bg-red-500 text-white"
                            }`}
                    >
                        {toast.type === "success" ? (
                            <svg
                                className="w-6 h-6 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-6 h-6 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        )}
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                {t("dashboard.auctions.modal.title")}
                            </h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    {t("dashboard.auctions.modal.maxSellers")}
                                </label>
                                <input
                                    type="number"
                                    value={maxSellers}
                                    onChange={(e) => setMaxSellers(e.target.value)}
                                    placeholder={t("dashboard.auctions.modal.unlimited")}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-main focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    {t("dashboard.auctions.modal.maxBuyers")}
                                </label>
                                <input
                                    type="number"
                                    value={maxBuyers}
                                    onChange={(e) => setMaxBuyers(e.target.value)}
                                    placeholder={t("dashboard.auctions.modal.unlimited")}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-main focus:outline-none"
                                />
                            </div>

                            <button
                                onClick={handleUpdateLimits}
                                className="w-full bg-main hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition text-lg mt-6"
                            >
                                {t("dashboard.auctions.modal.update")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {selectedAuction && (
                                <button
                                    onClick={() => setSelectedAuction(null)}
                                    className="text-main cursor-pointer hover:text-green-700 transition"
                                >
                                    {isRTL ? (
                                        <ArrowRight size={28} />
                                    ) : (
                                        <ArrowLeft size={28} />
                                    )}

                                </button>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-main">
                                    {t("dashboard.auctions.title")}
                                </h1>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={exportToExcel}
                                className="bg-main cursor-pointer text-white px-3 text-sm rounded hover:bg-green-700 transition-colors py-1.5"
                            >
                                {isRTL ? "تصدير" : "Export"}
                            </button>

                            {selectedAuction && (
                                <button
                                    onClick={() => setShowFilterModal(true)}
                                    className="bg-white cursor-pointer text-main px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 40 40"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M37.5 15C37.5008 13.4484 37.0204 11.9347 36.1249 10.6675C35.2294 9.40041 33.9629 8.44221 32.5 7.925L32.5 1.5299e-06L27.5 1.31134e-06L27.5 7.925C26.0362 8.44151 24.7686 9.39935 23.872 10.6665C22.9754 11.9337 22.4939 13.4477 22.4939 15C22.4939 16.5523 22.9754 18.0664 23.872 19.3335C24.7686 20.6007 26.0362 21.5585 27.5 22.075L27.5 40L32.5 40L32.5 22.075C33.9629 21.5578 35.2294 20.5996 36.1249 19.3325C37.0204 18.0653 37.5008 16.5516 37.5 15ZM30 12.5C30.663 12.5 31.2989 12.7634 31.7678 13.2322C32.2366 13.7011 32.5 14.337 32.5 15C32.5 15.663 32.2366 16.2989 31.7678 16.7678C31.2989 17.2366 30.663 17.5 30 17.5C29.337 17.5 28.7011 17.2366 28.2322 16.7678C27.7634 16.2989 27.5 15.663 27.5 15C27.5 14.337 27.7634 13.7011 28.2322 13.2322C28.7011 12.7634 29.337 12.5 30 12.5ZM17.5 25C17.5008 23.4484 17.0204 21.9347 16.1249 20.6675C15.2294 19.4004 13.9629 18.4422 12.5 17.925L12.5 6.55672e-07L7.5 4.37115e-07L7.5 17.925C6.03617 18.4415 4.76858 19.3993 3.87197 20.6665C2.97536 21.9337 2.49387 23.4477 2.49387 25C2.49387 26.5523 2.97536 28.0663 3.87197 29.3335C4.76858 30.6007 6.03617 31.5585 7.5 32.075L7.5 40L12.5 40L12.5 32.075C13.9629 31.5578 15.2294 30.5996 16.1249 29.3325C17.0204 28.0653 17.5008 26.5516 17.5 25ZM10 22.5C10.663 22.5 11.2989 22.7634 11.7678 23.2322C12.2366 23.7011 12.5 24.337 12.5 25C12.5 25.663 12.2366 26.2989 11.7678 26.7678C11.2989 27.2366 10.663 27.5 10 27.5C9.33696 27.5 8.70108 27.2366 8.23223 26.7678C7.76339 26.2989 7.5 25.663 7.5 25C7.5 24.337 7.76339 23.7011 8.23223 23.2322C8.70108 22.7634 9.33696 22.5 10 22.5Z"
                                            fill="#4CAF50"
                                        />
                                    </svg>
                                </button>
                            )}

                            <button className="bg-white cursor-pointer text-main px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors">
                                <svg
                                    width="25"
                                    height="25"
                                    viewBox="0 0 60 60"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M50 5H10C7.25 5 5.025 7.25 5.025 10L5 55L15 45H50C52.75 45 55 42.75 55 40V10C55 7.25 52.75 5 50 5ZM42.5 35H17.5C16.125 35 15 33.875 15 32.5C15 31.125 16.125 30 17.5 30H42.5C43.875 30 45 31.125 45 32.5C45 33.875 43.875 35 42.5 35ZM42.5 27.5H17.5C16.125 27.5 15 26.375 15 25C15 23.625 16.125 22.5 17.5 22.5H42.5C43.875 22.5 45 23.625 45 25C45 26.375 43.875 27.5 42.5 27.5ZM42.5 20H17.5C16.125 20 15 18.875 15 17.5C15 16.125 16.125 15 17.5 15H42.5C43.875 15 45 16.125 45 17.5C45 18.875 43.875 20 42.5 20Z"
                                        fill="#4CAF50"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Loader />
                ) : !selectedAuction ? (
                    /* Auctions List */
                    <div className="space-y-3">
                        {auctions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {t("dashboard.auctions.noAuctions")}
                            </div>
                        ) : (
                            <div className="space-y-3 max-w-2xl mx-auto">
                                {auctions.map((auction) => {
                                    const isPast = isAuctionPast(auction.end_time);
                                    return (
                                        <div
                                            key={auction.id}
                                            onClick={() => setSelectedAuction(auction)}
                                            className={`border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${!isPast
                                                    ? "bg-main border-main text-white"
                                                    : "bg-white border-gray-200 text-gray-800"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <Calendar
                                                    className={!isPast ? "text-white" : "text-main"}
                                                    size={24}
                                                />
                                                <h3 className="font-bold text-lg">
                                                    {formatDate(auction.start_time)}
                                                </h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Auction Details */
                    <div className="space-y-6">
                        {/* Timer Section */}
                        {!isAuctionPast(selectedAuction.end_time) && (
                            <div className="bg-main rounded-3xl shadow-xl p-6 text-white">
                                <div className="text-center mb-4">
                                    <h2 className="text-xl font-bold mb-1">
                                        {timeRemaining.isOpen
                                            ? t("dashboard.auctions.timer.closing")
                                            : t("dashboard.auctions.timer.opening")}
                                    </h2>

                                </div>

                                <div className="grid grid-cols-7 gap-2 sm:gap-3 max-w-xl mx-auto">
                                    <div className="text-center">
                                        <div className="text-3xl sm:text-5xl font-bold mb-1">
                                            {String(timeRemaining.days || 0).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs opacity-80">
                                            {t("dashboard.auctions.timer.days")}
                                        </div>
                                    </div>
                                    <div className="text-center flex items-center justify-center">
                                        <span className="text-3xl sm:text-5xl font-bold mb-6">
                                            :
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl sm:text-5xl font-bold mb-1">
                                            {String(timeRemaining.hours || 0).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs opacity-80">
                                            {t("dashboard.auctions.timer.hours")}
                                        </div>
                                    </div>
                                    <div className="text-center flex items-center justify-center">
                                        <span className="text-3xl sm:text-5xl font-bold mb-6">
                                            :
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl sm:text-5xl font-bold mb-1">
                                            {String(timeRemaining.minutes || 0).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs opacity-80">
                                            {t("dashboard.auctions.timer.minutes")}
                                        </div>
                                    </div>
                                    <div className="text-center flex items-center justify-center">
                                        <span className="text-3xl sm:text-5xl font-bold mb-6">
                                            :
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl sm:text-5xl font-bold mb-1">
                                            {String(timeRemaining.seconds || 0).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs opacity-80">
                                            {t("dashboard.auctions.timer.seconds")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Participants Cards */}
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Buyers Card */}
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-3 rounded-xl">
                                                <ShoppingCart className="text-main" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {t("dashboard.auctions.cards.buyers")}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {t("dashboard.auctions.cards.registered")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-center flex-1">
                                            <div className="text-3xl font-bold text-main">
                                                {selectedAuction.buyers_count}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {t("dashboard.auctions.cards.registered")}
                                            </div>
                                        </div>
                                        <div
                                            className={`text-center flex-1 ${isRTL ? "border-l" : "border-r"
                                                } border-gray-200 ${isRTL ? "pl-4" : "pr-4"}`}
                                        >
                                            <div className="text-xl font-bold text-gray-700">
                                                {selectedAuction.max_buyers || "∞"}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {t("dashboard.auctions.cards.maxLimit")}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sellers Card */}
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-3 rounded-xl">
                                                <Users className="text-main" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {t("dashboard.auctions.cards.sellers")}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {t("dashboard.auctions.cards.registered")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-center flex-1">
                                            <div className="text-3xl font-bold text-main">
                                                {selectedAuction.sellers_count}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {t("dashboard.auctions.cards.registered")}
                                            </div>
                                        </div>
                                        <div
                                            className={`text-center flex-1 ${isRTL ? "border-l" : "border-r"
                                                } border-gray-200 ${isRTL ? "pl-4" : "pr-4"}`}
                                        >
                                            <div className="text-xl font-bold text-gray-700">
                                                {selectedAuction.max_sellers || "∞"}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {t("dashboard.auctions.cards.maxLimit")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Edit Button */}
                            {!isAuctionPast(selectedAuction.end_time) && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => openEditModal("all")}
                                        className="bg-main hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Edit2 size={18} />
                                        {t("dashboard.auctions.actions.editParticipants")}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Participants Tables */}
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                            {loadingParticipants ? (
                                <Loader />
                            ) : (
                                <div className="space-y-8">
                                    {/* Buyers Table */}
                                    {(!filters.role || filters.role === "buyer") && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <ShoppingCart className="text-main" size={20} />
                                                <h4 className="text-md font-bold text-gray-700">
                                                    {t("dashboard.auctions.cards.buyers")} (
                                                    {filteredBuyers.length})
                                                </h4>
                                            </div>

                                            {filteredBuyers.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
                                                    {t("dashboard.auctions.participantsTable.noBuyers")}
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full table-auto">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.name"
                                                                    )}
                                                                </th>
                                                                <th className="hidden md:table-cell px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.email"
                                                                    )}
                                                                </th>
                                                                <th className="px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.phone"
                                                                    )}
                                                                </th>
                                                                <th className="hidden lg:table-cell px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.joinedAt"
                                                                    )}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {filteredBuyers.map((participant) => (
                                                                <tr
                                                                    key={participant.id}
                                                                    className="hover:bg-gray-50"
                                                                >
                                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                                        {participant.user.name}
                                                                    </td>
                                                                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600 break-all">
                                                                        {participant.user.email}
                                                                    </td>
                                                                    <td
                                                                        className="px-4 py-3 text-sm text-gray-600"
                                                                        dir="ltr"
                                                                        style={{
                                                                            textAlign: isRTL ? "right" : "left",
                                                                        }}
                                                                    >
                                                                        {participant.user.phone}
                                                                    </td>
                                                                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
                                                                        {formatDateTime(participant.joined_at)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sellers Table */}
                                    {(!filters.role || filters.role === "seller") && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Users className="text-main" size={20} />
                                                <h4 className="text-md font-bold text-gray-700">
                                                    {isRTL ? "التجار" : "Traders"} (
                                                    {filteredSellers.length})
                                                </h4>
                                            </div>

                                            {filteredSellers.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
                                                    {isRTL ? "لا يوجد تجار" : "No traders"}
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full table-auto">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.name"
                                                                    )}
                                                                </th>
                                                                <th className="hidden md:table-cell px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.email"
                                                                    )}
                                                                </th>
                                                                <th className="px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.phone"
                                                                    )}
                                                                </th>
                                                                <th className="hidden lg:table-cell px-4 py-3 text-start text-xs font-bold text-gray-700 uppercase">
                                                                    {t(
                                                                        "dashboard.auctions.participantsTable.joinedAt"
                                                                    )}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {filteredSellers.map((participant) => (
                                                                <tr
                                                                    key={participant.id}
                                                                    className="hover:bg-gray-50"
                                                                >
                                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                                        {participant.user.name}
                                                                    </td>
                                                                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600 break-all">
                                                                        {participant.user.email}
                                                                    </td>
                                                                    <td
                                                                        className="px-4 py-3 text-sm text-gray-600"
                                                                        dir="ltr"
                                                                        style={{
                                                                            textAlign: isRTL ? "right" : "left",
                                                                        }}
                                                                    >
                                                                        {participant.user.phone}
                                                                    </td>
                                                                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
                                                                        {formatDateTime(participant.joined_at)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-main mb-4">
                            {isRTL ? "تصفية المشاركين" : "Filter Participants"}
                        </h3>

                        {/* Role Filter */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? "النوع" : "Role"}
                            </label>
                            <select
                                value={filters.role}
                                onChange={(e) => handleFilterChange("role", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">{isRTL ? "الكل" : "All"}</option>
                                <option value="buyer">{isRTL ? "المشترين" : "Buyers"}</option>
                                <option value="seller">{isRTL ? "التجار" : "Traders"}</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? "من تاريخ" : "From Date"}
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Date To */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? "إلى تاريخ" : "To Date"}
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    resetFilters();
                                    setShowFilterModal(false);
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                            >
                                {isRTL ? "إعادة تعيين" : "Reset"}
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 bg-main text-white py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                            >
                                {isRTL ? "تطبيق" : "Apply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionsManagement;
