import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { useAdminAuth } from "../../contexts/AdminContext";
import { authAPI, adminAuthAPI, dataAPI } from "../../api";
import CustomSelect from "../Ui/CustomSelect/CustomSelect";
import { countriesFlags } from "../../data/flags";

const Login = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login: userLogin, isAuthenticated: userAuth } = useAuth();
    const { login: adminLogin, isAuthenticated: adminAuth } = useAdminAuth();

    const isAdminLogin = location.pathname.includes("/admin");
    const dir = i18n.language === "ar" ? "rtl" : "ltr";

    const [formData, setFormData] = useState({ phone: "", password: "", country_id: 1 });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        if (!isAdminLogin) {
            dataAPI.getCountries().then((res) => {
                const data = res.data?.data?.countries || res.data?.countries || [];
                setCountries(Array.isArray(data) ? data : []);
            }).catch(() => setCountries([]));
        }
    }, [isAdminLogin]);

    useEffect(() => {
        if (isAdminLogin && adminAuth) navigate("/dashboard", { replace: true });
        if (!isAdminLogin && userAuth) navigate("/", { replace: true });
    }, [isAdminLogin, adminAuth, userAuth, navigate]);

    const getCountryFlag = (country) => {
        const flagData = countriesFlags.find(f =>
            f.name_ar === country.name_ar ||
            f.name_en === country.name_en ||
            f.code?.toLowerCase() === country.code?.toLowerCase() ||
            f.id === country.id
        );
        return flagData;
    };

    const countryOptions = countries.map(c => {
        const flagData = getCountryFlag(c);
        return {
            value: c.id,
            label: flagData?.phone_code || "",
            icon: flagData?.flag ? (
                <img src={flagData.flag} alt={c.name_en} className="w-6 h-6 object-cover rounded" />
            ) : (
                <span className="text-xl">🌍</span>
            )
        };
    });

    const selectedCountry = countries.find(c => c.id === formData.country_id);
    const selectedCountryData = selectedCountry ? getCountryFlag(selectedCountry) : null;

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.phone.trim()) {
            newErrors.phone = isAdminLogin ? t("auth.login.emailRequired") : t("auth.login.phoneRequired");
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
            showToast(t("auth.login.fillAllFields"), "error");
            return;
        }

        setLoading(true);
        try {
            if (isAdminLogin) {
                const res = await adminAuthAPI.login({
                    email: formData.phone,
                    password: formData.password,
                });
                const { token, admin } = res.data.data;
                adminLogin(token, admin);
                showToast(t("auth.login.loginSuccess"));
                setTimeout(() => navigate("/dashboard"), 1000);
            } else {
                const res = await authAPI.login({
                    phone: formData.phone,
                    password: formData.password,
                });
                const { token, user } = res.data.data;
                userLogin(token, user);
                showToast(t("auth.login.loginSuccess"));
                setTimeout(() => navigate("/"), 1000);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || t("auth.login.error");
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === "ar" ? "en" : "ar";
        i18n.changeLanguage(newLang);
    };

    return (
        <div dir={dir} className="min-h-screen w-full flex justify-center px-4 sm:px-6 lg:px-8">
            {toast && (
                <div className={`fixed top-4 ${dir === "rtl" ? "left-4" : "right-4"} z-50 animate-slide-in`}>
                    <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}>
                        {toast.type === "success" ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md p-8">
                {isAdminLogin && (
                    <button
                        onClick={toggleLanguage}
                        className="mb-4 px-3 py-1.5 cursor-pointer rounded-md bg-main text-white hover:bg-green-700"
                    >
                        {i18n.language === "ar" ? "EN" : "ع"}
                    </button>
                )}

                <h2 className="text-2xl font-bold text-main mb-6 text-center">
                    {t("auth.login.title")}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2 font-medium">
                            {isAdminLogin ? t("auth.login.email") : t("auth.login.phone")}
                        </label>
                        {!isAdminLogin ? (
                            <div className="flex gap-2" dir="ltr">
                                <div className="w-48 md:w-36">
                                    <CustomSelect
                                        options={countryOptions}
                                        value={formData.country_id}
                                        onChange={(value) => setFormData(prev => ({ ...prev, country_id: value }))}
                                        placeholder="+20"
                                        isRTL={false}
                                    />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder={t("auth.login.phone")}
                                    dir="ltr"
                                    style={{ textAlign: dir === "rtl" ? "right" : "left" }}
                                    className={`border w-39 md:flex-1 rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                                        }`}
                                />
                            </div>
                        ) : (
                            <input
                                type="email"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={t("auth.login.email")}
                                dir="ltr"
                                style={{ textAlign: 'left' }}
                                className={`w-full border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                                    }`}
                            />
                        )}
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div className="mb-2">
                        <label className="block text-gray-700 mb-2 font-medium">
                            {t("auth.login.password")}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={t("auth.login.password")}
                                className={`w-full border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute cursor-pointer top-1/2 transform -translate-y-1/2 text-gray-500"
                                style={{ [dir === "rtl" ? "left" : "right"]: "12px" }}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    {!isAdminLogin && (
                        <div className="mb-4 text-left">
                            <Link to="/forgot-password" className="text-sm font-bold underline hover:text-green-600">
                                {t("auth.login.forgotPassword")}
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full cursor-pointer bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {t("auth.login.loggingIn")}
                            </span>
                        ) : (
                            t("auth.login.loginButton")
                        )}
                    </button>
                </form>

                {!isAdminLogin && (
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            {t("auth.login.noAccount")}{" "}
                            <Link to="/register" className="text-green-600 hover:underline font-semibold">
                                {t("auth.login.createAccount")}
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;