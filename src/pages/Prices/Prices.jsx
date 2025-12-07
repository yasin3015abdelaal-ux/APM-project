import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect";

const Prices = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [loading, setLoading] = useState(false);
    const [governorates, setGovernorates] = useState([]);
    const [toast, setToast] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    
    const [form, setForm] = useState({
        governorate_id: "",
        cow_net: "",
        cow_standing: "",
        sheep_net: "",
        sheep_standing: "",
        camel_net: "",
        camel_standing: "",
    });

    useEffect(() => {
        const fetchGov = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("userData"));
                const country_id = userData?.country?.id;
                const res = await userAPI.get(`/governorates?country_id=${country_id}`);
                setGovernorates(res.data?.data?.governorates || []);
            } catch (err) {
                console.log(err);
                showToast(isRTL ? "فشل في تحميل المحافظات" : "Failed to load governorates", "error");
            }
        };
        fetchGov();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGovernorateChange = (value) => {
        setForm({ ...form, governorate_id: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.governorate_id) {
            showToast(isRTL ? "يرجى اختيار المحافظة" : "Please select governorate", "error");
            return;
        }

        if (!agreedToTerms) {
            showToast(isRTL ? "يجب الموافقة على الشروط للمتابعة" : "You must agree to the terms to continue", "error");
            return;
        }

        setLoading(true);
        try {
            await userAPI.post("/livestock-prices", {
                governorate_id: Number(form.governorate_id),
                cow: {
                    net_price: Number(form.cow_net),
                    standing_price: Number(form.cow_standing),
                },
                sheep: {
                    net_price: Number(form.sheep_net),
                    standing_price: Number(form.sheep_standing),
                },
                camel: {
                    net_price: Number(form.camel_net),
                    standing_price: Number(form.camel_standing),
                },
            });

            showToast(isRTL ? "تم إرسال الأسعار بنجاح!" : "Prices submitted successfully!", "success");
            setForm({
                governorate_id: "",
                cow_net: "",
                cow_standing: "",
                sheep_net: "",
                sheep_standing: "",
                camel_net: "",
                camel_standing: "",
            });
            setAgreedToTerms(false);
        } catch (err) {
            showToast(isRTL ? "حدث خطأ أثناء إرسال الأسعار" : "Error submitting prices", "error");
        }
        setLoading(false);
    };

    if (loading) {
        return <Loader />;
    }

    const governorateOptions = [
        { value: "", label: t("prices.selectGovernorate") },
        ...governorates.map(gov => ({
            value: gov.id.toString(),
            label: isRTL ? gov.name_ar : gov.name_en
        }))
    ];

    return (
        <div className={`w-full max-w-5xl mx-auto bg-white ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
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

            <div className="text-main text-center py-4 rounded-t-lg">
                <h1 className="text-3xl font-bold">{t("prices.submitPrices")}</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Governorate Selection with CustomSelect */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {t("prices.governorate")}
                    </label>
                    <CustomSelect
                        options={governorateOptions}
                        value={form.governorate_id}
                        onChange={handleGovernorateChange}
                        placeholder={t("prices.selectGovernorate")}
                        isRTL={isRTL}
                        className="w-full"
                    />
                </div>

                {/* Cow Prices */}
                <fieldset className="p-6 rounded-lg border-2 border-gray-300">
                    <legend className="px-3 text-main font-semibold text-lg bg-white">
                        {t("prices.cowPrices")}
                    </legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                {t("prices.netPrice")}
                            </label>
                            <input
                                type="number"
                                name="cow_net"
                                value={form.cow_net}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                {t("prices.standingPrice")}
                            </label>
                            <input
                                type="number"
                                name="cow_standing"
                                value={form.cow_standing}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Sheep Prices */}
                <fieldset className="p-6 rounded-lg border-2 border-gray-300">
                    <legend className="px-3 text-main font-semibold text-lg bg-white">
                        {t("prices.sheepPrices")}
                    </legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                {t("prices.netPrice")}
                            </label>
                            <input
                                type="number"
                                name="sheep_net"
                                value={form.sheep_net}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                {t("prices.standingPrice")}
                            </label>
                            <input
                                type="number"
                                name="sheep_standing"
                                value={form.sheep_standing}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Camel Prices */}
                <fieldset className="p-6 rounded-lg border-2 border-gray-300">
                    <legend className="px-3 text-main font-semibold text-lg bg-white">
                        {t("prices.camelPrices")}
                    </legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                {t("prices.netPrice")}
                            </label>
                            <input
                                type="number"
                                name="camel_net"
                                value={form.camel_net}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                {t("prices.standingPrice")}
                            </label>
                            <input
                                type="number"
                                name="camel_standing"
                                value={form.camel_standing}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Terms Checkbox */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                        <span className="text-red-900 font-semibold text-sm">
                            {isRTL 
                                ? "هذا السعر على مسؤوليتي الشخصية وفي حالة وجود أي خطأ أو تلاعب بالأسعار أكون أنا المسؤول عنه"
                                : "This price is my personal responsibility and in case of any error or manipulation of prices, I am responsible for it"}
                        </span>
                    </label>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading || !agreedToTerms}
                        className="w-full cursor-pointer bg-main hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                    >
                        {loading ? (isRTL ? "جاري الإرسال..." : "Submitting...") : t("prices.submit")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Prices;