import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import { Upload, AlertCircle, Clock, CheckCircle, VerifiedIcon } from "lucide-react";
import Loader from "../../components/Ui/Loader/Loader";

const VerifyAccountPage = () => {
    const { t, i18n } = useTranslation();
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [toast, setToast] = useState(null);

    const [files, setFiles] = useState({
        idCardFront: null,
        idCardBack: null,
        selfie: null,
        commercialRegistration: null,
        taxNumberDocument: null,
    });

    const [previews, setPreviews] = useState({
        idCardFront: null,
        idCardBack: null,
        selfie: null,
        commercialRegistration: null,
        taxNumberDocument: null,
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userAPI.get("/profile");
                setProfile(res.data.data.user);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(t("profile.error"));
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [t]);

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFiles({
                ...files,
                [fieldName]: file,
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews({
                    ...previews,
                    [fieldName]: reader.result,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveFile = (fieldName) => {
        setFiles({
            ...files,
            [fieldName]: null,
        });
        setPreviews({
            ...previews,
            [fieldName]: null,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isOrganization = profile?.type === "organization";
        const requiredPersonalDocs = !files.idCardFront || !files.idCardBack || !files.selfie;
        const requiredBusinessDocs = isOrganization && (!files.commercialRegistration || !files.taxNumberDocument);

        if (requiredPersonalDocs || requiredBusinessDocs) {
            showToast(
                isRTL
                    ? "يرجى رفع جميع الصور المطلوبة"
                    : "Please upload all required images",
                "error"
            );
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("id_card_front", files.idCardFront);
            formData.append("id_card_back", files.idCardBack);
            formData.append("selfie", files.selfie);
            
            if (isOrganization) {
                formData.append("commercial_registration", files.commercialRegistration);
                formData.append("tax_number_document", files.taxNumberDocument);
            }

            await userAPI.post("/verification/submit", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setShowSuccessModal(true);
        } catch (err) {
            console.error("Error submitting verification:", err);
            showToast(
                isRTL
                    ? "حدث خطأ أثناء إرسال الطلب"
                    : "An error occurred while submitting the request",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader />;

    if (error)
        return (
            <div className="flex items-center justify-center h-screen text-red-500 font-semibold">
                {error}
            </div>
        );

    const trustStatus = profile?.trust_status;
    const isOrganization = profile?.type === "organization";

    if (trustStatus === "active") {
        navigate("/profile");
        return null;
    }

    if (trustStatus === "pending") {
        return (
            <div dir={dir} className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex flex-col items-center justify-center py-6 px-4">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-yellow-100">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Clock className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
                        {isRTL ? "طلب التوثيق قيد المراجعة" : "Verification Under Review"}
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                        {isRTL
                            ? "تم استلام طلب توثيق حسابك وهو قيد المراجعة حالياً. سنقوم بإشعارك فور اكتمال عملية المراجعة."
                            : "Your account verification request has been received and is currently under review. We will notify you once the review process is complete."}
                    </p>
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-full bg-gradient-to-r from-main to-green-600 cursor-pointer text-white py-4 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        {isRTL ? "العودة إلى الملف الشخصي" : "Back to Profile"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div dir={dir} className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
                {toast && (
                    <div
                        className={`fixed top-6 ${
                            dir === "rtl" ? "left-6" : "right-6"
                        } z-50 animate-slide-in max-w-md`}
                    >
                        <div
                            className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm ${
                                toast.type === "success"
                                    ? "bg-gradient-to-r from-main to-green-600 text-white"
                                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                            }`}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-base">
                                {toast.message}
                            </span>
                        </div>
                    </div>
                )}

                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-black bg-gradient-to-r from-main to-green-600 bg-clip-text text-transparent mb-2">
                            {t("profile.verificationTitle")}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {isRTL ? "أكمل بياناتك للتوثيق" : "Complete your information for verification"}
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                        <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-100">
                            <div className="relative w-28 h-28 mb-4">
                                {profile?.image ? (
                                    <img
                                        src={profile.image}
                                        alt="profile"
                                        className="w-28 h-28 rounded-full border-4 border-main object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-full border-4 border-main bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-lg">
                                        <svg className="w-16 h-16 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {profile.name}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col">
                                    <label className={`text-sm font-bold mb-2 text-gray-700 ${isRTL ? "text-right" : "text-left"}`}>
                                        {t("profile.emailReadOnly")}
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        readOnly
                                        className={`border-2 border-gray-200 py-3 px-4 rounded-xl text-sm bg-gray-50 cursor-not-allowed ${isRTL ? "text-right" : "text-left"}`}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className={`text-sm font-bold mb-2 text-gray-700 ${isRTL ? "text-right" : "text-left"}`}>
                                        {t("profile.phoneReadOnly")}
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        readOnly
                                        className={`border-2 border-gray-200 py-3 px-4 rounded-xl text-sm bg-gray-50 cursor-not-allowed ${isRTL ? "text-right" : "text-left"}`}
                                    />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
                                <label className={`text-base font-bold mb-4 block text-gray-800 ${isRTL ? "text-right" : "text-left"}`}>
                                    {t("profile.id")}
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-main hover:bg-green-50 transition-all duration-300 relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, "idCardFront")}
                                                className="hidden"
                                            />
                                            {previews.idCardFront ? (
                                                <div className="relative w-full">
                                                    <img
                                                        src={previews.idCardFront}
                                                        alt="ID Front"
                                                        className="w-full h-32 object-cover rounded-lg shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRemoveFile("idCardFront");
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-main transition-colors" />
                                                    <span className="text-xs text-gray-600 text-center font-medium">
                                                        {t("profile.uploadIdFront")}
                                                    </span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <div>
                                        <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-main hover:bg-green-50 transition-all duration-300 relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, "idCardBack")}
                                                className="hidden"
                                            />
                                            {previews.idCardBack ? (
                                                <div className="relative w-full">
                                                    <img
                                                        src={previews.idCardBack}
                                                        alt="ID Back"
                                                        className="w-full h-32 object-cover rounded-lg shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRemoveFile("idCardBack");
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-main transition-colors" />
                                                    <span className="text-xs text-gray-600 text-center font-medium">
                                                        {t("profile.uploadIdBack")}
                                                    </span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
                                <label className={`text-base font-bold mb-4 block text-gray-800 ${isRTL ? "text-right" : "text-left"}`}>
                                    {t("profile.personalPhoto")}
                                </label>

                                <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-main hover:bg-green-50 transition-all duration-300 group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, "selfie")}
                                        className="hidden"
                                    />
                                    {previews.selfie ? (
                                        <div className="relative">
                                            <img
                                                src={previews.selfie}
                                                alt="Personal"
                                                className="w-40 h-40 object-cover rounded-full shadow-xl border-4 border-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveFile("selfie");
                                                }}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold text-xl cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-gray-400 mb-3 group-hover:text-main transition-colors" />
                                            <span className="text-sm text-gray-600 text-center font-medium">
                                                {t("profile.uploadPersonalPhoto")}
                                            </span>
                                        </>
                                    )}
                                </label>
                            </div>

                            {isOrganization && (
                                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
                                    <label className={`text-base font-bold mb-4 block text-gray-800 ${isRTL ? "text-right" : "text-left"}`}>
                                        {t("profile.businessDocs")}
                                    </label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-main hover:bg-green-50 transition-all duration-300 relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, "commercialRegistration")}
                                                className="hidden"
                                            />
                                            {previews.commercialRegistration ? (
                                                <div className="relative w-full">
                                                    <img
                                                        src={previews.commercialRegistration}
                                                        alt="Commercial Registration"
                                                        className="w-full h-32 object-cover rounded-lg shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRemoveFile("commercialRegistration");
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-main transition-colors" />
                                                    <span className="text-xs text-gray-600 text-center font-medium">
                                                        {t("profile.uploadCommercialRecord")}
                                                    </span>
                                                </>
                                            )}
                                        </label>

                                        <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-main hover:bg-green-50 transition-all duration-300 relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, "taxNumberDocument")}
                                                className="hidden"
                                            />
                                            {previews.taxNumberDocument ? (
                                                <div className="relative w-full">
                                                    <img
                                                        src={previews.taxNumberDocument}
                                                        alt="Tax Number Document"
                                                        className="w-full h-32 object-cover rounded-lg shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRemoveFile("taxNumberDocument");
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-main transition-colors" />
                                                    <span className="text-xs text-gray-600 text-center font-medium">
                                                        {t("profile.uploadTaxCard")}
                                                    </span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-main to-green-600 cursor-pointer text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                            >
                                <VerifiedIcon className="w-5 h-5 inline-block mr-2 mb-1" /> {" "}
                                {submitting
                                    ? t("profile.loading")
                                    : t("profile.submitVerification")}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div
                        dir={dir}
                        className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl animate-scale-in"
                    >
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <CheckCircle className="w-12 h-12 text-main" />
                            </div>
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-main to-green-600 bg-clip-text text-transparent mb-3">
                                {t("profile.successModal.title")}
                            </h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {t("profile.successModal.message")}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-gradient-to-r from-main to-green-600 cursor-pointer text-white py-4 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                            {t("profile.successModal.backToHome")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default VerifyAccountPage;