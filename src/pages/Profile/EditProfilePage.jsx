import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const EditProfilePage = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        country: "",
        governorate: "",
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

            const lang = i18n.language;

            setProfile(userData);
            setFormData({
                name: userData.name || "",
                email: userData.email || "",
                country:
                    lang === "ar"
                        ? userData.country?.name_ar || userData.country_name || ""
                        : userData.country?.name_en || userData.country_name || "",
                governorate:
                    lang === "ar"
                        ? userData.governorate?.name_ar || ""
                        : userData.governorate?.name_en || "",
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
}, [t, i18n.language]);


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updateData = {
                name: formData.name,
            };
            
            if (formData.password) {
                updateData.password = formData.password;
            }

            // await userAPI.put("/profile", updateData);
            showToast(isRTL ? "تم حفظ التعديلات بنجاح" : "Changes saved successfully");
            navigate("/profile");
        } catch (err) {
            console.error("Error updating profile:", err);
            showToast(isRTL ? "حدث خطأ أثناء حفظ التعديلات" : "An error occurred while saving changes",error);
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
        <div dir={dir} className="min-h-screen flex flex-col items-center">
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
            <h2 className="text-main font-black text-2xl mb-6">{t("profile.editProfile")}</h2>

            <div className="p-6 w-full max-w-xl">
                <div className="relative w-28 h-28 mx-auto mb-6">
                    <img
                        src={profile.profile_image}
                        alt="profile"
                        className="w-28 h-28 rounded-full border-2 border-main object-cover"
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col">
                        <label className={`text-sm font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t("profile.name")}
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? 'text-right' : 'text-left'}`}
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-sm font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t("profile.email")}
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main  ${isRTL ? 'text-right' : 'text-left'}`}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-sm font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t("profile.country")}
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? 'text-right' : 'text-left'}`}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-sm font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t("profile.governorate")}
                        </label>
                        <input
                            type="text"
                            name="governorate"
                            value={formData.governorate}
                            onChange={handleChange}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? 'text-right' : 'text-left'}`}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-sm font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t("profile.password")}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={isRTL ? "اتركه فارغاً إذا لم ترد تغيير كلمة المرور" : "Leave blank if you don't want to change password"}
                            className={`border border-gray-300 py-2 px-3 rounded-md text-sm focus:outline-none focus:border-main ${isRTL ? 'text-right' : 'text-left'}`}
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