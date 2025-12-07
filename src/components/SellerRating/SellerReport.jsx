import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { userAPI } from "../../api";

const SellerReportModal = ({ isOpen, onClose, sellerId, sellerName, productId }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const [reportReasons, setReportReasons] = useState([]);
    const [selectedReason, setSelectedReason] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingReasons, setLoadingReasons] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchReportReasons();
        }
    }, [isOpen]);

    const fetchReportReasons = async () => {
        try {
            setLoadingReasons(true);
            const response = await userAPI.get("/report-reasons");
            const reasons = response.data?.data || [];
            setReportReasons(reasons);
        } catch (error) {
            console.error("Error fetching report reasons:", error);
            setError(isRTL ? "حدث خطأ في تحميل أسباب الإبلاغ" : "Error loading report reasons");
        } finally {
            setLoadingReasons(false);
        }
    };

    const resetForm = () => {
        setSelectedReason("");
        setDetails("");
        setError("");
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedReason) {
            setError(isRTL ? "من فضلك اختر سبب الإبلاغ" : "Please select a report reason");
            return;
        }

        if (details.trim().length < 10) {
            setError(isRTL ? "التفاصيل يجب أن تكون 10 أحرف على الأقل" : "Details must be at least 10 characters");
            return;
        }

        if (details.length > 500) {
            setError(isRTL ? "التفاصيل طويلة جداً (الحد الأقصى 500 حرف)" : "Details are too long (max 500 characters)");
            return;
        }

        try {
            setLoading(true);
            const data = {
                seller_id: sellerId,
                reason_id: parseInt(selectedReason),
                details: details.trim()
            };

            await userAPI.post("/seller-reports", data);

            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            console.error("Error submitting report:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError(isRTL ? "حدث خطأ أثناء إرسال الإبلاغ" : "Error submitting report");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
        >
            <div 
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                dir={isRTL ? "rtl" : "ltr"}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                    {loadingReasons ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isRTL ? "الإبلاغ عن البائع" : "Report Seller"}
                                </h2>
                                <p className="text-gray-500">{sellerName}</p>
                            </div>

                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-green-800">
                                        {isRTL ? "تم إرسال الإبلاغ بنجاح!" : "Report submitted successfully!"}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-sm text-red-800 text-center">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {isRTL ? "سبب الإبلاغ" : "Report Reason"}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {reportReasons.map((reason) => (
                                        <label
                                            key={reason.id}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                selectedReason === String(reason.id)
                                                    ? "border-red-500 bg-red-50"
                                                    : "border-gray-200 hover:border-red-300"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={reason.id}
                                                checked={selectedReason === String(reason.id)}
                                                onChange={(e) => setSelectedReason(e.target.value)}
                                                className="sr-only"
                                                disabled={loading || success}
                                            />
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                selectedReason === String(reason.id)
                                                    ? "border-red-500 bg-red-500"
                                                    : "border-gray-300"
                                            }`}>
                                                {selectedReason === String(reason.id) && (
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700 leading-tight">
                                                {isRTL ? reason.name_ar : reason.name_en}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {isRTL ? "التفاصيل" : "Details"}
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder={isRTL ? "اشرح سبب الإبلاغ بالتفصيل..." : "Explain the reason for reporting..."}
                                        className="w-full px-4 py-3 pb-8 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 transition-all resize-none text-sm bg-white"
                                        rows={4}
                                        maxLength={500}
                                        disabled={loading || success}
                                        required
                                        minLength={10}
                                    />
                                    <div className={`absolute bottom-2 text-xs ${
                                        details.length >= 10 ? "text-red-500" : "text-gray-400"
                                    } ${isRTL ? 'left-4' : 'right-4'}`}>
                                        {details.length}/500
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {isRTL ? "الحد الأدنى 10 أحرف" : "Minimum 10 characters"}
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                disabled={loading || success || !selectedReason || details.trim().length < 10}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        {isRTL ? "جاري الإرسال..." : "Submitting..."}
                                    </span>
                                ) : (
                                    isRTL ? "إرسال الإبلاغ" : "Submit Report"
                                )}
                            </button>
                        </>
                    )}
                </form>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SellerReportModal;