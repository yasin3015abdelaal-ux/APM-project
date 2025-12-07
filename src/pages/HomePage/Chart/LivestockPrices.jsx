import { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Calendar, MapPin, Package } from "lucide-react";
import { getCachedGovernorates, getCachedLivestockPrices, userAPI } from "../../../api";
import { useTranslation } from "react-i18next";
import Loader from "../../../components/Ui/Loader/Loader";

const LivestockPrices = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const [selectedProduct, setSelectedProduct] = useState("cow");
    const [selectedGovernorate, setSelectedGovernorate] = useState(null);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [pricesData, setPricesData] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        net: true,
        standing: true,
    });

    const productTypes = [
        { value: "cow", label_ar: "بقر", label_en: "Cow" },
        { value: "sheep", label_ar: "غنم", label_en: "Sheep" },
        { value: "camel", label_ar: "إبل", label_en: "Camel" },
    ];

    const monthsArabic = {
        1: "يناير",
        2: "فبراير",
        3: "مارس",
        4: "أبريل",
        5: "مايو",
        6: "يونيو",
        7: "يوليو",
        8: "أغسطس",
        9: "سبتمبر",
        10: "أكتوبر",
        11: "نوفمبر",
        12: "ديسمبر",
    };

    const monthsEnglish = {
        1: "Jan",
        2: "Feb",
        3: "Mar",
        4: "Apr",
        5: "May",
        6: "Jun",
        7: "Jul",
        8: "Aug",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Dec",
    };

    useEffect(() => {
        fetchGovernorates();
    }, []);

    useEffect(() => {
        if (selectedGovernorate) {
            fetchPrices();
        }
    }, [selectedProduct, selectedGovernorate, selectedYear]);

    const fetchGovernorates = async () => {
        try {
            const { data, fromCache } = await getCachedGovernorates(1);
            console.log(fromCache ? '📦 Governorates من الكاش' : '🌐 Governorates من API');

            setGovernorates(data);
            if (data.length > 0) {
                setSelectedGovernorate(data[0].id);
            }
        } catch (err) {
            console.error("Error fetching governorates:", err);
        }
    };

    const fetchPrices = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, fromCache } = await getCachedLivestockPrices({
                product_type: selectedProduct,
                governorate_id: selectedGovernorate,
                year: selectedYear,
            });

            console.log(fromCache ? '📦 Livestock prices من الكاش' : '🌐 Livestock prices من API');

            if (data.success && data.data && data.data.data) {
                const formattedData = data.data.data
                    .map((item) => {
                        const netPrice = item.average_net_price
                            ? parseFloat(item.average_net_price)
                            : null;
                        const standingPrice = item.average_standing_price
                            ? parseFloat(item.average_standing_price)
                            : null;

                        return {
                            month: isRTL
                                ? monthsArabic[item.month] || item.month_name
                                : monthsEnglish[item.month] || item.month_name,
                            monthNumber: item.month,
                            net: netPrice,
                            standing: standingPrice,
                            entries_count: item.entries_count,
                        };
                    })
                    .sort((a, b) => a.monthNumber - b.monthNumber);

                setPricesData(formattedData);
                setMeta(data.data.meta);
            } else {
                setPricesData([]);
                setMeta(null);
            }
        } catch (err) {
            setError(isRTL ? "حدث خطأ أثناء تحميل البيانات" : "Error loading data");
            console.error("Error fetching prices:", err);
            setPricesData([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleFilter = (filterName) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterName]: !prev[filterName],
        }));
    };

    const FilterButton = ({ name, label_ar, label_en, activeColor }) => (
        <button
            onClick={() => toggleFilter(name)}
            className={`px-4 py-2 rounded-lg cursor-pointer text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${activeFilters[name] ? `${activeColor}` : "bg-gray-400 opacity-60"
                }`}
        >
            {activeFilters[name] ? "✓" : "○"} {isRTL ? label_ar : label_en}
        </button>
    );

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200">
                    <p className="font-bold text-gray-800 mb-1 text-sm">
                        {payload[0].payload.month}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                        {isRTL ? "عدد الإدخالات" : "Entries"}:{" "}
                        {payload[0].payload.entries_count}
                    </p>
                    {payload.map(
                        (entry, index) =>
                            entry.value !== null && (
                                <p
                                    key={index}
                                    className="text-sm font-semibold"
                                    style={{ color: entry.color }}
                                >
                                    <span>{entry.name}:</span> {entry.value.toFixed(2)}{" "}
                                    {isRTL ? "ج.م/كجم" : "EGP/kg"}
                                </p>
                            )
                    )}
                </div>
            );
        }
        return null;
    };

    const calculateStats = () => {
        if (pricesData.length === 0) return null;

        const latestData = pricesData[pricesData.length - 1];

        return {
            latest: latestData,
            minPrice: meta?.min_price ? parseFloat(meta.min_price).toFixed(2) : null,
            maxPrice: meta?.max_price ? parseFloat(meta.max_price).toFixed(2) : null,
        };
    };

    const stats = calculateStats();

    if (loading && !pricesData.length) {
        return <Loader />;
    }

    return (
        <div className="p-4 md:p-6" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-main">
                        {isRTL ? "الأسعار" : "Prices"}
                    </h1>
                </div>
                {/* Selection */}
                <div className="flex gap-2 mb-4 overflow-x-auto md:grid md:grid-cols-3 md:gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-2 md:p-4 border border-gray-100 flex-1 min-w-[110px] md:min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-3">
                            <Package className="w-3 h-3 md:w-4 md:h-4 text-main" />
                            <label className="text-[10px] md:text-sm font-bold text-gray-700">
                                {isRTL ? "نوع المنتج" : "Product Type"}
                            </label>
                        </div>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full px-1.5 py-1 md:px-3 md:py-2 cursor-pointer border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-main text-[10px] md:text-sm font-semibold text-gray-700 bg-gray-50"
                        >
                            {productTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {isRTL ? type.label_ar : type.label_en}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-2 md:p-4 border border-gray-100 flex-1 min-w-[110px] md:min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-3">
                            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-main" />
                            <label className="text-[10px] md:text-sm font-bold text-gray-700">
                                {isRTL ? "المحافظة" : "Governorate"}
                            </label>
                        </div>
                        <select
                            value={selectedGovernorate || ""}
                            onChange={(e) => setSelectedGovernorate(Number(e.target.value))}
                            className="w-full px-1.5 py-1 md:px-3 md:py-2 cursor-pointer border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-main text-[10px] md:text-sm font-semibold text-gray-700 bg-gray-50"
                        >
                            {governorates.map((gov) => (
                                <option key={gov.id} value={gov.id}>
                                    {isRTL ? gov.name_ar : gov.name_en}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-2 md:p-4 border border-gray-100 flex-1 min-w-[90px] md:min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-3">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 text-main" />
                            <label className="text-[10px] md:text-sm font-bold text-gray-700">
                                {isRTL ? "السنة" : "Year"}
                            </label>
                        </div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-1.5 py-1 md:px-3 md:py-2 cursor-pointer border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-main text-[10px] md:text-sm font-semibold text-gray-700 bg-gray-50"
                        >
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                            <option value={2023}>2023</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                {stats && pricesData.length > 0 && (
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">                        {stats.latest.standing && (
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
                            <div className="text-xs font-semibold mb-1 opacity-90">
                                {isRTL ? "السعر القائم" : "Standing Price"}
                            </div>
                            <div className="text-2xl font-bold">
                                {stats.latest.standing.toFixed(2)} {isRTL ? "ج.م" : "EGP"}
                            </div>
                            <div className="text-xs mt-1 opacity-75">
                                {isRTL ? "للكيلوجرام" : "per kg"}
                            </div>
                        </div>
                    )}
                        {stats.latest.net && (
                            <div className="bg-gradient-to-br from-main to-main rounded-xl shadow-lg p-4 text-white">
                                <div className="text-xs font-semibold mb-1 opacity-90">
                                    {isRTL ? "السعر الصافي" : "Net Price"}
                                </div>
                                <div className="text-2xl font-bold">
                                    {stats.latest.net.toFixed(2)} {isRTL ? "ج.م" : "EGP"}
                                </div>
                                <div className="text-xs mt-1 opacity-75">
                                    {isRTL ? "للكيلوجرام" : "per kg"}
                                </div>
                            </div>
                        )}
                        {stats.minPrice && stats.maxPrice && (
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
                                <div className="text-xs font-semibold mb-1 opacity-90">
                                    {isRTL ? "نطاق الأسعار" : "Price Range"}
                                </div>
                                <div className="text-xl font-bold">
                                    {stats.minPrice} - {stats.maxPrice}
                                </div>
                                <div className="text-xs mt-1 opacity-75">
                                    {isRTL ? "ج.م/كجم" : "EGP/kg"}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Chart */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-main to-main mb-1 text-center">
                        {isRTL ? "أسعار" : "Prices of"}{" "}
                        {
                            productTypes.find((p) => p.value === selectedProduct)?.[
                            isRTL ? "label_ar" : "label_en"
                            ]
                        }
                    </h2>
                    <div className="text-center text-xs text-gray-500 font-semibold">
                        {isRTL ? "ج.م / كجم" : "EGP / kg"}
                    </div>
                </div>
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-100">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <FilterButton
                            name="standing"
                            label_ar="القائم"
                            label_en="Standing"
                            activeColor="bg-gradient-to-r from-red-500 to-red-600"
                        />
                        <FilterButton
                            name="net"
                            label_ar="الصافي"
                            label_en="Net"
                            activeColor="bg-gradient-to-r from-main to-main"
                        />
                    </div>
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-500 text-lg font-semibold mb-2">
                                {error}
                            </div>
                            <button
                                onClick={fetchPrices}
                                className="mt-3 px-5 py-2 cursor-pointer bg-main text-white rounded-lg hover:bg-main text-sm font-semibold"
                            >
                                {isRTL ? "إعادة المحاولة" : "Retry"}
                            </button>
                        </div>
                    ) : pricesData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-lg font-semibold">
                                {isRTL ? "لا توجد بيانات" : "No data available"}
                            </p>
                            <p className="text-xs mt-2">
                                {isRTL ? "اختر محافظة أخرى" : "Select another governorate"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="px-0 mt-2">

                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart
                                        data={pricesData}
                                        margin={{ top: 10, right: 40, left: 0, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fontWeight: 600, fill: "#6b7280" }}
                                            stroke="#6b7280"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fontWeight: 600, fill: "#6b7280" }}
                                            stroke="#6b7280"
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
                                            iconType="line"
                                        />

                                        {activeFilters.standing && (
                                            <Line
                                                type="monotone"
                                                dataKey="standing"
                                                stroke="#ef4444"
                                                strokeWidth={2.5}
                                                name={isRTL ? "القائم" : "Standing"}
                                                dot={{
                                                    fill: "#ef4444",
                                                    r: 4,
                                                    strokeWidth: 2,
                                                    stroke: "#fff",
                                                }}
                                                activeDot={{ r: 6 }}
                                                connectNulls
                                            />
                                        )}
                                        {activeFilters.net && (
                                            <Line
                                                type="monotone"
                                                dataKey="net"
                                                stroke="#22c55e"
                                                strokeWidth={2.5}
                                                name={isRTL ? "الصافي" : "Net"}
                                                dot={{
                                                    fill: "#22c55e",
                                                    r: 4,
                                                    strokeWidth: 2,
                                                    stroke: "#fff",
                                                }}
                                                activeDot={{ r: 6 }}
                                                connectNulls
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivestockPrices;
