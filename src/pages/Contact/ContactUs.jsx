import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, AlertCircle, HelpCircle, Mail } from "lucide-react";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const ContactUs = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    
    const [form, setForm] = useState({
        type: "",
        message: "",
    });

    const messageTypes = [
        { value: "suggestion", label: t("contact.suggestion") },
        { value: "complaint", label: t("contact.complaint") },
        { value: "subscription_issue", label: t("contact.subscriptionIssue") },
        { value: "other", label: t("contact.other")},
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.type || !form.message) {
            showToast(isRTL ? "جميع الحقول مطلوبة" : "All fields are required", "error");
            return;
        }

        if (form.message.trim().length < 10) {
            showToast(isRTL ? "الرسالة يجب أن تكون 10 أحرف على الأقل" : "Message must be at least 10 characters", "error");
            return;
        }

        setLoading(true);
        try {
            await userAPI.post("/contact-messages", {
                type: form.type,
                message: form.message.trim()
            });
            showToast(isRTL ? "تم إرسال رسالتك بنجاح!" : "Message submitted successfully!", "success");
            setForm({ type: "", message: "" });
        } catch (err) {
            console.error("Error details:", err.response?.data);
            const errorMsg = err.response?.data?.message || (isRTL ? "حدث خطأ أثناء إرسال الرسالة" : "Error submitting message");
            showToast(errorMsg, "error");
        }
        setLoading(false);
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className={`w-full max-w-5xl mx-auto bg-white ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="text-main text-center py-4 rounded-t-lg">
                <h1 className="text-3xl font-bold">{t("contact.contactUs")}</h1>
            </div>

            <div className="p-8 space-y-6">
                {/* Message Type Selection */}
                <div>
                    <div className="flex flex-wrap gap-6 justify-center">
                        {messageTypes.map((type) => (
                            <label
                                key={type.value}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value={type.value}
                                    checked={form.type === type.value}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-4 h-4 text-main cursor-pointer"
                                />
                                <span className="font-medium text-gray-700">{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Message Field */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {t("contact.message")}
                    </label>
                    <textarea
                        name="message"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        rows="8"
                        required
                        minLength={10}
                        placeholder={isRTL ? "اكتب رسالتك هنا (10 أحرف على الأقل)" : "Write your message here (minimum 10 characters)"}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                </div>

                <div className="pt-6">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full cursor-pointer bg-main hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {loading ? (isRTL ? "جاري الإرسال..." : "Sending...") : t("contact.submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;