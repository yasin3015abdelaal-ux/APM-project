import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import { CheckCircle2 } from "lucide-react";
import Loader from "../../components/Ui/Loader/Loader";

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userAPI.get("/profile");
                const userData = res.data.data.user;
                setProfile(userData);
                console.log("res ::", userData);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(t("profile.error"));
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [t, i18n.language]);

    if (loading) return <Loader />;

    if (error)
        return (
            <div className="flex items-center justify-center h-screen text-red-500 font-semibold">
                {error}
            </div>
        );

    const lang = i18n.language;

    return (
        <div dir={dir} className="min-h-screen flex flex-col items-center py-6">
            <h2 className="text-main font-black text-2xl">{t("profile.title")}</h2>

            <div className="p-6 w-full max-w-xl text-center">
                <div className="relative w-28 h-28 mx-auto mb-4">
                    {profile?.image ? (
                        <img
                            src={profile.image}
                            alt="profile"
                            className="w-28 h-28 rounded-full border-2 border-main object-cover"
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-full border-2 border-main bg-gray-100 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1">{profile.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{profile.email}</p>

                <div className="grid grid-cols-2 gap-3 text-right" dir={dir}>
                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}
                        >
                            {t("profile.phone")}
                        </label>
                        <div className="border border-gray-300 bg-gray-100 py-2 px-3 rounded-md text-sm text-gray-700 text-start">
                            {profile.phone || "-"}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}
                        >
                            {t("profile.email")}
                        </label>
                        <div className="border border-gray-300 bg-gray-100 py-2 px-3 rounded-md text-sm text-gray-700 text-start">
                            {profile.email || "-"}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}
                        >
                            {t("profile.country")}
                        </label>
                        <div className="border border-gray-300 bg-gray-100 py-2 px-3 rounded-md text-sm text-gray-700 text-start">
                            {lang === "ar"
                                ? profile.country?.name_ar || profile.country_name || "-"
                                : profile.country?.name_en || profile.country_name || "-"}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label
                            className={`text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}
                        >
                            {t("profile.governorate")}
                        </label>
                        <div className="border border-gray-300 bg-gray-100 py-2 px-3 rounded-md text-sm text-gray-700 text-start">
                            {lang === "ar"
                                ? profile.governorate?.name_ar || "-"
                                : profile.governorate?.name_en || "-"}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="mt-6 border w-[60%] border-gray-200 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2 text-main">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold leading-relaxed">
                            {t("profile.verificationInfo")}
                        </p>
                        <button
                            onClick={() => navigate("/profile/verify")}
                            className="mt-3 cursor-pointer bg-main text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                        >
                            {t("profile.verifyAccount")}
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/profile/edit")}
                    className="mt-6 cursor-pointer bg-main text-white w-full py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                    {t("profile.editProfile")}
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;