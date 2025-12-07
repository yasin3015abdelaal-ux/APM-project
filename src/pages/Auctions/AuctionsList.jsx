import { useState, useEffect } from "react";
import { Calendar, Edit2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { auctionAPI, getCachedAuctions } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const AuctionsList = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

const fetchAuctions = async () => {
    setLoading(true);
    try {
        const { data, fromCache } = await getCachedAuctions();
        console.log(fromCache ? '📦 Auctions من الكاش' : '🌐 Auctions من API');
        
        const sortedAuctions = data.sort((a, b) => {
            return new Date(b.start_time) - new Date(a.start_time);
        });
        setAuctions(sortedAuctions);
    } catch (error) {
        console.error("Error fetching auctions:", error);
        showToast(
            isRTL ? "حدث خطأ في تحميل المزادات" : "Error loading auctions",
            "error"
        );
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchAuctions();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const dayName = date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
            weekday: "long",
        });
        const fullDate = date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        
        return { dayName, fullDate };
    };

    const isAuctionOpen = (startTime, endTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        return now >= start && now <= end;
    };

    const isAuctionFuture = (startTime) => {
        return new Date(startTime) > new Date();
    };

    const isAuctionPast = (endTime) => {
        return new Date(endTime) < new Date();
    };

    const getAuctionStatus = (auction) => {
        if (isAuctionOpen(auction.start_time, auction.end_time)) {
            return {
                status: "open",
                text: isRTL ? "مفتوح" : "Open",
                color: "bg-main border-main text-white"
            };
        } else if (isAuctionFuture(auction.start_time)) {
            return {
                status: "future", 
                text: isRTL ? "قادم" : "Upcoming",
                color: "bg-main border-main text-white"
            };
        } else {
            return {
                status: "past",
                text: isRTL ? "منتهي" : "Closed", 
                color: "bg-white border-gray-200 text-gray-800"
            };
        }
    };

    const handleButtonClick = (auction) => {
        const status = getAuctionStatus(auction);
        
        console.log("=== AuctionsList Navigation Debug ===");
        console.log("Selected auction:", auction);
        console.log("Auction ID:", auction.id);
        console.log("Auction status:", status.status);
        console.log("====================================");
        
        if (status.status === "open" || status.status === "future") {
            navigate('/auction-products', { 
                state: { 
                    auction: auction,
                    auctionId: auction.id,
                    isPastAuction: false
                } 
            });
        } else {
            navigate('/auction-products', { 
                state: { 
                    auction: auction,
                    auctionId: auction.id,
                    isPastAuction: true
                } 
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-20" : "right-4"} z-50 animate-fade-in`}>
                    <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
                        toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"
                    }`}>
                        {toast.type === "success" ? (
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <div className="mb-5">
                    <h1 className="text-xl font-bold text-main text-center">
                        {isRTL ? "قائمة المزادات" : "Auctions List"}
                    </h1>
                </div>

                {loading ? (
                    <Loader />
                ) : auctions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-white rounded-2xl border-2 border-gray-200">
                        <p className="text-base">
                            {isRTL ? "لا توجد مزادات متاحة" : "No auctions available"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {auctions.map((auction) => {
                            const status = getAuctionStatus(auction);
                            const { dayName, fullDate } = formatDate(auction.start_time);
                            const canEdit = status.status === "future" || status.status === "open";
                            
                            return (
                                <div
                                    key={auction.id}
                                    className={`border-2 rounded-2xl p-5 transition-all hover:shadow-md ${status.color}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar
                                                className={status.status !== "past" ? "text-white" : "text-main"}
                                                size={24}
                                            />
                                            <div className="flex">
                                                <h3 className="font-bold text-base">{dayName}</h3>
                                                <p className={`text-sm ${status.status !== "past" ? "text-white opacity-90" : "text-gray-500"}`}>
                                                    {", "}{fullDate}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleButtonClick(auction)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                                status.status !== "past" 
                                                    ? "bg-white text-main hover:bg-green-50" 
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            } cursor-pointer`}
                                        >
                                            {canEdit ? (
                                                <>
                                                    <Edit2 size={16} />
                                                    {isRTL ? "تعديل" : "Edit"}
                                                </>
                                            ) : (
                                                <>
                                                    <Eye size={16} />
                                                    {isRTL ? "عرض" : "View"}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctionsList;