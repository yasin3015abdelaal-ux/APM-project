import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import { Upload } from "lucide-react";
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

        if (!files.idCardFront || !files.idCardBack || !files.selfie || !files.commercialRegistration || !files.taxNumberDocument) {
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
            formData.append("commercial_registration", files.commercialRegistration);
            formData.append("tax_number_document", files.taxNumberDocument);

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

    return (
        <>
            <div dir={dir} className="min-h-screen flex flex-col items-center py-6">
                {toast && (
                    <div
                        className={`fixed top-4 sm:top-5 ${
                            dir === "rtl" ? "left-4 sm:left-5" : "right-4 sm:right-5"
                        } z-50 animate-slide-in max-w-[90%] sm:max-w-md`}
                    >
                        <div
                            className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${
                                toast.type === "success"
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
                    {t("profile.verificationTitle")}
                </h2>

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

                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {profile.name}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="flex flex-col">
                                <label
                                    className={`text-sm font-bold mb-2 ${
                                        isRTL ? "text-right" : "text-left"
                                    }`}
                                >
                                    {t("profile.emailReadOnly")}
                                </label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    readOnly
                                    className={`border border-gray-300 py-2 px-3 rounded-md text-sm bg-gray-100 cursor-not-allowed ${
                                        isRTL ? "text-right" : "text-left"
                                    }`}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label
                                    className={`text-sm font-bold mb-2 ${
                                        isRTL ? "text-right" : "text-left"
                                    }`}
                                >
                                    {t("profile.phoneReadOnly")}
                                </label>
                                <input
                                    type="text"
                                    value={profile.phone}
                                    readOnly
                                    className={`border border-gray-300 py-2 px-3 rounded-md text-sm bg-gray-100 cursor-not-allowed ${
                                        isRTL ? "text-right" : "text-left"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* ID Card Front and Back */}
                        <div className="border-t pt-5">
                            <label
                                className={`text-sm font-bold mb-3 block ${
                                    isRTL ? "text-right" : "text-left"
                                }`}
                            >
                                {t("profile.id")}
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-main transition relative">
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
                                                    className="w-full h-32 object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleRemoveFile("idCardFront");
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-xs text-gray-500 text-center">
                                                    {t("profile.uploadIdFront")}
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <div>
                                    <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-main transition relative">
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
                                                    className="w-full h-32 object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleRemoveFile("idCardBack");
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-xs text-gray-500 text-center">
                                                    {t("profile.uploadIdBack")}
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Selfie / Personal Photo */}
                        <div className="border-t pt-5">
                            <label
                                className={`text-sm font-bold mb-3 block ${
                                    isRTL ? "text-right" : "text-left"
                                }`}
                            >
                                {t("profile.personalPhoto")}
                            </label>

                            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-main transition">
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
                                            className="w-40 h-40 object-cover rounded-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRemoveFile("selfie");
                                            }}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold text-xl cursor-pointer"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500 text-center">
                                            {t("profile.uploadPersonalPhoto")}
                                        </span>
                                    </>
                                )}
                            </label>
                        </div>

                        {/* Business Documents */}
                        <div className="border-t pt-5">
                            <label
                                className={`text-sm font-bold mb-3 block ${
                                    isRTL ? "text-right" : "text-left"
                                }`}
                            >
                                {t("profile.businessDocs")}
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-main transition relative">
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
                                                className="w-full h-32 object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveFile("commercialRegistration");
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500 text-center">
                                                {t("profile.uploadCommercialRecord")}
                                            </span>
                                        </>
                                    )}
                                </label>

                                <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-main transition relative">
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
                                                className="w-full h-32 object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveFile("taxNumberDocument");
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition shadow-lg font-bold cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500 text-center">
                                                {t("profile.uploadTaxCard")}
                                            </span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-main cursor-pointer text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 mt-6"
                        >
                            {submitting
                                ? t("profile.loading")
                                : t("profile.submitVerification")}
                        </button>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div
                        dir={dir}
                        className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center"
                    >
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-10 h-10 text-main"
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
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {t("profile.successModal.title")}
                            </h3>
                            <p className="text-gray-600">
                                {t("profile.successModal.message")}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-main cursor-pointer text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
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