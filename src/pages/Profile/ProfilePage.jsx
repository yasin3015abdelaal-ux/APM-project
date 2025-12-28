import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import { VerifiedIcon, Trash2, Edit2, MapPin, Mail, Phone, AlertCircle, Clock } from "lucide-react";
import Loader from "../../components/Ui/Loader/Loader";

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await userAPI.delete('/profile/delete-account');

            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");

            alert(t("profile.accountDeleted"));

            window.location.href = "/";
        } catch (err) {
            console.error("Error deleting account:", err);
            alert(t("profile.deleteError"));
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return <Loader />;

    if (error)
        return (
            <div className="flex items-center justify-center h-screen text-red-500 font-semibold">
                {error}
            </div>
        );

    const lang = i18n.language;
    const trustStatus = profile?.trust_status;
    const isVerified = trustStatus === "active";

    return (
        <div dir={dir} className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-main to-main/80 px-6 pt-8 pb-20 relative">
                        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                            {isVerified && (
                                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <VerifiedIcon className="w-4 h-4 text-white" />
                                    <span className="text-xs text-white font-medium">
                                        {isRTL ? "حساب موثق" : "Verified Account"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative -mt-16 px-6">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                {profile?.image ? (
                                    <img
                                        src={profile.image}
                                        alt="profile"
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                                {isVerified && (
                                    <div className="absolute bottom-0 right-0 bg-main rounded-full p-1.5 border-4 border-white shadow-lg">
                                        <VerifiedIcon className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center mt-4 mb-6">
                                <div className="flex items-center justify-center gap-2">
                                    <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
                                    {isVerified && (
                                        <VerifiedIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="bg-white p-2 rounded-lg">
                                    <Phone className="w-4 h-4 text-main" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 mb-0.5">{t("profile.phone")}</p>
                                    <p className="text-sm font-medium text-gray-900">{profile.phone || "-"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="bg-white p-2 rounded-lg">
                                    <Mail className="w-4 h-4 text-main" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 mb-0.5">{t("profile.email")}</p>
                                    <p className="text-sm font-medium text-gray-900 break-all">{profile.email || "-"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                                    <div className="bg-white p-2 rounded-lg">
                                        <MapPin className="w-4 h-4 text-main" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-0.5">{t("profile.country")}</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {lang === "ar"
                                                ? profile.country?.name_ar || profile.country_name || "-"
                                                : profile.country?.name_en || profile.country_name || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                                    <div className="bg-white p-2 rounded-lg">
                                        <MapPin className="w-4 h-4 text-main" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-0.5">{t("profile.governorate")}</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {lang === "ar"
                                                ? profile.governorate?.name_ar || "-"
                                                : profile.governorate?.name_en || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {trustStatus === "inactive" && (
                            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <VerifiedIcon className="w-5 h-5 text-main" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            {t("profile.verificationInfo")}
                                        </p>
                                        <button
                                            onClick={() => navigate("/profile/verify")}
                                            className="text-sm cursor-pointer text-main font-medium hover:underline"
                                        >
                                            {t("profile.verifyAccount")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {trustStatus === "pending" && (
                            <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            {isRTL ? "طلب التوثيق قيد المراجعة" : "Verification Under Review"}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {isRTL
                                                ? "تم استلام طلب التوثيق الخاص بك وهو قيد المراجعة. سنقوم بإشعارك فور اكتمال المراجعة."
                                                : "Your verification request has been received and is under review. We'll notify you once completed."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pb-6">
                            <button
                                onClick={() => navigate("/profile/edit")}
                                className="flex-1 bg-main cursor-pointer text-white py-3 rounded-xl font-medium hover:bg-main/90 transition flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                {t("profile.editProfile")}
                            </button>

                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex-1 bg-red-500 cursor-pointer text-white py-3 rounded-xl font-medium hover:bg-red-600 transition flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t("profile.deleteAccount")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" dir={dir}>
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-red-100 rounded-full p-4">
                                <Trash2 className="w-7 h-7 text-red-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            {t("profile.deleteAccountTitle")}
                        </h3>

                        <p className="text-gray-600 text-sm mb-6 text-center leading-relaxed">
                            {t("profile.deleteAccountWarning")}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 cursor-pointer px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t("profile.cancel")}
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 cursor-pointer px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t("profile.deleting")}
                                    </>
                                ) : (
                                    <>
                                        {t("profile.confirmDelete")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;