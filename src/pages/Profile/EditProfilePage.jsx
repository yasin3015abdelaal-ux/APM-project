import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI, dataAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

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

        if (name === "country_id" && value) {
            fetchGovernorates(value);
            setFormData((prev) => ({
                ...prev,
                country_id: value,
                governorate_id: "",
            }));
        }
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
        setSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name);

            if (formData.governorate_id) {
                formDataToSend.append("governorate_id", formData.governorate_id);
            }

            if (formData.password) {
                formDataToSend.append("password", formData.password);
            }

            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            await userAPI.post("/profile", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            showToast(
                isRTL ? "تم حفظ التعديلات بنجاح" : "Changes saved successfully"
            );

            setTimeout(() => {
                navigate("/profile");
            }, 1500);
        } catch (err) {
            console.error("Error updating profile:", err);
            showToast(
                isRTL
                    ? "حدث خطأ أثناء حفظ التعديلات"
                    : "An error occurred while saving changes",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    if (error)
        return (
            <div className="flex items-center justify-center h-screen text-red-500 font-semibold">
                {error}
            </div>
        );

    return (
        <div dir={dir} className="min-h-screen flex flex-col items-center py-6">
            {toast && (
                <div
                    className={`fixed top-4 sm:top-5 ${dir === "rtl" ? "left-4 sm:left-5" : "right-4 sm:right-5"
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

            <h2 className="text-main font-black text-2xl">
                {t("profile.editProfile")}
            </h2>

            <div className="p-6 w-full max-w-xl">
                <div
                    className="relative w-28 h-28 mx-auto mb-6 group cursor-pointer"
                    onClick={handleImageClick}
                >
                    {imagePreview || profile?.image ? (
                        <img
                            src={imagePreview || profile.image}
                            alt="profile"
                            className="w-28 h-28 rounded-full border-2 border-main object-cover"
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
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
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </div>
                <p className="text-center text-xs text-gray-500">
                    {isRTL
                        ? "اضغط على الصورة لتغييرها"
                        : "Click on the image to change it"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            {t("profile.name")}
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? "text-right" : "text-left"
                                }`}
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            {t("profile.email")}
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none bg-gray-100 cursor-not-allowed ${isRTL ? "text-right" : "text-left"
                                }`}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            {t("profile.country")}
                        </label>
                        <select
                            name="country_id"
                            value={formData.country_id}
                            onChange={handleChange}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            <option value="">
                                {isRTL ? "اختر الدولة" : "Select Country"}
                            </option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {isRTL ? country.name_ar : country.name_en}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            {t("profile.governorate")}
                        </label>
                        <select
                            name="governorate_id"
                            value={formData.governorate_id}
                            onChange={handleChange}
                            disabled={!formData.country_id || loadingGovernorates}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main disabled:bg-gray-100 disabled:cursor-not-allowed ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            <option value="">
                                {loadingGovernorates
                                    ? isRTL
                                        ? "جاري التحميل..."
                                        : "Loading..."
                                    : isRTL
                                        ? "اختر المحافظة"
                                        : "Select Governorate"}
                            </option>
                            {governorates.map((gov) => (
                                <option key={gov.id} value={gov.id}>
                                    {isRTL ? gov.name_ar : gov.name_en}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"
                                }`}
                        >
                            {t("profile.password")}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={
                                isRTL
                                    ? "اتركه فارغاً إذا لم ترد تغيير كلمة المرور"
                                    : "Leave blank if you don't want to change password"
                            }
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? "text-right" : "text-left"
                                }`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-main text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {saving ? t("profile.loading") : t("profile.saveChanges")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
