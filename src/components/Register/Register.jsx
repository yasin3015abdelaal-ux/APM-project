import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { authAPI, dataAPI } from "../../api";
import CustomSelect from "../Ui/CustomSelect/CustomSelect";
import { countriesFlags } from "../../data/flags";

const Modal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" dir="rtl">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={24} />
                    </button>
                </div>
                <p className="text-gray-600 mb-6 text-sm">{message}</p>
                <div className="flex gap-3">
                    <button onClick={() => onConfirm(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold cursor-pointer">
                        لا
                    </button>
                    <button onClick={() => onConfirm(true)} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold cursor-pointer">
                        نعم
                    </button>
                </div>
            </div>
        </div>
    );
};

const Register = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [countries, setCountries] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [activities, setActivities] = useState([]);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [formData, setFormData] = useState({
        country_id: "",
        name: "",
        phone: "",
        email: "",
        governorate_id: "",
        address: "",
        password: "",
        password_confirmation: "",
        type: "individual",
        activity_type_id: "",
        commercial_register: "",
        tax_number: "",
    });

    useEffect(() => {
        dataAPI.getCountries().then((res) => {
            const data = res.data?.data?.countries || res.data?.countries || [];
            setCountries(Array.isArray(data) ? data : []);
        }).catch(() => setCountries([]));
    }, []);

    useEffect(() => {
        if (formData.country_id) {
            dataAPI.getGovernorates(formData.country_id).then((res) => {
                const data = res.data?.data?.governorates || res.data?.governorates || [];
                setGovernorates(Array.isArray(data) ? data : []);
            }).catch(() => setGovernorates([]));
        } else {
            setGovernorates([]);
            setFormData(prev => ({ ...prev, governorate_id: "" }));
        }
    }, [formData.country_id]);

    useEffect(() => {
        dataAPI.getActivityTypes().then((res) => {
            const data = res.data?.data?.activities || res.data?.activities || res.data?.data || [];
            setActivities(Array.isArray(data) ? data : []);
        }).catch(() => setActivities([]));
    }, []);

    const getCountryFlag = (country) => {
        const flagData = countriesFlags.find(f =>
            f.name_ar === country.name_ar ||
            f.name_en === country.name_en ||
            f.code?.toLowerCase() === country.code?.toLowerCase() ||
            f.id === country.id
        );
        return flagData?.flag;
    };

    const countryOptions = countries.map(c => {
        const flagData = countriesFlags.find(f =>
            f.code?.toLowerCase() === c.code?.toLowerCase() ||
            f.id === c.id
        );

        return {
            value: c.id,
            label: i18n.language === "ar" ? c.name_ar : c.name_en,
            icon: flagData?.flag ? (
                <img src={flagData.flag} alt={c.name_en} className="w-6 h-6 object-cover rounded" />
            ) : (
                <span className="text-xl">🌍</span>
            ),
            phoneCode: flagData?.phone_code || ""  // ✅ هنا جبنا الكود من countriesFlags
        };
    });

    const governorateOptions = governorates.map(g => ({
        value: g.id,
        label: i18n.language === "ar" ? g.name_ar : g.name_en
    }));

    const activityOptions = activities.map(a => ({
        value: a.id,
        label: i18n.language === "ar" ? (a.name_ar || a.name) : (a.name_en || a.name)
    }));

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast(t("auth.register.invalidImageType") || "نوع الصورة غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WEBP", "error");
                return;
            }

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                showToast(t("auth.register.imageTooLarge") || "حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت", "error");
                return;
            }

            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfileImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setProfileImagePreview(null);
        const fileInput = document.getElementById('profile-image');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const validateStep1 = () => {
        if (!formData.country_id) {
            setErrors({ country_id: t("auth.register.countryRequired") });
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = t("auth.register.nameRequired");
        if (!formData.email.trim()) newErrors.email = t("auth.register.emailRequired");
        if (!formData.phone.trim()) newErrors.phone = t("auth.register.phoneRequired");
        if (!formData.governorate_id) newErrors.governorate_id = t("auth.register.governorateRequired");
        if (!formData.activity_type_id) newErrors.activity_type_id = t("auth.register.activityRequired");
        if (!formData.address.trim()) newErrors.address = t("auth.register.addressRequired");
        if (!formData.password.trim()) newErrors.password = t("auth.register.passwordRequired");
        else if (formData.password.length < 8) newErrors.password = t("auth.register.passwordLength");
        if (!formData.password_confirmation.trim()) newErrors.password_confirmation = t("auth.register.confirmPasswordRequired");
        else if (formData.password !== formData.password_confirmation) newErrors.password_confirmation = t("auth.register.passwordMismatch");

        if (formData.type === "organization") {
            if (!formData.commercial_register.trim()) newErrors.commercial_register = t("auth.register.commercialRegisterRequired");
            if (!formData.tax_number.trim()) newErrors.tax_number = t("auth.register.taxNumberRequired");
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            showToast(t("auth.register.agreeToTermsError") || "يجب الموافقة على الشروط والأحكام", "error");
            return;
        }

        if (!validateStep2()) {
            showToast(t("auth.register.fillAllFields"), "error");
            return;
        }

        const activityIndex = activities.findIndex(a => a.id === formData.activity_type_id);
        if (activityIndex >= 0 && activityIndex <= 2) {
            setShowModal(true);
        } else {
            handleFinalSubmit(0);
        }
    };

    const handleModalConfirm = async (canEnterPrices) => {
        setShowModal(false);
        handleFinalSubmit(canEnterPrices ? 1 : 0);
    };

    const handleFinalSubmit = async (verifiedAccount) => {
        setLoading(true);
        try {
            const submitData = new FormData();

            Object.keys(formData).forEach((key) => {
                if (formData[key] !== "" && formData[key] !== null) {
                    submitData.append(key, formData[key]);
                }
            });

            submitData.append("verified_account", verifiedAccount);

            if (profileImage) {
                submitData.append("profile_image", profileImage);
            }

            const response = await authAPI.register(submitData);

            if (verifiedAccount === 1) {
                showToast(t("auth.register.verifiedAccountSuccess") || "تم إنشاء حسابك بنجاح وإضافتك كتاجر معتمد", "success");
            } else {
                showToast(t("auth.register.successMessage") || "تم إنشاء الحساب بنجاح", "success");
            }

            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || t("auth.register.error");
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const selectedCountry = countries.find(c => c.id === formData.country_id);
    const selectedCountryFlag = selectedCountry ? getCountryFlag(selectedCountry) : null;
    const selectedCountryData = countriesFlags.find(f =>
        f.code?.toLowerCase() === selectedCountry?.code?.toLowerCase() ||
        f.id === selectedCountry?.id
    );
    return (
        <div dir={dir} className="min-h-screen w-full flex items-center justify-center p-6 bg-gray-50">
            {toast && (
                <div className={`fixed top-4 z-50 max-w-md ${dir === "rtl" ? "left-4" : "right-4"}`}>
                    <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleModalConfirm} title={t("auth.register.verificationTitle")} message={t("auth.register.verificationMessage")} />

            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
                <div className="flex justify-center mb-6">
                    <div className={`w-3 h-3 rounded-full mx-2 transition-colors ${step === 1 ? "bg-green-600" : "bg-gray-300"}`}></div>
                    <div className={`w-3 h-3 rounded-full mx-2 transition-colors ${step === 2 ? "bg-green-600" : "bg-gray-300"}`}></div>
                </div>

                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-green-600 mb-6 text-center">{t("auth.register.selectCountry")}</h2>
                        <CustomSelect options={countryOptions} value={formData.country_id} onChange={(value) => handleChange('country_id', value)} placeholder={t("auth.register.selectCountry")} isRTL={dir === "rtl"} error={errors.country_id} />
                        <button disabled={!formData.country_id} onClick={handleNextStep} className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer">
                            {t("auth.register.next")}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-2xl font-bold text-green-600 mb-6 text-center">{t("auth.register.title")}</h2>

                        <div className="flex gap-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" value="individual" checked={formData.type === "individual"} onChange={(e) => handleChange('type', e.target.value)} className="w-4 h-4 cursor-pointer accent-green-600" />
                                <span className="text-sm">{t("auth.register.individual")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" value="organization" checked={formData.type === "organization"} onChange={(e) => handleChange('type', e.target.value)} className="w-4 h-4 cursor-pointer accent-green-600" />
                                <span className="text-sm">{t("auth.register.organization")}</span>
                            </label>
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className="relative w-32 h-32">
                                <div className="w-full h-full rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                    {profileImagePreview ? (
                                        <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>

                                {profileImagePreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className={`absolute bg-red-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-red-600 transition shadow-lg z-10 ${dir === "rtl" ? "top-0 right-0" : "top-0 left-0"}`}
                                        title={t("auth.register.removeImage") || "إزالة الصورة"}
                                    >
                                        <X size={16} />
                                    </button>
                                )}

                                <label htmlFor="profile-image" className={`absolute bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700 transition shadow-lg ${dir === "rtl" ? "bottom-0 left-0" : "bottom-0 right-0"}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </label>
                                <input id="profile-image" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-600 mb-6">
                            {t("auth.register.uploadProfileImage")}
                            <span className="block text-xs text-gray-500 mt-1">
                                {t("auth.register.imageRequirements") || "الصيغ المدعومة: JPG, PNG, GIF, WEBP (حد أقصى 5 ميجابايت)"}
                            </span>
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.name")} *</label>
                                <input name="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder={t("auth.register.name")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.email")} *</label>
                                <input name="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder={t("auth.register.email")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.phone")} *</label>
                                <div className="relative">
                                    {selectedCountryFlag && (
                                        <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 bg-gray-100 rounded-l-lg border-r-2 border-gray-300 pointer-events-none z-10">
                                            <img src={selectedCountryFlag} alt="flag" className="w-6 h-6 object-cover rounded flex-shrink-0" />
                                        </div>
                                    )}
                                    <div className="absolute left-14 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                                        <span className="font-semibold text-sm text-gray-700">
                                            {countriesFlags.find(f =>
                                                f.code?.toLowerCase() === selectedCountry?.code?.toLowerCase() ||
                                                f.id === selectedCountry?.id
                                            )?.phone_code}
                                        </span>
                                    </div>
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder={t("auth.register.phone")}
                                        dir="ltr"
                                        className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                                        style={{ paddingLeft: '95px', textAlign: 'left' }}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.governorate")} *</label>
                                <CustomSelect options={governorateOptions} value={formData.governorate_id} onChange={(value) => handleChange('governorate_id', value)} placeholder={t("auth.register.governorate")} isRTL={dir === "rtl"} error={errors.governorate_id} />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.address")} *</label>
                                <input name="address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder={t("auth.register.address")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.activityType")} *</label>
                                <CustomSelect options={activityOptions} value={formData.activity_type_id} onChange={(value) => handleChange('activity_type_id', value)} placeholder={t("auth.register.activityType")} isRTL={dir === "rtl"} error={errors.activity_type_id} />
                            </div>

                            {formData.type === "organization" && (
                                <>
                                    <div>
                                        <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.commercialRegister")} *</label>
                                        <input name="commercial_register" value={formData.commercial_register} onChange={(e) => handleChange('commercial_register', e.target.value)} placeholder={t("auth.register.commercialRegister")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.commercial_register ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                        {errors.commercial_register && <p className="text-red-500 text-xs mt-1">{errors.commercial_register}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.taxNumber")} *</label>
                                        <input name="tax_number" value={formData.tax_number} onChange={(e) => handleChange('tax_number', e.target.value)} placeholder={t("auth.register.taxNumber")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.tax_number ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                        {errors.tax_number && <p className="text-red-500 text-xs mt-1">{errors.tax_number}</p>}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.password")} *</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} placeholder={t("auth.register.password")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer" style={{ right: dir === "rtl" ? "auto" : "10px", left: dir === "rtl" ? "10px" : "auto" }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                                        </svg>
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1.5 font-medium text-sm">{t("auth.register.passwordConfirmation")} *</label>
                                <div className="relative">
                                    <input type={showConfirmPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation} onChange={(e) => handleChange('password_confirmation', e.target.value)} placeholder={t("auth.register.passwordConfirmation")} className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 ${errors.password_confirmation ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer" style={{ right: dir === "rtl" ? "auto" : "10px", left: dir === "rtl" ? "10px" : "auto" }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showConfirmPassword ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                                        </svg>
                                    </button>
                                </div>
                                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                            </div>
                        </div>

                        <div className="mt-6 flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms-checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="w-4 h-4 mt-0.5 cursor-pointer accent-green-600 flex-shrink-0"
                            />
                            <label htmlFor="terms-checkbox" className="text-sm text-gray-600 cursor-pointer">
                                {t("auth.register.agreeToTerms") || "أوافق على"}{" "}
                                <Link
                                    to="/terms-and-conditions"
                                    target="_blank"
                                    className="text-green-600 hover:underline font-semibold"
                                >
                                    {t("auth.register.termsLink") || "سياسة الخصوصية والشروط والأحكام"}
                                </Link>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition font-semibold cursor-pointer">
                                {t("auth.register.back")}
                            </button>
                            <button type="submit" disabled={loading || !agreedToTerms} className="w-2/3 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm cursor-pointer">
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

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                {t("auth.register.haveAccount")}{" "}
                                <Link to="/login" className="text-green-600 hover:underline font-semibold cursor-pointer">
                                    {t("auth.register.loginLink")}
                                </Link>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;