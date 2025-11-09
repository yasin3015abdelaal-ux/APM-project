import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../AuthContext";
import { authAPI } from "../../api";

const Login = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        phone: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);

    // Toast
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.phone.trim()) {
            newErrors.phone = t("auth.login.phoneRequired");
        }
        
        if (!formData.password.trim()) {
            newErrors.password = t("auth.login.passwordRequired");
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast(
                t("auth.login.fillAllFields"),
                "error"
            );
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            const { token, user } = response.data.data;

            // localStorage
            localStorage.setItem("authToken", token);
            localStorage.setItem("userData", JSON.stringify(user));

            login(token, user);

            showToast(
                t("auth.login.loginSuccess"),
                "success"
            );

            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (err) {
            console.error(err);
            const errorMessage = 
                err.response?.data?.message || 
                t("auth.login.error") ;
            
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            dir={dir}
            className="min-h-screen w-full flex justify-center px-4 sm:px-6 lg:px-8"
        >
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-4 sm:top-5 ${
                        dir === "rtl" ? "left-4 sm:left-5" : "right-4 sm:right-5"
                    } z-50 animate-slide-in max-w-[90%] sm:max-w-md`}
                >
                    <div
                        className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${
                            toast.type === "success"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                        }`}
                    >
                        {toast.type === "success" ? (
                            <svg
                                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
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
                                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
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
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md  p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-main mb-4 sm:mb-6 text-center">
                    {t("auth.login.title")}
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Phone Input */}
                    <div className="mb-3 sm:mb-4">
                        <label className="block text-gray-700 mb-1.5 sm:mb-2 font-medium text-sm sm:text-base">
                            {t("auth.register.phone")}
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            dir="ltr"
                            style={{ textAlign: dir === "rtl" ? "right" : "left" }}
                            className={`w-full border rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                                errors.phone
                                    ? "border-red-500 focus:ring-red-500 focus:border-red-600"
                                    : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                            }`}
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                    </div>

                    {/* Password Input with Eye Icon */}
                    <div className="mb-2">
                        <label className="block text-gray-700 mb-1.5 sm:mb-2 font-medium text-sm sm:text-base">
                            {t("auth.login.password")}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full border rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                                    errors.password
                                        ? "border-red-500 focus:ring-red-500 focus:border-red-600"
                                        : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                style={{
                                    right: dir === "rtl" ? "auto" : "12px",
                                    left: dir === "rtl" ? "12px" : "auto"
                                }}
                            >
                                {showPassword ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="mb-3 sm:mb-4 text-left">
                        <Link
                            to="/forgot-password"
                            className="underline text-xs sm:text-sm font-bold hover:text-green-600"
                        >
                            {t("auth.login.forgotPassword")}
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                {t("auth.login.loggingIn")}
                            </span>
                        ) : (
                            t("auth.login.loginButton")
                        )}
                    </button>
                </form>

                {/* Register Link */}
                <div className="mt-4 sm:mt-6 text-center">
                    <p className="text-gray-600 text-sm sm:text-base">
                        {t("auth.login.noAccount")}{" "}
                        <Link to="/register" className="text-green-600 hover:underline font-semibold">
                            {t("auth.login.createAccount")}
                        </Link>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Login;