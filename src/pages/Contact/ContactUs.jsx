import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { MessageCircle, AlertCircle, HelpCircle, Mail, Send, CheckCircle2 } from "lucide-react";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const ContactUs = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
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

    useEffect(() => {
        if (location.state?.selectedType) {
            setForm(prev => ({
                ...prev,
                type: location.state.selectedType
            }));
            
            if (location.state?.productId) {
                const productInfo = location.state.productName 
                    ? `\n\nالمنتج: ${location.state.productName} (رقم: ${location.state.productId})`
                    : `\n\nرقم المنتج: ${location.state.productId}`;
                
                setForm(prev => ({
                    ...prev,
                    message: `أريد الإبلاغ عن إعلان${productInfo}\nالسبب: `
                }));
            }
        }
    }, [location.state]);

    const messageTypes = [
        { 
            value: "suggestion", 
            label: t("contact.suggestion"),
            icon: <HelpCircle className="w-4 h-4" />,
        },
        { 
            value: "complaint", 
            label: t("contact.complaint"),
            icon: <AlertCircle className="w-4 h-4" />,
        },
        { 
            value: "subscription_issue", 
            label: t("contact.subscriptionIssue"),
            icon: <Mail className="w-4 h-4" />,
        },
        { 
            value: "other", 
            label: t("contact.other"),
            icon: <MessageCircle className="w-4 h-4" />,
        },
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
        <div className={`w-full mx-auto px-4 py-6 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in max-w-sm`}>
                    <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                        toast.type === "success" 
                            ? "bg-main text-white" 
                            : "bg-red-500 text-white"
                    }`}>
                        {toast.type === "success" ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="text-sm">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-6 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-main mb-1">
                    {t("contact.contactUs")}
                </h1>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-4xl mx-auto">
                <div className="space-y-6">
                    {/* Message Type Selection */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-3 text-sm">
                            {isRTL ? "نوع الرسالة" : "Message Type"}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {messageTypes.map((type) => (
                                <label
                                    key={type.value}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                                        form.type === type.value
                                            ? "border-main bg-green-50"
                                            : "border-gray-300 hover:border-main"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type.value}
                                        checked={form.type === type.value}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="sr-only"
                                    />
                                    <div className={`p-1.5 rounded ${
                                        form.type === type.value ? "bg-main text-white" : "bg-gray-100 text-gray-600"
                                    }`}>
                                        {type.icon}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 text-wrap truncate">
                                        {type.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Message Field */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2 text-sm">
                            {t("contact.message")}
                        </label>
                        <div className="relative">
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                rows="6"
                                required
                                minLength={10}
                                placeholder={isRTL ? "اكتب رسالتك هنا..." : "Write your message here..."}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent resize-none text-sm"
                            />
                            <div className={`absolute bottom-3 ${isRTL ? "left-4" : "right-4"} text-xs ${
                                form.message.length >= 10 ? "text-main" : "text-gray-400"
                            }`}>
                                {form.message.length}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !form.type || form.message.trim().length < 10}
                        className="w-full bg-main hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? (isRTL ? "جاري الإرسال..." : "Sending...") : t("contact.submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;