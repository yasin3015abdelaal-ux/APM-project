import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI, dataAPI } from "../../api";

const Register = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [countries, setCountries] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        country_id: "",
        name: "",
        phone: "",
        email: "",
        governorate_id: "",
        address: "",
        password: "",
        password_confirmation: "",
        gender: "male",
        type: "individual",
        activity_type_id: "",
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        dataAPI
            .getCountries()
            .then((res) => {
                const data = res.data?.data?.countries || res.data?.countries || [];
                setCountries(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Error fetching countries:", err);
                setCountries([]);
            });
    }, []);

    useEffect(() => {
        if (formData.country_id) {
            dataAPI
                .getGovernorates(formData.country_id)
                .then((res) => {
                    const data = res.data?.data?.governorates || res.data?.governorates || [];
                    setGovernorates(Array.isArray(data) ? data : []);
                })
                .catch((err) => {
                    console.error("Error fetching governorates:", err);
                    setGovernorates([]);
                });
        } else {
            setGovernorates([]);
            setFormData((prev) => ({ ...prev, governorate_id: "" }));
        }
    }, [formData.country_id]);

    useEffect(() => {
        dataAPI
            .getActivityTypes()
            .then((res) => {
                const data = res.data?.data?.activities || res.data?.activities || res.data?.data || [];
                setActivities(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Error fetching activities:", err);
                setActivities([]);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.country_id) {
            newErrors.country_id = t("auth.register.countryRequired");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        } else {
            showToast(t("auth.register.selectCountry"), "error");
        }
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t("auth.register.nameRequired");
        }
        if (!formData.phone.trim()) {
            newErrors.phone = t("auth.register.phoneRequired");
        }
        if (!formData.governorate_id) {
            newErrors.governorate_id = t("auth.register.governorateRequired");
        }
        if (!formData.activity_type_id) {
            newErrors.activity_type_id = t("auth.register.activityRequired");
        }
        if (!formData.address.trim()) {
            newErrors.address = t("auth.register.addressRequired");
        }
        if (!formData.password.trim()) {
            newErrors.password = t("auth.register.passwordRequired");
        } else if (formData.password.length < 8) {
            newErrors.password = t("auth.register.passwordLength");
        }
        if (!formData.password_confirmation.trim()) {
            newErrors.password_confirmation = t("auth.register.confirmPasswordRequired");
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = t("auth.register.passwordMismatch");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep2()) {
            showToast(t("auth.register.fillAllFields"), "error");
            return;
        }

        setLoading(true);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach((key) => {
                submitData.append(key, formData[key]);
            });
            if (profileImage) {
                submitData.append("profile_image", profileImage);
            }

            await authAPI.register(submitData);
            showToast(t("auth.register.successMessage"), "success");
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || t("auth.register.error");
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div dir={dir} className="min-h-screen w-full flex items-center justify-center mb-5">
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${dir === "rtl" ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
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

            <div className="w-full max-w-2xl">
                <div className="flex justify-center mb-6">
                    <div className={`w-3 h-3 rounded-full mx-2 transition-colors ${step === 1 ? "bg-main" : "bg-gray-300"}`}></div>
                    <div className={`w-3 h-3 rounded-full mx-2 transition-colors ${step === 2 ? "bg-main" : "bg-gray-300"}`}></div>
                </div>

                {step === 1 && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-green-600 mb-6 text-center">
                            {t("auth.register.selectCountry")}
                        </h2>

                        <div>
                            <label className="block text-gray-700 mb-2 font-medium text-sm">
                                {t("auth.register.selectCountry")}
                            </label>
                            <select
                                name="country_id"
                                value={formData.country_id}
                                onChange={handleChange}
                                className={`w-full border rounded-xl p-3 text-sm focus:outline-none border-main focus:ring-2 ${errors.country_id ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`}
                            >
                                <option value="">{t("auth.register.selectCountry")}</option>
                                {countries.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {i18n.language === "ar" ? c.name_ar : c.name_en}
                                    </option>
                                ))}
                            </select>
                            {errors.country_id && <p className="text-red-500 text-xs mt-1">{errors.country_id}</p>}
                        </div>

                        <button
                            disabled={!formData.country_id}
                            onClick={handleNextStep}
                            className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {t("auth.register.next")}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl sm:text-2xl font-bold text-green-600 mb-6 text-center">
                            {t("auth.register.title")}
                        </h2>
                        <div>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="type" value="individual" checked={formData.type === "individual"} onChange={handleChange} className="w-4 h-4 cursor-pointer accent-green-600" />
                                    <span className="text-sm">{t("auth.register.individual")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="type" value="organization" checked={formData.type === "organization"} onChange={handleChange} className="w-4 h-4 cursor-pointer accent-green-600" />
                                    <span className="text-sm">{t("auth.register.organization")}</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                    {profileImagePreview ? (
                                        <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>
                                <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700 transition">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </label>
                                <input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-600 mb-6">
                            {t("auth.register.uploadProfileImage")}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.name")}</label>
                                <input name="name" value={formData.name} onChange={handleChange} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`} />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.email")}</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-main" />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.phone")}</label>
                                <input name="phone" type="tel" value={formData.phone} onChange={handleChange} dir="ltr" style={{ textAlign: dir === "rtl" ? "right" : "left" }} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`} />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.address")}</label>
                                <input name="address" value={formData.address} onChange={handleChange} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`} />
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>


                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.activityType")}</label>
                                <select name="activity_type_id" value={formData.activity_type_id} onChange={handleChange} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.activity_type_id ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`}>
                                    <option value="">{t("auth.register.activityType")}</option>
                                    {activities.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {i18n.language === "ar" ? a.name_ar || a.name : a.name_en || a.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.activity_type_id && <p className="text-red-500 text-xs mt-1">{errors.activity_type_id}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.governorate")}</label>
                                <select name="governorate_id" value={formData.governorate_id} onChange={handleChange} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.governorate_id ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`}>
                                    <option value="">{t("auth.register.governorate")}</option>
                                    {governorates.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {i18n.language === "ar" ? g.name_ar : g.name_en}
                                        </option>
                                    ))}
                                </select>
                                {errors.governorate_id && <p className="text-red-500 text-xs mt-1">{errors.governorate_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.password")}</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" style={{ right: dir === "rtl" ? "auto" : "10px", left: dir === "rtl" ? "10px" : "auto" }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                                        </svg>
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.passwordConfirmation")}</label>
                                <div className="relative">
                                    <input type={showConfirmPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.password_confirmation ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-main"}`} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" style={{ right: dir === "rtl" ? "auto" : "10px", left: dir === "rtl" ? "10px" : "auto" }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showConfirmPassword ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                                        </svg>
                                    </button>
                                </div>
                                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition font-semibold">
                                {t("auth.register.back") || "رجوع"}
                            </button>
                            <button type="submit" disabled={loading} className="w-2/3 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t("auth.register.creating")}
                                    </span>
                                ) : (
                                    t("auth.register.createButton")
                                )}
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                                {t("auth.register.haveAccount")}{" "}
                                <Link to="/login" className="text-green-600 hover:underline font-semibold">
                                    {t("auth.register.loginLink")}
                                </Link>
                            </p>
                        </div>
                    </form>
                )}
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

export default Register;