import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI, dataAPI } from "../../api";
import { Camera, Save, ArrowLeft } from "lucide-react";
import Loader from "../../components/Ui/Loader/Loader";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect"; 

const EditProfilePage = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [countries, setCountries] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loadingGovernorates, setLoadingGovernorates] = useState(false);

    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        country_id: "",
        governorate_id: "",
        password: "",
        password_confirmation: "",
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userAPI.get("/profile");
                const userData = res.data.data.user;

                setProfile(userData);
                setImagePreview(userData.image);

                const countriesRes = await dataAPI.getCountries();
                const countriesData =
                    countriesRes.data?.data?.countries ||
                    countriesRes.data?.countries ||
                    [];
                setCountries(Array.isArray(countriesData) ? countriesData : []);

                if (userData.governorate?.country_id || userData.country?.id) {
                    const countryId =
                        userData.governorate?.country_id || userData.country?.id;
                    const govRes = await dataAPI.getGovernorates(countryId);
                    const govData =
                        govRes.data?.data?.governorates || govRes.data?.governorates || [];
                    setGovernorates(Array.isArray(govData) ? govData : []);
                }

                setFormData({
                    name: userData.name || "",
                    email: userData.email || "",
                    country_id:
                        userData.governorate?.country_id || userData.country?.id || "",
                    governorate_id: userData.governorate?.id || "",
                    password: "",
                    password_confirmation: "",
                });
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(t("profile.error"));
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [t]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleCountryChange = (value) => {
        setFormData({
            ...formData,
            country_id: value,
            governorate_id: "",
        });
        
        if (value) {
            fetchGovernorates(value);
        } else {
            setGovernorates([]);
        }
    };

    const handleGovernorateChange = (value) => {
        setFormData({
            ...formData,
            governorate_id: value,
        });
    };

    const fetchGovernorates = async (countryId) => {
        try {
            setLoadingGovernorates(true);
            const res = await dataAPI.getGovernorates(countryId);
            const govData =
                res.data?.data?.governorates || res.data?.governorates || [];
            setGovernorates(Array.isArray(govData) ? govData : []);
        } catch (err) {
            console.error("Error fetching governorates:", err);
            showToast(
                isRTL ? "حدث خطأ في جلب المحافظات" : "Error fetching governorates",
                "error"
            );
            setGovernorates([]);
        } finally {
            setLoadingGovernorates(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                showToast(
                    isRTL ? "يرجى اختيار صورة فقط" : "Please select an image file only",
                    "error"
                );
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showToast(
                    isRTL
                        ? "حجم الصورة كبير جداً (الحد الأقصى 5MB)"
                        : "Image size too large (max 5MB)",
                    "error"
                );
                return;
            }

            setImageFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password confirmation
        if (formData.password && formData.password !== formData.password_confirmation) {
            showToast(
                isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match",
                "error"
            );
            return;
        }

        setSaving(true);
        try {
            const formDataToSend = new FormData();
            
            // ✅ CRITICAL: Add _method for Laravel PUT request
            formDataToSend.append("_method", "put");
            
            // Add required fields
            formDataToSend.append("name", formData.name);

            if (formData.governorate_id) {
                formDataToSend.append("governorate_id", formData.governorate_id);
            }

            if (formData.password) {
                formDataToSend.append("password", formData.password);
                formDataToSend.append("password_confirmation", formData.password_confirmation);
            }

            // ✅ Add image if selected
            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            // Debug: Log FormData contents
            console.log("=== FormData Contents ===");
            for (let pair of formDataToSend.entries()) {
                console.log(pair[0] + ':', pair[1]);
            }

            // ✅ Use POST instead of PUT (Laravel requirement for FormData)
            await userAPI.post("/profile", formDataToSend);

            showToast(
                isRTL ? "تم حفظ التعديلات بنجاح" : "Changes saved successfully"
            );

            setTimeout(() => {
                navigate("/profile");
            }, 1500);
        } catch (err) {
            console.error("Error updating profile:", err);
            console.error("Error response:", err.response?.data);
            const errorMessage = err.response?.data?.message || 
                (isRTL ? "حدث خطأ أثناء حفظ التعديلات" : "An error occurred while saving changes");
            showToast(errorMessage, "error");
        } finally {
            setSaving(false);
        }
    };

    const countryOptions = countries.map((country) => ({
        value: country.id,
        label: isRTL ? country.name_ar : country.name_en,
    }));

    const governorateOptions = governorates.map((gov) => ({
        value: gov.id,
        label: isRTL ? gov.name_ar : gov.name_en,
    }));

    if (loading) return <Loader />;

    if (error)
        return (
            <div className="flex items-center justify-center h-screen text-red-500 font-semibold">
                {error}
            </div>
        );

    return (
        <div dir={dir} className="min-h-screen bg-gray-50 py-8 px-4">
            {toast && (
                <div
                    className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"
                        } z-50 animate-slide-in max-w-[90%] sm:max-w-md`}
                >
                    <div
                        className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success"
                                ? "bg-main text-white"
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
                        <span className="font-semibold text-sm sm:text-base break-words">
                            {toast.message}
                        </span>
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-main to-main/80 px-6 pt-8 pb-20 relative">
                        <h2 className="text-white font-bold text-2xl text-center">
                            {t("profile.editProfile")}
                        </h2>
                    </div>

                    {/* Profile Image */}
                    <div className="relative -mt-16 px-6">
                        <div className="flex flex-col items-center mb-6">
                            <div
                                className="relative w-32 h-32 group cursor-pointer"
                                onClick={handleImageClick}
                            >
                                {imagePreview || profile?.image ? (
                                    <img
                                        src={imagePreview || profile.image}
                                        alt="profile"
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                                        <svg
                                            className="w-16 h-16 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-2">
                                {isRTL
                                    ? "اضغط على الصورة لتغييرها"
                                    : "Click on the image to change it"}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 pb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        {t("profile.name")}
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="border border-gray-300 py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        {t("profile.email")}
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled
                                        className="border border-gray-300 py-2.5 px-4 rounded-xl text-sm bg-gray-50 cursor-not-allowed text-gray-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        {t("profile.country")}
                                    </label>
                                    <CustomSelect
                                        options={countryOptions}
                                        value={formData.country_id}
                                        onChange={handleCountryChange}
                                        placeholder={isRTL ? "اختر الدولة" : "Select Country"}
                                        isRTL={isRTL}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        {t("profile.governorate")}
                                    </label>
                                    <CustomSelect
                                        options={governorateOptions}
                                        value={formData.governorate_id}
                                        onChange={handleGovernorateChange}
                                        placeholder={
                                            loadingGovernorates
                                                ? isRTL
                                                    ? "جاري التحميل..."
                                                    : "Loading..."
                                                : isRTL
                                                    ? "اختر المحافظة"
                                                    : "Select Governorate"
                                        }
                                        isRTL={isRTL}
                                        className={!formData.country_id || loadingGovernorates ? "opacity-50 pointer-events-none" : ""}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        {t("profile.password")}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={
                                            isRTL
                                                ? "كلمة المرور الجديدة"
                                                : "New password"
                                        }
                                        className="border border-gray-300 py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                                    </label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        placeholder={
                                            isRTL
                                                ? "أعد إدخال كلمة المرور"
                                                : "Re-enter password"
                                        }
                                        className="border border-gray-300 py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main transition"
                                    />
                                </div>
                            </div>

                            {formData.password && (
                                <p className="text-xs text-gray-500">
                                    {isRTL
                                        ? "اترك الحقول فارغة إذا لم ترد تغيير كلمة المرور"
                                        : "Leave fields blank if you don't want to change password"}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full cursor-pointer bg-main text-white py-3 rounded-xl font-medium hover:bg-main/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t("profile.loading")}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {t("profile.saveChanges")}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;