import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFound = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-white" dir={isRTL ? "rtl" : "ltr"}>
            <div className="text-center max-w-lg">
                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className="text-[120px] md:text-[180px] font-bold text-main leading-none">
                        404
                    </h1>
                    <div className="w-32 md:w-48 h-1 bg-main mx-auto rounded-full"></div>
                </div>

                {/* Icon */}
                <div className="mb-6">
                    <svg
                        className="w-24 h-24 md:w-32 md:h-32 mx-auto text-main opacity-80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Message */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    {isRTL ? "عذراً، الصفحة غير موجودة!" : "Oops! Page Not Found"}
                </h2>
                <p className="text-gray-600 mb-8 text-base md:text-lg">
                    {isRTL
                        ? "الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو لم تكن موجودة من الأساس."
                        : "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-white border-2 border-main text-main rounded-lg hover:bg-gray-50 transition font-semibold cursor-pointer"
                    >
                        {isRTL ? "العودة للخلف" : "Go Back"}
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-main text-white rounded-lg hover:bg-green-700 transition font-semibold cursor-pointer"
                    >
                        {isRTL ? "الذهاب للصفحة الرئيسية" : "Go to Homepage"}
                    </button>
                </div>

                {/* Additional Help */}
                <div className="mt-12 text-sm text-gray-500">
                    <p>
                        {isRTL ? "هل تحتاج مساعدة؟" : "Need help?"}{" "}
                        <button
                            onClick={() => navigate("/contact")}
                            className="text-main hover:underline font-medium cursor-pointer"
                        >
                            {isRTL ? "تواصل معنا" : "Contact us"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;